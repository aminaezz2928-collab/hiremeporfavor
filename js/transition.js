// Page change as clouds: two pixel cloud banks roll in from the sides and meet, the next page opens
// covered, and the banks part to reveal it. Plain navigation when motion is reduced.
import { palette, reducedMotion, seededValues } from './pixel-noise.js';

const KEY = 'pixel-wipe';
const COVER_MS = 520;
const REVEAL_MS = 760;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function overlay() {
  const cell = window.innerWidth >= 768 ? 16 : 10;
  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-wipe';
  canvas.setAttribute('aria-hidden', 'true');
  const cols = Math.ceil(window.innerWidth / cell);
  const rows = Math.ceil(window.innerHeight / cell);
  canvas.width = cols;
  canvas.height = rows;
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  const image = context.createImageData(cols, rows);
  const pixels = new Uint32Array(image.data.buffer);
  // [light, mid, accent, page background]: the cloud bodies are the page colour, so the covered
  // screen reads as one big cloud, with the blue sky only at the far edges.
  const colors = palette();
  const random = seededValues(400, 911);
  let k = 0;
  const next = () => random[(k += 1) % random.length];
  // Each bank is rows of round cloud lobes: big ones along the front, smaller ones in the blue behind.
  // Narrow screens get smaller clouds, so the sky between them still shows.
  const f = Math.min(1, Math.max(0.5, cols / 90));
  const bank = () => [
    { back: 0, size: [7 * f, 12 * f], gap: 1.15 },
    { back: 15 * f, size: [4 * f, 8 * f], gap: 2.2 },
    { back: 27 * f, size: [3 * f, 6 * f], gap: 3 },
  ].flatMap((row) => {
    const list = [];
    let y = -3 - next() * 4;
    while (y < rows + 4) {
      const r = row.size[0] + next() * (row.size[1] - row.size[0]);
      // Front lobes are single round puffs; clouds behind are small cumulus: three puffs and a flat bottom.
      list.push({ y: y + r * 0.5, r, back: row.back + r * (0.2 + next() * 0.3), cumulus: row.back > 0 });
      y += r * row.gap + next() * r * 0.5;
    }
    return list;
  });
  return { canvas, context, image, pixels, colors, cols, rows, left: bank(), right: bank() };
}

// What a bank shows at a cell: 0 nothing, 1 cloud rim, 2 cloud body, 3 sky; plus how deep the sky is.
function bankAt(x, y, front, lobes, cols) {
  let best = -Infinity;
  for (const lobe of lobes) {
    const cx = front - lobe.back;
    if (!lobe.cumulus) {
      const inside = lobe.r - Math.hypot(x - cx, y - lobe.y);
      if (inside > best) best = inside;
      continue;
    }
    const bottom = lobe.y + lobe.r * 0.45;
    if (y > bottom) continue;
    for (const [dx, dy, k] of [[-0.95, 0.15, 0.62], [0, -0.1, 1], [0.95, 0.15, 0.62]]) {
      const inside = lobe.r * k - Math.hypot(x - (cx + dx * lobe.r), y - (lobe.y + dy * lobe.r));
      // The flat bottom gets the same light rim as the round edges.
      const edged = Math.min(inside, bottom - y + 0.5);
      if (edged > best) best = edged;
    }
  }
  if (best >= 1) return [2, 0];
  if (best > 0) return [1, 0];
  if (x < front) return [3, (front - x) / Math.max(10, cols * 0.34)];
  return [0, 0];
}

// progress 0: banks out of sight; 1: banks meet in the middle and cover the screen.
function paint(o, progress) {
  const { cols, rows, pixels, colors } = o;
  const reach = cols / 2 + 14;
  const front = -14 + reach * progress;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const a = bankAt(x + 0.5, y + 0.5, front, o.left, cols);
      const b = bankAt(cols - x - 0.5, y + 0.5, front, o.right, cols);
      // Cloud wins over sky; between two skies the deeper one shows.
      const [kind, deep] = a[0] === 2 || b[0] === 2 ? [2, 0] : a[0] === 1 || b[0] === 1 ? [1, 0] : a[0] === 3 && b[0] === 3 ? [3, Math.min(a[1], b[1])] : a[0] === 3 ? a : b;
      let color = 0;
      if (kind === 1) color = colors[0];
      else if (kind === 2) color = colors[3];
      else if (kind === 3) {
        const sky = deep + BAYER[((y & 3) << 2) | (x & 3)] * 0.3;
        color = sky < 0.25 ? colors[0] : sky < 0.75 ? colors[1] : colors[2];
      }
      pixels[y * cols + x] = color;
    }
  }
  o.context.putImageData(o.image, 0, 0);
}

function run(o, duration, from, to, done) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    paint(o, from + (to - from) * ease(t));
    if (t < 1) requestAnimationFrame(step);
    else done();
  };
  requestAnimationFrame(step);
}

export function initTransitions() {
  if (sessionStorage.getItem(KEY)) {
    sessionStorage.removeItem(KEY);
    if (!reducedMotion()) {
      const o = overlay();
      paint(o, 1);
      run(o, REVEAL_MS, 1, 0, () => o.canvas.remove());
    }
  }

  // Coming back through history must never show a stuck curtain.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.querySelectorAll('.pixel-wipe').forEach((c) => c.remove());
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-transition]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reducedMotion()) return;
    event.preventDefault();
    const o = overlay();
    sessionStorage.setItem(KEY, '1');
    run(o, COVER_MS, 0, 1, () => { window.location.href = link.href; });
  });
}
