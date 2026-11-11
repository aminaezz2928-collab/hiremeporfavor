// Shared pixel-mosaic primitives: seeded values, value noise, the checker dither and the palette.
export const THRESHOLDS = [0.7, 0.9, 1.08];
export const CHECKER = [-0.375, 0.125, 0.375, -0.125];

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function seededValues(size, seed = 41) {
  let state = seed;
  return Float32Array.from({ length: size }, () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  });
}

const LATTICE = seededValues(256);
const STIR = Uint8Array.from(seededValues(256), (v) => Math.floor(v * 256));

export function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = x - xi;
  const v = y - yi;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const at = (i, j) => LATTICE[(STIR[i & 255] + j) & 255];
  const top = at(xi, yi) + su * (at(xi + 1, yi) - at(xi, yi));
  const bottom = at(xi, yi + 1) + su * (at(xi + 1, yi + 1) - at(xi, yi + 1));
  return top + sv * (bottom - top);
}

export const clouds = (x, y) => valueNoise(x, y) * 0.68 + valueNoise(x * 2.1 + 7, y * 2.1 + 3) * 0.32;

export function packColor(cssColor) {
  const hex = cssColor.trim().replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function palette() {
  const styles = getComputedStyle(document.documentElement);
  return ['--texture-light', '--texture-mid', '--accent', '--bg'].map((name) => packColor(styles.getPropertyValue(name)));
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
