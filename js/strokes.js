// Ordre des traits : Hanzi Writer (MIT) et données Make Me a Hanzi (Arphic Public License), embarquées par niveau
import HanziWriter from './vendor/hanzi-writer.mjs';

const v = () => (window.APP_STAMP ? `?v=${window.APP_STAMP}` : '');
let index;
const bundles = {};
const getIndex = () => (index ??= fetch(`data/traits-index.json${v()}`).then((r) => r.json()));
async function charData(c) {
  const b = (await getIndex())[c];
  if (!b) return null;
  bundles[b] ??= fetch(`data/traits-${b}.json${v()}`).then((r) => r.json());
  return (await bundles[b])[c] || null;
}
export async function hasStrokes(word) {
  const idx = await getIndex();
  return [...word].some((c) => idx[c]);
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Crée un caractère animé dans el ; mode 'anim' (démonstration) ou 'quiz' (tracé au doigt)
export async function writer(el, c, { size = 220, mode = 'anim', onDone } = {}) {
  const data = await charData(c);
  if (!data) return null;
  el.innerHTML = '';
  const w = HanziWriter.create(el, c, {
    width: size, height: size, padding: 8,
    charDataLoader: (_, ok) => ok(data),
    strokeColor: css('--ink'), radicalColor: css('--accent'), outlineColor: css('--line'),
    drawingColor: css('--accent'), highlightColor: css('--t3'),
    showOutline: true, showCharacter: mode === 'anim',
    strokeAnimationSpeed: 1, delayBetweenStrokes: 250, drawingWidth: 22,
  });
  if (mode === 'anim') w.animateCharacter({ onComplete: onDone });
  else w.quiz({ showHintAfterMisses: 2, onComplete: (s) => onDone?.(s) });
  return w;
}
