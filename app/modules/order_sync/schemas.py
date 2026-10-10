from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

OrderStatus = Literal["pending", "preparing", "ready", "completed", "cancelled"]


class ItemIn(BaseModel):
    name: str
    qty: int = Field(ge=1, default=1)
    price: float = Field(ge=0)
    prep_minutes: float | None = Field(default=None, ge=0)


class OrderSyncIn(BaseModel):
    source: str = Field(description="swiggy | zomato | pos | website ...")
    external_id: str = Field(description="The order id on the source platform")
    items: list[ItemIn] = Field(min_length=1)
    total: float | None = Field(default=None, ge=0, description="Defaults to sum of items")
    placed_at: datetime | None = None
    sla_minutes: int | None = Field(default=None, ge=1)

    @field_validator("source")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("placed_at")
    @classmethod
    def _naive_utc(cls, v: datetime | None) -> datetime | None:
        if v is not None and v.tzinfo is not None:
            return v.astimezone(timezone.utc).replace(tzinfo=None)
        return v


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    external_id: str
    status: OrderStatus
    items: list[dict]
    total: float
    placed_at: datetime
    promised_by: datetime


class SyncResult(BaseModel):
    created: bool
    order: OrderOut


class BatchSyncResult(BaseModel):
    created: int
    duplicates: int
    orders: list[OrderOut]


class StatusUpdate(BaseModel):
    status: OrderStatus
