// Mode Jeu : quiz à 3 choix avec faux choix pièges. Séparé de la révision : ne touche pas au calendrier FSRS.
import { allCards } from '../cards.js';
import { loadDict, entriesOfLevel, toneHtml, strip } from '../dict.js';
import { speak, voiceReady, AUDIO_ENABLED } from '../speech.js';
import { kvGet, kvSet } from '../db.js';
import { topBar, icon, esc, celebrate } from '../ui.js';

const ALL_TYPES = [
  ['hz-fr', '字 → français', 'Que veut dire ce mot ?'],
  ['hz-py', '字 → pinyin', 'Comment se prononce ce mot ?'],
  ['fr-hz', 'français → 字', 'Quel caractère correspond ?'],
  ['au-hz', '🔊 → 字', 'Quel mot entendez-vous ?'],
];
const TYPES = ALL_TYPES.filter(([k]) => AUDIO_ENABLED || k !== 'au-hz');
const N = 10;
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const bare = (py) => strip(py).replace(/[\s']/g, '');

// Score de ressemblance : on préfère des leurres qui piègent vraiment
function likeness(a, b, type) {
  let s = Math.random();
  const sa = new Set(a.hanzi);
  if ([...b.hanzi].some((c) => sa.has(c))) s += 3;            // caractère commun
  if (a.hanzi.length === b.hanzi.length) s += 1.5;            // même longueur
  if (bare(a.pinyin) === bare(b.pinyin)) s += type === 'hz-py' ? 4 : 2; // même son, autre ton
  else if (bare(a.pinyin)[0] === bare(b.pinyin)[0]) s += 0.7;
  return s;
}

// Mots significatifs d'une traduction : deux réponses qui partagent un sens rendraient la question ambiguë
const STOP = new Set(['avoir', 'faire', 'etre', 'dans', 'pour', 'avec', 'sans', 'plus', 'tres', 'quelque', 'chose', 'personne']);
const sense = (fr) => new Set(strip(fr).split(/[^a-z]+/).filter((w) => w.length >= 4 && !STOP.has(w)));
const overlap = (a, b) => { const sa = sense(a); return [...sense(b)].some((w) => sa.has(w)); };

function makeQuestion(item, pool, type) {
  const key = (w) => (type === 'hz-fr' ? strip(w.fr) : type === 'hz-py' ? w.pinyin : w.hanzi);
  const cands = pool.filter((w) => w.hanzi !== item.hanzi && key(w) !== key(item) && strip(w.fr) !== strip(item.fr) && !overlap(w.fr, item.fr) && w.pinyin !== item.pinyin)
    .map((w) => [likeness(item, w, type), w]).sort((x, y) => y[0] - x[0]).slice(0, 8);
  const lure = [];
  for (const [, w] of shuffle(cands.slice(0, 5))) { if (lure.length < 2 && !lure.some((l) => key(l) === key(w) || overlap(l.fr, w.fr))) lure.push(w); }
  for (const [, w] of cands) { if (lure.length < 2 && !lure.includes(w) && !lure.some((l) => key(l) === key(w) || overlap(l.fr, w.fr))) lure.push(w); }
  return { item, type, options: shuffle([item, ...lure]) };
}

export async function render(el) {
  const cards = await allCards();
  const st = { source: (await kvGet('quizSource')) || (cards.length >= 6 ? 'mine' : '1'), type: (await kvGet('quizType')) || 'hz-fr' };
  if (!TYPES.some(([k]) => k === st.type)) st.type = 'hz-fr';
  const best = (await kvGet('quizBest')) || {};
  const hasVoice = !!(await voiceReady());

  const setup = () => {
    el.innerHTML = `${topBar('Jouer')}
    <div class="pad quiz">
      <div class="empty" style="flex:none;padding:8px 0 4px"><span class="zh" aria-hidden="true">玩</span>
        <p class="serif" style="font-size:22px;font-weight:700">Quiz éclair</p>
        <p class="muted">${N} questions, 3 choix. Une partie ne change pas vos révisions.</p></div>
      <section class="group"><h2>Les mots</h2><div class="chips" id="src">
        <button class="chip" data-src="mine" aria-pressed="${st.source === 'mine'}" ${cards.length < 6 ? 'disabled' : ''}>Mes cartes · ${cards.length}</button>
        ${[1, 2, 3, 4, 5, 6].map((l) => `<button class="chip" data-src="${l}" aria-pressed="${st.source === String(l)}">HSK ${l}</button>`).join('')}
      </div>${cards.length < 6 ? '<p class="hint" style="margin-top:8px">Avec au moins 6 cartes, vous pourrez jouer avec les vôtres.</p>' : ''}</section>
      <section class="group"><h2>Le défi</h2><div class="list">
        ${TYPES.map(([k, label, q]) => `<button class="row" data-type="${k}" ${k === 'au-hz' && !hasVoice ? 'disabled' : ''}>
          <span>${label}<small>${k === 'au-hz' && !hasVoice ? 'Voix chinoise absente : voir Réglages' : q}</small></span>
          <span class="radio" aria-checked="${st.type === k}"></span></button>`).join('')}</div></section>
      <p class="muted" style="text-align:center;font-size:13px;margin-top:14px">${best[`${st.source}:${st.type}`] != null ? `Meilleur score : ${best[`${st.source}:${st.type}`]} / ${N}` : '&nbsp;'}</p>
      <button class="btn" data-go style="margin-top:6px">Lancer la partie</button>
    </div>`;
  };

  const play = async () => {
    let pool;
    if (st.source === 'mine') pool = cards.map((c) => ({ hanzi: c.hanzi, pinyin: c.pinyin, fr: c.fr }));
    else { await loadDict(); pool = entriesOfLevel(+st.source); }
    // Pour les leurres, on élargit au niveau voisin si le paquet est petit
    let lurePool = pool;
    if (pool.length < 30) { await loadDict(); lurePool = [...pool, ...entriesOfLevel(1), ...entriesOfLevel(2)]; }
    const items = shuffle(st.source === 'mine' ? pool : pool.slice(0, 300)).slice(0, N);
    const qs = items.map((it) => makeQuestion(it, lurePool, st.type));
    const g = { k: 0, score: 0, combo: 0, maxCombo: 0, answered: false, missed: [] };

    const drawQ = () => {
      const q = qs[g.k];
      const prompt = q.type === 'hz-fr' || q.type === 'hz-py'
        ? `<span class="zh q-h">${esc(q.item.hanzi)}</span>`
        : q.type === 'fr-hz' ? `<span class="q-f">${esc(q.item.fr)}</span>`
          : `<button class="q-audio" data-say aria-label="Réécouter">${icon('sound')}</button>`;
      const label = (w) => (q.type === 'hz-fr' ? esc(w.fr) : q.type === 'hz-py' ? `<span class="py">${toneHtml(w.pinyin)}</span>` : `<span class="zh">${esc(w.hanzi)}</span>`);
      el.innerHTML = `${topBar('Quiz', { closeIcon: true, back: `#/jouer?n=${Date.now()}` })}
      <div class="pad quiz">
        <div class="progress"><i style="width:${(g.k / qs.length) * 100}%"></i></div>
        <div class="rv-meta"><span>${g.k + 1} / ${qs.length}</span><span>${g.combo >= 2 ? `<b class="combo">Série × ${g.combo}</b>` : `${g.score} point${g.score > 1 ? 's' : ''}`}</span></div>
        <p class="q-ask">${TYPES.find((t) => t[0] === q.type)[2]}</p>
        <div class="q-prompt">${prompt}</div>
        <div class="q-opts ${q.type === 'fr-hz' || q.type === 'au-hz' ? 'big' : ''}">${q.options.map((w, i) => `<button class="q-opt" data-opt="${i}">${label(w)}</button>`).join('')}</div>
        <div class="q-after" id="after"></div>
      </div>`;
      if (q.type === 'au-hz') speak(q.item.hanzi);
    };

    const answer = (i, btn) => {
      if (g.answered) return;
      g.answered = true;
      const q = qs[g.k];
      const ok = q.options[i] === q.item;
      el.querySelectorAll('.q-opt').forEach((b, j) => { b.disabled = true; if (q.options[j] === q.item) b.classList.add('right'); });
      if (ok) {
        g.score++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
        if (g.combo === 3 || g.combo === 5 || g.combo === 8) celebrate(`Série de ${g.combo} !`, g.combo >= 5 ? '棒' : '好');
        try { navigator.vibrate?.(15); } catch {}
      } else {
        btn.classList.add('wrong'); g.combo = 0; g.missed.push(q.item);
        try { navigator.vibrate?.([30, 40, 30]); } catch {}
      }
      el.querySelector('#after').innerHTML = `<div class="q-sol ${ok ? 'ok' : 'ko'}">
          <span class="zh">${esc(q.item.hanzi)}</span><span><span class="py">${toneHtml(q.item.pinyin)}</span><small>${esc(q.item.fr)}</small></span>
          ${AUDIO_ENABLED ? `<button class="icon-btn" data-say aria-label="Écouter">${icon('sound')}</button>` : ''}</div>
        <button class="btn" data-next>${g.k < qs.length - 1 ? 'Question suivante' : 'Voir le résultat'}</button>`;
      if (q.type !== 'au-hz' && ok) speak(q.item.hanzi);
    };

    const end = async () => {
      const k = `${st.source}:${st.type}`;
      const record = best[k] == null || g.score > best[k];
      if (record) { best[k] = g.score; await kvSet('quizBest', best); }
      const win = g.score >= 7;
      el.innerHTML = `${topBar('Résultat', { back: `#/jouer?n=${Date.now()}` })}
      <div class="empty victory">
        <div class="cheer-stamp static ${win ? '' : 'soft'}"><span class="zh">${win ? '胜' : '加'}</span></div>
        <p class="serif" style="font-size:24px;font-weight:700;margin-top:10px">${g.score === N ? 'Sans faute !' : win ? 'Victoire !' : 'Continuez, 加油 !'}</p>
        <p class="muted">${g.score} / ${N}${g.maxCombo >= 3 ? ` · meilleure série × ${g.maxCombo}` : ''}${record && g.score ? ' · nouveau record' : ''}</p>
        ${g.missed.length ? `<div class="list" style="width:100%;margin-top:12px;text-align:left">${g.missed.map((w) => `<div class="row res"><span class="zh res-h">${esc(w.hanzi)}</span><span class="res-t"><span class="py">${toneHtml(w.pinyin)}</span><small>${esc(w.fr)}</small></span></div>`).join('')}</div>` : ''}
        <button class="btn" data-again style="max-width:240px;margin-top:14px">Rejouer</button>
        <a class="btn ghost" href="#/" style="max-width:240px">Accueil</a></div>`;
      try { if (win) navigator.vibrate?.([20, 60, 20]); } catch {}
    };

    el.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.opt != null) answer(+b.dataset.opt, b);
      else if (b.hasAttribute('data-say')) speak(qs[Math.min(g.k, qs.length - 1)].item.hanzi);
      else if (b.hasAttribute('data-next')) { g.k++; g.answered = false; if (g.k >= qs.length) end(); else drawQ(); }
      else if (b.hasAttribute('data-again')) play();
    };
    drawQ();
  };

  setup();
  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.src) { st.source = b.dataset.src; await kvSet('quizSource', st.source); setup(); }
    else if (b.dataset.type) { st.type = b.dataset.type; await kvSet('quizType', st.type); setup(); }
    else if (b.hasAttribute('data-go')) play();
  };
  return () => { el.onclick = null; speechSynthesis?.cancel?.(); };
}
