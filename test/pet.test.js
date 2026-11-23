const test = require('node:test');
const assert = require('node:assert');
const Pet = require('../src/core/pet.js');
const Mood = require('../src/core/mood.js');

const mk = () => Pet.makePet(1000, { type: 'cat', color: '#ffb74d' });

test('four quick teases make the pet sulk, in the nearest corner', () => {
  const p = mk(); p.x = 900;
  for (let i = 0; i < 3; i++) assert.notEqual(Pet.pokePet(p, false), 'sulk');
  assert.equal(Pet.pokePet(p, false), 'sulk');
  assert.equal(p.state, 'sulk');
  assert.equal(p.corner, 960);
});

test('annoyance decays over time', () => {
  const m = Mood.newMood();
  Mood.poke(m, ['x']); Mood.poke(m, ['x']); Mood.poke(m, ['x']);
  for (let i = 0; i < 60; i++) Mood.decay(m, 1);
  assert.equal(m.annoy, 0);
  assert.notEqual(Mood.poke(m, ['x']), 'sulk');
});

test('a sulking pet walks to the corner, lies down, ignores pokes, then recovers', () => {
  const p = mk(); p.x = 100;
  for (let i = 0; i < 4; i++) Pet.pokePet(p, false);
  for (let i = 0; i < 300; i++) Pet.stepPet(p, 0.016);      // ~5s: reach corner
  assert.equal(p.lying, true);
  assert.ok(Math.abs(p.x - 40) < 5);
  assert.equal(Pet.pokePet(p, true), 'grumpy');
  assert.equal(p.state, 'sulk');
  for (let i = 0; i < 26 * 60; i++) Pet.stepPet(p, 1 / 60); // sulk timer is 25s
  assert.notEqual(p.state, 'sulk');
  assert.equal(p.lying, false);
});

test('shoo sends the pet to the far side', () => {
  const p = mk(); p.x = 100;
  assert.equal(Pet.pokePet(p, true), 'flee');
  assert.equal(p.state, 'run');
  assert.ok(p.target > 500);
  for (let i = 0; i < 300; i++) Pet.stepPet(p, 0.016);
  assert.ok(p.x > 500);
});

test('pet stays inside the strip', () => {
  const p = mk();
  for (let i = 0; i < 20 * 60 * 5; i++) {
    if (i % 400 === 0) Pet.pokePet(p, true);
    Pet.stepPet(p, 1 / 60);
    assert.ok(p.x >= 40 && p.x <= 960);
  }
});

test('every pet and state draws without throwing, and speech bubbles are measured', () => {
  const ctx = new Proxy({}, { get: () => () => ({ width: 40 }), set: () => true });
  for (const type of ['cat', 'dog']) {
    const p = Pet.makePet(1000, { type, color: '#ffb74d' });
    for (const [state, lying] of [['walk', false], ['sit', false], ['run', false], ['happy', false], ['sulk', false], ['sulk', true]]) {
      p.state = state; p.lying = lying; p.say = { text: 'Meo!', t: 1 };
      Pet.stepPet(p, 0.016);
      Pet.drawPet(ctx, p, 1.23, 116);
    }
  }
});

test('shade mixes toward white or black', () => {
  assert.equal(Pet.shade('#ffffff', -0.5), 'rgb(128,128,128)');
  assert.equal(Pet.shade('#000000', 0.5), 'rgb(128,128,128)');
});

test('stride advances only while moving', () => {
  const p = mk(); p.state = 'sit'; p.timer = 99;
  Pet.stepPet(p, 0.5);
  assert.equal(p.walkPh, 0);
  p.state = 'walk'; p.timer = 99;
  Pet.stepPet(p, 0.5);
  assert.ok(p.walkPh > 0);
});
