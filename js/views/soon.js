import { topBar, esc } from '../ui.js';

// Écran provisoire pour les modes pas encore livrés
export function make(title, zh, step) {
  return {
    render(el) {
      el.innerHTML = `${topBar(title)}
      <div class="empty"><span class="zh" aria-hidden="true">${zh}</span>
        <p class="serif" style="font-size:20px;font-weight:700">${esc(title)}</p>
        <p class="muted">Arrive à l'étape ${step}.</p>
        <a class="btn ghost" href="#/" style="max-width:220px;margin-top:10px">Retour à l'accueil</a></div>`;
    },
  };
}
