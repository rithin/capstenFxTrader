#!/usr/bin/env bash
# Writes the local overlay's secret inputs from the root .env (creating .env from .env.example if missing).
# Output goes to deploy/k8s/overlays/local/secrets/ (git-ignored).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$root/.env"
out="$root/deploy/k8s/overlays/local/secrets"

if [ ! -f "$env_file" ]; then
  cp "$root/.env.example" "$env_file"
  echo "Created .env from .env.example (sandbox defaults). Edit it to change passwords."
fi

mkdir -p "$out"
# Only KEY=VALUE lines; strip comments and blanks.
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$env_file" > "$out/app.env"

# shellcheck disable=SC1090
set -a; . "$env_file"; set +a
cat > "$out/s3.json" <<EOF
{
  "identities": [
    {
      "name": "capsten",
      "credentials": [{"accessKey": "${S3_ACCESS_KEY}", "secretKey": "${S3_SECRET_KEY}"}],
      "actions": ["Admin", "Read", "Write", "List", "Tagging"]
    }
  ]
}
EOF
chmod 600 "$out/app.env" "$out/s3.json"
echo "Local secrets written to deploy/k8s/overlays/local/secrets/"
