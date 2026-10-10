from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.db import Base, engine
from app.modules.order_sync.router import router as order_sync_router
from app.modules.rush_scheduler.router import router as rush_scheduler_router
from app.modules.service_ledger.router import router as service_ledger_router
from app.modules.waste_management.router import router as waste_management_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="KitchenFlow",
    description="Order sync, service ledger, rush-hour scheduler and waste management for a restaurant / cloud kitchen.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(order_sync_router)
app.include_router(service_ledger_router)
app.include_router(rush_scheduler_router)
app.include_router(waste_management_router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
