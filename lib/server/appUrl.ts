/** Public site origin for links in emails and provider callbacks. */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://wellspend.site"
).replace(/\/+$/, "");

export type ConfirmationType = "signup" | "payment" | "account";

/** Landing page for links that follow a completed signup or payment. */
export function confirmationUrl(type: ConfirmationType): string {
  return `${APP_URL}/confirmed?type=${type}`;
}
