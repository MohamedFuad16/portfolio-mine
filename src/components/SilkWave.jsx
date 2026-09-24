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
          const [r, g, b] = ramp(0.15 + face * 0.75 + 0.1 * Math.sin(u * 5 + time * 0.3));
          context.fillStyle = `rgba(${r}, ${g}, ${b}, ${ribbon.alpha * (0.35 + 0.65 * taper)})`;
          context.fillRect(x, centre - half, step + 0.6, half * 2);
          // Sheen along the fold where the ribbon turns edge-on.
          const sheen = Math.pow(1 - Math.abs(Math.cos(twist)), 3);
          if (sheen > 0.05) {
            context.fillStyle = `rgba(255, 250, 242, ${0.55 * sheen * taper})`;
            context.fillRect(x, centre - half * 0.5, step + 0.6, half);
          }
        }
      });
    };

    const loop = (now) => {
      if (visible) draw(now);
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
    });
    io.observe(canvas);
    if (reducedMotion) draw(start + 4000);
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className={`silk-wave ${className}`} aria-hidden="true" />;
}
