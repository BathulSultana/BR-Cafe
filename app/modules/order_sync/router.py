from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Order
from app.modules.order_sync import service
from app.modules.order_sync.schemas import (
    BatchSyncResult,
    OrderOut,
    OrderSyncIn,
    StatusUpdate,
    SyncResult,
)

router = APIRouter(prefix="/orders", tags=["order sync"])


@router.post("/sync", response_model=SyncResult)
def sync_one(data: OrderSyncIn, db: Session = Depends(get_db)):
    order, created = service.sync_order(db, data)
    return SyncResult(created=created, order=order)


@router.post("/sync/batch", response_model=BatchSyncResult)
def sync_batch(batch: list[OrderSyncIn], db: Session = Depends(get_db)):
    orders, created = [], 0
    for data in batch:
        order, was_new = service.sync_order(db, data)
        orders.append(order)
        created += was_new
    return BatchSyncResult(created=created, duplicates=len(batch) - created, orders=orders)


@router.get("", response_model=list[OrderOut])
def list_orders(status: str | None = None, source: str | None = None,
                limit: int = 100, db: Session = Depends(get_db)):
    q = select(Order).order_by(Order.placed_at.desc()).limit(min(limit, 500))
    if status:
        q = q.where(Order.status == status)
    if source:
        q = q.where(Order.source == source.lower())
    return db.scalars(q).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def set_status(order_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    try:
        return service.update_status(db, order, body.status)
    except ValueError as e:
        raise HTTPException(409, str(e))
