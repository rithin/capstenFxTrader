import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "info" | "warning" | "danger";

const pillTone: Record<PillTone, string> = {
  neutral: "bg-surface text-ink-soft",
  info: "bg-gain-bg text-gain-strong",
  warning: "bg-clay-bg text-loss-strong",
  danger: "bg-loss-bg text-loss-strong ring-1 ring-loss/40",
};

/** Small status label, e.g. "Completed", "Running", "Failed". The text carries the meaning. */
export function StatusPill({ tone = "neutral", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap", pillTone[tone], className)}>
      {children}
    </span>
  );
}

export type Side = "long" | "short" | "buy" | "sell";

/** Long/Buy in blue, Short/Sell in rust, always spelled out. */
export function SidePill({ side }: { side: Side }) {
  const positive = side === "long" || side === "buy";
  return (
    <StatusPill tone={positive ? "info" : "warning"}>{side.charAt(0).toUpperCase() + side.slice(1)}</StatusPill>
  );
}

/** Dot + label, e.g. strategy state or connection status. */
export function StatusDot({ state, children }: { state: "ok" | "paused" | "down"; children: ReactNode }) {
  const dot = { ok: "bg-gain", paused: "bg-neutral-dot", down: "bg-loss" }[state];
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}
