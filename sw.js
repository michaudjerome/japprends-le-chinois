// Service worker généré par tools/stamp.py : ne pas modifier à la main
const V = '38abf0df';
const CACHE = `jlc-${V}`;
const CORE = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/base.css?v=38abf0df",
 "css/themes.css?v=38abf0df",
 "js/app.js?v=38abf0df",
 "js/backup.js?v=38abf0df",
 "js/cards.js?v=38abf0df",
 "js/db.js?v=38abf0df",
 "js/dict.js?v=38abf0df",
 "js/settings.js?v=38abf0df",
 "js/sheet.js?v=38abf0df",
 "js/speech.js?v=38abf0df",
 "js/srs.js?v=38abf0df",
 "js/strokes.js?v=38abf0df",
 "js/ui.js?v=38abf0df",
 "js/version.js?v=38abf0df",
 "js/views/cards.js?v=38abf0df",
 "js/views/create.js?v=38abf0df",
 "js/views/discover.js?v=38abf0df",
 "js/views/home.js?v=38abf0df",
 "js/views/quiz.js?v=38abf0df",
 "js/views/review.js?v=38abf0df",
 "js/views/settings.js?v=38abf0df",
 "js/views/sources.js?v=38abf0df",
 "js/vendor/hanzi-writer.mjs?v=38abf0df",
 "js/vendor/ts-fsrs.mjs?v=38abf0df",
 "data/dict-fr.json?v=38abf0df",
 "data/packs.json?v=38abf0df",
 "data/traits-1.json?v=38abf0df",
 "data/traits-index.json?v=38abf0df",
 "fonts/fraunces-500.woff2",
 "fonts/fraunces-700.woff2",
 "fonts/inter-400.woff2",
 "fonts/inter-500.woff2",
 "fonts/inter-600.woff2",
 "fonts/inter-700.woff2",
 "fonts/kai.woff2",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-512.png"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('jlc-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
