import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  NoBlending,
  Object3D,
  OrthographicCamera,
  PCFSoftShadowMap,
  PointLight,
  PlaneGeometry,
  RepeatWrapping,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { SPORTS, WATER, createSim, lerp, seeded, stepSim } from './sim';

// The courts are a real 3D scene: an isometric orthographic camera, one sun
// with shadow maps, and simple lit materials. It renders into a target the
// size of the art (about one art pixel per CSS pixel), and a second pass
// quantises every channel with a 4x4 Bayer threshold. That ordered dither is
// what turns flat fills into the two-tone checker of pixel-art renders.
// The look follows Dhruv's "Small plays" posts on X.

// World (x, y, z) in metres maps to three.js (x, z, y): y up.
const v3 = (x, y, z = 0) => new Vector3(x, z, y);

const ease = (t) => 1 - (1 - t) ** 3;
// Give the main thread back, so long jobs never block scrolling for long.
const yieldToMain = () =>
  new Promise((resolve) => (globalThis.scheduler?.yield ? globalThis.scheduler.yield().then(resolve) : setTimeout(resolve, 0)));

// ---- Dither pass ----------------------------------------------------------

const DITHER_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const DITHER_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform float levels;
varying vec2 vUv;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}
float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}
vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec4 c = texture2D(tScene, vUv);
  float t = bayer4(gl_FragCoord.xy);
  // Partly transparent pixels (fence mesh against the page) are stippled.
  if (c.a <= t * 0.96 + 0.02) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 col = toSRGB(clamp(c.rgb / max(c.a, 0.001), 0.0, 1.0));
  col = floor(col * levels + t) / levels;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- Painted textures -----------------------------------------------------

// Nearest sampling keeps each painted speck a crisp pixel, as in the
// reference renders; the camera never moves, so nothing shimmers.
function crisp(canvas) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

// A canvas whose drawing units are metres over a world rectangle. About 80 px
// per metre is four texture pixels per art pixel: crisp, and small to upload.
function metreCanvas(x0, y0, sx, sy, maxPx = 2048, perMetre = 80) {
  const scale = Math.min(maxPx / Math.max(sx, sy), perMetre);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(sx * scale);
  canvas.height = Math.ceil(sy * scale);
  const g = canvas.getContext('2d');
  g.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
  return { canvas, g };
}

const PX = 0.055; // one art pixel on the ground, in metres

// Scatters one-pixel specks. A big ground is ~200,000 of them, so a ground
// painter hands the main thread back every 8,000.
function speckler(g, rand, yieldEvery = 0) {
  let since = 0;
  return async (ax, ay, bx, by, colors, density, size = PX) => {
    const n = Math.round((bx - ax) * (by - ay) * density);
    for (let i = 0; i < n; i += 1) {
      g.fillStyle = colors[i % colors.length];
      g.fillRect(lerp(ax, bx, rand()), lerp(ay, by, rand()), size * (1 + Math.floor(rand() * 2)), size);
      since += 1;
      if (yieldEvery && since >= yieldEvery) {
        since = 0;
        await yieldToMain();
      }
    }
  };
}

const line = (g, width, color, points, close = false) => {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'butt';
  g.lineJoin = 'miter';
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
  g.stroke();
};
const box = (g, x0, y0, x1, y1, color) => {
  g.fillStyle = color;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
};
const arc = (g, width, color, cx, cy, r, a0, a1) => {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.arc(cx, cy, r, a0, a1);
  g.stroke();
};
const tiles = (g, x0, y0, x1, y1, base, grout, size) => {
  box(g, x0, y0, x1, y1, base);
  g.fillStyle = grout;
  for (let x = x0; x <= x1 + 1e-6; x += size) g.fillRect(x - 0.012, y0, 0.024, y1 - y0);
  for (let y = y0; y <= y1 + 1e-6; y += size) g.fillRect(x0, y - 0.012, x1 - x0, 0.024);
};

// The whole ground (grass, apron, court paint and lines) is painted once into
// a canvas in world metres, then laid on one plane.
async function paintGround(sport, extent) {
  const { x0, y0, sx, sy } = extent;
  const { canvas, g } = metreCanvas(x0, y0, sx, sy);
  const rand = seeded(sport.id.length * 131 + 7);
  const speckle = speckler(g, rand, 8000);
  const [W, L] = sport.court;
  const m = sport.pave + sport.grass;
  const look = GROUNDS[sport.id];

  if (sport.room) {
    await look.paint(g, { W, L, speckle, rand });
    return crisp(canvas);
  }
  // Grass with a ragged, tufted edge.
  const edge = [];
  const ring = (t) => {
    const per = 2 * (W + L + 4 * m);
    let d = t * per;
    const w = W + 2 * m;
    const l = L + 2 * m;
    if (d < w) return [-m + d, -m, 0, -1];
    d -= w;
    if (d < l) return [W + m, -m + d, 1, 0];
    d -= l;
    if (d < w) return [W + m - d, L + m, 0, 1];
    d -= w;
    return [-m, L + m - d, -1, 0];
  };
  const steps = Math.round((2 * (W + L + 4 * m)) / 0.06);
  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    const [x, y, nx, ny] = ring(t);
    const wave = Math.sin(t * 97) * 0.08 + Math.sin(t * 263 + 1.3) * 0.06;
    const tuft = rand() < 0.35 ? rand() * 0.22 : rand() * 0.06;
    const out = 0.05 + wave + tuft;
    edge.push([x + nx * out, y + ny * out]);
  }
  g.fillStyle = look.grass[0];
  g.beginPath();
  edge.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
  await speckle(-m - 0.4, -m - 0.4, W + m + 0.4, L + m + 0.4, look.grass.slice(1), 260);
  // Stray tufts just outside the edge.
  for (let i = 0; i < steps * 0.5; i += 1) {
    const [x, y, nx, ny] = ring(rand());
    const out = 0.15 + rand() * 0.3;
    g.fillStyle = look.grass[1 + (i % (look.grass.length - 1))];
    g.fillRect(x + nx * out, y + ny * out, PX, PX * (1 + Math.floor(rand() * 2)));
  }

  await look.paint(g, { W, L, pave: sport.pave, speckle, rand });
  // A pool is a hole in the ground; the basin below shows through it.
  if (sport.pool) g.clearRect(0, 0, W, L);
  return crisp(canvas);
}

// Deck tiles around a pool.
async function paintDeck(g, { W, L, pave, speckle }) {
  tiles(g, -pave, -pave, W + pave, L + pave, '#d9d3c4', '#c5bfae', 0.5);
  await speckle(-pave, -pave, W + pave, L + pave, ['#cfc8b8', '#e2ddd0', '#c3bcaa'], 90);
  // A darker wet band round the rim, where divers climb out.
  box(g, -0.6, -0.6, W + 0.6, L + 0.6, 'rgba(150, 160, 160, 0.35)');
}

const GROUNDS = {
  basketball: {
    grass: ['#5a8f38', '#6fa646', '#477a2d', '#80b553', '#3b6b27'],
    async paint(g, { W, L, pave, speckle }) {
      const [hx, hy] = [W / 2, 1.575];
      box(g, -pave, -pave, W + pave, L + pave, '#7b5b3d');
      await speckle(-pave, -pave, W + pave, L + pave, ['#6c4f34', '#8a6847'], 200);
      const a = pave - 0.35;
      box(g, -a, -a, W + a, L + a, '#3d3e41');
      await speckle(-a, -a, W + a, L + a, ['#4b4c50', '#333437', '#56575b', '#2e2f31'], 420);
      box(g, hx - 2.45, 0, hx + 2.45, 5.8, '#3d6a86');
      await speckle(hx - 2.45, 0, hx + 2.45, 5.8, ['#467690', '#355d77'], 260);
      // A painted centre logo at half court.
      g.fillStyle = '#c4532f';
      g.beginPath();
      g.arc(hx, L, 1.8, Math.PI, Math.PI * 2);
      g.fill();
      await speckle(hx - 1.8, L - 1.8, hx + 1.8, L, ['rgba(214, 102, 62, 0.8)', 'rgba(160, 64, 36, 0.8)'], 160);
      const white = 'rgba(226, 226, 218, 0.92)';
      const w = 0.075;
      line(g, w, white, [[0, 0], [W, 0], [W, L], [0, L]], true);
      line(g, w, white, [[hx - 2.45, 0], [hx - 2.45, 5.8], [hx + 2.45, 5.8], [hx + 2.45, 0]]);
      arc(g, w, white, hx, 5.8, 1.8, 0, Math.PI * 2);
      arc(g, w, white, hx, hy, 1.25, 0, Math.PI);
      const ang = Math.acos((W - 0.9 - hx) / 6.75);
      arc(g, w, white, hx, hy, 6.75, ang, Math.PI - ang);
      const edgeY = hy + Math.sin(ang) * 6.75;
      line(g, w, white, [[0.9, 0], [0.9, edgeY]]);
      line(g, w, white, [[W - 0.9, 0], [W - 0.9, edgeY]]);
      arc(g, w, white, hx, L, 1.8, Math.PI, Math.PI * 2);
    },
  },
  tabletennis: {
    grass: ['#56902f', '#6a9c3b', '#466f24', '#7aa944', '#3d6a22'],
    async paint(g, { W, L, pave, speckle, rand }) {
      box(g, -pave, -pave, W + pave, L + pave, '#b9b7ab');
      await speckle(-pave, -pave, W + pave, L + pave, ['#a9a79b', '#c8c6ba', '#9d9b8f', '#b0b3a3'], 240);
      for (let i = 0; i < 10; i += 1) {
        let x = lerp(-pave, W + pave, rand());
        let y = lerp(-pave, L + pave, rand());
        const pts = [[x, y]];
        for (let k = 0; k < 6; k += 1) {
          x += (rand() - 0.5) * 0.9;
          y += (rand() - 0.5) * 0.9;
          pts.push([x, y]);
        }
        line(g, 0.04, 'rgba(130, 128, 116, 0.55)', pts);
      }
      // Scuffed footwork patches behind each end.
      await speckle(-0.6, -1.6, W + 0.6, -0.2, ['#a3a195', '#9b998d'], 260);
      await speckle(-0.6, L + 0.2, W + 0.6, L + 1.6, ['#a3a195', '#9b998d'], 260);
    },
  },
  diving: { grass: ['#56902f', '#6a9c3b', '#466f24', '#7aa944', '#3d6a22'], paint: paintDeck },
  gaming: {
    async paint(g, { W, L, speckle, rand }) {
      // Oak planks running across the room, with staggered end joints.
      const oak = ['#b9875a', '#c4925f', '#ad7c50', '#bf8c5c', '#b3825a'];
      for (let y = 0, row = 0; y < L; y += 0.18, row += 1) {
        let x = -rand() * 1.2;
        while (x < W) {
          const len = 0.9 + rand() * 1.1;
          box(g, Math.max(0, x), y, Math.min(W, x + len), Math.min(L, y + 0.18), oak[(row + Math.round(x * 3)) % oak.length]);
          if (x + len < W) box(g, Math.max(0, x + len - 0.012), y, x + len + 0.012, Math.min(L, y + 0.18), '#7d5636');
          x += len;
        }
        box(g, 0, y - 0.008, W, y + 0.008, '#8a6040');
      }
      await speckle(0, 0, W, L, ['#a07049', '#c99a68', '#9a6a44'], 180);
      // A blue rug with a cream border and a diamond pattern.
      const [rx0, ry0, rx1, ry1] = [1.0, 0.95, 3.75, 3.6];
      box(g, rx0, ry0, rx1, ry1, '#d9c9a8');
      box(g, rx0 + 0.1, ry0 + 0.1, rx1 - 0.1, ry1 - 0.1, '#2e4a6b');
      box(g, rx0 + 0.18, ry0 + 0.18, rx1 - 0.18, ry1 - 0.18, '#35557a');
      g.fillStyle = '#c9b48a';
      for (let x = rx0 + 0.45; x < rx1 - 0.3; x += 0.5) {
        for (let y = ry0 + 0.45; y < ry1 - 0.3; y += 0.5) {
          g.beginPath();
          g.moveTo(x, y - 0.12);
          g.lineTo(x + 0.12, y);
          g.lineTo(x, y + 0.12);
          g.lineTo(x - 0.12, y);
          g.fill();
        }
      }
      await speckle(rx0 + 0.1, ry0 + 0.1, rx1 - 0.1, ry1 - 0.1, ['#294262', '#3c5f86'], 220);
      // Tassels along the short ends.
      g.fillStyle = '#e8dcc0';
      for (let x = rx0; x < rx1; x += 0.06) {
        g.fillRect(x, ry0 - 0.06, 0.02, 0.06);
        g.fillRect(x, ry1, 0.02, 0.06);
      }
    },
  },
};

// ---- Props ----------------------------------------------------------------

const materials = new Map();
const lambert = (color, extra) => {
  const key = `${color}:${extra ? JSON.stringify(extra) : ''}`;
  if (!materials.has(key)) materials.set(key, new MeshLambertMaterial({ color, ...extra }));
  return materials.get(key);
};

