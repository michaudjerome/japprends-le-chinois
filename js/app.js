import { openDb, askPersistence } from './db.js';
import { loadSettings } from './settings.js';
import { registerSW } from './update.js';
import { syncContent } from './content.js';
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
  syncContent().then((n) => { if (n) route(); }).catch(() => {});
})();
