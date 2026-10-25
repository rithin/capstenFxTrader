# Architecture & Shared Contracts

This file is the **contract between modules**. Both developers code against it. Changing anything in
sections 3–5 needs the other developer's review (see `/contract-change`).

## 1. Components

```
 Browser ──► apps/web (Next.js) ──REST/WS──► services/api (FastAPI)
                                               │   │   │
                         ┌─────────────────────┘   │   └──────────────┐
                         ▼                         ▼                  ▼
                  Redis streams            Postgres (state,      Redis job queue
               (events + commands)          trades, audit)             │
                   ▲        │                    ▲                     ▼
                   │        ▼                    │           services/backtest-worker
         services/trading-node            services/recorder     (Nautilus BacktestNode)
         (Nautilus TradingNode:            (streams → Postgres)         │
          strategies, trade mgr,                                        ▼
          risk mgr, controller)                                SeaweedFS S3 (tearsheets)
                   │
                   ▼
            Broker adapters (IB paper first; OANDA / crypto later)
```

Rules:
- The UI and API are **never in the trading path**. If they die, trading and risk limits continue.
- Backtests never run inside the live trading node.
- Broker credentials live in Kubernetes Secrets only. Postgres stores a reference name, never the key.

## 2. Tech stack (fixed unless changed via M0)

| Layer | Choice |
|---|---|
| Trading engine | **NautilusTrader v2** (LGPL-3.0) pip package, pinned in `services/*/pyproject.toml` (M0.7); source in `vendor/nautilus_trader` is read-only reference |
| Broker adapters | Out-of-tree packages on the v2 Python adapter interface: `packages/adapters/kite` (Zerodha), `packages/adapters/coindcx`; Hyperliquid uses the built-in Nautilus adapter |
| Python | **3.13** (v2 has no 3.12 wheels), `uv` for deps, `ruff` lint/format, `pytest` |
| API | FastAPI, Pydantic v2, SQLAlchemy 2 + Alembic, `redis-py` asyncio |
| UI | Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, TanStack Query, client generated from OpenAPI with `openapi-typescript` |
| Data stores | Postgres 16, Redis 7, SeaweedFS (S3-compatible; MinIO stopped publishing images) |
| Runtime | k3s. Local = k3d (k3s in Docker Desktop). Server = native k3s. Manifests = kustomize (`deploy/k8s/base` + `overlays/local`, `overlays/server`). Ingress = Traefik (bundled with k3s) |

## 3. Redis streams (event bus contract)

| Stream | Producer | Consumers | Payload |
|---|---|---|---|
| `events.orders` | trading-node | recorder, api(ws) | `OrderEvent` |
| `events.fills` | trading-node | recorder, api(ws) | `FillEvent` |
| `events.positions` | trading-node | recorder, api(ws) | `PositionEvent` |
| `events.account` | trading-node | recorder, api(ws) | `AccountEvent` |
| `events.risk` | trading-node | recorder, api(ws) | `RiskEvent` (limit hit, halt, kill switch) |
| `events.health` | all services | api(ws) | `Heartbeat` |
| `commands.node` | api | trading-node | `Command` |
| `jobs.backtest` | api | backtest-worker | `BacktestJob` |
| `events.backtest` | backtest-worker | api, recorder | `BacktestStatus` |
| `market.bars` | trading-node | api(ws, chart history) | `MarketBar` (closed bars; last 2,000 per instrument/timeframe) |
| `market.quotes` | trading-node | api(ws) | `QuoteSnapshot` (throttled ≤ 4/s per instrument) |
| `status.node` | trading-node | api(ws, dashboard summary) | `NodeStatus` (strategies, risk utilisation, account KPIs; every 5 s + on change) |

Schemas live in `packages/contracts` (Pydantic models). TypeScript types are generated from them.
Every payload carries `schema_version`, `ts` (UTC ns), `node_id`.

## 4. Commands (`commands.node`)

`start_strategy`, `stop_strategy`, `update_params`, `update_risk_limits`, `cancel_order`, `close_position`,
`flatten_all`, `kill_switch`.
Every command has `command_id`, `issued_by`, and `reason`. The node replies on `events.risk` or `events.health`
with `command_id` (ack/reject). The API writes every command to the `audit_log` table.

## 5. API surface (prefix `/api/v1`)

`/auth/*`, `/positions`, `/orders`, `/trades`, `/account`, `/strategies`, `/strategies/{id}/commands`,
`/risk/limits`, `/backtests` (POST to enqueue, GET to list/detail), `/brokers`, `/alerts`, `/health`,
`/market/bars`, `/dashboard/summary`.
WebSocket: `/ws/live` (multiplexed: orders, fills, positions, account, risk, health, `status`, `bars:<instrument>:<tf>`,
`quotes:<instrument>`).
The OpenAPI spec at `/openapi.json` is the source for the generated UI client.

## 6. Ports & names (local)

| Service | k8s name | Port | Local URL (k3d ingress) |
|---|---|---|---|
| web | `web` | 3000 | http://capsten.localhost |
| api | `api` | 8000 | http://capsten.localhost/api |
| postgres | `postgres` | 5432 | port-forward only |
| redis | `redis` | 6379 | port-forward only |
| seaweedfs (S3) | `seaweedfs` | 8333 (S3), 9333 (master), 8888 (filer) | port-forward only |

## 7. UI design

Approved design (Live terminal + Backtests): https://claude.ai/artifact/SJyoZGTauvpzwZqU7PDFyf
Light ivory theme (#FAF9F5) with Claude clay accent (#D97757); gains blue #2F6F9F, losses rust #A9502F, always with +/− sign.
Fonts: Source Serif 4 (headings), Inter (UI), JetBrains Mono (numbers). Implemented as theme + components in M9.9.

## 8. Markets & brokers (India-first, decided 2026-10-24)

| Priority | Market | Broker | Mode | Notes |
|---|---|---|---|---|
| 1 | Index options buying: NIFTY (NSE, weekly), SENSEX (BSE, weekly), BANKNIFTY (NSE, monthly only) | Zerodha (Kite Connect, ₹500/month) | paper → live | Daily manual 2FA login; orders only from the whitelisted static-IP server; ≤ 10 orders/sec; MARKET orders become price-protected, so use LIMIT/SL |
| 2 | Crypto spot + futures (INR/USDT margined) | CoinDCX | paper → live | HMAC REST + Socket.io 2.x streams; 30% tax + 1% TDS |
| 3 | Forex (HIP-3 perpetuals) | Hyperliquid | backtest only | Live use needs legal review first |

- **Paper mode** = live broker data + Nautilus sandbox execution (simulated fills). Neither Zerodha nor CoinDCX offers a sandbox.
- **Options history:** team-provided NIFTY/SENSEX dataset (ATM, ITM, ITM1–3) for backtests + our own tick recording from day one
  (Kite does not serve expired options).
- **Interactive Brokers and FX via IB are dropped.**
