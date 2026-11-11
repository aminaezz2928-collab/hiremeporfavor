// Every heading stays within two lines: if it wraps further, its size steps down until it fits.
// The hero title is left out, it never wraps by design.
const SELECTOR = 'main h1:not(.hero h1), main h2, main h3, .next-title';
const MAX_LINES = 2;
const MIN_SCALE = 0.5;

const lineCount = (element) => {
  const style = getComputedStyle(element);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
  return Math.round(element.getBoundingClientRect().height / lineHeight);
};

function fit(elements) {
  elements.forEach((element) => {
    element.style.fontSize = '';
    if (!element.getClientRects().length) return;
    const base = parseFloat(getComputedStyle(element).fontSize);
    let size = base;
    while (lineCount(element) > MAX_LINES && size > base * MIN_SCALE) {
      size *= 0.94;
      element.style.fontSize = `${size}px`;
    }
  });
}

export function initHeadingFit() {
  const elements = [...document.querySelectorAll(SELECTOR)];
  if (!elements.length) return;
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fit(elements);
    });
  };
  fit(elements);
  document.fonts.ready.then(schedule);
  window.addEventListener('resize', schedule);
  // Language switches rewrite heading text, so sizes are recalculated after them too.
  document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => setTimeout(schedule, 400)));
}
