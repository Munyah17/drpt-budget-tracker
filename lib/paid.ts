/**
 * Shared subscription truth — pure functions, safe for client AND server.
 * A "paid" profile is active only while paid_until is in the future
 * (or null, for legacy/exempt accounts like admin and demo users).
 */
export const SUBSCRIPTION_DAYS = 365;

export interface PaidRow {
  is_paid?: boolean | null;
  paid_until?: string | null;
}

/** Active paying member: is_paid AND (no expiry recorded OR expiry in the future). */
export function paidActive(p: PaidRow | null | undefined): boolean {
  if (!p || p.is_paid !== true) return false;
  if (!p.paid_until) return true;
  return new Date(p.paid_until).getTime() > Date.now();
}

/**
 * Renewal: extend the current expiry when it's still in the future,
 * otherwise start a fresh year from now.
 */
export function nextPaidUntil(currentPaidUntil?: string | null): string {
  const now = Date.now();
  const cur = currentPaidUntil ? new Date(currentPaidUntil).getTime() : NaN;
  const base = Number.isFinite(cur) && cur > now ? cur : now;
  return new Date(base + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
