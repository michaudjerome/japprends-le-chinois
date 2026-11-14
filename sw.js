// Service worker généré par tools/stamp.py : ne pas modifier à la main
const V = '7c738f5c';
const CACHE = `jlc-${V}`;
const CORE = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/base.css?v=7c738f5c",
 "css/themes.css?v=7c738f5c",
 "js/app.js?v=7c738f5c",
 "js/backup.js?v=7c738f5c",
 "js/cards.js?v=7c738f5c",
 "js/content.js?v=7c738f5c",
 "js/db.js?v=7c738f5c",
 "js/dict.js?v=7c738f5c",
 "js/greet.js?v=7c738f5c",
 "js/settings.js?v=7c738f5c",
 "js/sheet.js?v=7c738f5c",
 "js/speech.js?v=7c738f5c",
 "js/srs.js?v=7c738f5c",
 "js/strokes.js?v=7c738f5c",
 "js/ui.js?v=7c738f5c",
 "js/update.js?v=7c738f5c",
 "js/version.js?v=7c738f5c",
 "js/views/cards.js?v=7c738f5c",
 "js/views/create.js?v=7c738f5c",
 "js/views/discover.js?v=7c738f5c",
 "js/views/home.js?v=7c738f5c",
 "js/views/quiz.js?v=7c738f5c",
 "js/views/review.js?v=7c738f5c",
 "js/views/settings.js?v=7c738f5c",
 "js/views/sources.js?v=7c738f5c",
 "js/vendor/hanzi-writer.mjs?v=7c738f5c",
 "js/vendor/ts-fsrs.mjs?v=7c738f5c",
 "data/dict-fr.json?v=7c738f5c",
 "data/packs.json?v=7c738f5c",
 "data/traits-1.json?v=7c738f5c",
 "data/traits-index.json?v=7c738f5c",
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
  // Mise à jour automatique : dès que la nouvelle version est en cache, elle prend la main
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
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
