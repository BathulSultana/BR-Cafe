from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

WasteReason = Literal["spoilage", "overproduction", "prep_error", "returned", "expired", "other"]


class WasteIn(BaseModel):
    item: str
    quantity: float = Field(gt=0)
    unit: str = "kg"
    reason: WasteReason
    cost: float = Field(ge=0, default=0.0, description="Value of what was wasted")
    order_id: int | None = None


class WasteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: str
    quantity: float
    unit: str
    reason: str
    cost: float
    order_id: int | None
    logged_at: datetime


class ReasonTotal(BaseModel):
    reason: str
    entries: int
    cost: float
    share_of_cost: float


class ItemTotal(BaseModel):
    item: str
    entries: int
    quantity: float
    cost: float


class WasteSummary(BaseModel):
    days: int
    total_cost: float
    total_entries: int
    by_reason: list[ReasonTotal]
    top_items: list[ItemTotal]
    insights: list[str]
