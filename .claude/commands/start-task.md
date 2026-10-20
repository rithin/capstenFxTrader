---
description: Start a task (checks deps on the GitHub board, creates branch, moves card, plans)
argument-hint: <task-id e.g. M7.3>
---
Start task $ARGUMENTS.

1. Look up the issue number for $ARGUMENTS in `docs/team/issue_map.json`, then `gh issue view <n> --repo rithin/capstenFxTrader`.
   For each "Depends on" issue, check it's closed (`gh issue view <dep> --json state`). If any are open, list them and stop,
   unless I can stub around them (say how).
2. Read the relevant section of `docs/ARCHITECTURE.md` and the newest `docs/team/handoff/` note for this module (if any).
3. `git fetch && git rebase origin/main`, then create the branch `<a|b>/$ARGUMENTS-<short-name>` (A for M1–M6, B for M7–M11).
4. Assign me and move the card to **In progress**:
   `gh issue edit <n> --repo rithin/capstenFxTrader --add-assignee @me`, then
   `item=$(gh project item-list 1 --owner rithin --format json --limit 200 --jq '.items[] | select(.content.number==<n>) | .id')`
   (use gh's own `--jq`; don't `echo` the JSON into jq, because zsh's echo corrupts it)
   and `gh project item-edit --id $item --project-id PVT_kwHOAENYcc4Bn3pi --field-id PVTSSF_lAHOAENYcc4Bn3pizhmaST0 --single-select-option-id 47fc9ee4`.
5. Give a plan of at most 8 bullets: files, tests, and any shared-contract impact (if there is any, `/contract-change` comes first).
   Wait for my OK before coding.
