const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { listPacks, importImages } = require('../src/main/petpacks.js');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pets-'));
const slime = path.join(__dirname, '..', 'assets', 'pets', 'slime');

test('the bundled sample pack loads with file URLs for each animation', () => {
  const [p] = listPacks([path.join(__dirname, '..', 'assets', 'pets')]);
  assert.equal(p.id, 'img-slime');
  assert.deepEqual(Object.keys(p.sprite.anims).sort(), ['happy', 'held', 'idle', 'sleep', 'walk']);
  assert.equal(p.sprite.anims.walk.frames.length, 2);
  assert.ok(p.sprite.anims.idle.frames[0].startsWith('file://'));
});

test('importing images sorts frames into animations by file name', () => {
  const dir = tmp();
  const files = ['walk2.svg', 'walk1.svg', 'idle.svg', 'sleep.svg'].map(f => path.join(slime, f));
  const folder = importImages(files, dir);
  const [p] = listPacks([dir]);
  assert.equal(p.id, 'img-' + folder);
  assert.equal(p.sprite.anims.walk.frames.length, 2);
  assert.ok(p.sprite.anims.walk.frames[0].includes('walk1'));
  assert.ok(p.sprite.anims.sleep);
  assert.equal(importImages([path.join(slime, 'idle.svg')], dir), folder + '-2');   // no name clash
});

test('bad packs are skipped; paths outside the folder are ignored', () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, 'broken')); fs.writeFileSync(path.join(dir, 'broken', 'pet.json'), '{nope');
  fs.mkdirSync(path.join(dir, 'escape'));
  fs.writeFileSync(path.join(dir, 'escape', 'pet.json'), JSON.stringify({ animations: { idle: { frames: ['../../secret.png', '/etc/x.png'] } } }));
  assert.deepEqual(listPacks([dir, path.join(dir, 'missing')]), []);
  assert.throws(() => importImages(['notes.txt'], dir));
});
