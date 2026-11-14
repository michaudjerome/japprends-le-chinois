import { kvGet, kvSet } from './db.js';

const DEFAULTS = { theme: 'zen', accent: 'seal', tones: true, autoplay: true };
export const settings = { ...DEFAULTS };

export async function loadSettings() {
  Object.assign(settings, DEFAULTS, (await kvGet('settings')) || {});
  applySettings();
}

export async function setSetting(key, value) {
  settings[key] = value;
  applySettings();
  await kvSet('settings', { ...settings });
}

export function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.accent = settings.accent;
  root.classList.toggle('no-tones', !settings.tones);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--paper').trim();
  try { localStorage.setItem('jlc-theme', JSON.stringify({ theme: settings.theme, accent: settings.accent })); } catch {}
}
