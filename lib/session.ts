/**
 * Session freshness — persisted logins expire after 3 days without opening
 * the app, so abandoned devices never stay signed in forever. The stamp is
 * refreshed on every app open (sliding window) and cleared on logout.
 */
export const SESSION_AT_KEY = "drpatie-session-at";
export const SESSION_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/** The stamp follows the remember-me routing: localStorage when remembered,
 *  sessionStorage otherwise (mirrors lib/supabase.ts authStorage). */
function stampStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("drpatie-remember") === "1" ? localStorage : sessionStorage;
}

export function readSessionStamp(): number {
  const s = stampStorage();
  return s ? Number(s.getItem(SESSION_AT_KEY) ?? 0) || 0 : 0;
}

export function touchSession(): void {
  stampStorage()?.setItem(SESSION_AT_KEY, String(Date.now()));
}

export function clearSessionStamp(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_AT_KEY);
  sessionStorage.removeItem(SESSION_AT_KEY);
}

/** True when a persisted session has been idle longer than the 3-day window.
 *  A missing stamp is NOT stale — it just means the session predates the
 *  freshness tracking and gets stamped on its next verified open. */
export function sessionStale(): boolean {
  const at = readSessionStamp();
  return at > 0 && Date.now() - at > SESSION_MAX_AGE_MS;
}
