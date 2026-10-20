# Task Board: Module Split

Two developers, module ownership, working in parallel. **Dev A = Trading core & data**,
**Dev B = Platform, UI & deployment**. Each module has one owner. The other developer reviews but does not edit it
without asking. Shared contracts (`packages/contracts`, `docs/ARCHITECTURE.md` §3–5) are co-owned.

Status keys: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked. Update the status in the same PR as the work.
Branch name: `<a|b>/<task-id>-short-name`, e.g. `a/M2.3-ema-strategy`.

---

## Phase 0: Foundation (together, ~1 day)

Do this first and together. Everything else depends on it.

| ID | Task | Owner | Status |
|---|---|---|---|
| M0.1 | Agree the stack and contracts in `docs/ARCHITECTURE.md`; fill the open decisions below | A+B | [ ] |
| M0.2 | Monorepo skeleton: `apps/web`, `services/{trading-node,api,recorder,backtest-worker}`, `packages/contracts`, `deploy/k8s` | B | [ ] |
| M0.3 | `packages/contracts`: Pydantic models for every stream payload + `Command` + `BacktestJob`; JSON-schema export; TS type generation script | A | [ ] |
| M0.4 | Fake event publisher (`scripts/fake_events.py`) that emits realistic contract events to Redis, so B can build the UI/recorder before the real node exists | A | [ ] |
| M0.5 | Root `Makefile` stub with target names agreed (`install`, `up`, `down`, `build`, `test`, `lint`, `logs`, `reset`) | B | [ ] |
| M0.6 | Install the Claude Code plugins from `docs/team/CLAUDE_CODE_SETUP.md` on both machines | A+B | [ ] |

**Open decisions for M0.1:** broker for v1 (proposed: IB paper), first strategy + pairs, auth model for UI
(proposed: single admin + JWT, roles later), alert channel (Telegram or Slack).

---

## Dev A: Trading core & data

### M1 · Trading node service (`services/trading-node`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M1.1 | `TradingNode` bootstrap from env/config file; Dockerfile; health heartbeat to `events.health` | M0.3 | [ ] |
| M1.2 | Broker adapter config: IB paper (IB Gateway as sidecar container) | M1.1 | [ ] |
| M1.3 | **Event bridge actor**: subscribes to Nautilus order/fill/position/account events and publishes them to Redis in **our contract format** | M0.3, M1.1 | [ ] |
| M1.4 | **Command handler**: consumes `commands.node` and drives Nautilus `Controller` (start/stop strategy, params) + acks | M1.3 | [ ] |
| M1.5 | State persistence via Nautilus Redis cache; verify restart → reconciliation with broker | M1.2 | [ ] |
| M1.6 | Sandbox/demo mode that runs against simulated venue for local dev without broker creds | M1.1 | [ ] |

### M2 · Strategies (`services/trading-node/capsten/strategies`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M2.1 | `CapstenStrategy` base class: config schema, param update hook, standard logging | M1.1 | [ ] |
| M2.2 | First strategy (proposed: EMA cross / mean reversion on EUR/USD 15m) | M2.1 | [ ] |
| M2.3 | Strategy registry (name → class + config schema) exposed for API `/strategies` | M2.1 | [ ] |

### M3 · Trade manager (`.../capsten/trade_manager`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M3.1 | Bracket entries: SL/TP from ATR or fixed pips | M2.1 | [ ] |
| M3.2 | Trailing stop + break-even move | M3.1 | [ ] |
| M3.3 | Session filter (London/NY hours) + news blackout windows (calendar input) | M3.1 | [ ] |

### M4 · Risk manager (`.../capsten/risk`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M4.1 | Position sizing (risk % of equity per trade) | M2.1 | [ ] |
| M4.2 | Daily loss limit + max drawdown → halt trading, emit `RiskEvent` | M1.3 | [ ] |
| M4.3 | Exposure caps per currency / total; max open positions | M4.1 | [ ] |
| M4.4 | Kill switch: flatten all + halt, triggered by command or automatically | M1.4, M4.2 | [ ] |
| M4.5 | Nautilus `RiskEngine` config (max order rate, max notional) as the second safety layer | M1.1 | [ ] |

### M5 · Market data (`services/trading-node/capsten/data`, `scripts/data`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M5.1 | Historical FX loader (source TBD: broker / Dukascopy / HistData) → Nautilus Parquet catalog | M0.2 | [ ] |
| M5.2 | Catalog on a PVC (k8s) + seed job for local (`make seed-data`) | M5.1, M11.3 | [ ] |

### M6 · Backtest worker (`services/backtest-worker`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M6.1 | Consume `jobs.backtest`, run `BacktestNode` with the strategy and config from the job | M2.3, M5.1 | [ ] |
| M6.2 | Produce tearsheet HTML + reports → MinIO; publish `events.backtest` status/progress | M6.1 | [ ] |
| M6.3 | Summary metrics (PnL, Sharpe, max DD, win rate, trades) in the result payload for UI comparison | M6.2 | [ ] |

