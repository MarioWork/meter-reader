// Puts the stored theme on the page before the first paint, so a dark page never flashes light while the app loads.
// A plain script, run from index.html's <head>: the CSP allows no inline script. Mirrors THEME_STORAGE_KEY,
// readStoredTheme and resolveTheme in src/common/utils/themeUtils.ts: change both together.
(function applyStoredTheme() {
  const THEME_STORAGE_KEY = 'meter-reader-theme';
  let storedTheme = null;

  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage blocked (site data off, a private window): follow the device.
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = storedTheme === 'dark' || (storedTheme !== 'light' && prefersDark);

  document.documentElement.classList.toggle('dark', isDark);
})();
