import { useEffect, useRef } from 'react';

const CELL_SIZE = 512;
const COLUMNS = 6;
const ROWS = 4;
const FRAMES_PER_ATLAS = 23;
const FRAME_COUNT = 46;
const TRANSITION_MS = 280;

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
const without = (frames, skip) => frames.filter((frame) => !skip.includes(frame));

// The original playful sheet continues into a generated turn/back-view pass.
// That pass contains a visibly broken in-between, so the portrait interaction
// uses only the clean reach frames and then retracts the paw once.
const playfulReachFrames = [...range(8, 22), ...range(8, 21).reverse()];

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

// ---------------------------------------------------------------------------
// Atlas loading. Decoded atlases are shared by every mascot instance and
// capped so a long session does not keep all 14 sheets (~25 MB each at full
// size) resident. Entries in use stay referenced by the player, so eviction
// only drops the cache's own handle.

const MAX_CACHED_ATLASES = 8;
const atlasCache = new Map();

// Half-size atlases (256px cells, public/media/mascot/256/) serve the small
// on-page cat at about a third of the bytes; full atlases only when a canvas
// really needs 512px cells.
const clipUrl = (clip, suffix, cell = CELL_SIZE) =>
  cell <= 256 ? `/media/mascot/256/daijin-${clip}-${suffix}.webp` : `/media/mascot/daijin-${clip}-${suffix}.webp`;

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

// Decodes off the main thread and, when the canvas is small, straight to a
// smaller cell size. Safari versions without resize options fall back to a
// full-size <img>.
const decodeAtlas = async (url, cell) => {
  if (cell < CELL_SIZE && typeof createImageBitmap === 'function') {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`atlas ${response.status}`);
      const blob = await response.blob();
      return await createImageBitmap(blob, {
        resizeWidth: COLUMNS * cell,
        resizeHeight: ROWS * cell,
        resizeQuality: 'high',
      });
    } catch {
      // fall through to the full-size decode
    }
  }
  return loadImage(url);
};

const getAtlas = (url, cell = CELL_SIZE) => {
  const key = `${url}@${cell}`;
  let entry = atlasCache.get(key);
  if (entry) {
    atlasCache.delete(key);
  } else {
    entry = decodeAtlas(url, cell).catch((error) => {
      atlasCache.delete(key);
      throw error;
    });
  }
  atlasCache.set(key, entry);
  while (atlasCache.size > MAX_CACHED_ATLASES) atlasCache.delete(atlasCache.keys().next().value);
  return entry;
};

const clipFrames = (timing) => timing.frames ?? range(0, FRAME_COUNT - 1);

const loadClipAtlases = (clip, frames, cell) => {
  const needsSecondAtlas = frames.some((frame) => frame >= FRAMES_PER_ATLAS);
  return Promise.all((needsSecondAtlas ? ['a', 'b'] : ['a']).map((suffix) => getAtlas(clipUrl(clip, suffix, cell), cell)));
};

// ---------------------------------------------------------------------------
// Clip mode: plays one clip, optionally looping, restarted by playKey.

const frameAt = (elapsedMs, timing, loop) => {
  const frames = clipFrames(timing);
  const position = Math.max(0, Math.floor((elapsedMs * timing.fps) / 1000));
  return frames[loop ? position % frames.length : Math.min(frames.length - 1, position)];
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

function ClipMascot({ clip, loop, reducedMotion, playKey, className }) {
  const safeClip = clipTimings[clip] ? clip : 'idle';
  const mascotRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
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
      const atlases = await loadClipAtlases(safeClip, clipFrames(timing), CELL_SIZE);
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
  }, [loop, reducedMotion, safeClip, playKey]);

  return (
    <span
      ref={mascotRef}
      className={`daijin-mascot ${className}`}
      data-mode="clip"
      data-clip={safeClip}
      data-frame="1"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} width={CELL_SIZE} height={CELL_SIZE} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Ambient mode: an idle loop with randomised one-shots blended in and out.
