// Pet layer: a transparent, always-on-top window over the whole work area. Pets walk on its bottom edge
// (the top of the taskbar). It is click-through except over a pet, the ball, or the open menu.
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const world = Pet.makeWorld(innerWidth, innerHeight - 2);
const $ = id => document.getElementById(id);
const menu = $('menu');
let mouse = null, captured = false;
let press = null;            // { kind: 'pet' | 'ball', p, x, y, t, grabbed, last }
let menuPet = null, menuAway = 0;

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.w = innerWidth; world.ground = innerHeight - 2;
}
addEventListener('resize', resize);
resize();
console.log('pet layer started', innerWidth, innerHeight);

// ---- mouse: click = tease, drag = pick up by the scruff and throw, rub = pet, right click = menu ----
const overMenu = (x, y) => {
  if (menu.hidden) return false;
  const r = menu.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
};

function startGrab() {
  press.grabbed = true;
  if (press.kind === 'pet') Pet.grab(world, press.p, press.x, press.y); else Pet.grabBall(world);
}

function finish(asClick) {
  if (!press) return;
  if (press.grabbed) press.kind === 'pet' ? Pet.release(world, press.p) : Pet.releaseBall(world);
  else if (asClick && press.kind === 'pet') Pet.click(world, press.p);
  else if (asClick && world.ball) { world.ball.vx = (Math.random() - 0.5) * 900; world.ball.vy = -600; }  // flick the ball
  press = null;
}

addEventListener('mousedown', e => {
  if (overMenu(e.clientX, e.clientY)) return;
  closeMenu();
  if (e.button !== 0) return;
  const x = e.clientX, y = e.clientY, t = performance.now();
  if (Pet.ballAt(world, x, y)) press = { kind: 'ball', x, y, t, last: t, grabbed: false };
  else {
    const p = Pet.petAt(world, x, y);
    if (p) press = { kind: 'pet', p, x, y, t, last: t, grabbed: false };
  }
});

addEventListener('mousemove', e => {
  const x = e.clientX, y = e.clientY;
  const dx = mouse ? x - mouse.x : 0;
  mouse = { x, y };
  if (world.laser) world.laser.x = Math.max(10, Math.min(world.w - 10, x));
  if (press) {
    if (e.buttons === 0) return finish(false);         // the button came up somewhere we didn't hear about
    const dt = Math.max(0.001, (e.timeStamp - press.last) / 1000);
    press.last = e.timeStamp;
    if (!press.grabbed && Math.hypot(x - press.x, y - press.y) > 6) startGrab();
    if (press.grabbed) press.kind === 'pet' ? Pet.drag(world, press.p, x, y, dt) : Pet.dragBall(world, x, y, dt);
    return;
  }
  const p = e.buttons === 0 && Pet.petAt(world, x, y);
  if (p && dx) Pet.rub(world, p, dx);
});

addEventListener('mouseup', e => { if (e.button === 0) finish(true); });
addEventListener('blur', () => finish(false));
addEventListener('contextmenu', e => {
  e.preventDefault();
  const p = Pet.petAt(world, e.clientX, e.clientY);
  if (p) openMenu(p, e.clientX, e.clientY);
});

// ---- right-click menu ----
function openMenu(p, x, y) {
  menuPet = p; menuAway = 0;
  $('mName').textContent = p.name || (Pet.TYPES[p.type] || {}).label || '';
  $('mType').textContent = (Pet.TYPES[p.type] || {}).label || '';
  menu.hidden = false;
  const r = menu.getBoundingClientRect();
  menu.style.left = Math.max(4, Math.min(innerWidth - r.width - 4, x - 12)) + 'px';
  menu.style.top = Math.max(4, Math.min(innerHeight - r.height - 4, y - r.height + 12)) + 'px';
  updateMenu();
}
function closeMenu() { menu.hidden = true; menuPet = null; }
function updateMenu() {
  const n = menuPet.needs;
  $('bFood').style.width = n.food * 100 + '%';
  $('bEnergy').style.width = n.energy * 100 + '%';
  $('bFun').style.width = n.fun * 100 + '%';
  $('mSleep').textContent = menuPet.state === 'sleep' ? '☀️ Đánh thức' : '💤 Đi ngủ';
}
menu.addEventListener('click', e => {
  const cmd = e.target.closest('button')?.dataset.cmd;
  if (cmd && menuPet) Pet.command(world, menuPet, cmd);
  if (cmd) closeMenu();
});

// ---- config + custom (image) pet types ----
let cfg = null;
function registerTypes(list) { for (const d of list) Pet.addType(d.id, d); }
function applyConfig(c) { cfg = c; Pet.syncPets(world, c.animals, c.petScale); }
Promise.all([bridge.getPetTypes(), bridge.getConfig()]).then(([types, c]) => { registerTypes(types); applyConfig(c); });
bridge.onConfig(applyConfig);
bridge.onPetTypes(list => { registerTypes(list); if (cfg) applyConfig(cfg); });

// ---- loop ----
let last = performance.now();
(function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (press && !press.grabbed && now - press.t > 250) startGrab();   // long press also picks up
  Pet.stepWorld(world, dt);
  if (menuPet && !world.pets.includes(menuPet)) closeMenu();
  if (menuPet) {
    updateMenu();
    menuAway = mouse && overMenu(mouse.x, mouse.y) ? 0 : menuAway + dt;
    if (menuAway > 1.5) closeMenu();
  }

  const hoverPet = mouse && !press ? Pet.petAt(world, mouse.x, mouse.y) : null;
  const hoverBall = mouse && Pet.ballAt(world, mouse.x, mouse.y);
  world.hover = hoverPet;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  PetDraw.drawWorld(ctx, world, now / 1000);

  // Catch the mouse only where there's something to interact with, so the rest of the screen keeps working.
  const want = !!(press || hoverPet || hoverBall || (mouse && overMenu(mouse.x, mouse.y)));
  if (want !== captured) { captured = want; bridge.capture(want); }
  document.body.style.cursor = press && press.grabbed ? 'grabbing' : hoverPet || hoverBall ? 'grab' : '';
  requestAnimationFrame(loop);
})(last);
