const CACHE_NAME = "order-ledger-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./app-settings.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
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

// Network-first for Firebase calls, cache-first for the app shell.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin.includes("firestore") || url.origin.includes("googleapis") || url.origin.includes("firebasestorage") || url.origin.includes("gstatic")) {
    return; // let Firebase / CDN calls go straight to the network, untouched
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
