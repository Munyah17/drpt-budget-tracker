"use client";

import { useEffect } from "react";

/**
 * Service-worker cleanup, not registration. The old offline-first SW could
 * intercept navigations and leave users stuck on Chrome's "couldn't load"
 * PWA error screen whenever a page wasn't in its cache — so we unregister
 * every registration and drop its caches once per visitor.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((rs) => {
      for (const r of rs) void r.unregister();
    });
    if ("caches" in window) {
      caches.keys().then((ks) => ks.forEach((k) => void caches.delete(k)));
    }
  }, []);
  return null;
}
