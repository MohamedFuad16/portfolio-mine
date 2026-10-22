import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { SPORTS } from './tinyCourts/sim';

// Tiny isometric sports courts, after Dhruv's "Small plays": a WebGL scene
// rendered at art resolution and ordered-dithered (see tinyCourts/scene.js).
// three.js loads only when the section comes near the viewport.

// One art pixel per CSS pixel, drawn as whole device pixels.
const artScale = () => Math.max(1, Math.round(window.devicePixelRatio || 1));

const pad2 = (n) => String(n).padStart(2, '0');

// The HUD's left line (clock, rally or a call) and right line (the score).
function hudLine(sport, sim, copy) {
  let left;
  let right = `${sim.score[0]} – ${sim.score[1]}`;
  if (sport.id === 'diving') {
    right = `${copy.score} ${sim.lastScore != null ? sim.lastScore.toFixed(1) : '–'}`;
    left = `${copy.dive} ${pad2(sim.dives + 1)}`;
    if (sim.flash) left = `${copy.flash[sim.flash.key]} ${sim.lastScore.toFixed(1)}`;
  } else if (sport.id === 'gaming') {
    const g = sim.game;
    right = `${copy.points} ${String(g.score).padStart(6, '0')}`;
    left = sim.flash ? copy.flash[sim.flash.key] : `${copy.level} ${pad2(g.level)}`;
  } else if (sport.id === 'tabletennis') {
    left = sim.flash ? copy.flash[sim.flash.key] : `${copy.rally} ${pad2(sim.rally)}`;
  } else {
    left = sim.flash ? copy.flash[sim.flash.key] : `${copy.shotClock} ${pad2(Math.max(0, Math.ceil(24 - (sim.time - sim.possessionAt))))}`;
  }
  return [left, right];
}

export function TinyCourts({ copy, reducedMotion = false }) {
  const [sportIndex, setSportIndex] = useState(0);
  const [paused, setPaused] = useState(reducedMotion);
  const [failed, setFailed] = useState(false);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const scoreRef = useRef(null);
  const courtsRef = useRef(null);
  const copyRef = useRef(copy);
  const sportRef = useRef(sportIndex);
  const pausedRef = useRef(paused);
  copyRef.current = copy;
  sportRef.current = sportIndex;
  pausedRef.current = paused;
  const sport = SPORTS[sportIndex];

  useEffect(() => setPaused(reducedMotion), [reducedMotion]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return undefined;
    let cancelled = false;
    let courts = null;
    let ro = null;
    let hudText = '';
    let scoreText = '';

    // Format by the sim's own sport, not the selected one: after a switch the
    // old scene keeps running until the new one is built, and reading the new
    // sport's fields off the old sim threw inside the frame loop and froze it.
    const onHud = (sim) => {
      const [nextHud, nextScore] = hudLine(sim.sport, sim, copyRef.current);
      if (nextHud !== hudText && hudRef.current) hudRef.current.textContent = hudText = nextHud;
      if (nextScore !== scoreText && scoreRef.current) scoreRef.current.textContent = scoreText = nextScore;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const scale = artScale();
      const w = Math.floor((stage.clientWidth * dpr) / scale);
      const h = Math.floor((stage.clientHeight * dpr) / scale);
      if (w < 2 || h < 2 || !courts) return;
      courts.resize(w, h);
      canvas.style.width = `${(w * scale) / dpr}px`;
      canvas.style.height = `${(h * scale) / dpr}px`;
    };

    // The scene loads before it is on screen, so it starts with the latest answer.
    let onScreen = false;

    const start = async () => {
      try {
        const { mountCourts } = await import('./tinyCourts/scene');
        if (cancelled) return;
        courts = mountCourts(canvas, { onHud, onLost: () => setFailed(true) });
        courtsRef.current = courts;
        courts.setVisible(onScreen);
        // Dev-only hook for pixel checks: window.__courts.snapshot() renders now.
        if (import.meta.env.DEV) window.__courts = courts;
        courts.setPaused(pausedRef.current);
        resize();
        courts.setSport(sportRef.current);
        ro = new ResizeObserver(resize);
        ro.observe(stage);
      } catch (error) {
        console.error('Tiny courts could not start WebGL:', error);
        setFailed(true);
      }
    };

    // Load three.js a screen ahead of the section, and pause off screen.
    let started = false;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          start();
        }
      },
      { rootMargin: '800px 0px' },
    );
    near.observe(stage);
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      courts?.setVisible(onScreen);
    });
    seen.observe(stage);

    return () => {
      cancelled = true;
      near.disconnect();
      seen.disconnect();
      ro?.disconnect();
      courts?.dispose();
      courtsRef.current = null;
      if (import.meta.env.DEV && window.__courts === courts) delete window.__courts;
    };
  }, []);

  useEffect(() => {
    courtsRef.current?.setSport(sportIndex);
  }, [sportIndex]);

  useEffect(() => {
    courtsRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <>
      <p className="plays-intro">{copy.intro}</p>
      <div className="plays-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="plays-canvas" role="img" aria-label={copy.labels[sport.id]} />
        {failed && <p className="plays-fallback">{copy.noWebgl}</p>}
        <div className="plays-hud" aria-hidden="true">
          <span ref={hudRef} className="plays-hud-label" />
          <span className="plays-hud-score">
            {sport.teams && <i style={{ '--team': sport.teams[0] }} />}
            <b ref={scoreRef} />
            {sport.teams && <i style={{ '--team': sport.teams[1] }} />}
          </span>
        </div>
      </div>
      <div className="plays-bar">
        <span className="plays-switch" role="group" aria-label={copy.switchLabel}>
          {SPORTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === sportIndex ? 'on' : ''}
              aria-pressed={index === sportIndex}
              onClick={() => setSportIndex(index)}
            >
              {copy.sports[item.id]}
            </button>
          ))}
        </span>
        <button
          type="button"
          className="plays-toggle"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? copy.play : copy.pause}
        >
          {paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
        </button>
      </div>
    </>
  );
}
