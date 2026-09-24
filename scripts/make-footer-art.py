"""Footer artwork: a time loop. The same person as a child, a teenager and an
adult stands with his back to us on a pale plain, facing a wormhole that
fills the sky.

The wormhole is built as a flat texture in polar space (angle across, log
radius down): stacked bands of rock and cloud, fractal noise stretched along
the angle, and sloped light and dark streaks. A mesh warp wraps that texture
into slightly elliptical, wobbling rings that spiral into a bright eye. Dark
pine slopes frame both sides, a small town with a spire sits in the valley
under the eye, and the three figures cast long soft shadows toward us. The
figures are back views built from spline outlines and tapered limbs.

Everything above the horizon is composited with a vertical fade, so the top
rows are exactly the page background and the band dissolves into the page.
  dark  - warm near-black page, ivory rings, ivory rim light on the figures
  light - paper page, ink rings that fade to paper, ink figures

Run: python3 scripts/make-footer-art.py <dark|light> <out.png> [webp-prefix]
With a prefix, also writes <prefix>-2400.webp and <prefix>-1200.webp.
"""
import math
import random
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

THEMES = {
    'dark': dict(
        bg=(14, 12, 11),
        ring_lo=(14, 12, 11), ring_mid=(98, 88, 76), ring_hi=(233, 223, 207),
        core=(255, 248, 234),
        plain_hz=(126, 114, 98), plain_lo=(34, 29, 26), plain_lit=(206, 194, 174),
        mtn_far=(52, 46, 40), mtn_near=(24, 21, 18),
        town=(16, 13, 12),
        figure=(12, 10, 9), rim=(233, 223, 207),
        shadow=(18, 15, 13), shadow_a=0.9,
        grain=0.36, scratch=(233, 223, 207), scratch_a=48,
        ember=(241, 130, 75),
    ),
    'light': dict(
        bg=(245, 240, 232),
        ring_lo=(245, 240, 232), ring_mid=(150, 137, 122), ring_hi=(252, 250, 245),
        core=(255, 254, 250),
        plain_hz=(228, 220, 206), plain_lo=(196, 185, 168), plain_lit=(246, 242, 234),
        mtn_far=(128, 116, 103), mtn_near=(58, 50, 44),
        town=(40, 34, 30),
        figure=(25, 21, 18), rim=(120, 108, 96),
        shadow=(140, 128, 114), shadow_a=0.7,
        grain=0.32, scratch=(60, 52, 46), scratch_a=30,
        ember=(184, 67, 12),
    ),
}
name = sys.argv[1]
theme = THEMES[name]
random.seed(1108)
K = 2
W, H = 2400 * K, 900 * K
CX, CY = W * 0.5, H * 0.40          # eye of the wormhole
HZ = H * 0.66                       # horizon
E = 0.86                            # ring ellipse: y radius / x radius
R0, R1 = W * 0.030, W * 0.64        # inner (eye) and outer ring radius


def layer(v=0):
    return Image.new('L', (W, H), v)


def vgrad(stops):
    """Vertical L gradient over the full canvas; stops = [(y, value), ...]."""
    vals = []
    for y in range(H):
        v = stops[0][1]
        for (y0, v0), (y1, v1) in zip(stops, stops[1:]):
            if y0 <= y <= y1:
                t = (y - y0) / max(1, y1 - y0)
                t = t * t * (3 - 2 * t)
                v = v0 + (v1 - v0) * t
                break
        else:
            if y > stops[-1][0]:
                v = stops[-1][1]
        vals.append(int(round(v)))
    col = Image.new('L', (1, H))
    col.putdata(vals)
    return col.resize((W, H), Image.NEAREST)


def solid(rgb):
    return Image.new('RGB', (W, H), rgb)


def ellipse_mask(cx, cy, rx, ry, blur=0):
    m = layer()
    ImageDraw.Draw(m).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


# ---------------------------------------------------------------- wormhole
# 1. Texture in polar space: u = angle (wraps), v = log radius (0 = eye).
TW, TH = 3072, 768


