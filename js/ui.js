// Petits utilitaires d'interface
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const P = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  brush: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 6l3 3"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
};
export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[name]}</svg>`;

export function topBar(title, { back = '#/', closeIcon = false, right = '' } = {}) {
  return `<div class="top">
    <a class="icon-btn" href="${back}" aria-label="${closeIcon ? 'Fermer' : 'Retour'}">${icon(closeIcon ? 'close' : 'back')}</a>
    <span class="ttl">${esc(title)}</span>
    <span style="width:40px;display:flex;justify-content:flex-end">${right}</span></div>`;
}

let toastTimer;
export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
  document.body.append(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2600);
}

// Date locale du jour au format AAAA-MM-JJ (pour les séries de jours)
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Petite victoire : un sceau d'encre qui se pose, avec des éclats autour
const CHEERS = [['好', 'Bravo'], ['棒', 'Super'], ['对', 'Parfait']];
export function celebrate(sub = '', glyph) {
  const [zh, fr] = glyph ? [glyph, ''] : CHEERS[Math.floor(Math.random() * CHEERS.length)];
  document.querySelector('.cheer')?.remove();
  const c = document.createElement('div');
  c.className = 'cheer'; c.setAttribute('role', 'status');
  const bits = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + Math.random() * .4, d = 70 + Math.random() * 40;
    return `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--s:${.5 + Math.random() * .8}"></i>`;
  }).join('');
  c.innerHTML = `<div class="cheer-stamp"><span class="zh">${esc(zh)}</span>${bits}</div><p>${esc(sub || fr)}</p>`;
  document.body.append(c);
  try { navigator.vibrate?.(25); } catch {}
  setTimeout(() => c.classList.add('out'), 950);
  setTimeout(() => c.remove(), 1300);
}
