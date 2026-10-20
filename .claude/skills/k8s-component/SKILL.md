---
name: k8s-component
description: Use when adding or changing a deployable service, Dockerfile, kustomize manifest, Makefile target, k3d local cluster setup, or k3s server deployment under deploy/ or the root Makefile.
---

# Deployment conventions (k3s / k3d + kustomize)

## Layout
```
deploy/k8s/
  base/<component>/{deployment|statefulset,service,configmap}.yaml + kustomization.yaml
  base/kustomization.yaml          # lists all components (shared file: small PRs)
  overlays/local/                  # k3d: small resources, images from k3d registry, secrets from .env
  overlays/server/                 # k3s: limits, PVC storage class, TLS ingress, SOPS/sealed secrets
deploy/k3d/cluster.yaml            # k3d cluster + registry config
```

## Adding a service checklist
1. `services/<name>/Dockerfile`: multi-stage, non-root user, `uv` for Python, healthcheck endpoint.
2. `deploy/k8s/base/<name>/`: Deployment with readiness and liveness probes, resource requests, env from ConfigMap and Secret.
3. Add it to `base/kustomization.yaml` and to `IMAGES` in the root `Makefile`.
4. Local overlay patch if needed (replicas 1, small resources).
5. `make build s=<name> && make up`, then check `kubectl -n capsten get pods`.

## Rules
- Namespace `capsten`. Labels: `app.kubernetes.io/name`, `app.kubernetes.io/part-of: capsten`.
- Stateful pieces (postgres, redis, minio) are StatefulSets with PVCs. trading-node is `replicas: 1` with
  `strategy: Recreate` (two live nodes on one account is a real-money bug).
- No secrets in manifests. Local: `make install` generates a Secret from `.env`. Server: SOPS or sealed-secrets.
- `make install` must be idempotent and work from a fresh clone on macOS and Windows (WSL) with Docker Desktop.
