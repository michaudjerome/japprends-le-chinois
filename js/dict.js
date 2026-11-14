// Dictionnaire chinois-français embarqué (dérivé de CFDICT, CC BY-SA 3.0), chargé à la demande.
// Entrée : [simplifié, traditionnel ou '', pinyin à tons, définitions séparées par '/', niveau HSK (0 = hors liste)]
let loading;
let E, bySimp, byTrad, firstReading;

export const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'u').toLowerCase();
const flat = (s) => strip(s).replace(/[\s'’·\-1-5]/g, '').replace(/v/g, 'u');
export const hasHan = (s) => /\p{Script=Han}/u.test(s);

export function loadDict() {
  loading ??= fetch('data/dict-fr.json?v=' + (window.APP_STAMP || '')).then((r) => {
    if (!r.ok) throw new Error('Dictionnaire introuvable');
    return r.json();
  }).then((d) => {
    E = d.e;
    bySimp = new Map(); byTrad = new Map(); firstReading = new Map();
    E.forEach((e, i) => {
      e.push(flat(e[2]), strip(e[3]));
      (bySimp.get(e[0]) || bySimp.set(e[0], []).get(e[0])).push(i);
      if (e[1]) (byTrad.get(e[1]) || byTrad.set(e[1], []).get(e[1])).push(i);
      if (e[0].length === 1 && !firstReading.has(e[0])) firstReading.set(e[0], e[2]);
    });
    return true;
  });
  return loading;
}
export const isLoaded = () => !!E;

const reading = (e) => ({ pinyin: e[2], defs: e[3].split('/'), level: e[4] });

// Regroupe les lectures d'un même mot (ex. 行 : háng / xíng)
function group(indexes, limit = 25) {
  const out = new Map();
  for (const i of indexes) {
    const e = E[i];
    if (!out.has(e[0])) {
      if (out.size >= limit) continue;
      out.set(e[0], { hanzi: e[0], readings: [], level: 0 });
    }
    const g = out.get(e[0]);
    const same = g.readings.find((r) => r.pinyin === e[2]);
    if (same) { for (const d of e[3].split('/')) if (!same.defs.includes(d)) same.defs.push(d); if (e[4] && (!same.level || e[4] < same.level)) same.level = e[4]; }
    else g.readings.push(reading(e));
    if (e[4] && (!g.level || e[4] < g.level)) g.level = e[4];
  }
  return [...out.values()];
}

// Mot exact en caractères simplifiés (ou traditionnels convertis)
export function lookup(hanzi) {
  if (!E) return null;
  let idx = bySimp.get(hanzi);
  let fromTrad = false;
  if (!idx && byTrad.has(hanzi)) { idx = byTrad.get(hanzi); fromTrad = true; }
  if (!idx) return null;
  const g = group(idx)[0];
  return { ...g, fromTrad };
}

// Pinyin approximatif caractère par caractère, pour un mot absent du dictionnaire
export function guessPinyin(hanzi) {
  if (!E) return '';
  return [...hanzi].map((c) => firstReading.get(c) || '').join('');
}

// Recherche libre : caractères, pinyin (avec ou sans tons) ou mot français
export function search(q) {
  if (!E) return [];
  q = q.trim();
  if (!q) return [];
  if (hasHan(q)) {
    const exact = [...(bySimp.get(q) || []), ...(byTrad.get(q) || [])];
    const starts = [];
    for (let i = 0; i < E.length && starts.length < 200; i++) if (E[i][0] !== q && E[i][0].startsWith(q)) starts.push(i);
    return group([...exact, ...starts]);
  }
  const fq = flat(q);
  const sq = strip(q);
  const scored = [];
  const wordRe = new RegExp(`(^|[^a-z])${sq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    let s = 0;
    if (fq && e[5] === fq) s = 100;
    else if (fq.length >= 2 && e[5].startsWith(fq)) s = 40;
    if (sq.length >= 2) {
      const defs = e[6].split('/');
      if (defs.some((d) => d === sq)) s = Math.max(s, 90);
      else if (defs.some((d) => d.replace(/^(un|une|le|la|les|l'|se|s')\s*/, '') === sq)) s = Math.max(s, 85);
      else if (defs.some((d) => d.startsWith(sq + ' (') || d.startsWith(sq + ' !'))) s = Math.max(s, 80);
      else if (sq.length >= 3 && wordRe.test(e[6])) s = Math.max(s, 30);
    }
    if (!s) continue;
    if (e[4]) s += 20 - e[4] * 2; // mots HSK d'abord, les niveaux bas en tête
    else s -= 12;
    s -= e[0].length;
    scored.push([s, i]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  return group(scored.map((x) => x[1]));
}

// Découpe un pinyin à tons en syllabes, pour colorer chaque ton
const INI = '(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?';
const FIN = ['iang', 'iong', 'uang', 'ueng', 'ang', 'eng', 'ing', 'ong', 'ian', 'iao', 'uai', 'uan', 'van', 'ai', 'ao', 'an', 'ei', 'en', 'er', 'ia', 'ie', 'in', 'iu', 'ou', 'ua', 'uo', 'ui', 'un', 've', 'ue', 'a', 'o', 'e', 'i', 'u', 'v', 'n', 'ng', 'm'];
const SYL = new RegExp(`^${INI}(?:${FIN.join('|')})r?$`);
const TONE = { 1: /[āēīōūǖ]/, 2: /[áéíóúǘ]/, 3: /[ǎěǐǒǔǚ]/, 4: /[àèìòùǜ]/ };
const toneOf = (s) => +(Object.keys(TONE).find((t) => TONE[t].test(s)) || 0);

function split(word) {
  const base = strip(word).replace(/u/g, 'u');
  const memo = new Map();
  const go = (i) => {
    if (i === base.length) return [];
    if (memo.has(i)) return memo.get(i);
    let res = null;
    for (let j = Math.min(base.length, i + 7); j > i && !res; j--) {
      if (SYL.test(base.slice(i, j).replace(/ü/g, 'v'))) { const rest = go(j); if (rest) res = [[i, j], ...rest]; }
    }
    memo.set(i, res);
    return res;
  };
  return (go(0) || [[0, word.length]]).map(([a, b]) => word.slice(a, b));
}

export function toneHtml(py) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return String(py || '').split(/([\s'’]+)/).map((part) => {
    if (!part || /^[\s'’]+$/.test(part)) return esc(part);
    if (!/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(part)) return esc(part);
    return split(part).map((s) => `<span class="t${toneOf(s)}">${esc(s)}</span>`).join('');
  }).join('');
}

// Mots d'un niveau HSK, dans l'ordre de la liste officielle, une lecture par mot
const shortFr = (defs) => defs.split('/').filter((d) => !/^(\(|variante|cf\.|voir )/i.test(d)).slice(0, 2).join(', ') || defs.split('/')[0];
const levelCache = {};
export function entriesOfLevel(level) {
  if (!E) return [];
  if (levelCache[level]) return levelCache[level];
  const seen = new Set();
  const out = [];
  for (const e of E) {
    if (e[4] !== level || seen.has(e[0])) continue;
    seen.add(e[0]);
    out.push({ hanzi: e[0], pinyin: e[2], fr: shortFr(e[3]), level });
  }
  return (levelCache[level] = out);
}
