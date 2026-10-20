# capstenFxTrader

Automated FX/crypto trading platform on NautilusTrader. Two developers, module ownership.

## Read first (only what the task needs)
- Contracts & architecture: `docs/ARCHITECTURE.md`
- Task board & ownership: `docs/team/TASKS.md`
- Latest handoff notes: `docs/team/handoff/` (newest file for your module only)

## Layout
- `apps/web`: Next.js UI (Dev B)
- `services/api`: FastAPI gateway + Alembic migrations (Dev B)
- `services/recorder`: Redis streams → Postgres (Dev B)
- `services/trading-node`: Nautilus TradingNode; `capsten/{strategies,trade_manager,risk,data}` (Dev A)
- `services/backtest-worker`: BacktestNode jobs (Dev A)
- `packages/contracts`: shared Pydantic event/command models (co-owned; change only via `/contract-change`)
- `deploy/k8s`: kustomize base + overlays `local` (k3d) and `server` (k3s) (Dev B)
- `vendor/nautilus_trader`: **upstream source, read-only.** Do not edit. Do not search it broadly.

## Token rules
- Do NOT glob/grep `vendor/` or `node_modules/`. For Nautilus APIs use the context7 MCP first, then
  targeted reads of `vendor/nautilus_trader/docs/concepts/<topic>.md` or a specific file found with Serena.
- Prefer Serena / LSP symbol lookups (find symbol, references) over reading whole files.
- Stay inside the module of the current task. Touch another module only if the task says so.
- Don't re-explain or summarise files back to the user; act on them.
- Don't spawn swarms/multi-agent orchestration for normal tasks. Use one subagent at most, and only for wide searches.

## Conventions
- Python 3.12, `uv`, `ruff format` + `ruff check`, `pytest`. Type hints everywhere. Pydantic v2.
- TS: strict mode, App Router, server components by default, TanStack Query for data, shadcn/ui components,
  API types only from the generated client (`apps/web/src/lib/api/schema.d.ts`). Never hand-write API types.
- All money/price math with `Decimal` or Nautilus `Price`/`Quantity`, never float.
- Times are UTC. Event timestamps are ns integers.
- Secrets only via env / k8s Secrets. Never commit `.env` or keys. Never log credentials.
- Every new service: Dockerfile + kustomize entry in `deploy/k8s/base` + image in Makefile `IMAGES`.

## Safety (trading)
- Live trading code changes need tests. Risk-manager changes need a test that proves the limit triggers.
- Default every new config to paper/sandbox. Never default to a live account.
- Never remove or bypass the kill switch, risk checks or `RiskEngine` limits to "make something work".
- **kubectl: always `--context k3d-capsten`** (or use the Makefile). Developers' default contexts may point at
  production clusters. Never run bare `kubectl`, `kubectl config use-context`, or `apply` without an explicit context.

## Commands
- `make install` (fresh local k3d stack) · `make up` / `make down` · `make test` · `make lint` · `make logs s=<svc>`
- Module checks: `make test m=<module>` (e.g. `m=api`, `m=web`, `m=trading-node`)

## Workflow
- Start with `/start-task <ID>`; finish with `/done-task <ID>`; end session with `/handoff`.
- Plan mode for anything touching >3 files. Small commits, conventional messages (`feat(api): ...`).
