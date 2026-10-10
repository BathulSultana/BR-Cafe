from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import COMMISSION_RATES, DEFAULT_COMMISSION
from app.models import LedgerEntry, Order
from app.modules.service_ledger.schemas import EntryIn, LedgerSummary, SourceSummary


def commission_rate(source: str) -> float:
    return COMMISSION_RATES.get(source, DEFAULT_COMMISSION)


def add_entry(db: Session, *, source: str, kind: str, amount: float,
              note: str = "", order_id: int | None = None) -> LedgerEntry:
    entry = LedgerEntry(source=source, kind=kind, amount=round(amount, 2),
                        note=note, order_id=order_id)
    db.add(entry)
    return entry


def post_sale(db: Session, order: Order) -> None:
    """Called by order_sync when a new order lands: books the sale and the channel commission."""
    add_entry(db, source=order.source, kind="sale", amount=order.total,
              note=f"Order {order.external_id}", order_id=order.id)
    fee = order.total * commission_rate(order.source)
    if fee:
        add_entry(db, source=order.source, kind="commission", amount=-fee,
                  note=f"{commission_rate(order.source):.0%} commission", order_id=order.id)


def post_refund(db: Session, order: Order) -> bool:
    """Reverse a sale (and its commission) once. Returns False if already refunded."""
    already = db.scalar(
        select(LedgerEntry.id).where(LedgerEntry.order_id == order.id, LedgerEntry.kind == "refund")
    )
    if already:
        return False
    add_entry(db, source=order.source, kind="refund", amount=-order.total,
              note=f"Cancelled {order.external_id}", order_id=order.id)
    fee = order.total * commission_rate(order.source)
    if fee:
        # platform returns its commission on a cancelled order
        add_entry(db, source=order.source, kind="adjustment", amount=fee,
                  note="Commission reversed on cancellation", order_id=order.id)
    return True


def add_manual_entry(db: Session, data: EntryIn) -> LedgerEntry:
    entry = add_entry(db, source=data.source.strip().lower(), kind=data.kind,
                      amount=data.amount, note=data.note, order_id=data.order_id)
    db.commit()
    db.refresh(entry)
    return entry


def summarize(db: Session) -> LedgerSummary:
    buckets: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for e in db.scalars(select(LedgerEntry)):
        buckets[e.source][e.kind] += e.amount

    rows: list[SourceSummary] = []
    for source, k in sorted(buckets.items()):
        net = k["sale"] + k["commission"] + k["refund"] + k["adjustment"]
        rows.append(SourceSummary(
            source=source,
            gross_sales=round(k["sale"], 2),
            commission=round(k["commission"], 2),
            refunds=round(k["refund"], 2),
            payouts=round(k["payout"], 2),
            adjustments=round(k["adjustment"], 2),
            net_revenue=round(net, 2),
            # what the platform still owes us: net earned minus what they've already paid out
            outstanding_payout=round(net - k["payout"], 2),
        ))
    return LedgerSummary(
        by_source=rows,
        total_net_revenue=round(sum(r.net_revenue for r in rows), 2),
        total_outstanding_payout=round(sum(r.outstanding_payout for r in rows), 2),
    )
