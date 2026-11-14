// Service worker généré par tools/stamp.py : ne pas modifier à la main
const V = '38383584';
const CACHE = `jlc-${V}`;
const CORE = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/base.css?v=38383584",
 "css/themes.css?v=38383584",
 "js/app.js?v=38383584",
 "js/backup.js?v=38383584",
 "js/cards.js?v=38383584",
 "js/content.js?v=38383584",
 "js/db.js?v=38383584",
 "js/dict.js?v=38383584",
 "js/greet.js?v=38383584",
 "js/settings.js?v=38383584",
 "js/sheet.js?v=38383584",
 "js/speech.js?v=38383584",
 "js/srs.js?v=38383584",
 "js/strokes.js?v=38383584",
 "js/ui.js?v=38383584",
 "js/update.js?v=38383584",
 "js/version.js?v=38383584",
 "js/views/cards.js?v=38383584",
 "js/views/create.js?v=38383584",
 "js/views/discover.js?v=38383584",
 "js/views/home.js?v=38383584",
 "js/views/quiz.js?v=38383584",
 "js/views/review.js?v=38383584",
 "js/views/settings.js?v=38383584",
 "js/views/sources.js?v=38383584",
 "js/vendor/hanzi-writer.mjs?v=38383584",
 "js/vendor/ts-fsrs.mjs?v=38383584",
 "data/dict-fr.json?v=38383584",
 "data/packs.json?v=38383584",
 "data/traits-1.json?v=38383584",
 "data/traits-index.json?v=38383584",
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
