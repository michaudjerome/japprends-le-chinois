// Petits mots d'accueil : selon le prénom, le jour, le moment de la journée et la progression.
// Le message reste le même pendant un moment de la journée (pas de changement à chaque ouverture).

const SLOTS = [
  // [heure de début, clé, titre]
  [0, 'nuit', (n) => `Douce nuit${n ? `, ${n}` : ''} 🌙`],
  [5, 'matin', (n) => `Bonjour${n ? `, ${n}` : ''} ☀️`],
  [11, 'midi', (n) => `Coucou${n ? `, ${n}` : ''} 🌻`],
  [14, 'aprem', (n) => `Bon après-midi${n ? `, ${n}` : ''} 🌞`],
  [18, 'soir', (n) => `Bonsoir${n ? `, ${n}` : ''} ✨`],
  [22, 'nuit', (n) => `Douce soirée${n ? `, ${n}` : ''} 🌙`],
];

const BY_SLOT = {
  matin: [
    'Un café, un caractère, et la journée commence en beauté ☀️☕',
    'Le matin, la mémoire est toute fraîche : moment parfait 🌞',
    'Nouvelle journée, nouveaux mots. Ça va être une belle journée 🌻',
    'Le soleil se lève, et toi tu apprends le chinois. Trop classe ☀️💫',
    'Petit matin tout doux, petits mots tout doux 🌸☕',
    'Rayonnante dès le réveil, comme toujours 🌞',
  ],
  midi: [
    'Une petite pause bien méritée : quelques cartes avec ton déjeuner ? 🍜😋',
    'Mi-journée, plein d\'énergie : un petit tour de cartes ? 🌻',
    'Entre deux bouchées, un caractère ou deux, miam 🥢✨',
    'La pause de midi, c\'est sacré. Et le chinois, c\'est le petit bonus 🌞',
  ],
  aprem: [
    'Un thé, quelques cartes, et l\'après-midi devient encore plus doux 🍵🌸',
    'Un petit quiz pour pétiller tout l\'après-midi ? 🎈',
    'Chaque carte révisée est une petite victoire. Et elles s\'additionnent 🏆',
    'Tu avances un peu plus chaque jour, c\'est magnifique 🌻',
    'Le soleil brille, et ton chinois aussi 🌞✨',
  ],
  soir: [
    'La journée est faite. Quelques cartes, tranquille et au calme ✨🕯️',
    'Le soir, on révise en douceur, et la nuit range tout dans ta tête 🌙',
    'Une petite séance cocooning ? Tu le mérites tellement 🧸💛',
    'Bravo pour ta journée ! Le chinois, c\'est le dessert 🍰',
    'Plaid, tisane et caractères chinois : la soirée parfaite 🍵🌸',
  ],
  nuit: [
    'Une ou deux cartes toutes douces, puis de jolis rêves 🌙✨',
    'Les étoiles brillent, et toi aussi ⭐',
    'Quelques mots avant de dormir, ils feront de beaux rêves avec toi 💫',
  ],
};

const BY_DAY = {
  1: ['Lundi plein de soleil : on démarre la semaine du bon pied ☀️', 'Joli lundi ! Une carte après l\'autre, tout en douceur 🌻'],
  2: ['Mardi, la semaine prend son rythme, et toi tu rayonnes 🌞'],
  3: ['Mercredi, déjà la moitié de la semaine : tu gères 🌈'],
  4: ['Jeudi, le week-end approche à grands pas 🎈'],
  5: ['Vendredi ! Une petite séance pour finir la semaine en beauté 🎉', 'C\'est vendredi, ça sent bon le week-end 🌻✨'],
  6: ['Samedi tout doux : le chinois en pyjama, ça compte aussi 🧸', 'Week-end ! Quelques cartes juste pour le plaisir ☀️🌸'],
  0: ['Dimanche cocooning : un thé, un plaid, et quelques caractères 🍵💛', 'Dimanche paisible, parfait pour revoir les mots de la semaine 🌷'],
};

// Dates spéciales (mois-jour)
const SPECIAL = {
  '1-1': 'Bonne année ! 新年快乐, une belle année d\'apprentissage commence 🎆✨',
  '2-14': 'Joyeuse Saint-Valentin 💌 我爱你 se dit wǒ ài nǐ 💕',
  '3-20': 'C\'est le printemps ! 春天 chūntiān 🌸🌷',
  '6-21': 'Bon été ! 夏天 xiàtiān, place au soleil ☀️🌻',
  '12-24': 'Joyeux réveillon ! Un petit mot de chinois sous le sapin 🎄✨',
  '12-25': 'Joyeux Noël ! 圣诞快乐 🎄🎁',
  '12-31': 'Dernier jour de l\'année : regarde tout ce joli chemin parcouru ✨🥂',
};
// Nouvel An chinois (date variable)
const SPRING = { 2027: '2-6', 2028: '1-26', 2029: '2-13', 2030: '2-3' };

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function greeting(name, ctx = {}, now = new Date()) {
  const h = now.getHours();
  const slot = [...SLOTS].reverse().find(([start]) => h >= start);
  const key = slot[1];
  const title = slot[2](name);
  const md = `${now.getMonth() + 1}-${now.getDate()}`;
  if (SPRING[now.getFullYear()] === md) return { title, line: 'Joyeux Nouvel An chinois ! 春节快乐 🧧🏮✨' };
  if (SPECIAL[md]) return { title, line: SPECIAL[md] };

  // Messages liés à la progression, prioritaires quand ils existent
  const ctxLines = [];
  if (ctx.goalReached) ctxLines.push('Objectif du jour atteint, tu es une championne 🏆✨', 'Objectif rempli ! Tout le reste, c\'est du bonus 🎉');
  else if (ctx.cards && ctx.due === 0) ctxLines.push('Tout est révisé : tes cartes font la sieste, profite bien 😴🌸');
  if (ctx.streak >= 2) ctxLines.push(`${ctx.streak} jours de suite, quelle belle régularité 🔥🌻`, `Série de ${ctx.streak} jours, trop fière de toi 💪✨`);
  if (!ctx.cards) ctxLines.push('Prête pour tes premiers mots ? C\'est parti 🌸☀️');

  const seed = hash(`${now.toDateString()}|${key}`);
  if (ctxLines.length && seed % 10 < 3) return { title, line: ctxLines[(seed >>> 4) % ctxLines.length] };
  const pool = [...BY_SLOT[key], ...(BY_DAY[now.getDay()] || [])];
  return { title, line: pool[(seed >>> 8) % pool.length] };
}
