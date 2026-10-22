// 'three' resolves through the import map in index.html (one pinned copy).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, rand, smoothstep, easeInOutCubic, roundedPolyPath, regularPoly, starPoly, hexToRgb, INK } from './util.js';
import { drawEyes } from './eyes.js';

// Shared WebGL renderer: every character is drawn into a corner of one
// canvas and copied out, so the page only ever holds one GL context.
const PITCH = (33 * Math.PI) / 180;
let renderer = null;
let GL_SIZE = 1024;

// Bumped when the GPU context comes back after a loss, so every character
// knows its canvas must be redrawn.
let epoch = 0;
export const glEpoch = () => epoch;

export function webglOk() {
  try {
    gl();
    return true;
  } catch {
    return false;
  }
}

function gl() {
  if (renderer) return renderer;
  const canvas = document.createElement('canvas');
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => {
    epoch++;
  });
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(GL_SIZE, GL_SIZE, false);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  return renderer;
}

const VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
void main() {
  vN = normalize(normalMatrix * normal);
  vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Three-tone ramp keyed on a view-space light: faces turned up read as the
// light tone, faces to the right as the mid tone, faces to the left as the
// dark tone. Colours are passed in sRGB and written out untouched.
const FRAG = /* glsl */ `
uniform vec3 cD;
uniform vec3 cM;
uniform vec3 cL;
uniform vec3 Ldir;
uniform float glit;
varying vec3 vN;
varying vec3 vP;
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 n = normalize(vN);
  float d = dot(n, Ldir);
  vec3 c = d >= 0.18
    ? mix(cM, cL, clamp((d - 0.18) / 0.75, 0.0, 1.0))
    : mix(cM, cD, clamp((0.18 - d) / 0.48, 0.0, 1.0));
  if (glit > 0.5) {
    vec3 q = floor(vP * 60.0);
    c *= 0.93 + 0.14 * hash(q + 3.1);
    float s = hash(q);
    if (s > 0.986) c = mix(c, vec3(0.55, 0.93, 0.78), 0.8);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const LDIR = new THREE.Vector3(0.35, 0.85, 0.45).normalize();

function v3(hex) {
  const [r, g, b] = hexToRgb(hex);
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

function rampMat(pal, glitter = false) {
  return new THREE.ShaderMaterial({
    uniforms: {
      cD: { value: v3(pal[0]) },
      cM: { value: v3(pal[1]) },
      cL: { value: v3(pal[2]) },
      Ldir: { value: LDIR },
      glit: { value: glitter ? 1 : 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
}

function extrude(pts, depth, { r = 0.06, bevel = 0.035, seg = 6 } = {}) {
  const shape = new THREE.Shape();
  roundedPolyPath(shape, pts, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: seg,
  });
  geo.translate(0, 0, -depth / 2);
  return creaseNormals(geo, 50);
}

// Smooth normals across edges flatter than `angle` degrees, so bevels and
// curved walls shade as one surface while real corners stay crisp.
function creaseNormals(src, angle) {
  const geo = src.index ? src.toNonIndexed() : src;
  const pos = geo.attributes.position;
  const n = pos.count;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const faces = [];
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    const nrm = new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b));
    faces.push(nrm.lengthSq() > 1e-12 ? nrm.normalize() : null);
  }
  const key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  const keys = new Array(n);
  const shared = new Map();
  for (let i = 0; i < n; i++) {
    const k = (keys[i] = key(i));
    if (!shared.has(k)) shared.set(k, []);
    shared.get(k).push((i / 3) | 0);
  }
  const limit = Math.cos((angle * Math.PI) / 180);
  const out = new Float32Array(n * 3);
  const acc = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const own = faces[(i / 3) | 0];
    if (!own) continue;
    acc.set(0, 0, 0);
    for (const t of shared.get(keys[i])) {
      const fn = faces[t];
      if (fn && fn.dot(own) >= limit) acc.add(fn);
    }
    acc.normalize();
    out[i * 3] = acc.x;
    out[i * 3 + 1] = acc.y;
    out[i * 3 + 2] = acc.z;
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return geo;
}

// Extrusion axis becomes +Y (the outline lies on the floor).
const upright = (geo) => {
  geo.rotateX(-Math.PI / 2);
  return geo;
};

// Profile is given top to bottom; LatheGeometry wants bottom to top for
// outward-facing triangles.
function lathe(points, segments) {
  const profile = points.map(([x, y]) => new THREE.Vector2(x, y)).reverse();
  const geo = new THREE.LatheGeometry(profile, segments).toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

// Octahedron turned so one face looks down +Z with a corner pointing up.
function d8(radius, rollDeg) {
  const geo = new THREE.OctahedronGeometry(radius, 0);
  geo.computeVertexNormals();
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 0, 1)));
  const pos = geo.attributes.position;
  let top = -1;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getZ(i) > 0.01 && (top < 0 || pos.getY(i) > pos.getY(top))) top = i;
  }
  const a = Math.atan2(pos.getY(top), pos.getX(top));
  geo.rotateZ(Math.PI / 2 - a + (rollDeg * Math.PI) / 180);
  geo.computeVertexNormals();
  return geo;
}

function dOutline(r, flat) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    pts.push([Math.cos(a) * r, Math.sin(a) * r - flat / 2]);
  }
  pts.push([-r, -flat / 2 - flat]);
  pts.push([r, -flat / 2 - flat]);
  return pts;
}

const deg = (d) => (d * Math.PI) / 180;

// Character specs. pal = [dark (left) face, mid (right) face, light (top) face].
// eye: position + normal in model space, sizes in model units.
export const SPECS = {
  slab: {
    geo: () => upright(extrude(regularPoly(4, 0.85, 45), 0.6, { r: 0.07, bevel: 0.045 })),
    pal: ['#335cb2', '#4f77d5', '#5b86e7'],
    yaw: 38,
    eye: { p: [0.26, -0.04, 0.65], n: [0, 0, 1], w: 0.085, h: 0.24, gap: 0.15 },
    mode: 'spin',
  },
  hexprism: {
    geo: () => upright(extrude(regularPoly(6, 0.66, 0), 0.64, { r: 0.05, bevel: 0.04 })),
    pal: ['#397784', '#4b8c9b', '#59a0af'],
    yaw: 32,
    eye: { p: [0.16, -0.03, 0.615], n: [0, 0, 1], w: 0.08, h: 0.2, gap: 0.14 },
    mode: 'spin',
  },

  star: {
    geo: () => extrude(starPoly(5, 0.68, 0.43, 90), 0.5, { r: 0.1, bevel: 0.07, seg: 8 }),
    pal: ['#c4951c', '#dcac2c', '#e8bb3a'],
    yaw: 26,
    tiltX: -6,
    tiltZ: 22,
    eye: { p: [0.0, -0.02, 0.322], n: [0, 0, 1], w: 0.042, h: 0.12, gap: 0.16, happy: true, slant: -12 },
  },
  house: {
    geo: () => extrude([[-0.46, -0.38], [0.46, -0.38], [0.46, 0.12], [0, 0.5], [-0.46, 0.12]], 0.85, { r: 0.04, bevel: 0.035 }),
    pal: ['#7d7499', '#9c94b9', '#a39bc0'],
    yaw: 45,
    eye: { p: [0.1, -0.1, 0.463], n: [0, 0, 1], w: 0.065, h: 0.18, gap: 0.12 },
  },
  arch: {
    geo: () =>
      extrude(
        [[-0.5, -0.5], [-0.16, -0.5], [-0.16, 0.04], [0.16, 0.04], [0.16, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
        0.56,
        { r: 0.06, bevel: 0.045 },
      ),
    pal: ['#977049', '#b98b5f', '#ca9e74'],
    yaw: 40,
    tiltX: 12,
    eye: { p: [-0.1, 0.26, 0.326], n: [0, 0, 1], w: 0.07, h: 0.19, gap: 0.13 },
  },
  loaf: {
    geo: () => extrude(dOutline(0.55, 0.1), 0.95, { r: 0, bevel: 0.05, seg: 10 }),
    pal: ['#d6977d', '#dda188', '#ecb79d'],
    yaw: 50,
    tiltX: 4,
    eye: { p: [-0.04, 0.0, 0.53], n: [0, 0, 1], w: 0.07, h: 0.2, gap: 0.13 },
  },
  drop: {
    geo: () => lathe([[0, 1.25], [0.85, 0.08], [0, -0.42]], 4),
    pal: ['#4a9a8a', '#5db4a3', '#6cc4b4'],
    yaw: -18,
    tiltX: -15,
    eye: { p: [0.34, 0.3, 0.34], n: [0.58, 0.57, 0.58], w: 0.09, h: 0.24, gap: 0.17 },
  },
  pyramid: {
    geo: () => lathe([[0, 0.78], [0.85, -0.22], [0, -0.22]], 4),
    pal: ['#7f67d1', '#967cf1', '#9b82f3'],
    yaw: 0,
    eye: { p: [0.27, 0.15, 0.27], n: [0.62, 0.48, 0.62], w: 0.075, h: 0.2, gap: 0.14 },
  },
  block: {
    geo: () => upright(extrude(regularPoly(4, 0.38, 45), 1.22, { r: 0.04, bevel: 0.035 })),
    pal: ['#81af62', '#689a4a', '#7eb063'],
    yaw: -25,
    tiltZ: 2,
    eye: { p: [0.1, -0.2, 0.31], n: [0, 0, 1], w: 0.06, h: 0.17, gap: 0.12 },
  },
  gem: {
    geo: () => d8(0.8, 7),
    pal: ['#b04448', '#d55f63', '#e26d70'],
    yaw: -8,
    tiltX: -26,
    eye: { p: [0.0, -0.04, 0.466], n: [0, 0, 1], w: 0.08, h: 0.21, gap: 0.15 },
  },
  folio: {
    glb: new URL('../assets/folio.glb', import.meta.url).href,
    yaw: -12,
    tiltX: -20,
    mode: 'folio',
  },
  logocube: {
    geo: () => upright(extrude(regularPoly(4, 0.7, 45), 1.15, { r: 0.05, bevel: 0.035 })),
    pal: ['#c04418', '#c1551e', '#f78147'],
    yaw: 28,
    eye: { p: [-0.12, -0.2, 0.535], n: [0, 0, 1], w: 0.1, h: 0.27, gap: 0.17 },
    glitter: true,
  },
};

const EYE_TEX = 256;
const EYE_PLANE = 0.5;

export class Shape3D {
  constructor(name) {
    const spec = SPECS[name];
    this.name = name;
    this.spec = spec;
    this.scene = new THREE.Scene();
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    if (spec.glb) {
      this.mesh = new THREE.Group();
      this.pivot.add(this.mesh);
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0xe3d9cb, 2.4));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(3, 6, 8);
      this.scene.add(sun);
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
      this.camera.position.set(0, Math.sin(PITCH) * 20, Math.cos(PITCH) * 20);
      this.camera.lookAt(0, 0, 0);
      this.camera.updateMatrixWorld();
      this.eye = { s: 1, typing: 0, t: 0 };
      this.spin = this.wobX = this.wobZ = 0;
      this.pose();
      this.fit = { cx: 0, cy: 0, w: 1, h: 1 };
      this.action = null;
      this.timer = rand(1.5, 3.5);
      this.frozen = false;
      this.dirty = false;
      this.loadModel(spec);
      return;
    }
    this.mat = rampMat(spec.pal, spec.glitter);
    this.mesh = new THREE.Mesh(spec.geo(), this.mat);
    this.pivot.add(this.mesh);

    this.eyeCanvas = document.createElement('canvas');
    this.eyeCanvas.width = this.eyeCanvas.height = EYE_TEX;
    this.eyeCtx = this.eyeCanvas.getContext('2d');
    this.eyeTex = new THREE.CanvasTexture(this.eyeCanvas);
    this.eyeTex.colorSpace = THREE.SRGBColorSpace;
    this.eyeTex.anisotropy = 4;
    const eyeMat = new THREE.MeshBasicMaterial({
      map: this.eyeTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    this.eyePlane = new THREE.Mesh(new THREE.PlaneGeometry(EYE_PLANE, EYE_PLANE), eyeMat);
    const e = spec.eye;
    const n = new THREE.Vector3(...e.n).normalize();
    this.eyePlane.position.set(...e.p);
    this.eyePlane.lookAt(this.eyePlane.position.clone().add(n));
    this.pivot.add(this.eyePlane);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.set(0, Math.sin(PITCH) * 20, Math.cos(PITCH) * 20);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    this.eye = { s: 1, typing: 0, t: 0, happy: !!e.happy };
    this.spin = 0;
    this.wobX = 0;
    this.wobZ = 0;
    this.pose();
    this.fit = this.measure();

    this.action = null;
    this.timer = rand(0.6, 3.2);
    this.cycleStep = Math.floor(rand(0, 4));
    this.frozen = false;
    this.dirty = true;
    this.drawEyeTexture();
  }

  // Real character model (the Folio felt teacher): happy eyes on, the
  // pointer pen and the open eyes hidden, centred on the pivot.
  loadModel(spec) {
    const onError = (err) => {
      // Without its model the Folio sticker stays empty; nothing else breaks.
      console.warn('Folio model failed to load', err);
      this.failed = true;
    };
    new GLTFLoader().load(spec.glb, (gltf) => {
      const model = gltf.scene;
      const hide = /^(pointer|ptr_|eye\d|eye-\d|eye_hl)/;
      model.traverse((o) => {
        if (hide.test(o.name)) o.visible = false;
        // The SDK scales the happy eyes up at runtime; they ship at zero.
        if (/^happy/.test(o.name)) o.scale.setScalar(1);
      });
      const box = new THREE.Box3().setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      model.position.sub(c);
      this.mesh.add(model);
      this.pose();
      this.fit = this.measure();
      if (this.frameArgs) this.frame(...this.frameArgs);
      this.dirty = true;
    }, undefined, onError);
  }

  pose() {
    const s = this.spec;
    this.pivot.rotation.set(deg(s.tiltX || 0) + this.wobX, deg(s.yaw || 0) + this.spin, deg(s.tiltZ || 0) + this.wobZ, 'ZXY');
    this.pivot.updateMatrixWorld(true);
  }

  // Projected bounds of the mesh at rest, in model units seen through the camera.
  measure() {
    const v = new THREE.Vector3();
    const view = this.camera.matrixWorldInverse;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    this.mesh.updateMatrixWorld(true);
    this.mesh.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(view);
        x0 = Math.min(x0, v.x);
        x1 = Math.max(x1, v.x);
        y0 = Math.min(y0, v.y);
        y1 = Math.max(y1, v.y);
      }
    });
    if (x0 === Infinity) return { cx: 0, cy: 0, w: 1, h: 1 };
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }

  // Frames the camera so the rest pose fills an inner box of bw x bh design px
  // centred in a canvas of cw x ch design px.
  frame(cw, ch, bw, bh) {
    this.frameArgs = [cw, ch, bw, bh];
    const unit = Math.min(bw / this.fit.w, bh / this.fit.h);
    this.unit = unit;
    const hw = cw / 2 / unit;
    const hh = ch / 2 / unit;
    this.camera.left = this.fit.cx - hw;
    this.camera.right = this.fit.cx + hw;
    this.camera.top = this.fit.cy + hh;
    this.camera.bottom = this.fit.cy - hh;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  drawEyeTexture() {
    if (!this.eyeCtx) return;
    const ctx = this.eyeCtx;
    const k = EYE_TEX / EYE_PLANE;
    const e = this.spec.eye;
    ctx.clearRect(0, 0, EYE_TEX, EYE_TEX);
    drawEyes(ctx, EYE_TEX / 2, EYE_TEX / 2, this.eye, {
      w: e.w * k,
      h: e.h * k,
      gap: e.gap * k,
      slant: deg(e.slant ?? 8),
      color: INK,
    });
    this.eyeTex.needsUpdate = true;
  }

  setPalette(pal) {
    this.mat.uniforms.cD.value.copy(v3(pal[0]));
    this.mat.uniforms.cM.value.copy(v3(pal[1]));
    this.mat.uniforms.cL.value.copy(v3(pal[2]));
    this.dirty = true;
  }

  startAction() {
    if (this.spec.mode === 'folio') {
      // Folio glances to one side and back.
      this.action = { name: 'look', t: 0, dur: 1.8, dir: Math.random() < 0.5 ? -1 : 1 };
      return;
    }
    if (this.spec.mode === 'spin') {
      // Spin cycle seen on the slab and the prism: spin, dots, eyes, blink.
      const steps = ['spin', 'typing', 'hold', 'blink'];
      const name = steps[this.cycleStep % steps.length];
      this.cycleStep++;
      const dur = { spin: 1.25, typing: rand(0.9, 1.3), hold: rand(0.4, 0.8), blink: 0.32 }[name];
      this.action = { name, t: 0, dur, dir: Math.random() < 0.5 ? -1 : 1 };
    } else {
      this.action = { name: 'blink', t: 0, dur: 0.32 };
    }
  }

  update(dt) {
    if (this.frozen) return this.dirty;
    if (!this.action) {
      this.timer -= dt;
      if (this.timer <= 0) this.startAction();
      return this.dirty;
    }
    const a = this.action;
    a.t += dt;
    const u = clamp(a.t / a.dur, 0, 1);
    this.eye.t += dt;
    if (a.name === 'blink') {
      // Eyes shrink to small dots and come back.
      this.eye.s = 1 - 0.75 * Math.sin(u * Math.PI);
    } else if (a.name === 'typing') {
      this.eye.typing = smoothstep(0, 0.15, u) * (1 - smoothstep(0.85, 1, u));
    } else if (a.name === 'look') {
      const w = Math.sin(easeInOutCubic(u) * Math.PI);
      this.spin = w * 0.45 * a.dir;
      this.wobZ = w * deg(5) * -a.dir;
      this.pose();
    } else if (a.name === 'spin') {
      this.eye.s = u < 0.16 ? 1 - u / 0.16 : u > 0.84 ? (u - 0.84) / 0.16 : 0;
      const k = clamp((u - 0.1) / 0.8, 0, 1);
      this.spin = easeInOutCubic(k) * Math.PI * 2 * a.dir;
      this.wobX = Math.sin(k * Math.PI) * deg(38);
      this.wobZ = Math.sin(k * Math.PI * 2) * deg(12) * a.dir;
      this.pose();
    }
    // Redraw only when something visibly moves: 'hold' changes nothing, and
    // the typing dots only need about 30 fps.
    let redraw = a.name === 'spin' || a.name === 'blink' || a.name === 'look';
    if (a.name === 'typing') {
      a.acc = (a.acc || 0) + dt;
      if (a.acc >= 1 / 30) {
        a.acc = 0;
        redraw = true;
      }
    }
    if (redraw) {
      this.drawEyeTexture();
      this.dirty = true;
    }
    if (u >= 1) {
      this.eye.s = 1;
      this.eye.typing = 0;
      this.spin = 0;
      this.wobX = this.wobZ = 0;
      this.pose();
      this.drawEyeTexture();
      this.action = null;
      this.timer = this.spec.mode === 'spin' ? rand(0.05, 0.35) : this.spec.mode === 'folio' ? rand(2, 4.5) : rand(2.5, 7);
      this.dirty = true;
    }
    return this.dirty;
  }

  // Renders into ctx (an art canvas) at pw x ph device px.
  renderTo(ctx, pw, ph) {
    const r = gl();
    const need = Math.max(pw, ph);
    if (need > GL_SIZE) {
      GL_SIZE = Math.min(4096, 2 ** Math.ceil(Math.log2(need)));
      r.setSize(GL_SIZE, GL_SIZE, false);
    }
    r.setViewport(0, GL_SIZE - ph, pw, ph);
    r.setScissor(0, GL_SIZE - ph, pw, ph);
    r.setScissorTest(true);
    // The eye decal renders with depthWrite off and leaves the depth mask
    // off; clear() does not reset it, so the next character would draw
    // against stale depth and z-fight.
    r.state.buffers.depth.setMask(true);
    r.clear();
    r.render(this.scene, this.camera);
    ctx.clearRect(0, 0, pw, ph);
    ctx.drawImage(r.domElement, 0, 0, pw, ph, 0, 0, pw, ph);
    this.dirty = false;
  }
}

const dil = document.createElement('canvas');
const dilCtx = dil.getContext('2d');

// Sticker die-cut: grows the art's silhouette by rpx device px and fills the
// grown area with `fill` (a colour or a gradient), then draws the art on top.
export function dieCut(art, out, rpx, fill, soft = 0, mask = null) {
  const w = art.width;
  const h = art.height;
  // Grow-only scratch buffer: stickers of different sizes share it without
  // reallocating its backing store every call.
  if (dil.width < w || dil.height < h) {
    dil.width = Math.max(dil.width, w);
    dil.height = Math.max(dil.height, h);
  }
  dilCtx.clearRect(0, 0, w, h);
  const N = 18;
  for (const [ring, count] of [[1, N], [0.5, 8]]) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      dilCtx.drawImage(art, Math.cos(a) * rpx * ring, Math.sin(a) * rpx * ring);
    }
  }
  if (mask) {
    const mctx = mask.getContext('2d');
    if (mask.width !== w || mask.height !== h) {
      mask.width = w;
      mask.height = h;
    }
    mctx.clearRect(0, 0, w, h);
    mctx.filter = soft ? `blur(${soft}px)` : 'none';
    mctx.drawImage(dil, 0, 0, w, h, 0, 0, w, h);
    mctx.filter = 'none';
  }
  dilCtx.globalCompositeOperation = 'source-in';
  dilCtx.fillStyle = fill;
  dilCtx.fillRect(0, 0, w, h);
  dilCtx.globalCompositeOperation = 'source-over';
  out.clearRect(0, 0, w, h);
  if (soft) out.filter = `blur(${soft}px)`;
  out.drawImage(dil, 0, 0, w, h, 0, 0, w, h);
  out.filter = 'none';
  out.drawImage(art, 0, 0);
}

