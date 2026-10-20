# Deployment

One set of Kubernetes manifests, two targets:

| Target | Runtime | Overlay | Command |
|---|---|---|---|
| Local | k3s in Docker Desktop via **k3d** | `deploy/k8s/overlays/local` | `make install` |
| Server | native **k3s** | `deploy/k8s/overlays/server` | `make render-server` now; `make deploy-server` in M11.5 |

## Local quick start

Prerequisites: Docker Desktop running (≥ 6 GB RAM, ~10 GB free disk), `k3d`, `kubectl`.
`make prereqs` checks them and prints install hints.

```bash
make install     # creates .env from .env.example, k3d cluster + registry, builds images, deploys, waits
```

Then open http://capsten.localhost. It shows each service's heartbeat.

| URL | What |
|---|---|
| http://capsten.localhost | Web dashboard (stub until M9) |
| http://capsten.localhost/api/v1/health | API liveness |
| http://capsten.localhost/api/v1/health/ready | API readiness (Postgres + Redis) |
| http://capsten.localhost/api/v1/status | Last heartbeat per service |
| http://capsten.localhost/api/v1/docs | OpenAPI docs |

## Everyday commands

| Command | Does |
|---|---|
| `make restart s=api` | Rebuild one image and roll its deployment |
| `make deploy` | Re-apply manifests (re-runs the migration and bucket jobs) |
| `make status` | Pods, services, jobs, PVCs, ingress |
| `make logs s=trading-node` | Tail one service's logs |
| `make down` / `make up` | Stop / start the cluster (data kept) |
| `make reset` | Delete the cluster, registry and **all local data** (asks first) |
| `make render-server` | Render + schema-validate the server overlay (changes nothing) |

Every `kubectl` call in the Makefile uses `--context k3d-capsten`. Your current kubectl context is never used or
changed. To poke around by hand: `kubectl --context k3d-capsten -n capsten get pods`.

## What runs

| Component | Kind | Image | Notes |
|---|---|---|---|
| web | Deployment | `capsten/web` | Next.js (standalone) |
| api | Deployment | `capsten/api` | FastAPI; also used by the `db-migrate` Job (Alembic) |
| trading-node | Deployment, replicas 1, `Recreate` | `capsten/trading-node` | Nautilus; `TRADING_MODE=sandbox` locally |
| recorder | Deployment | `capsten/recorder` | Redis streams → Postgres |
| backtest-worker | Deployment | `capsten/backtest-worker` | Nautilus backtests |
| fake-events | Deployment (**local only**) | `capsten/fake-events` | Simulated events (M0.4) |
| postgres | StatefulSet + PVC | `postgres:16-alpine` | |
| redis | StatefulSet + PVC | `redis:7-alpine` | AOF persistence |
| seaweedfs | StatefulSet + PVC | `chrislusf/seaweedfs:4.48` | S3 API on 8333 (MinIO no longer publishes images) |
| s3-init | Job | seaweedfs | Creates `backtests` and `backups` buckets |
| db-migrate | Job | api | `alembic upgrade head` |
| ingress | Traefik (bundled with k3s) | | `capsten.localhost` → web, `/api` → api |

Images are pushed to the k3d registry at `localhost:5111` (container `k3d-capsten-registry`), tag `dev`.

## Configuration & secrets

- Non-secret settings: `deploy/k8s/base/config.yaml` (`capsten-config`), overridden per overlay.
- Local secrets: `.env` → `make secrets` → `deploy/k8s/overlays/local/secrets/` (git-ignored) → `capsten-secrets` and
  `capsten-s3-config`. A changed secret or config gets a new hashed name, so the pods roll automatically.
- Server secrets are never generated from files in the repo. They're created in the cluster via sealed-secrets or SOPS (M11.4).

## Platform notes

- **Intel Macs:** `nautilus_trader` publishes no wheel for macOS x86_64, so `make test`/`make lint` for `trading-node`
  and `backtest-worker` run inside Docker (the `test` stage of their Dockerfiles). Same on every machine.
- **Windows:** use WSL2 with Docker Desktop's WSL integration; run `make` from the WSL shell.
- **Disk:** Docker Desktop's disk can fill up (the registry then returns HTTP 500 on push). Check with `docker system df`
  and free space with `docker builder prune -a`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `make install` fails at prereqs: port 80 in use | Stop whatever listens on 80 (`lsof -nP -iTCP:80 -sTCP:LISTEN`) |
| Pod `ImagePullBackOff` | `make build s=<svc>` then `make deploy s=<svc>` |
| `db-migrate` not completing | `make logs s=db-migrate`. Usually Postgres still starting; the job retries |
| Fresh start | `make reset && make install` |
