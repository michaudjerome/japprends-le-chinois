// Cartes et paquets
import { get, getAll, put, del, getAllByIndex, uid } from './db.js';

export const DEFAULT_DECK = { id: 'mes-mots', name: 'Mes mots' };

export async function decks() {
  const all = await getAll('decks');
  if (!all.some((d) => d.id === DEFAULT_DECK.id)) {
    const d = { ...DEFAULT_DECK, created: Date.now() };
    await put('decks', d);
    all.unshift(d);
  }
  return all.sort((a, b) => (a.id === DEFAULT_DECK.id ? -1 : b.id === DEFAULT_DECK.id ? 1 : a.created - b.created));
}

export async function createDeck(name) {
  const d = { id: uid(), name: name.trim().slice(0, 40), created: Date.now() };
  await put('decks', d);
  return d;
}

export const renameDeck = async (deck, name) => put('decks', { ...deck, name: name.trim().slice(0, 40) });

// Supprime un paquet : ses cartes rejoignent « Mes mots »
export async function deleteDeck(id) {
  if (id === DEFAULT_DECK.id) return;
  for (const c of await getAllByIndex('cards', 'deckId', id)) await put('cards', { ...c, deckId: DEFAULT_DECK.id });
  await del('decks', id);
}

export const findByHanzi = (hanzi) => getAllByIndex('cards', 'hanzi', hanzi);
export const getCard = (id) => get('cards', id);
export const allCards = () => getAll('cards');

export async function saveCard(data, existing) {
  const now = Date.now();
  const card = existing
    ? { ...existing, ...data, updated: now }
    // Nouvelle carte : due tout de suite ; les champs de répétition espacée arrivent à l'étape 2
    : { id: uid(), ...data, created: now, updated: now, due: now, state: 0, reps: 0, lapses: 0 };
  await put('cards', card);
  return card;
}

export const deleteCard = (id) => del('cards', id);
