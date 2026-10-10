from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import DEFAULT_PREP_MINUTES, DEFAULT_SLA_MINUTES
from app.models import Order, utcnow
from app.modules.order_sync.schemas import OrderSyncIn
from app.modules.service_ledger import service as ledger

VALID_TRANSITIONS = {
    "pending": {"preparing", "cancelled"},
    "preparing": {"ready", "cancelled"},
    "ready": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def sync_order(db: Session, data: OrderSyncIn) -> tuple[Order, bool]:
    """Idempotent upsert keyed on (source, external_id). Returns (order, created)."""
    existing = db.scalar(
        select(Order).where(Order.source == data.source, Order.external_id == data.external_id)
    )
    if existing:
        return existing, False

    items = [
        {
            "name": i.name,
            "qty": i.qty,
            "price": i.price,
            "prep_minutes": i.prep_minutes if i.prep_minutes is not None else DEFAULT_PREP_MINUTES,
        }
        for i in data.items
    ]
    total = data.total if data.total is not None else sum(i["qty"] * i["price"] for i in items)
    placed_at = data.placed_at or utcnow()
    sla = data.sla_minutes or DEFAULT_SLA_MINUTES

    order = Order(
        source=data.source,
        external_id=data.external_id,
        items=items,
        total=round(total, 2),
        placed_at=placed_at,
        promised_by=placed_at + timedelta(minutes=sla),
    )
    db.add(order)
    db.flush()  # need order.id for the ledger rows
    ledger.post_sale(db, order)
    db.commit()
    return order, True


def update_status(db: Session, order: Order, new_status: str) -> Order:
    if new_status == order.status:
        return order
    if new_status not in VALID_TRANSITIONS[order.status]:
        raise ValueError(f"Cannot move order from {order.status} to {new_status}")
    order.status = new_status
    if new_status == "cancelled":
        ledger.post_refund(db, order)
    db.commit()
    return order
