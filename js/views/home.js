import { getAll } from '../db.js';
import { icon, dayKey } from '../ui.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return ['早上好', 'zǎoshang hǎo', 'Bonjour !'];
  if (h < 18) return ['下午好', 'xiàwǔ hǎo', 'Bon après-midi !'];
  return ['晚上好', 'wǎnshang hǎo', 'Bonsoir !'];
}

// Jours consécutifs avec au moins une révision (aujourd'hui ou hier pour ne pas casser la série le matin)
function streak(logs) {
  const days = new Set(logs.map((l) => l.day));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export async function render(el) {
  const [cards, logs] = await Promise.all([getAll('cards'), getAll('logs')]);
  const now = Date.now();
  const due = cards.filter((c) => (c.due ?? 0) <= now).length;
  const mastered = cards.filter((c) => (c.stability ?? 0) >= 21).length;
  const [zh, py, fr] = greeting();
  const minutes = Math.max(1, Math.round(due * 20 / 60));

  const block = cards.length === 0
    ? `<div class="n" style="font-size:24px">Bienvenue</div>
       <div class="l">Aucune carte pour l'instant. Créez vos premiers mots ou piochez-les dans les listes HSK.</div>
       <a class="btn" href="#/decouvrir">Découvrir des mots</a>`
    : due === 0
      ? `<div class="n">0</div><div class="l">carte à réviser : tout est à jour</div>
         <a class="btn" href="#/reviser?libre=1">Révision libre</a>`
      : `<div class="n">${due}</div><div class="l">carte${due > 1 ? 's' : ''} à réviser aujourd'hui · environ ${minutes} min</div>
         <a class="btn" href="#/reviser">Commencer la révision</a>`;

  el.innerHTML = `
  <div class="pad">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="seal" aria-hidden="true">学</span>
      <a class="icon-btn" href="#/reglages" aria-label="Réglages">${icon('gear')}</a>
    </div>
    <div class="hello"><span class="zh" style="font-size:16px;color:var(--ink)">${zh}</span> · ${py}</div>
    <h1 class="hello2">${fr}</h1>
    <div class="today">${block}</div>
    <nav class="modes" aria-label="Modes">
      <a class="mode" href="#/reviser"><span class="zh">复</span><span>Réviser</span></a>
      <a class="mode" href="#/creer"><span class="zh">写</span><span>Créer</span></a>
      <a class="mode" href="#/decouvrir"><span class="zh">探</span><span>Découvrir</span></a>
    </nav>
    <div class="stats">
      <div><b>${streak(logs)}</b>jours de suite</div>
      <a href="#/cartes"><b>${cards.length}</b>cartes</a>
      <div><b>${mastered}</b>maîtrisées</div>
    </div>
  </div>`;
}
