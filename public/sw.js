/* Guitarist service worker: app-shell caching + offline fallback.
 * Hand-rolled and minimal on purpose: the app shell is precached at install,
 * same-origin GETs are cached at runtime, and navigations fall back to the
 * cached shell so the SPA router still works offline. Never caches API or
 * non-GET traffic.
 */
const VERSION = "guitarist-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest"];
const RUNTIME = "guitarist-runtime-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {
        /* install still completes; runtime caching covers the rest */
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== VERSION && k !== RUNTIME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return; // auth + data stay live, never cached

  // Navigations: network first, fall back to the cached app shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match("/index.html", { cacheName: VERSION })
            .then((cached) => cached || caches.match(request)),
        ),
    );
    return;
  }

  // Static assets: cache first, populate on miss.
  event.respondWith(
    caches.match(request, { cacheName: VERSION }).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
