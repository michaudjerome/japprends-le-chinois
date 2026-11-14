// Service worker généré par tools/stamp.py : ne pas modifier à la main
const V = 'a5a164cd';
const CACHE = `jlc-${V}`;
const CORE = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/base.css?v=a5a164cd",
 "css/themes.css?v=a5a164cd",
 "js/app.js?v=a5a164cd",
 "js/backup.js?v=a5a164cd",
 "js/cards.js?v=a5a164cd",
 "js/content.js?v=a5a164cd",
 "js/db.js?v=a5a164cd",
 "js/dict.js?v=a5a164cd",
 "js/settings.js?v=a5a164cd",
 "js/sheet.js?v=a5a164cd",
 "js/speech.js?v=a5a164cd",
 "js/srs.js?v=a5a164cd",
 "js/strokes.js?v=a5a164cd",
 "js/ui.js?v=a5a164cd",
 "js/update.js?v=a5a164cd",
 "js/version.js?v=a5a164cd",
 "js/views/cards.js?v=a5a164cd",
 "js/views/create.js?v=a5a164cd",
 "js/views/discover.js?v=a5a164cd",
 "js/views/home.js?v=a5a164cd",
 "js/views/quiz.js?v=a5a164cd",
 "js/views/review.js?v=a5a164cd",
 "js/views/settings.js?v=a5a164cd",
 "js/views/sources.js?v=a5a164cd",
 "js/vendor/hanzi-writer.mjs?v=a5a164cd",
 "js/vendor/ts-fsrs.mjs?v=a5a164cd",
 "data/dict-fr.json?v=a5a164cd",
 "data/packs.json?v=a5a164cd",
 "data/traits-1.json?v=a5a164cd",
 "data/traits-index.json?v=a5a164cd",
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
