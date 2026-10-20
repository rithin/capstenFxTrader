---
description: Finish a task - lint, test, commit, PR text, move card to In review
argument-hint: <task-id>
---
Finish task $ARGUMENTS.

1. Run `make lint m=<module>` and `make test m=<module>` for this task's module. Fix failures and rerun.
   If a target doesn't exist yet, run the module's ruff/pytest or lint/test scripts directly.
2. Show `git diff --stat`. Flag any file changed outside the task's module or in shared contract files.
3. Commit with a conventional message (`feat(<module>): ...`) that references $ARGUMENTS.
4. Get the issue number from `docs/team/issue_map.json`. Print a PR description: what changed, how to test it,
   follow-ups for the other developer, and `Closes #<n>`. Don't push unless I say so.
5. When I say push: push, `gh pr create` with that body, then move the card to **In review**
   (same `gh project item-edit` call as `/start-task`, option id `df73e18b`). Merging the PR closes the issue.
