import { Pack } from './pack.js';
import {
  BOARD_W, BOARD_H, clamp, lerp, damp, rand, pick, smoothstep, easeInCubic, easeInOutCubic, easeOutCubic,
  clipHalfPlane, mixHex, f,
} from './util.js';

const board = document.getElementById('board');
const fx = document.getElementById('fx');
const fxCtx = fx.getContext('2d');
const params = new URLSearchParams(location.search);
// URL flags and console hooks only run on local development hosts.
const DEBUG = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

let S = 1;
let DPR = Math.min(2, window.devicePixelRatio || 1);
let OX = 0;
let OY = 0;

// Filled once the sticker modules (and three.js) have loaded; the pack is
// on screen and interactive before that.
let stickers = [];
const pack = new Pack(board);
const packButton = pack.el;

// Pointer, in board units.
const ptr = { x: 640, y: 400, down: false, id: null, hist: [] };
let holo = 1.2;
let holoTarget = 1.2;

let phase = 'pack'; // pack -> opening -> grid
let openT = 0;
let burstDone = false;
const particles = [];

// ------------------------------------------------------------------ layout

function layout() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  // Guard a zero-size (hidden or minimised) window.
  S = Math.max(0.05, Math.min(innerWidth / BOARD_W, innerHeight / BOARD_H));
  OX = innerWidth / 2 - (BOARD_W / 2) * S;
  OY = innerHeight / 2 - (BOARD_H / 2) * S;
  board.style.transform = `translate(${-(BOARD_W / 2) * S}px, ${-(BOARD_H / 2) * S}px) scale(${S})`;
  fx.width = Math.round(innerWidth * DPR);
  fx.height = Math.round(innerHeight * DPR);
  for (const s of stickers) s.setResolution(S * DPR);
}

const toBoard = (cx, cy) => [(cx - OX) / S, (cy - OY) / S];

// --------------------------------------------------------------- intro

const T_TEAR0 = 0.1;
const T_TEAR1 = 0.47;
const T_BURST = 0.5;
const T_VANISH = 2.45;
const T_SETTLE = 2.78;
const T_DONE = 4.15;
const ORBIT = { rx: 470, ry: 160, tilt: (-16 * Math.PI) / 180, w: 5.1, ox: 23, oy: 76 };
const CONFETTI = ['#f1592a', '#e5474d', '#7d5bf2', '#306aeb', '#2d899f', '#5d9e34', '#d5a729', '#f1592a'];

function orbitPoint(cx, cy, a) {
  const x = Math.cos(a) * ORBIT.rx;
  const y = Math.sin(a) * ORBIT.ry;
  const c = Math.cos(ORBIT.tilt);
  const s = Math.sin(ORBIT.tilt);
  return [cx + x * c - y * s, cy + x * s + y * c];
}

function orbitAngle(cx, cy, x, y) {
  const dx = x - cx;
  const dy = y - cy;
  const c = Math.cos(-ORBIT.tilt);
  const s = Math.sin(-ORBIT.tilt);
  const qx = dx * c - dy * s;
  const qy = dx * s + dy * c;
  return Math.atan2(qy / ORBIT.ry, qx / ORBIT.rx);
}

