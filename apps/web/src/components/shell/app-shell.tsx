import Link from "next/link";
import type { ReactNode } from "react";

import { KillSwitchButton } from "./kill-switch-button";
import { NavTabs } from "./nav-tabs";
import { type Connection, ConnectionStatus, ModeBadge, type TradingMode } from "./status-bits";

type AppShellProps = {
  mode: TradingMode;
  connections: Connection[];
  /** Initials for the avatar. */
  user?: string;
  /** Footer status strip content (FooterItem elements). */
  footer?: ReactNode;
  children: ReactNode;
};

/** Full-width page frame: top bar (brand, nav, mode, connections, kill switch), content, status footer. */
export function AppShell({ mode, connections, user = "RC", footer, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-ivory text-ink">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-8 border-b bg-surface px-4 py-3.5 sm:px-7">
        <Link href="/" className="flex items-baseline gap-2.5 text-ink no-underline">
          <span className="font-heading text-[22px] font-semibold tracking-tight">Capsten</span>
          <span className="hidden text-xs text-ink-muted sm:inline">Trader</span>
        </Link>
        <NavTabs />
        <div className="ms-auto flex flex-wrap items-center gap-3 lg:ms-0">
          <ModeBadge mode={mode} />
          {/* Phones: just mode + kill switch beside the brand; connections show from sm up and on /brokers */}
          <div className="hidden flex-wrap items-center gap-3 sm:flex">
            {connections.map((c) => (
              <ConnectionStatus key={c.broker} {...c} />
            ))}
          </div>
          <KillSwitchButton />
          <span
            aria-label={`Signed in as ${user}`}
            className="hidden size-9 items-center justify-center rounded-full bg-clay-strong sm:inline-flex text-[13px] font-semibold text-panel"
          >
            {user}
          </span>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-5 px-4 py-6 sm:px-7">{children}</main>

      {footer && (
        <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t bg-surface px-4 py-2.5 text-xs text-ink-muted sm:px-7">
          {footer}
        </footer>
      )}
    </div>
  );
}
