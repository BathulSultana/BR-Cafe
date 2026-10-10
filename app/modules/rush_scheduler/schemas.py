from datetime import datetime

from pydantic import BaseModel


class ScheduledOrder(BaseModel):
    order_id: int
    source: str
    station: int
    start_at: datetime
    finish_at: datetime
    promised_by: datetime
    prep_minutes: float
    late_by_minutes: float  # 0 if on time
    at_risk: bool


class RushStatus(BaseModel):
    is_rush: bool
    open_orders: int
    recent_orders: int
    threshold: int
    window_minutes: int


class SchedulePlan(BaseModel):
    generated_at: datetime
    rush: RushStatus
    stations: int
    plan: list[ScheduledOrder]
    late_count: int
    suggestions: list[str]
