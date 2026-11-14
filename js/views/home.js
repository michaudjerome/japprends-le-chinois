import { getAll } from '../db.js';
import { icon, dayKey } from '../ui.js';
import { todayQueue, isNew } from '../srs.js';
import { settings } from '../settings.js';
import { backupDue } from '../backup.js';

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
  const queue = await todayQueue(cards);
  const due = queue.length;
  const fresh = queue.filter(isNew).length;
  const mastered = cards.filter((c) => (c.stability ?? 0) >= 21).length;
  const today = logs.filter((l) => l.day === dayKey()).length;
  const goal = settings.dailyGoal;
  const [zh, py, fr] = greeting();
  const minutes = Math.max(1, Math.round(due * 15 / 60));
  const remind = await backupDue(cards);

  const block = cards.length === 0
    ? `<div class="n" style="font-size:24px">Bienvenue</div>
       <div class="l">Aucune carte pour l'instant. Commencez par un paquet de mots pour débuter.</div>
       <a class="btn" href="#/decouvrir">Choisir mes premiers mots</a>`
    : due === 0
      ? `<div class="n">0</div><div class="l">carte à réviser : tout est à jour</div>
         <a class="btn" href="#/jouer">Jouer au quiz</a>`
      : `<div class="n">${due}</div><div class="l">carte${due > 1 ? 's' : ''} à réviser aujourd'hui${fresh ? ` dont ${fresh} nouvelle${fresh > 1 ? 's' : ''}` : ''} · environ ${minutes} min</div>
         <a class="btn" href="#/reviser">Commencer la révision</a>`;

  el.innerHTML = `
  <div class="pad">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="seal" aria-hidden="true">学</span>
      <a class="icon-btn" href="#/reglages" aria-label="Réglages">${icon('gear')}</a>
    </div>
    <div class="hello"><span class="zh" style="font-size:16px;color:var(--ink)">${zh}</span> · ${py}</div>
    <h1 class="hello2">${fr}</h1>
    <div class="today">${block}
      ${cards.length ? `<div class="goal light"><div class="goal-bar"><i style="width:${Math.min(100, (today / goal) * 100)}%"></i></div>
        <small>${today >= goal ? 'Objectif du jour atteint 好！' : `Objectif du jour : ${today} / ${goal}`}</small></div>` : ''}
    </div>
    <nav class="modes" aria-label="Modes">
      <a class="mode" href="#/reviser"><span class="zh">复</span><span>Réviser</span></a>
      <a class="mode" href="#/jouer"><span class="zh">玩</span><span>Jouer</span></a>
      <a class="mode" href="#/decouvrir"><span class="zh">探</span><span>Découvrir</span></a>
      <a class="mode" href="#/creer"><span class="zh">写</span><span>Créer</span></a>
    </nav>
    <div class="stats">
      <div><b>${streak(logs)}</b>jours de suite</div>
      <a href="#/cartes"><b>${cards.length}</b>cartes</a>
      <div><b>${mastered}</b>maîtrisées</div>
    </div>
    ${remind ? `<a class="nudge" href="#/reglages">Pensez à sauvegarder vos cartes : un fichier suffit pour ne rien perdre.</a>` : ''}
  </div>`;
}
