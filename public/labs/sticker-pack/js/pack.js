import { INK, ORANGE, el, f, clamp, damp, rand } from './util.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const PACK_W = 268;
const PACK_H = 409;
const SEAL = 28;
const SHEEN = '#f6a191';

function zigzag(y0, y1, n, w) {
  // Edge from x=0 to x=w alternating between y0 (valleys) and y1 (tips).
  const tw = w / n;
  let d = '';
  for (let i = 0; i < n; i++) d += `L${f(i * tw + tw / 2)} ${y1}L${f((i + 1) * tw)} ${y0}`;
  return d;
}

function tornEdge(y, n, w, depth, seed = 1) {
  const tw = w / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    const j = Math.sin(i * 12.9898 * seed) * 0.5 + 0.5;
    d += `L${f(i * tw + tw * (0.35 + j * 0.3))} ${f(y - depth * (0.6 + j * 0.6))}L${f((i + 1) * tw)} ${y}`;
  }
  return d;
}

const W = PACK_W;
const H = PACK_H;
const BODY = `M3 ${SEAL - 1}C0.6 120 0.6 290 3 ${H - SEAL + 1}H${W - 3}C${W - 0.6} 290 ${W - 0.6} 120 ${W - 3} ${SEAL - 1}Z`;
const TOP_SEAL = `M0 6${zigzag(6, 0, 14, W)}V${SEAL}H0Z`;
const BOTTOM_SEAL = `M0 ${H - SEAL}H${W}V${H - 6}${zigzag(H - 6, H, 14, W).replace(/L([\d.]+) /g, (m, x) => `L${f(W - +x)} `)}H0Z`;

function restSheen() {
  // Light band under the top seal with a crinkled lower edge, then a thin
  // strip running down the left side.
  let d = `M4 ${SEAL + 1}H${W - 4}V${SEAL + 4}`;
  const steps = 13;
  for (let i = 1; i <= steps; i++) {
    // Crinkled foil: rounded teeth of uneven depth, deeper towards the left.
    const x = W - 4 - ((W - 26) * i) / steps;
    const base = SEAL + 4 + (i / steps) * 25;
    const depth = 8 + 4 * Math.sin(i * 1.7) + 2 * Math.sin(i * 4.3);
    d += `Q${f(x + 9)} ${f(base + depth + 2)} ${f(x + 5)} ${f(base + depth)}Q${f(x + 2)} ${f(base + 2)} ${f(x)} ${f(base)}`;
  }
  d += `C16 120 9 260 6 345C5 352 4 352 4 345Z`;
  return d;
}

const TURNED_SHEEN = `M4 ${SEAL + 1}H${W - 4}V${SEAL + 40}C${W - 40} 70 170 120 120 200C80 262 40 300 4 330Z`;

function side(front) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', `pack-side ${front ? 'pack-front' : 'pack-back'}`);
  const id = front ? 'pf' : 'pb';
  svg.innerHTML = `
    <defs>
      <linearGradient id="${id}-edge" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="${ORANGE}" stop-opacity="0"/>
        <stop offset="1" stop-color="#d84a1f" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="${id}-turn" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${SHEEN}"/>
        <stop offset="1" stop-color="#f4927f"/>
      </linearGradient>
    </defs>
    <path class="seal-top" d="${TOP_SEAL}" fill="${ORANGE}"/>
    <path d="${BODY}" fill="${ORANGE}"/>
    <path d="M${W - 12} ${SEAL}H${W - 3}C${W - 0.6} 120 ${W - 0.6} 290 ${W - 3} ${H - SEAL}H${W - 12}Z" fill="url(#${id}-edge)"/>
    <path d="M3 ${H - SEAL - 10}${tornEdge(H - SEAL - 8, 18, W - 3, 3, 2)}V${H - SEAL + 1}H3Z" fill="#dd4c20" opacity="0.85"/>
    <path class="sheen-rest" d="${restSheen()}" fill="${SHEEN}"/>
    <path class="sheen-turn" d="${TURNED_SHEEN}" fill="url(#${id}-turn)" opacity="0"/>
    <path class="torn" d="M0 ${SEAL + 2}${tornEdge(SEAL + 2, 26, W, 5)}V${SEAL + 10}H0Z" fill="${SHEEN}" visibility="hidden"/>
    <path d="${BOTTOM_SEAL}" fill="${ORANGE}"/>
    <rect class="shade" x="0" y="0" width="${W}" height="${H}" fill="#7a1e00" opacity="0" style="mix-blend-mode:multiply"/>
    ${
      front
        ? `
    <text x="24" y="99" font-size="39" font-weight="500" letter-spacing="-0.4" fill="${INK}">fuad</text>
    <text x="25" y="114" font-size="8.5" font-weight="500" letter-spacing="0.6" fill="#2a1a12" opacity="0.7">MOHAMED FUAD · 東京</text>
    <text x="243" y="54" font-size="8" font-weight="500" letter-spacing="0.4" text-anchor="end" fill="#2a1a12" opacity="0.6">mohamedfuad.com</text>
    <text x="24" y="345" font-size="7.5" font-weight="500" letter-spacing="0.8" fill="#2a1a12" opacity="0.55">VOL. 01 · 2026</text>
    <rect class="eye" x="111.5" y="186" width="20" height="61" rx="10" fill="${INK}"/>
    <rect class="eye" x="153" y="186" width="20" height="61" rx="10" fill="${INK}"/>
    <text x="24" y="360" font-size="12.5" font-weight="500" letter-spacing="-0.2" fill="#2a1a12">Sticker pack</text>
    <text x="243" y="360" font-size="12.5" font-weight="500" letter-spacing="-0.2" text-anchor="end" fill="#2a1a12">33 stickers</text>`
        : ''
    }`;
  svg.querySelectorAll('text').forEach((t) => (t.style.fontFamily = "'Inter Tight', 'Noto Sans JP', system-ui, sans-serif"));
  return svg;
}

