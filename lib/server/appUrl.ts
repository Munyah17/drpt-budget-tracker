/** Public site origin for links in emails and provider callbacks. */
const configured = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://wellspend.site"
).replace(/\/+$/, "");

// Guard: a localhost APP_URL in a deployed env silently breaks EVERY link
// we email users (receipts, payment-failure CTAs, billing-portal returns).
// wellspend.site is the canonical host — localhost can never be right here.
export const APP_URL = /localhost|127\.0\.0\.1/.test(configured)
  ? "https://wellspend.site"
  : configured;

export type ConfirmationType = "signup" | "payment" | "account";

/** Landing page for links that follow a completed signup or payment. */
export function confirmationUrl(type: ConfirmationType): string {
  return `${APP_URL}/confirmed?type=${type}`;
}
