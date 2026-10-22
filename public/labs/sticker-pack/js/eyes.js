import { clamp, smoothstep } from './util.js';

// Eye geometry for a shrink value s:
//   1 = tall pills, 0.55 = round dots, 0.25 = tiny dots, 0 = gone.
export function eyeSize(s, w, h) {
  const ew = w * clamp(s / 0.55, 0, 1);
  const eh = Math.max(ew, h * smoothstep(0.55, 1, s));
  return [ew, eh];
}

function pill(ctx, x, y, w, h, slant) {
  if (w <= 0.2) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(slant);
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(-r, -h / 2 + r);
  ctx.arc(0, -h / 2 + r, r, Math.PI, 0);
  ctx.lineTo(r, h / 2 - r);
  ctx.arc(0, h / 2 - r, r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draws a pair of eyes centred at (cx, cy) on a 2D canvas.
// st: { s, typing, t, happy }   o: { w, h, gap, slant, color }
export function drawEyes(ctx, cx, cy, st, o) {
  ctx.fillStyle = o.color;
  const typing = clamp(st.typing || 0, 0, 1);
  if (typing < 1) {
    ctx.globalAlpha = 1 - typing;
    if (st.happy) {
      const r = o.w * 1.15;
      ctx.lineWidth = o.w * 0.95;
      ctx.lineCap = 'round';
      ctx.strokeStyle = o.color;
      const k = clamp(st.s, 0, 1);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(o.slant);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse((side * o.gap) / 2, r * 0.4, r, Math.max(0.01, r * k), 0, Math.PI, 0);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      const [ew, eh] = eyeSize(st.s, o.w, o.h);
      pill(ctx, cx - o.gap / 2, cy, ew, eh, o.slant);
      pill(ctx, cx + o.gap / 2, cy, ew, eh, o.slant);
    }
  }
  if (typing > 0) {
    // Three-dot "working" indicator, the lit dot walks left to right.
    const r = o.w * 0.5;
    const step = o.gap * 0.62;
    for (let i = 0; i < 3; i++) {
      const phase = (st.t * 2.6 - i) % 3;
      const lit = phase >= 0 && phase < 1 ? Math.sin(phase * Math.PI) : 0;
      ctx.globalAlpha = typing * (0.3 + 0.7 * lit);
      ctx.beginPath();
      ctx.arc(cx + (i - 1) * step, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