function startOpening(fromHold = false) {
  phase = 'opening';
  // The rip: spring up tall from the squash.
  pack.popT = fromHold ? 0 : null;
  // After a hold the strip is already torn; pick up right at the release.
  openT = fromHold ? T_TEAR1 - 1e-3 : 0;
  pack.hint(false);
  pack.state = 'opening';
  pack.vx = pack.vy = 0;
  pack.spinV = 0;
  pack.dragSqueeze = false;
  if (REDUCED) {
    // Reduced motion: skip the burst and orbit, fade the stickers in place.
    finishOpening();
    for (const s of stickers) s.el.classList.add('is-fading');
    return;
  }
  // Fisher-Yates shuffle of the burst order.
  const order = stickers.map((s, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.filter((idx) => !stickers[idx].disabled).forEach((idx, k) => {
    const s = stickers[idx];
    s.fly = {
      spawn: T_BURST + k * 0.024 + rand(0, 0.02),
      capture: 0,
      base: rand(0.46, 0.62),
      vr: rand(-45, 45),
      settleAt: T_SETTLE + k * 0.013,
    };
    s.x = s.home.x;
    s.y = s.home.y;
    s.scale = 1;
    s.setFlying(true);
    s.el.classList.add('is-pending');
    s.show(true);
    s.applyTransform();
  });
}

function spawnSticker(s) {
  const fl = s.fly;
  s.x = pack.x + rand(-50, 50);
  s.y = pack.top + rand(0, 12);
  fl.vx = rand(-470, 110);
  fl.vy = rand(-760, -500);
  fl.bx = s.x;
  fl.by = s.y;
  s.rot = s.home.r + rand(-22, 22);
  s.scale = 0.18;
  fl.capture = fl.spawn + rand(0.32, 0.48);
  fl.angle = null;
  s.z = 150;
  s.spawned = true;
  s.el.classList.remove('is-pending');
}

function burstConfetti(x, y, n, opts) {
  for (let i = 0; i < n; i++) {
    const a = opts.radial ? rand(0, Math.PI * 2) : rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const sp = rand(opts.speed[0], opts.speed[1]);
    particles.push({
      x: x + rand(-opts.spread, opts.spread),
      y: y + rand(-4, 4),
      vx: Math.cos(a) * sp + (opts.bias || 0),
      vy: Math.sin(a) * sp,
      g: opts.gravity,
      r: rand(1.6, 3.6),
      rect: Math.random() < 0.25,
      ang: rand(0, Math.PI),
      va: rand(-8, 8),
      c: pick(opts.colors || CONFETTI),
      life: rand(opts.life[0], opts.life[1]),
      t: 0,
    });
  }
}

function updateOpening(dt) {
  openT += dt;
  const t = openT;

  // Pack: eyes close, squeeze while the strip tears, pop wide on the burst.
  if (t < 0.08) pack.eyeOverride = 'closed';
  else if (t < T_TEAR1) pack.eyeOverride = 'squeeze';
  else if (t < 1.25) pack.eyeOverride = 'big';
  else pack.eyeOverride = null;

  pack.rotY = damp(pack.rotY, Math.round(pack.rotY / 360) * 360, 14, dt);
  pack.rotZ = damp(pack.rotZ, 0, 10, dt);
  pack.shakeX = damp(pack.shakeX || 0, 0, 20, dt);
  pack.shakeR = damp(pack.shakeR || 0, 0, 20, dt);
  if (t < T_VANISH) pack.scale = damp(pack.scale, 1, 12, dt);
  if (pack.popT != null) {
    pack.popT += dt;
    const q = clamp(pack.popT / 0.55, 0, 1);
    pack.squash = -0.08 * Math.sin(q * Math.PI * 1.5) * (1 - q);
    pack.strain = 1 - q;
    if (q >= 1) pack.popT = null;
  }
  if (t >= T_TEAR0 && !pack.stripState) pack.tearStart();
  if (pack.stripState && !pack.stripState.free) {
    const u = clamp((t - T_TEAR0) / (T_TEAR1 - T_TEAR0), 0, 1);
    // Positive turns lift the free (left) end of the strip upwards.
    pack.stripState.ang = 36 * easeOutCubic(u);
    pack.puff = Math.sin(u * Math.PI * 0.5);
    if (t >= T_TEAR1) pack.stripRelease();
  } else if (t > T_TEAR1) {
    pack.puff = damp(pack.puff, 0.25, 4, dt);
  }

  if (t >= T_BURST && !burstDone) {
    burstDone = true;
    burstConfetti(pack.x, pack.top, 64, { speed: [260, 900], spread: 50, gravity: 1300, life: [1.0, 2.2], bias: -140 });
  }

  // Pack shrinks away once the stickers have circled it.
  if (t >= T_VANISH) {
    const u = clamp((t - T_VANISH) / 0.3, 0, 1);
    pack.scale = 1 - 0.94 * easeInCubic(u);
    pack.rotZ = 16 * easeOutCubic(u);
    pack.y = pack.baseY + 60 * easeInCubic(u);
    pack.x = pack.baseX + 30 * easeInCubic(u);
    if (u >= 1 && pack.el.style.display !== 'none') {
      pack.el.style.display = 'none';
      burstConfetti(pack.x, pack.y, 46, { radial: true, speed: [120, 520], spread: 14, gravity: 600, life: [0.6, 1.3] });
    }
  } else {
    pack.baseY = pack.y;
    pack.baseX = pack.x;
  }

  const cx = (pack.baseX ?? pack.x) + ORBIT.ox;
  const cy = (pack.baseY ?? pack.y) + ORBIT.oy;

  for (const s of stickers) {
    const fl = s.fly;
    if (!fl || t < fl.spawn) continue;
    if (!s.spawned) spawnSticker(s);
    const age = t - fl.spawn;

    if (t < fl.settleAt) {
      // Ballistic flight out of the pack, blended onto a tilted orbit that
      // rides around the pack (front half in front of it, back half behind).
      fl.vy += 1300 * dt;
      fl.bx += fl.vx * dt;
      fl.by += fl.vy * dt;
      const w = easeInOutCubic(clamp((t - fl.capture) / 0.45, 0, 1));
      if (t >= fl.capture) {
        if (fl.angle == null) fl.angle = orbitAngle(cx, cy, fl.bx, fl.by);
        fl.angle += ORBIT.w * dt;
        const [tx, ty] = orbitPoint(cx, cy, fl.angle);
        s.x = lerp(fl.bx, tx, w);
        s.y = lerp(fl.by, ty, w);
        const depth = Math.sin(fl.angle);
        const target = fl.base * (1 + 0.42 * depth * w);
        s.scale = damp(s.scale, target, 10, dt);
        s.z = depth > 0.05 && w > 0.3 ? 220 + Math.round(depth * 50) : w > 0.3 ? 40 + Math.round((depth + 1) * 20) : 150;
      } else {
        s.x = fl.bx;
        s.y = fl.by;
        s.scale = lerp(0.18, fl.base, easeOutCubic(clamp(age / 0.22, 0, 1)));
        s.z = 150;
      }
      s.rot += fl.vr * dt;
      fl.vr *= Math.exp(-2.5 * dt);
    } else {
      // Settle: each sticker keeps riding the orbit and peels off it in ring
      // order, gliding into its slot, so the ring unwinds into the layout.
      if (!fl.settle) {
        fl.settle = { t: 0, scale: s.scale, rot: s.rot };
      }
      fl.settle.t += dt;
      const u = clamp(fl.settle.t / 0.85, 0, 1);
      const e = easeInOutCubic(u);
      fl.angle += ORBIT.w * (1 - e) * dt;
      const [ox, oy] = orbitPoint(cx, cy, fl.angle);
      const spread = lerp(0.82, 1, easeOutCubic(u));
      const tx = 640 + (s.home.x - 640) * spread;
      const ty = 400 + (s.home.y - 400) * spread;
      s.x = lerp(ox, tx, e);
      s.y = lerp(oy, ty, e);
      const depth = Math.sin(fl.angle);
      const orbitScale = fl.base * (1 + 0.42 * depth);
      // A touch of overshoot on the scale so each sticker lands with a settle.
      s.scale = lerp(orbitScale, 1, e) + Math.sin(u * Math.PI) * 0.06 * u;
      const dr = ((s.home.r - fl.settle.rot) % 360 + 540) % 360 - 180;
      s.rot = fl.settle.rot + dr * e;
      s.z = e > 0.55 ? 10 + s.index : depth > 0.05 ? 220 + Math.round(depth * 50) : 40 + Math.round((depth + 1) * 20);
    }
    s.applyTransform();
  }

  if (t >= T_DONE) finishOpening();
}

function finishOpening() {
  phase = 'grid';
  burstDone = false;
  for (const s of stickers) {
    s.fly = null;
    s.spawned = false;
    s.x = s.home.x;
    s.y = s.home.y;
    s.rot = s.home.r;
    s.scale = 1;
    s.z = 10 + s.index;
    s.show(!s.disabled);
    s.applyTransform();
  }
  // Drop the GPU layers a few per frame, so 33 re-rasters don't land at once.
  layerQueue = stickers.slice();
  pack.el.style.display = 'none';
}

let layerQueue = [];
function releaseLayers() {
  for (let i = 0; i < 3 && layerQueue.length; i++) layerQueue.shift().setFlying(false);
}

function showGrid() {
  pack.el.style.display = 'none';
  phase = 'grid';
  for (const s of stickers) {
    s.show(true);
    s.applyTransform();
  }
}

function replay() {
  peel = null;
  relaxing.length = 0;
  layerQueue = [];
  ptr.down = false;
  packDrag.active = false;
  packDrag.moved = false;
  hold.t = hold.p = 0;
  for (const s of stickers) {
    s.show(false);
    s.fly = null;
    s.spawned = false;
    s.setFlying(false);
    s.el.classList.remove('is-pending', 'is-fading');
    s.home = { x: s.def.x, y: s.def.y, r: s.def.r || 0 };
    s.x = s.home.x;
    s.y = s.home.y;
    s.rot = s.home.r;
    s.scale = 1;
    s.face.style.clipPath = '';
    s.face.style.transform = '';
    s.face.style.visibility = '';
    s.face.style.filter = '';
    s.el.classList.remove('is-lifted');
    s.applyTransform();
  }
  particles.length = 0;
  burstDone = false;
  pack.reset();
  phase = 'pack';
}

// ------------------------------------------------------------ pack drag

const packDrag = { active: false, moved: false, ox: 0, oy: 0, sx: 0, sy: 0 };

// Press and hold tears the pack open: the hold builds up over HOLD seconds.
const HOLD = 0.9;
const hold = { t: 0, p: 0, clock: 0 };

function updateHold(dt) {
  const holding = packDrag.active && !packDrag.moved;
  hold.clock += dt;
  if (holding) hold.t += dt;
  else hold.t = Math.max(0, hold.t - dt * 2.5);
  const target = clamp(hold.t / HOLD, 0, 1);
  hold.p = holding ? target : damp(hold.p, target, 14, dt);
  const h = hold.p;
  const e = easeInOutCubic(h);

  // Squash down and bulge out as the seal strains, with a tremble that
  // ramps up hard near the end, like the pack is fighting the tear.
  pack.scale = 1 - 0.02 * e;
  pack.puff = e + Math.sin(hold.clock * 9) * 0.06 * h;
  pack.squash = 0.06 * e;
  pack.strain = smoothstep(0.1, 1, h);
  const shake = REDUCED ? 0 : h * h * h;
  pack.shakeX = Math.sin(hold.clock * 47) * 2.4 * shake;
  pack.shakeR = Math.sin(hold.clock * 61) * 2 * shake;
  pack.eyeOverride = h > 0.12 ? 'squeeze' : h > 0.02 ? 'closed' : null;

  // The strip starts tearing after the first moment of the hold.
  const tear = smoothstep(0.15, 1, h);
  if (tear > 0 && !pack.stripState) pack.tearStart();
  if (pack.stripState && !pack.stripState.free) {
    // The strip lifts with a flutter, and specks of paper puff out of the gap.
    pack.stripState.ang = 36 * easeInOutCubic(tear) + Math.sin(hold.clock * 32) * 2.2 * tear * (1 - tear * 0.5);
    if (holding && tear > 0.25 && Math.random() < 0.35 + tear * 0.4) {
      const gx = pack.x - 110 + Math.random() * 200 * tear;
      burstConfetti(gx, pack.top - 2, 1, { speed: [60, 200], spread: 4, gravity: 500, life: [0.4, 0.8], colors: ['#f1592a', '#f6a191', '#e04a1f', '#f5f3ef'] });
    }
    if (tear <= 0.001 && !holding) pack.untear();
  }
  pack.hint(h < 0.01 && pack.state !== 'fling' && pack.state !== 'drag');

  // On a slow connection the stickers may still be loading: the pack stays
  // at full strain until they are ready, then tears.
  if (holding && target >= 1 && stickers.length) {
    packDrag.active = false;
    hold.t = 0;
    hold.p = 0;
    pack.shakeX = pack.shakeR = 0;
    startOpening(true);
  }
}

// Ring around the pointer that fills while the pack is held.
function drawHoldRing(ctx) {
  if (phase !== 'pack' || hold.p < 0.02 || packDrag.moved) return;
  const a = smoothstep(0.02, 0.1, hold.p);
  ctx.save();
  ctx.setTransform(DPR * S, 0, 0, DPR * S, OX * DPR, OY * DPR);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(17,17,15,0.12)';
  ctx.beginPath();
  ctx.arc(ptr.x, ptr.y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#11110f';
  ctx.beginPath();
  ctx.arc(ptr.x, ptr.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeInOutCubic(hold.p));
  ctx.stroke();
  ctx.restore();
}

function updatePack(dt) {
  if (packDrag.active && packDrag.moved) {
    const tx = ptr.x + packDrag.ox;
    const ty = ptr.y + packDrag.oy;
    const nx = damp(pack.x, tx, 28, dt);
    const ny = damp(pack.y, ty, 28, dt);
    pack.vx = (nx - pack.x) / Math.max(dt, 1e-3);
    pack.vy = (ny - pack.y) / Math.max(dt, 1e-3);
    pack.x = nx;
    pack.y = ny;
    pack.rotZ = damp(pack.rotZ, clamp(pack.vx * 0.011, -16, 16), 9, dt);
    pack.dragSqueeze = Math.hypot(pack.vx, pack.vy) > 1100;
  } else if (pack.state === 'fling') {
    pack.x += pack.vx * dt;
    pack.y += pack.vy * dt;
    pack.vx *= Math.exp(-3.8 * dt);
    pack.vy *= Math.exp(-3.8 * dt);
    const m = 120;
    if (pack.x < m || pack.x > BOARD_W - m) {
      pack.x = clamp(pack.x, m, BOARD_W - m);
      pack.vx *= -0.5;
    }
    if (pack.y < 200 || pack.y > BOARD_H - 200) {
      pack.y = clamp(pack.y, 200, BOARD_H - 200);
      pack.vy *= -0.5;
    }
    pack.rotY += pack.spinV * dt;
    pack.spinV *= Math.exp(-1.25 * dt);
    if (Math.abs(pack.spinV) < 70) {
      pack.spinV = 0;
      pack.rotY = damp(pack.rotY, Math.round(pack.rotY / 360) * 360, 6, dt);
    }
    pack.rotZ = damp(pack.rotZ, clamp(pack.vx * 0.006, -10, 10), 6, dt);
    pack.dragSqueeze = false;
    if (Math.hypot(pack.vx, pack.vy) < 8 && pack.spinV === 0 && Math.abs(pack.rotY - Math.round(pack.rotY / 360) * 360) < 0.5) {
      pack.state = 'idle';
      pack.rotY = Math.round(pack.rotY / 360) * 360;
    }
  } else {
    pack.rotZ = damp(pack.rotZ, 0, 7, dt);
    pack.rotY = damp(pack.rotY, Math.round(pack.rotY / 360) * 360, 6, dt);
    pack.dragSqueeze = false;
  }
}

function pointerVelocity() {
  const h = ptr.hist;
  const now = performance.now();
  while (h.length > 2 && now - h[0].t > 90) h.shift();
  if (h.length < 2) return [0, 0];
  const a = h[0];
  const b = h[h.length - 1];
  const dt = Math.max((b.t - a.t) / 1000, 1e-3);
  return [(b.x - a.x) / dt, (b.y - a.y) / dt];
}

// ------------------------------------------------------------------ peel

// One sticker at a time can be curled, peeled, flipped or carried.
let peel = null;
const relaxing = [];
const flapCanvas = document.createElement('canvas');
const flapCtx = flapCanvas.getContext('2d');

function topStickerAt(bx, by) {
  let best = null;
  for (const s of stickers) {
    if (!s.out || s.disabled) continue;
    const [lx, ly] = s.toLocal(bx, by);
    if (s.contains(lx, ly) && (!best || s.z > best.z)) best = s;
  }
  return best;
}

function inwardNormal(s, C) {
  const h = s.hit;
  const dx = (h.ox || 0) - C[0];
  const dy = (h.oy || 0) - C[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

const HOVER_ZONE = 30;
const HOVER_LIFT = 11;

function updateHover() {
  if (phase !== 'grid' || ptr.down) return;
  if (peel && peel.mode !== 'hover') return;
  const s = topStickerAt(ptr.x, ptr.y);
  let target = null;
  if (s) {
    const [lx, ly] = s.toLocal(ptr.x, ptr.y);
    const C = s.grabPoint(lx, ly);
    const zone = Math.min(HOVER_ZONE, Math.min(s.hit.hw, s.hit.hh) * 0.6);
    if (Math.hypot(lx - C[0], ly - C[1]) < zone) target = { s, C };
  }
  if (peel && (!target || target.s !== peel.s || Math.hypot(target.C[0] - peel.C[0], target.C[1] - peel.C[1]) > 8)) {
    relaxing.push({ ...peel, mode: 'release' });
    peel = null;
  }
  if (target && !peel) {
    // A curl still relaxing on this sticker hands over to the new one.
    for (let i = relaxing.length - 1; i >= 0; i--) if (relaxing[i].s === target.s) relaxing.splice(i, 1);
    peel = { s: target.s, C: target.C, n: inwardNormal(target.s, target.C), v: [0, 0], mode: 'hover' };
  }
}

function beginPeel(s, bx, by) {
  const [lx, ly] = s.toLocal(bx, by);
  let C;
  let v = [0, 0];
  if (peel && peel.s === s) {
    C = peel.C;
    v = peel.v;
  } else {
    if (peel) relaxing.push({ ...peel, mode: 'release' });
    C = s.grabPoint(lx, ly);
  }
  for (let i = relaxing.length - 1; i >= 0; i--) if (relaxing[i].s === s) relaxing.splice(i, 1);
  peel = { s, C, n: inwardNormal(s, C), v, v0: [...v], p0: [lx, ly], mode: 'peel', flipT: 0, e: 0 };
  s.z = nextZ();
  s.applyTransform();
}

let zTop = 100;
const nextZ = () => ++zTop;

// The fold line runs ahead of the pointer, as in the reference, so a short
// drag peels the whole sticker.
const FOLD_GAIN = 1.7;

function foldOf(p) {
  const len = Math.hypot(p.v[0], p.v[1]);
  if (len < 0.4) return null;
  const u = [p.v[0] / len, p.v[1] / len];
  const M = [p.C[0] + p.v[0] * FOLD_GAIN, p.C[1] + p.v[1] * FOLD_GAIN];
  return { u, M, len };
}

// How far the peeled part is turned about the fold, as a projected scale:
// -1 lies flat folded over (a small corner curl), values just above 0 stand
// almost upright and read as a thin sliver.
const liftOf = (len) => lerp(-1, 0.13, smoothstep(12, 64, len));

function updatePeel(dt) {
  for (let i = relaxing.length - 1; i >= 0; i--) {
    const r = relaxing[i];
    r.v = [damp(r.v[0], 0, 16, dt), damp(r.v[1], 0, 16, dt)];
    if (Math.hypot(r.v[0], r.v[1]) < 0.3) {
      r.s.face.style.clipPath = '';
      relaxing.splice(i, 1);
    } else applyFrontClip(r);
  }
  if (!peel) return;
  const p = peel;
  const s = p.s;

  if (p.mode === 'hover') {
    p.v = [damp(p.v[0], p.n[0] * HOVER_LIFT, 14, dt), damp(p.v[1], p.n[1] * HOVER_LIFT, 14, dt)];
    applyFrontClip(p);
    return;
  }

  if (p.mode === 'peel' || p.mode === 'flip') {
    const [lx, ly] = s.toLocal(ptr.x, ptr.y);
    let v = [p.v0[0] + lx - p.p0[0], p.v0[1] + ly - p.p0[1]];
    if (p.mode === 'peel') {
      // Only peel inwards; an outward pull slides along the edge instead.
      const d = v[0] * p.n[0] + v[1] * p.n[1];
      if (d < 0) v = [v[0] - d * p.n[0], v[1] - d * p.n[1]];
    }
    p.v = [damp(p.v[0], v[0], 30, dt), damp(p.v[1], v[1], 30, dt)];
  }

  if (p.mode === 'peel') {
    applyFrontClip(p);
    const fold = foldOf(p);
    if (fold) {
      const done = s.corners().every(([x, y]) => (x - fold.M[0]) * fold.u[0] + (y - fold.M[1]) * fold.u[1] < -2);
      if (done) {
        // Fully lifted: the sticker stands on its edge at the fold line.
        p.mode = 'flip';
        p.flipT = 0;
        p.k0 = liftOf(fold.len);
        p.M0 = fold.M;
        p.u = fold.u;
        s.face.style.clipPath = '';
      }
    }
    return;
  }

  if (p.mode === 'flip') {
    // Swing down from the edge-on sliver to lying face up, with the grabbed
    // corner ending under the pointer.
    p.flipT += dt;
    p.e = easeInOutCubic(clamp(p.flipT / 0.3, 0, 1));
    s.face.style.transform = flipMatrix(p, s);
    s.face.style.filter = `brightness(${f(lerp(0.62, 1, p.e))})`;
    if (p.flipT >= 0.3) {
      const [bx, by] = s.toBoard(p.v[0], p.v[1]);
      const [ox, oy] = s.toBoard(0, 0);
      s.x += bx - ox;
      s.y += by - oy;
      s.face.style.transform = '';
      s.face.style.filter = '';
      p.mode = 'lift';
      p.off = [s.x - ptr.x, s.y - ptr.y];
      p.baseRot = s.rot;
      p.liftScale = 1;
      s.el.classList.add('is-lifted');
      if (p.releaseAfterFlip) dropSticker();
    }
    s.applyTransform();
    return;
  }

  if (p.mode === 'lift') {
    const tx = ptr.x + p.off[0];
    const ty = ptr.y + p.off[1];
    const nx = damp(s.x, tx, 32, dt);
    const vx = (nx - s.x) / Math.max(dt, 1e-3);
    s.x = nx;
    s.y = damp(s.y, ty, 32, dt);
    s.rot = damp(s.rot, p.baseRot + clamp(vx * 0.006, -7, 7), 10, dt);
    p.liftScale = damp(p.liftScale, 1.045, 14, dt);
    s.scale = p.liftScale;
    s.applyTransform();
    return;
  }

  if (p.mode === 'drop') {
    p.t += dt;
    s.rot = damp(s.rot, p.baseRot, 12, dt);
    s.scale = damp(s.scale, 1, 18, dt);
    s.applyTransform();
    if (p.t > 0.22) {
      s.scale = 1;
      s.rot = p.baseRot;
      s.home = { x: s.x, y: s.y, r: s.rot };
      s.el.classList.remove('is-lifted');
      s.applyTransform();
      peel = null;
    }
  }
}

function dropSticker() {
  const p = peel;
  if (!p) return;
  if (p.mode === 'lift') {
    p.mode = 'drop';
    p.t = 0;
  } else if (p.mode === 'flip') {
    p.releaseAfterFlip = true;
  } else if (p.mode === 'peel') {
    relaxing.push({ ...p, mode: 'release' });
    peel = null;
  }
}

function applyFrontClip(p) {
  const s = p.s;
  const fold = foldOf(p);
  if (!fold) {
    s.face.style.clipPath = '';
    return;
  }
  const W = s.w;
  const H = s.h;
  const big = [[-W * 2, -H * 2], [W * 2, -H * 2], [W * 2, H * 2], [-W * 2, H * 2]];
  const poly = clipHalfPlane(big, fold.M, fold.u);
  s.face.style.clipPath = `polygon(${poly.map(([x, y]) => `${f(x + W / 2)}px ${f(y + H / 2)}px`).join(',')})`;
}

// Projection of a part turned about a line through M with normal u:
// distances across the line scale by k (k = -1 mirrors, k = 1 is flat).
function turnAffine(M, u, k, tx = 0, ty = 0) {
  const [ux, uy] = u;
  const a = 1 + (k - 1) * ux * ux;
  const b = (k - 1) * ux * uy;
  const d = 1 + (k - 1) * uy * uy;
  return [a, b, b, d, M[0] - (a * M[0] + b * M[1]) + tx, M[1] - (b * M[0] + d * M[1]) + ty];
}

// Flip: turn from the sliver (k0) to flat (1) about the fold, while sliding
// so the grabbed corner lands on the pointer.
function flipAffine(p) {
  const k = lerp(p.k0, 1, p.e);
  return turnAffine(p.M0, p.u, k, p.v[0] * p.e, p.v[1] * p.e);
}

function flipMatrix(p, s) {
  const [a, b, c, d, e, g] = flipAffine(p);
  // CSS works from the face's top-left corner; convert from centre-origin.
  const hx = s.w / 2;
  const hy = s.h / 2;
  const E = e + hx - (a * hx + c * hy);
  const G = g + hy - (b * hx + d * hy);
  return `matrix(${f(a * 1e4) / 1e4},${f(b * 1e4) / 1e4},${f(c * 1e4) / 1e4},${f(d * 1e4) / 1e4},${f(E)},${f(G)})`;
}

// Soft shadow without a per-frame blur filter: shrink the flap 8x, tint it,
// then stretch it back with smoothing, which blurs it for free.
const softCanvas = document.createElement('canvas');
const softCtx = softCanvas.getContext('2d');
function softShadow(ctx, src, half, dx, dy, alpha, color) {
  const k = 8;
  const w = Math.ceil(src.width / k);
  const h = Math.ceil(src.height / k);
  if (softCanvas.width !== w || softCanvas.height !== h) {
    softCanvas.width = w;
    softCanvas.height = h;
  }
  softCtx.clearRect(0, 0, w, h);
  softCtx.drawImage(src, 0, 0, w, h);
  softCtx.globalCompositeOperation = 'source-in';
  softCtx.fillStyle = color;
  softCtx.fillRect(0, 0, w, h);
  softCtx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(softCanvas, -half + dx, -half + dy, src.width, src.height);
  ctx.globalAlpha = 1;
}

function drawFlap(ctx, p) {
  if (p.mode === 'flip') return;
  const s = p.s;
  const fold = foldOf(p);
  if (!fold) return;
  const { u, M, len } = fold;
  const k = liftOf(len);
  // The flap is a soft grey gradient, so a lower-resolution buffer looks the
  // same and keeps the per-frame fill cost small.
  const px = Math.min(S * DPR, 1.25);
  const R = Math.max(s.w, s.h) * 1.6 + len * FOLD_GAIN;
  const side = Math.min(4096, Math.ceil(R * 2 * px));
  if (flapCanvas.width < side) flapCanvas.width = flapCanvas.height = side;
  const fc = flapCtx;
  const half = flapCanvas.width / 2;
  const big = [[-R, -R], [R, -R], [R, R], [-R, R]];
  const peeled = clipHalfPlane(big, M, [-u[0], -u[1]]);
  const tip = [M[0] - u[0] * len * FOLD_GAIN * Math.abs(k), M[1] - u[1] * len * FOLD_GAIN * Math.abs(k)];

  // Draws the peeled part turned by `kk`, filled with `fill`.
  const paint = (kk, fill) => {
    fc.setTransform(1, 0, 0, 1, 0, 0);
    fc.clearRect(0, 0, flapCanvas.width, flapCanvas.height);
    fc.setTransform(px * s.scale, 0, 0, px * s.scale, half, half);
    fc.save();
    fc.transform(...turnAffine(M, u, kk));
    fc.beginPath();
    peeled.forEach(([x, y], i) => (i ? fc.lineTo(x, y) : fc.moveTo(x, y)));
    fc.closePath();
    fc.clip();
    fc.fillStyle = '#000';
    s.drawSilhouette(fc);
    fc.restore();
    fc.globalCompositeOperation = 'source-in';
    fc.fillStyle = fill;
    fc.fillRect(-R, -R, R * 2, R * 2);
    fc.globalCompositeOperation = 'source-over';
  };

  const place = () => {
    ctx.save();
    ctx.setTransform(DPR * S, 0, 0, DPR * S, OX * DPR, OY * DPR);
    ctx.translate(s.x, s.y);
    ctx.rotate((s.rot * Math.PI) / 180);
    ctx.scale(1 / px, 1 / px);
  };

  // Shadow of the lifted part on the ground, once it stands up.
  const standing = smoothstep(-0.55, 0.05, k);
  if (standing > 0.01) {
    paint(0.6, '#2a2520');
    place();
    softShadow(ctx, flapCanvas, half, 2 * px, 3 * px, 0.22 * standing, '#2a2520');
    ctx.restore();
  }

  // The flap: light backing paper when folded flat, a dark sliver upright.
  let fill;
  if (k < 0) {
    const g = fc.createLinearGradient(M[0], M[1], tip[0], tip[1]);
    const dim = smoothstep(-1, 0, k) * 0.35;
    g.addColorStop(0, mixHex('#b0aca5', '#8a8680', dim));
    g.addColorStop(0.18, mixHex('#d6d3cd', '#a19d97', dim));
    g.addColorStop(0.55, mixHex('#e8e5e0', '#b3afa9', dim));
    g.addColorStop(1, mixHex('#d3cfc9', '#a6a29c', dim));
    fill = g;
  } else {
    const g = fc.createLinearGradient(M[0], M[1], M[0] - u[0] * 30, M[1] - u[1] * 30);
    g.addColorStop(0, '#7e7a74');
    g.addColorStop(1, '#b9b5ae');
    fill = g;
  }
  paint(k, fill);
  place();
  if (standing < 0.99) softShadow(ctx, flapCanvas, half, 1.5 * px, 2.5 * px, 0.26 * (1 - standing), '#2a2520');
  ctx.drawImage(flapCanvas, -half, -half);
  ctx.restore();
}

// --------------------------------------------------------------- confetti

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    q.t += dt;
    if (q.t > q.life) {
      particles.splice(i, 1);
      continue;
    }
    q.vy += q.g * dt;
    q.vx *= Math.exp(-1.1 * dt);
    q.vy *= Math.exp(-0.6 * dt);
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.ang += q.va * dt;
  }
}

function drawParticles(ctx) {
  if (!particles.length) return;
  ctx.save();
  ctx.setTransform(DPR * S, 0, 0, DPR * S, OX * DPR, OY * DPR);
  for (const q of particles) {
    ctx.globalAlpha = 1 - smoothstep(q.life * 0.7, q.life, q.t);
    ctx.fillStyle = q.c;
    if (q.rect) {
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.ang);
      ctx.fillRect(-q.r, -q.r * 0.6, q.r * 2, q.r * 1.2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ----------------------------------------------------------------- input

// A press turns into a drag after this many screen px, so a held finger's
// jitter on a phone still counts as a hold.
const DRAG_SLOP_PX = 9;
const FLING_SPEED = 380;

function onMove(e) {
  if (ptr.down && e.pointerId !== ptr.id) return;
  [ptr.x, ptr.y] = toBoard(e.clientX, e.clientY);
  ptr.hist.push({ x: ptr.x, y: ptr.y, t: performance.now() });
  if (ptr.hist.length > 12) ptr.hist.shift();
  // Pointer x drives the foil: pink and red at the left, mint and brown at the right.
  holoTarget = clamp(e.clientX / Math.max(1, innerWidth), 0, 1) * 3.8 - 0.8;
  if (packDrag.active && !packDrag.moved && Math.hypot(ptr.x - packDrag.sx, ptr.y - packDrag.sy) * S > DRAG_SLOP_PX) {
    packDrag.moved = true;
    pack.state = 'drag';
  }
}

function pressPack() {
  packDrag.active = true;
  packDrag.moved = false;
  packDrag.sx = ptr.x;
  packDrag.sy = ptr.y;
  packDrag.ox = pack.x - ptr.x;
  packDrag.oy = pack.y - ptr.y;
  pack.vx = pack.vy = 0;
  pack.spinV = 0;
  pack.state = 'press';
}

function onDown(e) {
  // Primary button or a first finger only; a second finger or a right-click
  // must not restart a hold or drop a carried sticker.
  if (ptr.down || (e.pointerType === 'mouse' && e.button !== 0)) return;
  ptr.id = e.pointerId;
  onMove(e);
  ptr.down = true;
  ptr.hist = [{ x: ptr.x, y: ptr.y, t: performance.now() }];
  if (phase === 'pack') {
    if (pack.contains(ptr.x, ptr.y)) pressPack();
    return;
  }
  if (phase === 'grid' && (!peel || peel.mode === 'hover')) {
    const s = topStickerAt(ptr.x, ptr.y);
    if (s) beginPeel(s, ptr.x, ptr.y);
  }
}

function onUp(e) {
  if (!ptr.down || e.pointerId !== ptr.id) return;
  onMove(e);
  release(true);
  // A lifted finger leaves no hover behind.
  if (e.pointerType !== 'mouse') ptr.x = ptr.y = -1e4;
}

// Ends a press. `fling` is false when the browser cancelled the pointer or the
// window lost focus: the pack then stops where it is instead of being thrown.
function release(fling) {
  ptr.down = false;
  if (phase === 'pack' && packDrag.active) {
    packDrag.active = false;
    // A press that ends before the hold completes just settles back.
    if (!packDrag.moved) return;
    const [vx, vy] = fling ? pointerVelocity() : [0, 0];
    if (Math.hypot(vx, vy) > FLING_SPEED) {
      pack.state = 'fling';
      pack.vx = clamp(vx, -1400, 1400);
      pack.vy = clamp(vy, -900, 900);
      pack.spinV = clamp(vx * 0.85, -1200, 1200);
    } else {
      pack.state = 'idle';
      pack.vx = pack.vy = 0;
    }
    return;
  }
  if (phase === 'grid') dropSticker();
}

window.addEventListener('pointermove', onMove);
window.addEventListener('pointerdown', onDown);
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', (e) => {
  if (ptr.down && e.pointerId === ptr.id) release(false);
});
window.addEventListener('blur', () => {
  if (ptr.down) release(false);
});
// Pointer left the window: drop any hover curl.
document.documentElement.addEventListener('pointerleave', () => {
  if (!ptr.down) ptr.x = ptr.y = -1e4;
});

// Keyboard: hold Space or Enter on the focused pack to tear it open.
packButton.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && phase === 'pack') {
    e.preventDefault();
    if (e.repeat || packDrag.active) return;
    [ptr.x, ptr.y] = [pack.x, pack.y];
    pressPack();
  }
});
packButton.addEventListener('keyup', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && packDrag.active) release(false);
});
window.addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (e.key === 'r' || e.key === 'R') replay();
});

