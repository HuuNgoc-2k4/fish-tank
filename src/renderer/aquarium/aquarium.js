// Desktop aquarium. Sits under normal windows, so it is only visible (and clickable) on the bare desktop.
const { makeTank, syncFish, drop, step, draw, pokeFish, fishAt } = Fish;

const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const tank = makeTank(innerWidth, innerHeight);
let enabled = false, feedHeld = false, over = false, mouse = null;

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tank.w = innerWidth; tank.h = innerHeight;
}
addEventListener('resize', resize);
resize();
console.log('aquarium started', tank.w, tank.h);

addEventListener('mousemove', e => { mouse = { x: e.clientX, y: e.clientY }; });
addEventListener('mousedown', e => {
  if (!enabled || e.button !== 0) return;
  if (feedHeld) { drop(tank, e.clientX, e.clientY); return; }
  const f = fishAt(tank, e.clientX, e.clientY);
  if (f) pokeFish(tank, f);
});

bridge.onFeedKey(down => { feedHeld = down; });
bridge.onFeed(() => drop(tank, 60 + Math.random() * (tank.w - 120), -10, 10));

function applyConfig(cfg) {
  enabled = cfg.aquarium;
  syncFish(tank, cfg.fish);
  if (!enabled) { ctx.clearRect(0, 0, tank.w, tank.h); setOver(false); }
}
bridge.getConfig().then(applyConfig);
bridge.onConfig(applyConfig);

// Tell main when the cursor is over a fish so it can stop being click-through (checked every frame: fish move).
function setOver(h) {
  if (h === over) return;
  over = h;
  bridge.capture(h);
}

let last = performance.now();
(function loop(now) {
  if (enabled) {
    step(tank, Math.min(0.05, (now - last) / 1000));
    draw(ctx, tank);
    const onFish = !feedHeld && mouse && fishAt(tank, mouse.x, mouse.y);
    setOver(!!onFish);
    document.body.style.cursor = feedHeld ? 'crosshair' : onFish ? 'pointer' : '';
  }
  last = now;
  requestAnimationFrame(loop);
})(last);
