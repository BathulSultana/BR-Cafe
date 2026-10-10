from collections import defaultdict
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import WasteLog, utcnow
from app.modules.waste_management.schemas import (
    ItemTotal,
    ReasonTotal,
    WasteIn,
    WasteSummary,
)

INSIGHT_BY_REASON = {
    "overproduction": "Overproduction is your biggest loss: batch smaller and cook closer to forecast demand.",
    "spoilage": "Spoilage dominates: tighten FIFO rotation and order smaller, more frequent deliveries.",
    "prep_error": "Prep errors dominate: review recipe cards and station training.",
    "returned": "Returned food dominates: check packaging, delivery time and quality for those items.",
    "expired": "Expired stock dominates: audit par levels and use-by dates at receiving.",
}


def log_waste(db: Session, data: WasteIn) -> WasteLog:
    entry = WasteLog(
        item=data.item.strip().lower(), quantity=data.quantity, unit=data.unit,
        reason=data.reason, cost=round(data.cost, 2), order_id=data.order_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def summarize(db: Session, days: int = 30, top: int = 5) -> WasteSummary:
    since = utcnow() - timedelta(days=days)
    rows = db.scalars(select(WasteLog).where(WasteLog.logged_at >= since)).all()

    total_cost = round(sum(r.cost for r in rows), 2)

    reasons: dict[str, list[float]] = defaultdict(lambda: [0, 0.0])
    items: dict[str, list[float]] = defaultdict(lambda: [0, 0.0, 0.0])
    for r in rows:
        reasons[r.reason][0] += 1
        reasons[r.reason][1] += r.cost
        items[r.item][0] += 1
        items[r.item][1] += r.quantity
        items[r.item][2] += r.cost

    by_reason = sorted(
        (ReasonTotal(reason=k, entries=int(v[0]), cost=round(v[1], 2),
                     share_of_cost=round(v[1] / total_cost, 3) if total_cost else 0.0)
         for k, v in reasons.items()),
        key=lambda x: x.cost, reverse=True,
    )
    top_items = sorted(
        (ItemTotal(item=k, entries=int(v[0]), quantity=round(v[1], 2), cost=round(v[2], 2))
         for k, v in items.items()),
        key=lambda x: x.cost, reverse=True,
    )[:top]

    insights: list[str] = []
    if by_reason and by_reason[0].share_of_cost >= 0.4:
        text = INSIGHT_BY_REASON.get(by_reason[0].reason)
        if text:
            insights.append(f"{by_reason[0].share_of_cost:.0%} of waste cost: {text}")
    if top_items:
        insights.append(f"Highest-cost item: {top_items[0].item} (₹{top_items[0].cost:.2f} over {days} days).")
    if not rows:
        insights.append("No waste logged in this period.")

    return WasteSummary(days=days, total_cost=total_cost, total_entries=len(rows),
                        by_reason=by_reason, top_items=top_items, insights=insights)
