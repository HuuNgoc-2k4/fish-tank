const test = require('node:test');
const assert = require('node:assert');
const { makeTank, addFish, drop, step } = require('./tank.js');

test('fish eat food and grow', () => {
  const s = makeTank(800, 600);
  addFish(s);
  const f = s.fish[0], size = f.size;
  f.x = 400; f.y = 300;
  s.food.push({ x: 400, y: 300, star: false, ph: 0, rest: 0 });
  step(s, 0.016);
  assert.equal(s.food.length, 0);
  assert.ok(f.size > size);
});

test('uneaten food rests on the floor then disappears', () => {
  const s = makeTank(800, 600);
  drop(s, 400, 590, 5);
  for (let i = 0; i < 20 * 60; i++) step(s, 1 / 60);
  assert.equal(s.food.length, 0);
});
