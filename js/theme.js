const STORAGE_KEY = 'theme';

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode: the choice just will not persist.
  }
}

// The inline script in <head> applies the saved theme before first paint.
export function initTheme() {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  const root = document.documentElement;
  button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));

  button.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    if (dark) root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    button.setAttribute('aria-pressed', String(dark));
    storeTheme(dark ? 'dark' : 'light');
  });
}
