# capstenFxTrader

Automated forex and crypto trading platform built on [NautilusTrader](https://github.com/nautechsystems/nautilus_trader),
with a Next.js dashboard and k3s deployment.

## Quick start (local)

Prerequisites: Docker Desktop (Kubernetes **off**; we use k3d), `k3d`, `kubectl`, `make`.

```bash
git clone https://github.com/rithin/capstenFxTrader.git
cd capstenFxTrader
cp .env.example .env      # fill in values (paper/sandbox by default)
make install              # creates the k3d cluster, builds images, deploys everything
```

Then open http://capsten.localhost.

> `make install` is being built in task M11.1. See `docs/team/TASKS.md`.

## Docs
- Architecture & contracts: `docs/ARCHITECTURE.md`
- Task board: `docs/team/TASKS.md`
- Claude Code setup for contributors: `docs/team/CLAUDE_CODE_SETUP.md`

## Upstream
The NautilusTrader source is kept read-only in `vendor/nautilus_trader` (LGPL-3.0). Our services use the
pinned `nautilus_trader` pip package. To update the reference copy, see `docs/team/CLAUDE_CODE_SETUP.md` §6.
