"use client";

/** Fire-and-forget admin notification for client-side events. Never throws. */
export function notifyEvent(
  type: "signup_success" | "signup_failed" | "payment_failed" | "transfer_intent",
  payload: { email?: string; name?: string; method?: string; detail?: string } = {},
): void {
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...payload }),
  }).catch(() => {});
}
