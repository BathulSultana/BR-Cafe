from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    """Naive UTC timestamp (SQLite does not keep tzinfo)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Order(Base):
    """Module 1: orders pulled in from Swiggy / Zomato / POS / etc."""

    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_order_source_ext"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[str] = mapped_column(String(32), index=True)
    external_id: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    # list of {"name": str, "qty": int, "price": float, "prep_minutes": float}
    items: Mapped[list] = mapped_column(JSON)
    total: Mapped[float] = mapped_column(Float)
    placed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    promised_by: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class LedgerEntry(Base):
    """Module 2: every money movement tied to a service/order."""

    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(32), index=True)
    # sale | commission | refund | payout | adjustment
    kind: Mapped[str] = mapped_column(String(16), index=True)
    # signed: positive = money in, negative = money out
    amount: Mapped[float] = mapped_column(Float)
    note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class WasteLog(Base):
    """Module 4: wasted ingredients / prepared food."""

    __tablename__ = "waste_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    item: Mapped[str] = mapped_column(String(64), index=True)
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(16), default="kg")
    # spoilage | overproduction | prep_error | returned | expired | other
    reason: Mapped[str] = mapped_column(String(24), index=True)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