def fractal(w, h, stretch):
    acc = None
    total = 0.0
    for sigma, rad, wt in [(50, 1, 0.20), (50, 3, 0.30), (50, 9, 0.30), (50, 24, 0.20)]:
        n = Image.effect_noise((w // stretch, h), sigma).filter(ImageFilter.GaussianBlur(rad))
        n = ImageOps.autocontrast(n, cutoff=0.5).resize((w, h), Image.BICUBIC)
        total += wt
        acc = n if acc is None else Image.blend(acc, n, wt / total)
    return acc


noise = fractal(TW, TH, 5)

bands = Image.new('L', (TW, TH), 0)
bd = ImageDraw.Draw(bands)
v = 0
while v < TH:
    h = random.uniform(5, 34)
    bd.rectangle([0, v, TW, v + h], fill=int(random.uniform(30, 225)))
    v += h
bands = bands.filter(ImageFilter.GaussianBlur(2.2))

light = Image.new('L', (TW, TH), 0)
dark = Image.new('L', (TW, TH), 0)
ld, dd = ImageDraw.Draw(light), ImageDraw.Draw(dark)
for _ in range(2400):
    u, vv = random.uniform(0, TW), random.uniform(0, TH)
    ln = random.uniform(40, 520)
    slope = random.uniform(0.05, 0.16) * random.choice([1, 1, 1, 1, -1])
    inner = 1 - vv / TH
    d = ld if random.random() < 0.55 + 0.3 * inner else dd
    val = int(random.uniform(90, 255) * (0.6 + 0.4 * inner))
    wd = random.choice([1, 1, 2, 2, 3])
    for off in (-TW, 0, TW):
        d.line([(u + off, vv), (u + off + ln, vv + ln * slope)], fill=val, width=wd)
light = light.filter(ImageFilter.GaussianBlur(0.8))
dark = dark.filter(ImageFilter.GaussianBlur(1.2))

tex = Image.blend(bands, noise, 0.42)
tex = ImageChops.screen(tex, light.point(lambda p: p * 0.75))
tex = ImageChops.subtract(tex, dark.point(lambda p: p * 0.55))
# inner rings bright, outer rings sink toward the page
shade = Image.new('L', (1, TH))
shade.putdata([int(255 * (1.0 - 0.62 * (y / TH) ** 0.9)) for y in range(TH)])
tex = ImageChops.multiply(tex, shade.resize((TW, TH), Image.NEAREST))
# hide the angle seam: cross-fade with a half-turn shifted copy near the edges
seam = Image.new('L', (TW, 1))
seam.putdata([int(255 * max(0.0, 1 - min(x, TW - x) / (TW * 0.12))) for x in range(TW)])
tex = Image.composite(ImageChops.offset(tex, TW // 2, 0), tex, seam.resize((TW, TH), Image.NEAREST))
tex3 = Image.new('L', (TW * 3, TH))
for i in range(3):
    tex3.paste(tex, (TW * i, 0))

# 2. Mesh warp into wobbling elliptical rings spiralling into the eye.
CELL = 8
TWIST = 1.9
LR0, LR1 = math.log(R0), math.log(R1)
mesh = []
for y0 in range(0, int(HZ) + CELL * 4, CELL):
    for x0 in range(0, W, CELL):
        src = []
        th0 = None
        for (x, y) in ((x0, y0), (x0, y0 + CELL), (x0 + CELL, y0 + CELL), (x0 + CELL, y0)):
            dx, dy = x - CX, (y - CY) / E
            r = max(1.0, math.hypot(dx, dy))
            th = math.atan2(dy, dx)
            if th0 is None:
                th0 = th
            else:
                while th - th0 > math.pi:
                    th -= math.tau
                while th - th0 < -math.pi:
                    th += math.tau
            lr = math.log(r)
            vv = (lr - LR0) / (LR1 - LR0) * TH
            vv += TH * (0.016 * math.sin(3 * th + 1.7 * lr) + 0.011 * math.sin(5 * th - 2.3 * lr + 0.7)
                        + 0.007 * math.sin(9 * th + 3.1 * lr) + 0.02 * math.sin(th + 0.9 * lr + 2.1))
            src.append((th + TWIST * lr) / math.tau * TW)
            src.append(vv)
        shift = math.floor(src[0] / TW) * TW - TW
        for i in (0, 2, 4, 6):
            src[i] -= shift
        mesh.append(((x0, y0, x0 + CELL, y0 + CELL), tuple(src)))
rings = tex3.transform((W, H), Image.MESH, mesh, Image.BILINEAR)
rings = rings.point(lambda p: int(255 * (p / 255) ** 0.78))

# 3. Colour, eye glow, radial and vertical fade.
vortex = ImageOps.colorize(rings, theme['ring_lo'], theme['ring_hi'], theme['ring_mid'], 0, 255, 128)
eye_soft = ellipse_mask(CX, CY, R0 * 5.0, R0 * 5.0 * E, R0 * 2.2).point(lambda p: p * 0.6)
eye_hard = ellipse_mask(CX, CY, R0 * 1.35, R0 * 1.35 * E, R0 * 0.4)
vortex = Image.composite(solid(theme['core']), vortex, ImageChops.lighter(eye_soft, eye_hard))

radial = layer()
rd = ImageDraw.Draw(radial)
steps = 160
for i in range(steps):
    t = 1 - i / steps                      # 1 = outer, 0 = eye
    r = R1 * (0.42 + 0.58 * t)
    a = 1 - t ** 1.6
    rd.ellipse([CX - r, CY - r * E, CX + r, CY + r * E], fill=int(255 * a))
radial = radial.filter(ImageFilter.GaussianBlur(6 * K))
fade = vgrad([(0, 0), (H * 0.09, 0), (H * 0.42, 255)])
sky_alpha = ImageChops.multiply(radial, fade)

img = solid(theme['bg'])
img = Image.composite(vortex, img, sky_alpha)

# ---------------------------------------------------------------- ground
plain = Image.composite(solid(theme['plain_lo']), solid(theme['plain_hz']),
                        vgrad([(HZ, 0), (H, 255)]))
pool = ellipse_mask(CX, HZ, W * 0.30, H * 0.11, 40 * K).point(lambda p: p * 0.8)
plain = Image.composite(solid(theme['plain_lit']), plain, pool)
ripples = layer()
rp = ImageDraw.Draw(ripples)
for _ in range(2600):
    y = HZ + (H - HZ) * random.random() ** 0.6
    depth = (y - HZ) / (H - HZ)
    x = random.uniform(-W * 0.1, W * 1.1)
    ln = random.uniform(8, 60) * K * (0.3 + depth)
    rp.line([(x, y), (x + ln, y + random.uniform(-1, 1) * K)],
            fill=int(random.uniform(40, 140)), width=max(1, round(K * (0.5 + depth * 1.5))))
ripples = ripples.filter(ImageFilter.GaussianBlur(1.2 * K))
plain = Image.composite(solid(theme['plain_lo']), plain, ripples.point(lambda p: p * 0.5))
plain = Image.composite(solid(theme['plain_lit']), plain,
                        ImageChops.offset(ripples, 0, 2 * K).point(lambda p: p * 0.35))
ground_mask = layer()
ImageDraw.Draw(ground_mask).rectangle([0, HZ, W, H], fill=255)
img = Image.composite(plain, img, ground_mask)


# ---------------------------------------------------------------- mountains
def ridge(points, trees, colour, blur):
    """Fill below a jagged ridge line and fringe it with small pines."""
    m = layer()
    d = ImageDraw.Draw(m)
    poly = list(points) + [(points[-1][0], HZ + 30 * K), (points[0][0], HZ + 30 * K)]
    d.polygon(poly, fill=255)
    for i in range(len(points) - 1):
        (xa, ya), (xb, yb) = points[i], points[i + 1]
        n = int(abs(xb - xa) / (5 * K)) + 1
        for j in range(n):
            t = j / n
            x = xa + (xb - xa) * t
            y = ya + (yb - ya) * t
            th = trees * random.uniform(0.5, 1.4)
            hw = th * random.uniform(0.25, 0.45)
            d.polygon([(x - hw, y + 2 * K), (x, y - th), (x + hw, y + 2 * K)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    return m


def ridge_points(x_start, x_end, y_start, y_end, n, rough):
    pts = []
    for i in range(n + 1):
        t = i / n
        y = y_start + (y_end - y_start) * (t ** 1.35)
        y += rough * (math.sin(t * 9.1 + x_start) + 0.6 * math.sin(t * 23 + 1.3) + random.uniform(-0.5, 0.5))
        pts.append((x_start + (x_end - x_start) * t, y))
    pts[-1] = (pts[-1][0], HZ + 3 * K)
    return pts


far_l = ridge(ridge_points(-20 * K, W * 0.40, H * 0.44, HZ, 40, 9 * K), 4 * K, theme['mtn_far'], 2.5 * K)
far_r = ridge(ridge_points(W + 20 * K, W * 0.60, H * 0.47, HZ, 40, 9 * K), 4 * K, theme['mtn_far'], 2.5 * K)
near_l = ridge(ridge_points(-20 * K, W * 0.31, H * 0.34, HZ, 36, 12 * K), 7 * K, theme['mtn_near'], 1.0 * K)
near_r = ridge(ridge_points(W + 20 * K, W * 0.71, H * 0.38, HZ, 36, 12 * K), 7 * K, theme['mtn_near'], 1.0 * K)
sky_only = ImageChops.invert(ground_mask)
far = ImageChops.multiply(ImageChops.lighter(far_l, far_r), sky_only)
near = ImageChops.multiply(ImageChops.lighter(near_l, near_r), sky_only)
# the far range sits in haze: the page colour bleeds into it near the top
far_col = Image.composite(solid(theme['mtn_far']), solid(theme['bg']), vgrad([(H * 0.30, 0), (H * 0.62, 255)]))
img = Image.composite(far_col, img, ImageChops.multiply(far, fade))
img = Image.composite(solid(theme['mtn_near']), img, near)

# haze: a soft band of light where the wormhole meets the valley floor
haze = ellipse_mask(CX, HZ, W * 0.42, H * 0.06, 18 * K)
haze = ImageChops.multiply(haze, ImageChops.invert(ground_mask)).point(lambda p: p * 0.5)
img = Image.composite(solid(theme['plain_lit']), img, haze)

# ---------------------------------------------------------------- town
town = layer()
td = ImageDraw.Draw(town)
x = CX - W * 0.062
while x < CX + W * 0.018:
    bw = random.uniform(4, 11) * K
    bh = random.uniform(3, 9) * K
    base = HZ + 1 * K
    td.rectangle([x, base - bh, x + bw, base], fill=255)
    if random.random() < 0.7:
        td.polygon([(x - 1 * K, base - bh), (x + bw / 2, base - bh - bw * 0.45), (x + bw + 1 * K, base - bh)], fill=255)
    x += bw + random.uniform(0.5, 3) * K
sx, sb = CX - W * 0.026, HZ + 1 * K
td.rectangle([sx - 3.5 * K, sb - 18 * K, sx + 3.5 * K, sb], fill=255)
td.polygon([(sx - 4.5 * K, sb - 18 * K), (sx, sb - 38 * K), (sx + 4.5 * K, sb - 18 * K)], fill=255)
td.line([(sx, sb - 45 * K), (sx, sb - 36 * K)], fill=255, width=max(1, K))
td.line([(sx - 2.5 * K, sb - 42.5 * K), (sx + 2.5 * K, sb - 42.5 * K)], fill=255, width=max(1, K))
town = town.filter(ImageFilter.GaussianBlur(0.5 * K))
img = Image.composite(solid(theme['town']), img, town)

# ---------------------------------------------------------------- figures
SS = 4
fig = layer()
rim = layer()
shadow = layer()
sd = ImageDraw.Draw(shadow)


def cr_spline(pts, n=12, closed=False):
    """Catmull-Rom curve through pts; returns a dense point list."""
    out = []
    m = len(pts)
    for i in range(m if closed else m - 1):
        p0 = pts[(i - 1) % m] if closed else pts[max(i - 1, 0)]
        p1, p2 = pts[i], pts[(i + 1) % m]
        p3 = pts[(i + 2) % m] if closed else pts[min(i + 2, m - 1)]
        for j in range(n):
            t = j / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2
                                    + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3) for k in (0, 1)))
    if not closed:
        out.append(pts[-1])
    return out


def limb(d, pts, w0, w1, n=10):
    """A tapered limb along a spline centreline with round caps."""
    c = cr_spline(pts, n)
    left, right = [], []
    last = len(c) - 1
    for i, (x, y) in enumerate(c):
        (xa, ya), (xb, yb) = c[max(i - 1, 0)], c[min(i + 1, last)]
        tx, ty = xb - xa, yb - ya
        ln = math.hypot(tx, ty) or 1
        nx, ny = -ty / ln, tx / ln
        w = (w0 + (w1 - w0) * i / last) / 2
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    d.polygon(left + right[::-1], fill=255)
    for (x, y), w in ((c[0], w0), (c[-1], w1)):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)


def person(d, u, ox, oy, p):
    """Back view of a standing person, height u, feet at oy. Coordinates in
    p are fractions of u: x from the spine, y from the top of the head."""
    top = oy - u

    def P(x, y):
        return (ox + x * u, top + y * u)

    def blob(pts, n=10):
        d.polygon(cr_spline([P(x, y) for x, y in pts], n, closed=True), fill=255)

    def mirror(right):
        # the left side is a hair wider and lower, so the silhouette is not a mirror
        return right + [(-x * 1.03, y + 0.004) for x, y in reversed(right)]

    hw, hh = p['head']
    d.ellipse([ox - hw * u / 2, top, ox + hw * u / 2, top + hh * u], fill=255)
    blob(p['hair'])
    if 'neck' in p:
        nw, y0, y1 = p['neck']
        d.rectangle([ox - nw * u / 2, top + y0 * u, ox + nw * u / 2, top + y1 * u], fill=255)
    if 'collar' in p:
        cw, y0, y1 = p['collar']
        d.rounded_rectangle([ox - cw * u / 2, top + y0 * u, ox + cw * u / 2, top + y1 * u], radius=0.012 * u, fill=255)
    blob(mirror(p['torso']))
    for side in (1, -1):
        for pts, w0, w1 in p['arms']:
            limb(d, [P(x * side, y) for x, y in pts], w0 * u, w1 * u)
    if 'hands' in p:
        hx, hy, ww, hh2 = p['hands']
        for side in (1, -1):
            x, y = P(hx * side, hy)
            d.ellipse([x - ww * u / 2, y - hh2 * u / 2, x + ww * u / 2, y + hh2 * u / 2], fill=255)
    lw0, lw1 = p['legw']
    for pts in p['legs']:
        limb(d, [P(x, y) for x, y in pts], lw0 * u, lw1 * u)
        ax, ay = pts[-1]
        sw, sh = p['shoe']
        out = 0.01 if ax > 0 else -0.01
        x, y = P(ax + out, 1.0)
        d.rounded_rectangle([x - sw * u / 2, y - sh * u, x + sw * u / 2, y], radius=0.012 * u, fill=255)
    if 'pack' in p:
        pw, y0, y1 = p['pack']
        d.rounded_rectangle([ox - pw * u / 2, top + y0 * u, ox + pw * u / 2, top + y1 * u], radius=0.035 * u, fill=255)
        d.arc([ox - 0.03 * u, top + (y0 - 0.03) * u, ox + 0.03 * u, top + (y0 + 0.03) * u], 180, 360,
              fill=255, width=max(2, int(0.012 * u)))


CHILD = dict(
    head=(0.16, 0.20),
    hair=[(0, -0.012), (0.03, -0.018), (0.06, -0.002), (0.082, 0.04), (0.09, 0.09), (0.082, 0.135), (0.05, 0.155),
          (0, 0.145), (-0.05, 0.155), (-0.082, 0.135), (-0.09, 0.09), (-0.082, 0.04), (-0.055, 0.0), (-0.025, -0.02)],
    neck=(0.05, 0.18, 0.25),
    torso=[(0.045, 0.235), (0.115, 0.255), (0.125, 0.31), (0.112, 0.42), (0.105, 0.50), (0.115, 0.59), (0.04, 0.598)],
    pack=(0.245, 0.205, 0.475),
    arms=[([(0.105, 0.27), (0.165, 0.42), (0.20, 0.55)], 0.062, 0.046)],
    hands=(0.205, 0.575, 0.05, 0.062),
    legw=(0.082, 0.052),
    legs=[[(0.045, 0.58), (0.05, 0.79), (0.052, 0.96)], [(-0.045, 0.58), (-0.052, 0.79), (-0.055, 0.96)]],
    shoe=(0.09, 0.045),
)
TEEN = dict(
    head=(0.12, 0.143),
    hair=[(0, -0.012), (0.025, -0.02), (0.045, -0.006), (0.062, 0.02), (0.07, 0.05), (0.068, 0.085), (0.05, 0.11),
          (0.02, 0.10), (-0.015, 0.108), (-0.05, 0.112), (-0.07, 0.08), (-0.072, 0.045), (-0.06, 0.01), (-0.035, -0.018),
          (-0.015, -0.008)],                                                                   # short, a little messy
    neck=(0.045, 0.13, 0.215),
    torso=[(0.06, 0.20), (0.118, 0.225), (0.124, 0.29), (0.11, 0.40), (0.10, 0.48), (0.106, 0.565), (0.04, 0.572)],
    arms=[([(0.11, 0.24), (0.14, 0.33), (0.142, 0.40)], 0.058, 0.05),
          ([(0.142, 0.40), (0.11, 0.46), (0.07, 0.50)], 0.05, 0.04)],                              # hands in pockets
    legw=(0.07, 0.042),
    legs=[[(0.045, 0.55), (0.05, 0.78), (0.052, 0.96)], [(-0.045, 0.55), (-0.072, 0.77), (-0.06, 0.96)]],
    shoe=(0.08, 0.04),
)
ADULT = dict(
    head=(0.105, 0.133),
    hair=[(0, -0.006), (0.035, -0.008), (0.058, 0.02), (0.063, 0.065), (0.05, 0.105), (0, 0.092),
          (-0.05, 0.105), (-0.063, 0.065), (-0.058, 0.02), (-0.035, -0.008)],
    neck=(0.045, 0.12, 0.175),
    collar=(0.13, 0.15, 0.19),
    torso=[(0.05, 0.168), (0.118, 0.20), (0.134, 0.27), (0.12, 0.37), (0.106, 0.46), (0.12, 0.55), (0.15, 0.64), (0.05, 0.646)],
    arms=[([(0.112, 0.215), (0.15, 0.40), (0.158, 0.565)], 0.062, 0.042)],
    hands=(0.162, 0.585, 0.045, 0.06),
    legw=(0.085, 0.05),
    legs=[[(0.055, 0.60), (0.06, 0.80), (0.062, 0.96)], [(-0.055, 0.60), (-0.062, 0.80), (-0.066, 0.96)]],
    shoe=(0.095, 0.045),
)


def draw_child(d, u, ox, oy):
    person(d, u, ox, oy, CHILD)


def draw_teen(d, u, ox, oy):
    person(d, u, ox, oy, TEEN)


def draw_adult(d, u, ox, oy):
    person(d, u, ox, oy, ADULT)


def place(draw_fn, fx, fy, h):
    box_w, box_h = int(h * 1.2), int(h * 1.15)
    tile = Image.new('L', (box_w * SS, box_h * SS), 0)
    d = ImageDraw.Draw(tile)
    draw_fn(d, h * SS, box_w * SS / 2, box_h * SS - 6 * SS)
    # rim light from the wormhole behind: the outline glows, most on top
    edge = ImageChops.subtract(tile, tile.filter(ImageFilter.MinFilter(3 * SS + 1)))
    edge = edge.filter(ImageFilter.GaussianBlur(SS * 0.8))
    tile_s = tile.resize((box_w, box_h), Image.LANCZOS)
    edge_s = edge.resize((box_w, box_h), Image.LANCZOS)
    x0, y0 = int(fx - box_w / 2), int(fy - box_h + 6)
    fig.paste(ImageChops.lighter(fig.crop((x0, y0, x0 + box_w, y0 + box_h)), tile_s), (x0, y0))
    rim.paste(ImageChops.lighter(rim.crop((x0, y0, x0 + box_w, y0 + box_h)), edge_s), (x0, y0))
    # shadow: from the feet toward us, away from the light, fading with distance
    lx, ly = CX, HZ - H * 0.16
    ang = math.atan2(fy - ly, fx - lx)
    ln = h * 2.6
    segs = 28
    for i in range(segs):
        t0, t1 = i / segs, (i + 1) / segs
        w0, w1 = h * (0.16 + 0.22 * t0), h * (0.16 + 0.22 * t1)
        p0 = (fx + math.cos(ang) * ln * t0, fy + math.sin(ang) * ln * t0 * 0.62)
        p1 = (fx + math.cos(ang) * ln * t1, fy + math.sin(ang) * ln * t1 * 0.62)
        a = 255 * (1 - t0) ** 1.4
        sd.polygon([(p0[0] - w0, p0[1]), (p0[0] + w0, p0[1]), (p1[0] + w1, p1[1]), (p1[0] - w1, p1[1])], fill=int(a))


FY = H * 0.795
figures = [
    (draw_child, W * 0.345, FY, H * 0.135),
    (draw_teen, W * 0.50, FY, H * 0.19),
    (draw_adult, W * 0.655, FY, H * 0.235),
]
for fn, fx, fy, h in figures:
    place(fn, fx, fy, h)

shadow = shadow.filter(ImageFilter.GaussianBlur(5 * K))
shadow = ImageChops.multiply(shadow, ground_mask)
img = Image.composite(solid(theme['shadow']), img, shadow.point(lambda p: p * theme['shadow_a']))
img = Image.composite(solid(theme['figure']), img, fig.filter(ImageFilter.GaussianBlur(0.35 * K)))
rim_grad = vgrad([(FY - H * 0.24, 255), (FY, 60)])
img = Image.composite(solid(theme['rim']), img, ImageChops.multiply(rim, rim_grad))

# ---------------------------------------------------------------- print
img = img.resize((W // K, H // K), Image.LANCZOS)
w, h = img.size
fade_s = fade.resize((w, h), Image.LANCZOS)
g = Image.effect_noise((w, h), 26)
hi = ImageChops.multiply(g.point(lambda p: max(0, p - 128) * theme['grain']), fade_s)
lo = ImageChops.multiply(g.point(lambda p: max(0, 128 - p) * theme['grain']), fade_s)
chans = [ImageChops.subtract(ImageChops.add(c, hi), lo) for c in img.split()]
img = Image.merge('RGB', chans)
scr = Image.new('L', (w, h), 0)
scd = ImageDraw.Draw(scr)
for _ in range(4):
    x = random.uniform(w * 0.05, w * 0.95)
    y0 = random.uniform(0, h * 0.5)
    y1 = y0 + random.uniform(h * 0.15, h * 0.6)
    scd.line([(x, y0), (x + random.uniform(-3, 3), y1)], fill=theme['scratch_a'], width=1)
scr = ImageChops.multiply(scr, fade_s)
img = Image.composite(Image.new('RGB', (w, h), theme['scratch']), img, scr)

img.save(sys.argv[2])
print('saved', name, img.size)
if len(sys.argv) > 3:
    prefix = sys.argv[3]
    for width, q in ((2400, 60), (1200, 72)):
        out = img if width == w else img.resize((width, width * h // w), Image.LANCZOS)
        path = f'{prefix}-{width}.webp'
        out.save(path, 'WEBP', quality=q, method=6)
        print('wrote', path)
