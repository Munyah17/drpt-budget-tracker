import { Currency, CURRENCY_SYMBOLS } from "./data";

export function formatCurrency(n: number, currency: Currency = "GBP"): string {
  const neg = n < 0;
  n = Math.abs(n);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return (neg ? "-" : "") + symbol + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function gbp(n: number): string {
  return formatCurrency(n, "GBP");
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
