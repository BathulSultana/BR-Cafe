import os
import tempfile

# Must be set before the app is imported.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs lifespan -> creates tables
        yield c


def order(ext_id, source="swiggy", price=200.0, prep=10, qty=1):
    return {
        "source": source,
        "external_id": ext_id,
        "items": [{"name": "biryani", "qty": qty, "price": price, "prep_minutes": prep}],
    }


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_order_sync_is_idempotent_and_posts_ledger(client):
    r1 = client.post("/orders/sync", json=order("S-1")).json()
    r2 = client.post("/orders/sync", json=order("S-1")).json()
    assert r1["created"] is True and r2["created"] is False
    assert r1["order"]["id"] == r2["order"]["id"]

    entries = client.get("/ledger", params={"source": "swiggy"}).json()
    kinds = sorted(e["kind"] for e in entries)
    assert kinds == ["commission", "sale"]  # exactly one sale despite two syncs


def test_cancel_refunds_once_and_blocks_bad_transition(client):
    oid = client.post("/orders/sync", json=order("Z-1", source="zomato", price=100)).json()["order"]["id"]
    assert client.patch(f"/orders/{oid}/status", json={"status": "cancelled"}).status_code == 200
    # cancelled is terminal
    assert client.patch(f"/orders/{oid}/status", json={"status": "preparing"}).status_code == 409

    summary = client.get("/ledger/summary").json()
    zomato = next(s for s in summary["by_source"] if s["source"] == "zomato")
    assert zomato["net_revenue"] == 0.0  # sale, commission, refund and reversal net out


def test_ledger_payout_reduces_outstanding(client):
    before = next(s for s in client.get("/ledger/summary").json()["by_source"] if s["source"] == "swiggy")
    client.post("/ledger/entries", json={"kind": "payout", "source": "swiggy", "amount": 100})
    after = next(s for s in client.get("/ledger/summary").json()["by_source"] if s["source"] == "swiggy")
    assert after["outstanding_payout"] == pytest.approx(before["outstanding_payout"] - 100)


def test_batch_sync_counts_duplicates(client):
    res = client.post("/orders/sync/batch", json=[order("B-1", "pos"), order("B-2", "pos"), order("B-1", "pos")]).json()
    assert res["created"] == 2 and res["duplicates"] == 1


def test_scheduler_flags_rush_and_late_orders(client):
    for i in range(8):
        client.post("/orders/sync", json=order(f"R-{i}", "website", prep=20))
    plan = client.get("/scheduler/plan", params={"stations": 1}).json()
    assert plan["rush"]["is_rush"] is True
    assert plan["late_count"] > 0  # one station cannot clear this queue in time
    assert any("Rush mode" in s for s in plan["suggestions"])

    roomier = client.get("/scheduler/plan", params={"stations": 6}).json()
    assert roomier["late_count"] < plan["late_count"]
    # each order is scheduled exactly once
    ids = [p["order_id"] for p in plan["plan"]]
    assert len(ids) == len(set(ids))


def test_waste_summary_ranks_reasons(client):
    client.post("/waste", json={"item": "Rice", "quantity": 5, "reason": "overproduction", "cost": 300})
    client.post("/waste", json={"item": "Paneer", "quantity": 1, "reason": "spoilage", "cost": 150})
    s = client.get("/waste/summary").json()
    assert s["total_cost"] == 450
    assert s["by_reason"][0]["reason"] == "overproduction"
    assert s["top_items"][0]["item"] == "rice"
    assert any("Overproduction" in i for i in s["insights"])
