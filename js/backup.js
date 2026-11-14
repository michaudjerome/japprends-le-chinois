// Sauvegarde : export et import d'un fichier, rien ne passe par Internet
import { getAll, put, kvGet, kvSet } from './db.js';
import { settings, loadSettings } from './settings.js';
import { APP_VERSION } from './version.js';
import { dayKey } from './ui.js';

export async function exportBackup() {
  const [cards, decks, logs] = await Promise.all([getAll('cards'), getAll('decks'), getAll('logs')]);
  const data = { app: 'japprends-le-chinois', format: 1, version: APP_VERSION, exported: new Date().toISOString(), settings: { ...settings }, cards, decks, logs };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `japprends-le-chinois-${dayKey()}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  await kvSet('lastBackup', Date.now());
  return cards.length;
}

// Fusion : une carte présente des deux côtés garde la version la plus récente
export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (data?.app !== 'japprends-le-chinois' || !Array.isArray(data.cards)) throw new Error('Ce fichier n\'est pas une sauvegarde de J\'apprends le chinois.');
  const mine = new Map((await getAll('cards')).map((c) => [c.id, c]));
  let added = 0, updated = 0;
  for (const d of data.decks || []) await put('decks', d);
  for (const c of data.cards) {
    const m = mine.get(c.id);
    if (!m) { await put('cards', c); added++; }
    else if ((c.updated || 0) > (m.updated || 0) || (c.fsrs?.last_review || 0) > (m.fsrs?.last_review || 0)) { await put('cards', c); updated++; }
  }
  const seen = new Set((await getAll('logs')).map((l) => `${l.ts}:${l.cardId}`));
  for (const l of data.logs || []) { if (!seen.has(`${l.ts}:${l.cardId}`)) { const { id, ...rest } = l; await put('logs', rest); } }
  if (data.settings) { await kvSet('settings', { ...settings, ...data.settings }); await loadSettings(); }
  return { added, updated };
}

// Rappel mensuel : dès qu'il y a de quoi perdre (15 cartes, la plus ancienne a plus d'une semaine)
export async function backupDue(cards) {
  if (cards.length < 15) return false;
  const oldest = Math.min(...cards.map((c) => c.created || Date.now()));
  const last = (await kvGet('lastBackup')) || oldest;
  return Date.now() - oldest > 7 * 864e5 && Date.now() - last > 30 * 864e5;
}
