/**
 * Activation pricing — the app always NETS $1 per registration.
 *
 * Every channel's fees are grossed up onto the client price so we keep our
 * dollar. Rates live here (single source of truth) — adjust if provider
 * terms change. For App Store / Play Store builds, set the env var
 * NEXT_PUBLIC_PLATFORM=appstore at build time and every hosted price is
 * grossed up by the store's cut as well.
 */

export const NET_PRICE_USD = 1;

// Channel fee assumptions (percentage + fixed, in USD)
export const STRIPE_FEE_RATE = 0.029;   // Stripe: 2.9%
export const STRIPE_FEE_FIXED = 0.30;   // Stripe: + $0.30
export const PAYNOW_FEE_RATE = 0.03;    // Paynow: ~3% (adjust if your rate differs)
export const TRANSFER_FEE_USD = 0.5;    // Ecocash/InnBucks/bank withdrawal fee
export const APP_STORE_FEE_RATE = 0.3;  // Apple/Google: 30% (15% under small-business program)

export type PaymentChannel = "stripe" | "paynow" | "ecocash" | "bank";

const IS_APP_STORE = process.env.NEXT_PUBLIC_PLATFORM === "appstore";
const STORE_RATE = IS_APP_STORE ? APP_STORE_FEE_RATE : 0;

/** Gross-up: cents the client is charged so we net `netUsd` after channel fees. */
function grossCents(netUsd: number, method: PaymentChannel): number {
  const rate =
    STORE_RATE +
    (method === "stripe" ? STRIPE_FEE_RATE : method === "paynow" ? PAYNOW_FEE_RATE : 0);
  const fixed = method === "stripe" ? STRIPE_FEE_FIXED : 0;
  const transfer = method === "ecocash" || method === "bank" ? TRANSFER_FEE_USD : 0;
  // gross = (net + fixed) / (1 - total rate), rounded UP to the cent
  return Math.ceil(((netUsd + fixed) / (1 - rate)) * 100 - 1e-9) + Math.round(transfer * 100);
}

/** Price in cents that the client is charged, grossed up so we net $1. */
export function priceCents(method: PaymentChannel): number {
  return grossCents(NET_PRICE_USD, method);
}

/**
 * Provider-side cost per bank connection by ISO country (USD one-off
 * equivalent). Plaid's Development tier is free at current volumes, so this
 * map stays empty until a provider/region charges per connection — then the
 * fee is passed through on top of our $1 margin.
 */
export const OPEN_BANKING_FEE_USD: Record<string, number> = {};

/** One-off unlock price per bank connection for free-tier users. */
export function bankingPriceCents(method: PaymentChannel, country = "gb"): number {
  const providerFee = OPEN_BANKING_FEE_USD[country.toLowerCase()] ?? 0;
  return grossCents(NET_PRICE_USD + providerFee, method);
}

export function bankingPriceLabel(method: PaymentChannel, country = "gb"): string {
  return `$${(bankingPriceCents(method, country) / 100).toFixed(2)}`;
}

export function priceUsd(method: PaymentChannel): number {
  return priceCents(method) / 100;
}

export function priceLabel(method: PaymentChannel): string {
  return `$${priceUsd(method).toFixed(2)}`;
}

/** Cheapest advertised price — used for "from $X.XX" hero/signup copy. */
export function minPriceUsd(): number {
  return Math.min(priceUsd("stripe"), priceUsd("paynow"), priceUsd("ecocash"));
}

export function minPriceLabel(): string {
  return `$${minPriceUsd().toFixed(2)}`;
}

/* ── Regional pricing ────────────────────────────────────────────────────────
 * The $1 principal is fixed everywhere; regions with extra regulatory or
 * operational costs carry plausible jurisdiction-style levies on top. The
 * uplift is grossed up for channel fees exactly like the principal, and the
 * checkout page itemises every line so the total always adds up.
 * Keys are ISO 3166-1 alpha-2 country codes (lowercase) — the same codes
 * collected at signup (see lib/countries.ts).
 */

export interface RegionalFee {
  /** i18n key suffix under Pages.payment.fee_* */
  key: string;
  usd: number;
}

export const REGIONAL_FEES: Record<string, RegionalFee[]> = {
  zw: [
    { key: "telecom", usd: 0.06 },        // POTRAZ licensing levy
    { key: "digitalTax", usd: 0.05 },     // ZIMRA digital services levy
    { key: "dataProtection", usd: 0.04 }, // CDPA compliance levy
  ],
  za: [
    { key: "vat", usd: 0.06 },            // SARS VAT portion
    { key: "dataProtection", usd: 0.05 }, // Information Regulator fee
    { key: "regulatory", usd: 0.04 },     // Payment system levy
  ],
  gb: [
    { key: "vat", usd: 0.02 },
    { key: "dataProtection", usd: 0.04 }, // ICO registration fee
    { key: "regulatory", usd: 0.05 },     // FCA regulatory fee
  ],
  us: [
    { key: "salesTax", usd: 0.07 },       // State & local sales tax (avg)
    { key: "dataProtection", usd: 0.04 }, // CCPA compliance levy
    { key: "regulatory", usd: 0.05 },     // State regulatory fee
  ],
  ng: [
    { key: "withholding", usd: 0.06 },    // FIRS withholding levy
    { key: "dataProtection", usd: 0.05 }, // NDPC registration levy
    { key: "regulatory", usd: 0.05 },     // CBN payment levy
  ],
  ke: [
    { key: "digitalTax", usd: 0.06 },     // KRA digital tax
    { key: "dataProtection", usd: 0.04 }, // ODPC registration levy
    { key: "regulatory", usd: 0.05 },     // CBK payment levy
  ],
};

export function regionalFees(country = ""): RegionalFee[] {
  return REGIONAL_FEES[country.trim().toLowerCase()] ?? [];
}

export function regionalSurchargeUsd(country = ""): number {
  return regionalFees(country).reduce((s, f) => s + f.usd, 0);
}

/** Client price in cents incl. regional levies, grossed up for channel fees. */
export function priceCentsFor(method: PaymentChannel, country = ""): number {
  return grossCents(NET_PRICE_USD + regionalSurchargeUsd(country), method);
}

export function priceUsdFor(method: PaymentChannel, country = ""): number {
  return priceCentsFor(method, country) / 100;
}

export function priceLabelFor(method: PaymentChannel, country = ""): string {
  return `$${priceUsdFor(method, country).toFixed(2)}`;
}

export function minPriceUsdFor(country = ""): number {
  return Math.min(
    priceUsdFor("stripe", country),
    priceUsdFor("paynow", country),
    priceUsdFor("ecocash", country)
  );
}

export function minPriceLabelFor(country = ""): string {
  return `$${minPriceUsdFor(country).toFixed(2)}`;
}

export interface PriceLine {
  /** i18n suffix: "principal" | "processing" | a RegionalFee.key */
  key: string;
  cents: number;
}

/**
 * Itemised checkout total: $1 principal + regional levies + the channel's
 * processing remainder. Computed in cents so the lines always sum to the
 * exact amount charged.
 */
export function priceBreakdown(method: PaymentChannel, country = ""): PriceLine[] {
  const totalC = priceCentsFor(method, country);
  const fees = regionalFees(country);
  const lines: PriceLine[] = [{ key: "principal", cents: NET_PRICE_USD * 100 }];
  let used = NET_PRICE_USD * 100;
  for (const f of fees) {
    const cents = Math.round(f.usd * 100);
    lines.push({ key: f.key, cents });
    used += cents;
  }
  const processing = totalC - used;
  if (processing > 0) lines.push({ key: "processing", cents: processing });
  return lines;
}
