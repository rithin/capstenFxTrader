---
name: ui-page
description: Use when adding or changing pages, components, hooks, or styling in the Next.js app under apps/web.
---

# Next.js UI conventions (`apps/web`)

## Layout
- `src/app/(dashboard)/<area>/page.tsx` (areas: `live`, `trades`, `backtests`, `strategies`, `risk`, `brokers`, `alerts`).
- `src/components/ui/`: shadcn/ui primitives (base-nova style on Base UI: use `render={<El/>}`, not `asChild`; add them with
  `npx shadcn@latest add <component>`, never hand-copy).
- `src/components/shell/`: AppShell, NavTabs, ModeBadge, ConnectionStatus, KillSwitchButton, FooterItem.
- `src/components/data/`: Panel, KpiCard/KpiRow, Meter/LimitMeter, DataTable, StatusPill/SidePill/StatusDot, PnlText,
  EmptyState/TableSkeleton, ConfirmDialog, Workspace (content + right rail). See them all at `/dev/components`.
- `src/lib/theme.ts` + `src/app/globals.css`: colour tokens (kept in sync by tests). `src/lib/format.ts`: money/P&L formatting.
- `src/components/<area>/`: feature components. `src/lib/api/`: generated `schema.d.ts` + a typed fetch client.
- `src/lib/ws/useLiveStream.ts`: the single WebSocket hook. Components subscribe by channel. Don't open new sockets.

## Rules
- Server components by default. Use `"use client"` only for interactivity, live data, or forms.
- Data: TanStack Query for REST. Live updates merge into the query cache from `useLiveStream`.
- Types come only from the generated client. If a type is missing, the API needs changing (ask Dev B / `api-endpoint`).
- Money and prices are displayed with a shared `formatPrice(instrument, value)` helper. Never `toFixed` ad hoc.
- Dangerous actions (stop strategy, change risk limits, flatten, kill switch) always use a confirm dialog with a typed reason.
  The kill switch is visible in the top bar on every page.
- Every state is handled: loading skeleton, empty state, error with retry, disconnected-WebSocket banner.
- Look and feel = the approved design (`docs/ARCHITECTURE.md` §7): light ivory theme, clay accent, blue/rust for
  gains/losses with +/− signs, full-width fluid layout. Build from the M9.9 components (`src/components/ui`,
  `src/components/shell`); never hard-code colours, use the theme tokens. No dark theme unless asked.

## Checks
`make test m=web` (tsc + vitest) and `make test m=web-e2e` (build + Playwright in `apps/web/e2e/`). A new component
goes on `/dev/components`; a new colour goes in both theme.ts and globals.css (the contrast test must pass).
