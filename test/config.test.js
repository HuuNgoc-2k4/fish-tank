const test = require('node:test');
const assert = require('node:assert');
const { sanitize, DEFAULTS, MAX_FISH, MAX_PETS } = require('../src/main/config.js');

test('empty or garbage config falls back to defaults', () => {
  assert.deepEqual(sanitize(undefined), DEFAULTS);
  assert.deepEqual(sanitize('x'), DEFAULTS);
});

test('invalid fish are dropped, valid ones kept, duplicates removed, names trimmed', () => {
  const c = sanitize({
    fish: [
      { id: 'a', species: 'tetra', color: '#112233', name: '  Bống  ' },
      { id: 'a', species: 'eel', color: '#112233' },
      { id: 'b', species: 'shark', color: '#112233' },
      { id: 'c', species: 'jelly', color: 'red' },
      { id: 'd', species: 'crab', color: '#AbCdEf', extra: 1, name: 'x'.repeat(50) },
      null,
    ],
  });
  assert.deepEqual(c.fish, [
    { id: 'a', species: 'tetra', color: '#112233', name: 'Bống' },
    { id: 'd', species: 'crab', color: '#AbCdEf', name: 'x'.repeat(20) },
  ]);
});

test('an explicit empty fish list stays empty; too many fish / pets are capped', () => {
  assert.deepEqual(sanitize({ fish: [] }).fish, []);
  const many = Array.from({ length: 50 }, (_, i) => ({ id: 'f' + i, species: 'tetra', color: '#000000' }));
  assert.equal(sanitize({ fish: many }).fish.length, MAX_FISH);
  const pets = Array.from({ length: 9 }, (_, i) => ({ id: 'p' + i, type: 'dog', color: '#000000' }));
  assert.equal(sanitize({ animals: pets }).animals.length, MAX_PETS);
});

test('old single-pet config is migrated to the pet list', () => {
  const c = sanitize({ aquarium: false, pets: true, pet: { type: 'dog', color: '#010203' } });
  assert.equal(c.aquarium, false);
  assert.deepEqual(c.animals, [{ id: 'p1', type: 'dog', color: '#010203', name: 'Miu' }]);
});

test('unknown pet types fall back to a cat with its default colour', () => {
  const list = [{ id: 'a', type: 'dragon', color: '#zzzzzz' }, { id: 'b', type: 'fancy', color: '#123456' }];
  const c = sanitize({ animals: list });
  assert.deepEqual(c.animals.map(a => a.type), ['cat', 'fancy']);
  assert.equal(c.animals[0].color, '#ffb74d');
  assert.equal(c.animals[1].color, '#123456');
});

test('decor flags and pet size are validated', () => {
  const c = sanitize({ decor: { castle: false, rocks: 'no' }, petScale: 9 });
  assert.equal(c.decor.castle, false);
  assert.equal(c.decor.rocks, true);
  assert.equal(c.petScale, 1.6);
  assert.equal(sanitize({ petScale: 'big' }).petScale, 1);
});