function solid(geometry, color, cast = true) {
  const mesh = new Mesh(geometry, typeof color === 'string' ? lambert(color) : color);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

// A box between two ground-plane corners, from z0 to z1.
function block(x0, y0, z0, x1, y1, z1, color, cast = true) {
  const mesh = solid(new BoxGeometry(Math.abs(x1 - x0), z1 - z0, Math.abs(y1 - y0)), color, cast);
  mesh.position.copy(v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
  return mesh;
}

// A thin bar from a to b (world points).
function bar(a, b, radius, color, cast = true) {
  const pa = v3(...a);
  const pb = v3(...b);
  const len = pa.distanceTo(pb);
  const mesh = solid(new CylinderGeometry(radius, radius, len, 6), color, cast);
  mesh.position.copy(pa).add(pb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
  return mesh;
}

// A vertical plane from a to b (ground points), z0 to z1.
function panel(a, b, z0, z1, material) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const mesh = new Mesh(new PlaneGeometry(len, z1 - z0), material);
  mesh.position.copy(v3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (z0 + z1) / 2));
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.receiveShadow = true;
  return mesh;
}

function fence(group, a, b, h) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const posts = Math.max(1, Math.round(len / 2.5));
  for (let i = 0; i <= posts; i += 1) {
    const t = i / posts;
    const x = lerp(a[0], b[0], t);
    const y = lerp(a[1], b[1], t);
    group.add(bar([x, y, 0], [x, y, h + 0.04], 0.04, '#23372b'));
  }
  group.add(bar([a[0], a[1], h], [b[0], b[1], h], 0.03, '#23372b'));
  group.add(
    panel(a, b, 0, h, new MeshLambertMaterial({ color: '#c9d4cc', transparent: true, opacity: 0.4, side: DoubleSide, depthWrite: false })),
  );
}

// A hedge of small leafy clumps along a line, lit softly so it reads as one
// green mass with dithered texture rather than separate balls.
function hedge(group, a, b, height, seed) {
  const rand = seeded(seed);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const count = Math.round(len / 0.12) * 3;
  const mesh = new InstancedMesh(
    new IcosahedronGeometry(1, 0),
    new MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
    count,
  );
  const dummy = new Object3D();
  const greens = ['#6fae45', '#5e9e3c', '#82bf55', '#4e8d33', '#93cc63', '#679f3f'].map((c) => new Color(c));
  for (let i = 0; i < count; i += 1) {
    const t = rand();
    const z = rand() ** 0.8 * height;
    const r = 0.12 + rand() * 0.13;
    dummy.position.copy(v3(lerp(a[0], b[0], t) + (rand() - 0.5) * 0.35, lerp(a[1], b[1], t) + (rand() - 0.5) * 0.35, z));
    dummy.scale.set(r, r * (0.8 + rand() * 0.4), r);
    dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, greens[i % greens.length]);
  }
  mesh.receiveShadow = true;
  group.add(mesh);
}

// A round tree made of the same leafy clumps.
function tree(group, x, y, height, seed) {
  const rand = seeded(seed);
  group.add(block(x - 0.12, y - 0.12, 0, x + 0.12, y + 0.12, height * 0.55, '#6b4a2e'));
  const count = 140;
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshLambertMaterial({ color: '#ffffff', flatShading: true }), count);
  mesh.castShadow = true;
  const dummy = new Object3D();
  const greens = ['#5e9e3c', '#4e8d33', '#73b14b', '#3e7a2b', '#86c05a'].map((c) => new Color(c));
  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    const rr = rand() ** 0.5 * 1.1;
    dummy.position.copy(v3(x + Math.cos(a) * rr, y + Math.sin(a) * rr, height * 0.6 + rand() * height * 0.45 - rr * 0.3));
    dummy.scale.setScalar(0.22 + rand() * 0.18);
    dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, greens[i % greens.length]);
  }
  group.add(mesh);
}

// A slatted bench along y, its backrest on the side away from the court.
function bench(group, x, y, length) {
  const wood = '#a5683d';
  const iron = '#2d3330';
  const bx = x + 0.36;
  group.add(block(x, y, 0.42, x + 0.42, y + length, 0.47, wood));
  group.add(block(bx, y, 0.55, bx + 0.06, y + length, 0.62, wood));
  group.add(block(bx, y, 0.7, bx + 0.06, y + length, 0.77, wood));
  [0.12, length - 0.12].forEach((d) => {
    group.add(block(x + 0.04, y + d - 0.03, 0, x + 0.38, y + d + 0.03, 0.42, iron));
    group.add(block(bx, y + d - 0.03, 0.42, bx + 0.06, y + d + 0.03, 0.8, iron));
  });
}

function bag(group, x, y, color) {
  group.add(block(x, y, 0, x + 0.42, y + 0.55, 0.32, color));
  group.add(bar([x + 0.08, y + 0.1, 0.32], [x + 0.08, y + 0.45, 0.32], 0.02, '#1b1e22'));
}

function chair(group, x, y, color) {
  group.add(block(x - 0.22, y - 0.22, 0.42, x + 0.22, y + 0.22, 0.47, color));
  group.add(block(x + 0.18, y - 0.22, 0.47, x + 0.22, y + 0.22, 0.9, color));
  [-0.18, 0.18].forEach((dx) =>
    [-0.18, 0.18].forEach((dy) => group.add(bar([x + dx, y + dy, 0], [x + dx, y + dy, 0.42], 0.018, '#2d3330'))),
  );
}

// A sun lounger along y, back raised at the far end.
function lounger(group, x, y, color) {
  group.add(block(x - 0.32, y, 0.28, x + 0.32, y + 1.3, 0.34, color));
  const back = block(x - 0.32, y - 0.05, 0.3, x + 0.32, y + 0.55, 0.36, color);
  back.rotation.x = 0.7;
  back.position.copy(v3(x, y - 0.12, 0.5));
  group.add(back);
  [y + 0.1, y + 1.2].forEach((ly) => group.add(block(x - 0.3, ly - 0.03, 0, x + 0.3, ly + 0.03, 0.28, '#d8d8d2')));
}

function umbrella(group, x, y, color) {
  group.add(bar([x, y, 0], [x, y, 2.3], 0.03, '#e8e6df'));
  const canopy = solid(new ConeGeometry(1.25, 0.45, 8, 1, true), lambert(color, { side: DoubleSide }));
  canopy.position.copy(v3(x, y, 2.35));
  group.add(canopy);
  group.add(block(x - 0.25, y - 0.25, 0, x + 0.25, y + 0.25, 0.08, '#8d8f8a'));
}

function lamp(group, x, y, h, toward) {
  group.add(bar([x, y, 0], [x, y, h], 0.07, '#2b3138'));
  const [dx, dy] = toward;
  group.add(bar([x, y, h], [x + dx * 0.9, y + dy * 0.9, h + 0.15], 0.04, '#2b3138'));
  const head = block(x + dx * 0.9 - 0.25, y + dy * 0.9 - 0.15, h - 0.05, x + dx * 0.9 + 0.25, y + dy * 0.9 + 0.15, h + 0.15, '#2b3138');
  group.add(head);
  const glow = new Mesh(new BoxGeometry(0.42, 0.03, 0.22), new MeshBasicMaterial({ color: '#fff4c8' }));
  glow.position.copy(v3(x + dx * 0.9, y + dy * 0.9, h - 0.07));
  group.add(glow);
}

// Bleachers rising away from the court along -x, facing +x.
function stands(group, def) {
  const seats = [];
  for (let k = 0; k < def.rows; k += 1) {
    const x = def.x - k * 0.7;
    const z = 0.45 + k * 0.45;
    group.add(block(x - 0.35, def.y0, z - 0.06, x + 0.05, def.y0 + def.len, z, '#b8c0c6'));
    group.add(block(x - 0.35, def.y0, z - 0.5, x - 0.3, def.y0 + def.len, z - 0.06, '#59626b'));
    group.add(block(x + 0.05, def.y0, z - 0.42, x + 0.35, def.y0 + def.len, z - 0.38, '#8f989f'));
    seats.push({ x: x - 0.12, z, y0: def.y0, len: def.len });
  }
  for (const y of [def.y0, def.y0 + def.len]) {
    group.add(block(def.x - def.rows * 0.7 + 0.2, y - 0.04, 0, def.x + 0.35, y + 0.04, 0.4 + def.rows * 0.45, '#59626b'));
  }
  return seats;
}

// ---- Pools ----------------------------------------------------------------

