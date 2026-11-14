import { topBar } from '../ui.js';

// Mentions imposées par les licences des données et polices embarquées
export function render(el) {
  el.innerHTML = `${topBar('Sources et licences', { back: '#/reglages' })}
  <div class="pad prose">
    <p>L'application fonctionne entièrement hors ligne. Elle embarque les ressources libres suivantes ; merci à leurs auteurs.</p>

    <h2>Dictionnaire chinois-français</h2>
    <p><b>CFDICT</b>, le dictionnaire chinois-français libre de Chine Informations (David Houstin), version du 14/12/2024 :
      <a href="https://chine.in" target="_blank" rel="noopener">chine.in</a>.</p>
    <p>Licence <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank" rel="noopener">Creative Commons BY-SA 3.0</a>.
      Les fichiers de données dérivés de CFDICT dans cette application (data/dict-fr.json : dictionnaire compacté, croisé avec les niveaux HSK) sont diffusés sous la même licence.</p>

    <h2>Listes HSK 3.0</h2>
    <p>Vocabulaire du HSK 3.0 (niveaux 1 à 6 et 7-9) issu du projet
      <a href="https://github.com/ivankra/hsk30" target="_blank" rel="noopener">ivankra/hsk30</a>,
      licence MIT, © 2023 Ivan Krasilnikov, © 2021 Shawky, © 2021 Pleco Inc.</p>

    <h2>Ordre des traits</h2>
    <p>Animations et tracé au doigt par <a href="https://github.com/chanind/hanzi-writer" target="_blank" rel="noopener">Hanzi Writer</a> (licence MIT, © David Chanin),
      données <a href="https://github.com/skishore/makemeahanzi" target="_blank" rel="noopener">Make Me a Hanzi</a> via hanzi-writer-data,
      dérivées de polices Arphic, sous <a href="https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT" target="_blank" rel="noopener">Arphic Public License</a>.</p>

    <h2>Répétition espacée</h2>
    <p>Algorithme FSRS via <a href="https://github.com/open-spaced-repetition/ts-fsrs" target="_blank" rel="noopener">ts-fsrs</a>, licence MIT, © Open Spaced Repetition.</p>

    <h2>Paquets pour débuter</h2>
    <p>Sélection de mots HSK 1 et 2 par thème, traductions rédigées pour l'application à partir de CFDICT : diffusées sous la même licence CC BY-SA 3.0.</p>

    <h2>Polices</h2>
    <ul>
      <li><b>LXGW WenKai</b> (caractères chinois), © LXGW, SIL Open Font License 1.1. Version réduite aux caractères utiles, pour un usage web.</li>
      <li><b>Inter</b>, © The Inter Project Authors, SIL Open Font License 1.1.</li>
      <li><b>Fraunces</b>, © The Fraunces Project Authors, SIL Open Font License 1.1.</li>
    </ul>

    <p class="muted" style="margin-top:22px">Les textes complets des licences se trouvent dans le dossier LICENSES du code source de l'application.</p>
  </div>`;
}
