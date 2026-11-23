// Fish tank simulation + neon drawing. No DOM access at load time, so node can test it.
(function (exports, Neon, Mood) {
  const { glow, neonText, drawStar } = Neon;
  const GOLD = '#ffb300';
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const MAX_FISH = 20;
  const PALETTE = ['#33c7ff', '#2ee6a6', '#ff6ec7', '#b388ff', '#ffd166', '#ff7043'];

  // ---- species: each draw fn paints in "unit" space, facing right, origin = body centre ----
  const path = (ctx, fn) => { ctx.beginPath(); fn(ctx); ctx.stroke(); };

  // "><(((o>" ; every part wiggles with a phase offset along the body
  const TETRA = [
    [-4.8, p => { p.moveTo(-5.4, -1); p.lineTo(-4.4, 0); p.lineTo(-5.4, 1); }],
    [-3.5, p => { p.moveTo(-3, -1); p.lineTo(-4, 0); p.lineTo(-3, 1); }],
    [-1.5, p => { p.moveTo(-1.5, -1.1); p.quadraticCurveTo(-2.7, 0, -1.5, 1.1); }],
    [-0.3, p => { p.moveTo(-0.3, -1.1); p.quadraticCurveTo(-1.5, 0, -0.3, 1.1); }],
    [0.9, p => { p.moveTo(0.9, -1.1); p.quadraticCurveTo(-0.3, 0, 0.9, 1.1); }],
    [1.9, p => { p.moveTo(2.4, 0); p.arc(1.9, 0, 0.5, 0, TAU); }],
    [3, p => { p.moveTo(2.6, -0.9); p.lineTo(3.6, 0); p.lineTo(2.6, 0.9); }],
  ];
  function drawTetra(ctx, f, t) {
    const amp = 0.1 + Math.min(Math.abs(f.vx), 150) / 150 * 0.15;
    for (const [x, fn] of TETRA) {
      ctx.save();
      ctx.translate(0, Math.sin(t * 9 + f.ph - x * 0.9) * amp);
      path(ctx, fn);
      ctx.restore();
    }
  }

  function drawPuffer(ctx, f, t) {
    const r = 1.9 + Math.sin(t * 3 + f.ph) * 0.08;
    path(ctx, p => p.arc(0, 0, r, 0, TAU));
    for (let i = 0; i < 10; i++) {
      const a = i * 0.628 + 0.3;
      path(ctx, p => { p.moveTo(Math.cos(a) * r, Math.sin(a) * r); p.lineTo(Math.cos(a) * (r + 0.55), Math.sin(a) * (r + 0.55)); });
    }
    const w = Math.sin(t * 8 + f.ph) * 0.25;
    path(ctx, p => { p.moveTo(-r - 1.4, -0.9 + w); p.lineTo(-r - 0.4, 0); p.lineTo(-r - 1.4, 0.9 + w); });
    path(ctx, p => { p.moveTo(1.2 + 0.35, -0.5); p.arc(0.9, -0.5, 0.35, 0, TAU); });
    path(ctx, p => { p.moveTo(1.1, 0.9); p.lineTo(1.7, 0.6); });
  }

  function drawEel(ctx, f, t) {
    const n = 24, wave = k => Math.sin(t * 6 - k * 0.5 + f.ph);
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const x = -7 + k * 0.42, y = wave(k) * (0.15 + (1 - k / n) * 0.8);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    const hy = wave(n) * 0.15;
    path(ctx, p => p.arc(3.4, hy, 0.55, 0, TAU));
    path(ctx, p => { p.moveTo(3.62, hy - 0.2); p.arc(3.5, hy - 0.2, 0.12, 0, TAU); });
  }

  function drawJelly(ctx, f, t) {
    const pulse = Math.sin(t * 3 + f.ph);
    path(ctx, p => p.ellipse(0, 0, 1.8 - pulse * 0.1, 1.3 + pulse * 0.2, 0, Math.PI, TAU));
    path(ctx, p => { p.moveTo(-1.8, 0); p.quadraticCurveTo(-0.9, 0.4, 0, 0); p.quadraticCurveTo(0.9, 0.4, 1.8, 0); });
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) {
        const x = -1.2 + i * 0.8 + Math.sin(t * 4 + k * 0.8 + i) * 0.25 * (k / 6 + 0.2), y = 0.3 + k * 0.5 + pulse * 0.1 * k / 6;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }

  // base = initial size range, max = size cap, hit = [half width, half height, y offset] in units
  const SPECIES = {
    tetra: { label: 'Cá nhỏ', speed: 1, base: [8, 11], max: 18, hit: [4.5, 2, 0], draw: drawTetra },
    puffer: { label: 'Cá nóc', speed: 0.7, base: [9, 12], max: 17, hit: [3, 3, 0], draw: drawPuffer },
    eel: { label: 'Lươn neon', speed: 0.9, base: [6, 8], max: 11, hit: [5.5, 1.6, 0], draw: drawEel },
    jelly: { label: 'Sứa', speed: 0.4, base: [9, 11], max: 15, hit: [2.2, 2.6, 1.3], draw: drawJelly, upright: true },
  };
  const species = f => SPECIES[f.species] || SPECIES.tetra;

  // ---- simulation ----
  function makeTank(w, h) {
    return { w, h, t: 0, fish: [], food: [], bubbles: [] };
  }

  function newFish(s, c) {
    const sp = SPECIES[c.species] || SPECIES.tetra;
    return {
      id: c.id, species: c.species, color: c.color,
      x: rnd(0, s.w), y: rnd(s.h * 0.2, s.h * 0.8), vx: 0, vy: 0, dir: 1,
      size: rnd(...sp.base), ph: rnd(0, TAU), speed: rnd(0.8, 1.2),
      tx: rnd(0, s.w), ty: rnd(s.h * 0.2, s.h * 0.8),
      mood: Mood.newMood(), dash: 0, say: null, corner: null,
    };
  }

  // Make the tank match the config list [{id, species, color}]: new ids spawn, missing ids leave, the rest keep their place.
  function syncFish(s, list) {
    const ids = new Set(list.map(c => c.id));
    s.fish = s.fish.filter(f => ids.has(f.id));
    for (const c of list) {
      const f = s.fish.find(x => x.id === c.id);
      if (f) { f.species = c.species; f.color = c.color; } else s.fish.push(newFish(s, c));
    }
  }

  // Scatter a handful of pellets (rings) and stars around (x, y).
  function drop(s, x, y, n = 7) {
    for (let i = 0; i < n; i++) {
      s.food.push({ x: x + rnd(-50, 50), y: y + rnd(-20, 20), star: Math.random() < 0.35, ph: rnd(0, TAU), rest: 0 });
    }
  }

  function bubble(s, x, y, r = rnd(3, 9)) {
    if (s.bubbles.length < 40) s.bubbles.push({ x, y, r, vy: rnd(25, 60), ph: rnd(0, TAU), fill: Math.random() < 0.4 });
  }

  function nearestFood(s, f) {
    let best = null, bd = Infinity;
    for (const p of s.food) {
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function fishAt(s, x, y) {
    for (let i = s.fish.length - 1; i >= 0; i--) {
      const f = s.fish[i], [hw, hh, oy] = species(f).hit;
      if (Math.abs(x - f.x) < hw * f.size && Math.abs(y - (f.y + oy * f.size)) < hh * f.size) return f;
    }
    return null;
  }

  // Tease a fish. Returns the action taken: 'dash' | 'bubbles' | 'sulk' | 'grumpy'.
  function pokeFish(s, f) {
    const a = Mood.poke(f.mood, ['dash', 'bubbles']);
    if (a === 'sulk') {
      f.corner = { x: f.x < s.w / 2 ? 40 : s.w - 40, y: s.h - 24 };
      f.say = { text: 'hmph!', t: 2 };
    } else if (a === 'grumpy') {
      f.say = { text: '💢', t: 1 };
    } else if (a === 'dash') {
      f.tx = f.x < s.w / 2 ? rnd(s.w * 0.6, s.w - 40) : rnd(40, s.w * 0.4);
      f.ty = rnd(s.h * 0.15, s.h * 0.85);
      f.dash = 1.5;
    } else {
      for (let i = 0; i < 6; i++) bubble(s, f.x + rnd(-20, 20), f.y + rnd(-10, 10), rnd(3, 8));
      f.say = { text: '♥', t: 1 };
    }
    return a;
  }

  function step(s, dt) {
    s.t += dt;
    const floor = s.h - 6;
    for (const p of s.food) {
      if (p.y < floor) { p.y = Math.min(floor, p.y + 28 * dt); p.x += Math.sin(s.t * 1.5 + p.ph) * 10 * dt; }
      else p.rest += dt;
    }
    s.food = s.food.filter(p => p.rest < 12);

    for (const f of s.fish) {
      const sp = species(f);
      Mood.decay(f.mood, dt);
      if (f.say && (f.say.t -= dt) <= 0) f.say = null;
      f.dash = Math.max(0, f.dash - dt);
      const sulking = f.mood.sulk > 0;

      let food = null, tx, ty, speed;
      if (sulking) { const c = f.corner || { x: f.x, y: f.y }; tx = c.x; ty = c.y; speed = 80; }
      else if (f.dash > 0) { tx = f.tx; ty = f.ty; speed = 320; }
      else {
        food = nearestFood(s, f);
        if (!food && Math.hypot(f.tx - f.x, f.ty - f.y) < 30) {
          f.tx = rnd(40, s.w - 40); f.ty = rnd(s.h * 0.15, s.h * 0.85);
        }
        tx = food ? food.x : f.tx; ty = food ? food.y : f.ty; speed = food ? 150 : 45;
      }
      const d = Math.hypot(tx - f.x, ty - f.y) || 1;
      const sp2 = (sulking && d < 10 ? 0 : speed) * f.speed * sp.speed;
      const k = Math.min(1, 2 * dt);
      f.vx += ((tx - f.x) / d * sp2 - f.vx) * k;
      f.vy += ((ty - f.y) / d * sp2 - f.vy) * k;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (Math.abs(f.vx) > 8) f.dir = f.vx > 0 ? 1 : -1;

      if (food && d < f.size * 1.6) {
        s.food.splice(s.food.indexOf(food), 1);
        f.size = Math.min(sp.max, f.size + 0.4);
        bubble(s, f.x + f.dir * f.size * 3, f.y, rnd(3, 6));
      }
    }

    for (const b of s.bubbles) { b.y -= b.vy * dt; b.x += Math.sin(s.t * 2 + b.ph) * 12 * dt; }
    s.bubbles = s.bubbles.filter(b => b.y > -20);
    if (Math.random() < dt * 0.8) {
      const f = s.fish[Math.floor(Math.random() * s.fish.length)];
      f ? bubble(s, f.x + f.dir * f.size * 3, f.y) : bubble(s, rnd(0, s.w), s.h);
    }
  }

  // ---- drawing ----
  function drawFish(ctx, f, t) {
    const sp = species(f), u = f.size;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (!sp.upright) {
      ctx.scale(f.dir, 1);
      ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx) + 40) * 0.5);
    }
    ctx.scale(u, u);
    if (f.mood.sulk > 0) ctx.globalAlpha = 0.55;
    glow(ctx, f.color, Math.max(2.5, u * 0.3) / u);
    sp.draw(ctx, f, t);
    ctx.restore();
    if (f.say) neonText(ctx, f.say.text, f.x, f.y - u * 3, f.color);
  }

  function draw(ctx, s) {
    ctx.clearRect(0, 0, s.w, s.h);
    ctx.save();
    [0.1, 0.5, 0.9].forEach((fx, i) => {
      glow(ctx, '#19e0a0', 3);
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) ctx.lineTo(fx * s.w + Math.sin(s.t * 1.2 + k * 0.6 + i) * k * 3, s.h - k * 14);
      ctx.stroke();
    });
    for (const b of s.bubbles) {
      glow(ctx, '#29b6f6', 2.5);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
      if (b.fill) { ctx.fillStyle = 'rgba(30,60,120,.7)'; ctx.fill(); }
    }
    for (const p of s.food) {
      glow(ctx, GOLD, 3); ctx.fillStyle = GOLD;
      if (p.star) drawStar(ctx, p.x, p.y, 7);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, TAU); ctx.stroke(); }
    }
    for (const f of s.fish) drawFish(ctx, f, s.t);
    ctx.restore();
  }

  Object.assign(exports, { MAX_FISH, SPECIES, PALETTE, makeTank, syncFish, drop, step, draw, pokeFish, fishAt });
})(typeof module === 'object' ? module.exports : (window.Fish = {}),
   typeof module === 'object' ? require('./neon') : window.Neon,
   typeof module === 'object' ? require('./mood') : window.Mood);
