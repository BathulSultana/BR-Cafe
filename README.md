# KitchenFlow

A FastAPI backend for a restaurant / cloud kitchen with four modules:

| Module | Prefix | What it does |
|---|---|---|
| **Order Sync** | `/orders` | Pulls in orders from Swiggy / Zomato / POS / website. Idempotent on `(source, external_id)`, so re-syncing never duplicates. Enforces status flow `pending → preparing → ready → completed` (or `cancelled`). |
| **Service Ledger** | `/ledger` | Books every order automatically: sale, channel commission, and refund on cancellation. Manual payouts/adjustments. `/ledger/summary` shows net revenue and the payout each platform still owes you. |
| **Rush Hour Scheduler** | `/scheduler` | Detects rush mode and builds a cooking plan: earliest-deadline-first across N stations, flags orders that will be late, and suggests fixes. Try `?stations=N` for what-ifs. |
| **Waste Management** | `/waste` | Log waste with a reason and cost. `/waste/summary` ranks reasons and items and gives plain-language insights. |

## How the modules connect

`order_sync` calls `service_ledger` when an order is created or cancelled, so the ledger is always consistent with orders. The scheduler reads open orders. Waste can reference an `order_id` (e.g. returned food).

## Run it

```bash
cd kitchenflow
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for the interactive API.

```bash
pytest
```

## Configure

Edit `app/config.py`: commission rates per channel, default SLA, number of stations, rush threshold, default prep time. Set `DATABASE_URL` to use Postgres instead of the default SQLite file.

## Layout

```
app/
  main.py  config.py  db.py  models.py
  modules/
    order_sync/        router.py  service.py  schemas.py
    service_ledger/    router.py  service.py  schemas.py
    rush_scheduler/    router.py  service.py  schemas.py
    waste_management/  router.py  service.py  schemas.py
tests/test_smoke.py
```

## Ideas for next steps

- Real connectors that poll or receive webhooks from Swiggy / Zomato
- Auth and multi-outlet support
- Feed waste history back into the scheduler as a prep forecast
- A small dashboard UI
