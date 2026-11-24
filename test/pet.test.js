const test = require('node:test');
const assert = require('node:assert');
const Pet = require('../src/core/pet.js');
const PetDraw = require('../src/core/pet-draw.js');
const Mood = require('../src/core/mood.js');

const W = 1000, G = 700;
function mk(type = 'cat') {
  const w = Pet.makeWorld(W, G);
  Pet.syncPets(w, [{ id: 'a', type, color: '#ffb74d', name: 'Miu' }], 1);
  return [w, w.pets[0]];
}
const run = (w, secs, dt = 1 / 60) => { for (let i = 0; i < secs / dt; i++) Pet.stepWorld(w, dt); };

test('four quick teases make the pet sulk in the nearest corner; rubbing soothes it', () => {
  const [w, p] = mk(); p.x = 900;
  for (let i = 0; i < 3; i++) assert.notEqual(Pet.click(w, p), 'sulk');
  assert.equal(Pet.click(w, p), 'sulk');
  assert.equal(p.state, 'sulk');
  assert.equal(p.corner, W - Pet.EDGE);
  run(w, 3);
  assert.equal(p.lying, true);
  assert.equal(Pet.click(w, p), 'grumpy');
  for (let i = 0; i < 60; i++) Pet.rub(w, p, i % 2 ? 40 : -40);
  run(w, 0.1);
  assert.notEqual(p.state, 'sulk');
});

test('a sulk wears off by itself', () => {
  const [w, p] = mk(); p.x = 100;
  for (let i = 0; i < 4; i++) Pet.click(w, p);
  run(w, Mood.SULK_SECS + 1);
  assert.notEqual(p.state, 'sulk');
});

test('picked up by the scruff, it dangles and swings; dropped high, it falls and lands dizzy', () => {
  const [w, p] = mk(); p.x = 500;
  Pet.grab(w, p, 500, 100);
  assert.equal(p.state, 'held');
  assert.ok(p.y < -400);
  for (let i = 0; i < 10; i++) { Pet.drag(w, p, 500 + i * 30, 100, 1 / 60); Pet.stepWorld(w, 1 / 60); }
  assert.ok(p.ang < 0, 'swings back against the drag');
  Pet.release(w, p);
  assert.equal(p.state, 'fall');
  run(w, 3);
  assert.equal(p.y, 0);
  assert.notEqual(p.state, 'fall');
});

test('a gentle drop near the ground just lands', () => {
  const [w, p] = mk();
  Pet.grab(w, p, 500, G - 60);
  Pet.release(w, p);
  run(w, 0.2);
  assert.ok(['land', 'sit', 'walk', 'groom', 'stretch', 'spin', 'sleep'].includes(p.state), p.state);
});

test('thrown pets always come to rest on the ground inside the edges', () => {
  for (let n = 0; n < 50; n++) {
    const [w, p] = mk();
    Pet.grab(w, p, Math.random() * W, Math.random() * G);
    p.hvx = (Math.random() - 0.5) * 6000; p.hvy = (Math.random() - 0.5) * 6000;
    Pet.release(w, p);
    for (let i = 0; i < 60 * 8; i++) {
      Pet.stepWorld(w, 1 / 60);
      assert.ok(p.x >= Pet.EDGE && p.x <= W - Pet.EDGE);
      assert.ok(p.y <= 0 && p.y >= -G);
    }
    assert.ok(p.y > -30, 'on the ground (small hops allowed)');
    assert.ok(!['fall', 'held'].includes(p.state));
  }
});

test('feeding: a bowl appears, the pet walks over, eats, and is full', () => {
  const [w, p] = mk(); p.needs.food = 0.1;
  Pet.command(w, p, 'feed');
  assert.equal(w.bowls.length, 1);
  run(w, 8);
  assert.equal(w.bowls.length, 0);
  assert.ok(p.needs.food > 0.9);
});

test('ball: pets chase and kick it, and it eventually goes away', () => {
  const [w, p] = mk(); p.needs.fun = 0.2;
  Pet.command(w, p, 'ball');
  assert.equal(p.state, 'play');
  run(w, 10);
  assert.ok(p.needs.fun > 0.2);
  run(w, 35);
  assert.equal(w.ball, null);
});

test('the user can throw the ball', () => {
  const [w, p] = mk();
  Pet.command(w, p, 'ball');
  Pet.grabBall(w);
  Pet.dragBall(w, 300, 200, 0); Pet.dragBall(w, 400, 150, 1 / 60);
  Pet.releaseBall(w);
  assert.ok(w.ball.vx > 0);
  run(w, 2);
  assert.ok(w.ball.y <= -w.ball.r + 0.01);
});

