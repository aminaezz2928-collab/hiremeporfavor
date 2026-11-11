// Figures in cases count up from zero once they come into view. Only the digits move:
// signs, arrows and words stay as written, and the final width is reserved so nothing shifts.
import { reducedMotion } from './pixel-noise.js';

const DIGITS = /\d+(?:[.,]\d+)?/g;
const DURATION = 1800;
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

function prepare(element) {
  const text = element.textContent;
  if (!/\d/.test(text)) return null;
  // Width of the final text is kept for the whole run.
  element.style.minWidth = `${element.getBoundingClientRect().width}px`;
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(DIGITS)) {
    parts.push(text.slice(last, match.index));
    const decimals = match[0].split(/[.,]/)[1]?.length ?? 0;
    parts.push({ target: parseFloat(match[0].replace(',', '.')), decimals, comma: match[0].includes(',') });
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return { element, text, parts };
}

function render({ element, parts }, progress) {
  element.textContent = parts
    .map((part) => {
      if (typeof part === 'string') return part;
      const value = (part.target * progress).toFixed(part.decimals);
      return part.comma ? value.replace('.', ',') : value;
    })
    .join('');
}

function run(item) {
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / DURATION);
    render(item, easeOutExpo(t));
    if (t < 1) requestAnimationFrame(frame);
    else item.element.textContent = item.text;
  };
  requestAnimationFrame(frame);
}

export function initCountUp() {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  const items = new Map();
  document.querySelectorAll('.number-value, .result-value').forEach((element) => {
    const item = prepare(element);
    if (item) items.set(element, item);
  });
  if (!items.size) return;

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    run(items.get(entry.target));
  }), { threshold: 0.2 });

  items.forEach((item, element) => {
    // Already on screen at load: start from zero right away.
    render(item, 0);
    observer.observe(element);
  });
}
