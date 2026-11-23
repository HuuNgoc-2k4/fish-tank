const fs = require('fs');
const { SPECIES, MAX_FISH } = require('../core/fish');
const { PETS } = require('../core/pet');

const COLOR = /^#[0-9a-f]{6}$/i;

const DEFAULTS = {
  aquarium: true,
  pets: true,
  fish: [
    { id: 'f1', species: 'tetra', color: '#33c7ff' },
    { id: 'f2', species: 'tetra', color: '#2ee6a6' },
    { id: 'f3', species: 'puffer', color: '#ff6ec7' },
  ],
  pet: { type: 'cat', color: '#ffb74d' },
};

// Config comes from a file and from the settings window: never trust its shape.
function sanitize(c) {
  c = c && typeof c === 'object' ? c : {};
  const seen = new Set();
  const fish = (Array.isArray(c.fish) ? c.fish : DEFAULTS.fish)
    .filter(f => f && SPECIES[f.species] && COLOR.test(f.color) && typeof f.id === 'string'
      && f.id.length > 0 && f.id.length <= 40 && !seen.has(f.id) && seen.add(f.id))
    .slice(0, MAX_FISH)
    .map(f => ({ id: f.id, species: f.species, color: f.color }));
  const pet = c.pet && typeof c.pet === 'object' ? c.pet : {};
  return {
    aquarium: typeof c.aquarium === 'boolean' ? c.aquarium : DEFAULTS.aquarium,
    pets: typeof c.pets === 'boolean' ? c.pets : DEFAULTS.pets,
    fish,
    pet: {
      type: PETS[pet.type] ? pet.type : DEFAULTS.pet.type,
      color: COLOR.test(pet.color) ? pet.color : DEFAULTS.pet.color,
    },
  };
}

function loadConfig(file) {
  try { return sanitize(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch { return sanitize({}); }
}

function saveConfig(file, cfg) {
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
}

module.exports = { MAX_FISH, DEFAULTS, sanitize, loadConfig, saveConfig };
