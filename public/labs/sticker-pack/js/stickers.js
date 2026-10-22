import {
  CREAM, INK, ORANGE, f, holoColor, mixHex, roundedPolyD, regularPoly, starPoly, rand, clamp, el,
} from './util.js';
import { eyeSize } from './eyes.js';
import { Shape3D, dieCut, glEpoch } from './shapes3d.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const BORDER = 7; // die-cut border width around the 3D characters, design px
const CUBE_STEPS = 12; // cached colour steps for the logo cube

// ---------------------------------------------------------------- helpers

const rr = (x, y, w, h, r) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)}Z`;
const circ = (r, cx = 0, cy = 0) => `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
// Japanese runs get lang="ja" so screen readers and fonts treat them right.
const jaLang = (s) => (/[\u3040-\u30ff\u4e00-\u9fff]/.test(s) ? ' lang="ja"' : '');
const txt = (s, x, y, size, opts = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${opts.weight || 500}"${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}${opts.ls != null ? ` letter-spacing="${opts.ls}"` : ''} fill="${opts.fill || INK}"${jaLang(s)}>${s}</text>`;

// Holo gradient stops; colours are refreshed from the pointer each frame.
const holoStops = (offsets) =>
  offsets.map((h, i) => `<stop offset="${f(i / (offsets.length - 1))}" data-h="${h}" stop-color="${holoColor(h)}"/>`).join('');

// Pills for flat II eyes; Sticker.updateFlatEyes animates them.
const eyeGroup = (cx, cy, color, w, h, slant) =>
  `<g class="eye" data-cx="${cx}" data-cy="${cy}" data-w="${w}" data-h="${h}" transform="translate(${cx} ${cy}) rotate(${slant})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${color}"/></g>`;

const sparkles = (pts, color = 'rgba(255,255,255,0.55)') =>
  pts.map(([x, y, s = 2.6]) => `<path d="M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}" stroke="${color}" stroke-width="0.9"/>`).join('');

function numberCircle(d, color, num, label) {
  const R = d / 2;
  return {
    w: d,
    h: d,
    sil: circ(R),
    hit: { kind: 'ellipse', hw: R, hh: R },
    svg: () => `
      <circle r="${R}" fill="${CREAM}"/>
      <circle r="${R - 4.5}" fill="${color}"/>
      ${txt(num, 0, 8, 40, { anchor: 'middle', ls: -0.6, fill: CREAM, weight: 450 })}
      ${txt(label, 0, 25.5, 11.5, { anchor: 'middle', ls: -0.15, fill: CREAM })}`,
  };
}

function eyeCircle(d, color, ew, eh) {
  const R = d / 2;
  return {
    w: d,
    h: d,
    sil: circ(R),
    hit: { kind: 'ellipse', hw: R, hh: R },
    eyes: true,
    svg: () => `
      <circle r="${R}" fill="${CREAM}"/>
      <circle r="${R - 5}" fill="${color}"/>
      ${eyeGroup(-ew * 0.78, 0, CREAM, ew, eh, 6)}
      ${eyeGroup(ew * 0.78, 0, CREAM, ew, eh, 6)}`,
  };
}

function bubble(bw, bh, by, tail, text, size, sub) {
  const body = rr(-bw / 2, by - bh / 2, bw, bh, 12);
  const [a, b, tip] = tail;
  const tailD = `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${tip[0]} ${tip[1]}Z`;
  return {
    sil: `${body}${tailD}`,
    hit: { kind: 'rect', hw: bw / 2, hh: bh / 2, oy: by, rad: 12 },
    svg: () => `
      <path d="${body}" fill="${CREAM}"/>
      <path d="${tailD}" fill="${CREAM}" stroke="${CREAM}" stroke-width="2" stroke-linejoin="round"/>
      ${txt(text, 0, by + (sub ? 3 : 8), size, { anchor: 'middle', ls: -0.25 })}
      ${sub ? txt(sub, 0, by + 20, 9, { anchor: 'middle', ls: 0.2, fill: 'rgba(17,17,15,0.55)' }) : ''}`,
  };
}

// ------------------------------------------------------------- definitions
// Positions, sizes and rotations measured from the reference frame,
// in 1280 x 800 artboard units.

export const DEFS = [
  { id: 'logo', kind: 'logo', x: 209, y: 116, r: -2, w: 226, h: 88 },
  {
    id: 'semi', x: 676, y: 113, r: 4, w: 200, h: 116,
    sil: 'M-95 42A95 95 0 0 1 95 42V48Q95 52 91 52H-91Q-95 52 -95 48Z',
    hit: { kind: 'ellipse', hw: 95, hh: 53, oy: 0 },
    svg: (id) => `
      <path d="M-95 42A95 95 0 0 1 95 42V48Q95 52 91 52H-91Q-95 52 -95 48Z" fill="${CREAM}"/>
      <path d="M-91 42A91 91 0 0 1 91 42V45Q91 48 88 48H-88Q-91 48 -91 45Z" fill="${INK}"/>
      <path id="${id}-arc" d="M-72.3 66A77 77 0 1 1 72.3 66" fill="none"/>
      <text font-size="13" font-weight="500" letter-spacing="2.05" fill="${CREAM}"><textPath href="#${id}-arc" startOffset="50%" text-anchor="middle">FORWARD DEPLOYED</textPath></text>
      ${txt('Shipped.', 0, 30, 28, { anchor: 'middle', ls: -0.4, fill: CREAM })}
      ${txt('NO. 001', 0, 43, 7.5, { anchor: 'middle', ls: 1.6, fill: 'rgba(245,243,239,0.6)' })}`,
  },
  // Folio, the felt teacher from the Folio SDK, rendered from its own model.
  { id: 'folio', kind: 'shape', shape: 'folio', x: 455, y: 128, w: 104, h: 128 },
  { id: 'slab', kind: 'shape', shape: 'slab', x: 896, y: 99, w: 104, h: 94 },
  {
    id: 'eddypill', x: 1121, y: 82, r: -1.5, w: 198, h: 90,
    sil: rr(-99, -45, 198, 90, 45),
    hit: { kind: 'rect', hw: 99, hh: 45, rad: 45 },
    svg: () => `
      <path d="${rr(-99, -45, 198, 90, 45)}" fill="${CREAM}"/>
      <path d="${rr(-95.5, -41.5, 191, 83, 41.5)}" fill="${INK}"/>
      ${txt('fuad', 0, 16, 55, { anchor: 'middle', ls: -0.8, fill: CREAM })}`,
  },
  { id: 'hexprism', kind: 'shape', shape: 'hexprism', x: 110, y: 265, w: 96, h: 94 },
  { id: 'guess', x: 305, y: 257, r: -6, w: 184, h: 116, ...bubble(176, 72, -17, [[-50, 17], [-28, 17], [-53, 55]], 'I ship agents.', 23, 'LLM · MCP · TOOL-CALLING') },
  { id: 'n01', x: 497, y: 251, r: -2, ...numberCircle(110, ORANGE, '01', 'Video Bridge') },
  { id: 'star', kind: 'shape', shape: 'star', x: 647, y: 255, w: 102, h: 110 },
  { id: 'holds', x: 909, y: 246, r: 1, w: 146, h: 84, ...bubble(138, 58, -7, [[-47, 20], [-31, 20], [-50, 40]], '東京から。', 21, 'from Tokyo') },
  {
    id: 'mm', x: 1124, y: 245, r: 5, w: 206, h: 108,
    sil: rr(-103, -54, 206, 108, 9),
    hit: { kind: 'rect', hw: 103, hh: 54, rad: 9 },
    svg: (id) => `
      <defs>
        <linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="-103" y1="-30" x2="103" y2="30">${holoStops([1, 1.9, 2.8, 3.7, 4.6])}</linearGradient>
        <linearGradient id="${id}-t" gradientUnits="userSpaceOnUse" x1="-90" y1="0" x2="60" y2="0"><stop offset="0" stop-color="#1f6a45"/><stop offset="1" stop-color="#262c78"/></linearGradient>
        <linearGradient id="${id}-n" gradientUnits="userSpaceOnUse" x1="-92" y1="0" x2="40" y2="0"><stop offset="0" stop-color="#1b5a5c"/><stop offset="1" stop-color="#22277a"/></linearGradient>
      </defs>
      <path d="${rr(-103, -54, 206, 108, 9)}" fill="url(#${id}-g)"/>
      <path d="${rr(-102.5, -53.5, 205, 107, 8.5)}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
      ${sparkles([[-70, -12], [-46, -16], [-18, -11], [12, -16], [40, -10], [-58, 18], [-6, 22], [64, 14], [80, -26], [-84, 4]])}
      ${txt('Tokai University', -90, -28, 11, { ls: 0, fill: `url(#${id}-t)` })}
      ${txt('東海大学 · ICT', 91, -28, 8.5, { anchor: 'end', fill: '#26336c' })}
      <g stroke="#26336c" stroke-width="1.4" fill="#26336c" stroke-linejoin="round">
        <path d="M-91 -12V0M91 -12V0M-90 -6H90" fill="none"/>
        <path d="M-90 -6L-83 -9.5V-2.5Z"/>
        <path d="M90 -6L83 -9.5V-2.5Z"/>
      </g>
      ${txt('2028', -92, 41, 43, { ls: -1.2, fill: `url(#${id}-n)` })}
      ${txt('Class of', 91, 27, 9, { anchor: 'end', fill: '#26336c' })}
      ${txt('No. 28', 91, 41, 9, { anchor: 'end', fill: '#26336c' })}`,
  },
  {
    id: 'ruler', x: 380, y: 383, r: 2.5, w: 284, h: 58,
    sil: rr(-142, -29, 284, 58, 4),
    hit: { kind: 'rect', hw: 142, hh: 29, rad: 4 },
    svg: () => {
      let ticks = '';
      for (let i = 0; i <= 30; i++) {
        const x = f(-130 + i * 8.6);
        const len = i % 10 === 0 ? 20 : i % 5 === 0 ? 14 : 8.5;
        ticks += `M${x} -29V${-29 + len}`;
      }
      const nums = [0, 10, 20, 30].map((n) => txt(String(n), f(-130 + n * 8.6), 11, 11.5, { anchor: 'middle', fill: '#18240f' })).join('');
      return `
        <path d="${rr(-142, -29, 284, 58, 4)}" fill="#5d9e34"/>
        <path d="${ticks}" stroke="#18240f" stroke-width="1.25"/>
        ${nums}
        ${txt('mm', 133, 23, 8.5, { anchor: 'end', fill: '#18240f' })}`;
    },
  },
  { id: 'house', kind: 'shape', shape: 'house', x: 892, y: 378, w: 88, h: 88 },
  { id: 'n03', x: 1164, y: 387, ...numberCircle(105, '#306aeb', '03', 'WebDrop') },
  { id: 'n05', x: 146, y: 402, r: -4, ...numberCircle(104, '#2d899f', '05', 'TokaiHub') },
  {
    id: 'hex', x: 711, y: 434, r: 5, w: 140, h: 122,
    sil: roundedPolyD(regularPoly(6, 68, 0), 5),
    hit: { kind: 'ellipse', hw: 66, hh: 58 },
    svg: (id) => `
      <defs>
        <linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="-60" y1="-50" x2="60" y2="50">${holoStops([1, 2, 3, 4, 5])}</linearGradient>
        <linearGradient id="${id}-f" gradientUnits="userSpaceOnUse" x1="-50" y1="-55" x2="45" y2="55">
          <stop offset="0" stop-color="#5f93f6" data-a="#5f93f6" data-b="#6a7ff6"/>
          <stop offset="0.55" stop-color="#7663f5" data-a="#7663f5" data-b="#8253f5"/>
          <stop offset="1" stop-color="#8a46f6" data-a="#8a46f6" data-b="#9a3ef0"/>
        </linearGradient>
      </defs>
      <path d="${roundedPolyD(regularPoly(6, 68, 0), 5)}" fill="url(#${id}-g)"/>
      <path d="${roundedPolyD(regularPoly(6, 63.5, 0), 4)}" fill="url(#${id}-f)"/>
      <path d="${roundedPolyD(regularPoly(6, 50, 0), 2)}" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="1.1"/>
      ${sparkles([[-30, -32, 2], [-44, 6, 2], [36, -28, 2], [30, 30, 2]], 'rgba(255,255,255,0.35)')}
      ${txt('TOOL', 1, -24, 9.5, { anchor: 'middle', ls: 2.6, fill: 'rgba(244,242,255,0.9)' })}
      ${txt('MCP', 0, 13, 38, { anchor: 'middle', ls: -0.8, fill: '#f4f1ff' })}
      ${txt('Calls', 0, 28, 10.5, { anchor: 'middle', fill: 'rgba(244,242,255,0.95)' })}
      ${txt('v2026', 0, 39, 7, { anchor: 'middle', ls: 1, fill: 'rgba(244,242,255,0.6)' })}`,
  },
  {
    id: 'smile', x: 1031, y: 401, w: 86, h: 86,
    sil: circ(43),
    hit: { kind: 'ellipse', hw: 43, hh: 43 },
    svg: () => `
      <circle r="43" fill="${CREAM}"/>
      <g fill="none" stroke="${INK}" stroke-width="6.8" stroke-linecap="round">
        <path d="M-21.5 8A8.5 8.5 0 0 1 -4.5 8"/>
        <path d="M4.5 8A8.5 8.5 0 0 1 21.5 8"/>
      </g>`,
  },
  { id: 'arch', kind: 'shape', shape: 'arch', x: 280, y: 508, w: 88, h: 96 },
  {
    id: 'agents', x: 489, y: 475, r: 1.5, w: 236, h: 56,
    sil: rr(-118, -28, 236, 56, 28),
    hit: { kind: 'rect', hw: 118, hh: 28, rad: 28 },
    svg: () => `
      <path d="${rr(-118, -28, 236, 56, 28)}" fill="${CREAM}"/>
      <path d="${rr(-114.5, -24.5, 229, 49, 24.5)}" fill="${INK}"/>
      <path d="M-91 0H-71M-79.5 -8L-71 0L-79.5 8" fill="none" stroke="${CREAM}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      ${txt('mohamedfuad.com', -62, 7.5, 19.5, { ls: -0.15, fill: CREAM })}`,
  },
  {
    id: 'seal', x: 111, y: 558, w: 148, h: 148,
    sil: circ(73),
    hit: { kind: 'ellipse', hw: 73, hh: 73 },
    svg: (id) => {
      const r = 55;
      const a0 = (197 * Math.PI) / 180;
      const sx = f(Math.cos(a0) * r);
      const sy = f(Math.sin(a0) * r);
      const ex = f(-Math.cos(a0) * r);
      const ey = f(-Math.sin(a0) * r);
      return `
      <defs>
        <linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="-60" y1="-60" x2="60" y2="60">${holoStops([1, 1.7, 2.4, 3.1, 3.8, 4.5])}</linearGradient>
        <linearGradient id="${id}-t" gradientUnits="userSpaceOnUse" x1="-60" y1="0" x2="60" y2="0"><stop offset="0" stop-color="#1c6c5c"/><stop offset="0.5" stop-color="#21396f"/><stop offset="1" stop-color="#232878"/></linearGradient>
        <path id="${id}-ring" d="M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${ey}A${r} ${r} 0 1 1 ${sx} ${sy}"/>
      </defs>
      <circle r="73" fill="url(#${id}-g)"/>
      <circle r="71.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
      ${sparkles([[-34, -40, 2], [30, -46, 2], [44, 30, 2], [-40, 36, 2], [0, -60, 2], [58, -6, 2]], 'rgba(255,255,255,0.5)')}
      <text font-size="11.5" font-weight="500" fill="url(#${id}-t)" letter-spacing="1.5"><textPath href="#${id}-ring" textLength="${f(2 * Math.PI * r - 6)}" lengthAdjust="spacing">MOHAMED FUAD · フアド · MOHAMED FUAD · フアド ·</textPath></text>
      <circle r="47" fill="none" stroke="#22297a" stroke-width="1.4"/>
      ${txt('JLPT', 0, -3, 23, { anchor: 'middle', ls: -0.3, fill: `url(#${id}-t)` })}
      ${txt('N2', 0, 19, 23, { anchor: 'middle', ls: -0.3, fill: `url(#${id}-t)` })}
      ${txt('日本語', 0, 32, 7.5, { anchor: 'middle', ls: 1, fill: '#22297a' })}`;
    },
  },
  {
    id: 'wheel', x: 852, y: 521, w: 132, h: 132,
    sil: circ(66),
    hit: { kind: 'ellipse', hw: 66, hh: 66 },
    eyes: true,
    svg: () => {
      const segs = [
        [-95, '#f1592a'], [-35, '#7d5bf2'], [25, '#306aeb'], [85, '#5d9e34'], [145, '#2d899f'], [205, '#e5474d'],
      ];
      const R = 61;
      const wedges = segs
        .map(([a, c]) => {
          const a0 = (a * Math.PI) / 180;
          const a1 = ((a + 60) * Math.PI) / 180;
          return `<path d="M0 0L${f(Math.cos(a0) * R)} ${f(Math.sin(a0) * R)}A${R} ${R} 0 0 1 ${f(Math.cos(a1) * R)} ${f(Math.sin(a1) * R)}Z" fill="${c}"/>`;
        })
        .join('');
      return `
        <circle r="66" fill="${CREAM}"/>
        ${wedges}
        <circle r="33" fill="${INK}"/>
        ${eyeGroup(-7.5, -1, CREAM, 10.5, 27, 5)}
        ${eyeGroup(7.5, -1, CREAM, 10.5, 27, 5)}`;
    },
  },
  {
    id: 'scale', x: 1024, y: 549, w: 120, h: 120,
    sil: circ(60),
    hit: { kind: 'ellipse', hw: 60, hh: 60 },
    svg: () => `
      <circle r="60" fill="${CREAM}"/>
      <circle r="46" fill="none" stroke="${INK}" stroke-width="1.6"/>
      ${txt('東京', 0, 6, 27, { anchor: 'middle', ls: 0.5, weight: 500 })}
      ${txt('Tokyo', 0, 20, 9, { anchor: 'middle', ls: 0.3 })}
      ${txt('35.68°N 139.69°E', 0, 30, 6, { anchor: 'middle', ls: 0.4, fill: 'rgba(17,17,15,0.55)' })}`,
  },
  { id: 'drop', kind: 'shape', shape: 'drop', x: 1181, y: 573, w: 66, h: 78 },
  {
    id: 'tag', x: 462, y: 578, r: 3, w: 192, h: 78,
    sil: roundedPolyD([[-74, -39], [96, -39], [96, 39], [-74, 39], [-96, 17], [-96, -17]], 6),
    hit: { kind: 'rect', hw: 96, hh: 39, rad: 6 },
    svg: () => `
      <path d="${roundedPolyD([[-74, -39], [96, -39], [96, 39], [-74, 39], [-96, 17], [-96, -17]], 6)}" fill="${CREAM}"/>
      <circle cx="-80" cy="0" r="6.5" fill="#d8d5cf"/>
      <path d="M-62 -31V31" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3.2 3"/>
      ${txt('GitHub', -48, -16, 10)}
      ${txt('github.com/', 88, -16, 7.5, { anchor: 'end', fill: 'rgba(17,17,15,0.55)' })}
      ${txt('MohamedFuad16', -49, 20, 17.5, { ls: -0.1 })}
      ${txt('Open source · Tokyo', -48, 31, 7.5, { fill: 'rgba(17,17,15,0.55)' })}`,
  },
  { id: 'loaf', kind: 'shape', shape: 'loaf', x: 668, y: 598, w: 100, h: 84 },
  {
    id: 'exact', x: 248, y: 679, w: 150, h: 150,
    sil: roundedPolyD(starPoly(22, 72, 62.5, -90), 1.2),
    hit: { kind: 'ellipse', hw: 68, hh: 68 },
    svg: (id) => `
      <defs>
        <linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="-70" y1="-70" x2="70" y2="70">${holoStops([1, 2, 3, 4, 5])}</linearGradient>
        <linearGradient id="${id}-f" gradientUnits="userSpaceOnUse" x1="-62" y1="-50" x2="58" y2="50">
          <stop offset="0" stop-color="#c4954f" data-a="#f09a38" data-b="#bb9457"/>
          <stop offset="0.5" stop-color="#e86d5c" data-a="#f37848" data-b="#e45f72"/>
          <stop offset="1" stop-color="#f2477a" data-a="#f2526a" data-b="#f2408a"/>
        </linearGradient>
      </defs>
      <path d="${roundedPolyD(starPoly(22, 72, 62.5, -90), 1.2)}" fill="url(#${id}-g)"/>
      <path d="${roundedPolyD(starPoly(22, 68, 58.5, -90), 1)}" fill="url(#${id}-f)"/>
      ${sparkles([[-38, -30, 2], [24, -40, 2], [-20, 36, 2], [40, 22, 2], [-50, 6, 2]], 'rgba(220,255,240,0.45)')}
      ${txt('Hire me.', 0, 6, 27, { anchor: 'middle', ls: -0.5, fill: 'rgba(232,246,238,0.95)' })}
      ${txt('FDE · AI ENGINEER', 0, 21, 7.5, { anchor: 'middle', ls: 1, fill: 'rgba(232,246,238,0.85)' })}`,
  },
  { id: 'pyramid', kind: 'shape', shape: 'pyramid', x: 906, y: 681, w: 112, h: 86 },
  { id: 'block', kind: 'shape', shape: 'block', x: 91, y: 715, w: 58, h: 94 },
  { id: 'gem', kind: 'shape', shape: 'gem', x: 412, y: 705, w: 60, h: 74 },
  { id: 'n02', x: 577, y: 705, ...numberCircle(106, '#7d5bf2', '02', 'Ledger') },
  { id: 'blackeyes', x: 750, y: 706, ...eyeCircle(92, INK, 10, 28) },
  {
    id: 'solved', x: 1062, y: 702, r: -3, w: 99, h: 99,
    sil: rr(-49.5, -49.5, 99, 99, 13),
    hit: { kind: 'rect', hw: 49.5, hh: 49.5, rad: 13 },
    svg: () => `
      <path d="${rr(-49.5, -49.5, 99, 99, 13)}" fill="${CREAM}"/>
      <path d="${rr(-45, -45, 90, 90, 9)}" fill="${INK}"/>
      <path d="M2 -2L35 -35M11 -35H35V-11" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linejoin="miter"/>
      ${txt('Say hi.', -36, 32, 16, { ls: -0.2, fill: CREAM })}
      ${txt('EN / 日本語', -36, 41, 6.5, { ls: 0.6, fill: 'rgba(245,243,239,0.6)' })}`,
  },
  { id: 'orangeeyes', x: 1198, y: 716, ...eyeCircle(96, ORANGE, 11, 30) },
];

// ------------------------------------------------------------- sticker

export class Sticker {
  constructor(def, board, index) {
    this.def = def;
    this.id = def.id;
    this.index = index;
    this.kind = def.kind || 'svg';
    this.home = { x: def.x, y: def.y, r: def.r || 0 };
    this.x = def.x;
    this.y = def.y;
    this.rot = def.r || 0;
    this.scale = 1;
    this.z = 10 + index;
    this.out = false;

    if (this.kind === 'shape' || this.kind === 'logo') {
      // Canvas stickers get a margin so a spinning body is not clipped.
      this.pad = this.kind === 'logo' ? 12 : 16;
      this.w = def.w + this.pad * 2;
      this.h = def.h + this.pad * 2;
      this.hit = def.hit || { kind: 'ellipse', hw: def.w / 2 - 3, hh: def.h / 2 - 3 };
    } else {
      this.w = def.w;
      this.h = def.h;
      this.hit = def.hit;
    }

    this.el = el('div', 'sticker', board);
    this.el.style.width = `${this.w}px`;
    this.el.style.height = `${this.h}px`;
    this.face = el('div', 'face', this.el);

    if (this.kind === 'svg') {
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', `${-this.w / 2} ${-this.h / 2} ${this.w} ${this.h}`);
      svg.setAttribute('width', this.w);
      svg.setAttribute('height', this.h);
      svg.innerHTML = def.svg(`s-${def.id}`);
      this.face.appendChild(svg);
      this.svg = svg;
      this.sil = new Path2D(def.sil);
      this.holoStops = [...svg.querySelectorAll('stop[data-h]')];
      this.fillStops = [...svg.querySelectorAll('stop[data-a]')];
      this.eyeEls = [...svg.querySelectorAll('g.eye')].map((g) => ({
        g,
        rect: g.querySelector('rect'),
        w: +g.dataset.w,
        h: +g.dataset.h,
      }));
    } else {
      this.canvas = el('canvas', '', this.face);
      this.ctx = this.canvas.getContext('2d');
      this.art = document.createElement('canvas');
      this.artCtx = this.art.getContext('2d');
      if (this.kind === 'shape') {
        this.shape = new Shape3D(def.shape);
        this.shape.frame(this.w, this.h, def.w - BORDER * 2, def.h - BORDER * 2);
      } else {
        this.shape = new Shape3D('logocube');
        this.cubeBox = { cx: -70, cy: 1.5, w: 62, h: 73 };
        this.shape.frame(84, 92, this.cubeBox.w, this.cubeBox.h);
        this.cube = document.createElement('canvas');
        this.cubeCtx = this.cube.getContext('2d');
        this.holoMask = document.createElement('canvas');
      }
    }

    this.eyeS = 1;
    this.blinkT = rand(1, 5);
    this.blink = null;
    this.res = 0;
    this.holoPhase = -1;
  }

  // ----- resolution

  setResolution(px) {
    if (this.kind === 'svg') return;
    if (Math.abs(px - this.res) < 0.01) return;
    this.res = px;
    this.maskReady = false;
    this.cubeVersion = (this.cubeVersion || 0) + 1;
    const pw = Math.max(2, Math.round(this.w * px));
    const ph = Math.max(2, Math.round(this.h * px));
    this.canvas.width = this.art.width = pw;
    this.canvas.height = this.art.height = ph;
    if (this.kind === 'logo') {
      this.cube.width = Math.round(84 * px);
      this.cube.height = Math.round(92 * px);
    }
    this.shape.dirty = true;
    this.holoPhase = -1;
  }

  // ----- per-frame

  update(dt, holo) {
    if (this.disabled) return;
    if (this.kind === 'svg') {
      // Hidden stickers (still in the pack) need no per-frame work.
      if (!this.out) return;
      if (this.holoStops.length && Math.abs(holo - this.holoPhase) > 0.012) {
        for (const s of this.holoStops) s.setAttribute('stop-color', holoColor(holo + +s.dataset.h));
        const k = holo / 3;
        for (const s of this.fillStops) s.setAttribute('stop-color', mixHex(s.dataset.a, s.dataset.b, clamp(k, 0, 1)));
        this.holoPhase = holo;
      }
      if (this.eyeEls.length) this.updateFlatEyes(dt);
      return;
    }
    if (!this.out && this.res) {
      // Still draw once so the art exists when the sticker appears.
      if (!this.drawn) this.redraw(holo);
      return;
    }
    if (this.epoch !== glEpoch()) {
      // GPU context came back after a loss: everything must be redrawn.
      this.epoch = glEpoch();
      this.shape.dirty = true;
    }
    const changed = this.shape.update(dt);
    if (this.kind === 'logo') {
      if (changed || this.shape.dirty) {
        this.cubeVersion = (this.cubeVersion || 0) + 1;
        this.redraw(holo, true);
      }
      else if (Math.abs(holo - this.holoPhase) > 0.003) this.redraw(holo, false);
    } else if (changed || this.shape.dirty) {
      this.redraw(holo);
    }
  }

  updateFlatEyes(dt) {
    this.blinkT -= dt;
    if (!this.blink && this.blinkT <= 0) this.blink = { t: 0, dur: 0.26 };
    let s = 1;
    if (this.blink) {
      this.blink.t += dt;
      const u = clamp(this.blink.t / this.blink.dur, 0, 1);
      s = 1 - 0.5 * Math.sin(u * Math.PI);
      if (u >= 1) {
        this.blink = null;
        this.blinkT = rand(2.2, 6.5);
        s = 1;
      }
    }
    if (s === this.eyeS) return;
    this.eyeS = s;
    for (const e of this.eyeEls) {
      const [w, h] = eyeSize(s, e.w, e.h);
      e.rect.setAttribute('x', f(-w / 2));
      e.rect.setAttribute('y', f(-h / 2));
      e.rect.setAttribute('width', f(w));
      e.rect.setAttribute('height', f(h));
      e.rect.setAttribute('rx', f(w / 2));
    }
  }

  redraw(holo, outline = true) {
    if (!this.res) return;
    const px = this.res;
    if (this.kind === 'shape') {
      this.shape.renderTo(this.artCtx, this.art.width, this.art.height);
      dieCut(this.art, this.ctx, BORDER * px, CREAM);
    } else {
      const a = this.artCtx;
      const W = this.art.width;
      const H = this.art.height;
      a.clearRect(0, 0, W, H);
      const cx = (this.w / 2 + this.cubeBox.cx) * px - this.cube.width / 2;
      const cy = (this.h / 2 + this.cubeBox.cy) * px - this.cube.height / 2;
      // The cube's foil colour follows the pointer. Renders are cached per
      // colour step and cross-faded, so moving the pointer never hits WebGL.
      const k = clamp(holo / 3, 0, 1) * CUBE_STEPS;
      const s0 = Math.floor(Math.min(k, CUBE_STEPS - 1e-6));
      a.drawImage(this.cubeStep(s0), cx, cy);
      a.globalAlpha = k - s0;
      if (a.globalAlpha > 0.01) a.drawImage(this.cubeStep(s0 + 1), cx, cy);
      a.globalAlpha = 1;
      a.font = `500 ${68 * px}px "Inter Tight"`;
      a.fillStyle = INK;
      a.letterSpacing = `${-1.6 * px}px`;
      a.textBaseline = 'alphabetic';
      a.fillText('fuad', (this.w / 2 - 30) * px, (this.h / 2 + 20) * px);
      const g = a.createLinearGradient(0, H * 0.2, W, H * 0.8);
      for (let i = 0; i <= 5; i++) g.addColorStop(i / 5, holoColor(holo + 1 + i * 0.62));
      if (outline || !this.maskReady) {
        dieCut(this.art, this.ctx, 12.5 * px, g, 1 * px, this.holoMask);
        this.maskReady = true;
      } else {
        // Same silhouette, new foil colour: recolour the cached outline.
        const c = this.ctx;
        c.clearRect(0, 0, W, H);
        c.drawImage(this.holoMask, 0, 0);
        c.globalCompositeOperation = 'source-in';
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'source-over';
        c.drawImage(this.art, 0, 0);
      }
    }
    this.holoPhase = holo;
    this.drawn = true;
  }

  // One reusable canvas per colour step; a step is re-rendered only when the
  // cube itself changed (blink, resize), tracked by cubeVersion.
  cubeStep(i) {
    if (!this.cubeCache) this.cubeCache = [];
    let slot = this.cubeCache[i];
    if (!slot) slot = this.cubeCache[i] = { c: document.createElement('canvas'), v: -1 };
    const v = this.cubeVersion || 0;
    if (slot.v !== v || slot.c.width !== this.cube.width || slot.c.height !== this.cube.height) {
      slot.c.width = this.cube.width;
      slot.c.height = this.cube.height;
      this.shape.setPalette(logoPalette(i / CUBE_STEPS));
      this.shape.renderTo(slot.c.getContext('2d'), slot.c.width, slot.c.height);
      slot.v = v;
    }
    return slot.c;
  }

  // ----- geometry

  applyTransform() {
    const t = `translate(${f(this.x - this.w / 2)}px, ${f(this.y - this.h / 2)}px) rotate(${f(this.rot)}deg) scale(${f(this.scale * 1000) / 1000})`;
    if (t !== this.lastT) this.el.style.transform = this.lastT = t;
    if (this.z !== this.lastZ) this.el.style.zIndex = this.lastZ = this.z;
  }

  // While flying, keep the sticker on its own GPU layer rasterised at full
  // size, so animating its scale never repaints the artwork.
  setFlying(on) {
    this.el.classList.toggle('is-flying', on);
    if (this.shape) this.shape.frozen = on;
  }

  show(on) {
    this.out = on;
    this.el.classList.toggle('is-out', on);
  }

  // Board point -> local point (origin at sticker centre, unrotated, unscaled).
  toLocal(bx, by) {
    const dx = bx - this.x;
    const dy = by - this.y;
    const a = (-this.rot * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [(dx * c - dy * s) / this.scale, (dx * s + dy * c) / this.scale];
  }

  toBoard(lx, ly) {
    const a = (this.rot * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [this.x + (lx * c - ly * s) * this.scale, this.y + (lx * s + ly * c) * this.scale];
  }

  contains(lx, ly) {
    const h = this.hit;
    const x = lx - (h.ox || 0);
    const y = ly - (h.oy || 0);
    if (h.kind === 'ellipse') return (x * x) / (h.hw * h.hw) + (y * y) / (h.hh * h.hh) <= 1;
    return Math.abs(x) <= h.hw && Math.abs(y) <= h.hh;
  }

  // Corners of the hit shape, local coords.
  corners() {
    const h = this.hit;
    const ox = h.ox || 0;
    const oy = h.oy || 0;
    return [[ox - h.hw, oy - h.hh], [ox + h.hw, oy - h.hh], [ox + h.hw, oy + h.hh], [ox - h.hw, oy + h.hh]];
  }

  // Where a peel starts for a pointer at (lx, ly): the nearest corner of a
  // rectangle, or the rim point of an ellipse in the pointer's direction.
  grabPoint(lx, ly) {
    const h = this.hit;
    const ox = h.ox || 0;
    const oy = h.oy || 0;
    const x = lx - ox;
    const y = ly - oy;
    if (h.kind === 'ellipse') {
      const k = Math.hypot(x / h.hw, y / h.hh) || 1;
      return [ox + x / k, oy + y / k];
    }
    const inset = (h.rad || 0) * 0.29;
    return [ox + Math.sign(x || 1) * (h.hw - inset), oy + Math.sign(y || 1) * (h.hh - inset)];
  }

  drawSilhouette(ctx) {
    if (this.kind === 'svg') ctx.fill(this.sil);
    else ctx.drawImage(this.canvas, -this.w / 2, -this.h / 2, this.w, this.h);
  }
}

// Holo cube colour by pointer: red at the left, orange mid, brown at the right.
function logoPalette(k) {
  const stops = [
    ['#c8321a', '#ee4a24', '#fb6458'],
    ['#ab3612', '#c1551e', '#f78147'],
    ['#703b19', '#54301e', '#a48464'],
  ];
  const t = k * 2;
  const i = Math.min(1, Math.floor(t));
  const u = t - i;
  return [0, 1, 2].map((j) => mixHex(stops[i][j], stops[i + 1][j], u));
}
