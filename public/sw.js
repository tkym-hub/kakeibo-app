const CACHE_NAME = "kakeibo-v2";
const STATIC_ASSETS = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Supabase API や外部リクエストはキャッシュしない
  if (!event.request.url.startsWith(self.location.origin)) return;

  // ページ遷移（HTML）は network-first: 常に最新を取りにいき、オフライン時のみキャッシュ
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 静的アセットは cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached ?? fetch(event.request);
    })
  );
});
