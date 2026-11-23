// Pet strip: a wide transparent window whose bottom edge is the top of the taskbar.
const { makePet, stepPet, pokePet, petHit, drawPet } = Pet;

const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
let pet = null, over = false, mouse = null;
const baseY = () => innerHeight - 4; // canvas y of the pet's feet

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (pet) pet.w = innerWidth;
}
addEventListener('resize', resize);
resize();
console.log('pet started', innerWidth, innerHeight);

const hit = e => pet && petHit(pet, e.clientX, e.clientY, baseY());
addEventListener('mousemove', e => { mouse = { clientX: e.clientX, clientY: e.clientY }; });
addEventListener('mousedown', e => { if (e.button === 0 && hit(e)) pokePet(pet, false); });   // left click: tease
addEventListener('contextmenu', e => { e.preventDefault(); if (hit(e)) pokePet(pet, true); }); // right click: shoo away

function applyConfig(cfg) {
  if (!pet) pet = makePet(innerWidth, cfg.pet);
  else { pet.type = cfg.pet.type; pet.color = cfg.pet.color; }
}
bridge.getConfig().then(applyConfig);
bridge.onConfig(applyConfig);

let last = performance.now();
(function loop(now) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (pet) {
    stepPet(pet, Math.min(0.05, (now - last) / 1000));
    drawPet(ctx, pet, now / 1000, baseY());
    const h = !!(mouse && hit(mouse));   // re-checked every frame: the pet moves under a still cursor
    if (h !== over) { over = h; bridge.capture(h); }
    document.body.style.cursor = h ? 'pointer' : '';
  }
  last = now;
  requestAnimationFrame(loop);
})(last);
