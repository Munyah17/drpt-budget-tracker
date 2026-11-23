/* WellSpend service worker — deliberately conservative.
 *
 * Rules learned from the old offline-first SW (it stranded users on
 * Chrome's "couldn't load" screen):
 *  - Navigations are NETWORK-FIRST and HTML is NEVER cached — pages must
 *    always be fresh and authenticated content must never leak across
 *    users on a shared device.
 *  - Only fingerprinted build assets (/_next/static) and brand icons are
 *    cached — they're immutable, so cache-first is safe and makes repeat
 *    visits fast.
 *  - /api/* and all non-GET requests bypass the worker entirely.
 */

const VERSION = "ws-v1";
const STATIC_CACHE = `wellspend-static-${VERSION}`;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WellSpend — offline</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff7fa;font-family:system-ui,sans-serif;color:#3a0e20;text-align:center;padding:24px}h1{font-size:22px;margin:0 0 8px}p{color:#8a5a70;font-size:14px;margin:0 0 20px}button{background:#c81057;color:#fff;border:0;border-radius:10px;padding:12px 22px;font-size:14px;font-weight:600;cursor:pointer}</style>
</head><body><div><div style="font-size:34px;margin-bottom:8px">❤</div><h1>You're offline</h1><p>WellSpend needs a connection — check your internet and try again.</p><button onclick="location.reload()">Try again</button></div></body></html>`;

self.addEventListener("install", () => {
  // No precaching — nothing to install, activate immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("wellspend-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Immutable brand + build assets → cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/og-image.png"
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Page navigations → network-first, branded offline fallback. HTML is
  // never written to the cache.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
      )
    );
  }
});
