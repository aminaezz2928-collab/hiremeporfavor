import { renderInline } from './inline.js';

const STORAGE_KEY = 'lang';
const PENDING = 'translation pending';
const dictionaries = new Map();

async function loadDictionary(lang) {
  if (!dictionaries.has(lang)) {
    const response = await fetch(new URL(`../i18n/${lang}.json`, import.meta.url));
    if (!response.ok) throw new Error(`i18n: ${lang}.json returned ${response.status}`);
    dictionaries.set(lang, await response.json());
  }
  return dictionaries.get(lang);
}

const lookup = (dictionary, path) => path.split('.').reduce((node, key) => node?.[key], dictionary);

function readStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode: the choice just will not persist.
  }
}

async function applyLanguage(lang) {
  const [fallback, dictionary] = await Promise.all([loadDictionary('ru'), loadDictionary(lang)]);
  // Empty EN strings fall back to Russian until stage 7.
  const translate = (path) => lookup(dictionary, path) || lookup(fallback, path);

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.innerHTML = renderInline(translate(element.dataset.i18n));
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.alt = translate(element.dataset.i18nAlt);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAria));
  });

  const pending = dictionary._meta?.status === PENDING;
  document.querySelector('.lang-notice').hidden = !pending;
  // While EN is pending the visible text is still Russian, so lang stays accurate for screen readers.
  document.documentElement.lang = pending ? 'ru' : lang;
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
  });
}

export function initI18n() {
  const switchLanguage = (lang) => {
    applyLanguage(lang)
      .then(() => storeLang(lang))
      .catch((error) => console.error(error));
  };

  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => switchLanguage(button.dataset.lang));
  });

  if (readStoredLang() === 'en') switchLanguage('en');
}
