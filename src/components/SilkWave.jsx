import { useEffect, useRef } from 'react';

// A twisting silk ribbon, after Studio Bakers' "wave + gradient". Each ribbon
// is drawn as thin vertical slices: the centre line and width come from a few
// summed sines, and a twist angle decides how much of the ribbon faces the
// viewer and which side of the gradient shows. No WebGL, one 2D canvas.
const PALETTE = [
  [253, 240, 222],
  [248, 196, 128],
  [241, 128, 62],
  [226, 72, 32],
];

const mix = (a, b, t) => a + (b - a) * t;
const ramp = (t) => {
  const x = Math.min(0.999, Math.max(0, t)) * (PALETTE.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  return PALETTE[i].map((channel, k) => Math.round(mix(channel, PALETTE[i + 1][k], f)));
};

// Colour lookup: ramp() is sampled at LUT_SIZE steps once, so the draw loop
// reads a ready string instead of allocating arrays and rgba text per slice.
// Alpha goes through globalAlpha, which paints the same as rgba(..., alpha).
const LUT_SIZE = 512;
const COLOURS = Array.from({ length: LUT_SIZE }, (_, i) => {
  const [r, g, b] = ramp(i / (LUT_SIZE - 1));
  return `rgb(${r}, ${g}, ${b})`;
});
const SHEEN = 'rgb(255, 250, 242)';
// Cap the redraw rate: a slow ribbon does not need 60 fps.
const FRAME_MS = 1000 / 30;

const RIBBONS = [
  { amp: 0.2, freq: 1.3, speed: 0.22, twist: 1.6, twistSpeed: 0.35, width: 0.13, phase: 0, alpha: 0.95 },
  { amp: 0.16, freq: 1.7, speed: -0.17, twist: 2.1, twistSpeed: -0.28, width: 0.09, phase: 2.1, alpha: 0.8 },
];

export function SilkWave({ className = '', reducedMotion = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let started = false;
    let lastDraw = -Infinity;
    let cancelIdle = () => {};
    const start = performance.now();

    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now) => {
      // A zero-width canvas (hidden tab, mid-layout) makes x / width NaN, and
      // the palette lookup then throws on every frame.
      if (!width || !height) return;
      const time = (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      const step = 2;
      RIBBONS.forEach((ribbon) => {
        for (let x = 0; x <= width; x += step) {
          const u = x / width;
          const wave =
            Math.sin(Math.PI * 2 * u * ribbon.freq + time * ribbon.speed * 2 + ribbon.phase) * ribbon.amp +
            Math.sin(Math.PI * 2 * u * ribbon.freq * 0.47 - time * ribbon.speed * 1.3 + ribbon.phase * 1.7) *
              ribbon.amp *
              0.55;
          const centre = height * (0.5 + wave);
          const twist = Math.PI * 2 * u * ribbon.twist + time * ribbon.twistSpeed * 2 + ribbon.phase;
          // Taper both ends so the ribbon enters and leaves the frame softly.
          const taper = Math.sin(Math.PI * Math.min(1, Math.max(0, u * 1.08 - 0.04)));
          const half = height * ribbon.width * (0.45 + 0.55 * taper) * Math.max(0.06, Math.abs(Math.cos(twist)));
          const face = 0.5 + 0.5 * Math.sin(twist);
          const t = Math.min(0.999, Math.max(0, 0.15 + face * 0.75 + 0.1 * Math.sin(u * 5 + time * 0.3)));
          context.fillStyle = COLOURS[Math.round(t * (LUT_SIZE - 1))];
          context.globalAlpha = ribbon.alpha * (0.35 + 0.65 * taper);
          context.fillRect(x, centre - half, step + 0.6, half * 2);
          // Sheen along the fold where the ribbon turns edge-on.
          const sheen = Math.pow(1 - Math.abs(Math.cos(twist)), 3);
          if (sheen > 0.05) {
            context.fillStyle = SHEEN;
            context.globalAlpha = 0.55 * sheen * taper;
            context.fillRect(x, centre - half * 0.5, step + 0.6, half);
          }
        }
      });
      context.globalAlpha = 1;
    };

    const loop = (now) => {
      frame = 0;
      if (!visible) return;
      if (now - lastDraw >= FRAME_MS - 1) {
        lastDraw = now;
        draw(now);
      }
      frame = requestAnimationFrame(loop);
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(start + 4000);
    });
    observer.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      // Stop the loop while off screen; restart it on return.
      if (visible && started && !frame && !reducedMotion) frame = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    if (reducedMotion) draw(start + 4000);
    else {
      // Start once the page is idle so the ribbon never competes with hydration.
      const begin = () => {
        started = true;
        if (visible && !frame) frame = requestAnimationFrame(loop);
      };
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(begin, { timeout: 2000 });
        cancelIdle = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(begin, 300);
        cancelIdle = () => clearTimeout(id);
      }
    }

    return () => {
      cancelIdle();
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className={`silk-wave ${className}`} aria-hidden="true" />;
}
