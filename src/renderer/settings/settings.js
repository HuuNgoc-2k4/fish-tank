// Settings GUI: edits the config and sends every change to the main process, which saves it and pushes it to the overlays.
const $ = id => document.getElementById(id);
const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pick = a => a[Math.floor(Math.random() * a.length)];
const PET_NAMES = ['Miu', 'Bông', 'Mướp', 'Vàng', 'Mực', 'Lu', 'Đậu', 'Sữa', 'Kem', 'Cam'];
const TRASH = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/></svg>';
let cfg;
const previews = [];          // { canvas, draw(ctx, t) } redrawn every frame

const save = () => bridge.setConfig(cfg);

// ---- navigation ----
document.querySelectorAll('.nav').forEach(b => b.onclick = () => {
  document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.page').forEach(p => { p.hidden = p.id !== 'tab-' + b.dataset.tab; });
});

// ---- small builders ----
function fillSelect(select, entries, value, onChange) {
  select.replaceChildren(...entries.map(([k, label]) => el('option', { value: k, textContent: label })));
  select.value = value;
  select.onchange = () => onChange(select.value);
}
const speciesEntries = Object.entries(Fish.SPECIES).map(([k, v]) => [k, v.label]);
const typeEntries = Object.entries(Pet.TYPES).map(([k, v]) => [k, v.label]);
const nameInput = obj => el('input', {
  type: 'text', className: 'name', value: obj.name || '', placeholder: 'Đặt tên', maxLength: 20,
  oninput: e => { obj.name = e.target.value; save(); },
});
const colorInput = (obj, title) => {
  const c = el('input', { type: 'color', value: obj.color, title, oninput: () => { obj.color = c.value; save(); } });
  return c;
};
const delBtn = onclick => { const b = el('button', { className: 'icon', title: 'Xóa', onclick }); b.innerHTML = TRASH; return b; };

// ---- live previews ----
function canvasFor(w, h, draw) {
  const c = el('canvas', { width: w * 2, height: h * 2 });
  c.style.width = w + 'px'; c.style.height = h + 'px';
  previews.push({ canvas: c, draw });
  return c;
}
function fishPreview(f) {
  const fake = { x: 32, y: 20, vx: 40, vy: 0, dir: 1, ph: 1, mood: { sulk: 0 }, hunger: 0, eating: 0 };
  return canvasFor(64, 40, (ctx, t) => {
    Object.assign(fake, {
      species: f.species, color: f.color, size: { eel: 3.8, angel: 4.2 }[f.species] || 5,
      y: f.species === 'jelly' ? 13 : f.species === 'crab' ? 26 : 20,
    });
    Fish.drawFish(ctx, fake, t);
  });
}
function petPreview(a) {
  const world = Pet.makeWorld(64, 52); world.scale = 0.42;
  const p = { x: 32, y: 0, vx: 0, dir: 1, state: 'walk', timer: 0, t: 0, walkPh: 0, ang: 0, lying: false, mood: { sulk: 0, annoy: 0 }, needs: {}, say: null, name: '' };
  const cycle = ['walk', 'sit', 'happy', 'purr'];
  return canvasFor(64, 52, (ctx, t) => {
    Object.assign(p, { type: a.type, color: a.color });
    p.state = cycle[Math.floor(t / 2.5) % cycle.length];
    p.vx = p.state === 'walk' ? 60 : 0; p.walkPh = t * 8;
    p.y = p.state === 'happy' ? -Math.abs(Math.sin(t * 6)) * 8 : 0;
    PetDraw.drawPet(ctx, world, p, t);
  });
}
(function loop(now) {
  const t = now / 1000;
  for (const pv of previews) {
    if (!pv.canvas.isConnected) continue;
    const ctx = pv.canvas.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, pv.canvas.width, pv.canvas.height);
    ctx.save(); pv.draw(ctx, t); ctx.restore();
  }
  requestAnimationFrame(loop);
})(0);

// ---- lists ----
function renderFish() {
  $('fishList').replaceChildren(...cfg.fish.map((f, i) => {
    const species = el('select');
    fillSelect(species, speciesEntries, f.species, v => { f.species = v; save(); });
    return el('li', {}, fishPreview(f), nameInput(f), species, colorInput(f, 'Màu'), delBtn(() => { cfg.fish.splice(i, 1); save(); render(); }));
  }));
  $('fishCount').textContent = `${cfg.fish.length}/${Fish.MAX_FISH}`;
  $('addFish').disabled = cfg.fish.length >= Fish.MAX_FISH;
}

function renderPets() {
  $('petList').replaceChildren(...cfg.animals.map((a, i) => {
    const type = el('select'), color = colorInput(a, a.type === 'fancy' ? 'Màu váy áo' : 'Màu lông');
    fillSelect(type, typeEntries, a.type, v => {
      if (a.color === Pet.TYPES[a.type].color) a.color = color.value = Pet.TYPES[v].color;   // swap defaults, keep custom colours
      a.type = v;
      color.title = v === 'fancy' ? 'Màu váy áo' : 'Màu lông';
      save();
    });
    return el('li', {}, petPreview(a), nameInput(a), type, color, delBtn(() => { cfg.animals.splice(i, 1); save(); render(); }));
  }));
  $('petCount').textContent = `${cfg.animals.length}/${Pet.MAX_PETS}`;
  $('addPet').disabled = cfg.animals.length >= Pet.MAX_PETS;
}

function render() {
  previews.length = 0;
  renderFish();
  renderPets();
}

function init(c) {
  cfg = c;
  $('aq').checked = cfg.aquarium;
  $('aq').onchange = () => { cfg.aquarium = $('aq').checked; save(); };
  $('pets').checked = cfg.pets;
  $('pets').onchange = () => { cfg.pets = $('pets').checked; save(); };
  $('decor').replaceChildren(...Object.entries(Decor.LABELS).map(([k, label]) => {
    const box = el('input', { type: 'checkbox', checked: cfg.decor[k], onchange: () => { cfg.decor[k] = box.checked; save(); } });
    return el('label', { className: 'chip' }, box, el('span', { textContent: label }));
  }));
  const showScale = () => { $('petScaleVal').textContent = Math.round(cfg.petScale * 100) + '%'; };
  $('petScale').value = cfg.petScale; showScale();
  $('petScale').oninput = () => { cfg.petScale = Number($('petScale').value); showScale(); save(); };
  render();
}

fillSelect($('newSpecies'), speciesEntries, 'tetra', () => {});
fillSelect($('newType'), typeEntries, 'cat', () => {});
$('addFish').onclick = () => {
  if (cfg.fish.length >= Fish.MAX_FISH) return;
  cfg.fish.push({ id: newId(), species: $('newSpecies').value, color: Fish.PALETTE[cfg.fish.length % Fish.PALETTE.length], name: pick(Fish.NAMES) });
  save(); render();
};
$('addPet').onclick = () => {
  if (cfg.animals.length >= Pet.MAX_PETS) return;
  const type = $('newType').value, used = new Set(cfg.animals.map(a => a.name));
  cfg.animals.push({ id: newId(), type, color: Pet.TYPES[type].color, name: PET_NAMES.find(n => !used.has(n)) || '' });
  save(); render();
};
$('reset').onclick = async () => {
  if (!confirm('Đặt lại toàn bộ cá, thú cưng và trang trí về mặc định?')) return;
  bridge.setConfig({});
  init(await bridge.getConfig());
};

bridge.getConfig().then(init);
