const test = require('node:test');
const assert = require('node:assert');
const Fish = require('../src/core/fish.js');

const cfgFish = (id, species = 'tetra') => ({ id, species, color: '#33c7ff' });

test('fish eat food and grow', () => {
  const s = Fish.makeTank(800, 600);
  Fish.syncFish(s, [cfgFish('a')]);
  const f = s.fish[0], size = f.size;
  f.x = 400; f.y = 300;
  s.food.push({ x: 400, y: 300, star: false, ph: 0, rest: 0 });
  Fish.step(s, 0.016);
  assert.equal(s.food.length, 0);
  assert.ok(f.size > size);
});

test('uneaten food rests on the floor then disappears', () => {
  const s = Fish.makeTank(800, 600);
  Fish.drop(s, 400, 590, 5);
  for (let i = 0; i < 20 * 60; i++) Fish.step(s, 1 / 60);
  assert.equal(s.food.length, 0);
});

test('syncFish adds, removes and keeps existing fish in place', () => {
  const s = Fish.makeTank(800, 600);
  Fish.syncFish(s, [cfgFish('a'), cfgFish('b')]);
  const a = s.fish.find(f => f.id === 'a'); a.x = 123;
  Fish.syncFish(s, [{ id: 'a', species: 'jelly', color: '#ff0000' }, cfgFish('c', 'eel')]);
  assert.deepEqual(s.fish.map(f => f.id).sort(), ['a', 'c']);
  assert.equal(s.fish.find(f => f.id === 'a').x, 123);
  assert.equal(a.species, 'jelly');
  assert.equal(a.color, '#ff0000');
});

test('every species can be simulated and drawn without throwing', () => {
  const calls = new Proxy({}, { get: (t, k) => (k === 'canvas' ? {} : () => {}), set: () => true });
  const s = Fish.makeTank(800, 600);
  Fish.syncFish(s, Object.keys(Fish.SPECIES).map(k => cfgFish(k, k)));
  for (let i = 0; i < 120; i++) { Fish.step(s, 1 / 60); Fish.draw(calls, s); }
});

test('teasing a fish: it reacts, and four quick pokes make it sulk in a bottom corner', () => {
  const s = Fish.makeTank(800, 600);
  Fish.syncFish(s, [cfgFish('a')]);
  const f = s.fish[0]; f.x = 700; f.y = 300;
  assert.equal(Fish.fishAt(s, 700, 300), f);
  assert.equal(Fish.fishAt(s, 10, 10), null);
  const acts = [1, 2, 3, 4].map(() => Fish.pokeFish(s, f));
  assert.equal(acts[3], 'sulk');
  assert.equal(f.corner.x, 760);
  for (let i = 0; i < 600; i++) Fish.step(s, 1 / 60);
  assert.ok(Math.hypot(f.x - 760, f.y - 576) < 15);
});
