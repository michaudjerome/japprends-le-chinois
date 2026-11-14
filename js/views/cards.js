// Mes cartes : liste par paquet, recherche, gestion des paquets
import { decks, allCards, renameDeck, deleteDeck, DEFAULT_DECK } from '../cards.js';
import { toneHtml, strip } from '../dict.js';
import { topBar, icon, esc, toast } from '../ui.js';

export async function render(el, params) {
  const st = { deck: params.paquet || 'all', q: '', manage: false, confirm: null };
  let deckList = await decks();
  let cards = await allCards();

  el.innerHTML = `${topBar('Mes cartes', { right: `<a class="icon-btn" href="#/creer" aria-label="Créer une carte">${icon('plus')}</a>` })}
  <div class="pad cards">
    <label class="searchbox">${icon('search')}
      <input id="filter" type="search" placeholder="Filtrer mes cartes" autocomplete="off" autocapitalize="off" aria-label="Filtrer mes cartes"></label>
    <div class="chips scroll" id="decks"></div>
    <div id="manage"></div>
    <div id="list"></div>
  </div>`;
  const $ = (id) => el.querySelector('#' + id);

  const drawDecks = () => {
    const n = (id) => cards.filter((c) => c.deckId === id).length;
    $('decks').innerHTML = `<button class="chip" data-deck="all" aria-pressed="${st.deck === 'all'}">Toutes · ${cards.length}</button>`
      + deckList.map((d) => `<button class="chip" data-deck="${d.id}" aria-pressed="${st.deck === d.id}">${esc(d.name)} · ${n(d.id)}</button>`).join('');
    const d = deckList.find((x) => x.id === st.deck);
    $('manage').innerHTML = d ? (st.manage
      ? `<div class="manage"><input id="dname" value="${esc(d.name)}" maxlength="40" aria-label="Nom du paquet">
          <button class="chip on" data-act="rename">Renommer</button>
          ${d.id === DEFAULT_DECK.id ? '' : `<button class="chip danger" data-act="delete">${st.confirm === d.id ? 'Confirmer' : 'Supprimer'}</button>`}
          <button class="chip" data-act="close">Fermer</button></div>
        ${d.id === DEFAULT_DECK.id ? '' : '<p class="hint">Supprimer le paquet garde ses cartes : elles rejoignent « Mes mots ».</p>'}`
      : `<button class="linkish" data-act="open">Gérer le paquet « ${esc(d.name)} »</button>`) : '';
  };

  const drawList = () => {
    const q = strip(st.q.trim());
    const shown = cards
      .filter((c) => st.deck === 'all' || c.deckId === st.deck)
      .filter((c) => !q || c.hanzi.includes(st.q.trim()) || strip(c.pinyin).replace(/[\s']/g, '').includes(q.replace(/[\s']/g, '')) || strip(c.fr).includes(q))
      .sort((a, b) => b.created - a.created);
    if (!cards.length) {
      $('list').innerHTML = `<div class="empty"><span class="zh" aria-hidden="true">写</span>
        <p class="serif" style="font-size:20px;font-weight:700">Aucune carte pour l'instant</p>
        <p class="muted">Cherche un mot en chinois, en pinyin ou en français : la carte se remplit toute seule.</p>
        <a class="btn" href="#/creer" style="max-width:240px;margin-top:10px">Créer ma première carte</a></div>`;
      return;
    }
    $('list').innerHTML = shown.length
      ? `<div class="list">${shown.map((c) => `<a class="row card-row" href="#/creer/${c.id}">
          <span class="zh res-h">${esc(c.hanzi)}</span>
          <span class="res-t"><span class="py">${toneHtml(c.pinyin)}</span><small>${esc(c.fr)}</small></span>
          <span class="muted" style="width:18px">${icon('chevron')}</span></a>`).join('')}</div>`
      : '<p class="muted pad-s">Aucune carte ne correspond.</p>';
  };

  drawDecks(); drawList();
  $('filter').addEventListener('input', (e) => { st.q = e.target.value; drawList(); });

  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.deck) { st.deck = b.dataset.deck; st.manage = false; st.confirm = null; drawDecks(); drawList(); return; }
    const d = deckList.find((x) => x.id === st.deck);
    switch (b.dataset.act) {
      case 'open': st.manage = true; break;
      case 'close': st.manage = false; st.confirm = null; break;
      case 'rename': {
        const name = $('dname').value.trim();
        if (!name) return toast('Donne un nom au paquet');
        await renameDeck(d, name); toast('Paquet renommé'); st.manage = false; break;
      }
      case 'delete':
        if (st.confirm !== d.id) { st.confirm = d.id; break; }
        await deleteDeck(d.id); toast('Paquet supprimé'); st.deck = 'all'; st.manage = false; st.confirm = null;
        cards = await allCards(); break;
      default: return;
    }
    deckList = await decks();
    drawDecks(); drawList();
  };
  return () => { el.onclick = null; };
}
