// Full-screen pixel transition, after shreygups.com: a grid of cells fills in
// from the point the visitor clicked, in a stepped, jagged front, coloured
// from a slow field of the destination's palette. Once the screen is covered
// the page underneath changes, then the cells clear from the same origin.
const CELL = 22;
const GAP = 1;
const COVER_MS = 520;
const UNCOVER_MS = 480;
const JITTER_MS = 110;
// Each cell grows (cover) or shrinks (uncover) over this long instead of
// popping, so the front reads as motion rather than flicker.
const CELL_MS = 150;
// Gaps are filled with this instead of left transparent: transparent gaps let
// the page show through as thin white lines on the light theme.
const GROUT = '#120f0d';

let canvas = null;
let state = null;

const hexToRgb = (hex) => {
  const value = parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

// Cheap deterministic hash for per-block jitter: blocks of 3x3 cells share a
// delay, which is what gives the front its staircase edge.
const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// Smooth colour field: three slow sines mixed across the palette.
const fieldColor = (palette, cx, cy, time) => {
  const t =
    0.5 +
    0.25 * Math.sin(cx * 0.11 + time * 0.6) +
    0.25 * Math.sin(cy * 0.09 - time * 0.45 + cx * 0.04);
  const x = Math.min(0.999, Math.max(0, t)) * (palette.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = palette[i];
  const b = palette[i + 1];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)}, ${Math.round(a[1] + (b[1] - a[1]) * f)}, ${Math.round(
    a[2] + (b[2] - a[2]) * f
  )})`;
};

const ensureCanvas = () => {
  if (canvas) return canvas;
  canvas = document.createElement('canvas');
  canvas.className = 'pixel-transition';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  return canvas;
};

const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

const run = (mode, duration) =>
  new Promise((resolve) => {
    const { cols, rows, delays, maxDelay, palette, context, started, ratio } = state;
    const begin = performance.now();
    // Cell edges on whole device pixels, so no fractional seams between them.
    const edge = (n) => Math.round(n * CELL * ratio);
    const tick = (now) => {
      const elapsed = now - begin;
      const time = (now - started) / 1000;
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let row = 0; row < rows; row += 1) {
        const y0 = edge(row);
        const y1 = edge(row + 1);
        for (let col = 0; col < cols; col += 1) {
          const reach = (delays[row * cols + col] / maxDelay) * duration;
          const local = Math.min(1, Math.max(0, (elapsed - reach) / CELL_MS));
          const amount = mode === 'cover' ? easeOut(local) : 1 - easeOut(local);
          if (amount <= 0) continue;
          const x0 = edge(col);
          const x1 = edge(col + 1);
          const size = x1 - x0;
          const gap = Math.max(1, Math.round(GAP * ratio));
          if (amount >= 1) {
            // Settled cell: grout fills the whole cell, colour sits inside it.
            context.fillStyle = GROUT;
            context.fillRect(x0, y0, size, y1 - y0);
            context.fillStyle = fieldColor(palette, col, row, time);
            context.fillRect(x0 + gap, y0 + gap, size - gap, y1 - y0 - gap);
          } else {
            // Growing or shrinking cell, centred in its slot.
            const inner = Math.round(size * amount);
            const offset = Math.round((size - inner) / 2);
            context.fillStyle = fieldColor(palette, col, row, time);
            context.fillRect(x0 + offset, y0 + offset, inner, inner);
          }
        }
      }
      if (elapsed < duration + CELL_MS + 16) state.frame = requestAnimationFrame(tick);
      else resolve();
    };
    state.frame = requestAnimationFrame(tick);
  });

export async function pixelCover({ x, y, palette }) {
  const el = ensureCanvas();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = window.innerWidth;
  const height = window.innerHeight;
  el.width = Math.round(width * ratio);
  el.height = Math.round(height * ratio);
  el.style.display = 'block';
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const originCol = x / CELL;
  const originRow = y / CELL;
  const delays = new Float32Array(cols * rows);
  let maxDelay = 1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.hypot(col - originCol, row - originRow);
      const jitter = hash(Math.floor(col / 3), Math.floor(row / 3)) * JITTER_MS * 0.05;
      const delay = distance + jitter * 4;
      delays[row * cols + col] = delay;
      if (delay > maxDelay) maxDelay = delay;
    }
  }
  cancelAnimationFrame(state?.frame);
  state = {
    cols,
    rows,
    delays,
    maxDelay,
    ratio,
    palette: palette.map(hexToRgb),
    context: el.getContext('2d'),
    started: performance.now(),
  };
  await run('cover', COVER_MS);
}

export async function pixelUncover() {
  if (!state || !canvas) return;
  await run('uncover', UNCOVER_MS);
  canvas.style.display = 'none';
}

// Resolves once the page underneath has rendered a few smooth frames in a
// row, so the uncover does not start while the newly mounted view is still
// doing its first heavy layout and decode work. Capped so it never hangs.
export function waitForCalm({ frames = 3, budget = 20, max = 700 } = {}) {
  return new Promise((resolve) => {
    const start = performance.now();
    let last = start;
    let calm = 0;
    const tick = (now) => {
      calm = now - last < budget ? calm + 1 : 0;
      last = now;
      if (calm >= frames || now - start > max) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