//
// Each sheet was generated with its own framing: idle sits smaller and to the
// right, the others are 4-17% larger and further left. Crossfading them raw
// shows two cats. `fit` maps a clip's cell into idle's cell (scale s, then
// offset dx/dy in 512-px cell units), measured by aligning each clip's first
// and last used frame against idle frame 0. The fit is interpolated across
// the clip so both ends line up with idle.
//
// Frames skipped below have black matte fringes from generation (verified on
// a contact sheet): happy 35, curious 21, listening 27 and 39, thinking 23 and
// 35. Playful keeps to its reach frames; frame 8 is a different pose from idle,
// so playful gets a slightly longer blend (280 ms). Longer blends leave a
// grey ghost of the other pose visible on the dark theme.

const ambientClips = {
  idle: { fps: 16, tween: true, frames: range(0, 45), fit: [[1, 0, 0], [1, 0, 0]] },
  happy: { fps: 22, tween: true, frames: without(range(0, 45), [35]), fit: [[0.95, 76, 8], [0.96, 76, 8]], blendIn: 200, blendOut: 240 },
  curious: { fps: 20, frames: without(range(0, 45), [21]), fit: [[0.92, 144, 4], [0.9, 144, 0]], blendIn: 220, blendOut: 240 },
  playful: { fps: 14, frames: playfulReachFrames, fit: [[0.9, 132, 20], [0.9, 132, 20]], blendIn: 280, blendOut: 280 },
  clever: { fps: 20, frames: range(0, 45), fit: [[0.96, 32, -8], [0.92, 40, 0]], blendIn: 200, blendOut: 260 },
  listening: { fps: 20, frames: without(range(0, 45), [27, 39]), fit: [[0.87, 140, 12], [0.89, 136, 4]], blendIn: 220, blendOut: 240 },
  thinking: { fps: 20, frames: without(range(0, 45), [23, 35]), fit: [[0.83, 56, 36], [0.86, 52, 20]], blendIn: 220, blendOut: 260 },
};
const clipIds = Object.fromEntries(Object.keys(ambientClips).map((name, index) => [name, index]));

// Idle-space bounds of every frame above, fitted, is x 44..587, y 27..452.
// VIEW scales that into the cell with ~22 px side margins and room under the
// feet for the shadow. Idle's feet land at 49.6% / 88.6% of the box.
const VIEW = { scale: 0.86, x: -15, y: 89 };
const FEET = { x: '49.6%', y: '88.6%' };

const ONE_SHOT_POOL = [
  ['happy', 3],
  ['curious', 2],
  // playful is left out of the ambient pool: its first frame has the paw up
  // and cannot be aligned to idle, so its blend shows a brief ghost on the
  // dark theme. It still plays as a hover / scroll-in reaction.
  ['clever', 2],
  ['listening', 1],
  ['thinking', 1],
];
const REACTIONS = ['happy', 'playful'];
const GAP_MIN_MS = 3500;
const GAP_MAX_MS = 7000;
const FIRST_GAP_MS = [1800, 3200];
// Frame-to-frame tweening is only on for idle and happy, whose neighbouring
// frames differ little; on playful/curious/thinking the paw and head move far
// enough between frames that a half-alpha next frame reads as a ghost limb.
// Tweening is quantised so the canvas redraws at most a few
// times per source frame rather than on every display frame.
const TWEEN_STEPS = 4;
const BLEND_STEPS = 12;
const MAX_TICK_MS = 100;

const randomBetween = (min, max) => min + Math.random() * (max - min);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

const pickOneShot = (avoid) => {
  const pool = ONE_SHOT_POOL.filter(([name]) => name !== avoid);
  const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [name, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return name;
  }
  return pool[0][0];
};

