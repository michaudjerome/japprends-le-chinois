import { settings, setSetting } from '../settings.js';
import { topBar, icon } from '../ui.js';
import { APP_VERSION } from '../version.js';

const ACCENTS = [
  ['seal', '#B3352B', 'Rouge sceau'], ['jade', '#2E7D6B', 'Jade'],
  ['indigo', '#34508C', 'Indigo'], ['prune', '#7B3B6B', 'Prune'],
];

export function render(el) {
  const draw = () => {
    el.innerHTML = `${topBar('Réglages')}
    <div class="pad">
      <section class="group"><h2>Thème</h2>
        <div class="seg">
          <button data-theme-btn="zen" aria-pressed="${settings.theme === 'zen'}">Zen papier</button>
          <button data-theme-btn="nuit" aria-pressed="${settings.theme === 'nuit'}">Nuit encre</button>
        </div>
      </section>
      <section class="group"><h2>Couleur d'accent</h2>
        <div class="list"><div class="row"><div class="swatches">
          ${ACCENTS.map(([k, c, n]) => `<button class="swatch" style="background:${c}" data-accent-btn="${k}" aria-label="${n}" aria-pressed="${settings.accent === k}"></button>`).join('')}
        </div></div></div>
      </section>
      <section class="group"><h2>Cartes</h2>
        <div class="list">
          <button class="row" data-toggle="tones"><span>Tons en couleur<small>
            <span class="t1">1er</span> · <span class="t2">2e</span> · <span class="t3">3e</span> · <span class="t4">4e</span> · <span class="t0">neutre</span></small></span>
            <span class="switch" role="switch" aria-checked="${settings.tones}"></span></button>
          <button class="row" data-toggle="autoplay"><span>Prononcer automatiquement<small>Lecture du mot quand le pinyin apparaît</small></span>
            <span class="switch" role="switch" aria-checked="${settings.autoplay}"></span></button>
        </div>
      </section>
      <section class="group"><h2>À propos</h2>
        <div class="list">
          <a class="row" href="#/sources"><span>Sources et licences<small>Dictionnaire, listes HSK, polices</small></span><span class="muted" style="width:18px">${icon('chevron')}</span></a>
        </div>
      </section>
      <p class="foot">J'apprends le chinois · version ${APP_VERSION}</p>
    </div>`;
  };
  draw();
  el.onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.themeBtn) await setSetting('theme', b.dataset.themeBtn);
    else if (b.dataset.accentBtn) await setSetting('accent', b.dataset.accentBtn);
    else if (b.dataset.toggle) await setSetting(b.dataset.toggle, !settings[b.dataset.toggle]);
    else return;
    draw();
  };
  return () => { el.onclick = null; };
}
