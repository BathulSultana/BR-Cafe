from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import STATIONS
from app.db import get_db
from app.modules.rush_scheduler import service
from app.modules.rush_scheduler.schemas import RushStatus, SchedulePlan

router = APIRouter(prefix="/scheduler", tags=["rush hour scheduler"])


@router.get("/rush", response_model=RushStatus)
def rush(db: Session = Depends(get_db)):
    return service.rush_status(db)


@router.get("/plan", response_model=SchedulePlan)
def plan(stations: int = Query(STATIONS, ge=1, le=20), db: Session = Depends(get_db)):
    """Cooking sequence for all open orders. Pass ?stations=N to test 'what if we add a station'."""
    return service.build_plan(db, stations=stations)
