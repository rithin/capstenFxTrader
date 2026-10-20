#!/usr/bin/env bash
# Checks local prerequisites for `make install`. Exits non-zero with install hints if something is missing.
set -uo pipefail

fail=0
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
bad()  { printf "  \033[31m✗\033[0m %s\n      → %s\n" "$1" "$2"; fail=1; }

echo "Checking prerequisites..."

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  mem_gb=$(( $(docker info --format '{{.MemTotal}}') / 1024 / 1024 / 1024 ))
  ok "Docker running (${mem_gb} GB available to Docker)"
  [ "$mem_gb" -lt 6 ] && echo "      ! Docker Desktop has < 6 GB RAM; raise it in Settings → Resources if pods get OOM-killed"
else
  bad "Docker Desktop not running" "Start Docker Desktop (https://www.docker.com/products/docker-desktop/)"
fi

if command -v k3d >/dev/null 2>&1; then ok "k3d $(k3d version | head -1 | awk '{print $3}')"
else bad "k3d not installed" "macOS: brew install k3d   ·   Linux/WSL: curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash"; fi

if command -v kubectl >/dev/null 2>&1; then ok "kubectl $(kubectl version --client -o json 2>/dev/null | grep -m1 gitVersion | cut -d'"' -f4)"
else bad "kubectl not installed" "macOS: brew install kubectl   ·   https://kubernetes.io/docs/tasks/tools/"; fi

if command -v lsof >/dev/null 2>&1 && ! k3d cluster list 2>/dev/null | grep -q '^capsten '; then
  for p in 80 5111; do
    if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then
      bad "Port $p is in use" "Free port $p (used for ingress/registry) or stop the process using it"
    fi
  done
fi

[ $fail -eq 0 ] && echo "All prerequisites OK." || { echo "Fix the items above and re-run make install."; exit 1; }
