import { cn } from "@/lib/utils";

type MeterProps = {
  /** 0–100 */
  value: number;
  label: string;
  tone?: "accent" | "gain" | "loss";
  className?: string;
};

const fill = { accent: "bg-clay", gain: "bg-gain", loss: "bg-loss" } as const;

/** Usage bar, e.g. how much of a risk limit is used. The numbers are always shown next to it. */
export function Meter({ value, label, tone = "accent", className }: MeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-1.5 overflow-hidden rounded-full bg-border-soft", className)}
    >
      <div className={cn("h-full rounded-full", fill[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

type LimitMeterProps = { label: string; value: string; pct: number; tone?: MeterProps["tone"] };

/** Label + value line above a meter, as in the Risk limits panel. */
export function LimitMeter({ label, value, pct, tone }: LimitMeterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="num text-ink">{value}</span>
      </div>
      <Meter value={pct} label={label} tone={tone} />
    </div>
  );
}
