---
description: Start a task from docs/team/TASKS.md (checks deps, creates branch, plans)
argument-hint: <task-id e.g. M7.3>
---
Start task $ARGUMENTS.

1. Read ONLY the row for $ARGUMENTS and the rows of its dependencies in `docs/team/TASKS.md` (use grep, not a full read).
   If any dependency is not `[x]`, tell me which ones and stop, unless I can stub around them (say how).
2. Read the newest file in `docs/team/handoff/` for this module, if one exists. Read the relevant section of `docs/ARCHITECTURE.md`.
3. `git fetch && git rebase origin/main`, then create the branch `<a|b>/$ARGUMENTS-<short-name>` (A for M1–M6, B for M7–M11).
4. Mark the task `[~]` in TASKS.md.
5. Give a plan of at most 8 bullets: files to create/change, tests to add, and anything that touches shared contracts
   (if it does, say we must run `/contract-change` first). Wait for my OK before coding.
