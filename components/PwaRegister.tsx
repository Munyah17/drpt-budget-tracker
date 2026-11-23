"use client";

import { useEffect } from "react";

/**
 * Registers the installable-PWA service worker (public/sw.js).
 *
 * - Production only: dev servers churn assets too fast for a SW to help.
 * - The SW never caches HTML or API responses, so there is no stale-page
 *   or cross-user data risk — it only speeds up fingerprinted assets.
 * - On update we let the new worker take over on next navigation rather
 *   than force-reloading mid-session.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Clear caches left behind by the retired offline-first SW — its
    // stored pages are exactly what stranded users before.
    if ("caches" in window) {
      caches.keys().then((ks) =>
        ks.filter((k) => !k.startsWith("wellspend-")).forEach((k) => void caches.delete(k))
      );
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort — the site works without it */
    });
  }, []);
  return null;
}
