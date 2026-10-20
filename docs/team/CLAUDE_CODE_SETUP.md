# Claude Code Setup & Working Rules

For both developers. Goal: fast vibe coding with **low token use** and **no stepping on each other**.

## 1. One-time install

Language servers and tools that the plugins and skills call:

```bash
# Python
curl -LsSf https://astral.sh/uv/install.sh | sh
npm i -g pyright
# TypeScript
npm i -g typescript typescript-language-server
# Dependency maps (used by /map)
npm i -g dependency-cruiser madge
uv tool install pydeps          # needs graphviz: brew install graphviz
# Local k3s
brew install k3d kubectl
```

Plugins from Anthropic's official marketplace (`claude-plugins-official`). Run inside Claude Code:

| Plugin | Why we want it | Token effect |
|---|---|---|
| `pyright-lsp` | Python go-to-definition, references, type errors via LSP | High saving: symbol lookups instead of reading files |
| `typescript-lsp` | Same for the Next.js app | High saving |
| `serena` | Semantic code navigation and editing (find symbol, find references, overview of a file's symbols) | High saving: the biggest win on a large repo |
| `context7` | Up-to-date library docs on demand (Next.js, FastAPI, Nautilus, shadcn) | Saves reading `vendor/` or the web |
| `feature-dev` | Structured explore → plan → implement → review workflow for a feature | Fewer wasted iterations |
| `frontend-design` | Better-looking UI output for `apps/web` (Dev B) | n/a |
| `code-review` | Review a diff/PR before merge | n/a |
| `commit-commands` | Commit/PR helpers | Small |
| `claude-md-management` | Keeps `CLAUDE.md` lean and current | Keeps every session's base context small |
| `security-guidance` | Flags secrets and insecure patterns while editing (we handle broker keys) | n/a |
| `playwright` | Drive the browser for UI checks (Dev B, M9.8) | Install only on Dev B's machine if not needed |
| `session-report` | See where tokens went in a session | Lets you find waste |

```text
/plugin install pyright-lsp@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
/plugin install serena@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
/plugin install claude-md-management@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/plugin install session-report@claude-plugins-official
/plugin install playwright@claude-plugins-official      # Dev B
```

After installing, run `/plugin` to confirm they're enabled. Then run `/mcp` to check that serena, context7 and playwright are connected.

### Dependency trees & mind maps
No plugin is needed. The `/map` command (in `.claude/commands/map.md`) runs local tools and writes **small Mermaid
files** to `docs/maps/`. GitHub and VS Code render them, and Claude can read a 40-line map instead of 40 source files.

| Tool | Scope | Output |
|---|---|---|
| `dependency-cruiser` | `apps/web` module dependencies | Mermaid (`--output-type mermaid`) |
| `madge` | TS circular-dependency check | text |
| `pydeps` | Python service import graph | SVG (humans) / `--show-deps` JSON (Claude) |
| Hand-kept Mermaid mind map | Feature → module → files | `docs/maps/overview.md` |

## 2. Daily working rules (token discipline)

1. **One task = one session.** `/start-task M7.3` → work → `/done-task M7.3` → `/handoff` → `/clear`.
2. **`/clear` between unrelated tasks.** Use `/compact` only when you must keep context mid-task.
3. **Plan mode first** (Shift+Tab) for anything touching more than 3 files. Approve the plan, then execute.
4. **Point, don't ask it to search.** Say "edit `services/api/app/routes/trades.py`", not "find where trades are handled".
5. **Never let it browse `vendor/`.** Nautilus questions go to context7 first, then one specific doc file.
6. **Model choice:** use Sonnet for routine coding and tests. Switch to Opus (`/model`) for architecture, contracts and
   risk-manager logic. Lower effort for boilerplate.
7. **No swarms for normal work.** Multi-agent orchestration multiplies tokens. Use at most one Explore subagent for
   wide searches.
8. **Keep `CLAUDE.md` short.** It loads every session. Put details in skills, which load only when relevant.
9. **Paste errors, not whole logs.** `make logs s=api | tail -50`.
10. **Run `/session-report`** once a week to spot waste.

## 3. Collaboration rules (two people, one repo)

- Branch per task: `<a|b>/<task-id>-name`. PR to `main`, and the other developer reviews (use `/code-review`).
- **You own your modules.** Don't edit the other person's module; open an issue or message them instead.
- **Shared files:** `packages/contracts/**`, `docs/ARCHITECTURE.md`, root `Makefile`, `deploy/k8s/base/kustomization.yaml`.
  Change them only through `/contract-change`, as a small PR on its own, and merge it first.
- Rebase on `main` at the start of every session.
- Update the task status in `docs/team/TASKS.md` in the same PR as the work.
- `/handoff` notes go in `docs/team/handoff/YYYY-MM-DD-<a|b>-<task>.md`. Keep them under 30 lines; they're what
  your next session (and your partner) reads instead of re-exploring.

## 4. Project commands (`.claude/commands/`)

| Command | What it does |
|---|---|
| `/start-task <ID>` | Reads that task row + its dependencies, checks they're done, creates the branch, proposes a plan |
| `/done-task <ID>` | Runs module lint/tests, updates TASKS.md, drafts the commit/PR text |
| `/handoff` | Writes the short session note |
| `/contract-change <desc>` | Edits contracts safely: models + ARCHITECTURE.md + regenerated TS types + bumped `schema_version` |
| `/map <module>` | Regenerates dependency maps for a module into `docs/maps/` |

## 5. Project skills (`.claude/skills/`, auto-loaded when relevant)

| Skill | Loaded when |
|---|---|
| `nautilus-strategy` | Writing strategies, trade/risk manager, backtests (Dev A) |
| `api-endpoint` | Adding FastAPI routes, models, migrations (Dev B) |
| `ui-page` | Adding Next.js pages/components (Dev B) |
| `k8s-component` | Adding or changing a deployable service (both) |

## 6. Updating the Nautilus reference copy

The upstream source lives at `vendor/nautilus_trader`. Merge updates as a subtree:

```bash
git fetch upstream
git merge -X subtree=vendor/nautilus_trader upstream/develop
```

Our services do **not** use this copy at runtime. Bump the pinned pip version in `services/*/pyproject.toml` separately.
