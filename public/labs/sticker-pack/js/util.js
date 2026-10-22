export const BOARD_W = 1280;
export const BOARD_H = 800;
export const CREAM = '#f5f3ef';
export const INK = '#11110f';
export const ORANGE = '#f1592a';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Frame-rate independent exponential approach.
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], t)));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Picks a colour along a looping list of stops, t in stop units.
function cycleColor(stops, t) {
  const n = stops.length;
  const f = ((t % n) + n) % n;
  const i = Math.floor(f);
  return mixHex(stops[i], stops[(i + 1) % n], f - i);
}

// Pastel foil colours, in the order the reference shifts through them
// as the pointer moves from left to right.
export const HOLO = ['#f4a5cf', '#f1c8aa', '#eef0a8', '#a0edd3', '#9fe0f0', '#a8c4f8', '#d4b0f4'];
export const holoColor = (t) => cycleColor(HOLO, t);

export function el(tag, cls, parent) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (parent) parent.appendChild(node);
  return node;
}

// Rounded polygon path for Canvas/Three shapes: points [[x,y],...], radius r.
export function roundedPolyPath(path, pts, r) {
  const n = pts.length;
  if (r <= 0) {
    pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
    path.closePath?.();
    return;
  }
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const a = [p1[0] + ((p0[0] - p1[0]) * rr) / d1, p1[1] + ((p0[1] - p1[1]) * rr) / d1];
    const b = [p1[0] + ((p2[0] - p1[0]) * rr) / d2, p1[1] + ((p2[1] - p1[1]) * rr) / d2];
    if (i === 0) path.moveTo(a[0], a[1]);
    else path.lineTo(a[0], a[1]);
    path.quadraticCurveTo(p1[0], p1[1], b[0], b[1]);
  }
  path.closePath?.();
}

// Same as roundedPolyPath, as an SVG path string.
export function roundedPolyD(pts, r) {
  let d = '';
  roundedPolyPath(
    {
      moveTo: (x, y) => (d += `M${f(x)} ${f(y)}`),
      lineTo: (x, y) => (d += `L${f(x)} ${f(y)}`),
      quadraticCurveTo: (cx, cy, x, y) => (d += `Q${f(cx)} ${f(cy)} ${f(x)} ${f(y)}`),
      closePath: () => (d += 'Z'),
    },
    pts,
    r,
  );
  return d;
}

export const f = (v) => Math.round(v * 100) / 100;

export function regularPoly(n, r, startDeg = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + (360 / n) * i) * Math.PI) / 180;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

export function starPoly(n, ro, ri, startDeg = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((startDeg + (180 / n) * i) * Math.PI) / 180;
    const r = i % 2 === 0 ? ro : ri;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

// Clips a convex polygon to the half-plane (p - m) . u >= 0.
export function clipHalfPlane(poly, m, u) {
  const out = [];
  const side = (p) => (p[0] - m[0]) * u[0] + (p[1] - m[1]) * u[1];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
