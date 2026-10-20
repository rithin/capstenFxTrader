---
description: Regenerate compact dependency maps for a module into docs/maps/
argument-hint: <web|api|recorder|trading-node|backtest-worker|all>
---
Regenerate dependency maps for: $ARGUMENTS

- web: `npx depcruise apps/web/src --include-only "^apps/web/src" --output-type mermaid > docs/maps/web.mmd`,
  then `npx madge --circular --extensions ts,tsx apps/web/src` and report any cycles.
- Python service X: `pydeps services/X --max-bacon 2 --cluster --noshow -o docs/maps/X.svg` (for humans), and
  `pydeps services/X --show-deps --no-output --max-bacon 2` → condense into a Mermaid `graph LR` of package-level
  edges only in `docs/maps/X.mmd` (keep it under 60 lines).
- Then refresh `docs/maps/overview.md`: a Mermaid `mindmap` of feature → module → key files. Keep it under 80 lines.

Don't paste the maps back to me. Report only the cycles, the orphans, and the changes since the last map.