// Samples a clip at virtual time t into at most two weighted frames.
const sampleClip = (name, t, loop, out, weight) => {
  const clip = ambientClips[name];
  const frames = clip.frames;
  const position = Math.max(0, (t * clip.fps) / 1000);
  let index = Math.floor(position);
  let tween = clip.tween ? Math.floor((position - index) * TWEEN_STEPS) / TWEEN_STEPS : 0;
  let next = index + 1;
  if (loop) {
    index %= frames.length;
    next = (index + 1) % frames.length;
  } else if (index >= frames.length - 1) {
    index = frames.length - 1;
    next = index;
    tween = 0;
  }
  const progress = frames.length > 1 ? Math.min(1, index / (frames.length - 1)) : 0;
  const [start, end] = clip.fit;
  const s = start[0] + (end[0] - start[0]) * progress;
  const dx = start[1] + (end[1] - start[1]) * progress;
  const dy = start[2] + (end[2] - start[2]) * progress;
  // Drawn source-over: the next frame at partial alpha over the current one.
  out.push({ clip: name, frame: frames[index], weight, s, dx, dy });
  if (tween > 0) out.push({ clip: name, frame: frames[next], weight: weight * tween, s, dx, dy });
};

function AmbientMascot({ reducedMotion, playKey, className }) {
  const mascotRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const firstKeyRef = useRef(playKey);

  useEffect(() => {
    const root = mascotRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!root || !canvas || !context) return undefined;

    let disposed = false;
    let request = 0;
    let lastNow = 0;
    let clock = 0; // virtual ms; only advances while visible
    let onScreen = true;
    let lastKey = '';
    let cell = CELL_SIZE;
    const atlases = new Map(); // clip -> decoded atlas array
    const pending = new Map(); // clip -> promise

    // idle runs on its own clock so it never restarts; a one-shot has
    // `active`, and a crossfade remembers what it is fading out of.
    let active = null; // { name, start }
    let fade = null; // { from: {name,start,frozenAt}|null, to: {name,start}|null, start, duration }
    let nextName = null;
    let nextAt = clock + randomBetween(...FIRST_GAP_MS);
    let lastOneShot = null;

    const setData = (key, value) => {
      if (root.dataset[key] !== value) root.dataset[key] = value;
    };

    const ensure = (name) => {
      if (atlases.has(name)) return Promise.resolve(atlases.get(name));
      if (pending.has(name)) return pending.get(name);
      const promise = loadClipAtlases(name, ambientClips[name].frames, cell).then((list) => {
        pending.delete(name);
        if (!disposed) atlases.set(name, list);
        return list;
      });
      promise.catch(() => pending.delete(name));
      pending.set(name, promise);
      return promise;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const size = Math.max(64, Math.min(CELL_SIZE, Math.round(Math.max(rect.width, rect.height) * ratio)));
      // 132px at 2x is 264px: 256px cells are indistinguishable there.
      const wantedCell = size <= 300 ? 256 : CELL_SIZE;
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
        lastKey = '';
      }
      if (wantedCell > cell) {
        // grew past the decoded resolution: re-decode what we hold
        cell = wantedCell;
        const names = [...atlases.keys()];
        atlases.clear();
        names.forEach((name) => ensure(name).catch(() => {}));
      } else if (!atlases.size && !pending.size) {
        cell = wantedCell;
      }
    };

    const startOneShot = (name) => {
      // Fade out of whatever is most visible now: the running one-shot, or
      // the clip still blending back to idle.
      let current = null;
      if (active) current = { name: active.name, start: active.start, frozenAt: clock };
      else if (fade?.from && !fade.to && clock - fade.start < fade.duration / 2) current = fade.from;
      fade = { from: current, to: { name, start: clock }, start: clock, duration: ambientClips[name].blendIn };
      active = { name, start: clock };
      lastOneShot = name;
      nextName = pickOneShot(name);
      ensure(nextName).catch(() => {});
    };

    const finishOneShot = () => {
      fade = {
        from: { name: active.name, start: active.start, frozenAt: clock },
        to: null,
        start: clock,
        duration: ambientClips[active.name].blendOut,
      };
      active = null;
      nextAt = clock + randomBetween(GAP_MIN_MS, GAP_MAX_MS);
      if (!nextName) nextName = pickOneShot(lastOneShot);
      ensure(nextName).catch(() => {});
    };

    const layers = [];
    const pushState = (state, weight) => {
      if (weight <= 0) return;
      if (!state) {
        sampleClip('idle', clock, true, layers, weight);
      } else {
        const t = (state.frozenAt ?? clock) - state.start;
        sampleClip(state.name, t, false, layers, weight);
      }
    };

    const compose = () => {
      layers.length = 0;
      if (reducedMotion) {
        layers.push({ clip: 'idle', frame: 0, weight: 1, s: 1, dx: 0, dy: 0 });
        return;
      }
      if (fade) {
        const raw = Math.min(1, (clock - fade.start) / fade.duration);
        const mix = Math.round(easeInOut(raw) * BLEND_STEPS) / BLEND_STEPS;
        if (raw >= 1) {
          fade = null;
        } else {
          // Overlapped fade: the incoming pose becomes solid over the first
          // 60% while the outgoing one stays solid underneath and only fades
          // in the last 60%. A plain dissolve left the body see-through on
          // the dark theme whenever the two poses differ.
          const outgoing = 1 - Math.min(1, Math.max(0, (mix - 0.4) / 0.6));
          const incoming = Math.min(1, mix / 0.6);
          pushState(fade.from, outgoing);
          pushState(fade.to, incoming);
          return;
        }
      }
      pushState(active, 1);
    };

    const draw = () => {
      // Reduced motion can ask for a frame before any clip is pushed; with no
      // layers the lead lookup below read `.weight` of undefined and threw.
      if (!layers.length) return false;
      const size = canvas.width;
      const k = size / CELL_SIZE;
      let key = `${size}`;
      for (const layer of layers) {
        const scale = k * VIEW.scale * layer.s;
        layer.x = Math.round((VIEW.x + VIEW.scale * layer.dx) * k * 4) / 4;
        layer.y = Math.round((VIEW.y + VIEW.scale * layer.dy) * k * 4) / 4;
        layer.size = Math.round(CELL_SIZE * scale * 4) / 4;
        key += `|${clipIds[layer.clip]}.${layer.frame}.${layer.weight.toFixed(3)}.${layer.x}.${layer.y}.${layer.size}`;
      }
      if (key === lastKey) return false;
      lastKey = key;

      context.clearRect(0, 0, size, size);
      for (const layer of layers) {
        const list = atlases.get(layer.clip);
        const atlasIndex = layer.frame < FRAMES_PER_ATLAS ? 0 : 1;
        const atlas = list[atlasIndex];
        const source = atlas.width / COLUMNS;
        const local = layer.frame % FRAMES_PER_ATLAS;
        context.globalAlpha = layer.weight;
        context.drawImage(
          atlas,
          (local % COLUMNS) * source,
          Math.floor(local / COLUMNS) * source,
          source,
          source,
          layer.x,
          layer.y,
          layer.size,
          layer.size
        );
      }
      context.globalAlpha = 1;

      const lead = layers[layers.length - 1].weight >= 0.5 ? layers[layers.length - 1] : layers[0];
      setData('clip', lead.clip);
      setData('frame', String(lead.frame + 1));
      return true;
    };

    const ready = () => layers.every((layer) => atlases.has(layer.clip));

    const tick = (now) => {
      request = 0;
      if (disposed) return;
      const began = performance.now();
      clock += Math.min(MAX_TICK_MS, Math.max(0, now - lastNow));
      lastNow = now;

      if (active) {
        const clip = ambientClips[active.name];
        if (((clock - active.start) * clip.fps) / 1000 >= clip.frames.length - 1) finishOneShot();
      } else if (clock >= nextAt && nextName && atlases.has(nextName) && !fade) {
        startOneShot(nextName);
      }

      compose();
      let drew = false;
      if (ready()) drew = draw();
      // Opt-in probe for the verification harness; costs one lookup otherwise.
      globalThis.__daijinProbe?.(performance.now() - began, drew, clock);
      schedule();
    };

    const awake = () => onScreen && document.visibilityState === 'visible' && !reducedMotion;

    function schedule() {
      if (request || disposed || !awake()) return;
      request = requestAnimationFrame(tick);
    }

    const wake = () => {
      if (reducedMotion) return;
      const running = awake();
      root.classList.toggle('is-asleep', !running);
      setData('state', running ? 'running' : 'asleep');
      if (running && !request) {
        lastNow = performance.now();
        schedule();
      } else if (!running && request) {
        cancelAnimationFrame(request);
        request = 0;
      }
    };

    engineRef.current = {
      react() {
        if (reducedMotion) return;
        // Ignore repeat hovers while a reaction is still on screen.
        if (active && REACTIONS.includes(active.name)) return;
        const choices = REACTIONS.filter((name) => name !== lastOneShot);
        const name = choices[Math.floor(Math.random() * choices.length)] ?? 'happy';
        if (atlases.has(name)) startOneShot(name);
        else ensure(name).then(() => !disposed && !active && startOneShot(name)).catch(() => {});
        wake();
      },
    };

    resize();
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      resize();
      if (reducedMotion && ready()) draw();
    }) : null;
    resizeObserver?.observe(canvas);

    const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      wake();
    }) : null;
    intersection?.observe(root);
    document.addEventListener('visibilitychange', wake);

    // Nothing is downloaded until the cat is within ~800px of the viewport:
    // it lives at the bottom of the page, so most first loads never need it.
    let booted = false;
    const boot = () => {
      if (booted) return;
      booted = true;
      ensure('idle')
        .then(() => {
          if (disposed) return;
          if (reducedMotion) {
            compose();
            draw();
            setData('state', 'still');
            return;
          }
          // Reactions should not wait on the network when the card is hovered.
          REACTIONS.forEach((name) => ensure(name).catch(() => {}));
          nextName = pickOneShot(null);
          ensure(nextName).catch(() => {});
          wake();
        })
        .catch(() => setData('loadState', 'failed'));
    };
    const nearby = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            nearby.disconnect();
            boot();
          }
        }, { rootMargin: '800px 0px' })
      : null;
    if (nearby) nearby.observe(root);
    else boot();

    return () => {
      disposed = true;
      engineRef.current = null;
      if (request) cancelAnimationFrame(request);
      resizeObserver?.disconnect();
      intersection?.disconnect();
      nearby?.disconnect();
      document.removeEventListener('visibilitychange', wake);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (playKey === firstKeyRef.current) return;
    firstKeyRef.current = playKey;
    if (reducedMotion) return;
    engineRef.current?.react();
    // A short hop on the body wrapper. The individual `translate`/`scale`
    // properties compose with the CSS bob, which animates `transform`.
    const root = mascotRef.current;
    const body = root?.querySelector('.daijin-mascot__body');
    const shadow = root?.querySelector('.daijin-mascot__shadow');
    const timing = { duration: 460, easing: 'cubic-bezier(.3,.7,.4,1)' };
    body?.animate?.([{ translate: '0 0' }, { translate: '0 -4.5%', offset: 0.4 }, { translate: '0 0' }], timing);
    shadow?.animate?.([{ scale: '1' }, { scale: '0.82', opacity: 0.65, offset: 0.4 }, { scale: '1' }], timing);
  }, [playKey, reducedMotion]);

  return (
    <span
      ref={mascotRef}
      className={`daijin-mascot daijin-mascot--ambient${reducedMotion ? ' is-still' : ''} ${className}`}
      style={{ '--daijin-feet-x': FEET.x, '--daijin-feet-y': FEET.y }}
      data-mode="ambient"
      data-clip="idle"
      data-frame="1"
      aria-hidden="true"
    >
      <span className="daijin-mascot__shadow" />
      <span className="daijin-mascot__body">
        <canvas ref={canvasRef} width={256} height={256} />
      </span>
    </span>
  );
}

export function DaijinMascot({
  mode = 'clip',
  clip = 'idle',
  loop = true,
  reducedMotion = false,
  playKey = 0,
  className = '',
}) {
  if (mode === 'ambient') {
    return <AmbientMascot reducedMotion={reducedMotion} playKey={playKey} className={className} />;
  }
  return <ClipMascot clip={clip} loop={loop} reducedMotion={reducedMotion} playKey={playKey} className={className} />;
}
