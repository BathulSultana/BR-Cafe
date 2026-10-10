from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import LedgerEntry
from app.modules.service_ledger import service
from app.modules.service_ledger.schemas import EntryIn, EntryOut, LedgerSummary

router = APIRouter(prefix="/ledger", tags=["service ledger"])


@router.get("", response_model=list[EntryOut])
def list_entries(source: str | None = None, kind: str | None = None,
                 limit: int = 100, db: Session = Depends(get_db)):
    q = select(LedgerEntry).order_by(LedgerEntry.id.desc()).limit(min(limit, 500))
    if source:
        q = q.where(LedgerEntry.source == source.lower())
    if kind:
        q = q.where(LedgerEntry.kind == kind)
    return db.scalars(q).all()


@router.post("/entries", response_model=EntryOut, status_code=201)
def create_entry(data: EntryIn, db: Session = Depends(get_db)):
    """Record a platform payout (positive amount = cash received from the platform) or an adjustment."""
    return service.add_manual_entry(db, data)


@router.get("/summary", response_model=LedgerSummary)
def summary(db: Session = Depends(get_db)):
    return service.summarize(db)