---

## Dev B: Platform, UI & deployment

### M7 · API gateway (`services/api`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M7.1 | FastAPI skeleton, settings, health, OpenAPI, Dockerfile | M0.2 | [ ] |
| M7.2 | Auth: login, JWT, admin user bootstrap from secret | M7.1 | [ ] |
| M7.3 | Read endpoints: positions, orders, trades, account (from Postgres + Redis live state) | M8.2 | [ ] |
| M7.4 | WebSocket `/ws/live`: fan-out of Redis streams to browsers | M0.4 | [ ] |
| M7.5 | Command endpoints → `commands.node` + audit log + wait for ack | M0.3 | [ ] |
| M7.6 | Backtest endpoints: enqueue, list, detail, tearsheet presigned URL | M0.3 | [ ] |
| M7.7 | Broker & strategy config CRUD (secret *references* only) | M7.2 | [ ] |

### M8 · Recorder + database (`services/recorder`, `services/api/migrations`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M8.1 | Postgres schema + Alembic: orders, fills, positions, account_snapshots, risk_events, commands/audit_log, backtests, strategy_configs, brokers, users | M0.3 | [ ] |
| M8.2 | Recorder: consumer group on `events.*` → idempotent upserts; replay-safe | M8.1, M0.4 | [ ] |

### M9 · Web UI (`apps/web`)
| ID | Task | Depends | Status |
|---|---|---|---|
| M9.1 | Next.js app shell: layout, nav, auth pages, generated API client, WS hook, design system (shadcn/ui) | M7.1 | [ ] |
| M9.2 | **Live dashboard**: positions, open orders, P&L, equity, node health | M7.4 | [ ] |
| M9.3 | **Trades**: history table, filters, per-trade detail, analytics (win rate, expectancy) | M7.3 | [ ] |
| M9.4 | **Backtests**: launch form (strategy, pairs, dates, params), job list w/ progress, tearsheet viewer, compare runs | M7.6 | [ ] |
| M9.5 | **Strategies & risk**: start/stop, edit params, edit risk limits (with confirmation dialogs) | M7.5 | [ ] |
| M9.6 | **Brokers & accounts**: connections, status, add/edit (secret refs) | M7.7 | [ ] |
| M9.7 | **Alerts + kill switch**: always-visible kill switch, alert/risk event feed | M7.5 | [ ] |
| M9.8 | Playwright smoke tests for the main pages | M9.2 | [ ] |

### M10 · Alerts & observability
| ID | Task | Depends | Status |
|---|---|---|---|
| M10.1 | Alert service/worker: risk events, node down, broker disconnect → Telegram/Slack | M8.2 | [ ] |
| M10.2 | Structured JSON logs across services; `make logs` | M11.2 | [ ] |
| M10.3 | (later) Prometheus + Grafana via k3s Helm | M11.4 | [ ] |

### M11 · Deployment: k3s + `make install`
| ID | Task | Depends | Status |
|---|---|---|---|
| M11.1 | `make install`: prerequisite check (Docker Desktop, k3d, kubectl), create k3d cluster + local registry, build & push images, apply `overlays/local`, wait for ready, print URLs | M0.5 | [ ] |
| M11.2 | Kustomize `base`: Deployments/StatefulSets/Services/Ingress for web, api, recorder, backtest-worker, trading-node, postgres, redis, minio | M11.1 | [ ] |
| M11.3 | `overlays/local`: small resources, dev secrets generated from `.env`, seed jobs | M11.2 | [ ] |
| M11.4 | `overlays/server`: native k3s, resource limits, PVC storage class, TLS ingress, secrets via SOPS or sealed-secrets | M11.2 | [ ] |
| M11.5 | `make deploy-server` (kubeconfig context switch + apply) and backup CronJob for Postgres | M11.4 | [ ] |
| M11.6 | GitHub Actions: lint + test + build images on PR | M11.2 | [ ] |

---

## Sync points (both)

| When | What |
|---|---|
| End of Phase 0 | Contracts frozen v1; fake events flowing; `make install` brings up empty stack |
| Milestone 1 | Real node on IB paper → events in UI live dashboard (M1.3 + M9.2) |
| Milestone 2 | Backtest from UI end to end (M6 + M7.6 + M9.4) |
| Milestone 3 | Risk limits + kill switch from UI verified on paper (M4 + M9.7) |
| Milestone 4 | Server deploy on k3s, 2 weeks of unattended paper trading |

## Why this split runs in parallel
- B never waits for A: the **fake event publisher (M0.4)** and **contracts (M0.3)** let the UI, API and recorder be built
  and tested before the trading node exists.
- A never waits for B: the node, strategies and backtests are runnable and testable from the CLI and pytest without the UI.
- The only shared files are `packages/contracts` and `docs/ARCHITECTURE.md`. Both are changed only through `/contract-change`.
