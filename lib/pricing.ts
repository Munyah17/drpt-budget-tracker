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

/** Price in cents that the client is charged, grossed up so we net $1. */
export function priceCents(method: PaymentChannel): number {
  const rate =
    STORE_RATE +
    (method === "stripe" ? STRIPE_FEE_RATE : method === "paynow" ? PAYNOW_FEE_RATE : 0);
  const fixed = method === "stripe" ? STRIPE_FEE_FIXED : 0;
  const transfer = method === "ecocash" || method === "bank" ? TRANSFER_FEE_USD : 0;
  // gross = (net + fixed) / (1 - total rate), rounded UP to the cent
  return Math.ceil(((NET_PRICE_USD + fixed) / (1 - rate)) * 100 - 1e-9) + Math.round(transfer * 100);
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
