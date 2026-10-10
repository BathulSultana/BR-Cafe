# BR CAFÉ Frontend

React, TypeScript, Vite, and Tailwind frontend for BR CAFÉ operations and public customer ordering.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173). The development proxy sends `/api/*` requests to the FastAPI service at `http://localhost:8000`; start the backend separately for order submission and manager order refresh.

For another API host, set `VITE_API_BASE_URL` in a local `.env` file. In production, configure a same-origin reverse proxy or enable the appropriate backend CORS policy. Never put privileged credentials in this public frontend.

## Routes

| Route | Audience | Purpose |
|---|---|---|
| `/order` | Customer | Menu browsing, customization, cart, checkout |
| `/order/track?order=...` | Customer | Shows the confirmation returned in this browser session |
| `/` | Manager | Mission Control |
| `/digital-twin` | Manager | Digital Twin |
| `/analytics` | Manager | Analytics |
| `/inventory` | Manager | Inventory and procurement demo interface |
| `/orders` | Manager | OrderSync queue and online/in-person service policy |
| `/waste`, `/ledger`, `/scheduler`, `/activity`, `/settings` | Manager | Existing operations pages |

## Backend integration status

`src/lib/api.ts` is the centralized typed API adapter. The current FastAPI backend supports:

- `POST /orders/sync` — customer checkout submits order items, quantities, and prices; the UI shows confirmation only when the server returns `created: true`.
- `GET /orders?limit=100` — manager queue refresh (polled every 20 seconds).
- `GET /orders/{id}` and `PATCH /orders/{id}/status` — available backend operations, not used for public tracking.

The server currently does **not** accept customer name or fulfillment type, validate menu prices or recipes, expose a menu or inventory API, provide inventory restock/adjustment endpoints, or authorize customer tracking. The checkout warns about fields that are not transmitted. Public tracking only displays the order confirmation returned to the same browser session; it deliberately does not fetch an order by a guessable ID or simulate status progress.

Menu items and INR prices in `src/features/menu.ts` are demo catalog data. Inventory, stock alerts, restock requests, and adjustments are temporary local demo state. Restock requests do not increase on-hand quantity; only a separately recorded receipt changes the local demo quantity. These demo operations are not presented as backend-persisted or server-confirmed.

Before production, the backend should provide authenticated customer order/tracking and menu endpoints, authoritative price/availability/recipe validation, inventory and procurement APIs with permission checks, and a polling or WebSocket event stream. Configure the frontend to consume those contracts before treating any demo data as operational.

## Build and lint

```powershell
npm run build
npm run lint
```
