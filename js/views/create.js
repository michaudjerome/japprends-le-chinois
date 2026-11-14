// Mode Création : chercher un mot, le pinyin et le français se remplissent, puis on range la carte dans un paquet
import { loadDict, isLoaded, search, lookup, guessPinyin, toneHtml, hasHan } from '../dict.js';
import { decks, createDeck, findByHanzi, getCard, saveCard, deleteCard, DEFAULT_DECK } from '../cards.js';
import { kvGet, kvSet } from '../db.js';
import { topBar, icon, esc, toast, celebrate } from '../ui.js';
import { speak } from '../speech.js';
import { openStrokes } from '../sheet.js';

const LEVEL = (l) => (l ? `<span class="lvl">HSK ${l === 7 ? '7-9' : l}</span>` : '');
const shortDefs = (defs, n = 2) => defs.filter((d) => !/^(\(|variante|cf\.|voir )/i.test(d)).slice(0, n).join(', ') || defs[0] || '';

export async function render(el, params) {
  const editing = params.id ? await getCard(params.id) : null;
  if (params.id && !editing) { location.hash = '#/cartes'; return; }

  const st = {
    deckList: await decks(),
    deckId: editing?.deckId || (await kvGet('lastDeck')) || DEFAULT_DECK.id,
    entry: null, reading: 0, pinyinAuto: !editing, frAuto: !editing,
    showForm: !!editing, confirmDelete: false, newDeck: false,
  };
  if (!st.deckList.some((d) => d.id === st.deckId)) st.deckId = DEFAULT_DECK.id;

  el.innerHTML = `${topBar(editing ? 'Modifier la carte' : 'Créer une carte', {
    back: editing ? '#/cartes' : '#/',
    right: editing ? '' : `<a class="icon-btn" href="#/cartes" aria-label="Mes cartes">${icon('list')}</a>`,
  })}
  <div class="pad create">
    ${editing ? '' : `
    <label class="searchbox">${icon('search')}
      <input id="q" type="search" placeholder="Caractère, pinyin ou mot français" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Rechercher un mot">
    </label>
    <div id="results" class="results" aria-live="polite"></div>
    <button type="button" class="linkish" id="free">Saisir une carte sans chercher</button>`}
    <form id="f" class="cform" ${st.showForm ? '' : 'hidden'} novalidate>
      <div class="preview">
        <div class="zh pv-h" id="pvH"></div>
        <div class="py" id="pvP"></div>
        <div class="pv-f" id="pvF"></div>
        <div class="fc-tools"><button type="button" class="chip" data-say>${icon('sound')} Écouter</button><button type="button" class="chip" data-strokes>${icon('brush')} Traits</button></div>
      </div>
      <label class="field"><span>Caractères</span>
        <input id="hanzi" class="zh" lang="zh-CN" autocomplete="off" maxlength="12" required></label>
      <p class="hint" id="hint" hidden></p>
      <div class="chips" id="readings" hidden></div>
      <label class="field"><span>Pinyin</span>
        <input id="pinyin" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="60"></label>
      <label class="field"><span>Traduction</span>
        <input id="fr" autocomplete="off" maxlength="120" required></label>
      <div class="chips" id="defs" aria-label="Suggestions de traduction"></div>
      <label class="field"><span>Exemple <em>facultatif</em></span>
        <textarea id="ex" rows="2" maxlength="200" placeholder="我爱你。Je t'aime."></textarea></label>
      <div class="field"><span>Paquet</span><div class="chips" id="decks"></div></div>
      <button class="btn" id="save" type="submit">${editing ? 'Enregistrer' : 'Ajouter à mes cartes'}</button>
      ${editing ? `<button type="button" class="btn ghost danger" id="del">${icon('trash')} Supprimer la carte</button>` : ''}
    </form>
  </div>`;

  const $ = (id) => el.querySelector('#' + id);
  const f = { hanzi: $('hanzi'), pinyin: $('pinyin'), fr: $('fr'), ex: $('ex') };

  // ---------- Aperçu de la carte ----------
  const preview = () => {
    $('pvH').textContent = f.hanzi.value.trim() || '字';
    $('pvH').classList.toggle('ph', !f.hanzi.value.trim());
    $('pvP').innerHTML = toneHtml(f.pinyin.value.trim()) || '&nbsp;';
    $('pvF').textContent = f.fr.value.trim();
  };

  // ---------- Suggestions : lectures et traductions ----------
  const drawSuggestions = () => {
    const e = st.entry;
    const rd = e?.readings[st.reading];
    $('readings').hidden = !e || e.readings.length < 2;
    if (e && e.readings.length > 1) {
      $('readings').innerHTML = `<span class="chips-lbl">Plusieurs lectures :</span>` + e.readings.map((r, i) =>
        `<button type="button" class="chip" data-reading="${i}" aria-pressed="${i === st.reading}">${toneHtml(r.pinyin)}</button>`).join('');
    }
    const chosen = f.fr.value.split(',').map((s) => s.trim()).filter(Boolean);
    $('defs').innerHTML = rd ? rd.defs.slice(0, 10).map((d) =>
      `<button type="button" class="chip" data-def="${esc(d)}" aria-pressed="${chosen.includes(d)}">${esc(d)}</button>`).join('') : '';
  };

  const applyReading = () => {
    const rd = st.entry?.readings[st.reading];
    if (!rd) return;
    if (st.pinyinAuto) f.pinyin.value = rd.pinyin;
    if (st.frAuto) f.fr.value = shortDefs(rd.defs);
  };

  // ---------- Contrôles sur le mot saisi ----------
  let checkTimer;
  const checkHanzi = async () => {
    const h = f.hanzi.value.trim();
    const hint = $('hint');
    const notes = [];
    st.entry = null;
    if (h && hasHan(h)) {
      if (!isLoaded()) { try { await loadDict(); } catch {} }
      const found = lookup(h);
      if (found) {
        if (found.fromTrad) { f.hanzi.value = found.hanzi; notes.push(`Écrit en traditionnel : converti en simplifié (${esc(found.hanzi)}).`); }
        st.entry = found;
        st.reading = Math.min(st.reading, found.readings.length - 1);
        applyReading();
      } else {
        if (st.pinyinAuto) f.pinyin.value = guessPinyin(h);
        notes.push('Mot absent du dictionnaire : pinyin proposé caractère par caractère, vérifiez-le.');
      }
      const dup = (await findByHanzi(f.hanzi.value.trim())).filter((c) => c.id !== editing?.id);
      if (dup.length) notes.push(`Déjà dans vos cartes : ${dup.map((c) => `<a href="#/creer/${c.id}">${esc(c.pinyin || c.hanzi)} · ${esc(c.fr)}</a>`).join(', ')}.`);
    } else if (h) {
      notes.push('Saisissez des caractères chinois (clavier chinois du téléphone, ou cherchez le mot ci-dessus).');
    }
    hint.hidden = !notes.length;
    hint.innerHTML = notes.join('<br>');
    drawSuggestions();
    preview();
  };

  // ---------- Paquets ----------
  const drawDecks = () => {
    $('decks').innerHTML = st.deckList.map((d) =>
      `<button type="button" class="chip" data-deck="${d.id}" aria-pressed="${d.id === st.deckId}">${esc(d.name)}</button>`).join('')
      + (st.newDeck
        ? `<span class="newdeck"><input id="deckname" maxlength="40" placeholder="Nom du paquet" autocomplete="off"><button type="button" class="chip on" id="deckok">OK</button></span>`
        : `<button type="button" class="chip add" id="deckadd">${icon('plus')} Nouveau paquet</button>`);
    if (st.newDeck) $('deckname').focus();
  };
  const addDeck = async () => {
    const name = $('deckname')?.value.trim();
    if (name) {
      const d = await createDeck(name);
      st.deckList.push(d);
      st.deckId = d.id;
    }
    st.newDeck = false;
    drawDecks();
  };

  // ---------- Formulaire ----------
  const openForm = (values = {}) => {
    st.pinyinAuto = st.frAuto = true;
    st.reading = 0;
    f.hanzi.value = values.hanzi || '';
    f.pinyin.value = ''; f.fr.value = ''; f.ex.value = '';
    $('f').hidden = false;
    if (!editing) { $('results').innerHTML = ''; $('q').value = ''; }
    checkHanzi().then(() => {
      if (values.reading != null && st.entry) { st.reading = values.reading; applyReading(); drawSuggestions(); preview(); }
    });
    $('f').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!values.hanzi) f.hanzi.focus();
  };

  const resetAfterSave = () => {
    $('f').hidden = true;
    f.hanzi.value = f.pinyin.value = f.fr.value = f.ex.value = '';
    st.entry = null;
    $('hint').hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (editing) {
    f.hanzi.value = editing.hanzi; f.pinyin.value = editing.pinyin || ''; f.fr.value = editing.fr || ''; f.ex.value = editing.example || '';
    loadDict().then(() => { const e = lookup(editing.hanzi); if (e) { st.entry = e; const i = e.readings.findIndex((r) => r.pinyin === editing.pinyin); st.reading = Math.max(0, i); } drawSuggestions(); }).catch(() => {});
  }
  drawDecks();
  preview();

  // ---------- Recherche ----------
  if (!editing) {
    const results = $('results');
    let timer;
    const runSearch = async () => {
      const q = $('q').value.trim();
      if (!q) { results.innerHTML = ''; return; }
      if (!isLoaded()) {
        results.innerHTML = '<p class="muted pad-s">Chargement du dictionnaire…</p>';
        try { await loadDict(); } catch { results.innerHTML = '<p class="muted pad-s">Le dictionnaire n\'a pas pu être chargé. Vérifiez la connexion et réessayez.</p>'; return; }
        if ($('q').value.trim() !== q) return;
      }
      const list = search(q);
      if (!list.length) {
        results.innerHTML = `<p class="muted pad-s">Aucun résultat pour « ${esc(q)} ».${hasHan(q) ? ` <button type="button" class="linkish" data-free="${esc(q)}">Créer la carte quand même</button>` : ''}</p>`;
        return;
      }
      results.innerHTML = `<div class="list">${list.map((g, gi) => g.readings.map((r, ri) => `
        <button type="button" class="row res" data-pick="${gi}" data-reading="${ri}">
          <span class="zh res-h">${esc(g.hanzi)}</span>
          <span class="res-t"><span class="py">${toneHtml(r.pinyin)}</span><small>${esc(shortDefs(r.defs, 3))}</small></span>
          ${LEVEL(r.level)}
        </button>`).join('')).join('')}</div>`;
      results._list = list;
    };
    $('q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 220); });
    $('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); runSearch(); $('q').blur(); } });
    loadDict().catch(() => {}); // préchargement discret
  }

  // ---------- Délégation des clics ----------
  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-say')) return speak(f.hanzi.value.trim());
    if (b.hasAttribute('data-strokes')) return f.hanzi.value.trim() && openStrokes(f.hanzi.value.trim());
    if (b.dataset.pick != null) {
      const g = $('results')._list[+b.dataset.pick];
      openForm({ hanzi: g.hanzi, reading: +b.dataset.reading });
    } else if (b.id === 'free') openForm();
    else if (b.dataset.free) openForm({ hanzi: b.dataset.free });
    else if (b.dataset.reading != null && b.closest('#readings')) {
      st.reading = +b.dataset.reading; st.pinyinAuto = true; st.frAuto = true;
      applyReading(); drawSuggestions(); preview();
    } else if (b.dataset.def != null) {
      const list = f.fr.value.split(',').map((s) => s.trim()).filter(Boolean);
      const d = b.dataset.def;
      const next = list.includes(d) ? list.filter((x) => x !== d) : [...list, d];
      f.fr.value = next.join(', ');
      st.frAuto = false;
      drawSuggestions(); preview();
    } else if (b.dataset.deck) { st.deckId = b.dataset.deck; drawDecks(); }
    else if (b.id === 'deckadd') { st.newDeck = true; drawDecks(); }
    else if (b.id === 'deckok') addDeck();
    else if (b.id === 'del') {
      if (!st.confirmDelete) { st.confirmDelete = true; b.innerHTML = `${icon('trash')} Confirmer la suppression`; b.classList.add('armed'); return; }
      await deleteCard(editing.id);
      toast('Carte supprimée');
      location.hash = '#/cartes';
    }
  };

  el.onkeydown = (e) => { if (e.target.id === 'deckname' && e.key === 'Enter') { e.preventDefault(); addDeck(); } };
  f.hanzi.addEventListener('input', () => { clearTimeout(checkTimer); checkTimer = setTimeout(checkHanzi, 350); preview(); });
  f.pinyin.addEventListener('input', () => { st.pinyinAuto = false; preview(); });
  f.fr.addEventListener('input', () => { st.frAuto = false; drawSuggestions(); preview(); });

  $('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearTimeout(checkTimer);
    const hanzi = f.hanzi.value.trim();
    if (!hanzi || !hasHan(hanzi)) { toast('Ajoutez au moins un caractère chinois'); f.hanzi.focus(); return; }
    if (!st.entry && !editing) await checkHanzi();
    const fr = f.fr.value.trim();
    if (!fr) { toast('Ajoutez une traduction'); f.fr.focus(); return; }
    const data = { hanzi: f.hanzi.value.trim(), pinyin: f.pinyin.value.trim(), fr, example: f.ex.value.trim(), deckId: st.deckId };
    await saveCard(data, editing);
    await kvSet('lastDeck', st.deckId);
    if (editing) { toast('Carte enregistrée'); location.hash = '#/cartes'; return; }
    const deck = st.deckList.find((d) => d.id === st.deckId);
    celebrate(`Ajoutée à « ${deck?.name || 'Mes mots'} »`);
    resetAfterSave();
  });

  return () => { el.onclick = null; el.onkeydown = null; };
}
