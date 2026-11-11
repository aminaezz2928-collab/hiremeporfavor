// The hero's cloudy sky as a frame for a block: a clear cumulus in the middle holds the content,
// blue pixel sky around it, small clouds drifting through. Used on the Impact block of cases.
import { clouds, palette, reducedMotion, seededValues, smoothstep } from './pixel-noise.js';

const THRESHOLDS = [0.7, 0.9, 1.08];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const DITHER = 0.11;
const FRAME_INTERVAL = 1000 / 14;

function setup(block, index) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cloud-frame';
  canvas.setAttribute('aria-hidden', 'true');
  block.prepend(canvas);
  const context = canvas.getContext('2d');
  const colors = palette();
  const wide = window.matchMedia('(min-width: 768px)');
  const s = { cell: 12, cols: 1, rows: 1, width: 0, height: 0, box: null, puffs: [], floaters: [], image: null, pixels: null };

  function measure() {
    const rect = block.getBoundingClientRect();
    s.cell = wide.matches ? 12 : 8;
    s.width = rect.width;
    s.height = rect.height;
    s.cols = Math.max(1, Math.ceil(rect.width / s.cell));
    s.rows = Math.max(1, Math.ceil(rect.height / s.cell));
    canvas.width = s.cols;
    canvas.height = s.rows;
    s.image = context.createImageData(s.cols, s.rows);
    s.pixels = new Uint32Array(s.image.data.buffer);

    // The clear middle follows the block's content box.
    const style = getComputedStyle(block);
    const padX = parseFloat(style.paddingLeft);
    const padY = parseFloat(style.paddingTop);
    const inset = 0.85;
    s.box = { left: padX * inset, right: rect.width - padX * inset, top: padY * inset, bottom: rect.height - padY * inset };

    const scale = wide.matches ? 1 : 0.55;
    const random = seededValues(300, 401 + index * 17);
    let r = 0;
    const next = () => random[(r += 1) % random.length];
    const { box } = s;
    const corners = [[box.left, box.top], [box.right, box.top], [box.right, box.bottom], [box.left, box.bottom]];
    s.puffs = [];
    corners.forEach(([x0, y0], side) => {
      const [x1, y1] = corners[(side + 1) % 4];
      const length = Math.hypot(x1 - x0, y1 - y0);
      const nx = (y1 - y0) / length;
      const ny = -(x1 - x0) / length;
      const steps = Math.max(2, Math.round(length / (110 * scale)));
      for (let k = 0; k < steps; k += 1) {
        const t = (k + 0.5 + (next() - 0.5) * 0.4) / steps;
        const radius = (40 + next() * 34) * scale;
        // Mostly inside the box, so each lobe pushes only a little into the sky.
        const out = -radius * (0.5 + next() * 0.3);
        s.puffs.push({ x: x0 + (x1 - x0) * t + nx * out, y: y0 + (y1 - y0) * t + ny * out, r: radius, phase: next() * 6.28 });
      }
    });

    s.floaters = [];
    const count = wide.matches ? 9 : 5;
    for (let attempt = 0; s.floaters.length < count && attempt < 120; attempt += 1) {
      const w = (50 + next() * 60) * scale;
      const x = next() * rect.width;
      const y = next() * rect.height;
      // Centered in the sky; the clear cloud may cover part of it, like clouds passing behind.
      if (distance(x, y, 0) < w * 0.15) continue;
      if (s.floaters.some((o) => Math.abs(o.x - x) < (o.w + w) * 0.6 && Math.abs(o.y - y) < (o.w + w) * 0.35)) continue;
      const circles = [-0.5, -0.17, 0.17, 0.5].map((u) => {
        const middle = 1 - Math.abs(u) * 1.4;
        return { dx: u * w * 0.8, dy: -middle * w * 0.16, r: w * (0.16 + middle * 0.14) };
      });
      s.floaters.push({ x, y, w, circles, bottom: w * 0.1, speed: (3 + next() * 5) * scale });
    }
  }

  function distance(px, py, time) {
    const { box } = s;
    const qx = Math.max(box.left - px, px - box.right);
    const qy = Math.max(box.top - py, py - box.bottom);
    let d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
    for (const puff of s.puffs) {
      const dp = Math.hypot(px - puff.x, py - puff.y) - puff.r * (1 + Math.sin(time * 0.35 + puff.phase) * 0.06);
      if (dp < d) d = dp;
    }
    return d;
  }

  function floaterAt(px, py, time) {
    const span = s.width + 240;
    for (const f of s.floaters) {
      const cx = ((f.x + time * f.speed + 120) % span) - 120;
      if (Math.abs(px - cx) > f.w || Math.abs(py - f.y) > f.w * 0.6) continue;
      const base = f.y + f.bottom;
      if (py > base) continue;
      let inside = false;
      let inner = false;
      for (const c of f.circles) {
        const dx = px - (cx + c.dx);
        const dy = py - (f.y + c.dy);
        const d2 = dx * dx + dy * dy;
        if (d2 <= c.r * c.r) inside = true;
        if (d2 <= (c.r - s.cell) * (c.r - s.cell)) inner = true;
      }
      if (inside) return inner && py <= base - s.cell * 1.1 ? 1 : 2;
    }
    return 0;
  }

  function draw(time) {
    const { cols, rows, cell, pixels } = s;
    const reach = wide.matches ? 26 : 16;
    const depthSpan = Math.max(60, Math.min(s.width, s.height) * 0.25);
    for (let y = 0; y < rows; y += 1) {
      const py = (y + 0.5) * cell;
      for (let x = 0; x < cols; x += 1) {
        const px = (x + 0.5) * cell;
        const n = clouds(px * 0.006 + time * 0.03 + index * 7, py * 0.009 - time * 0.02);
        const d = distance(px, py, time) + (n - 0.5) * reach * 0.5;
        const edge = smoothstep(0, reach, d);
        let value = edge * (0.93 + Math.min(1, d / depthSpan) * 0.3 + (n - 0.5) * 0.14);
        if (value > 0.6) {
          const part = floaterAt(px, py, time);
          if (part === 1) value = 0;
          else if (part === 2) value = 0.8;
        }
        const checked = value + BAYER[((y & 3) << 2) | (x & 3)] * DITHER;
        let color = 0;
        if (value > 0) {
          if (checked >= THRESHOLDS[2]) color = colors[2];
          else if (checked >= THRESHOLDS[1]) color = colors[1];
          else if (checked >= THRESHOLDS[0]) color = colors[0];
        }
        pixels[y * cols + x] = color;
      }
    }
    context.putImageData(s.image, 0, 0);
  }

  return { block, measure, draw };
}

export function initCloudFrames() {
  const blocks = [...document.querySelectorAll('[data-cloud-frame]')];
  if (!blocks.length) return;
  const still = reducedMotion();
  const items = blocks.map(setup);
  const visible = new Set();
  let raf = 0;
  let last = 0;
  const start = performance.now();
  const now = () => (still ? 12 : (performance.now() - start) / 1000 + 4);

  const tick = (t) => {
    raf = visible.size ? requestAnimationFrame(tick) : 0;
    if (t - last < FRAME_INTERVAL) return;
    last = t;
    visible.forEach((item) => item.draw(now()));
  };

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    const item = items.find((i) => i.block === entry.target);
    if (entry.isIntersecting) visible.add(item);
    else visible.delete(item);
    if (!still && visible.size && !raf) raf = requestAnimationFrame(tick);
  }), { rootMargin: '100px' });

  const resize = new ResizeObserver((entries) => entries.forEach((entry) => {
    const item = items.find((i) => i.block === entry.target);
    item.measure();
    item.draw(now());
  }));

  items.forEach((item) => {
    item.measure();
    item.draw(now());
    observer.observe(item.block);
    resize.observe(item.block);
  });
}
