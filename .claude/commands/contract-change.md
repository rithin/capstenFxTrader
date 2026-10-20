---
description: Change a shared contract (event/command/job schema or API surface) safely
argument-hint: <what to change>
---
Contract change: $ARGUMENTS

This touches files both developers depend on. Keep it to its own small PR.

1. Edit the Pydantic models in `packages/contracts`. Prefer **additive** changes (new optional fields). For a breaking
   change, bump `schema_version` and say which consumers must update.
2. Update the matching table in `docs/ARCHITECTURE.md` (§3 streams, §4 commands, §5 API).
3. Regenerate the JSON schema and TS types (`make contracts`), and run the contracts tests.
4. Update `scripts/fake_events.py` so the fake publisher emits the new shape.
5. List the producers and consumers affected (trading-node, recorder, api, web, backtest-worker) and the owner of each.
6. Commit as `feat(contracts): ...` on its own branch. Tell me to ask the other developer to review before merging.
