/* BIJAYA HOUSING - image cache.
   Product pictures are kept on the phone after the first view, so the shop opens faster and
   still shows pictures on a weak connection. Only files inside an /images/ folder are cached.
   Pages, prices and stock are NEVER cached here - they always come fresh from the network. */
const CACHE = "bh-images-v1";
const MAX_ITEMS = 250;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

async function trim() {
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ITEMS; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!/\/images\//.test(url.pathname) || !/\.(webp|png|jpe?g|gif|svg)$/i.test(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    // show the saved picture at once, refresh it in the background
    const refresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) {
        return cache.put(req, res.clone()).then(trim).then(() => res);
      }
      return res;
    }).catch(() => cached);
    if (cached) { event.waitUntil(refresh); return cached; }
    return refresh;
  })());
});