test('laser: pets chase the dot', () => {
  const [w, p] = mk(); p.x = 100;
  Pet.command(w, p, 'laser');
  w.laser.x = 800;
  run(w, 3);
  assert.ok(Math.abs(p.x - 800) < 30);
  run(w, 12);
  assert.equal(w.laser, null);
});

test('shoo sends the pet to the far side; sleep and wake from the menu', () => {
  const [w, p] = mk(); p.x = 100;
  Pet.command(w, p, 'shoo');
  assert.equal(p.state, 'run');
  run(w, 4);
  assert.ok(p.x > 500);
  Pet.command(w, p, 'sleep');
  assert.equal(p.state, 'sleep');
  Pet.command(w, p, 'sleep');
  assert.notEqual(p.state, 'sleep');
});

test('rubbing makes a pet purr and raises fun', () => {
  const [w, p] = mk(); p.state = 'sit'; p.timer = 5; p.needs.fun = 0.3;
  for (let i = 0; i < 20; i++) Pet.rub(w, p, i % 2 ? 30 : -30);
  assert.equal(p.state, 'purr');
  assert.ok(p.needs.fun > 0.3);
});

test('tired pets fall asleep and wake up rested', () => {
  const [w, p] = mk(); p.needs.energy = 0.05; p.state = 'sit'; p.timer = 0;
  run(w, 0.1);
  assert.equal(p.state, 'sleep');
  run(w, 60);
  assert.ok(p.needs.energy > 0.9);
});

test('pets that meet may greet each other; syncPets keeps existing pets', () => {
  const w = Pet.makeWorld(W, G);
  Pet.syncPets(w, [{ id: 'a', type: 'cat', color: '#ffffff' }, { id: 'b', type: 'dog', color: '#ffffff' }], 1);
  const [a, b] = w.pets; a.x = 500; b.x = 520;
  a.state = b.state = 'walk'; a.timer = b.timer = 9; a.greetT = b.greetT = 0;
  Pet.stepWorld(w, 0.01);
  assert.equal(a.greetT, 25);
  a.x = 123;
  Pet.syncPets(w, [{ id: 'a', type: 'fox', color: '#000000', name: 'Cáo' }], 1.4);
  assert.equal(w.pets.length, 1);
  assert.equal(w.pets[0].x, 123);
  assert.equal(w.pets[0].type, 'fox');
  assert.equal(w.scale, 1.4);
});

test('hit test follows the pet, also while held', () => {
  const [w, p] = mk(); p.x = 300;
  assert.equal(Pet.petAt(w, 300, G - 20), p);
  assert.equal(Pet.petAt(w, 600, G - 20), null);
  Pet.grab(w, p, 300, 200);
  assert.equal(Pet.petAt(w, 300, 215), p);
});

test('every type and state draws without throwing', () => {
  const ctx = new Proxy({}, { get: () => () => ({ width: 40 }), set: () => true });
  Pet.addType('blob', { label: 'Blob', height: 40, sprite: { anims: { idle: { frames: ['a.png'], fps: 4 } } } });
  const states = ['walk', 'run', 'sit', 'happy', 'spin', 'stretch', 'groom', 'purr', 'greet', 'dizzy', 'land', 'roll',
    'sleep', 'held', 'fall', 'goEat', 'eat', 'play', 'chase', 'sulk'];
  for (const type of ['cat', 'dog', 'fox', 'fancy', 'blob']) {
    const [w, p] = mk(type);
    w.ball = { x: 10, y: -9, vx: 0, vy: 0, r: 9, spin: 0, life: 5 }; w.laser = { x: 5, t: 1 };
    w.bowls.push({ x: 50, food: 0.5 }); w.fx.push({ x: 1, y: 1, t: 1, text: '♥' });
    for (const s of states) for (const lying of [false, true]) {
      p.state = s; p.lying = lying; p.timer = 0.5; p.say = lying ? null : { text: 'Meo!', t: 1 }; w.hover = p;
      PetDraw.drawWorld(ctx, w, 1.23);
    }
  }
});

test('image pets fall back to the closest animation they have', () => {
  const sprite = { anims: { idle: { frames: ['i.png'] }, walk: { frames: ['w1.png', 'w2.png'] } } };
  assert.equal(PetDraw.spriteAnim(sprite, { state: 'run' }).name, 'walk');
  assert.equal(PetDraw.spriteAnim(sprite, { state: 'sleep' }).name, 'idle');
  assert.equal(PetDraw.spriteAnim(sprite, { state: 'walk' }).name, 'walk');
});

test('shade mixes toward white or black', () => {
  assert.equal(PetDraw.shade('#ffffff', -0.5), 'rgb(128,128,128)');
  assert.equal(PetDraw.shade('#000000', 0.5), 'rgb(128,128,128)');
});
