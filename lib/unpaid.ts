/**
 * Unpaid accounts are TEMPORARY: they exist only while the user arranges
 * payment. If payment isn't completed within the grace window, the account
 * is discarded. Default 7 days — override with NEXT_PUBLIC_UNPAID_GRACE_DAYS.
 */
export const UNPAID_GRACE_DAYS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_UNPAID_GRACE_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 7;
})();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True when the account is unpaid AND older than the grace window — i.e. it
 * should be discarded. `isPaid` must already be the paidActive() result
 * (paid AND not expired). Accounts without a createdAt stamp are treated as
 * fresh (not expired) so legacy/demo profiles are never swept by mistake.
 */
export function isUnpaidExpired(p: {
  isPaid?: boolean;
  paidUntil?: string | null;
  createdAt?: string;
  platform?: string;
}): boolean {
  if (p.isPaid === true) return false;
  // iOS free tier is a permanent tier (no in-app purchase per App Store
  // rules) — those accounts are not temporary payment-pending accounts.
  if (p.platform === "ios") return false;
  if (!p.createdAt) return false;
  const created = new Date(p.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created > UNPAID_GRACE_DAYS * DAY_MS;
}
