// Desktop aquarium. Sits under normal windows, so it is only visible (and clickable) on the bare desktop.
// Feeding: click the food jar -> feeding mode (each click sprinkles food, right click / 10 s idle / jar again = stop).
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const tank = Fish.makeTank(innerWidth, innerHeight);
const JAR_R = 34, FEED_IDLE = 10;
let enabled = false, over = false, mouse = null, feeding = false, feedT = 0, shake = 0;

const jar = () => ({ x: tank.w - 80, y: tank.h - 190 });

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tank.w = innerWidth; tank.h = innerHeight;
}
addEventListener('resize', resize);
resize();
console.log('aquarium started', tank.w, tank.h);

const onJar = (x, y) => { const j = jar(); return Math.hypot(x - j.x, y - j.y) < JAR_R; };
function setFeeding(on) { feeding = on; feedT = 0; }

addEventListener('mousemove', e => {
  const now = tank.t, x = e.clientX, y = e.clientY;
  const m = tank.mouse;
  const speed = m && now > m.at ? Math.hypot(x - m.x, y - m.y) / (now - m.at) : 0;
  tank.mouse = { x, y, at: now, speed };
  mouse = { x, y };
});
addEventListener('mouseleave', () => { tank.mouse = null; mouse = null; });
addEventListener('mousedown', e => {
  if (!enabled || e.button !== 0) return;
  const x = e.clientX, y = e.clientY;
  if (onJar(x, y)) return setFeeding(!feeding);
  if (feeding) { Fish.drop(tank, x, y, 4, 22); feedT = 0; shake = 0.25; return; }
  const f = Fish.fishAt(tank, x, y);
  if (f) Fish.pokeFish(tank, f);
});
addEventListener('contextmenu', e => { e.preventDefault(); setFeeding(false); });

bridge.onFeed(() => Fish.drop(tank, 60 + Math.random() * (tank.w - 120), -10, 10));

function applyConfig(cfg) {
  enabled = cfg.aquarium;
  tank.decor = cfg.decor;
  Fish.syncFish(tank, cfg.fish);
  if (!enabled) { ctx.clearRect(0, 0, tank.w, tank.h); setFeeding(false); setOver(false); }
}
bridge.getConfig().then(applyConfig);
bridge.onConfig(applyConfig);

// Tell main when we want the mouse (cursor over a fish or the jar, or feeding mode) so it stops being click-through.
function setOver(h) {
  if (h === over) return;
  over = h;
  bridge.capture(h);
}

function drawJar(t) {
  const { x, y } = jar(), hot = feeding || (mouse && onJar(mouse.x, mouse.y));
  ctx.save();
  Neon.glow(ctx, '#ffb300', hot ? 3.5 : 2.5);
  ctx.beginPath(); ctx.roundRect(x - 20, y - 18, 40, 44, 9); ctx.stroke();                   // jar body
  ctx.save(); ctx.translate(x, y - 22); if (feeding) ctx.rotate(-0.5);
  ctx.beginPath(); ctx.roundRect(feeding ? -10 : -23, -7, 46, 9, 3); ctx.stroke();            // lid
  ctx.restore();
  ctx.fillStyle = '#ffb300';
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x - 12 + (i % 4) * 8 + (i > 3 ? 4 : 0), y + 18 - Math.floor(i / 4) * 7, 2.6, 0, Math.PI * 2); ctx.fill(); }
  Neon.neonText(ctx, feeding ? 'Bấm để rắc • chuột phải: thôi' : hot ? 'Bấm để cho cá ăn' : 'Thức ăn', x - (feeding ? 70 : 0), y + 48, '#ffd166');
  ctx.restore();
}

// Feeding cursor: a little shaker that tilts when you sprinkle.
function drawShaker() {
  ctx.save();
  ctx.translate(mouse.x, mouse.y); ctx.rotate(-0.6 - Math.sin(shake * 40) * shake);
  Neon.glow(ctx, '#ffb300', 2.5);
  ctx.beginPath(); ctx.roundRect(-8, -30, 16, 24, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(6, -6); ctx.stroke();
  ctx.restore();
}

let last = performance.now();
(function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (enabled) {
    const hour = new Date().getHours();
    tank.night = hour >= 22 || hour < 6;
    if (feeding && (feedT += dt) > FEED_IDLE) setFeeding(false);
    shake = Math.max(0, shake - dt);
    Fish.step(tank, dt);
    ctx.clearRect(0, 0, tank.w, tank.h);
    Decor.draw(ctx, tank);
    Fish.draw(ctx, tank);
    const onFish = !feeding && mouse && Fish.fishAt(tank, mouse.x, mouse.y);
    if (onFish) Fish.drawTip(ctx, onFish);
    drawJar(now / 1000);
    if (feeding && mouse) drawShaker();
    setOver(!!(feeding || onFish || (mouse && onJar(mouse.x, mouse.y))));
    document.body.style.cursor = feeding ? 'none' : onFish || (mouse && onJar(mouse.x, mouse.y)) ? 'pointer' : '';
  }
  requestAnimationFrame(loop);
})(last);
