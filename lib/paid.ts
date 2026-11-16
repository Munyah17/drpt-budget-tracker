/**
 * Shared subscription truth — pure functions, safe for client AND server.
 * A "paid" profile is active only while paid_until is in the future
 * (or null, for legacy/exempt accounts like admin and demo users).
 */
export const SUBSCRIPTION_MONTHS = 1;

export interface PaidRow {
  is_paid?: boolean | null;
  paid_until?: string | null;
  /** Manual Super Admin override: "paid" | "unpaid" | null/undefined = auto. */
  paid_override?: string | null;
}

/** Active paying member. A manual override always wins over auto billing. */
export function paidActive(p: PaidRow | null | undefined): boolean {
  if (!p) return false;
  if (p.paid_override === "paid") return true;
  if (p.paid_override === "unpaid") return false;
  if (p.is_paid !== true) return false;
  if (!p.paid_until) return true;
  return new Date(p.paid_until).getTime() > Date.now();
}

/**
 * Renewal: extend the current expiry when it's still in the future,
 * otherwise start a fresh month from now.
 */
export function nextPaidUntil(currentPaidUntil?: string | null): string {
  const now = Date.now();
  const cur = currentPaidUntil ? new Date(currentPaidUntil).getTime() : NaN;
  const base = Number.isFinite(cur) && cur > now ? cur : now;
  const d = new Date(base);
  d.setMonth(d.getMonth() + SUBSCRIPTION_MONTHS);
  return d.toISOString();
}
