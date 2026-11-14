// Feuille « Ordre des traits » : démonstration animée puis tracé au doigt, caractère par caractère
import { writer } from './strokes.js';
import { esc, icon, celebrate } from './ui.js';

export function openStrokes(word) {
  const chars = [...word].filter((c) => /\p{Script=Han}/u.test(c));
  if (!chars.length) return;
  let i = 0;
  let mode = 'anim';
  document.querySelector('.sheet-wrap')?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Ordre des traits">
    <div class="sheet-top"><span class="ttl">Ordre des traits</span>
      <button class="icon-btn" data-x aria-label="Fermer">${icon('close')}</button></div>
    <div class="chips sheet-chars">${chars.map((c, k) => `<button class="chip zh" data-i="${k}">${esc(c)}</button>`).join('')}</div>
    <div class="writer" id="writer"></div>
    <p class="hint sheet-msg" id="smsg"></p>
    <div class="sheet-btns"><button class="btn ghost" data-anim>Revoir</button><button class="btn" data-trace>${icon('brush')} Tracer au doigt</button></div>
  </div>`;
  document.body.append(wrap);
  const box = wrap.querySelector('#writer');
  const msg = wrap.querySelector('#smsg');
  const size = Math.min(260, window.innerWidth - 80);

  const draw = async () => {
    wrap.querySelectorAll('[data-i]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.i === i));
    msg.textContent = mode === 'anim' ? 'Regarde l\'ordre des traits.' : 'À toi : trace chaque trait dans l\'ordre.';
    const w = await writer(box, chars[i], {
      size, mode,
      onDone: (s) => {
        if (mode !== 'quiz') return;
        celebrate(s?.totalMistakes ? `Tracé ! ${s.totalMistakes} erreur${s.totalMistakes > 1 ? 's' : ''}` : 'Tracé parfait', s?.totalMistakes ? '好' : '胜');
        if (i < chars.length - 1) setTimeout(() => { i++; mode = 'anim'; draw(); }, 1300);
      },
    });
    if (!w) { box.innerHTML = `<div class="zh" style="font-size:${size * 0.7}px;line-height:1">${esc(chars[i])}</div>`; msg.textContent = 'Ordre des traits indisponible pour ce caractère (hors listes HSK).'; }
  };
  wrap.onclick = (e) => {
    if (e.target === wrap || e.target.closest('[data-x]')) return wrap.remove();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.i != null) { i = +b.dataset.i; mode = 'anim'; draw(); }
    else if (b.hasAttribute('data-anim')) { mode = 'anim'; draw(); }
    else if (b.hasAttribute('data-trace')) { mode = 'quiz'; draw(); }
  };
  draw();
}
