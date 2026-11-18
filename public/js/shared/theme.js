// ============================================================
// theme.js — Modo claro / oscuro
//
// La preferencia ('auto', 'light' o 'dark') se guarda en este navegador; 'auto' sigue al
// sistema. El <head> ya pone data-theme antes de pintar (sin destello); aquí se cambia, se
// sigue al sistema en vivo y se avisa con el evento «themechange» para que el mapa repinte
// los colores que Leaflet pone desde JS (no leen var()).
// ============================================================
const THEME_KEY = 'cyl.theme';
const _themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function themePref() {
  try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; }
}

function applyTheme(pref) {
  const root = document.documentElement;
  const theme = pref === 'dark' || (pref === 'auto' && _themeMedia.matches) ? 'dark' : 'light';
  const changed = root.dataset.theme !== theme;
  root.dataset.theme = theme;
  root.dataset.themePref = pref;
  renderThemeSwitch();
  if (changed) document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function setThemePref(pref) {
  try { localStorage.setItem(THEME_KEY, pref); } catch { /* sin almacenamiento: solo esta visita */ }
  applyTheme(pref);
}

_themeMedia.addEventListener('change', () => { if (themePref() === 'auto') applyTheme('auto'); });

// Valor de un token de color tal como se ve dentro de un elemento (por defecto, el mapa)
function themeColor(name, el) {
  const target = el || document.getElementById('spa-mapa') || document.documentElement;
  return getComputedStyle(target).getPropertyValue(name).trim();
}

// Selector de tres posiciones: marca la opción elegida
function renderThemeSwitch() {
  const pref = document.documentElement.dataset.themePref || themePref();
  document.querySelectorAll('[data-theme-switch] [data-pref]').forEach(btn => {
    const on = btn.dataset.pref === pref;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

registerActions({ 'theme': d => setThemePref(d.pref) });
renderThemeSwitch();
