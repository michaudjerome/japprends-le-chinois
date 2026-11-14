// Mise à niveau du contenu : quand un paquet est corrigé, les cartes déjà ajoutées suivent,
// sauf si l'utilisatrice a modifié la carte elle-même (sa version est alors gardée).
import { getAll, put, kvGet, kvSet } from './db.js';

const v = () => (window.APP_STAMP ? `?v=${window.APP_STAMP}` : '');

export async function syncContent() {
  if (!window.APP_STAMP || (await kvGet('contentStamp')) === window.APP_STAMP) return 0;
  const packs = (await (await fetch(`data/packs.json${v()}`)).json()).packs;
  // mot → version actuelle et anciennes versions connues
  const ref = new Map();
  for (const p of packs) for (const [h, py, fr, , prev] of p.words) {
    ref.set(h, { py, fr, oldFr: [fr, ...(prev?.fr || [])], oldPy: [py, ...(prev?.py || [])] });
  }
  let n = 0;
  for (const c of await getAll('cards')) {
    const r = ref.get(c.hanzi);
    if (!r) continue;
    const next = { ...c };
    if (c.fr !== r.fr && r.oldFr.includes(c.fr)) next.fr = r.fr;
    if (c.pinyin !== r.py && r.oldPy.includes(c.pinyin)) next.pinyin = r.py;
    if (next.fr !== c.fr || next.pinyin !== c.pinyin) { next.updated = c.updated; await put('cards', next); n++; }
  }
  await kvSet('contentStamp', window.APP_STAMP);
  return n;
}
