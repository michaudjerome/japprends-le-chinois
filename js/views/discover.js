// Mode Découverte : paquets thématiques pour débuter, puis tirage de mots HSK par niveau
import { loadDict, entriesOfLevel, toneHtml } from '../dict.js';
import { decks, createDeck, allCards, saveCard } from '../cards.js';
import { kvGet, kvSet } from '../db.js';
import { topBar, icon, esc, celebrate, toast } from '../ui.js';

const v = () => (window.APP_STAMP ? `?v=${window.APP_STAMP}` : '');
let packsP;
const loadPacks = () => (packsP ??= fetch(`data/packs.json${v()}`).then((r) => r.json()).then((d) => d.packs));
const LV = (l) => (l === 7 ? '7-9' : String(l));

async function deckNamed(name) {
  const list = await decks();
  return list.find((d) => d.name === name) || createDeck(name);
}

// Ajoute des mots en sautant ceux déjà possédés ; renvoie le nombre ajouté
async function addWords(words, deckName) {
  const owned = new Set((await allCards()).map((c) => c.hanzi));
  const deck = await deckNamed(deckName);
  let n = 0;
  for (const w of words) {
    if (owned.has(w.hanzi)) continue;
    await saveCard({ hanzi: w.hanzi, pinyin: w.pinyin, fr: w.fr, example: '', deckId: deck.id });
    owned.add(w.hanzi); n++;
  }
  return n;
}

export async function render(el) {
  const st = { level: (await kvGet('discoverLevel')) || 1, batch: [] };
  let owned = new Set((await allCards()).map((c) => c.hanzi));
  const packs = await loadPacks();

  el.innerHTML = `${topBar('Découvrir')}
  <div class="pad discover">
    <section class="group" style="margin-top:6px"><h2>Pour débuter</h2>
      <div class="packs" id="packs"></div></section>
    <section class="group"><h2>Vocabulaire HSK par niveau</h2>
      <div class="chips" id="levels"></div>
      <div id="batch" style="margin-top:12px"><p class="muted pad-s">Chargement du dictionnaire…</p></div>
    </section>
  </div>`;
  const $ = (id) => el.querySelector('#' + id);

  const drawPacks = () => {
    $('packs').innerHTML = packs.map((p) => {
      const have = p.words.filter((w) => owned.has(w[0])).length;
      const full = have === p.words.length;
      return `<div class="pack ${full ? 'done' : ''}">
        <span class="zh pack-g">${esc(p.glyph)}</span>
        <span class="pack-n">${esc(p.name)}</span>
        <small>${p.words.slice(0, 4).map((w) => esc(w[0])).join(' · ')}…</small>
        <small>${have ? `${have} / ${p.words.length} mots` : `${p.words.length} mots`}</small>
        <button class="chip ${full ? '' : 'on'}" data-pack="${p.id}" ${full ? 'disabled' : ''}>${full ? 'Ajouté ✓' : have ? 'Compléter' : 'Ajouter'}</button>
      </div>`;
    }).join('');
  };

  const drawLevels = () => {
    $('levels').innerHTML = [1, 2, 3, 4, 5, 6, 7].map((l) =>
      `<button class="chip" data-level="${l}" aria-pressed="${l === st.level}">HSK ${LV(l)}</button>`).join('');
  };

  const pickBatch = () => {
    const pool = entriesOfLevel(st.level).filter((w) => !owned.has(w.hanzi));
    // les premiers mots de la liste officielle d'abord, avec un peu de hasard
    const head = pool.slice(0, 40);
    for (let i = head.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [head[i], head[j]] = [head[j], head[i]]; }
    st.batch = head.slice(0, 10);
    st.left = pool.length;
  };

  const drawBatch = () => {
    if (!st.batch.length) {
      $('batch').innerHTML = `<p class="muted pad-s">Vous avez tous les mots du HSK ${LV(st.level)}. 好！</p>`;
      return;
    }
    $('batch').innerHTML = `<div class="list">${st.batch.map((w, k) => `
      <div class="row res">
        <span class="zh res-h">${esc(w.hanzi)}</span>
        <span class="res-t"><span class="py">${toneHtml(w.pinyin)}</span><small>${esc(w.fr)}</small></span>
        ${owned.has(w.hanzi) ? '<span class="lvl">Ajouté</span>' : `<button class="icon-btn add-one" data-add="${k}" aria-label="Ajouter ${esc(w.hanzi)}">${icon('plus')}</button>`}
      </div>`).join('')}</div>
      <p class="muted" style="font-size:12.5px;margin-top:8px">Encore ${st.left} mot${st.left > 1 ? 's' : ''} à découvrir à ce niveau. Ils rejoignent le paquet « HSK ${LV(st.level)} ».</p>
      <div class="row-btns"><button class="btn ghost" data-more>Autres mots</button><button class="btn" data-all>Tout ajouter</button></div>`;
  };

  drawPacks(); drawLevels();
  loadDict().then(() => { pickBatch(); drawBatch(); }).catch(() => { $('batch').innerHTML = '<p class="muted pad-s">Le dictionnaire n\'a pas pu être chargé.</p>'; });

  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.pack) {
      const p = packs.find((x) => x.id === b.dataset.pack);
      b.disabled = true;
      const n = await addWords(p.words.map(([hanzi, pinyin, fr]) => ({ hanzi, pinyin, fr })), p.name);
      owned = new Set((await allCards()).map((c) => c.hanzi));
      celebrate(n ? `${n} mot${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à « ${p.name} »` : 'Déjà dans vos cartes');
      drawPacks(); drawBatch();
    } else if (b.dataset.level) {
      st.level = +b.dataset.level; kvSet('discoverLevel', st.level);
      drawLevels(); pickBatch(); drawBatch();
    } else if (b.dataset.add != null) {
      const w = st.batch[+b.dataset.add];
      await addWords([w], `HSK ${LV(st.level)}`);
      owned.add(w.hanzi);
      toast(`${w.hanzi} ajouté`);
      drawBatch(); drawPacks();
    } else if (b.hasAttribute('data-more')) { pickBatch(); drawBatch(); }
    else if (b.hasAttribute('data-all')) {
      const n = await addWords(st.batch.filter((w) => !owned.has(w.hanzi)), `HSK ${LV(st.level)}`);
      owned = new Set((await allCards()).map((c) => c.hanzi));
      celebrate(`${n} mot${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}`);
      pickBatch(); drawBatch(); drawPacks();
    }
  };
  return () => { el.onclick = null; };
}
