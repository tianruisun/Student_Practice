/* The cache is named after the app version in version.js, so each release replaces the old cache.
   BUILD: a browser installs a new service worker only when THIS file's bytes change, not when version.js does
   (R6.2, v1.7.0). So BUILD changes with every push to Test that changes an app file: <APP_VERSION>+<n>, n counting
   the pushes of that version. Installing then re-fetches every file below. tests/run.js checks both rules. */
const BUILD = '1.10.0+3';
importScripts('./version.js');
const CACHE_VERSION = 'maths-' + self.APP_VERSION;
const ASSETS = [
  './',
  './index.html',
  './version.js',
  './js/test-badge.js',
  './css/style.css',
  './js/i18n.js',
  './js/checker.js',
  './js/figures.js',
  './js/gen-core.js',
  './js/gen-maths.js',
  './js/gen-word.js',
  './js/gen-junior.js',
  './js/gen-senior.js',
  './js/gen-charts.js',
  './js/gen-k6.js',
  './js/scope-k6.js',
  './js/lessons-k2.js',
  './js/lessons-36.js',
  './js/gen-olympiad.js',
  './js/gen-amo.js',
  './js/gen-ga.js',
  './js/gen-selective.js',
  './js/gen-comp.js',
  './js/similar.js',
  './js/records.js',
  './js/ai.js',
  './js/tour.js',
  './js/game-balloons.js',
  './js/game-kit.js',
  './js/game-sudoku.js',
  './js/game-money.js',
  './js/game-broken.js',
  './js/game-numbers.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('maths-') && k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // AI API calls go straight to the network

  // Pages: network first (fresh when online), cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE_VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Everything else: cache first, fall back to network (and cache it).
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE_VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
