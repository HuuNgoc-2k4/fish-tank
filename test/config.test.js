const test = require('node:test');
const assert = require('node:assert');
const { sanitize, DEFAULTS, MAX_FISH } = require('../src/main/config.js');

test('empty or garbage config falls back to defaults', () => {
  assert.deepEqual(sanitize(undefined), DEFAULTS);
  assert.deepEqual(sanitize('x'), DEFAULTS);
});

test('invalid fish are dropped, valid ones kept, duplicates removed', () => {
  const c = sanitize({
    fish: [
      { id: 'a', species: 'tetra', color: '#112233' },
      { id: 'a', species: 'eel', color: '#112233' },
      { id: 'b', species: 'shark', color: '#112233' },
      { id: 'c', species: 'jelly', color: 'red' },
      { id: 'd', species: 'jelly', color: '#AbCdEf', extra: 1 },
      null,
    ],
  });
  assert.deepEqual(c.fish, [{ id: 'a', species: 'tetra', color: '#112233' }, { id: 'd', species: 'jelly', color: '#AbCdEf' }]);
});

test('an explicit empty fish list stays empty; too many fish are capped', () => {
  assert.deepEqual(sanitize({ fish: [] }).fish, []);
  const many = Array.from({ length: 50 }, (_, i) => ({ id: 'f' + i, species: 'tetra', color: '#000000' }));
  assert.equal(sanitize({ fish: many }).fish.length, MAX_FISH);
});

test('pet and flags are validated', () => {
  const c = sanitize({ aquarium: false, pets: 'yes', pet: { type: 'dragon', color: '#zzzzzz' } });
  assert.equal(c.aquarium, false);
  assert.equal(c.pets, true);
  assert.deepEqual(c.pet, DEFAULTS.pet);
  assert.equal(sanitize({ pet: { type: 'dog', color: '#010203' } }).pet.type, 'dog');
});