let resizeQueued = false;
function queueLayout() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    layout();
  });
}
window.addEventListener('resize', queueLayout);
// Moving to a screen with another pixel ratio does not always fire resize.
function watchDpr() {
  matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => {
    queueLayout();
    watchDpr();
  }, { once: true });
}
watchDpr();

// ------------------------------------------------------------------ loop

let last = performance.now();
let speed = 1;
let fxDirty = true;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000) * speed;
  last = now;
  step(dt);
  requestAnimationFrame(frame);
}

function step(dt) {
  releaseLayers();
  holo = damp(holo, holoTarget, 5, dt);

  if (phase === 'pack') {
    updatePack(dt);
    updateHold(dt);
  } else if (phase === 'opening') updateOpening(dt);
  if (phase !== 'grid' || pack.el.style.display !== 'none') pack.update(dt);

  updateHover();
  updatePeel(dt);
  updateParticles(dt);

  for (const s of stickers) s.update(dt, holo);

  // The fx layer is cleared only when something was or will be drawn on it.
  const busy = particles.length || relaxing.length || peel || (phase === 'pack' && hold.p > 0.02);
  if (busy || fxDirty) {
    fxCtx.setTransform(1, 0, 0, 1, 0, 0);
    fxCtx.clearRect(0, 0, fx.width, fx.height);
    drawParticles(fxCtx);
    drawHoldRing(fxCtx);
    for (const r of relaxing) drawFlap(fxCtx, r);
    if (peel && (peel.mode === 'hover' || peel.mode === 'peel' || peel.mode === 'flip')) drawFlap(fxCtx, peel);
  }
  fxDirty = !!busy;
}

