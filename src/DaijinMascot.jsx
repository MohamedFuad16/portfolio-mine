import { useEffect, useRef, useState } from 'react';

const CELL_SIZE = 512;
const COLUMNS = 6;
const FRAMES_PER_ATLAS = 23;
const FRAME_COUNT = 46;
const TRANSITION_MS = 280;

// The original playful sheet continues into a generated turn/back-view pass.
// That pass contains a visibly broken in-between, so the portrait interaction
// uses only the clean reach frames and then retracts the paw once.
const playfulReachFrames = [
  ...Array.from({ length: 15 }, (_, index) => index + 8),
  ...Array.from({ length: 14 }, (_, index) => 21 - index),
];

const clipTimings = {
  idle: { fps: 16 },
  listening: { fps: 20 },
  thinking: { fps: 20 },
  working: { fps: 20 },
  clever: { fps: 20 },
  playful: { fps: 14, frames: playfulReachFrames },
  curious: { fps: 20 },
  happy: { fps: 24 },
  walk: { fps: 24 },
};

const frameAt = (elapsedMs, timing, loop) => {
  const frames = timing.frames ?? Array.from({ length: FRAME_COUNT }, (_, index) => index);
  const position = Math.max(0, Math.floor((elapsedMs * timing.fps) / 1000));
  return frames[loop ? position % frames.length : Math.min(frames.length - 1, position)];
};

const clipUrl = (clip, suffix) => `/assets/daijin/daijin-${clip}-${suffix}.webp`;

const loadImage = async (url) => {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  if (image.decode) await image.decode();
  else await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  return image;
};

const drawFrame = (context, atlases, frame, alpha = 1) => {
  const atlasIndex = frame < FRAMES_PER_ATLAS ? 0 : 1;
  const localFrame = frame % FRAMES_PER_ATLAS;
  const sourceX = (localFrame % COLUMNS) * CELL_SIZE;
  const sourceY = Math.floor(localFrame / COLUMNS) * CELL_SIZE;
  context.globalAlpha = alpha;
  context.drawImage(
    atlases[atlasIndex],
    sourceX,
    sourceY,
    CELL_SIZE,
    CELL_SIZE,
    0,
    0,
    CELL_SIZE,
    CELL_SIZE
  );
};

export function DaijinMascot({ clip = 'idle', scene = 'profile', loop = true, reducedMotion = false }) {
  const safeClip = clipTimings[clip] ? clip : 'idle';
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(min-width: 761px)').matches
  );
  const mascotRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 761px)');
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isDesktop) return undefined;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return undefined;

    let cancelled = false;
    let request = 0;
    const previous = document.createElement('canvas');
    previous.width = CELL_SIZE;
    previous.height = CELL_SIZE;
    previous.getContext('2d').drawImage(canvas, 0, 0);

    const play = async () => {
      const timing = clipTimings[safeClip];
      const needsSecondAtlas = !timing.frames || timing.frames.some((frame) => frame >= FRAMES_PER_ATLAS);
      const atlases = await Promise.all(
        (needsSecondAtlas ? ['a', 'b'] : ['a']).map((suffix) => loadImage(clipUrl(safeClip, suffix)))
      );
      if (cancelled) return;

      const startedAt = performance.now();
      let lastFrame = -1;
      const tick = (now) => {
        if (cancelled) return;
        const frame = reducedMotion ? (timing.frames?.[0] ?? 0) : frameAt(now - startedAt, timing, loop);
        const transition = reducedMotion ? 1 : Math.min(1, (now - startedAt) / TRANSITION_MS);

        if (transition >= 1 && frame === lastFrame) {
          if (!reducedMotion) request = requestAnimationFrame(tick);
          return;
        }

        context.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
        if (transition < 1) {
          context.globalAlpha = 1 - transition;
          context.drawImage(previous, 0, 0);
        }
        drawFrame(context, atlases, frame, transition);
        context.globalAlpha = 1;
        lastFrame = frame;

        if (mascotRef.current) mascotRef.current.dataset.frame = String(frame + 1);
        if (!reducedMotion) request = requestAnimationFrame(tick);
      };
      request = requestAnimationFrame(tick);
    };

    play().catch(() => {
      if (mascotRef.current) mascotRef.current.dataset.loadState = 'failed';
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(request);
    };
  }, [isDesktop, loop, reducedMotion, safeClip]);

  if (!isDesktop) return null;

  return (
    <aside
      ref={mascotRef}
      className="daijin-mascot"
      data-clip={safeClip}
      data-frame="1"
      data-scene={scene}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} width={CELL_SIZE} height={CELL_SIZE} />
    </aside>
  );
}
