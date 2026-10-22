// Play logic for the tiny courts. The world is in metres: x runs across a
// court, y along it, z up. The renderer (scene.js) only reads this state,
// plus the one-off effects queued in `s.fx` (splashes, ripples, swishes).

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const turn = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const smooth = (a, b, t) => {
  const u = clamp((t - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
const GRAVITY = 9.8;

// Seeded, so every visit opens on the same play.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePlayer(id, team, x, y, look) {
  return {
    id,
    team,
    x,
    y,
    tx: x,
    ty: y,
    hx: x,
    hy: y,
    speed: 3,
    phase: id * 1.7,
    walk: 0,
    yaw: team === 0 ? Math.PI / 2 : -Math.PI / 2,
    // Feet height without the jump, then the full height with it.
    zBase: 0,
    z: 0,
    // Whole-body rotation about the hips: pitch tips forward, roll sideways.
    pitch: 0,
    roll: 0,
    // The dribbling hand, +1 right and -1 left, and where the ball is between them.
    hand: 1,
    handAt: 1,
    stroke: id * 0.9,
    pose: 'ready',
    swingAt: -9,
    jumpAt: -9,
    jumpDur: 0.6,
    jumpH: 0,
    busy: false,
    shoe: '#f4f1ea',
    ...look,
  };
}

// ---- Simulation -----------------------------------------------------------

export function createSim(sport, seed) {
  const s = {
    sport,
    rand: seeded(seed),
    time: 0,
    players: [],
    events: [],
    fx: [],
    score: [0, 0],
    flash: null,
    live: true,
    cheerAt: -9,
    ball: { x: 0, y: 0, z: 0, flight: null, holder: null },
  };
  s.after = (delay, fn) => s.events.push({ at: s.time + delay, fn });
  s.fly = (to, dur, apex, then) => {
    const b = s.ball;
    b.holder = null;
    b.flight = { from: [b.x, b.y, b.z], to, start: s.time, dur, apex, then };
  };
  s.give = (pl) => {
    s.ball.flight = null;
    s.ball.holder = pl;
    sport.carry(s, s.ball, pl);
  };
  s.go = (pl, x, y, speed) => {
    pl.tx = x;
    pl.ty = y;
    if (speed) pl.speed = speed;
  };
  // Walk somewhere, then call `then` on arrival.
  s.walk = (pl, x, y, speed, then) => {
    s.go(pl, x, y, speed);
    pl.arrive = then;
  };
  // Walk through waypoints in order, then call `then`.
  s.route = (pl, points, speed, then) => {
    const [[x, y], ...rest] = points;
    s.walk(pl, x, y, speed, rest.length ? () => s.route(pl, rest, speed, then) : then);
  };
  // Drive a player directly for `dur` seconds: fn(u) sets x, y, zBase, pitch, yaw.
  s.script = (pl, dur, fn, then) => {
    pl.script = { start: s.time, dur, fn, then };
    fn(0);
  };
  s.say = (key, hold = 1.5) => {
    s.flash = { key, until: s.time + hold };
  };
  s.emit = (fx) => s.fx.push(fx);
  sport.setup(s);
  return s;
}

export function stepSim(s, dt) {
  s.time += dt;
  if (s.events.some((e) => e.at <= s.time)) {
    const due = s.events.filter((e) => e.at <= s.time);
    s.events = s.events.filter((e) => e.at > s.time);
    due.forEach((e) => e.fn());
  }
  for (const pl of s.players) {
    const sc = pl.script;
    if (!sc) continue;
    const u = Math.min(1, (s.time - sc.start) / sc.dur);
    sc.fn(u);
    pl.tx = pl.x;
    pl.ty = pl.y;
    if (u >= 1 && pl.script === sc) {
      pl.script = null;
      sc.then?.();
    }
  }
  s.sport.tick(s, dt);
  const b = s.ball;
  const hasBall = s.sport.ball !== false;
  for (const pl of s.players) {
    const dx = pl.tx - pl.x;
    const dy = pl.ty - pl.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, pl.speed * dt);
    if (d > 1e-4) {
      pl.x += (dx / d) * step;
      pl.y += (dy / d) * step;
    }
    pl.vx = d > 1e-4 ? ((dx / d) * step) / dt : 0;
    pl.vy = d > 1e-4 ? ((dy / d) * step) / dt : 0;
    pl.phase += step * 4.4;
    pl.walk = lerp(pl.walk, step / dt > 0.5 ? 1 : 0, Math.min(1, dt * 10));
    const j = (s.time - pl.jumpAt) / pl.jumpDur;
    pl.z = pl.zBase + (j >= 0 && j <= 1 ? Math.sin(j * Math.PI) * pl.jumpH : 0);
    pl.handAt = lerp(pl.handAt, pl.hand, Math.min(1, dt * 12));
    // Face the ball. A holder, or anyone in a sport without a ball, faces where it walks.
    let fx = b.x - pl.x;
    let fy = b.y - pl.y;
    if (b.holder === pl || !hasBall) {
      fx = step > 1e-3 ? dx : 0;
      fy = step > 1e-3 ? dy : 0;
    }
    if (!pl.script && Math.hypot(fx, fy) > 0.05) pl.yaw += turn(pl.yaw, Math.atan2(fy, fx)) * Math.min(1, dt * 9);
    if (pl.arrive && d < 0.05) {
      const then = pl.arrive;
      pl.arrive = null;
      then();
    }
  }
  // Keep players on the ground from walking through each other.
  const grounded = s.players.filter((p) => !p.script && p.zBase === 0);
  for (let i = 0; i < grounded.length; i += 1) {
    for (let j = i + 1; j < grounded.length; j += 1) {
      const p = grounded[i];
      const q = grounded[j];
      const gap = dist(p.x, p.y, q.x, q.y);
      if (gap > 0.001 && gap < 0.65) {
        const push = (0.65 - gap) / 2 / gap;
        const ox = (p.x - q.x) * push;
        const oy = (p.y - q.y) * push;
        p.x += ox;
        p.y += oy;
        q.x -= ox;
        q.y -= oy;
      }
    }
  }
  if (b.flight) {
    const f = b.flight;
    const u = Math.min(1, (s.time - f.start) / f.dur);
    b.x = lerp(f.from[0], f.to[0], u);
    b.y = lerp(f.from[1], f.to[1], u);
    b.z = lerp(f.from[2], f.to[2], u) + f.apex * 4 * u * (1 - u);
    if (u >= 1) {
      b.flight = null;
      f.then?.();
    }
  } else if (b.holder) {
    s.sport.carry(s, b, b.holder);
  }
  if (s.flash && s.time > s.flash.until) s.flash = null;
}

// The ball hand is on the player's right (or left, side -1), a little in front.
const handPoint = (pl, z, reach = 0.3, side = 1) => {
  const fx = Math.cos(pl.yaw);
  const fy = Math.sin(pl.yaw);
  return [pl.x + fy * 0.3 * side + fx * reach, pl.y - fx * 0.3 * side + fy * reach, z];
};

const nearest = (list, x, y) =>
  list.reduce((best, p) => (dist(p.x, p.y, x, y) < dist(best.x, best.y, x, y) ? p : best));

// Freestyle: count strokes and splash the water where each hand goes in.
function swimStrokes(s, pl, dt, rate) {
  const before = Math.floor(pl.stroke / Math.PI);
  pl.stroke += dt * rate;
  if (Math.floor(pl.stroke / Math.PI) !== before) {
    const [x, y] = handPoint(pl, 0, 0.9, before % 2 ? 1 : -1);
    s.emit({ type: 'splash', x, y, n: 5, power: 1.1 });
  }
  if (s.rand() < dt * 9) {
    const back = 1.9 * (s.sport.figure ?? 1);
    s.emit({ type: 'splash', x: pl.x - Math.cos(pl.yaw) * back, y: pl.y - Math.sin(pl.yaw) * back, n: 2, power: 0.8 });
  }
}

// ---- Basketball -----------------------------------------------------------

const BB_W = 15;
const BB_L = 11;
const HOOP = [7.5, 1.575];
const RIM = 3.05;
const SPOTS = [
  [7.5, 8.4],
  [2.4, 6.4],
  [12.6, 6.4],
  [1.1, 1.4],
  [13.9, 1.4],
  [5.0, 5.6],
  [10.0, 5.6],
  [5.3, 2.4],
  [9.7, 2.4],
];

const bbTeam = (s, team) => s.players.filter((p) => p.team === team);

// A point `gap` metres from the rim, on the side where the player stands.
function bbRimSide(pl, gap) {
  const d = dist(pl.x, pl.y, ...HOOP) || 1;
  return [HOOP[0] + ((pl.x - HOOP[0]) / d) * gap, Math.max(HOOP[1] + 0.3, HOOP[1] + ((pl.y - HOOP[1]) / d) * gap)];
}

function bbFreeSpot(s, pl) {
  const mates = bbTeam(s, pl.team).filter((p) => p !== pl);
  const options = SPOTS.filter(([x, y]) => mates.every((m) => dist(m.tx, m.ty, x, y) > 3) && dist(pl.x, pl.y, x, y) > 1.5);
  return options[Math.floor(s.rand() * options.length)] ?? SPOTS[0];
}

function bbHold(s, pl) {
  const r = s.rand;
  s.give(pl);
  pl.pose = 'dribble';
  pl.crossAt = s.time;
  if (r() < 0.45) {
    // Attack the rim.
    const [x, y] = bbRimSide(pl, 2.2);
    s.go(pl, x, y, 3.8);
  } else s.go(pl, clamp(pl.x + (r() - 0.5) * 3, 1, BB_W - 1), clamp(pl.y + (r() - 0.5) * 3, 1.6, BB_L - 0.8), 2.6);
  s.after(1.0 + r() * 1.0, () => {
    if (s.ball.holder !== pl) return;
    const close = dist(pl.x, pl.y, ...HOOP) < 3.4;
    if (close && r() < 0.75) bbDunk(s, pl);
    else if (s.passes >= s.passGoal) bbShoot(s, pl);
    else bbPass(s, pl);
  });
}

function bbPass(s, pl) {
  const r = s.rand;
  const b = s.ball;
  const mates = bbTeam(s, pl.team).filter((p) => p !== pl);
  const cutter = mates.find((m) => dist(m.x, m.y, ...HOOP) < 6);
  pl.pose = 'ready';
  s.passes += 1;
  if (cutter && r() < 0.4) {
    bbAlley(s, pl, cutter);
    return;
  }
  const mate = mates[r() < 0.5 ? 0 : 1];
  mate.waiting = true;
  s.go(mate, mate.x, mate.y);
  const hand = handPoint(mate, 1.4);
  const dur = clamp(dist(b.x, b.y, hand[0], hand[1]) / 12, 0.3, 0.7);
  const done = () => {
    mate.waiting = false;
    bbHold(s, mate);
  };
  if (r() < 0.25) {
    const mid = [lerp(b.x, hand[0], 0.6), lerp(b.y, hand[1], 0.6), 0];
    s.fly(mid, dur * 0.6, 0.05, () => s.fly(hand, dur * 0.5, 0.05, done));
  } else s.fly(hand, dur, 0.35, done);
  s.after(0.2, () => {
    const [x, y] = bbFreeSpot(s, pl);
    s.go(pl, x, y, 3.4);
  });
}

// A lob to a cutter, who catches it above the rim and throws it down.
function bbAlley(s, passer, mate) {
  const [x, y] = bbRimSide(mate, 0.9);
  const flight = 0.95;
  mate.waiting = true;
  s.go(mate, x, y, Math.max(4.5, dist(mate.x, mate.y, x, y) / (flight - 0.35)));
  mate.jumpAt = s.time + flight - 0.48;
  mate.jumpDur = 0.96;
  mate.jumpH = 1.05;
  s.after(flight - 0.5, () => {
    mate.pose = 'dunk';
  });
  s.fly([x, y, 3.45], flight, 1.3, () => {
    mate.waiting = false;
    s.give(mate);
    s.after(0.06, () => bbSlam(s, mate, 'alley'));
  });
  s.after(0.2, () => {
    const [fx, fy] = bbFreeSpot(s, passer);
    s.go(passer, fx, fy, 3.4);
  });
}

function bbDunk(s, pl) {
  const [ax, ay] = bbRimSide(pl, 1.1);
  const run = dist(pl.x, pl.y, ax, ay) / 5.5;
  s.go(pl, ax, ay, 5.5);
  s.after(run, () => {
    if (s.ball.holder !== pl) return;
    pl.pose = 'dunk';
    pl.jumpAt = s.time;
    pl.jumpDur = 0.96;
    pl.jumpH = 1.05;
    const [cx, cy] = bbRimSide(pl, 0.4);
    s.go(pl, cx, cy, 1.6);
    s.after(0.46, () => bbSlam(s, pl, 'dunk'));
  });
}

function bbSlam(s, pl, call) {
  const r = s.rand;
  const [hx, hy] = HOOP;
  s.fly([hx, hy, RIM + 0.15], 0.1, 0, () => {
    s.score[pl.team] += 2;
    s.say(call);
    s.cheerAt = s.time;
    s.emit({ type: 'rim', power: 1 });
    s.emit({ type: 'swish' });
    const lx = hx + (r() - 0.5) * 1.4;
    const ly = hy + 1.6 + r();
    s.fly([hx, hy, 2.5], 0.14, 0, () =>
      s.fly([hx + 0.1, hy + 0.5, 0], 0.3, 0, () =>
        s.fly([lx, ly, 0], 0.5, 0.6, () => s.fly([lx + 0.3, ly + 0.8, 0], 0.4, 0.2, null)),
      ),
    );
    s.fetch = nearest(bbTeam(s, 1 - pl.team), lx, ly);
    s.after(0.5, () => {
      pl.pose = 'celebrate';
    });
    s.after(1.6, () => {
      pl.pose = 'ready';
    });
  });
}

function bbShoot(s, pl) {
  const r = s.rand;
  const [hx, hy] = HOOP;
  pl.pose = 'shoot';
  s.go(pl, pl.x, pl.y);
  pl.jumpAt = s.time + 0.12;
  pl.jumpDur = 0.62;
  pl.jumpH = 0.5;
  s.after(0.42, () => {
    const d = dist(pl.x, pl.y, hx, hy);
    const three = d > 6.75;
    const make = r() < (three ? 0.48 : 0.6);
    s.fly([hx, hy, RIM + 0.1], 0.8 + d * 0.04, 1.3 + d * 0.17, () => {
      pl.pose = 'ready';
      if (make) {
        s.score[pl.team] += three ? 3 : 2;
        s.say(three ? 'three' : 'two');
        if (three) s.cheerAt = s.time;
        s.emit({ type: 'swish' });
        const lx = hx + (r() - 0.5) * 1.6;
        const ly = hy + 2.2 + r() * 1.2;
        s.fly([hx, hy, 2.55], 0.2, 0, () =>
          s.fly([hx + 0.15, hy + 0.8, 0], 0.35, 0, () =>
            s.fly([lx, ly, 0], 0.55, 0.55, () => s.fly([lx + 0.3, ly + 0.9, 0], 0.4, 0.18, null)),
          ),
        );
        s.fetch = nearest(bbTeam(s, 1 - pl.team), lx, ly);
      } else {
        s.say('miss');
        s.emit({ type: 'rim', power: 0.6 });
        const lx = clamp(hx + (r() - 0.5) * 7, 1, BB_W - 1);
        const ly = clamp(hy + 1.6 + r() * 4, 1.2, BB_L - 1);
        s.fly([hx + (r() - 0.5) * 0.5, hy + 0.25, 3.3], 0.12, 0, () =>
          s.fly([lx, ly, 0], 0.9, 1.4, () => s.fly([lx + 0.4, ly + 0.6, 0], 0.45, 0.3, null)),
        );
        s.fetch = nearest(s.players, lx, ly);
      }
    });
  });
}

const basketball = {
  id: 'basketball',
  court: [BB_W, BB_L],
  pave: 1.9,
  grass: 1.6,
  top: 4.2,
  figure: 1.3,
  teams: ['#e0483b', '#3b74e0'],
  // Bleachers along the far-left edge, facing the court.
  stands: { x: -2.15, y0: 1.2, len: 8.5, rows: 3 },
  setup(s) {
    const home = [SPOTS[0], SPOTS[1], SPOTS[2]];
    const red = { shirt: '#e0483b', shorts: '#e0483b', number: true };
    const blue = { shirt: '#3b74e0', shorts: '#2c55a8', number: true, shoe: '#2a2a2a' };
    home.forEach(([x, y], i) => s.players.push(makePlayer(i, 0, x, y, red)));
    home.forEach(([x, y], i) => {
      const d = dist(x, y, ...HOOP);
      s.players.push(makePlayer(i + 3, 1, x + ((HOOP[0] - x) / d) * 1.4, y + ((HOOP[1] - y) / d) * 1.4, blue));
    });
    s.passes = 0;
    s.passGoal = 2;
    s.possessionAt = 0;
    s.fetch = null;
    bbHold(s, s.players[0]);
  },
  tick(s, dt) {
    const b = s.ball;
    if (s.fetch) {
      const f = s.fetch;
      const to = b.flight ? b.flight.to : [b.x, b.y];
      s.go(f, to[0], to[1], 4.6);
      if (!b.flight && dist(f.x, f.y, b.x, b.y) < 0.6) {
        s.fetch = null;
        s.off = f.team;
        s.passes = 0;
        s.passGoal = 1 + Math.floor(s.rand() * 3);
        s.possessionAt = s.time;
        bbHold(s, f);
        s.go(f, 7.5, 8.2, 3.2);
      }
    }
    // Crossovers: the dribble switches hands every so often.
    const holder = b.holder;
    if (holder && holder.pose === 'dribble' && s.time - holder.crossAt > 0.7 + s.rand() * 0.6) {
      holder.hand = -holder.hand;
      holder.crossAt = s.time;
    }
    const off = holder ? holder.team : (s.off ?? 0);
    s.off = off;
    const O = bbTeam(s, off);
    const D = bbTeam(s, 1 - off);
    O.forEach((p) => {
      if (p === holder || p === s.fetch || p.waiting || p.pose === 'dunk' || p.pose === 'celebrate') return;
      p.pose = 'ready';
      const arrived = dist(p.x, p.y, p.tx, p.ty) < 0.1;
      if (arrived && s.rand() < dt * 0.5) {
        const [x, y] = bbFreeSpot(s, p);
        s.go(p, x, y, 3);
      }
    });
    D.forEach((p, i) => {
      if (p === s.fetch) return;
      const man = O[i];
      const dx = HOOP[0] - man.x;
      const dy = HOOP[1] - man.y;
      const d = Math.hypot(dx, dy) || 1;
      const gap = man === holder ? 0.9 : 1.6;
      s.go(p, man.x + (dx / d) * gap, man.y + (dy / d) * gap, 4);
      p.pose = man === holder ? 'guard' : 'ready';
    });
  },
  carry(s, b, pl) {
    if (pl.pose === 'shoot' || pl.pose === 'dunk') {
      b.x = pl.x + Math.cos(pl.yaw) * 0.15;
      b.y = pl.y + Math.sin(pl.yaw) * 0.15;
      b.z = (pl.pose === 'dunk' ? 2.55 : 1.95) + pl.z;
      return;
    }
    const [x, y] = handPoint(pl, 0, 0.36, pl.handAt);
    b.x = x;
    b.y = y;
    b.z = 0.04 + 0.78 * Math.abs(Math.cos(s.time * 6.5));
  },
};

// ---- Table tennis ---------------------------------------------------------

const TT_W = 1.525;
const TT_L = 2.74;
const TT_H = 0.76;

function ttServe(s, server) {
  server.swingAt = s.time + 0.36 - 0.1;
  s.fly([s.ball.x, s.ball.y, 1.3], 0.36, 0.12, () => ttHit(s, server, true));
}

function ttHit(s, hitter, serve) {
  const r = s.rand;
  const b = s.ball;
  const other = 1 - hitter.team;
  const toward = other === 1 ? 1 : -1;
  s.rally += 1;
  const fault = !serve && s.rally >= s.rallyLen;
  const intoNet = fault && r() < 0.45;
  const receiver = s.players.find((p) => p.team === other);
  const from = [b.x, b.y];
  const bx = clamp(0.15 + r() * (TT_W - 0.3), 0.12, TT_W - 0.12);
  const by = TT_L / 2 + toward * (0.3 + r() * 0.95);
  const hx = clamp(bx + (bx - from[0]) * 0.5, -0.5, TT_W + 0.5);
  const hy = toward > 0 ? TT_L + 0.3 + r() * 0.5 : -0.3 - r() * 0.5;
  if (!fault) {
    // Stand so the ball meets the paddle hand (the right side).
    receiver.busy = true;
    const sx = hx + (toward > 0 ? 0.36 : -0.36);
    const sy = hy + toward * 0.3;
    s.go(receiver, sx, sy, Math.max(2.4, dist(receiver.x, receiver.y, sx, sy) / 0.6));
  }
  const toOther = (dur, apex) => {
    if (intoNet) {
      s.fly([bx, TT_L / 2 - toward * 0.03, TT_H + 0.1], dur * 0.6, apex * 0.6, () => {
        s.say('net');
        s.fly([bx, TT_L / 2 - toward * 0.25, TT_H], 0.25, 0.05, () =>
          s.fly([bx + 0.2, TT_L / 2 - toward * 0.9, 0], 0.5, 0.15, () => ttPoint(s, other)),
        );
      });
      return;
    }
    if (fault) {
      const ly = toward > 0 ? TT_L + 0.7 : -0.7;
      s.fly([bx, ly, 0.4], dur, apex + 0.05, () => {
        s.say('out');
        s.fly([bx + 0.3, ly + toward * 1.2, 0], 0.5, 0.2, () => ttPoint(s, other));
      });
      return;
    }
    s.fly([bx, by, TT_H], dur, apex, () => {
      receiver.swingAt = s.time + 0.3 - 0.1;
      s.fly([hx, hy, 0.95], 0.3, 0.18, () => {
        receiver.busy = false;
        ttHit(s, receiver, false);
      });
    });
  };
  if (serve) {
    // A serve bounces once on the server's own half first.
    const ox = clamp(lerp(b.x, bx, 0.35), 0.2, TT_W - 0.2);
    const oy = TT_L / 2 - toward * (0.55 + r() * 0.4);
    s.fly([ox, oy, TT_H], 0.26, 0.04, () => toOther(0.3, 0.12));
  } else {
    toOther(clamp(dist(b.x, b.y, bx, by) / 7.5, 0.32, 0.55), 0.2 + r() * 0.14);
  }
}

function ttPoint(s, winner) {
  const r = s.rand;
  s.score[winner] += 1;
  s.points += 1;
  s.rally = 0;
  s.rallyLen = 3 + Math.floor(r() * 8);
  s.live = false;
  if (s.score[winner] >= 11 && s.score[winner] - s.score[1 - winner] >= 2) {
    s.say('game', 2.2);
    s.cheerAt = s.time;
    s.players[winner].pose = 'celebrate';
    s.after(2.2, () => {
      s.score = [0, 0];
      s.players[winner].pose = 'ready';
    });
  }
  s.players.forEach((p) => {
    p.busy = false;
    s.go(p, p.hx, p.hy, 2);
  });
  const server = s.players[Math.floor(s.points / 2) % 2];
  s.after(1.2, () =>
    s.fly(handPoint(server, 1.0, 0.25), 0.7, 0.9, () => {
      s.give(server);
      s.live = true;
      s.after(0.5, () => ttServe(s, server));
    }),
  );
}

const tabletennis = {
  id: 'tabletennis',
  court: [TT_W, TT_L],
  pave: 3.4,
  grass: 1.4,
  fence: 2.2,
  top: 2.2,
  figure: 1.0,
  swing: 'paddle',
  teams: ['#e2482a', '#2a6fdb'],
  setup(s) {
    const looks = [
      { shirt: '#e2482a', shorts: '#222428', paddle: '#c8312b' },
      { shirt: '#2a6fdb', shorts: '#f1efe8', paddle: '#1d1f24' },
    ];
    s.players = [
      makePlayer(0, 0, TT_W / 2 - 0.3, -0.8, looks[0]),
      makePlayer(1, 1, TT_W / 2 + 0.3, TT_L + 0.8, looks[1]),
    ];
    s.rally = 0;
    s.rallyLen = 7;
    s.points = 0;
    s.give(s.players[0]);
    s.after(0.6, () => ttServe(s, s.players[0]));
  },
  tick(s) {
    if (!s.live) return;
    const b = s.ball;
    s.players.forEach((p) => {
      if (p.busy || b.holder === p) return;
      s.go(p, clamp(p.hx + (b.x - TT_W / 2) * 0.35, -0.4, TT_W + 0.4), p.hy, 2.2);
    });
  },
  carry(s, b, pl) {
    [b.x, b.y, b.z] = handPoint(pl, 1.0, 0.25);
  },
};

// ---- Diving ---------------------------------------------------------------

const DV_W = 10;
const DV_L = 12;
// The pool's water surface, a little below the deck.
export const WATER = -0.12;
// Platform and springboard: x, the take-off edge (y), height, where the diver
// stands to climb (foot), and the deck route there from the exit ladder.
// Routes keep to the deck: up the right side between the pool and the judges,
// then along the back, behind the tower's legs.
const DECK_X = DV_W + 0.7;
const TOWER = {
  x: 7.2,
  edge: 1.0,
  h: 5,
  foot: -2.95,
  route: [[DECK_X, -1.4], [8.6, -2.95], [7.2, -2.95]],
  turns: 2.5,
  v: 3.2,
  out: 1.7,
  pose: 'tuck',
};
const BOARD = {
  x: 2.6,
  edge: 1.3,
  h: 1.0,
  foot: -2.6,
  route: [[DECK_X, -1.4], [3.4, -1.4], [3.4, -2.6], [2.6, -2.6]],
  turns: 1.5,
  v: 4.6,
  out: 1.5,
  pose: 'pike',
};
const EXIT = { x: DV_W, y: 7.5 };


function dvCycle(s, pl, rig) {
  // Walk the deck to the ladder, climb, walk out, dive.
  s.route(pl, rig.route, 1.7, () => {
    pl.pose = 'climb';
    pl.yaw = Math.PI / 2;
    s.script(
      pl,
      rig.h * 0.6 + 0.6,
      (u) => {
        pl.zBase = rig.h * u;
      },
      () => {
        pl.pose = 'stand';
        s.script(
          pl,
          0.45,
          (u) => {
            pl.y = lerp(rig.foot, rig.foot + 0.75, u);
          },
          () => s.walk(pl, rig.x, rig.edge - 0.3, 1.2, () => dvEdge(s, pl, rig)),
        );
      },
    );
  });
}

function dvEdge(s, pl, rig) {
  pl.pose = 'stand';
  pl.yaw = Math.PI / 2;
  s.after(0.9, () => {
    pl.pose = 'reach';
    s.after(0.5, () => {
      if (rig === BOARD) {
        // Two bounces on the board before the take-off.
        s.script(
          pl,
          1.0,
          (u) => {
            const flex = Math.abs(Math.sin(u * Math.PI * 2)) * (0.6 + u * 0.4);
            s.boardFlex = flex;
            pl.zBase = rig.h - flex * 0.28 + Math.max(0, Math.sin(u * Math.PI * 2 + Math.PI)) * 0.35;
          },
          () => {
            s.boardFlex = 0;
            dvFly(s, pl, rig);
          },
        );
      } else dvFly(s, pl, rig);
    });
  });
}

function dvFly(s, pl, rig) {
  const r = s.rand;
  const P = s.sport.figure;
  // Solve h + v t - g t^2 / 2 = -0.6 for the time the diver reaches the water.
  const end = -0.6;
  const T = (rig.v + Math.sqrt(rig.v * rig.v + 2 * GRAVITY * (rig.h - end))) / GRAVITY;
  const y0 = pl.y;
  const spin = rig.turns * Math.PI * 2;
  s.script(
    pl,
    T,
    (u) => {
      const t = u * T;
      pl.zBase = rig.h + rig.v * t - (GRAVITY * t * t) / 2;
      pl.y = y0 + rig.out * smooth(0, 0.7, u);
      pl.pitch = spin * smooth(0.06, 0.86, u);
      pl.pose = u < 0.1 ? 'reach' : u < 0.8 ? rig.pose : 'entry';
    },
    () => {
      pl.pitch = Math.PI;
      const score = Math.round((6 + r() * 3.6) * 2) / 2;
      s.lastScore = score;
      s.dives += 1;
      s.say(score >= 9 ? 'rip' : 'score', 2);
      s.cheerAt = s.time;
      s.emit({ type: 'splash', x: pl.x, y: pl.y, n: score >= 9 ? 14 : 34, power: score >= 9 ? 1.6 : 3 });
      s.emit({ type: 'ripple', x: pl.x, y: pl.y });
      dvSurface(s, pl, P);
    },
  );
}

function dvSurface(s, pl, P) {
  const z0 = pl.zBase;
  // Down, then arch back to the surface and swim face-down to the exit.
  s.script(
    pl,
    1.4,
    (u) => {
      pl.zBase = lerp(z0, -2.6, smooth(0, 0.5, u)) + lerp(0, -(P + 0.05) + 2.6, smooth(0.5, 1, u));
      pl.pitch = lerp(Math.PI, Math.PI / 2, smooth(0.4, 1, u));
      pl.pose = 'entry';
    },
    () => {
      pl.pose = 'swim';
      const x0 = pl.x;
      const y0 = pl.y;
      const tx = EXIT.x - 0.55;
      const ty = EXIT.y;
      const len = dist(x0, y0, tx, ty);
      pl.yaw = Math.atan2(ty - y0, tx - x0);
      s.script(
        pl,
        len / 1.1,
        (u) => {
          pl.x = lerp(x0, tx, u);
          pl.y = lerp(y0, ty, u);
        },
        () => {
          pl.pose = 'climb';
          const zs = pl.zBase;
          s.script(
            pl,
            1.4,
            (u) => {
              pl.pitch = lerp(Math.PI / 2, 0, smooth(0, 0.5, u));
              pl.zBase = lerp(zs, 0, smooth(0.2, 1, u));
              pl.x = lerp(tx, EXIT.x + 0.5, smooth(0.6, 1, u));
            },
            () => {
              pl.pitch = 0;
              pl.pose = 'stand';
              s.after(0.4, () => dvCycle(s, pl, pl.rig));
            },
          );
        },
      );
    },
  );
}

const diving = {
  id: 'diving',
  court: [DV_W, DV_L],
  pave: 3.2,
  grass: 1.4,
  top: 6.4,
  figure: 1.3,
  ball: false,
  pool: { depth: 4 },
  setup(s) {
    s.dives = 0;
    s.lastScore = null;
    s.boardFlex = 0;
    const a = makePlayer(0, 0, EXIT.x + 1.2, 4, { shirt: '#1d4fa8', shorts: '#1d4fa8', shoe: null, swimmer: true });
    const b = makePlayer(1, 1, EXIT.x + 1.4, 9, { shirt: '#c93a2e', shorts: '#c93a2e', shoe: null, swimmer: true });
    a.rig = TOWER;
    b.rig = BOARD;
    s.players = [a, b];
    // The first diver starts on the platform, so the opening frame is a dive.
    a.x = TOWER.x;
    a.y = TOWER.edge - 0.3;
    a.zBase = TOWER.h;
    a.tx = a.x;
    a.ty = a.y;
    dvEdge(s, a, TOWER);
    s.after(6, () => dvCycle(s, b, BOARD));
  },
  tick(s, dt) {
    s.players.forEach((p) => {
      if (p.pose === 'swim') swimStrokes(s, p, dt, 3.2);
    });
  },
  carry() {},
};

// ---- Gaming ---------------------------------------------------------------

// A living room: one player on the couch, and a side-scrolling runner game on
// the TV. The game state lives here so the screen, the HUD and the player's
// reactions agree.
const ROOM_W = 5.2;
const ROOM_L = 4.6;
const SEAT = 0.45;

function gmLevel(g, level) {
  Object.assign(g, { level, dist: 0, y: 0, vy: 0, state: 'run', obstacles: [], coins: [], next: 6 });
}

const gaming = {
  id: 'gaming',
  court: [ROOM_W, ROOM_L],
  pave: 0,
  grass: 0,
  top: 2.75,
  figure: 1.0,
  ball: false,
  room: true,
  // Sun from the open front-right, so shadows fall toward the walls.
  sun: [9, 17, 12],
  setup(s) {
    const p = makePlayer(0, 0, 3.32, 2.25, {
      shirt: '#3c4f7a',
      shorts: '#2b3447',
      shoe: '#f2f2ee',
      hood: true,
      headset: true,
      controller: true,
    });
    p.yaw = Math.PI;
    // Seated: the rig's thighs rest 0.47 m above its root.
    p.zBase = SEAT - 0.47;
    p.pose = 'game';
    s.players = [p];
    s.game = { score: 0, lives: 3, stateAt: 0 };
    gmLevel(s.game, 1);
  },
  tick(s, dt) {
    const g = s.game;
    const r = s.rand;
    const pl = s.players[0];
    if (g.state !== 'run') {
      if (s.time - g.stateAt > (g.state === 'clear' ? 2.2 : 1.3)) {
        if (g.state === 'clear') gmLevel(g, g.level + 1);
        else if (g.lives <= 0) {
          g.score = 0;
          g.lives = 3;
          gmLevel(g, 1);
        } else {
          g.state = 'run';
          g.obstacles = g.obstacles.filter((o) => o.d > g.dist + 6);
        }
        pl.pose = 'game';
      }
      return;
    }
    const speed = 6 + g.level * 0.8;
    g.dist += speed * dt;
    g.score += Math.round(dt * 60);
    // Spawn crates and coins ahead of the runner.
    while (g.next < g.dist + 24) {
      if (r() < 0.65) g.obstacles.push({ d: g.next, tall: r() < 0.3 });
      else g.coins.push({ d: g.next, h: 1.2 + r() * 0.8 });
      g.next += 3.2 + r() * 4.5;
    }
    g.vy -= 32 * dt;
    g.y = Math.max(0, g.y + g.vy * dt);
    if (g.y === 0) g.vy = Math.max(0, g.vy);
    for (const o of g.obstacles) {
      const gap = o.d - g.dist;
      if (!o.seen && gap < 1.7) {
        o.seen = true;
        // Most crates get jumped; now and then the player is late.
        if (g.y === 0 && r() < 0.9) {
          g.vy = o.tall ? 11.5 : 9.5;
          pl.pressAt = s.time;
        }
      }
      if (Math.abs(gap) < 0.35 && g.y < (o.tall ? 1.1 : 0.7)) {
        g.state = 'ko';
        g.stateAt = s.time;
        g.lives -= 1;
        s.say('ko', 1.3);
        pl.pose = 'gamesad';
        return;
      }
    }
    g.coins = g.coins.filter((c) => {
      const gap = c.d - g.dist;
      if (Math.abs(gap) < 0.4 && Math.abs(g.y + 0.4 - c.h) < 0.7) {
        g.score += 50;
        return false;
      }
      return gap > -2;
    });
    g.obstacles = g.obstacles.filter((o) => o.d - g.dist > -2);
    if (g.dist >= 70 + g.level * 20) {
      g.state = 'clear';
      g.stateAt = s.time;
      g.score += 500;
      s.say('clear', 2.2);
      s.cheerAt = s.time;
      pl.pose = 'gamecheer';
    }
  },
  carry() {},
};

export const SPORTS = [diving, gaming, tabletennis, basketball];
