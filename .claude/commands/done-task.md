---
description: Finish a task - lint, test, update TASKS.md, draft commit and PR text
argument-hint: <task-id>
---
Finish task $ARGUMENTS.

1. Run `make lint m=<module>` and `make test m=<module>` for the module this task belongs to. Fix failures and rerun.
   If a target doesn't exist yet, run the module's own ruff/pytest or lint/test scripts directly.
2. Show `git diff --stat`. Flag any file changed outside the task's module or in shared contract files.
3. Mark $ARGUMENTS `[x]` in `docs/team/TASKS.md`.
4. Commit with a conventional message (`feat(<module>): ...`), referencing $ARGUMENTS.
5. Print a PR description: what changed, how to test it, and any follow-ups for the other developer. Don't push unless I say so.
