// Fish tank simulation + neon drawing. No DOM access at load time, so node can test it.
(function (exports, Neon, Mood) {
  const { glow, neonText, drawStar } = Neon;
  const GOLD = '#ffb300';
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const MAX_FISH = 20;
  const PALETTE = ['#33c7ff', '#2ee6a6', '#ff6ec7', '#b388ff', '#ffd166', '#ff7043', '#ffb300', '#7cffcb'];
  const NAMES = ['Bống', 'Neon', 'Mochi', 'Tép', 'Bơ', 'Kem', 'Su', 'Bin', 'Mít', 'Na', 'Cốm', 'Vây', 'Bọt', 'Xíu'];
  const HUNGRY_SECS = 150;      // from full to starving

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

  // round body with a big flowing double tail
  function drawGoldfish(ctx, f, t) {
    const w = Math.sin(t * 5 + f.ph);
    path(ctx, p => p.ellipse(0.3, 0, 2.2, 1.6, 0, 0, TAU));
    for (const s of [-1, 1]) {
      path(ctx, p => { p.moveTo(-1.8, s * 0.3); p.bezierCurveTo(-3.5, s * 0.4 + w * 0.3, -4.6, s * 2.4 + w * 0.5, -3.4 + w * 0.2, s * 2.2 + w * 0.6); p.quadraticCurveTo(-3.2, s * 0.8, -1.8, s * 0.3); });
    }
    path(ctx, p => { p.moveTo(-0.6, -1.5); p.quadraticCurveTo(0.2, -2.8 + w * 0.15, 1.2, -1.5); });
    path(ctx, p => { p.moveTo(0.2, 1.1); p.quadraticCurveTo(0.2 + w * 0.2, 1.9, 0.9, 1.4); });
    path(ctx, p => { p.moveTo(1.8, -0.5); p.arc(1.5, -0.5, 0.3, 0, TAU); });
    path(ctx, p => { p.moveTo(-0.5, -1.2); p.quadraticCurveTo(-0.9, 0, -0.5, 1.2); });
  }

  // tall diamond with long trailing fins
  function drawAngel(ctx, f, t) {
    const w = Math.sin(t * 4 + f.ph) * 0.3;
    path(ctx, p => { p.moveTo(2, 0); p.quadraticCurveTo(0.5, -2.2, -1, -0.4); p.lineTo(-1, 0.4); p.quadraticCurveTo(0.5, 2.2, 2, 0); });
    path(ctx, p => { p.moveTo(0.2, -1.6); p.quadraticCurveTo(-0.6, -3.6, -2.4 + w, -4.2); });
    path(ctx, p => { p.moveTo(0.2, 1.6); p.quadraticCurveTo(-0.6, 3.6, -2.4 - w, 4.2); });
    path(ctx, p => { p.moveTo(-1, -0.4); p.lineTo(-2.4, -1.1 + w * 0.5); p.lineTo(-2.2, 0); p.lineTo(-2.4, 1.1 + w * 0.5); p.lineTo(-1, 0.4); });
    path(ctx, p => { p.moveTo(0.3, -1.2); p.lineTo(0.3, 1.2); });
    path(ctx, p => { p.moveTo(1.45, -0.35); p.arc(1.2, -0.35, 0.25, 0, TAU); });
  }

  // side-walking crab; claws snap while eating
  function drawCrab(ctx, f, t) {
    const walk = Math.abs(f.vx) > 3 ? t * 14 : 0, snap = f.eating > 0 ? Math.abs(Math.sin(t * 12)) * 0.5 : 0.15;
    path(ctx, p => p.ellipse(0, 0, 2.2, 1.3, 0, Math.PI, TAU));
    path(ctx, p => { p.moveTo(-2.2, 0); p.quadraticCurveTo(0, 0.7, 2.2, 0); });
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const k = Math.sin(walk + i * 2 + (s > 0 ? 1 : 0)) * 0.3;
        path(ctx, p => { p.moveTo(s * (0.8 + i * 0.5), 0.2); p.lineTo(s * (1.6 + i * 0.6), 0.6 + k); p.lineTo(s * (1.9 + i * 0.6), 1.4); });
      }
      path(ctx, p => { p.moveTo(s * 1.6, -0.8); p.lineTo(s * 2.6, -1.8); });
      path(ctx, p => { p.moveTo(s * 2.6, -1.8); p.arc(s * 2.9, -2.2, 0.55, s > 0 ? Math.PI * 0.6 + snap : -0.4, s > 0 ? Math.PI * 2.4 : Math.PI * 1.4 - snap); });
      path(ctx, p => { p.moveTo(s * 0.6, -1.2); p.lineTo(s * 0.7, -2); p.moveTo(s * 0.95, -2.1); p.arc(s * 0.7, -2.1, 0.25, 0, TAU); });
    }
  }

  // base = initial size range, max = size cap, hit = [half width, half height, y offset] in units
  const SPECIES = {
    tetra: { label: 'Cá nhỏ', speed: 1, base: [8, 11], max: 18, hit: [4.5, 2, 0], draw: drawTetra, school: true },
    goldfish: { label: 'Cá vàng', speed: 0.75, base: [9, 12], max: 17, hit: [4, 2.6, 0], draw: drawGoldfish },
    angel: { label: 'Cá thần tiên', speed: 0.6, base: [8, 10], max: 14, hit: [3, 4, 0], draw: drawAngel },
    puffer: { label: 'Cá nóc', speed: 0.7, base: [9, 12], max: 17, hit: [3, 3, 0], draw: drawPuffer },
    eel: { label: 'Lươn neon', speed: 0.9, base: [6, 8], max: 11, hit: [5.5, 1.6, 0], draw: drawEel },
    jelly: { label: 'Sứa', speed: 0.4, base: [9, 11], max: 15, hit: [2.2, 2.6, 1.3], draw: drawJelly, upright: true },
    crab: { label: 'Cua (bò dưới đáy)', speed: 0.6, base: [7, 9], max: 12, hit: [3, 2.2, -0.6], draw: drawCrab, upright: true, walker: true },
  };
  const species = f => SPECIES[f.species] || SPECIES.tetra;

  // ---- simulation ----
  function makeTank(w, h) {
    return { w, h, t: 0, fish: [], food: [], bubbles: [], decor: {}, night: false, mouse: null, school: { x: w / 2, y: h / 2, t: 0 } };
  }
  const floorY = s => s.h - 6;

  function newFish(s, c) {
    const sp = SPECIES[c.species] || SPECIES.tetra;
    return {
      id: c.id, species: c.species, color: c.color, name: c.name || '',
      x: rnd(0, s.w), y: rnd(s.h * 0.2, s.h * 0.8), vx: 0, vy: 0, dir: 1,
      size: rnd(...sp.base), ph: rnd(0, TAU), speed: rnd(0.8, 1.2),
      tx: rnd(0, s.w), ty: rnd(s.h * 0.2, s.h * 0.8), off: { x: rnd(-90, 90), y: rnd(-50, 50) },
      mood: Mood.newMood(), dash: 0, say: null, corner: null, hunger: rnd(0.2, 0.5), eating: 0, nagT: rnd(10, 30),
    };
  }

  // Make the tank match the config list [{id, species, color, name}]: new ids spawn, missing ids leave, the rest keep their place.
  function syncFish(s, list) {
    const ids = new Set(list.map(c => c.id));
    s.fish = s.fish.filter(f => ids.has(f.id));
    for (const c of list) {
      const f = s.fish.find(x => x.id === c.id);
      if (f) Object.assign(f, { species: c.species, color: c.color, name: c.name || '' }); else s.fish.push(newFish(s, c));
    }
  }

  // Scatter a pinch of pellets (rings) and flakes (stars) around (x, y).
  function drop(s, x, y, n = 7, spread = 50) {
    for (let i = 0; i < n; i++) {
      s.food.push({ x: x + rnd(-spread, spread), y: y + rnd(-spread * 0.4, spread * 0.4), star: Math.random() < 0.35, ph: rnd(0, TAU), rest: 0 });
    }
    if (s.food.length > 150) s.food.splice(0, s.food.length - 150);
  }

  function bubble(s, x, y, r = rnd(3, 9)) {
    if (s.bubbles.length < 80) s.bubbles.push({ x, y, r, vy: rnd(25, 60), ph: rnd(0, TAU), fill: Math.random() < 0.4 });
  }

  function nearestFood(s, f, onFloor) {
    let best = null, bd = Infinity;
    for (const p of s.food) {
      if (onFloor && p.y < floorY(s) - 1) continue;
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

  function eat(s, f, food) {
    s.food.splice(s.food.indexOf(food), 1);
    const sp = species(f);
    if (f.hunger > 0.3) f.size = Math.min(sp.max, f.size + 0.4);   // only hungry fish grow
    f.hunger = Math.max(0, f.hunger - 0.3);
    f.eating = 0.6;
    bubble(s, f.x + f.dir * f.size * 3, f.y, rnd(3, 6));
  }

  function stepCrab(s, f, sp, dt) {
    const food = f.mood.sulk > 0 ? null : nearestFood(s, f, true);
    if (!food && Math.abs(f.tx - f.x) < 10) f.tx = rnd(40, s.w - 40);
    const tx = f.mood.sulk > 0 ? (f.corner || f).x : food ? food.x : f.tx;
    const dx = tx - f.x, v = Math.abs(dx) < 3 ? 0 : Math.sign(dx) * (food ? 70 : 30) * f.speed * sp.speed * (s.night ? 0.4 : 1);
    f.vx += (v - f.vx) * Math.min(1, 4 * dt); f.vy = 0;
    f.x += f.vx * dt; f.y = floorY(s) - f.size * 1.4;
    if (food && Math.abs(food.x - f.x) < f.size * 2.4) eat(s, f, food);
  }

  function step(s, dt) {
    s.t += dt;
    const floor = floorY(s), m = s.mouse;
    for (const p of s.food) {
      if (p.y < floor) { p.y = Math.min(floor, p.y + 28 * dt); p.x += Math.sin(s.t * 1.5 + p.ph) * 10 * dt; }
      else p.rest += dt;
    }
    s.food = s.food.filter(p => p.rest < 20);

    if ((s.school.t -= dt) <= 0) s.school = { x: rnd(140, s.w - 140), y: rnd(s.h * 0.2, s.h * 0.75), t: rnd(6, 10) };

    for (const f of s.fish) {
      const sp = species(f);
      Mood.decay(f.mood, dt);
      if (f.say && (f.say.t -= dt) <= 0) f.say = null;
      f.dash = Math.max(0, f.dash - dt);
      f.eating = Math.max(0, f.eating - dt);
      f.hunger = Math.min(1, f.hunger + dt / HUNGRY_SECS);
      if ((f.nagT -= dt) <= 0) {
        f.nagT = rnd(20, 40);
        if (f.hunger > 0.75 && !f.say) f.say = { text: 'đói...', t: 2 };
        else if (s.night && !f.say && Math.random() < 0.5) f.say = { text: 'z', t: 1.5 };
      }
      if (sp.walker) { stepCrab(s, f, sp, dt); continue; }
      const sulking = f.mood.sulk > 0;

      // Cursor: a fast swipe nearby startles fish; a still cursor makes them curious.
      const md = m ? Math.hypot(m.x - f.x, m.y - f.y) : Infinity;
      if (!sulking && m && m.speed > 1500 && md < 140 && f.dash <= 0) {
        f.tx = f.x + (f.x - m.x) / (md || 1) * 300; f.ty = f.y + (f.y - m.y) / (md || 1) * 150;
        f.dash = 0.8;
      }

      let food = null, tx, ty, speed;
      if (sulking) { const c = f.corner || { x: f.x, y: f.y }; tx = c.x; ty = c.y; speed = 80; }
      else if (f.dash > 0) { tx = f.tx; ty = f.ty; speed = 320; }
      else if ((food = f.hunger > 0.15 ? nearestFood(s, f) : null)) { tx = food.x; ty = food.y; speed = 100 + f.hunger * 80; }
      else if (m && s.t - m.at > 1.2 && md < 300) { tx = m.x + f.off.x * 0.6; ty = m.y + f.off.y * 0.6; speed = 50; }
      else if (sp.school && !s.night) { tx = s.school.x + f.off.x; ty = s.school.y + f.off.y; speed = 60; }
      else {
        if (Math.hypot(f.tx - f.x, f.ty - f.y) < 30) {
          f.tx = rnd(40, s.w - 40);
          f.ty = s.night ? rnd(s.h * 0.7, s.h * 0.92) : rnd(s.h * 0.15, s.h * 0.85);
        }
        tx = f.tx; ty = f.ty; speed = s.night ? 18 : 45;
      }
      if (f.hunger > 0.75 && !food) speed *= 0.7;
      const d = Math.hypot(tx - f.x, ty - f.y) || 1;
      const sp2 = (d < 10 && !food ? 0 : speed) * f.speed * sp.speed;
      const k = Math.min(1, 2 * dt);
      f.vx += ((tx - f.x) / d * sp2 - f.vx) * k;
      f.vy += ((ty - f.y) / d * sp2 - f.vy) * k;
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.x = Math.max(-40, Math.min(s.w + 40, f.x)); f.y = Math.max(10, Math.min(floor - 8, f.y));
      if (Math.abs(f.vx) > 8) f.dir = f.vx > 0 ? 1 : -1;
      if (food && d < f.size * 1.6) eat(s, f, food);
    }

    for (const b of s.bubbles) { b.y -= b.vy * dt; b.x += Math.sin(s.t * 2 + b.ph) * 12 * dt; }
    s.bubbles = s.bubbles.filter(b => b.y > -20);
    if (Math.random() < dt * 0.8) {
      const f = s.fish[Math.floor(Math.random() * s.fish.length)];
      f ? bubble(s, f.x + f.dir * f.size * 3, f.y) : bubble(s, rnd(0, s.w), s.h);
    }
    // Decorations that make bubbles (positions match decor.js).
    if (s.decor.airstone && Math.random() < dt * 7) bubble(s, s.w * 0.62 + rnd(-4, 4), s.h - 14, rnd(2, 5));
    if (s.decor.chest && s.t % 9 < 1.5 && Math.random() < dt * 14) bubble(s, s.w * 0.42 + rnd(-10, 10), s.h - 34, rnd(3, 7));
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
    else if (f.hunger > 0.75) ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 2 + f.ph));   // hungry: flicker
    glow(ctx, f.color, Math.max(2.5, u * 0.3) / u);
    sp.draw(ctx, f, t);
    ctx.restore();
    if (f.say) neonText(ctx, f.say.text, f.x, f.y - u * 3, f.color);
  }

  // Hover card: name + hunger bar.
  function drawTip(ctx, f) {
    const x = f.x, y = f.y - f.size * 4 - 10, w = 96;
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,28,.82)'; ctx.strokeStyle = f.color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 30, w, 32, 7); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText(f.name || species(f).label, x, y - 16);
    ctx.fillStyle = '#26304d'; ctx.fillRect(x - 38, y - 9, 76, 5);
    ctx.fillStyle = f.hunger > 0.75 ? '#ff5370' : f.hunger > 0.4 ? '#ffd166' : '#2ee6a6';
    ctx.fillRect(x - 38, y - 9, 76 * (1 - f.hunger), 5);
    ctx.restore();
  }

  function draw(ctx, s) {
    ctx.save();
    for (const b of s.bubbles) {
      glow(ctx, '#29b6f6', 2.5);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
      if (b.fill) { ctx.fillStyle = 'rgba(30,60,120,.7)'; ctx.fill(); }
    }
    for (const p of s.food) {
      glow(ctx, GOLD, 3); ctx.fillStyle = GOLD;
      ctx.globalAlpha = Math.min(1, (20 - p.rest) / 3);
      if (p.star) drawStar(ctx, p.x, p.y, 7);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, TAU); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    for (const f of s.fish) drawFish(ctx, f, s.t);
    ctx.restore();
  }

  Object.assign(exports, { MAX_FISH, SPECIES, PALETTE, NAMES, makeTank, syncFish, drop, step, draw, drawFish, drawTip, pokeFish, fishAt });
})(typeof module === 'object' ? module.exports : (window.Fish = {}),
   typeof module === 'object' ? require('./neon') : window.Neon,
   typeof module === 'object' ? require('./mood') : window.Mood);
