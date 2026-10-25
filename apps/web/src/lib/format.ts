// Display formatting for money, prices and P&L.
// Values arrive from the API as decimal strings (never floats). Intl.NumberFormat formats strings
// exactly, so no precision is lost on the way to the screen.

export type Currency = "INR" | "USD" | "USDT";
export type Tone = "gain" | "loss" | "neutral";
type Numeric = string | number;

const MINUS = "−"; // typographic minus: the sign is part of the meaning, never colour alone

function locale(currency: Currency): string {
  return currency === "INR" ? "en-IN" : "en-US"; // en-IN groups as lakh/crore: 10,04,821.50
}

function fmt(value: Numeric, opts: Intl.NumberFormatOptions, loc = "en-US"): string {
  // Intl accepts decimal strings exactly (ES2023); the cast satisfies older lib typings.
  return new Intl.NumberFormat(loc, opts).format(value as number);
}

function isNegative(value: Numeric): boolean {
  return String(value).trim().startsWith("-");
}

function isZero(value: Numeric): boolean {
  return /^[-+]?0*(\.0*)?$/.test(String(value).trim());
}

function abs(value: Numeric): string {
  return String(value).trim().replace(/^[-+]/, "");
}

export function tone(value: Numeric): Tone {
  if (isZero(value)) return "neutral";
  return isNegative(value) ? "loss" : "gain";
}

/** ₹10,04,821.50 · $1,234.00 · 1,234.00 USDT */
export function formatMoney(value: Numeric, currency: Currency = "INR", digits = 2): string {
  const body = fmt(abs(value), { minimumFractionDigits: digits, maximumFractionDigits: digits }, locale(currency));
  const sign = isNegative(value) && !isZero(value) ? MINUS : "";
  if (currency === "USDT") return `${sign}${body} USDT`;
  return `${sign}${currency === "INR" ? "₹" : "$"}${body}`;
}

/** Always signed: +₹482.15 · −₹36.35 · ₹0.00 */
export function formatSignedMoney(value: Numeric, currency: Currency = "INR", digits = 2): string {
  const t = tone(value);
  const unsigned = formatMoney(abs(value), currency, digits);
  return t === "gain" ? `+${unsigned}` : t === "loss" ? `${MINUS}${unsigned}` : unsigned;
}

/** +0.48% · −1.20% */
export function formatSignedPercent(value: Numeric, digits = 2): string {
  const t = tone(value);
  const body = fmt(abs(value), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${t === "gain" ? "+" : t === "loss" ? MINUS : ""}${body}%`;
}

/** Plain number with fixed decimals, e.g. prices: 24,512.35 */
export function formatNumber(value: Numeric, digits = 2, currency: Currency = "INR"): string {
  const sign = isNegative(value) && !isZero(value) ? MINUS : "";
  return sign + fmt(abs(value), { minimumFractionDigits: digits, maximumFractionDigits: digits }, locale(currency));
}

/** Integer quantities, e.g. lots or units: 1,00,000 */
export function formatQuantity(value: Numeric, currency: Currency = "INR"): string {
  return fmt(value, { maximumFractionDigits: 8 }, locale(currency));
}
