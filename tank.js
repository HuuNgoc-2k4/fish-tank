// Fish tank simulation + neon drawing. Pure logic (no DOM) so node can test it.
const COLORS = ['#33c7ff', '#2ee6a6', '#ff6ec7', '#b388ff', '#ffd166'];
const GOLD = '#ffb300';
const rnd = (a, b) => a + Math.random() * (b - a);

function makeTank(w, h) {
  return { w, h, t: 0, fish: [], food: [], bubbles: [] };
}

function addFish(s) {
  const n = s.fish.length;
  s.fish.push({
    x: rnd(0, s.w), y: rnd(s.h * 0.2, s.h * 0.8), vx: 0, vy: 0, dir: 1,
    size: rnd(8, 11), color: COLORS[n % COLORS.length], ph: rnd(0, 6.28),
    tx: rnd(0, s.w), ty: rnd(s.h * 0.2, s.h * 0.8), speed: rnd(0.8, 1.2),
  });
}

// Scatter a handful of pellets (rings) and stars around (x, y).
function drop(s, x, y, n = 7) {
  for (let i = 0; i < n; i++) {
    s.food.push({ x: x + rnd(-50, 50), y: y + rnd(-20, 20), star: Math.random() < 0.35, ph: rnd(0, 6.28), rest: 0 });
  }
}

function bubble(s, x, y, r = rnd(3, 9)) {
  if (s.bubbles.length < 40) s.bubbles.push({ x, y, r, vy: rnd(25, 60), ph: rnd(0, 6.28), fill: Math.random() < 0.4 });
}

function nearestFood(s, f) {
  let best = null, bd = Infinity;
  for (const p of s.food) {
    const d = Math.hypot(p.x - f.x, p.y - f.y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
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
    const food = nearestFood(s, f);
    if (!food && Math.hypot(f.tx - f.x, f.ty - f.y) < 30) {
      f.tx = rnd(40, s.w - 40); f.ty = rnd(s.h * 0.15, s.h * 0.85);
    }
    const tx = food ? food.x : f.tx, ty = food ? food.y : f.ty;
    const d = Math.hypot(tx - f.x, ty - f.y) || 1;
    const sp = (food ? 150 : 45) * f.speed;
    const k = Math.min(1, 2 * dt);
    f.vx += ((tx - f.x) / d * sp - f.vx) * k;
    f.vy += ((ty - f.y) / d * sp - f.vy) * k;
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (Math.abs(f.vx) > 8) f.dir = f.vx > 0 ? 1 : -1;

    if (food && d < f.size * 1.6) {
      s.food.splice(s.food.indexOf(food), 1);
      f.size = Math.min(18, f.size + 0.4);
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
function glow(ctx, color, lw) {
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}

function drawFish(ctx, f, t) {
  const u = f.size;
  glow(ctx, f.color, Math.max(2.5, u * 0.3));
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.dir, 1);
  ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx) + 40) * 0.5);
  const amp = (0.1 + Math.min(Math.abs(f.vx), 150) / 150 * 0.15) * u;
  // fish = "><(((o>" ; each part wiggles with a phase offset along the body
  const parts = [
    [-4.8, p => { p.moveTo(-5.4, -1); p.lineTo(-4.4, 0); p.lineTo(-5.4, 1); }],
    [-3.5, p => { p.moveTo(-3, -1); p.lineTo(-4, 0); p.lineTo(-3, 1); }],
    [-1.5, p => { p.moveTo(-1.5, -1.1); p.quadraticCurveTo(-2.7, 0, -1.5, 1.1); }],
    [-0.3, p => { p.moveTo(-0.3, -1.1); p.quadraticCurveTo(-1.5, 0, -0.3, 1.1); }],
    [0.9, p => { p.moveTo(0.9, -1.1); p.quadraticCurveTo(-0.3, 0, 0.9, 1.1); }],
    [1.9, p => { p.moveTo(2.4, 0); p.arc(1.9, 0, 0.5, 0, 6.29); }],
    [3, p => { p.moveTo(2.6, -0.9); p.lineTo(3.6, 0); p.lineTo(2.6, 0.9); }],
  ];
  for (const [x, draw] of parts) {
    ctx.save();
    ctx.translate(0, Math.sin(t * 9 + f.ph - x * 0.9) * amp);
    ctx.scale(u, u);
    ctx.lineWidth = Math.max(2.5, u * 0.3) / u;
    ctx.beginPath(); draw(ctx); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

function draw(ctx, s) {
  ctx.clearRect(0, 0, s.w, s.h);
  ctx.save();
  // seaweed
  [0.1, 0.5, 0.9].forEach((fx, i) => {
    glow(ctx, '#19e0a0', 3);
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) ctx.lineTo(fx * s.w + Math.sin(s.t * 1.2 + k * 0.6 + i) * k * 3, s.h - k * 14);
    ctx.stroke();
  });
  // bubbles
  for (const b of s.bubbles) {
    glow(ctx, '#29b6f6', 2.5);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.29); ctx.stroke();
    if (b.fill) { ctx.fillStyle = 'rgba(30,60,120,.7)'; ctx.fill(); }
  }
  // food
  for (const p of s.food) {
    glow(ctx, GOLD, 3); ctx.fillStyle = GOLD;
    if (p.star) drawStar(ctx, p.x, p.y, 7);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 6.29); ctx.stroke(); }
  }
  for (const f of s.fish) drawFish(ctx, f, s.t);
  ctx.restore();
}

if (typeof module !== 'undefined') module.exports = { makeTank, addFish, drop, step, draw };
