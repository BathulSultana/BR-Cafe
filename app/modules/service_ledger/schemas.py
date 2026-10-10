from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EntryKind = Literal["sale", "commission", "refund", "payout", "adjustment"]


class EntryIn(BaseModel):
    """Manual entry, e.g. a platform payout or an adjustment."""

    kind: Literal["payout", "adjustment"]
    source: str
    amount: float = Field(description="Signed. Positive = money in, negative = money out")
    note: str = ""
    order_id: int | None = None


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int | None
    source: str
    kind: str
    amount: float
    note: str
    created_at: datetime


class SourceSummary(BaseModel):
    source: str
    gross_sales: float
    commission: float
    refunds: float
    payouts: float
    adjustments: float
    net_revenue: float
    outstanding_payout: float


class LedgerSummary(BaseModel):
    by_source: list[SourceSummary]
    total_net_revenue: float
    total_outstanding_payout: float