// Bright wavy light lines, tiled across water and the pool floor.
function causticTexture(seed, alpha) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  const rand = seeded(seed);
  g.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  g.lineWidth = 2;
  for (let i = 0; i < 26; i += 1) {
    const cx = rand() * 128;
    const cy = rand() * 128;
    const r = 8 + rand() * 14;
    g.beginPath();
    for (let k = 0; k <= 12; k += 1) {
      const a = (k / 12) * Math.PI * 2;
      const rr = r * (0.75 + rand() * 0.45);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (k) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.stroke();
  }
  const texture = crisp(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

function pool(ctx, W, L, depth) {
  const { group } = ctx;
  // Floor and walls: pale tiles.
  const { canvas, g } = metreCanvas(0, 0, W, L, 1024);
  tiles(g, 0, 0, W, L, '#9fdcea', '#86cadc', 0.5);
  // A diving well: a dark target line under the platform.
  box(g, W * 0.72 - 0.13, 1.5, W * 0.72 + 0.13, L - 2, '#24508c');
  const floorMat = new MeshLambertMaterial({ map: crisp(canvas) });
  const floor = new Mesh(new PlaneGeometry(W, L), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.copy(v3(W / 2, L / 2, -depth));
  floor.receiveShadow = true;
  group.add(floor);
  const wallMat = lambert('#8ccfe0', { side: DoubleSide });
  group.add(panel([0, 0], [W, 0], -depth, 0, wallMat));
  group.add(panel([0, 0], [0, L], -depth, 0, wallMat));
  group.add(panel([0, L], [W, L], -depth, 0, wallMat));
  group.add(panel([W, 0], [W, L], -depth, 0, wallMat));
  // Coping stones around the rim.
  const stone = '#efece4';
  group.add(block(-0.3, -0.3, -0.02, W + 0.3, 0, 0.04, stone));
  group.add(block(-0.3, L, -0.02, W + 0.3, L + 0.3, 0.04, stone));
  group.add(block(-0.3, 0, -0.02, 0, L, 0.04, stone));
  group.add(block(W, 0, -0.02, W + 0.3, L, 0.04, stone));
  // Light on the floor, then the water, then light on the water.
  const floorLight = causticTexture(7, 0.55);
  floorLight.repeat.set(W / 3, L / 3);
  const floorGlow = new Mesh(new PlaneGeometry(W, L), new MeshBasicMaterial({ map: floorLight, transparent: true, depthWrite: false }));
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.copy(v3(W / 2, L / 2, -depth + 0.01));
  group.add(floorGlow);
  const water = new Mesh(
    new PlaneGeometry(W, L),
    new MeshLambertMaterial({ color: '#3aa7da', transparent: true, opacity: 0.56, depthWrite: false }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.copy(v3(W / 2, L / 2, WATER));
  group.add(water);
  const surfaceLight = causticTexture(19, 0.45);
  surfaceLight.repeat.set(W / 2.2, L / 2.2);
  const glint = new Mesh(new PlaneGeometry(W, L), new MeshBasicMaterial({ map: surfaceLight, transparent: true, depthWrite: false, opacity: 0.6 }));
  glint.rotation.x = -Math.PI / 2;
  glint.position.copy(v3(W / 2, L / 2, WATER + 0.004));
  group.add(glint);
  ctx.animate((time) => {
    floorLight.offset.set(Math.sin(time * 0.35) * 0.08, time * 0.02);
    surfaceLight.offset.set(time * 0.03, Math.cos(time * 0.3) * 0.06);
  });
}

// ---- Effects --------------------------------------------------------------

// Splash droplets: small white chips with gravity, dying when they fall back.
function makeSplashes(scene) {
  const N = 320;
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshLambertMaterial({ color: '#f4fbff' }), N);
  mesh.frustumCulled = false;
  const dummy = new Object3D();
  const drops = Array.from({ length: N }, () => ({ life: 0 }));
  let next = 0;
  const hide = () => {
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
  };
  hide();
  for (let i = 0; i < N; i += 1) mesh.setMatrixAt(i, dummy.matrix);
  scene.add(mesh);
  const rand = seeded(5);
  return {
    emit(x, y, n, power) {
      for (let k = 0; k < n; k += 1) {
        const d = drops[next];
        next = (next + 1) % N;
        const a = rand() * Math.PI * 2;
        const out = power * (0.15 + rand() * 0.45);
        Object.assign(d, {
          x: x + Math.cos(a) * 0.15,
          y: y + Math.sin(a) * 0.15,
          z: WATER + 0.05,
          vx: Math.cos(a) * out,
          vy: Math.sin(a) * out,
          vz: power * (0.8 + rand() * 1.1),
          size: 0.04 + rand() * 0.05,
          life: 1,
        });
      }
    },
    update(dt) {
      drops.forEach((d, i) => {
        if (d.life <= 0) return;
        d.vz -= 9.8 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.z += d.vz * dt;
        d.life -= dt * 0.8;
        if (d.z < WATER && d.vz < 0) d.life = 0;
        if (d.life <= 0) hide();
        else {
          dummy.position.copy(v3(d.x, d.y, d.z));
          dummy.scale.setScalar(d.size);
          dummy.updateMatrix();
        }
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// Expanding rings on the water.
function makeRipples(scene) {
  const rings = Array.from({ length: 12 }, () => {
    const mesh = new Mesh(
      new RingGeometry(0.92, 1, 28),
      new MeshBasicMaterial({ color: '#f2fbff', transparent: true, opacity: 0, depthWrite: false, side: DoubleSide }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, age: 0, delay: 0 };
  });
  let next = 0;
  return {
    emit(x, y) {
      for (let k = 0; k < 3; k += 1) {
        const r = rings[next];
        next = (next + 1) % rings.length;
        r.mesh.position.copy(v3(x, y, WATER + 0.008));
        r.age = 0;
        r.delay = k * 0.25;
        r.mesh.visible = true;
      }
    },
    update(dt) {
      rings.forEach((r) => {
        if (!r.mesh.visible) return;
        r.age += dt;
        const t = (r.age - r.delay) / 1.8;
        if (t < 0) {
          r.mesh.material.opacity = 0;
          return;
        }
        if (t >= 1) {
          r.mesh.visible = false;
          return;
        }
        r.mesh.scale.setScalar(0.25 + t * 2.4);
        r.mesh.material.opacity = 0.7 * (1 - t);
      });
    },
  };
}

// ---- Scenes ---------------------------------------------------------------

function muralTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 260;
  const g = canvas.getContext('2d');
  // Brick under the paint.
  g.fillStyle = '#93473a';
  g.fillRect(0, 0, 1536, 260);
  g.fillStyle = '#7d3b30';
  for (let y = 0; y < 260; y += 16) {
    g.fillRect(0, y, 1536, 2);
    for (let x = (y / 16) % 2 ? 0 : 24; x < 1536; x += 48) g.fillRect(x, y, 2, 16);
  }
  // Paint: a sunset band, a big ball, and the name.
  const sky = g.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#f2a93b');
  sky.addColorStop(0.55, '#e2553a');
  sky.addColorStop(1, '#6b2f7a');
  g.fillStyle = sky;
  g.beginPath();
  g.roundRect(180, 26, 1176, 208, 30);
  g.fill();
  g.fillStyle = '#ffd36a';
  g.beginPath();
  g.arc(1130, 150, 74, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2bb3a1';
  for (let i = 0; i < 4; i += 1) {
    g.beginPath();
    g.moveTo(180, 190 + i * 12);
    for (let x = 180; x <= 1356; x += 24) g.lineTo(x, 190 + i * 12 + Math.sin(x / 40 + i) * 6);
    g.lineTo(1356, 240);
    g.lineTo(180, 240);
    g.fill();
  }
  g.fillStyle = '#e8742c';
  g.beginPath();
  g.arc(360, 128, 76, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#2a1a12';
  g.lineWidth = 7;
  g.beginPath();
  g.arc(360, 128, 76, 0, Math.PI * 2);
  g.moveTo(284, 128);
  g.lineTo(436, 128);
  g.moveTo(360, 52);
  g.lineTo(360, 204);
  g.stroke();
  g.beginPath();
  g.arc(282, 128, 62, -0.9, 0.9);
  g.stroke();
  g.beginPath();
  g.arc(438, 128, 62, Math.PI - 0.9, Math.PI + 0.9);
  g.stroke();
  g.font = '900 96px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 12;
  g.strokeStyle = '#1c1430';
  g.strokeText('TINY COURTS', 780, 120);
  g.fillStyle = '#fff4dc';
  g.fillText('TINY COURTS', 780, 120);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}

const PROPS = {
  basketball(ctx) {
    const { group, sport } = ctx;
    const [W, L] = sport.court;
    const hx = W / 2;
    const hy = 1.575;
    const e = sport.pave;
    // A painted wall behind the hoop.
    const mural = muralTexture();
    const brick = lambert('#8b4437');
    const wall = new Mesh(new BoxGeometry(W + 2 * e, 3.2, 0.3), [brick, brick, brick, brick, new MeshLambertMaterial({ map: mural }), brick]);
    wall.position.copy(v3(W / 2, -e - 0.05, 1.6));
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    lamp(group, -e + 0.3, -e + 0.6, 5, [0.7, 0.7]);
    lamp(group, W + e - 0.3, -e + 0.6, 5, [-0.7, 0.7]);
    // The hoop on a pole, with a rim that shakes and a net that swishes.
    const navy = '#1e2736';
    group.add(block(hx - 0.08, -1.05, 0, hx + 0.08, -0.89, 3.35, navy));
    group.add(block(hx - 0.06, -1.0, 3.12, hx + 0.06, 1.1, 3.24, navy));
    const hoop = new Group();
    hoop.position.copy(v3(hx, 1.1, 3.2));
    group.add(hoop);
    const local = (mesh) => {
      mesh.position.sub(v3(hx, 1.1, 3.2));
      hoop.add(mesh);
    };
    local(block(hx - 0.9, 1.1, 2.9, hx + 0.9, 1.16, 3.95, '#f3f0e8'));
    const red = '#d6402c';
    local(block(hx - 0.3, 1.16, 3.05, hx - 0.26, 1.18, 3.5, red, false));
    local(block(hx + 0.26, 1.16, 3.05, hx + 0.3, 1.18, 3.5, red, false));
    local(block(hx - 0.3, 1.16, 3.46, hx + 0.3, 1.18, 3.5, red, false));
    local(block(hx - 0.9, 1.16, 3.91, hx + 0.9, 1.18, 3.95, red, false));
    const rim = solid(new TorusGeometry(0.23, 0.022, 6, 18), '#e2552b');
    rim.rotation.x = Math.PI / 2;
    rim.position.copy(v3(hx, hy, 3.05));
    local(rim);
    const net = new Mesh(
      new CylinderGeometry(0.23, 0.15, 0.42, 12, 1, true),
      new MeshBasicMaterial({ color: '#f4f4ef', transparent: true, opacity: 0.55, side: DoubleSide, depthWrite: false }),
    );
    net.position.copy(v3(hx, hy, 2.84));
    local(net);
    let shake = 0;
    let swish = -9;
    ctx.on('rim', (fx) => {
      shake = Math.max(shake, fx.power);
    });
    ctx.on('swish', () => {
      swish = ctx.time();
    });
    ctx.animate((time, dt) => {
      shake *= Math.exp(-dt * 5);
      hoop.rotation.x = Math.sin(time * 40) * 0.05 * shake;
      const t = time - swish;
      const pulse = t >= 0 && t < 0.6 ? Math.sin(t * 22) * Math.exp(-t * 5) : 0;
      net.scale.set(1 - pulse * 0.25, 1 + pulse * 0.35, 1 - pulse * 0.25);
    });
    bag(group, W + 0.6, -0.9, '#2b5fb0');
    bench(group, W + 1.0, 3.2, 1.8);
    return stands(group, sport.stands);
  },
  tabletennis(ctx) {
    const { group, sport } = ctx;
    const [W, L] = sport.court;
    const e = sport.pave - 0.12;
    fence(group, [-e, L + e], [-e, -e], sport.fence);
    fence(group, [-e, -e], [W + e, -e], sport.fence);
    hedge(group, [-e - 0.45, L + e], [-e - 0.45, -e - 0.45], 1.4, 3);
    hedge(group, [-e - 0.45, -e - 0.45], [W + e, -e - 0.45], 1.4, 4);
    tree(group, -e - 1.0, L + e - 0.6, 3.6, 8);
    // The table: blue top, white lines, a net and a grey frame.
    const H = 0.76;
    group.add(block(0, 0, H - 0.04, W, L, H, '#1f5e9e'));
    const white = '#f1f1ec';
    group.add(block(0, 0, H, W, 0.02, H + 0.002, white, false));
    group.add(block(0, L - 0.02, H, W, L, H + 0.002, white, false));
    group.add(block(0, 0, H, 0.02, L, H + 0.002, white, false));
    group.add(block(W - 0.02, 0, H, W, L, H + 0.002, white, false));
    group.add(block(W / 2 - 0.0015, 0, H, W / 2 + 0.0015, L, H + 0.002, white, false));
    [0.15, L - 0.15].forEach((y) => {
      [0.12, W - 0.12].forEach((x) => group.add(block(x - 0.03, y - 0.03, 0, x + 0.03, y + 0.03, H - 0.04, '#3c4148')));
      group.add(block(0.12, y - 0.02, 0.15, W - 0.12, y + 0.02, 0.19, '#3c4148'));
    });
    const net = new Mesh(
      new PlaneGeometry(W + 0.3, 0.1525),
      new MeshLambertMaterial({ color: '#1c2523', transparent: true, opacity: 0.65, side: DoubleSide, depthWrite: false }),
    );
    net.position.copy(v3(W / 2, L / 2, H + 0.076));
    group.add(net);
    group.add(block(-0.15, L / 2 - 0.006, H + 0.14, W + 0.15, L / 2 + 0.006, H + 0.155, white));
    group.add(bar([-0.15, L / 2, H], [-0.15, L / 2, H + 0.155], 0.012, '#2b3138'));
    group.add(bar([W + 0.15, L / 2, H], [W + 0.15, L / 2, H + 0.155], 0.012, '#2b3138'));
    bench(group, W + 2.0, L / 2 - 0.9, 1.8);
    bag(group, W + 1.95, L / 2 + 1.2, '#c8312b');
    return [];
  },
  diving(ctx) {
    const { group, sport } = ctx;
    const [W, L] = sport.court;
    pool(ctx, W, L, sport.pool.depth);
    const e = sport.pave - 0.12;
    hedge(group, [-e - 0.45, L + e], [-e - 0.45, -e - 0.45], 1.6, 5);
    hedge(group, [-e - 0.45, -e - 0.45], [W + e, -e - 0.45], 1.6, 6);
    tree(group, -e - 1.0, -e - 0.9, 4.2, 11);
    // The 5 m platform: two concrete legs, a slab over the water, rails, a ladder.
    const concrete = '#d7d2c6';
    const tx = 7.2;
    group.add(block(tx - 0.9, -2.5, 0, tx - 0.55, -1.9, 4.8, concrete));
    group.add(block(tx + 0.55, -2.5, 0, tx + 0.9, -1.9, 4.8, concrete));
    group.add(block(tx - 1.0, -2.6, 4.8, tx + 1.0, 1.0, 5.0, concrete));
    group.add(block(tx - 1.0, 0.3, 5.0, tx + 1.0, 1.0, 5.01, '#2f6fb8', false));
    [tx - 0.97, tx + 0.97].forEach((x) => {
      group.add(bar([x, -2.55, 5], [x, -2.55, 6], 0.025, '#d9dde0'));
      group.add(bar([x, 0.2, 5], [x, 0.2, 6], 0.025, '#d9dde0'));
      group.add(bar([x, -2.55, 6], [x, 0.2, 6], 0.025, '#d9dde0'));
    });
    [tx - 0.2, tx + 0.2].forEach((x) => group.add(bar([x, -2.75, 0], [x, -2.75, 5.9], 0.025, '#d9dde0')));
    for (let z = 0.3; z < 5; z += 0.32) group.add(bar([tx - 0.2, -2.75, z], [tx + 0.2, -2.75, z], 0.015, '#d9dde0'));
    // The 1 m springboard, whose tip dips with the bounce.
    const bx = 2.6;
    group.add(block(bx - 0.35, -1.9, 0, bx + 0.35, -0.6, 0.9, '#cfc9bc'));
    group.add(block(bx - 0.26, -1.9, 0.9, bx + 0.26, -0.4, 0.96, '#2f6fb8'));
    const tip = new Group();
    tip.position.copy(v3(bx, -0.4, 0.93));
    group.add(tip);
    const flex = block(bx - 0.26, -0.4, 0.9, bx + 0.26, 1.3, 0.96, '#2f6fb8');
    flex.position.sub(v3(bx, -0.4, 0.93));
    tip.add(flex);
    for (let k = 0; k < 3; k += 1) group.add(block(bx - 0.3, -2.3 + k * 0.14, 0, bx + 0.3, -1.9, 0.3 + k * 0.3, '#cfc9bc'));
    ctx.animate((time, dt, sim) => {
      tip.rotation.x = (sim.boardFlex ?? 0) * 0.1;
    });
    // Exit ladder on the right wall.
    [7.2, 7.8].forEach((y) => {
      group.add(bar([W - 0.15, y, -1.2], [W - 0.15, y, 0.7], 0.025, '#d9dde0'));
      group.add(bar([W - 0.15, y, 0.7], [W + 0.25, y, 0.7], 0.025, '#d9dde0'));
      group.add(bar([W + 0.25, y, 0.7], [W + 0.25, y, 0], 0.025, '#d9dde0'));
    });
    // Lifeguard chair, judges, and somewhere to lie in the sun.
    const lg = { x: -1.9, y: 5 };
    [-0.3, 0.3].forEach((dy) => {
      group.add(bar([lg.x - 0.4, lg.y + dy, 0], [lg.x + 0.05, lg.y + dy, 1.85], 0.035, '#f2f0ea'));
      group.add(bar([lg.x + 0.4, lg.y + dy, 0], [lg.x - 0.05, lg.y + dy, 1.85], 0.035, '#f2f0ea'));
    });
    group.add(block(lg.x - 0.3, lg.y - 0.35, 1.85, lg.x + 0.25, lg.y + 0.35, 1.92, '#f2f0ea'));
    group.add(block(lg.x - 0.32, lg.y - 0.35, 1.92, lg.x - 0.26, lg.y + 0.35, 2.4, '#f2f0ea'));
    umbrella(group, -2.0, 9.6, '#e2553a');
    lounger(group, -2.0, 10.4, '#f2f0ea');
    lounger(group, W + 1.9, 10.2, '#f2c14e');
    group.add(block(W + 1.15, 1.6, 0, W + 1.65, 4.4, 0.75, '#2f6fb8'));
    [2.0, 3.0, 4.0].forEach((y) => chair(group, W + 2.25, y, '#f2f0ea'));
    return [];
  },
  gaming: gamingRoom,
};

// ---- The gaming room ------------------------------------------------------

// A canvas texture for a flat face, painted in metres.
function faceTexture(w, h, paint, maxPx = 512) {
  const { canvas, g } = metreCanvas(0, 0, w, h, maxPx, 200);
  paint(g, speckler(g, seeded(Math.round(w * 97 + h * 13))));
  return crisp(canvas);
}

function wallpaper(len) {
  return faceTexture(len, 2.9, (g, speckle) => {
    box(g, 0, 0, len, 2.9, '#5d6f73');
    g.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 0; x < len; x += 0.24) g.fillRect(x, 0, 0.1, 2.9);
    // No yield budget here, so this runs to the end synchronously.
    speckle(0, 0, len, 2.9, ['#58696d', '#64777b'], 160);
    // The lower 0.3 m is the floor slab's cut edge, below the room.
    box(g, 0, 2.6, len, 2.9, '#5a3e2b');
  });
}

// The TV game: a side-scrolling runner drawn each frame from the sim's state.
const SKIES = [
  ['#5fb6ff', '#bfe6ff', '#4e8f5a', '#6fae5a'],
  ['#ff8f6b', '#ffd59a', '#7a4a6b', '#a3607a'],
  ['#1d2a5c', '#5a4f9c', '#2b3a6b', '#3f5a8c'],
];

function drawGame(c, game, time) {
  const W = 192;
  const H = 108;
  const g = game;
  const [skyTop, skyLow, far, near] = SKIES[(g.level - 1) % SKIES.length];
  const sky = c.createLinearGradient(0, 0, 0, 86);
  sky.addColorStop(0, skyTop);
  sky.addColorStop(1, skyLow);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff3c4';
  c.beginPath();
  c.arc(150, 24, 9, 0, Math.PI * 2);
  c.fill();
  const hills = (color, speed, amp, base, wave) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) c.lineTo(x, base - Math.abs(Math.sin((x + g.dist * speed) / wave)) * amp);
    c.lineTo(W, H);
    c.fill();
  };
  hills(far, 2, 22, 78, 31);
  hills(near, 6, 12, 86, 17);
  // Ground tiles scroll at the runner's speed.
  const unit = 16;
  c.fillStyle = '#8a5a34';
  c.fillRect(0, 86, W, H - 86);
  c.fillStyle = '#5fbf4a';
  c.fillRect(0, 86, W, 4);
  c.fillStyle = '#6e4628';
  const off = (g.dist * unit) % 16;
  for (let x = -off; x < W; x += 16) c.fillRect(Math.round(x), 92, 8, 4);
  const sx = (d) => Math.round(40 + (d - g.dist) * unit);
  for (const o of g.obstacles) {
    const x = sx(o.d);
    const h = o.tall ? 20 : 12;
    c.fillStyle = '#b7793d';
    c.fillRect(x - 6, 86 - h, 12, h);
    c.strokeStyle = '#5c3a1c';
    c.strokeRect(x - 5.5, 86.5 - h, 11, h - 1);
    c.beginPath();
    c.moveTo(x - 5, 86 - h + 1);
    c.lineTo(x + 5, 85);
    c.stroke();
  }
  for (const coin of g.coins) {
    const x = sx(coin.d);
    const y = 86 - coin.h * unit;
    c.fillStyle = Math.sin(time * 10 + coin.d) > 0 ? '#ffd23f' : '#ffb000';
    c.fillRect(x - 2, Math.round(y) - 3, Math.sin(time * 8 + coin.d) > 0 ? 5 : 3, 6);
  }
  // The runner: a little red-capped hero, legs flicking while it runs.
  const ry = Math.round(86 - g.y * unit);
  const ko = g.state === 'ko';
  if (!ko || Math.floor(time * 12) % 2) {
    const step = g.y > 0 ? 0 : Math.floor(time * 14) % 2;
    c.fillStyle = '#d93a2c';
    c.fillRect(35, ry - 16, 9, 4);
    c.fillStyle = '#f1c7a0';
    c.fillRect(36, ry - 12, 7, 4);
    c.fillStyle = '#2a5bd7';
    c.fillRect(35, ry - 8, 9, 5);
    c.fillStyle = '#3b2a20';
    c.fillRect(35 + step * 2, ry - 3, 3, 3);
    c.fillRect(41 - step * 2, ry - 3, 3, 3);
  }
  // On-screen HUD.
  c.font = 'bold 8px monospace';
  c.textBaseline = 'top';
  c.fillStyle = 'rgba(0, 0, 0, 0.35)';
  c.fillRect(0, 0, W, 12);
  c.fillStyle = '#ffffff';
  c.fillText(`SCORE ${String(g.score).padStart(6, '0')}`, 4, 2);
  c.fillText(`LV ${g.level}`, 96, 2);
  for (let i = 0; i < 3; i += 1) {
    c.fillStyle = i < g.lives ? '#ff4d6d' : 'rgba(255, 255, 255, 0.3)';
    c.fillRect(160 + i * 9, 3, 6, 6);
  }
  if (g.state === 'clear' || ko) {
    c.fillStyle = ko ? 'rgba(160, 20, 30, 0.45)' : 'rgba(0, 0, 0, 0.35)';
    c.fillRect(0, 38, W, 30);
    c.font = 'bold 16px monospace';
    c.textAlign = 'center';
    c.fillStyle = ko ? '#ffd0d0' : '#ffe36a';
    c.fillText(ko ? 'K.O.' : 'LEVEL CLEAR', W / 2, 45);
    c.textAlign = 'left';
  }
}

function posterTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 160;
  const c = canvas.getContext('2d');
  if (kind === 0) {
    const sky = c.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, '#2b1d4f');
    sky.addColorStop(0.6, '#e2553a');
    sky.addColorStop(1, '#f2c14e');
    c.fillStyle = sky;
    c.fillRect(0, 0, 120, 160);
    c.fillStyle = '#ffe9a8';
    c.beginPath();
    c.arc(60, 92, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1c1430';
    c.beginPath();
    c.moveTo(0, 160);
    c.lineTo(0, 110);
    c.lineTo(30, 86);
    c.lineTo(52, 108);
    c.lineTo(80, 78);
    c.lineTo(120, 112);
    c.lineTo(120, 160);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = 'bold 15px monospace';
    c.textAlign = 'center';
    c.fillText('PRESS START', 60, 30);
  } else {
    c.fillStyle = '#1f2a3a';
    c.fillRect(0, 0, 120, 160);
    ['#2bb3a1', '#e86aa6', '#f2c14e', '#4aa8ff'].forEach((color, i) => {
      c.strokeStyle = color;
      c.lineWidth = 6;
      c.beginPath();
      if (i === 0) c.arc(30, 50, 14, 0, Math.PI * 2);
      if (i === 1) {
        c.moveTo(78, 36);
        c.lineTo(96, 64);
        c.lineTo(60, 64);
        c.closePath();
      }
      if (i === 2) c.rect(18, 88, 26, 26);
      if (i === 3) {
        c.moveTo(66, 88);
        c.lineTo(94, 116);
        c.moveTo(94, 88);
        c.lineTo(66, 116);
      }
      c.stroke();
    });
    c.fillStyle = '#ffffff';
    c.font = 'bold 13px monospace';
    c.textAlign = 'center';
    c.fillText('LEVEL UP', 60, 146);
  }
  return crisp(canvas);
}

function skyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const c = canvas.getContext('2d');
  const sky = c.createLinearGradient(0, 0, 0, 96);
  sky.addColorStop(0, '#79bdf2');
  sky.addColorStop(1, '#d6ecfa');
  c.fillStyle = sky;
  c.fillRect(0, 0, 96, 96);
  c.fillStyle = 'rgba(255, 255, 255, 0.9)';
  [[20, 22, 10], [32, 18, 12], [44, 24, 9], [70, 34, 8], [80, 30, 10]].forEach(([x, y, r]) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  });
  // Rooftops across the street.
  c.fillStyle = '#9aa6b2';
  [[0, 62, 22], [24, 54, 18], [44, 66, 26], [72, 50, 24]].forEach(([x, y, w]) => c.fillRect(x, y, w, 96 - y));
  c.fillStyle = '#c7d0d8';
  for (let x = 4; x < 96; x += 8) for (let y = 58; y < 92; y += 9) c.fillRect(x, y, 3, 4);
  return crisp(canvas);
}

// A face plane on a wall: along x on the y = 0 wall, or along y on the x = 0 wall.
function wallPlane(onX, a0, a1, z0, z1, material, out = 0.012) {
  const mesh = new Mesh(new PlaneGeometry(a1 - a0, z1 - z0), material);
  if (onX) {
    mesh.position.copy(v3(out, (a0 + a1) / 2, (z0 + z1) / 2));
    mesh.rotation.y = Math.PI / 2;
  } else mesh.position.copy(v3((a0 + a1) / 2, out, (z0 + z1) / 2));
  return mesh;
}

function controllerMesh(color = '#f3f3f1') {
  const pad = new Group();
  pad.add(solid(new BoxGeometry(0.16, 0.065, 0.034), color));
  [-1, 1].forEach((side) => {
    const grip = solid(new CapsuleGeometry(0.022, 0.06, 3, 10), color);
    grip.position.set(side * 0.066, 0.045, -0.004);
    grip.rotation.z = side * 0.35;
    pad.add(grip);
  });
  const plate = solid(new BoxGeometry(0.1, 0.05, 0.006), '#1d1e22');
  plate.position.z = 0.017;
  pad.add(plate);
  const touch = solid(new BoxGeometry(0.06, 0.03, 0.006), '#e6e6e3');
  touch.position.set(0, -0.012, 0.019);
  pad.add(touch);
  const light = new Mesh(new BoxGeometry(0.06, 0.004, 0.004), new MeshBasicMaterial({ color: '#4aa8ff' }));
  light.position.set(0, -0.03, 0.02);
  pad.add(light);
  [-1, 1].forEach((side) => {
    const stick = solid(new CylinderGeometry(0.009, 0.009, 0.012, 8), '#2a2b2f');
    stick.rotation.x = Math.PI / 2;
    stick.position.set(side * 0.03, 0.016, 0.024);
    pad.add(stick);
  });
  return pad;
}

function gamingRoom(ctx) {
  const { group, sport } = ctx;
  const [W, L] = sport.court;
  // The floor's slab and the two cutaway walls; their top edges are the cut.
  group.add(block(-0.15, -0.15, -0.3, W, L, -0.003, '#5a3e2b'));
  const cut = lambert('#ece7dd');
  const outer = lambert('#c9c2b5');
  const wallX = new Mesh(new BoxGeometry(0.15, 2.9, L + 0.15), [new MeshLambertMaterial({ map: wallpaper(L + 0.15) }), outer, cut, outer, outer, outer]);
  wallX.position.copy(v3(-0.075, (L - 0.15) / 2, 1.15));
  const wallY = new Mesh(new BoxGeometry(W, 2.9, 0.15), [outer, outer, cut, outer, new MeshLambertMaterial({ map: wallpaper(W) }), outer]);
  wallY.position.copy(v3(W / 2, -0.075, 1.15));
  [wallX, wallY].forEach((wall) => {
    wall.receiveShadow = true;
    wall.castShadow = true;
    group.add(wall);
  });
  const white = '#f1eee6';
  group.add(block(0, 0, 0, 0.03, L, 0.1, white));
  group.add(block(0, 0, 0, W, 0.03, 0.1, white));
  // A purple LED strip along the top of the TV wall.
  const led = new Mesh(new BoxGeometry(0.02, 0.025, L), new MeshBasicMaterial({ color: '#a47bff' }));
  led.position.copy(v3(0.012, L / 2, 2.52));
  group.add(led);

  // The TV, its screen running the game, and a glow behind it.
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 192;
  screenCanvas.height = 108;
  const screen2d = screenCanvas.getContext('2d');
  const screenTex = crisp(screenCanvas);
  group.add(wallPlane(true, 1.3, 3.0, 0.75, 1.95, new MeshBasicMaterial({ color: '#6a4cff', transparent: true, opacity: 0.16, depthWrite: false }), 0.006));
  group.add(block(0.02, 1.52, 1.03, 0.08, 2.78, 1.77, '#121316'));
  group.add(wallPlane(true, 1.56, 2.74, 1.07, 1.73, new MeshBasicMaterial({ map: screenTex }), 0.082));
  const tvLight = new PointLight('#8fb8ff', 1.6, 3.4, 1.6);
  tvLight.position.copy(v3(0.6, 2.15, 1.4));
  group.add(tvLight);

  // Media console: two doors, a soundbar, the console standing up, games.
  const wood = '#7d5236';
  group.add(block(0, 1.2, 0.08, 0.46, 3.1, 0.52, wood));
  group.add(block(0.461, 1.22, 0.1, 0.465, 2.14, 0.5, '#6a4430', false));
  group.add(block(0.461, 2.16, 0.1, 0.465, 3.08, 0.5, '#6a4430', false));
  [1.95, 2.35].forEach((y) => group.add(block(0.465, y - 0.04, 0.3, 0.48, y + 0.04, 0.32, '#c9c2b5', false)));
  [1.25, 3.05].forEach((y) => [0.05, 0.41].forEach((x) => group.add(block(x - 0.02, y - 0.02, 0, x + 0.02, y + 0.02, 0.08, '#2d3330'))));
  group.add(block(0.12, 1.75, 0.52, 0.22, 2.55, 0.6, '#1c1d20'));
  const ps = { x0: 0.1, x1: 0.4, y: 2.86, z0: 0.53 };
  group.add(block(ps.x0 + 0.03, ps.y - 0.045, ps.z0, ps.x1 - 0.03, ps.y + 0.045, ps.z0 + 0.38, '#17181b'));
  [-1, 1].forEach((side) => {
    const shell = block(ps.x0, ps.y + side * 0.045, ps.z0 - 0.005, ps.x1, ps.y + side * 0.06, ps.z0 + 0.4, '#f5f5f3');
    group.add(shell);
  });
  const glow = new Mesh(new BoxGeometry(0.26, 0.012, 0.004), new MeshBasicMaterial({ color: '#4aa8ff' }));
  glow.position.copy(v3((ps.x0 + ps.x1) / 2, ps.y + 0.062, ps.z0 + 0.39));
  glow.rotation.x = Math.PI / 2;
  group.add(glow);
  group.add(block(ps.x0 + 0.08, ps.y - 0.09, ps.z0 - 0.02, ps.x1 - 0.08, ps.y + 0.09, ps.z0, '#1c1d20'));
  ['#1d4fa8', '#1d4fa8', '#c8312b', '#1d4fa8', '#2b2c30'].forEach((color, i) => {
    group.add(block(0.12, 1.32, 0.52 + i * 0.018, 0.3, 1.5, 0.535 + i * 0.018, color));
  });
  const pad = controllerMesh('#1d1e22');
  pad.position.copy(v3(0.3, 1.62, 0.56));
  pad.rotation.x = -Math.PI / 2;
  group.add(pad);
  // Speakers either side, with cones facing the room.
  [0.85, 3.35].forEach((y) => {
    group.add(block(0.04, y - 0.13, 0, 0.3, y + 0.13, 1.05, '#1f2024'));
    [0.32, 0.72].forEach((z, k) => {
      const cone = solid(new CylinderGeometry(k ? 0.05 : 0.085, k ? 0.05 : 0.085, 0.02, 16), '#3a3b40');
      cone.rotation.z = Math.PI / 2;
      cone.position.copy(v3(0.305, y, z));
      group.add(cone);
    });
  });

  // A shelf over the speakers with books, a figure and a small plant.
  group.add(block(0, 3.3, 1.5, 0.26, 4.45, 1.53, '#c79a62'));
  [3.45, 4.3].forEach((y) => group.add(block(0, y - 0.015, 1.38, 0.2, y + 0.015, 1.5, '#2d3330')));
  ['#c8312b', '#2a62c4', '#f2c14e', '#3fb37f', '#e9e4da', '#8a5cc8'].forEach((color, i) => {
    const h = 0.18 + (i % 3) * 0.04;
    group.add(block(0.04, 3.36 + i * 0.055, 1.53, 0.22, 3.405 + i * 0.055, 1.53 + h, color));
  });
  const figure = solid(new SphereGeometry(0.05, 12, 10), '#e2553a');
  figure.position.copy(v3(0.13, 3.95, 1.62));
  group.add(figure);
  const figHead = solid(new SphereGeometry(0.035, 12, 10), '#f1c7a0');
  figHead.position.copy(v3(0.13, 3.95, 1.71));
  group.add(figHead);
  group.add(block(0.07, 4.15, 1.53, 0.19, 4.27, 1.63, '#c4673e'));
  hedgeClump(group, 0.13, 4.21, 1.68, 0.12, 14, 31);

  // Window with blinds and a city view.
  const sky = skyTexture();
  group.add(wallPlane(false, 0.95, 2.15, 1.0, 2.15, new MeshBasicMaterial({ map: sky }), 0.004));
  group.add(block(0.9, 0, 0.95, 2.2, 0.06, 1.0, white));
  group.add(block(0.9, 0, 2.15, 2.2, 0.05, 2.2, white));
  group.add(block(0.9, 0, 0.95, 0.95, 0.05, 2.2, white));
  group.add(block(2.15, 0, 0.95, 2.2, 0.05, 2.2, white));
  group.add(block(1.53, 0, 1.0, 1.57, 0.04, 2.15, white));
  group.add(block(0.85, 0, 0.92, 2.25, 0.14, 0.96, white));
  for (let z = 1.72; z < 2.14; z += 0.06) group.add(block(0.95, 0.05, z, 2.15, 0.07, z + 0.03, '#f4f1ea', false));

  // Posters in black frames, and a ticking clock.
  [
    [2.65, 3.3, 0],
    [3.6, 4.25, 1],
  ].forEach(([a0, a1, kind]) => {
    group.add(block(a0 - 0.03, 0, 1.32, a1 + 0.03, 0.03, 2.2, '#1b1c1f'));
    group.add(wallPlane(false, a0, a1, 1.36, 2.16, new MeshLambertMaterial({ map: posterTexture(kind) }), 0.032));
  });
  const clock = new Group();
  clock.position.copy(v3(4.75, 0.02, 2.0));
  group.add(clock);
  const face = solid(new CylinderGeometry(0.17, 0.17, 0.03, 24), white);
  face.rotation.x = Math.PI / 2;
  clock.add(face);
  const rim = solid(new TorusGeometry(0.17, 0.015, 6, 24), '#2d3330');
  clock.add(rim);
  const hand = (len, width, color) => {
    const pivot = new Group();
    pivot.position.z = 0.02;
    const m = new Mesh(new BoxGeometry(width, len, 0.006), lambert(color));
    m.position.y = len / 2;
    pivot.add(m);
    clock.add(pivot);
    return pivot;
  };
  const minute = hand(0.13, 0.014, '#1b1c1f');
  const hour = hand(0.085, 0.02, '#1b1c1f');
  const second = hand(0.14, 0.006, '#d6402c');

  // The couch: base, two seat cushions, back, arms, a pillow and a throw.
  const fabric = '#5f6f7a';
  const cushion = '#6d7e8a';
  group.add(block(2.95, 1.15, 0.12, 3.95, 3.35, 0.4, fabric));
  group.add(block(2.97, 1.37, 0.4, 3.7, 2.24, 0.52, cushion));
  group.add(block(2.97, 2.26, 0.4, 3.7, 3.13, 0.52, cushion));
  group.add(block(3.68, 1.35, 0.4, 3.95, 3.15, 0.98, fabric));
  group.add(block(3.6, 1.4, 0.52, 3.72, 2.22, 0.9, cushion));
  group.add(block(3.6, 2.28, 0.52, 3.72, 3.1, 0.9, cushion));
  group.add(block(2.95, 1.15, 0.12, 3.95, 1.37, 0.72, fabric));
  group.add(block(2.95, 3.13, 0.12, 3.95, 3.35, 0.72, fabric));
  [1.2, 3.3].forEach((y) => [3.0, 3.9].forEach((x) => group.add(block(x - 0.025, y - 0.025, 0, x + 0.025, y + 0.025, 0.12, '#2d2520'))));
  const pillow = block(3.42, 1.45, 0.52, 3.6, 1.85, 0.86, '#e2b04a');
  pillow.rotation.x = 0.15;
  group.add(pillow);
  group.add(block(3.0, 3.13, 0.72, 3.9, 3.35, 0.75, '#c94f3d'));
  group.add(block(3.0, 3.35, 0.35, 3.9, 3.37, 0.75, '#c94f3d'));
  for (let x = 3.05; x < 3.9; x += 0.12) group.add(block(x, 3.13, 0.75, x + 0.04, 3.37, 0.752, '#f2c14e', false));

  // A cat asleep on the far arm, breathing, its tail twitching now and then.
  const cat = new Group();
  cat.position.copy(v3(3.45, 3.24, 0.75));
  cat.rotation.y = 0.4;
  group.add(cat);
  const fur = '#d98b3a';
  const body = solid(new SphereGeometry(1, 14, 10), fur);
  body.scale.set(0.16, 0.1, 0.11);
  body.position.y = 0.09;
  cat.add(body);
  const catHead = solid(new SphereGeometry(0.075, 14, 10), fur);
  catHead.position.set(0.15, 0.08, 0.02);
  cat.add(catHead);
  [-1, 1].forEach((side) => {
    const ear = solid(new ConeGeometry(0.03, 0.05, 6), '#c47a30');
    ear.position.set(0.17, 0.15, 0.02 + side * 0.04);
    cat.add(ear);
  });
  for (let k = 0; k < 4; k += 1) {
    const stripe = solid(new TorusGeometry(0.1, 0.012, 4, 12, Math.PI), '#b8692a');
    stripe.position.set(-0.08 + k * 0.05, 0.09, 0);
    stripe.rotation.y = Math.PI / 2;
    stripe.scale.set(1, 1, 1.1);
    cat.add(stripe);
  }
  const tail = new Group();
  tail.position.set(-0.15, 0.05, 0);
  cat.add(tail);
  for (let k = 0; k < 5; k += 1) {
    const seg = solid(new SphereGeometry(0.028, 8, 6), k % 2 ? '#b8692a' : fur);
    seg.position.set(-k * 0.045, 0, k * k * 0.012);
    tail.add(seg);
  }

  // Coffee table with pizza, a can, crisps, a spare pad and the remote.
  const top = '#c79a62';
  group.add(block(1.65, 1.65, 0.38, 2.45, 2.85, 0.42, top));
  group.add(block(1.7, 1.7, 0.12, 2.4, 2.8, 0.14, '#a8794a'));
  [1.68, 2.42].forEach((x) => [1.68, 2.82].forEach((y) => group.add(block(x - 0.025, y - 0.025, 0, x + 0.025, y + 0.025, 0.38, '#8a5f3a'))));
  group.add(block(1.78, 1.78, 0.42, 2.16, 2.16, 0.45, '#e8d9b8'));
  const lid = block(1.78, 1.78, 0.45, 2.16, 2.16, 0.47, '#e8d9b8');
  group.add(lid);
  const slice = solid(new CylinderGeometry(0.14, 0.14, 0.02, 3), '#f2b544');
  slice.position.copy(v3(1.97, 2.32, 0.43));
  group.add(slice);
  for (let k = 0; k < 4; k += 1) {
    const pep = solid(new CylinderGeometry(0.018, 0.018, 0.022, 8), '#b8352a');
    pep.position.copy(v3(1.94 + (k % 2) * 0.05, 2.28 + Math.floor(k / 2) * 0.06, 0.435));
    group.add(pep);
  }
  const can = solid(new CylinderGeometry(0.033, 0.033, 0.12, 14), '#d23a2c');
  can.position.copy(v3(1.88, 2.66, 0.48));
  group.add(can);
  const canTop = solid(new CylinderGeometry(0.03, 0.03, 0.005, 14), '#c9cdd1');
  canTop.position.copy(v3(1.88, 2.66, 0.543));
  group.add(canTop);
  const crisps = block(2.18, 1.82, 0.42, 2.38, 2.1, 0.5, '#f2c14e');
  crisps.rotation.y = 0.3;
  group.add(crisps);
  const spare = controllerMesh();
  spare.position.copy(v3(2.25, 2.6, 0.445));
  spare.rotation.set(-Math.PI / 2, 0, 0.6);
  group.add(spare);
  group.add(block(2.05, 2.7, 0.42, 2.1, 2.84, 0.435, '#1b1c1f'));

  // A floor lamp by the couch, a beanbag and a big plant in the corner.
  const lampX = 4.4;
  const lampY = 0.55;
  group.add(block(lampX - 0.15, lampY - 0.15, 0, lampX + 0.15, lampY + 0.15, 0.03, '#2d3330'));
  group.add(bar([lampX, lampY, 0], [lampX, lampY, 1.55], 0.02, '#2d3330'));
  const lampShade = solid(new CylinderGeometry(0.16, 0.24, 0.3, 16, 1, true), lambert('#efe4cc', { side: DoubleSide }));
  lampShade.position.copy(v3(lampX, lampY, 1.62));
  group.add(lampShade);
  const bulb = new Mesh(new SphereGeometry(0.06, 10, 8), new MeshBasicMaterial({ color: '#fff1c8' }));
  bulb.position.copy(v3(lampX, lampY, 1.56));
  group.add(bulb);
  const lampLight = new PointLight('#ffcf8a', 1.4, 3.6, 1.6);
  lampLight.position.copy(v3(lampX, lampY, 1.5));
  group.add(lampLight);
  const beanbag = solid(new SphereGeometry(1, 16, 12), '#8a5cc8');
  beanbag.scale.set(0.42, 0.3, 0.42);
  beanbag.position.copy(v3(1.05, 4.0, 0.26));
  group.add(beanbag);
  group.add(block(0.18, 0.18, 0, 0.55, 0.55, 0.42, '#c4673e'));
  group.add(block(0.15, 0.15, 0.38, 0.58, 0.58, 0.44, '#a9532f'));
  hedgeClump(group, 0.36, 0.36, 1.0, 0.45, 70, 17);

  ctx.animate((time, dt, sim) => {
    drawGame(screen2d, sim.game, time);
    screenTex.needsUpdate = true;
    tvLight.intensity = 1.3 + Math.sin(time * 7) * 0.15 + (sim.game.state === 'ko' ? 0.6 : 0);
    body.scale.y = 0.1 + Math.sin(time * 2.2) * 0.006;
    tail.rotation.y = Math.sin(time * 1.1) > 0.85 ? Math.sin(time * 18) * 0.35 : 0;
    const seconds = time + 37 * 60;
    second.rotation.z = -((seconds % 60) / 60) * Math.PI * 2;
    minute.rotation.z = -(((seconds / 60) % 60) / 60) * Math.PI * 2;
    hour.rotation.z = -(((seconds / 3600 + 4) % 12) / 12) * Math.PI * 2;
  });
  return [];
}

// A small leafy clump (a pot plant), in the hedge's style.
function hedgeClump(group, x, y, z, radius, count, seed) {
  const rand = seeded(seed);
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshLambertMaterial({ color: '#ffffff', flatShading: true }), count);
  mesh.castShadow = true;
  const dummy = new Object3D();
  const greens = ['#5e9e3c', '#4e8d33', '#73b14b', '#3e7a2b', '#86c05a'].map((c) => new Color(c));
  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    const rr = rand() ** 0.6 * radius;
    dummy.position.copy(v3(x + Math.cos(a) * rr, y + Math.sin(a) * rr, z - radius * 0.5 + rand() * radius * 1.3));
    const leaf = radius * (0.18 + rand() * 0.14);
    dummy.scale.set(leaf, leaf * 1.6, leaf * 0.5);
    dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, greens[i % greens.length]);
  }
  group.add(mesh);
}

// People who watch: the stands' crowd, plus a few figures placed by hand.
const EXTRAS = {
  tabletennis: [{ x: 1.525 + 2.21, y: 1.37 - 0.3, seat: 0.47, yaw: Math.PI, pose: 'sit', shirt: '#3fb37f', shorts: '#2d2a26' }],
  diving: [
    { x: -1.9 + 0.05, y: 5, seat: 1.92, yaw: 0, pose: 'sit', shirt: '#d9412c', shorts: '#d9412c' },
    { x: 11.3, y: 2.6, yaw: Math.PI, pose: 'stand', shirt: '#f2f2ee', shorts: '#1f2a3a' },
    { x: 12.25, y: 2.0, seat: 0.47, yaw: Math.PI, pose: 'sit', shirt: '#2a62c4', shorts: '#1f2a3a' },
    { x: 12.25, y: 3.0, seat: 0.47, yaw: Math.PI, pose: 'sit', shirt: '#2a62c4', shorts: '#1f2a3a' },
    { x: 12.25, y: 4.0, seat: 0.47, yaw: Math.PI, pose: 'sit', shirt: '#2a62c4', shorts: '#1f2a3a' },
  ],
};

const CROWD = ['#e2553a', '#f2c14e', '#2a6fdb', '#3fb37f', '#f2f2ee', '#8a5cc8', '#e86aa6', '#1f2a3a', '#f08a3c'];

// ---- Figures --------------------------------------------------------------

const SKIN = ['#e8b48a', '#c68657', '#8a5636', '#f0c8a4', '#b0754c', '#d9a27a', '#7a4a2e', '#efc29d'];
const HAIR = ['#141414', '#2b1d14', '#5a3a22', '#3b2a20', '#c99a55', '#24170f'];
const STYLES = {
  tabletennis: [{ hat: 'band', hatColor: '#f4f1ea' }, { hat: 'none' }],
  basketball: [
    { hat: 'none' },
    { hat: 'band', hatColor: '#f4f1ea' },
    { hat: 'none' },
    { hat: 'none' },
    { hat: 'cap', hatColor: '#1f2a3a' },
    { hat: 'none' },
  ],
};

// Geometry is shared between figures (a crowd is dozens of them), keyed by shape.
const shapes = new Map();
const shape = (key, make) => {
  if (!shapes.has(key)) shapes.set(key, make());
  return shapes.get(key);
};
const shade = (hex, k) => `#${new Color(hex).multiplyScalar(k).getHexString()}`;
const part = (geometry, color, cast = true) => solid(geometry, color, cast);

// A tapered limb segment with a ball at its end, so bent joints stay closed.
function limb(parent, r0, r1, length, color) {
  const joint = new Group();
  parent.add(joint);
  const mesh = part(shape(`limb${r0}:${r1}:${length}`, () => new CylinderGeometry(r0, r1, length, 12)), color);
  mesh.position.y = -length / 2;
  joint.add(mesh);
  const ball = part(shape(`ball${r1}`, () => new SphereGeometry(r1, 12, 8)), color);
  ball.position.y = -length;
  joint.add(ball);
  const end = new Group();
  end.position.y = -length;
  joint.add(end);
  return { joint, end };
}

const THIGH = 0.38;
// Knee to sole: the shin plus the shoe below it.
const SHIN = 0.44;

// The torso is turned on a lathe: hips, waist, chest, then the shoulder slope.
const torsoShape = () =>
  new LatheGeometry(
    [
      [0.001, 0],
      [0.15, 0],
      [0.158, 0.06],
      [0.148, 0.16],
      [0.172, 0.3],
      [0.198, 0.41],
      [0.196, 0.47],
      [0.15, 0.525],
      [0.06, 0.55],
      [0.001, 0.55],
    ].map(([r, y]) => new Vector2(r, y)),
    20,
  );

const numberTextures = new Map();
function numberTexture(n) {
  if (!numberTextures.has(n)) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const c = canvas.getContext('2d');
    c.font = 'bold 44px "Arial Black", Impact, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffffff';
    c.fillText(String(n), 32, 34);
    numberTextures.set(n, crisp(canvas));
  }
  return numberTextures.get(n);
}

const HAIRSTYLES = ['short', 'curly', 'bun', 'fade', 'long'];
const JERSEYS = [23, 7, 11, 3, 30, 15, 9, 21];

function makeRig(pl, sportId) {
  const style = (STYLES[sportId] ?? [])[pl.id] ?? { hat: pl.hat ?? 'none', hatColor: pl.hatColor };
  const skin = pl.skin ?? SKIN[(pl.id * 3 + sportId.length) % SKIN.length];
  const hair = pl.hair ?? HAIR[(pl.id * 5 + 1) % HAIR.length];
  const hairstyle = pl.hairstyle ?? HAIRSTYLES[(pl.id * 7 + sportId.length) % HAIRSTYLES.length];
  // Divers: bare skin above swim trunks, bare feet.
  const torsoColor = pl.swimmer ? skin : pl.shirt;
  const sleeveColor = pl.swimmer ? skin : pl.shirt;
  const trim = pl.swimmer ? skin : shade(pl.shirt, 0.78);
  const root = new Group();
  // The whole body pitches and rolls about the hips, for flips and swimming.
  const tilt = new Group();
  tilt.position.y = 1;
  root.add(tilt);
  const lift = new Group();
  lift.position.y = -1;
  tilt.add(lift);
  const hips = new Group();
  lift.add(hips);

  // Shorts (or trunks) with a waistband and a side stripe.
  const shorts = part(shape(pl.swimmer ? 'trunks' : 'shorts', () => new CylinderGeometry(0.158, 0.172, pl.swimmer ? 0.16 : 0.24, 18)), pl.shorts);
  shorts.scale.z = 0.72;
  shorts.position.y = -0.04;
  hips.add(shorts);
  const band = part(shape('waist', () => new TorusGeometry(0.157, 0.014, 6, 20)), shade(pl.shorts, 0.75));
  band.rotation.x = Math.PI / 2;
  band.scale.y = 0.72;
  band.position.y = pl.swimmer ? 0.035 : 0.075;
  hips.add(band);

  const spine = new Group();
  spine.position.y = 0.06;
  hips.add(spine);
  const torso = part(shape('torso', torsoShape), torsoColor);
  torso.scale.z = 0.62;
  torso.position.y = 0.01;
  spine.add(torso);
  if (!pl.swimmer) {
    const hem = part(shape('hem', () => new TorusGeometry(0.152, 0.012, 6, 20)), trim);
    hem.rotation.x = Math.PI / 2;
    hem.scale.y = 0.62;
    hem.position.y = 0.02;
    spine.add(hem);
    const collar = part(shape('collar', () => new TorusGeometry(0.058, 0.014, 6, 16)), trim);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.535;
    spine.add(collar);
  }
  if (pl.number) {
    // The jersey number, on the back where the camera mostly sees it.
    const n = JERSEYS[pl.id % JERSEYS.length];
    const back = new Mesh(shape('numberPlane', () => new PlaneGeometry(0.17, 0.17)), new MeshLambertMaterial({ map: numberTexture(n), transparent: true, alphaTest: 0.5 }));
    back.position.set(0, 0.3, -0.118);
    back.rotation.y = Math.PI;
    spine.add(back);
    const front = new Mesh(back.geometry, back.material);
    front.scale.setScalar(0.55);
    front.position.set(0.06, 0.38, 0.112);
    spine.add(front);
  }
  const neck = part(shape('neck', () => new CylinderGeometry(0.046, 0.052, 0.1, 10)), skin);
  neck.position.y = 0.56;
  spine.add(neck);

  // Head: skull, jaw, ears, eyes with pupils, brows, nose and mouth.
  const head = new Group();
  head.position.y = 0.67;
  spine.add(head);
  const skull = part(shape('skull', () => new SphereGeometry(0.112, 18, 14)), skin);
  skull.scale.set(1, 1.06, 1);
  head.add(skull);
  const jaw = part(shape('jaw', () => new SphereGeometry(0.085, 14, 10)), skin);
  jaw.scale.set(1, 0.8, 1);
  jaw.position.set(0, -0.045, 0.025);
  head.add(jaw);
  [-1, 1].forEach((side) => {
    const ear = part(shape('ear', () => new SphereGeometry(0.026, 8, 6)), skin);
    ear.scale.set(0.55, 1, 0.8);
    ear.position.set(side * 0.11, -0.004, -0.008);
    head.add(ear);
    const white = part(shape('eyeWhite', () => new BoxGeometry(0.026, 0.016, 0.006)), '#f4f1ea', false);
    white.position.set(side * 0.038, 0.012, 0.106);
    head.add(white);
    const pupil = part(shape('pupil', () => new BoxGeometry(0.012, 0.014, 0.006)), '#2a1d16', false);
    pupil.position.set(side * 0.036, 0.011, 0.109);
    head.add(pupil);
    const brow = part(shape('brow', () => new BoxGeometry(0.03, 0.007, 0.008)), hair, false);
    brow.position.set(side * 0.038, 0.033, 0.104);
    brow.rotation.z = side * -0.12;
    head.add(brow);
  });
  const nose = part(shape('nose', () => new BoxGeometry(0.022, 0.032, 0.03)), shade(skin, 0.94));
  nose.position.set(0, -0.008, 0.11);
  head.add(nose);
  const mouth = part(shape('mouth', () => new BoxGeometry(0.036, 0.007, 0.006)), shade(skin, 0.62), false);
  mouth.position.set(0, -0.052, 0.098);
  head.add(mouth);
  if (pl.id % 5 === 3 && !pl.swimmer) {
    const beard = part(shape('beard', () => new SphereGeometry(0.088, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55)), hair);
    beard.position.set(0, -0.032, 0.02);
    head.add(beard);
  }

  // Hair, then whatever is worn on the head.
  {
    const crown = part(shape(`hair-${hairstyle}`, () => new SphereGeometry(hairstyle === 'fade' ? 0.116 : 0.121, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)), hair);
    crown.rotation.x = -0.35;
    crown.position.set(0, 0.014, -0.012);
    head.add(crown);
    // A fringe over the forehead.
    const fringe = part(shape('fringe', () => new BoxGeometry(0.15, 0.03, 0.03)), hair);
    fringe.position.set(0, 0.07, 0.085);
    fringe.rotation.x = -0.5;
    if (hairstyle !== 'fade') head.add(fringe);
    if (hairstyle === 'curly') {
      for (let k = 0; k < 14; k += 1) {
        const a = (k / 14) * Math.PI * 2;
        const curl = part(shape('curl', () => new SphereGeometry(0.035, 8, 6)), hair);
        curl.position.set(Math.cos(a) * 0.085, 0.06 + (k % 2) * 0.025, Math.sin(a) * 0.085 - 0.01);
        head.add(curl);
      }
    } else if (hairstyle === 'bun') {
      const bun = part(shape('bun', () => new SphereGeometry(0.05, 12, 8)), hair);
      bun.position.set(0, 0.1, -0.08);
      head.add(bun);
    } else if (hairstyle === 'long') {
      const back = part(shape('longHair', () => new BoxGeometry(0.2, 0.2, 0.05)), hair);
      back.position.set(0, -0.06, -0.09);
      head.add(back);
    }
  }
  if (style.hat === 'cap') {
    const dome = part(shape('capDome', () => new SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), style.hatColor);
    dome.position.y = 0.015;
    head.add(dome);
    const visor = part(shape('visor', () => new BoxGeometry(0.17, 0.018, 0.12)), shade(style.hatColor, 0.8));
    visor.position.set(0, 0.03, 0.13);
    head.add(visor);
    const button = part(shape('capButton', () => new SphereGeometry(0.015, 6, 4)), shade(style.hatColor, 0.8));
    button.position.y = 0.145;
    head.add(button);
  } else if (style.hat === 'band') {
    const headband = part(shape('headband', () => new CylinderGeometry(0.119, 0.119, 0.035, 16)), style.hatColor);
    headband.position.y = 0.035;
    head.add(headband);
  }
  if (pl.headset) {
    const arc = part(shape('headsetBand', () => new TorusGeometry(0.13, 0.013, 6, 20, Math.PI)), '#f2f2f0');
    arc.position.y = 0.01;
    head.add(arc);
    [-1, 1].forEach((side) => {
      const cup = part(shape('earcup', () => new CylinderGeometry(0.052, 0.052, 0.035, 16)), '#1b1c1f');
      cup.rotation.z = Math.PI / 2;
      cup.position.set(side * 0.125, -0.005, 0);
      head.add(cup);
      const pad = part(shape('earpad', () => new CylinderGeometry(0.044, 0.044, 0.012, 16)), '#f2f2f0');
      pad.rotation.z = Math.PI / 2;
      pad.position.set(side * 0.145, -0.005, 0);
      head.add(pad);
    });
  }
  if (pl.hood) {
    const hood = part(shape('hood', () => new SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6)), pl.shirt);
    hood.scale.set(1, 0.55, 0.75);
    hood.rotation.x = -1.9;
    hood.position.set(0, 0.5, -0.1);
    spine.add(hood);
    const pocket = part(shape('pocket', () => new BoxGeometry(0.2, 0.09, 0.01)), trim);
    pocket.position.set(0, 0.13, 0.1);
    spine.add(pocket);
    [-1, 1].forEach((side) => {
      const cord = part(shape('cord', () => new CylinderGeometry(0.006, 0.006, 0.14, 4)), '#e9e4da');
      cord.position.set(side * 0.04, 0.45, 0.12);
      spine.add(cord);
    });
  }

  // Arms: a rounded shoulder, tapered upper arm and forearm, and a mitten hand
  // with a thumb. Sleeves cover the upper arm; a hoodie covers it all.
  const arms = [1, -1].map((side) => {
    const shoulder = new Group();
    shoulder.rotation.order = 'YXZ';
    shoulder.position.set(side * 0.2, 0.465, 0);
    spine.add(shoulder);
    const delt = part(shape('delt', () => new SphereGeometry(0.064, 12, 8)), sleeveColor);
    shoulder.add(delt);
    const upper = limb(shoulder, 0.05, 0.042, 0.24, skin);
    if (!pl.swimmer) {
      const sleeve = part(shape('sleeve', () => new CylinderGeometry(0.062, 0.056, 0.14, 12)), sleeveColor);
      sleeve.position.y = -0.06;
      shoulder.add(sleeve);
      const cuffRing = part(shape('sleeveHem', () => new TorusGeometry(0.056, 0.008, 4, 12)), trim);
      cuffRing.rotation.x = Math.PI / 2;
      cuffRing.position.y = -0.13;
      shoulder.add(cuffRing);
    }
    const fore = limb(upper.end, 0.042, 0.034, 0.22, skin);
    if (pl.hood) {
      [shoulder, fore.joint].forEach((joint, k) => {
        const tube = part(shape(`hoodSleeve${k}`, () => new CylinderGeometry(k ? 0.05 : 0.06, k ? 0.046 : 0.054, k ? 0.2 : 0.24, 12)), pl.shirt);
        tube.position.y = k ? -0.1 : -0.12;
        joint.add(tube);
      });
    }
    const hand = new Group();
    hand.position.y = -0.24;
    fore.joint.add(hand);
    const palm = part(shape('palm', () => new BoxGeometry(0.05, 0.075, 0.03)), skin);
    palm.position.y = -0.01;
    hand.add(palm);
    const fingers = part(shape('fingers', () => new CapsuleGeometry(0.016, 0.03, 2, 8)), skin);
    fingers.scale.set(1.5, 1, 1);
    fingers.position.set(0, -0.055, 0.005);
    hand.add(fingers);
    const thumb = part(shape('thumb', () => new CapsuleGeometry(0.012, 0.028, 2, 6)), skin);
    thumb.position.set(-side * 0.03, -0.015, 0.012);
    thumb.rotation.z = side * 0.6;
    hand.add(thumb);
    return { side, shoulder, elbow: upper.end, fore };
  });
  if (pl.paddle) {
    const paddle = new Group();
    paddle.position.y = -0.28;
    arms[0].fore.joint.add(paddle);
    const face = part(new CylinderGeometry(0.08, 0.08, 0.016, 16), pl.paddle);
    face.rotation.z = Math.PI / 2;
    face.position.y = -0.12;
    paddle.add(face);
    const rubber = part(new CylinderGeometry(0.076, 0.076, 0.018, 16), '#1d1e22');
    rubber.rotation.z = Math.PI / 2;
    rubber.position.set(0.002, -0.12, 0);
    paddle.add(rubber);
    paddle.add(bar([0, 0, 0], [0, 0, -0.07], 0.015, '#a8763f'));
  }
  if (pl.controller) {
    // Held in front: hung off the right forearm, shifted to the body's middle.
    const pad = controllerMesh();
    pad.position.set(-0.1, -0.27, 0.03);
    arms[0].fore.joint.add(pad);
  }

  // Legs: tapered thigh and shin with knees, socks and two-tone shoes.
  const legs = [1, -1].map((side) => {
    const hip = new Group();
    hip.position.set(side * 0.09, -0.08, 0);
    hips.add(hip);
    const thigh = limb(hip, 0.078, 0.056, THIGH, skin);
    const legLen = pl.swimmer ? 0.08 : pl.hood ? 0.42 : 0.2;
    const shortLeg = part(shape(`shortLeg${legLen}`, () => new CylinderGeometry(0.088, 0.082, legLen, 12)), pl.shorts);
    shortLeg.position.y = -legLen / 2 + 0.02;
    hip.add(shortLeg);
    if (!pl.swimmer && !pl.hood) {
      const stripe = part(shape('stripe', () => new BoxGeometry(0.012, 0.18, 0.03)), '#f2f0ea', false);
      stripe.position.set(side * 0.086, -0.08, 0);
      hip.add(stripe);
    }
    if (pl.hood) {
      // Jeans: a second leg tube over the shin.
      const jean = part(shape('jean', () => new CylinderGeometry(0.064, 0.058, 0.36, 12)), pl.shorts);
      jean.position.y = -0.18;
      thigh.end.add(jean);
    }
    const shin = limb(thigh.end, 0.056, 0.04, SHIN - 0.08, skin);
    const foot = new Group();
    foot.position.y = -0.36;
    shin.joint.add(foot);
    if (pl.shoe) {
      if (!pl.hood) {
        const sock = part(shape('sock', () => new CylinderGeometry(0.044, 0.043, 0.07, 12)), '#f4f2ec');
        sock.position.y = 0.02;
        foot.add(sock);
      }
      const sole = part(shape('sole', () => new BoxGeometry(0.105, 0.025, 0.25)), '#f4f2ec');
      sole.position.set(0, -0.067, 0.05);
      foot.add(sole);
      const upperShoe = part(shape('shoeUpper', () => new BoxGeometry(0.095, 0.05, 0.2)), pl.shoe === '#f4f1ea' ? '#3a3d44' : pl.shoe);
      upperShoe.position.set(0, -0.032, 0.035);
      foot.add(upperShoe);
      const toe = part(shape('toe', () => new SphereGeometry(0.048, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), pl.shoe === '#f4f1ea' ? '#3a3d44' : pl.shoe);
      toe.scale.set(1, 0.9, 1.1);
      toe.position.set(0, -0.055, 0.13);
      foot.add(toe);
      const laces = part(shape('laces', () => new BoxGeometry(0.04, 0.006, 0.08)), '#f4f2ec', false);
      laces.position.set(0, -0.006, 0.07);
      foot.add(laces);
    } else {
      const bare = part(shape('bareFoot', () => new BoxGeometry(0.075, 0.05, 0.19)), skin);
      bare.position.set(0, -0.055, 0.045);
      foot.add(bare);
    }
    return { side, hip, knee: thigh.end };
  });
  root.traverse((child) => {
    if (child.isMesh) child.castShadow = true;
  });
  return { root, tilt, hips, spine, head, arms, legs };
}

// Poses whose hips hang at a fixed height: in the air and in the water.
const FLOAT = new Set(['tuck', 'pike', 'entry', 'swim']);
// Held leg shapes: [thigh, knee] in radians.
const LEGS = {
  stand: [0, 0.04],
  reach: [0, 0.02],
  entry: [0, 0],
  tuck: [-2.3, 2.4],
  pike: [-2.5, 0.05],
  sit: [-1.5, 1.5],
  dunk: [-0.45, 0.95],
  game: [-1.5, 1.5],
  gamecheer: [-1.5, 1.4],
  gamesad: [-1.45, 1.4],
};
const LEAN = { tuck: 0.45, pike: 0.55, sit: 0.05, sitcheer: 0.05, climb: 0.12, game: 0.28, gamecheer: 0.02, gamesad: -0.14, stand: 0, reach: 0, entry: 0, dunk: 0.1 };

function poseRig(rig, pl, time, sport) {
  const { arms, legs, hips, spine, tilt } = rig;
  const pose = pl.pose;
  const w = pl.walk;
  const ph = pl.phase;
  const fx = Math.cos(pl.yaw);
  const fy = Math.sin(pl.yaw);
  const speed = Math.hypot(pl.vx ?? 0, pl.vy ?? 0) || 1;
  // How much of the motion is forward and how much is a side step.
  const forward = Math.abs(((pl.vx ?? 0) * fx + (pl.vy ?? 0) * fy) / speed);
  const crouchy = { ready: 1, guard: 1, dribble: 0.7 }[pose] ?? 0.25;
  const crouch = crouchy * (1 - w * 0.55);
  const sw = Math.sin(ph);
  const held = LEGS[pose === 'sitcheer' ? 'sit' : pose];
  const stroke = pl.stroke ?? 0;
  let roll = pl.roll ?? 0;
  let lowest = 0;
  legs.forEach(({ side, hip, knee }) => {
    const s = side > 0 ? sw : -sw;
    let thigh;
    let bend;
    let spread = 0.04;
    if (pose === 'swim') {
      thigh = Math.sin(stroke * 3 + side * 1.6) * 0.28;
      bend = 0.18;
    } else if (pose === 'climb') {
      const c = 0.5 + 0.5 * Math.sin(time * 5 + side * 1.6);
      thigh = -0.25 - 0.9 * c;
      bend = 1.3 * c;
    } else if (held && w < 0.3) {
      [thigh, bend] = held;
    } else {
      thigh = -0.4 * crouch - s * 0.8 * w * forward;
      bend = 0.75 * crouch + (0.15 + Math.max(0, side > 0 ? Math.cos(ph) : -Math.cos(ph)) * 1.05) * w;
      spread = 0.04 + Math.max(0, s) * 0.35 * w * (1 - forward);
    }
    hip.rotation.set(thigh, 0, side * spread);
    knee.rotation.x = bend;
    lowest = Math.max(lowest, THIGH * Math.cos(thigh) + SHIN * Math.cos(thigh + bend));
  });
  hips.position.y = FLOAT.has(pose) ? 0.92 : lowest + 0.08 + Math.abs(Math.cos(ph)) * 0.04 * w;
  spine.rotation.set(LEAN[pose] ?? 0.22 * crouch + 0.18 * w * forward, 0, 0);
  spine.rotation.z = 0;
  if (pose === 'swim') roll += Math.sin(stroke) * 0.4;
  tilt.rotation.set(pl.pitch ?? 0, 0, roll);

  const arm = (a, x, z, elbow, y = 0) => {
    a.shoulder.rotation.set(x, y * a.side, z * a.side);
    a.elbow.rotation.x = elbow;
  };
  // The dribbling hand leads; a left-hand dribble swaps the arms' jobs.
  const [ball, other] = pose === 'dribble' && pl.hand < 0 ? [arms[1], arms[0]] : arms;
  const swing = sport.swing === 'paddle' ? (time - pl.swingAt) / 0.34 : -1;
  if (swing >= 0 && swing <= 1) {
    const q = ease(swing);
    arms[0].shoulder.rotation.set(-1.2, lerp(1.5, -1.0, q), 0.2);
    arms[0].elbow.rotation.x = lerp(-0.9, -0.3, q);
    arm(arms[1], -0.6, 0.3, -0.9);
    spine.rotation.y = lerp(0.6, -0.5, q);
    return;
  }
  spine.rotation.y = 0;
  const run = sw * 0.8 * w;
  const wave = Math.sin(time * 14 + pl.id) * 0.25;
  switch (pose) {
    case 'dribble':
      arm(ball, -0.45, 0.28, -0.5 + Math.cos(time * 13) * 0.35);
      arm(other, -0.35 - run * 0.5, 0.35, -0.9);
      break;
    case 'shoot':
    case 'dunk':
      arm(arms[0], -2.85, 0.1, -0.5);
      arm(arms[1], -2.7, 0.25, -0.9);
      break;
    case 'guard':
      arm(arms[0], -0.5, 1.05, -0.3);
      arm(arms[1], -0.5, 1.05, -0.3);
      break;
    case 'celebrate':
    case 'sitcheer':
      arm(arms[0], -2.9 + wave, 0.35, -0.2);
      arm(arms[1], -2.9 - wave, 0.35, -0.2);
      break;
    case 'stand':
      arm(arms[0], 0.05, 0.12, -0.15);
      arm(arms[1], 0.05, 0.12, -0.15);
      break;
    case 'reach':
    case 'entry':
      arm(arms[0], -3.05, 0.06, 0);
      arm(arms[1], -3.05, 0.06, 0);
      break;
    case 'tuck':
      arm(arms[0], -1.0, 0.2, -1.6);
      arm(arms[1], -1.0, 0.2, -1.6);
      break;
    case 'pike':
      arm(arms[0], -1.5, 0.1, -0.1);
      arm(arms[1], -1.5, 0.1, -0.1);
      break;
    case 'climb': {
      const c = Math.sin(time * 5);
      arm(arms[0], -2.5 + c * 0.45, 0.15, -0.6);
      arm(arms[1], -2.5 - c * 0.45, 0.15, -0.6);
      break;
    }
    case 'swim': {
      // Freestyle: each arm turns a full circle, half a turn apart.
      const a = stroke % (Math.PI * 2);
      const b = (stroke + Math.PI) % (Math.PI * 2);
      arm(arms[0], -a, 0.15, -0.3 - 0.7 * Math.max(0, Math.sin(a)));
      arm(arms[1], -b, 0.15, -0.3 - 0.7 * Math.max(0, Math.sin(b)));
      break;
    }
    case 'game': {
      // Hands together on the pad; thumbs jab when the runner jumps.
      const jab = time - (pl.pressAt ?? -9) < 0.14 ? 0.12 : 0;
      arm(arms[0], -0.62 - jab, -0.32, -0.95 + jab);
      arm(arms[1], -0.62 - jab, -0.32, -0.95 + jab);
      spine.rotation.z = Math.sin(time * 1.3) * 0.035;
      break;
    }
    case 'gamecheer':
      arm(arms[0], -2.9 + wave, 0.3, -0.25);
      arm(arms[1], -2.9 - wave, 0.3, -0.25);
      break;
    case 'gamesad':
      arm(arms[0], -0.3, -0.25, -0.8);
      arm(arms[1], -0.3, -0.25, -0.8);
      break;
    case 'sit':
      arm(arms[0], -0.55, 0.1, -0.7);
      arm(arms[1], -0.55, 0.1, -0.7);
      break;
    default:
      // Ready: paddle or hands held in front at chest height.
      arm(arms[0], -0.55 - run * 0.3, 0.3, -0.75);
      arm(arms[1], -0.45 + run * 0.3, 0.3, -0.8);
  }
}

// ---- Mount ----------------------------------------------------------------

const BALLS = {
  basketball: { color: '#d9652a', r: 0.15 },
  tabletennis: { color: '#f6f5f0', r: 0.045 },
};

export function mountCourts(canvas, { onHud, onLost }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  // A lost context (GPU reset, too many tabs) leaves a blank canvas; say so.
  const lost = (event) => {
    event.preventDefault();
    onLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  const target = new WebGLRenderTarget(2, 2);
  target.texture.minFilter = NearestFilter;
  target.texture.magFilter = NearestFilter;
  const dither = new ShaderMaterial({
    uniforms: { tScene: { value: target.texture }, levels: { value: 15 } },
    vertexShader: DITHER_VERT,
    fragmentShader: DITHER_FRAG,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const post = new Scene();
  post.add(new Mesh(new PlaneGeometry(2, 2), dither));
  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let world = null;
  let width = 2;
  let height = 2;
  let paused = false;

  // A build gives the main thread back between its phases (ground, props,
  // figures, crowd, warm-up, shader compile), so it never blocks scrolling for
  // long. The old scene keeps rendering until the new one is ready, and a newer
  // build makes an older one stop and free what it made.
  let buildToken = 0;

  const build = async (index) => {
    const token = ++buildToken;
    const sport = SPORTS[index];
    const sim = createSim(sport, 11 + index * 7);
    const scene = new Scene();
    const [W, L] = sport.court;
    const m = sport.pave + sport.grass;
    const center = v3(W / 2, L / 2, 0);
    const figure = sport.figure ?? 1;

    scene.add(new HemisphereLight('#eef4ff', '#6b6450', sport.room ? 1.75 : 1.55));
    const sun = new DirectionalLight('#fff1dc', sport.room ? 2.2 : 2.6);
    sun.position.copy(center).add(new Vector3(...(sport.sun ?? [-13, 16, 7])));
    sun.target.position.copy(center);
    sun.castShadow = true;
    const reach = Math.hypot(W + 2 * m, L + 2 * m) / 2 + 2;
    Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 80 });
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);

    // Free everything this scene made on the GPU: geometry, materials and
    // their textures, instance buffers and the sun's shadow map. Shapes, the
    // lambert() cache and jersey numbers are shared, so they stay.
    const disposeScene = () => {
      const keepGeometry = new Set(shapes.values());
      const keepMaterial = new Set(materials.values());
      const keepTexture = new Set(numberTextures.values());
      const dropMaterial = (material) => {
        if (keepMaterial.has(material)) return;
        if (material.map && !keepTexture.has(material.map)) material.map.dispose();
        material.dispose();
      };
      scene.traverse((child) => {
        if (!child.isMesh) return;
        if (!keepGeometry.has(child.geometry)) child.geometry.dispose();
        [child.material].flat().forEach(dropMaterial);
        if (child.isInstancedMesh) child.dispose();
      });
      sun.dispose();
    };
    // After each phase: stop if a newer build has started.
    const superseded = async () => {
      await yieldToMain();
      if (token === buildToken) return false;
      disposeScene();
      return true;
    };
    if (await superseded()) return;

    const extent = { x0: -m - 0.7, y0: -m - 0.7, sx: W + 2 * m + 1.4, sy: L + 2 * m + 1.4 };
    const texture = await paintGround(sport, extent);
    if (token !== buildToken) {
      texture.dispose();
      sun.dispose();
      return;
    }
    const ground = new Mesh(new PlaneGeometry(extent.sx, extent.sy), new MeshLambertMaterial({ map: texture, alphaTest: 0.5 }));
    ground.rotation.x = -Math.PI / 2;
    // PlaneGeometry's v runs along -z after the rotation, which is +y in the
    // world, so the painted canvas lands the right way up.
    ground.position.copy(v3(extent.x0 + extent.sx / 2, extent.y0 + extent.sy / 2, 0));
    ground.receiveShadow = true;
    scene.add(ground);
    if (await superseded()) return;

    const handlers = {};
    const animators = [];
    const props = new Group();
    const ctx = {
      group: props,
      sport,
      on: (type, fn) => {
        handlers[type] = fn;
      },
      animate: (fn) => animators.push(fn),
      time: () => sim.time,
    };
    const seats = PROPS[sport.id](ctx) ?? [];
    scene.add(props);
    if (await superseded()) return;
    // Splashes and ripples exist only where there is water.
    const splashes = sport.pool ? makeSplashes(scene) : null;
    const ripples = sport.pool ? makeRipples(scene) : null;
    if (sport.pool) {
      handlers.splash = (fx) => splashes.emit(fx.x, fx.y, fx.n, fx.power);
      handlers.ripple = (fx) => ripples.emit(fx.x, fx.y);
    }

    const rigs = sim.players.map((pl) => {
      const rig = makeRig(pl, sport.id);
      // The reference draws people a little larger than life, so they read.
      rig.root.scale.setScalar(figure);
      scene.add(rig.root);
      return rig;
    });
    if (await superseded()) return;

    // Spectators: seated rows in the stands, and the hand-placed extras.
    const rand = seeded(29 + index);
    const crowd = [];
    seats.forEach((row, k) => {
      for (let y = row.y0 + 0.4; y < row.y0 + row.len - 0.3; y += 0.72) {
        if (rand() < 0.4) continue;
        crowd.push({ x: row.x, y: y + (rand() - 0.5) * 0.15, seat: row.z, yaw: 0, pose: 'sit', shirt: CROWD[(k * 7 + Math.round(y * 3)) % CROWD.length], shorts: rand() < 0.5 ? '#2c3e5c' : '#3a3530', shoe: '#f4f1ea' });
      }
    });
    (EXTRAS[sport.id] ?? []).forEach((extra) => crowd.push({ shoe: '#3a3d44', ...extra }));
    const watchers = [];
    for (const [i, c] of crowd.entries()) {
      const pl = { id: 40 + i, pose: c.pose, walk: 0, phase: i, yaw: c.yaw, pitch: 0, roll: 0, swingAt: -9, vx: 0, vy: 0, ...c };
      pl.hat = rand() < 0.2 ? 'cap' : 'none';
      pl.hatColor = CROWD[(i * 3) % CROWD.length];
      const rig = makeRig(pl, 'crowd');
      rig.root.scale.setScalar(figure);
      // Seated figures rest their thighs on the seat.
      const z = c.seat != null ? c.seat - 0.47 * figure : 0;
      rig.root.position.copy(v3(c.x, c.y, z));
      rig.root.rotation.y = Math.PI / 2 - c.yaw;
      scene.add(rig.root);
      watchers.push({ rig, pl, base: c.pose, lag: rand() * 0.4 });
      // A crowd is dozens of figures: build it a few at a time.
      if (i % 8 === 7 && (await superseded())) return;
    }

    const ballLook = BALLS[sport.id];
    const ball = ballLook ? solid(new SphereGeometry(ballLook.r, 10, 8), ballLook.color) : null;
    if (ball) scene.add(ball);

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    const dir = new Vector3(1, Math.SQRT2 * Math.tan(Math.PI / 6), 1).normalize();
    camera.position.copy(center).addScaledVector(dir, 60);
    camera.lookAt(center);
    camera.updateMatrixWorld();

    const fit = () => {
      const view = camera.matrixWorldInverse;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const x of [-m - 0.3, W + m + 0.3]) {
        for (const y of [-m - 0.3, L + m + 0.3]) {
          for (const z of [0, sport.top]) {
            const p = v3(x, y, z).applyMatrix4(view);
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          }
        }
      }
      const pad = 1.06;
      let w = (maxX - minX) * pad;
      let h = (maxY - minY) * pad;
      const aspect = width / height;
      if (w / h < aspect) w = h * aspect;
      else h = w / aspect;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      Object.assign(camera, { left: cx - w / 2, right: cx + w / 2, top: cy + h / 2, bottom: cy - h / 2 });
      camera.updateProjectionMatrix();
    };

    const update = (dt) => {
      if (dt > 0) stepSim(sim, dt);
      while (sim.fx.length) {
        const fx = sim.fx.shift();
        handlers[fx.type]?.(fx);
      }
      splashes?.update(dt);
      ripples?.update(dt);
      animators.forEach((fn) => fn(sim.time, dt, sim));
      sim.players.forEach((pl, i) => {
        const rig = rigs[i];
        rig.root.position.copy(v3(pl.x, pl.y, pl.z));
        rig.root.rotation.y = Math.PI / 2 - pl.yaw;
        poseRig(rig, pl, sim.time, sport);
      });
      const cheering = sim.time - sim.cheerAt;
      watchers.forEach(({ rig, pl, base, lag }) => {
        const on = cheering > lag && cheering < 2 + lag;
        pl.pose = on ? (base === 'sit' ? 'sitcheer' : 'celebrate') : base;
        poseRig(rig, pl, sim.time, sport);
      });
      if (ball) ball.position.copy(v3(sim.ball.x, sim.ball.y, sim.ball.z + ballLook.r));
      onHud?.(sim);
    };

    // Start a moment in, so the still frame catches the play under way.
    for (let i = 0; i < 70; i += 1) {
      update(1 / 30);
      if (i % 35 === 34 && (await superseded())) return;
    }
    fit();
    update(0);
    // Upload each texture in its own step, then compile the shaders (off the
    // main thread where the browser allows it), then draw once off screen so
    // the shadow pass compiles too. Only then does the new scene replace the old.
    const maps = new Set();
    scene.traverse((child) => {
      if (child.isMesh) [child.material].flat().forEach((m) => m.map && maps.add(m.map));
    });
    for (const map of maps) {
      renderer.initTexture(map);
      if (await superseded()) return;
    }
    try {
      await renderer.compileAsync(scene, camera);
    } catch {
      // Older browsers compile on the first render instead.
    }
    if (await superseded()) return;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    if (await superseded()) return;
    const previous = world;
    world = { sport, sim, scene, camera, fit, update, dispose: disposeScene };
    previous?.dispose();
    render();
  };

  const render = () => {
    if (!world) return;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(world.scene, world.camera);
    renderer.setRenderTarget(null);
    renderer.render(post, postCamera);
  };

  let frame = 0;
  let last = performance.now();
  let visible = true;
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible && !paused && world && dt > 0) {
      world.update(dt);
      render();
    }
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  return {
    // Resolves once the new scene is on screen.
    setSport(index) {
      return build(index);
    },
    setPaused(value) {
      paused = value;
    },
    setVisible(value) {
      visible = value;
    },
    get sim() {
      return world?.sim;
    },
    // GPU memory counters (geometries, textures), for leak checks.
    get info() {
      return renderer.info;
    },
    // Art-pixel position of a world point, for dev checks.
    project(x, y, z = 0) {
      if (!world) return [0, 0];
      const p = v3(x, y, z).project(world.camera);
      return [((p.x + 1) / 2) * width, ((1 - p.y) / 2) * height];
    },
    // Renders now and returns the canvas, so a caller can copy it this tick.
    snapshot(dt = 0) {
      world?.update(dt);
      render();
      return canvas;
    },
    // Size in art pixels; the caller scales the canvas up with CSS.
    resize(artW, artH) {
      width = Math.max(2, artW);
      height = Math.max(2, artH);
      renderer.setSize(width, height, false);
      target.setSize(width, height);
      world?.fit();
      render();
    },
    dispose() {
      cancelAnimationFrame(frame);
      world?.dispose();
      target.dispose();
      dither.dispose();
      canvas.removeEventListener('webglcontextlost', lost);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
