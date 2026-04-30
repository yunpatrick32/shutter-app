// Bump CACHE_VERSION in lockstep with index.html's app.js ?v=N so PWA installs
// pick up the new shell on upgrade.
const CACHE_VERSION = 'v84';
const CACHE_NAME = `shutter-${CACHE_VERSION}`;
const ASSETS = ['/', '/index.html', '/src/app.js', '/src/data.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('shutter-') && k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co') || e.request.url.includes('mapbox.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
