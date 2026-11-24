const fs = require('fs');
const { SPECIES, MAX_FISH } = require('../core/fish');
const { TYPES, MAX_PETS } = require('../core/pet');

const COLOR = /^#[0-9a-f]{6}$/i;
const DECOR = ['plants', 'rocks', 'castle', 'chest', 'airstone'];

const DEFAULTS = {
  aquarium: true,
  pets: true,
  fish: [
    { id: 'f1', species: 'tetra', color: '#33c7ff', name: 'Neon' },
    { id: 'f2', species: 'tetra', color: '#2ee6a6', name: 'Tép' },
    { id: 'f3', species: 'puffer', color: '#ff6ec7', name: 'Bống' },
    { id: 'f4', species: 'goldfish', color: '#ffb300', name: 'Vàng' },
  ],
  decor: Object.fromEntries(DECOR.map(k => [k, true])),
  animals: [
    { id: 'p1', type: 'cat', color: '#ffb74d', name: 'Miu' },
    { id: 'p2', type: 'fancy', color: '#ff4f8b', name: 'Bông' },
  ],
  petScale: 1,
};

const validId = (id, seen) => typeof id === 'string' && id.length > 0 && id.length <= 40 && !seen.has(id) && seen.add(id);
const name = n => (typeof n === 'string' ? n.trim().slice(0, 20) : '');

// Config comes from a file and from the settings window: never trust its shape.
function sanitize(c) {
  c = c && typeof c === 'object' ? c : {};
  const seenF = new Set(), seenP = new Set();
  const fish = (Array.isArray(c.fish) ? c.fish : DEFAULTS.fish)
    .filter(f => f && SPECIES[f.species] && COLOR.test(f.color) && validId(f.id, seenF))
    .slice(0, MAX_FISH)
    .map(f => ({ id: f.id, species: f.species, color: f.color, name: name(f.name) }));

  // Older versions had a single `pet: {type, color}`.
  let animals = Array.isArray(c.animals) ? c.animals
    : c.pet && typeof c.pet === 'object' ? [{ id: 'p1', name: 'Miu', ...c.pet }] : DEFAULTS.animals;
  animals = animals
    .filter(a => a && validId(a.id, seenP))
    .slice(0, MAX_PETS)
    .map(a => {
      const type = TYPES[a.type] ? a.type : 'cat';
      return { id: a.id, type, color: COLOR.test(a.color) ? a.color : TYPES[type].color, name: name(a.name) };
    });

  const d = c.decor && typeof c.decor === 'object' ? c.decor : {};
  const scale = Number(c.petScale);
  return {
    aquarium: typeof c.aquarium === 'boolean' ? c.aquarium : DEFAULTS.aquarium,
    pets: typeof c.pets === 'boolean' ? c.pets : DEFAULTS.pets,
    fish,
    decor: Object.fromEntries(DECOR.map(k => [k, typeof d[k] === 'boolean' ? d[k] : true])),
    animals,
    petScale: Number.isFinite(scale) ? Math.min(1.6, Math.max(0.7, scale)) : DEFAULTS.petScale,
  };
}

function loadConfig(file) {
  try { return sanitize(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch { return sanitize({}); }
}

function saveConfig(file, cfg) {
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
}

module.exports = { MAX_FISH, MAX_PETS, DEFAULTS, DECOR, sanitize, loadConfig, saveConfig };
