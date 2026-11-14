// Mode Révision : carte → pinyin (et voix) → français, puis auto-évaluation FSRS
import { allCards, decks } from '../cards.js';
import { todayQueue, preview, grade, GRADES, Rating, isNew, reviewsToday } from '../srs.js';
import { speak } from '../speech.js';
import { openStrokes } from '../sheet.js';
import { settings } from '../settings.js';
import { toneHtml } from '../dict.js';
import { topBar, icon, esc, celebrate } from '../ui.js';

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export async function render(el, params) {
  const libre = params.libre === '1';
  const [cards, deckList] = await Promise.all([allCards(), decks()]);
  const deckName = (id) => deckList.find((d) => d.id === id)?.name || '';

  if (libre && !params.paquet) {
    el.innerHTML = `${topBar('Révision libre')}
    <div class="pad"><p class="muted">Choisissez un paquet à parcourir. La révision libre ne change pas le calendrier de vos cartes.</p>
    <div class="list" style="margin-top:14px">
      <a class="row" href="#/reviser?libre=1&paquet=all"><span>Toutes mes cartes<small>${cards.length} carte${cards.length > 1 ? 's' : ''}</small></span><span class="muted" style="width:18px">${icon('chevron')}</span></a>
      ${deckList.map((d) => { const n = cards.filter((c) => c.deckId === d.id).length; return n ? `<a class="row" href="#/reviser?libre=1&paquet=${d.id}"><span>${esc(d.name)}<small>${n} carte${n > 1 ? 's' : ''}</small></span><span class="muted" style="width:18px">${icon('chevron')}</span></a>` : ''; }).join('')}
    </div></div>`;
    return;
  }

  let queue = libre
    ? shuffle(cards.filter((c) => params.paquet === 'all' || c.deckId === params.paquet))
    : await todayQueue(cards);
  const total = queue.length;
  const st = { i: 0, stage: 0, done: 0, good: 0, again: 0, started: Date.now() };

  if (!total) {
    const hasCards = cards.length > 0;
    el.innerHTML = `${topBar('Révision')}
    <div class="empty"><span class="zh" aria-hidden="true">${hasCards ? '好' : '复'}</span>
      <p class="serif" style="font-size:20px;font-weight:700">${hasCards ? 'Tout est révisé pour aujourd\'hui' : 'Aucune carte à réviser'}</p>
      <p class="muted">${hasCards ? 'Revenez demain : les cartes reviendront au bon moment.' : 'Ajoutez des mots depuis Découvrir ou Créer.'}</p>
      ${hasCards ? '<a class="btn ghost" href="#/reviser?libre=1" style="max-width:240px;margin-top:10px">Révision libre</a><a class="btn" href="#/jouer" style="max-width:240px">Jouer au quiz</a>'
        : '<a class="btn" href="#/decouvrir" style="max-width:240px;margin-top:10px">Découvrir des mots</a>'}</div>`;
    return;
  }

  const draw = () => {
    const c = queue[st.i];
    const pv = !libre && st.stage === 2 ? preview(c) : null;
    el.innerHTML = `${topBar(libre ? 'Révision libre' : 'Révision', { closeIcon: true })}
    <div class="pad review">
      <div class="progress" aria-label="Progression"><i style="width:${(st.done / (st.done + queue.length - st.i)) * 100}%"></i></div>
      <div class="rv-meta"><span>${st.done + 1} / ${st.done + queue.length - st.i}</span><span>${isNew(c) && !libre ? '<b class="new">Nouveau</b> · ' : ''}${esc(deckName(c.deckId))}</span></div>
      <button class="flash ${st.stage < 2 ? 'tap' : ''}" id="flash" aria-label="${st.stage < 2 ? 'Retourner la carte' : 'Carte'}">
        <span class="zh fc-h">${esc(c.hanzi)}</span>
        ${st.stage >= 1 ? `<span class="py fc-p">${toneHtml(c.pinyin)}</span>` : ''}
        ${st.stage >= 2 ? `<span class="fc-f">${esc(c.fr)}</span>${c.example ? `<span class="fc-ex">${esc(c.example)}</span>` : ''}` : ''}
        ${st.stage < 2 ? `<span class="fc-hint">${st.stage === 0 ? 'Touchez pour voir le pinyin' : 'Touchez pour voir le français'}</span>` : ''}
      </button>
      ${st.stage >= 1 ? `<div class="fc-tools">
        <button class="chip" data-say>${icon('sound')} Écouter</button>
        <button class="chip" data-strokes>${icon('brush')} Traits</button></div>` : ''}
      <div class="grades">${st.stage < 2 ? '' : libre
        ? `<button class="grade again" data-libre="0">À revoir</button><button class="grade good" data-libre="1">Je savais</button>`
        : GRADES.map(([g, label, cls]) => `<button class="grade ${cls}" data-grade="${g}">${label}<small>${pv[g]}</small></button>`).join('')}</div>
    </div>`;
  };

  const finish = async () => {
    const n = await reviewsToday();
    const pct = st.done ? Math.round((st.good / st.done) * 100) : 0;
    const goal = settings.dailyGoal;
    el.innerHTML = `${topBar('Révision terminée')}
    <div class="empty victory">
      <div class="cheer-stamp static"><span class="zh">胜</span></div>
      <p class="serif" style="font-size:24px;font-weight:700;margin-top:10px">Victoire !</p>
      <p class="muted">${st.done} carte${st.done > 1 ? 's' : ''} révisée${st.done > 1 ? 's' : ''} · ${pct} % réussies · ${Math.max(1, Math.round((Date.now() - st.started) / 60000))} min</p>
      ${libre ? '' : `<div class="goal"><div class="goal-bar"><i style="width:${Math.min(100, (n / goal) * 100)}%"></i></div>
        <small>${n >= goal ? 'Objectif du jour atteint' : `Objectif du jour : ${n} / ${goal}`}</small></div>`}
      <a class="btn" href="#/" style="max-width:240px;margin-top:14px">Retour à l'accueil</a>
      <a class="btn ghost" href="#/jouer" style="max-width:240px">Jouer au quiz</a></div>`;
  };

  const next = () => {
    st.done++; st.i++; st.stage = 0;
    if (st.i >= queue.length) return finish();
    draw();
  };

  const reveal = () => {
    if (st.stage >= 2) return;
    st.stage++;
    if (st.stage === 1 && settings.autoplay) speak(queue[st.i].hanzi);
    draw();
  };

  draw();
  el.onclick = async (e) => {
    if (e.target.closest('#flash')) return reveal();
    const b = e.target.closest('button');
    if (!b) return;
    const c = queue[st.i];
    if (b.hasAttribute('data-say')) return speak(c.hanzi);
    if (b.hasAttribute('data-strokes')) return openStrokes(c.hanzi);
    if (b.dataset.libre != null) {
      if (b.dataset.libre === '1') st.good++; else queue.push(c);
      return next();
    }
    if (b.dataset.grade) {
      const r = +b.dataset.grade;
      const upd = await grade(c, r);
      if (r !== Rating.Again) st.good++; else st.again++;
      // Une carte ratée ou en apprentissage revient dans la séance si elle est due dans les 15 minutes
      if (upd.due <= Date.now() + 15 * 60000) queue.push(upd);
      if (r === Rating.Easy || (r === Rating.Good && st.good % 5 === 0)) celebrate('', r === Rating.Easy ? '棒' : '好');
      next();
    }
  };
  el.onkeydown = null;
  return () => { el.onclick = null; speechSynthesis?.cancel?.(); document.querySelector('.sheet-wrap')?.remove(); };
}
