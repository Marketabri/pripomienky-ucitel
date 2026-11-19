// Service worker: appka sa dá nainštalovať a otvorí sa aj pri slabom signáli.
// Súbory appky: najprv sieť (aby bola vždy najnovšia verzia), pri výpadku cache.
// Dáta zo Supabase sa NEUKLADAJÚ do cache.
const CACHE = 'diar-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
