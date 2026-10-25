import { type Currency, formatSignedMoney, formatSignedPercent, tone } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneClass = { gain: "text-gain", loss: "text-loss", neutral: "text-ink" } as const;

type PnlTextProps = {
  value: string | number;
  currency?: Currency;
  /** Show as a percentage instead of money. */
  percent?: boolean;
  className?: string;
};

/** Signed P&L: blue for gains, rust for losses, and always a +/− sign (never colour alone). */
export function PnlText({ value, currency = "INR", percent, className }: PnlTextProps) {
  const text = percent ? formatSignedPercent(value) : formatSignedMoney(value, currency);
  return <span className={cn("num whitespace-nowrap", toneClass[tone(value)], className)}>{text}</span>;
}
