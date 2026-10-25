import type { ReactNode } from "react";

import { StatusDot } from "@/components/data/pills";
import { cn } from "@/lib/utils";

export type TradingMode = "sandbox" | "paper" | "live";

/** SANDBOX / PAPER are calm; LIVE is deliberately loud so nobody mistakes it. */
export function ModeBadge({ mode }: { mode: TradingMode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase",
        mode === "live" ? "bg-loss text-panel ring-2 ring-loss-strong" : "bg-clay-bg text-loss-strong",
      )}
    >
      {mode === "live" ? "● Live money" : mode}
    </span>
  );
}

export type Connection = { broker: string; state: "connected" | "disconnected" | "login-required" };

export function ConnectionStatus({ broker, state }: Connection) {
  const label = {
    connected: `${broker} · connected`,
    disconnected: `${broker} · disconnected`,
    "login-required": `${broker} · login required`,
  }[state];
  return <StatusDot state={state === "connected" ? "ok" : state === "disconnected" ? "down" : "paused"}>{label}</StatusDot>;
}

/** One footer item: "Broker latency 38 ms". */
export function FooterItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span>
      {label} <span className="num text-ink">{children}</span>
    </span>
  );
}
