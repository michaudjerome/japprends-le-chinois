import { openDb, askPersistence } from './db.js';
import { loadSettings } from './settings.js';
import * as home from './views/home.js';
import * as settingsView from './views/settings.js';
import * as sources from './views/sources.js';
import * as create from './views/create.js';
import * as cardsView from './views/cards.js';
import * as review from './views/review.js';
import * as discover from './views/discover.js';
import * as quiz from './views/quiz.js';

const routes = {
  '': home,
  reglages: settingsView,
  sources,
  reviser: review,
  jouer: quiz,
  creer: create,
  cartes: cardsView,
  decouvrir: discover,
};

const el = document.getElementById('app');
let cleanup;

async function route() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const view = routes[path.split('/')[0]] ?? home;
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  params.id = path.split('/')[1];
  try { cleanup?.(); } catch {}
  cleanup = undefined;
  el.onclick = null; el.onkeydown = null;
  try { cleanup = await view.render(el, params); }
  catch (err) {
    console.error(err);
    el.innerHTML = `<div class="empty"><p>Une erreur est survenue.</p><p class="muted" style="font-size:13px">${String(err.message || err)}</p><a class="btn ghost" href="#/">Accueil</a></div>`;
  }
  window.scrollTo(0, 0);
}

(async () => {
  await openDb();
  await loadSettings();
  askPersistence();
  addEventListener('hashchange', route);
  route();
  registerSW();
})();

// Hors ligne : le service worker garde l'application dans le téléphone ; une nouvelle version s'annonce par une barre
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const offer = (w) => {
    if (!w || document.querySelector('.update-bar')) return;
    const bar = document.createElement('div');
    bar.className = 'update-bar';
    bar.innerHTML = '<span>Nouvelle version disponible</span><button>Mettre à jour</button>';
    bar.querySelector('button').onclick = () => w.postMessage('skip');
    document.body.append(bar);
  };
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 30 * 60000);
  }).catch(() => {});
}
