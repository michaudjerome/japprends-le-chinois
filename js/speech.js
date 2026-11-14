// Prononciation : synthèse vocale du téléphone (voix chinoise zh-CN), sans réseau
let voice = null;
let ready;

function pick() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /^zh[-_]CN/i.test(v.lang) && v.localService) || vs.find((v) => /^zh[-_]CN/i.test(v.lang))
    || vs.find((v) => /^(zh|cmn)/i.test(v.lang)) || null;
  return voice;
}

export function voiceReady() {
  if (!('speechSynthesis' in window)) return Promise.resolve(null);
  ready ??= new Promise((res) => {
    if (pick()) return res(voice);
    const done = () => res(pick());
    speechSynthesis.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
  return ready;
}

export async function speak(text, rate = 0.85) {
  if (!('speechSynthesis' in window) || !text) return false;
  const v = await voiceReady();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  if (v) u.voice = v;
  u.rate = rate;
  speechSynthesis.speak(u);
  return !!v;
}
