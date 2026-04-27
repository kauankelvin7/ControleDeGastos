// sw.js — KiNance Service Worker
const CACHE = "kinance-v1";
const ASSETS = [
  "/",
  "/dashboard.html",
  "/css/reset.css",
  "/css/tokens.css",
  "/css/components.css",
  "/css/animations.css",
  "/js/utils.js",
  "/js/icons.js",
  "/js/constants.js",
  "/js/cache.js",
];

self.addEventListener("install", e =>
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
);

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
);

self.addEventListener("fetch", e => {
  // Não intercepta chamadas Firebase ou APIs externas
  const url = new URL(e.request.url);
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("brapi.dev") ||
    url.hostname.includes("x.ai")
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cacheia assets estáticos
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
