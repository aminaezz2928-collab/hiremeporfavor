// The hero's pixel mosaic continues on the large work cards of the home page: it lives in the
// card's margin and drifts slowly while the card is on screen.
import { CHECKER, THRESHOLDS, clouds, palette, reducedMotion, smoothstep } from './pixel-noise.js';

const CELL = 10;
const FRAME_INTERVAL = 1000 / 14;

export function initPixelFrames() {
  const frames = [...document.querySelectorAll('[data-pixel-pad]')];
  if (!frames.length) return;
  const colors = palette();
  const still = reducedMotion();
  const visible = new Set();
  let last = 0;
  let raf = 0;

  const items = frames.map((frame, index) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'frame-pixels';
    canvas.setAttribute('aria-hidden', 'true');
    frame.prepend(canvas);
    return { frame, canvas, context: canvas.getContext('2d'), seed: index * 37.7, image: null, pixels: null, pad: 0 };
  });

  function size(item) {
    const rect = item.frame.getBoundingClientRect();
    const cols = Math.max(1, Math.ceil(rect.width / CELL));
    const rows = Math.max(1, Math.ceil(rect.height / CELL));
    item.canvas.width = cols;
    item.canvas.height = rows;
    item.image = item.context.createImageData(cols, rows);
    item.pixels = new Uint32Array(item.image.data.buffer);
    item.pad = Number(item.frame.dataset.pixelPad) || parseFloat(getComputedStyle(item.frame).paddingTop) || 32;
  }

  function draw(item, time) {
    const { canvas, pixels, pad, seed } = item;
    const cols = canvas.width;
    const rows = canvas.height;
    const w = cols * CELL;
    const h = rows * CELL;
    for (let y = 0; y < rows; y += 1) {
      const py = (y + 0.5) * CELL;
      for (let x = 0; x < cols; x += 1) {
        const px = (x + 0.5) * CELL;
        // Distance into the margin, measured from the content edge outward.
        const inset = Math.min(px, w - px, py, h - py);
        const n = clouds(px * 0.011 + seed + time * 0.05, py * 0.014 - time * 0.03);
        const edge = smoothstep(pad * 0.95, pad * 0.1, inset - (n - 0.5) * pad * 1.2);
        const value = edge * (0.62 + n * 0.8);
        const checked = value + CHECKER[((y & 1) << 1) | (x & 1)] * 0.09;
        let color = 0;
        if (value > 0) {
          if (checked >= THRESHOLDS[2]) color = colors[2];
          else if (checked >= THRESHOLDS[1]) color = colors[1];
          else if (checked >= THRESHOLDS[0]) color = colors[0];
        }
        pixels[y * cols + x] = color;
      }
    }
    item.context.putImageData(item.image, 0, 0);
  }

  function tick(now) {
    raf = visible.size ? requestAnimationFrame(tick) : 0;
    if (now - last < FRAME_INTERVAL) return;
    last = now;
    visible.forEach((item) => draw(item, now / 1000));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = items.find((i) => i.frame === entry.target);
      if (entry.isIntersecting) {
        visible.add(item);
        draw(item, performance.now() / 1000);
      } else {
        visible.delete(item);
      }
    });
    if (!still && visible.size && !raf) raf = requestAnimationFrame(tick);
  }, { rootMargin: '120px' });

  const resize = new ResizeObserver((entries) => entries.forEach((entry) => {
    const item = items.find((i) => i.frame === entry.target);
    size(item);
    draw(item, performance.now() / 1000);
  }));

  items.forEach((item) => {
    size(item);
    draw(item, 0);
    observer.observe(item.frame);
    resize.observe(item.frame);
  });
}
