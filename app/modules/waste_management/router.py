from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import WasteLog
from app.modules.waste_management import service
from app.modules.waste_management.schemas import WasteIn, WasteOut, WasteSummary

router = APIRouter(prefix="/waste", tags=["waste management"])


@router.post("", response_model=WasteOut, status_code=201)
def log_waste(data: WasteIn, db: Session = Depends(get_db)):
    return service.log_waste(db, data)


@router.get("", response_model=list[WasteOut])
def list_waste(reason: str | None = None, limit: int = 100, db: Session = Depends(get_db)):
    q = select(WasteLog).order_by(WasteLog.id.desc()).limit(min(limit, 500))
    if reason:
        q = q.where(WasteLog.reason == reason)
    return db.scalars(q).all()


@router.get("/summary", response_model=WasteSummary)
def summary(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    return service.summarize(db, days=days)
