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
          risk mgr, controller)                                MinIO (tearsheets, reports)
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
| Trading engine | `nautilus_trader` pip package (pinned in `services/*/pyproject.toml`); source in `vendor/nautilus_trader` is read-only reference |
| Python | 3.12, `uv` for deps, `ruff` lint/format, `pytest` |
| API | FastAPI, Pydantic v2, SQLAlchemy 2 + Alembic, `redis-py` asyncio |
| UI | Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, TanStack Query, client generated from OpenAPI with `openapi-typescript` |
| Data stores | Postgres 16, Redis 7, MinIO (S3-compatible) |
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

Schemas live in `packages/contracts` (Pydantic models). TypeScript types are generated from them.
Every payload carries `schema_version`, `ts` (UTC ns), `node_id`.

## 4. Commands (`commands.node`)

`start_strategy`, `stop_strategy`, `update_params`, `update_risk_limits`, `flatten_all`, `kill_switch`.
Every command has `command_id`, `issued_by`, and `reason`. The node replies on `events.risk` or `events.health`
with `command_id` (ack/reject). The API writes every command to the `audit_log` table.

## 5. API surface (prefix `/api/v1`)

`/auth/*`, `/positions`, `/orders`, `/trades`, `/account`, `/strategies`, `/strategies/{id}/commands`,
`/risk/limits`, `/backtests` (POST to enqueue, GET to list/detail), `/brokers`, `/alerts`, `/health`.
WebSocket: `/ws/live` (multiplexed: orders, fills, positions, account, risk, health).
The OpenAPI spec at `/openapi.json` is the source for the generated UI client.

## 6. Ports & names (local)

| Service | k8s name | Port | Local URL (k3d ingress) |
|---|---|---|---|
| web | `web` | 3000 | http://capsten.localhost |
| api | `api` | 8000 | http://capsten.localhost/api |
| postgres | `postgres` | 5432 | port-forward only |
| redis | `redis` | 6379 | port-forward only |
| minio | `minio` | 9000/9001 | http://minio.capsten.localhost |
