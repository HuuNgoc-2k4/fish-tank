// Settings GUI: edits the config and sends every change to the main process, which saves it and pushes it to the overlays.
const $ = id => document.getElementById(id);
const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pick = a => a[Math.floor(Math.random() * a.length)];
const PET_NAMES = ['Miu', 'Bông', 'Mướp', 'Vàng', 'Mực', 'Lu', 'Đậu', 'Sữa', 'Kem', 'Cam'];
let cfg;
const previews = [];          // { canvas, draw(ctx, t) } redrawn every frame

const save = () => bridge.setConfig(cfg);

// ---- tabs ----
document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.page').forEach(p => { p.hidden = p.id !== 'tab-' + b.dataset.tab; });
});

function fillSelect(select, entries, value, onChange) {
  select.replaceChildren(...entries.map(([k, label]) => el('option', { value: k, textContent: label })));
  select.value = value;
  select.onchange = () => onChange(select.value);
}
const speciesEntries = Object.entries(Fish.SPECIES).map(([k, v]) => [k, v.label]);
const typeEntries = () => Object.entries(Pet.TYPES).map(([k, v]) => [k, v.label + (v.sprite ? ' (ảnh)' : '')]);
const nameInput = (obj, placeholder) => el('input', { type: 'text', value: obj.name || '', placeholder, maxLength: 20, oninput: e => { obj.name = e.target.value; save(); } });
const delBtn = onclick => el('button', { className: 'danger icon', textContent: '✕', title: 'Xóa', onclick });

// ---- live previews ----
function canvasFor(w, h, draw) {
  const c = el('canvas', { width: w * 2, height: h * 2 });
  c.style.width = w + 'px'; c.style.height = h + 'px';
  previews.push({ canvas: c, draw });
  return c;
}
function fishPreview(f) {
  const fake = { species: f.species, x: 36, y: 22, vx: 40, vy: 0, dir: 1, ph: 1, mood: { sulk: 0 }, hunger: 0, eating: 0 };
  return canvasFor(72, 44, (ctx, t) => {
    Object.assign(fake, { species: f.species, color: f.color, size: f.species === 'eel' ? 4.2 : 5.5, y: f.species === 'jelly' ? 15 : f.species === 'crab' ? 28 : 22 });
    Fish.drawFish(ctx, fake, t);
  });
}
function petPreview(a) {
  const world = Pet.makeWorld(96, 76); world.scale = 0.62;
  const p = { x: 48, y: 0, vx: 0, dir: 1, state: 'walk', timer: 0, t: 0, walkPh: 0, ang: 0, lying: false, mood: { sulk: 0 }, needs: {}, say: null };
  const cycle = ['walk', 'sit', 'happy', 'purr'];
  return canvasFor(96, 80, (ctx, t) => {
    Object.assign(p, { type: a.type, color: a.color, name: '' });
    p.state = cycle[Math.floor(t / 2.5) % cycle.length];
    p.vx = p.state === 'walk' ? 60 : 0; p.walkPh = t * 8;
    p.y = p.state === 'happy' ? -Math.abs(Math.sin(t * 6)) * 10 : 0;
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

// ---- fish ----
function renderFish() {
  $('fishList').replaceChildren(...cfg.fish.map((f, i) => {
    const species = el('select');
    fillSelect(species, speciesEntries, f.species, v => { f.species = v; save(); });
    const color = el('input', { type: 'color', value: f.color, oninput: () => { f.color = color.value; save(); } });
    const dice = el('button', { className: 'icon', textContent: '🎲', title: 'Đổi màu ngẫu nhiên', onclick: () => { f.color = color.value = pick(Fish.PALETTE); save(); } });
    return el('li', {}, fishPreview(f), nameInput(f, 'Tên'), species, color, dice, delBtn(() => { cfg.fish.splice(i, 1); save(); render(); }));
  }));
  $('fishCount').textContent = `(${cfg.fish.length}/${Fish.MAX_FISH})`;
  $('addFish').disabled = $('randFish').disabled = cfg.fish.length >= Fish.MAX_FISH;
}
function addFish(species) {
  if (cfg.fish.length >= Fish.MAX_FISH) return;
  cfg.fish.push({ id: newId(), species, color: Fish.PALETTE[cfg.fish.length % Fish.PALETTE.length], name: pick(Fish.NAMES) });
  save(); render();
}

// ---- pets ----
function renderPets() {
  $('petList').replaceChildren(...cfg.animals.map((a, i) => {
    const type = el('select');
    fillSelect(type, typeEntries(), a.type, v => {
      const was = (Pet.TYPES[a.type] || {}).color;
      a.type = v;
      if (a.color === was) a.color = color.value = Pet.TYPES[v].color;   // keep custom colours, swap defaults
      save();
    });
    const color = el('input', { type: 'color', value: a.color, title: a.type === 'fancy' ? 'Màu váy áo' : 'Màu lông', oninput: () => { a.color = color.value; save(); } });
    return el('li', {}, petPreview(a), nameInput(a, 'Tên'), type, color, delBtn(() => { cfg.animals.splice(i, 1); save(); render(); }));
  }));
  $('petCount').textContent = `(${cfg.animals.length}/${Pet.MAX_PETS})`;
  $('addPet').disabled = cfg.animals.length >= Pet.MAX_PETS;
  fillSelect($('newType'), typeEntries(), $('newType').value || 'cat', () => {});
}
function addPet(type) {
  if (cfg.animals.length >= Pet.MAX_PETS) return;
  const used = new Set(cfg.animals.map(a => a.name));
  cfg.animals.push({ id: newId(), type, color: Pet.TYPES[type].color, name: PET_NAMES.find(n => !used.has(n)) || '' });
  save(); render();
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
    return el('label', {}, box, label);
  }));
  $('petScale').value = cfg.petScale;
  $('petScaleVal').textContent = Math.round(cfg.petScale * 100) + '%';
  $('petScale').oninput = () => {
    cfg.petScale = Number($('petScale').value);
    $('petScaleVal').textContent = Math.round(cfg.petScale * 100) + '%';
    save();
  };
  render();
}

fillSelect($('newSpecies'), speciesEntries, 'tetra', () => {});
$('addFish').onclick = () => addFish($('newSpecies').value);
$('randFish').onclick = () => addFish(pick(Object.keys(Fish.SPECIES)));
$('addPet').onclick = () => addPet($('newType').value);

// ---- image pets ----
const registerTypes = list => { for (const d of list) Pet.addType(d.id, d); };
$('importPet').onclick = async () => {
  const r = await bridge.importPet();
  if (!r) return;
  if (r.error) { $('importMsg').textContent = 'Lỗi: ' + r.error; return; }
  registerTypes([r]);
  $('importMsg').textContent = `Đã thêm "${r.label}". Thư mục của nó có file pet.json để chỉnh chiều cao, tiếng kêu, tốc độ khung hình.`;
  if (cfg.animals.length < Pet.MAX_PETS) addPet(r.id); else render();
};
$('openFolder').onclick = () => bridge.openPetFolder();
$('reloadPets').onclick = async () => { registerTypes(await bridge.reloadPets()); render(); $('importMsg').textContent = 'Đã tải lại thư mục thú cưng.'; };
bridge.onPetTypes(list => { registerTypes(list); if (cfg) render(); });

$('reset').onclick = async () => {
  if (!confirm('Khôi phục toàn bộ cá, thú cưng và trang trí về mặc định?')) return;
  bridge.setConfig({});
  init(await bridge.getConfig());
};

Promise.all([bridge.getPetTypes(), bridge.getConfig()]).then(([types, c]) => { registerTypes(types); init(c); });
