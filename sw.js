// Service worker généré par tools/stamp.py : ne pas modifier à la main
const V = '2e430e8b';
const CACHE = `jlc-${V}`;
const CORE = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/base.css?v=2e430e8b",
 "css/themes.css?v=2e430e8b",
 "js/app.js?v=2e430e8b",
 "js/backup.js?v=2e430e8b",
 "js/cards.js?v=2e430e8b",
 "js/db.js?v=2e430e8b",
 "js/dict.js?v=2e430e8b",
 "js/settings.js?v=2e430e8b",
 "js/sheet.js?v=2e430e8b",
 "js/speech.js?v=2e430e8b",
 "js/srs.js?v=2e430e8b",
 "js/strokes.js?v=2e430e8b",
 "js/ui.js?v=2e430e8b",
 "js/version.js?v=2e430e8b",
 "js/views/cards.js?v=2e430e8b",
 "js/views/create.js?v=2e430e8b",
 "js/views/discover.js?v=2e430e8b",
 "js/views/home.js?v=2e430e8b",
 "js/views/quiz.js?v=2e430e8b",
 "js/views/review.js?v=2e430e8b",
 "js/views/settings.js?v=2e430e8b",
 "js/views/sources.js?v=2e430e8b",
 "js/vendor/hanzi-writer.mjs?v=2e430e8b",
 "js/vendor/ts-fsrs.mjs?v=2e430e8b",
 "data/dict-fr.json?v=2e430e8b",
 "data/packs.json?v=2e430e8b",
 "data/traits-1.json?v=2e430e8b",
 "data/traits-index.json?v=2e430e8b",
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
