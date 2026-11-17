// Service worker: keeps the app files in a cache so the app works offline.
// Strategy "stale-while-revalidate": answer from cache instantly,
// then fetch a fresh copy in the background for the next start.
const CACHE = 'biljeske-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req)
      .then(res => {
        if (res.ok) cache.put(key, res.clone());
        return res;
      })
      .catch(() => cached);
    if (cached) {
      e.waitUntil(fresh);
      return cached;
    }
    return fresh;
  }));
});
