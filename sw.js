// Service worker généré par tools/stamp.py : ne pas modifier à la main
const V = 'aa1133b6';
const CACHE = `jlc-${V}`;
const CORE = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/base.css?v=aa1133b6",
 "css/themes.css?v=aa1133b6",
 "js/app.js?v=aa1133b6",
 "js/backup.js?v=aa1133b6",
 "js/cards.js?v=aa1133b6",
 "js/db.js?v=aa1133b6",
 "js/dict.js?v=aa1133b6",
 "js/settings.js?v=aa1133b6",
 "js/sheet.js?v=aa1133b6",
 "js/speech.js?v=aa1133b6",
 "js/srs.js?v=aa1133b6",
 "js/strokes.js?v=aa1133b6",
 "js/ui.js?v=aa1133b6",
 "js/version.js?v=aa1133b6",
 "js/views/cards.js?v=aa1133b6",
 "js/views/create.js?v=aa1133b6",
 "js/views/discover.js?v=aa1133b6",
 "js/views/home.js?v=aa1133b6",
 "js/views/quiz.js?v=aa1133b6",
 "js/views/review.js?v=aa1133b6",
 "js/views/settings.js?v=aa1133b6",
 "js/views/sources.js?v=aa1133b6",
 "js/vendor/hanzi-writer.mjs?v=aa1133b6",
 "js/vendor/ts-fsrs.mjs?v=aa1133b6",
 "data/dict-fr.json?v=aa1133b6",
 "data/packs.json?v=aa1133b6",
 "data/traits-1.json?v=aa1133b6",
 "data/traits-index.json?v=aa1133b6",
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
