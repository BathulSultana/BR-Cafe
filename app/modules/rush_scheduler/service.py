import heapq
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import (
    DEFAULT_PREP_MINUTES,
    RUSH_PENDING_THRESHOLD,
    RUSH_WINDOW_MINUTES,
    STATIONS,
)
from app.models import Order, utcnow
from app.modules.rush_scheduler.schemas import RushStatus, ScheduledOrder, SchedulePlan

OPEN_STATUSES = ("pending", "preparing")


def order_prep_minutes(order: Order) -> float:
    """Total cook time for an order. Items cook in parallel on one station, so the
    longest item dominates; extra quantity adds a small batch penalty."""
    if not order.items:
        return DEFAULT_PREP_MINUTES
    longest = max(float(i.get("prep_minutes") or DEFAULT_PREP_MINUTES) for i in order.items)
    extra_units = sum(max(int(i.get("qty", 1)) - 1, 0) for i in order.items)
    return round(longest + 0.5 * extra_units, 1)


def rush_status(db: Session, now: datetime | None = None) -> RushStatus:
    now = now or utcnow()
    open_orders = db.scalar(
        select(func.count()).select_from(Order).where(Order.status.in_(OPEN_STATUSES))
    ) or 0
    recent = db.scalar(
        select(func.count()).select_from(Order).where(
            Order.status.in_(OPEN_STATUSES),
            Order.placed_at >= now - timedelta(minutes=RUSH_WINDOW_MINUTES),
        )
    ) or 0
    return RushStatus(
        is_rush=open_orders >= RUSH_PENDING_THRESHOLD,
        open_orders=open_orders,
        recent_orders=recent,
        threshold=RUSH_PENDING_THRESHOLD,
        window_minutes=RUSH_WINDOW_MINUTES,
    )


def build_plan(db: Session, stations: int = STATIONS, now: datetime | None = None) -> SchedulePlan:
    """Earliest-deadline-first onto the station that frees up soonest.

    Orders already being prepared keep their place; pending ones are sequenced behind
    them. Longer prep breaks ties so slow dishes start early.
    """
    now = now or utcnow()
    stations = max(1, stations)

    orders = db.scalars(select(Order).where(Order.status.in_(OPEN_STATUSES))).all()
    # in-progress first (they already occupy a station), then by deadline, then longest prep
    orders.sort(key=lambda o: (o.status != "preparing", o.promised_by, -order_prep_minutes(o)))

    free_at = [(now, s) for s in range(1, stations + 1)]
    heapq.heapify(free_at)

    plan: list[ScheduledOrder] = []
    for o in orders:
        station_free, station = heapq.heappop(free_at)
        start = max(station_free, now)
        prep = order_prep_minutes(o)
        finish = start + timedelta(minutes=prep)
        late = max((finish - o.promised_by).total_seconds() / 60, 0)
        slack = (o.promised_by - finish).total_seconds() / 60
        plan.append(ScheduledOrder(
            order_id=o.id, source=o.source, station=station,
            start_at=start, finish_at=finish, promised_by=o.promised_by,
            prep_minutes=prep, late_by_minutes=round(late, 1),
            at_risk=late > 0 or slack < 5,
        ))
        heapq.heappush(free_at, (finish, station))

    rush = rush_status(db, now)
    late_count = sum(1 for p in plan if p.late_by_minutes > 0)
    return SchedulePlan(
        generated_at=now, rush=rush, stations=stations, plan=plan,
        late_count=late_count, suggestions=_suggestions(rush, plan, late_count, stations),
    )


def _suggestions(rush: RushStatus, plan: list[ScheduledOrder], late: int, stations: int) -> list[str]:
    tips: list[str] = []
    if rush.is_rush:
        tips.append(
            f"Rush mode: {rush.open_orders} open orders (threshold {rush.threshold}). "
            "Pre-prep common items and pause new delivery-partner orders if you fall behind."
        )
    if late:
        worst = max(plan, key=lambda p: p.late_by_minutes)
        tips.append(
            f"{late} order(s) will miss their promised time (worst: order {worst.order_id}, "
            f"{worst.late_by_minutes} min late). Adding one station would likely help."
        )
    if not tips:
        tips.append("All open orders can be delivered on time with the current stations.")
    return tips
