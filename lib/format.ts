import { Currency } from "./types";

export const DEFAULT_CURRENCY: Currency = "USD";

/** Currency used by the shorthand formatters — synced from AppDataContext */
let activeCurrency: Currency = DEFAULT_CURRENCY;

/** Called by AppDataProvider whenever the selected currency changes */
export function setActiveCurrency(c: Currency) {
  if (c) activeCurrency = c;
}

/** Format in the currently active currency */
export function fmt(n: number): string {
  return formatCurrency(n, activeCurrency);
}

/** Symbol of the currently active currency */
export function sym(): string {
  return currencySymbol(activeCurrency);
}

/** Display symbol for a currency code, e.g. "$" for USD, "₦" for NGN */
export function currencySymbol(currency: Currency): string {
  try {
    const part = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}

/**
 * Format an amount in any ISO 4217 currency using the platform's locale-aware
 * formatter — correct symbol, position and minor-unit decimals per currency
 * (e.g. JPY renders with 0 decimals, KWD with 3).
 */
export function formatCurrency(n: number, currency: Currency = DEFAULT_CURRENCY): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(n);
  } catch {
    // Unknown/invalid code — fall back to a plain code prefix
    return `${currency} ${n.toFixed(2)}`;
  }
}

/**
 * @deprecated Legacy name kept for old call sites — identical to `fmt`,
 * formats in the currently active currency.
 */
export function gbp(n: number): string {
  return fmt(n);
}

export function ukDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 1 || /[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
