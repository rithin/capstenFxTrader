import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelProps = {
  title?: ReactNode;
  /** Small count badge next to the title, e.g. number of open positions. */
  count?: number;
  actions?: ReactNode;
  /** Remove inner padding, e.g. for edge-to-edge tables. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

export function Panel({ title, count, actions, flush, className, children, ...rest }: PanelProps) {
  return (
    <section
      aria-label={rest["aria-label"] ?? (typeof title === "string" ? title : undefined)}
      className={cn("flex min-w-0 flex-col rounded-2xl border bg-panel", flush ? "overflow-hidden" : "gap-3.5 p-5", className)}
    >
      {(title || actions) && (
        <header className={cn("flex flex-wrap items-center gap-3", flush && "px-5 pt-4 pb-2")}>
          {title && <h2 className="font-heading text-lg font-semibold">{title}</h2>}
          {count !== undefined && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted">{count}</span>
          )}
          <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div>
        </header>
      )}
      {children}
    </section>
  );
}
