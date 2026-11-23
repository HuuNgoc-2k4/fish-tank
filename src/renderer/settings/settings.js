// Settings GUI: edits the config and sends every change to the main process, which saves it and pushes it to the overlays.
const $ = id => document.getElementById(id);
const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let cfg;

const save = () => bridge.setConfig(cfg);

function fillSelect(select, entries, value, onChange) {
  select.replaceChildren(...entries.map(([k, label]) => el('option', { value: k, textContent: label })));
  select.value = value;
  select.onchange = () => onChange(select.value);
}
const speciesEntries = Object.entries(Fish.SPECIES).map(([k, v]) => [k, v.label]);

function renderFish() {
  $('fishList').replaceChildren(...cfg.fish.map((f, i) => {
    const species = el('select');
    fillSelect(species, speciesEntries, f.species, v => { f.species = v; save(); });
    const color = el('input', { type: 'color', value: f.color, oninput: () => { f.color = color.value; save(); } });
    const del = el('button', { className: 'danger', textContent: 'Xóa', onclick: () => { cfg.fish.splice(i, 1); save(); renderFish(); } });
    return el('li', {}, species, color, del);
  }));
  $('count').textContent = `(${cfg.fish.length}/${Fish.MAX_FISH})`;
  $('addFish').disabled = cfg.fish.length >= Fish.MAX_FISH;
}

function init(c) {
  cfg = c;
  $('aq').checked = cfg.aquarium;
  $('aq').onchange = () => { cfg.aquarium = $('aq').checked; save(); };
  $('pets').checked = cfg.pets;
  $('pets').onchange = () => { cfg.pets = $('pets').checked; save(); };

  fillSelect($('newSpecies'), speciesEntries, 'tetra', () => {});
  $('newColor').value = Fish.PALETTE[cfg.fish.length % Fish.PALETTE.length];
  $('addFish').onclick = () => {
    if (cfg.fish.length >= Fish.MAX_FISH) return;
    cfg.fish.push({ id: newId(), species: $('newSpecies').value, color: $('newColor').value });
    $('newColor').value = Fish.PALETTE[cfg.fish.length % Fish.PALETTE.length];
    save(); renderFish();
  };
  renderFish();

  fillSelect($('petType'), Object.entries(Pet.PETS), cfg.pet.type, v => { cfg.pet.type = v; save(); });
  $('petColor').value = cfg.pet.color;
  $('petColor').oninput = () => { cfg.pet.color = $('petColor').value; save(); };
}

bridge.getConfig().then(init);
bridge.getStatus().then(st => {
  if (!st.feedKey) $('status').textContent = 'Không bắt được phím Ctrl toàn cục (có thể do phần mềm diệt virus chặn). Dùng Ctrl+Alt+F để thả thức ăn từ trên xuống.';
});