// Fonts block the first draw for at most this long; then system fonts are used.
const FONT_TIMEOUT_MS = 2500;

// Web fonts are added from script so the stylesheet never blocks first paint
// and no inline event handler is needed under the site's CSP.
function loadFonts() {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300..700&family=Noto+Sans+JP:wght@500&display=swap';
    link.onload = link.onerror = resolve;
    document.head.appendChild(link);
  });
}

async function boot() {
  const fontCss = loadFonts();
  layout();
  // The pack is up and interactive; the fallback timer in index.html checks this.
  document.documentElement.dataset.booted = '1';
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
  try {
    await Promise.race([
      fontCss.then(() => Promise.all([
        document.fonts.load('500 56px "Inter Tight"'),
        document.fonts.load('400 16px "Inter Tight"'),
        document.fonts.load('500 16px "Noto Sans JP"', '東京から'),
      ])),
      new Promise((r) => setTimeout(r, FONT_TIMEOUT_MS)),
    ]);
  } catch {
    // Fall back to the system font if the web font cannot load.
  }
  const [{ DEFS, Sticker }, { webglOk }] = await Promise.all([import('./stickers.js'), import('./shapes3d.js')]);
  stickers = DEFS.map((d, i) => new Sticker(d, board, i));
  layout();
  if (!webglOk()) {
    // No WebGL: the flat stickers still work; the 3D ones are left out.
    for (const s of stickers) if (s.kind !== 'svg') s.disabled = true;
  }
  for (const s of stickers) {
    s.applyTransform();
    if (s.kind !== 'svg' && !s.disabled) s.redraw(holo);
  }
  pack.apply();
  if (DEBUG) debugBoot();
  document.documentElement.dataset.ready = '1';
}

// ----------------------------------------------------------------- debug
// Flags and console hooks used while matching the reference video. They are
// only on for local development hosts.

function debugBoot() {
  speed = clamp(Number(params.get('speed')) || 1, 0.05, 4);
  if (params.has('grid')) showGrid();
  // ?still freezes idle motion so screenshots can be compared frame to frame.
  if (params.has('still')) for (const s of stickers) if (s.shape) s.shape.frozen = true;
  // ?open&t=1.2 fast-forwards the intro in fixed steps and freezes there.
  if (params.has('open')) {
    const t = Number(params.get('t'));
    if (Number.isFinite(t) && t > 0) seek(t);
    else startOpening();
  }
  window.__pack = { stickers, pack, replay, startOpening, showGrid, seek, hold, setSpeed: (v) => (speed = v) };
}

// Replays the intro and freezes it `target` seconds after the click.
function seek(target) {
  replay();
  startOpening();
  while (phase === 'opening' && openT < target - 1e-6) step(Math.min(1 / 60, target - openT));
  speed = 0;
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.dataset.failed = '1';
});
