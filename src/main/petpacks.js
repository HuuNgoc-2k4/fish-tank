// Image pets: a folder with pet.json + images. Built-in ones live in assets/pets, the user's in <userData>/pets.
// Format is documented in README ("Thêm thú cưng bằng ảnh").
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const IMG = /\.(png|webp|gif|svg|jpe?g)$/i;
const ANIMS = ['idle', 'walk', 'run', 'sit', 'sleep', 'held', 'fall', 'happy', 'eat', 'play', 'chase', 'dizzy', 'sulk',
  'groom', 'purr', 'greet', 'roll', 'stretch', 'spin', 'land', 'goEat'];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true });

// Read one folder. Returns a type definition for Pet.addType, or null if it has no usable image.
function loadPack(dir, id) {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'pet.json'), 'utf8'));
  const anims = {};
  for (const [state, a] of Object.entries(m.animations || {})) {
    if (!ANIMS.includes(state) || !a) continue;
    const frames = [].concat(a.frames || [])
      .filter(f => typeof f === 'string' && IMG.test(f) && path.basename(f) === f)   // plain file names only
      .filter(f => fs.existsSync(path.join(dir, f)))
      .map(f => pathToFileURL(path.join(dir, f)).href);
    if (frames.length) anims[state] = { frames, fps: clamp(Number(a.fps) || 6, 1, 30) };
  }
  if (!anims.idle) anims.idle = Object.values(anims)[0];
  if (!anims.idle) return null;
  const sounds = (Array.isArray(m.sounds) ? m.sounds : []).filter(s => typeof s === 'string').map(s => s.slice(0, 24)).slice(0, 8);
  return {
    id, label: String(m.name || id).slice(0, 30), height: clamp(Number(m.height) || 50, 20, 160), sounds,
    sprite: { anims, facing: m.facing === 'left' ? 'left' : 'right' },
  };
}

// All packs from the given folders; later folders override earlier ones with the same folder name.
function listPacks(dirs) {
  const out = new Map();
  for (const root of dirs) {
    let names = [];
    try { names = fs.readdirSync(root); } catch { continue; }
    for (const n of names) {
      const dir = path.join(root, n), id = 'img-' + n.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      try {
        const def = fs.existsSync(path.join(dir, 'pet.json')) && loadPack(dir, id);
        if (def) out.set(id, def);
      } catch (err) { console.log('[pets] skipped', dir, err.message); }
    }
  }
  return [...out.values()];
}

// Copy picked images into a new pack folder. File names choose the animation: walk1.png, walk2.png -> "walk";
// names that match no animation become "idle". Returns the folder name.
function importImages(files, userDir) {
  files = files.filter(f => IMG.test(f));
  if (!files.length) throw new Error('Không có file ảnh hợp lệ');
  const stem = f => path.basename(f).replace(IMG, '').toLowerCase();
  const animOf = f => ANIMS.find(a => stem(f).startsWith(a.toLowerCase())) || 'idle';
  const label = path.basename(files[0]).replace(IMG, '').replace(/[-_ ]*\d+$/, '').replace(/^(idle|walk|sit|sleep|held)$/i, '') || 'Thú cưng mới';
  const base = label.normalize('NFD').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'pet';
  fs.mkdirSync(userDir, { recursive: true });
  let folder = base, i = 2;
  while (fs.existsSync(path.join(userDir, folder))) folder = base + '-' + i++;
  const dir = path.join(userDir, folder);
  fs.mkdirSync(dir);
  const animations = {};
  files.sort((a, b) => byName(path.basename(a), path.basename(b))).forEach((f, k) => {
    const out = String(k).padStart(2, '0') + '-' + path.basename(f).replace(/[^\w.-]/g, '_');
    fs.copyFileSync(f, path.join(dir, out));
    (animations[animOf(f)] ||= { frames: [], fps: 6 }).frames.push(out);
  });
  fs.writeFileSync(path.join(dir, 'pet.json'), JSON.stringify({ name: label, height: 50, facing: 'right', sounds: ['♪'], animations }, null, 2));
  return folder;
}

module.exports = { listPacks, loadPack, importImages, ANIMS };
