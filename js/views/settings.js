import { settings, setSetting } from '../settings.js';
import { topBar, icon, toast, esc } from '../ui.js';
import { APP_VERSION } from '../version.js';
import { voiceReady, speak } from '../speech.js';
import { exportBackup, importBackup } from '../backup.js';
import { kvGet } from '../db.js';

const ACCENTS = [
  ['seal', '#B3352B', 'Rouge sceau'], ['jade', '#2E7D6B', 'Jade'],
  ['indigo', '#34508C', 'Indigo'], ['prune', '#7B3B6B', 'Prune'],
];
const seg = (key, values, fmt = (v) => v) => `<div class="seg">${values.map((v) =>
  `<button data-set="${key}" data-val="${v}" aria-pressed="${settings[key] === v}">${fmt(v)}</button>`).join('')}</div>`;

export async function render(el) {
  const voice = await voiceReady();
  const last = await kvGet('lastBackup');
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
      <section class="group"><h2>Nouveaux mots par jour</h2>${seg('newPerDay', [5, 10, 15, 20])}</section>
      <section class="group"><h2>Objectif du jour (cartes révisées)</h2>${seg('dailyGoal', [10, 20, 30, 50])}</section>
      <section class="group"><h2>Voix chinoise</h2>
        <div class="list"><div class="row"><span>${voice ? `Voix installée<small>${esc(voice.name)}</small>` : 'Aucune voix chinoise trouvée<small>La prononciation ne fonctionnera pas.</small>'}</span>
          ${voice ? `<button class="chip" data-test>${icon('sound')} 你好</button>` : ''}</div></div>
        ${voice ? '' : `<p class="hint" style="margin-top:8px">Sur Android : Paramètres › Système › Langues › Synthèse vocale › moteur Google › Installer les données vocales › Chinois (Chine). Puis rouvrez l'application. Les intitulés varient selon les téléphones.</p>`}
      </section>
      <section class="group"><h2>Sauvegarde</h2>
        <div class="list">
          <button class="row" data-export><span>Exporter mes cartes<small>${last ? `Dernière sauvegarde le ${new Date(last).toLocaleDateString('fr-FR')}` : 'Jamais sauvegardé'}</small></span><span class="muted" style="width:18px">${icon('chevron')}</span></button>
          <label class="row" style="cursor:pointer"><span>Importer une sauvegarde<small>Fusionne avec les cartes du téléphone</small></span><input type="file" accept="application/json,.json" id="imp" hidden><span class="muted" style="width:18px">${icon('chevron')}</span></label>
        </div>
        <p class="hint" style="margin-top:8px">Les cartes ne vivent que dans ce téléphone. Gardez le fichier exporté en lieu sûr (Drive, e-mail) : il permet de tout récupérer sur un nouveau téléphone.</p>
      </section>
      <section class="group"><h2>À propos</h2>
        <div class="list">
          <a class="row" href="#/sources"><span>Sources et licences<small>Dictionnaire, listes HSK, ordre des traits, polices</small></span><span class="muted" style="width:18px">${icon('chevron')}</span></a>
        </div>
      </section>
      <p class="foot">J'apprends le chinois · version ${APP_VERSION}</p>
    </div>`;
    el.querySelector('#imp').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const r = await importBackup(f); toast(`Import réussi : ${r.added} carte${r.added > 1 ? 's' : ''} ajoutée${r.added > 1 ? 's' : ''}, ${r.updated} mise${r.updated > 1 ? 's' : ''} à jour`); draw(); }
      catch (err) { toast(err.message || 'Fichier illisible'); }
    };
  };
  draw();
  el.onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.themeBtn) await setSetting('theme', b.dataset.themeBtn);
    else if (b.dataset.accentBtn) await setSetting('accent', b.dataset.accentBtn);
    else if (b.dataset.toggle) await setSetting(b.dataset.toggle, !settings[b.dataset.toggle]);
    else if (b.dataset.set) await setSetting(b.dataset.set, +b.dataset.val);
    else if (b.hasAttribute('data-test')) return speak('你好');
    else if (b.hasAttribute('data-export')) { const n = await exportBackup(); toast(`${n} carte${n > 1 ? 's' : ''} exportée${n > 1 ? 's' : ''}`); }
    else return;
    draw();
  };
  return () => { el.onclick = null; };
}
