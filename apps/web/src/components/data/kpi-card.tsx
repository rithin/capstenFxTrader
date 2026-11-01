import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Meter } from "./meter";

type KpiCardProps = {
  label: string;
  /** Pre-formatted value, or a <PnlText>. */
  value: ReactNode;
  sub?: ReactNode;
  /** Optional usage meter (0–100), e.g. daily loss limit used. */
  meter?: { pct: number; tone?: "accent" | "gain" | "loss" };
  className?: string;
};

export function KpiCard({ label, value, sub, meter, className }: KpiCardProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 rounded-2xl border bg-panel px-4.5 py-4", className)}>
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="num truncate text-[22px] leading-tight font-medium">{value}</span>
      {meter && <Meter value={meter.pct} tone={meter.tone} label={label} className="mt-0.5" />}
      {sub && <span className="text-xs text-ink-muted">{sub}</span>}
    </div>
  );
}

/** Responsive row of KPI cards. */
export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Account summary" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      {children}
    </section>
  );
}