function strip() {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} 30`);
  svg.setAttribute('class', 'pack-strip');
  svg.innerHTML = `
    <defs>
      <linearGradient id="st-g" x1="0" x2="1">
        <stop offset="0" stop-color="${SHEEN}"/>
        <stop offset="0.25" stop-color="${ORANGE}"/>
      </linearGradient>
    </defs>
    <path d="M0 6${zigzag(6, 0, 14, W)}V${SEAL - 2}${tornEdge(SEAL - 2, 26, W, 4).replace(/L([\d.]+) /g, (m, x) => `L${f(W - +x)} `)}Z" fill="url(#st-g)"/>`;
  return svg;
}

function setStyle(node, prop, value) {
  const key = `_s_${prop}`;
  if (node[key] === value) return;
  node[key] = value;
  node.style[prop] = value;
}

// Writes an attribute only when its value changes, to avoid repaints.
function setAttr(node, name, value) {
  const key = `_${name}`;
  if (node[key] === value) return;
  node[key] = value;
  node.setAttribute(name, value);
}

export class Pack {
  constructor(board) {
    this.el = el('div', 'pack', board);
    // Focusable so the pack can be opened from the keyboard (hold Space/Enter).
    this.el.tabIndex = 0;
    this.el.setAttribute('role', 'button');
    this.el.setAttribute('aria-label', 'Sticker pack. Press and hold to tear it open.');
    this.inner = el('div', 'pack-inner', this.el);
    this.front = side(true);
    this.back = side(false);
    this.inner.append(this.front, this.back);
    this.strip = strip();
    this.inner.appendChild(this.strip);
    this.hintEl = el('div', 'pack-hint', this.el);
    this.hintEl.textContent = 'Press and hold to open';
    this.hintEl.setAttribute('aria-hidden', 'true');
    this.seals = [this.front, this.back].map((side) => side.querySelector('.seal-top'));
    this.tornEdge = this.front.querySelector('.torn');
    this.eyes = [...this.front.querySelectorAll('.eye')];
    this.sheens = [this.front, this.back].map((s) => ({
      rest: s.querySelector('.sheen-rest'),
      turn: s.querySelector('.sheen-turn'),
      shade: s.querySelector('.shade'),
    }));
    this.reset();
  }

  reset() {
    this.x = 640;
    this.y = 400;
    this.rotZ = 0;
    this.rotY = 0;
    this.scale = 1;
    this.puff = 0;
    this.vx = 0;
    this.vy = 0;
    this.spinV = 0;
    this.state = 'idle';
    this.eye = { w: 20, h: 61 };
    this.blinkT = rand(1.2, 3);
    this.blink = null;
    this.eyeOverride = null;
    this.stripState = null;
    this.shakeX = 0;
    this.shakeR = 0;
    this.squash = 0;
    this.strain = 0;
    this.hint(true);
    this.setTorn(false);
    this.el.style.display = '';
    this.apply();
  }

  contains(bx, by) {
    const a = (-this.rotZ * Math.PI) / 180;
    const dx = bx - this.x;
    const dy = by - this.y;
    const lx = (dx * Math.cos(a) - dy * Math.sin(a)) / this.scale;
    const ly = (dx * Math.sin(a) + dy * Math.cos(a)) / this.scale;
    return Math.abs(lx) <= W / 2 && Math.abs(ly) <= H / 2;
  }

  get top() {
    return this.y - (H / 2 - SEAL) * this.scale;
  }

  hint(on) {
    if (this.hintOn === on) return;
    this.hintOn = on;
    this.hintEl.classList.toggle('is-on', on);
  }

  // Puts the seal back when a hold is let go before the strip tears off.
  untear() {
    this.setTorn(false);
    this.stripState = null;
  }

  // Swaps the sealed top for the torn edge and the separate strip.
  setTorn(torn) {
    for (const seal of this.seals) seal.setAttribute('visibility', torn ? 'hidden' : 'visible');
    this.tornEdge.setAttribute('visibility', torn ? 'visible' : 'hidden');
    this.strip.style.visibility = torn ? 'visible' : 'hidden';
  }

  tearStart() {
    this.setTorn(true);
    this.stripState = { ang: 0, x: 0, y: 0, vx: 0, vy: 0, va: 0, free: false };
  }

  stripRelease() {
    const s = this.stripState;
    s.free = true;
    s.vx = 640;
    s.vy = -980;
    s.va = 110;
  }

  // Eye targets: normal pills, closed line, squeezed squares, big pills.
  eyeTarget(mode) {
    switch (mode) {
      case 'closed': return { w: 22, h: 4 };
      case 'squeeze': {
        // Squeezes tighter the harder the pack strains.
        const k = this.strain || 0;
        return { w: 21 - 3 * k, h: 20 - 4 * k };
      }
      case 'big': return { w: 23, h: 72 };
      default: return { w: 20, h: 61 };
    }
  }

  update(dt) {
    // Blink on a timer unless something else drives the eyes.
    if (!this.eyeOverride) {
      this.blinkT -= dt;
      if (!this.blink && this.blinkT <= 0) this.blink = { t: 0 };
      if (this.blink) {
        this.blink.t += dt;
        if (this.blink.t > 0.16) {
          this.blink = null;
          this.blinkT = rand(2.2, 5);
        }
      }
    }
    const mode = this.eyeOverride || (this.blink ? 'closed' : this.dragSqueeze ? 'squeeze' : 'normal');
    const tgt = this.eyeTarget(mode);
    const rate = mode === 'closed' ? 60 : 26;
    this.eye.w = damp(this.eye.w, tgt.w, rate, dt);
    this.eye.h = damp(this.eye.h, tgt.h, rate, dt);

    const s = this.stripState;
    if (s && s.free) {
      s.vy += 2300 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.va * dt;
    }
    this.apply();
  }

  apply() {
    const sx = 1 + this.puff * 0.12;
    const sy = 1 - (this.squash || 0);
    setStyle(this.el, 'transform', `translate(${f(this.x - W / 2 + (this.shakeX || 0))}px, ${f(this.y - H / 2)}px) rotate(${f(this.rotZ + (this.shakeR || 0))}deg) scale(${f(this.scale * 1000) / 1000})`);
    setStyle(this.inner, 'transform', `perspective(1400px) rotateY(${f(this.rotY)}deg) scale(${f(sx * 1000) / 1000}, ${f(sy * 1000) / 1000})`);

    const cx = [121.5, 163];
    this.eyes.forEach((e, i) => {
      setAttr(e, 'x', f(cx[i] - this.eye.w / 2));
      setAttr(e, 'y', f(216.5 - this.eye.h / 2));
      setAttr(e, 'width', f(this.eye.w));
      setAttr(e, 'height', f(this.eye.h));
      setAttr(e, 'rx', f(Math.min(this.eye.w, this.eye.h) / 2 - (this.eye.h < 30 && this.eye.h > 10 ? 4 : 0)));
    });

    // Foil sheen grows as the pack turns away from the viewer.
    const a = (this.rotY * Math.PI) / 180;
    const turn = clamp(Math.abs(Math.sin(a)) * 1.6, 0, 1);
    const facing = Math.cos(a);
    setAttr(this.sheens[0].turn, 'opacity', f(turn));
    setAttr(this.sheens[0].rest, 'opacity', f(1 - turn * 0.6));
    setAttr(this.sheens[1].turn, 'opacity', f(clamp(turn + 0.35, 0, 1)));
    setAttr(this.sheens[1].rest, 'opacity', '0');
    const shade = clamp(Math.abs(Math.sin(a)) * 0.22 + (facing < 0 ? -facing * 0.08 : 0), 0, 0.3);
    setAttr(this.sheens[0].shade, 'opacity', f(shade));
    setAttr(this.sheens[1].shade, 'opacity', f(shade));

    const s = this.stripState;
    if (s) {
      setStyle(this.strip, 'transform', `translate(${f(s.x)}px, ${f(s.y)}px) rotate(${f(s.ang)}deg)`);
    }
  }
}

