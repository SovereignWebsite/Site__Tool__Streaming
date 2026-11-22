/* Streaming service worker: lets the site open offline. It keeps copies of this site's own files only,
   asks the network first so updates arrive, and never touches any other address. No tracking. */
var CACHE = 'streaming-files-v3';
var CORE = ['/', '/pt/', '/assets/streaming.css', '/assets/core.js', '/assets/app.js', '/assets/design.js', '/assets/pwa.js', '/assets/design-control.js', '/assets/poster.js', '/assets/pictures.js',
  '/start/', '/pt/start/', '/agents/', '/pt/agents/', '/admin/', '/pt/admin/', '/policy/', '/pt/policy/', '/manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || caches.match(u.pathname.indexOf('/pt/') === 0 ? '/pt/' : '/'); });
  }));
});
