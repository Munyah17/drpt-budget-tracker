"use client";

/**
 * Lightweight product-analytics tracker. Fire-and-forget: sends events to
 * /api/track which stores them in the `activity_events` table for the admin
 * analytics page. Anonymous visitors get a stable random visitor id so the
 * funnel can be measured before signup. Never throws.
 */

const VISITOR_KEY = "drpatie-visitor";
const USER_KEY = "drpatie-user";

let cachedVisitorId: string | null = null;

export function getVisitorId(): string {
  if (cachedVisitorId) return cachedVisitorId;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    cachedVisitorId = id;
    return id;
  } catch {
    return "unknown";
  }
}

function storedUser(): { id?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as { id?: string; email?: string }) : null;
  } catch {
    return null;
  }
}

export type TrackEventName =
  | "landing_view"
  | "page_view"
  | "demo_start"
  | "signup"
  | "signup_failed"
  | "login"
  | "payment"
  | "payment_failed";

export function trackEvent(
  event: TrackEventName | string,
  meta: Record<string, unknown> = {},
  user?: { id?: string; email?: string } | null,
): void {
  try {
    const stored = user ?? storedUser();
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        path: typeof meta.path === "string" ? meta.path : window.location.pathname,
        visitor_id: getVisitorId(),
        user_id: stored?.id ?? null,
        user_email: stored?.email ?? null,
        meta,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the app */
  }
}
