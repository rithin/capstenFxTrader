# capstenFxTrader: local k3s (k3d) workflow.  `make help` lists targets.
# Every kubectl call is pinned to the local cluster context, never your current context.

SHELL := /usr/bin/env bash
.DEFAULT_GOAL := help

CLUSTER   := capsten
CTX       := k3d-$(CLUSTER)
NS        := capsten
REGISTRY  := localhost:5111
REG_NAME  := capsten-registry
TAG       := dev
KUBECTL   := kubectl --context $(CTX)
K         := $(KUBECTL) -n $(NS)
LOCAL_OVERLAY  := deploy/k8s/overlays/local
SERVER_OVERLAY := deploy/k8s/overlays/server

# image name -> build context
IMAGES := api:services/api web:apps/web trading-node:services/trading-node recorder:services/recorder \
          backtest-worker:services/backtest-worker fake-events:services/fake-events
PY_MODULES := api trading-node recorder backtest-worker fake-events
# nautilus_trader ships no Intel-Mac wheel, so these modules test/lint inside Docker (same on every machine)
DOCKER_TEST_MODULES := trading-node backtest-worker

s ?=
m ?=

##@ Setup
.PHONY: install
install: prereqs secrets cluster build deploy rollout wait urls ## Fresh local stack: cluster + images + deploy (idempotent)

.PHONY: prereqs
prereqs: ## Check Docker Desktop, k3d, kubectl, free ports
	@./scripts/check-prereqs.sh

.PHONY: secrets
secrets: ## Generate local k8s secret inputs from .env (creates .env from .env.example if missing)
	@./scripts/gen-local-secrets.sh

.PHONY: cluster
cluster: ## Create the k3d registry + cluster if they don't exist
	@k3d registry list 2>/dev/null | grep -q "k3d-$(REG_NAME)" || k3d registry create $(REG_NAME) --port 5111
	@if k3d cluster list 2>/dev/null | grep -q "^$(CLUSTER) "; then \
	  echo "Cluster $(CLUSTER) exists"; k3d cluster start $(CLUSTER) >/dev/null; \
	else k3d cluster create --config deploy/k3d/cluster.yaml; fi
	@$(KUBECTL) wait --for=condition=Ready node --all --timeout=120s >/dev/null && echo "Cluster ready (context $(CTX))"

