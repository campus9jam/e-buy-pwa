/* E-Buy service worker — makes the site installable and keeps it usable offline.
 * Strategy:
 *  - navigations: network first (always fresh after a deploy), cache fallback
 *  - static assets: cache first, refreshed in the background
 *  - API routes: never cached
 */
const CACHE = "ebuy-static-v1";
const STATIC_RE = /^\/(_next\/static|icons|hero|ads|favicon)/;

const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>E-Buy — offline</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#001a4d;color:#fff;text-align:center;padding:24px}
  h1{font-size:20px;margin:0 0 8px}
  p{color:#bcd0f0;font-size:14px;margin:0 0 20px}
  button{background:#0052ff;color:#fff;border:0;border-radius:999px;padding:12px 22px;
    font-size:14px;font-weight:600}
</style></head>
<body><div>
  <h1>You're offline</h1>
  <p>E-Buy needs a connection to show prices and place orders.</p>
  <button onclick="location.reload()">Try again</button>
</div></body></html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(OFFLINE_HTML, {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        return cached || (await network) || Response.error();
      })()
    );
  }
});