##@ Build & deploy
.PHONY: build
build: ## Build + push images to the local registry (all, or s=<service>)
	@for pair in $(IMAGES); do name=$${pair%%:*}; dir=$${pair#*:}; \
	  if [ -z "$(s)" ] || [ "$(s)" = "$$name" ]; then \
	    echo "==> building $$name"; \
	    docker build -q -t $(REGISTRY)/capsten/$$name:$(TAG) $$dir >/dev/null && \
	    docker push -q $(REGISTRY)/capsten/$$name:$(TAG) >/dev/null && echo "    pushed $(REGISTRY)/capsten/$$name:$(TAG)" || exit 1; \
	  fi; done
	@$(MAKE) --no-print-directory clean-images

.PHONY: clean-images
clean-images: ## Free disk: drop superseded image copies (Docker + k3s node). Registry GC is unsafe with OCI indexes, so it's skipped
	@docker image prune -f >/dev/null
	@docker exec k3d-$(CLUSTER)-server-0 crictl rmi --prune >/dev/null 2>&1 || true
	@echo "    disk: $$(docker exec k3d-$(REG_NAME) df -h /var/lib/registry | awk 'NR==2{print $$4" free of "$$2}')"

.PHONY: deploy
deploy: ## Apply the local overlay (re-runs migration + bucket jobs)
	@$(K) delete job db-migrate s3-init --ignore-not-found >/dev/null 2>&1 || true
	@$(KUBECTL) apply -k $(LOCAL_OVERLAY) | grep -v unchanged || true
	@if [ -n "$(s)" ]; then $(K) rollout restart deployment/$(s); fi

.PHONY: rollout
rollout: ## Restart app pods so they pick up rebuilt :dev images (all, or s=<service>)
	@$(K) rollout restart deployment $(if $(s),$(s),-l app.kubernetes.io/part-of=capsten) >/dev/null && echo "Restarted app deployments"
	@$(MAKE) --no-print-directory clean-images

.PHONY: wait
wait: ## Wait until infrastructure, jobs and app services are ready
	@echo "Waiting for infrastructure..."
	@for ss in postgres redis seaweedfs; do $(K) rollout status statefulset/$$ss --timeout=300s >/dev/null || exit 1; echo "  ✓ $$ss"; done
	@echo "Waiting for jobs..."
	@for j in db-migrate s3-init; do $(K) wait --for=condition=complete job/$$j --timeout=300s >/dev/null || exit 1; echo "  ✓ $$j"; done
	@echo "Waiting for app services..."
	@for d in api web trading-node recorder backtest-worker fake-events; do $(K) rollout status deployment/$$d --timeout=300s >/dev/null || exit 1; echo "  ✓ $$d"; done

.PHONY: urls
urls: ## Print local URLs
	@echo ""
	@echo "Capsten is running:"
	@echo "  Dashboard   http://capsten.localhost"
	@echo "  API health  http://capsten.localhost/api/v1/health"
	@echo "  API docs    http://capsten.localhost/api/v1/docs"
	@echo "  kubectl     kubectl --context $(CTX) -n $(NS) get pods"

.PHONY: restart
restart: ## Rebuild + redeploy one service: make restart s=api
	@test -n "$(s)" || { echo "usage: make restart s=<service>"; exit 1; }
	@$(MAKE) --no-print-directory build s=$(s)
	@$(K) rollout restart deployment/$(s) && $(K) rollout status deployment/$(s) --timeout=180s

##@ Operate
.PHONY: up
up: ## Start a stopped cluster
	@k3d cluster start $(CLUSTER) && $(MAKE) --no-print-directory wait

.PHONY: down
down: ## Stop the cluster (keeps data)
	@k3d cluster stop $(CLUSTER)

.PHONY: status
status: ## Pods, services and jobs
	@$(K) get pods,svc,jobs,pvc,ingress

.PHONY: logs
logs: ## Tail logs: make logs s=api
	@test -n "$(s)" || { echo "usage: make logs s=<service>"; exit 1; }
	@$(K) logs -f --tail=100 -l app.kubernetes.io/name=$(s) --all-containers --prefix

.PHONY: reset
reset: ## Delete the cluster, registry and ALL local data
	@read -p "Delete cluster '$(CLUSTER)' and all local data? [y/N] " a; [ "$$a" = "y" ] || exit 1
	@k3d cluster delete $(CLUSTER) || true
	@k3d registry delete k3d-$(REG_NAME) || true

##@ Validate
.PHONY: render-local
render-local: ## Render the local overlay to stdout
	@$(KUBECTL) kustomize $(LOCAL_OVERLAY)

.PHONY: render-server
render-server: ## Render + schema-validate the server overlay using the LOCAL cluster API (no changes anywhere)
	@$(KUBECTL) kustomize $(SERVER_OVERLAY) > /tmp/capsten-server.yaml && \
	  $(KUBECTL) apply --dry-run=client --validate=strict -f /tmp/capsten-server.yaml >/dev/null && \
	  echo "server overlay OK: $$(grep -c '^kind:' /tmp/capsten-server.yaml) resources → /tmp/capsten-server.yaml"

##@ Develop
.PHONY: test
test: ## Run tests: make test m=<api|web|trading-node|recorder|backtest-worker|fake-events> (all if empty)
	@set -e; for mod in $(if $(m),$(m),$(PY_MODULES) web); do echo "==> $$mod"; \
	  if [ "$$mod" = "web" ]; then (cd apps/web && { [ -d node_modules ] || npm ci --silent; } && npm run --silent lint); \
	  elif echo " $(DOCKER_TEST_MODULES) " | grep -q " $$mod "; then docker build -q --target test services/$$mod >/dev/null && echo "tests + lint passed (in Docker)"; \
	  elif [ -d services/$$mod ]; then (cd services/$$mod && uv run --quiet --group dev pytest -q); \
	  else echo "unknown module: $$mod"; exit 1; fi; done

.PHONY: lint
lint: ## Lint: make lint m=<module> (all if empty)
	@set -e; for mod in $(if $(m),$(m),$(PY_MODULES) web); do echo "==> $$mod"; \
	  if [ "$$mod" = "web" ]; then (cd apps/web && { [ -d node_modules ] || npm ci --silent; } && npm run --silent lint); \
	  elif echo " $(DOCKER_TEST_MODULES) " | grep -q " $$mod "; then docker build -q --target test services/$$mod >/dev/null && echo "tests + lint passed (in Docker)"; \
	  elif [ -d services/$$mod ]; then (cd services/$$mod && uv run --quiet --group dev ruff check . && uv run --quiet --group dev ruff format --check .); \
	  else echo "unknown module: $$mod"; exit 1; fi; done

.PHONY: contracts api-client seed-data deploy-server
contracts: ; @echo "not implemented yet (task M0.3)"; exit 1
api-client: ; @echo "not implemented yet (task M7.1/M9.1)"; exit 1
seed-data: ; @echo "not implemented yet (task M5.2)"; exit 1
deploy-server: ; @echo "not implemented yet (task M11.5)"; exit 1

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make <target> [s=<service>] [m=<module>]\n"} \
	  /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2 } \
	  /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
