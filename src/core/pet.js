// Desktop pets: simulation only (needs, moods, physics, toys). Drawing lives in pet-draw.js.
// Coordinates: x = screen x of the pet's centre; y = feet offset from the ground (0 = standing, negative = in the air).
(function (exports, Mood) {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // h = hit-box height in drawing units (multiplied by the world scale)
  const TYPES = {
    cat: { label: 'Mèo', color: '#ffb74d', h: 50, sounds: ['Meo!', 'Meo meo~', 'Rrrr...'], purr: 'Prrr~' },
    dog: { label: 'Chó', color: '#c8a27a', h: 50, sounds: ['Gâu!', 'Gâu gâu!', 'Hộc hộc~'], purr: 'Hừ hừ~' },
    fox: { label: 'Cáo', color: '#ff8a3d', h: 52, sounds: ['Yip!', 'Kyuu~', 'Hửm?'], purr: 'Kyuu~' },
    fancy: { label: 'Mèo điệu', color: '#ff4f8b', h: 64, sounds: ['Meo~ ♡', 'Hứ!', 'Xinh hông?'], purr: 'Prrr~ ♡' },
  };
  const MAX_PETS = 4;

  // Image-based pets (folders with pet.json, see README). def = { label, height, sounds, sprite: { base, anims } }.
  function addType(id, def) {
    TYPES[id] = {
      label: def.label, color: '#ffffff', h: def.height || 50,
      sounds: def.sounds && def.sounds.length ? def.sounds : ['♪'], purr: '♥', sprite: def.sprite,
    };
  }
  const EDGE = 40, GRAVITY = 2200, BASE = 1.25, HANG = 46;
  const type = p => TYPES[p.type] || TYPES.cat;

  // ---- world ----
  function makeWorld(w, ground) {
    return { w, ground, scale: 1, t: 0, pets: [], ball: null, bowls: [], laser: null, fx: [] };
  }
  const size = world => BASE * world.scale;
  const hang = (world, p) => HANG * size(world) * (p.type === 'fancy' ? 1.2 : 1); // cursor (scruff) to feet

  function makePet(world, c) {
    return {
      id: c.id, type: c.type, color: c.color, name: c.name || '',
      x: rnd(EDGE + 60, Math.max(EDGE + 61, world.w - EDGE - 60)), y: 0, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1,
      state: 'walk', timer: rnd(2, 5), t: rnd(0, 10), walkPh: 0, ang: 0, av: 0, hvx: 0, hvy: 0, hold: 0,
      lying: false, target: 0, corner: 0, bowl: null,
      mood: Mood.newMood(), say: null, rub: 0,
      needs: { food: rnd(0.6, 0.9), energy: rnd(0.6, 0.9), fun: rnd(0.5, 0.8) },
      nagT: rnd(15, 30), greetT: 10,
    };
  }

  // Match the config list [{id, type, color, name}]: new ids appear, missing ids leave, the rest keep their place.
  function syncPets(world, list, scale) {
    if (scale) world.scale = scale;
    const ids = new Set(list.map(c => c.id));
    world.pets = world.pets.filter(p => ids.has(p.id));
    for (const c of list) {
      const p = world.pets.find(x => x.id === c.id);
      if (p) Object.assign(p, { type: c.type, color: c.color, name: c.name || '' });
      else world.pets.push(makePet(world, c));
    }
  }

  const say = (p, text, t = 1.5) => { p.say = { text, t }; };
  const heart = (world, p, text = '♥') => {
    if (world.fx.length < 30) world.fx.push({ x: p.x + rnd(-14, 14), y: world.ground + p.y - type(p).h * size(world) * 0.8, t: 1.3, text });
  };
  function setState(p, s, timer = 0) {
    p.state = s; p.timer = timer;
    p.lying = s === 'sleep' || s === 'roll';
  }
  const busy = p => ['held', 'fall', 'dizzy', 'sulk', 'sleep', 'eat', 'goEat'].includes(p.state);

  function goSulk(world, p) {
    setState(p, 'sulk'); p.corner = p.x < world.w / 2 ? EDGE : world.w - EDGE;
    say(p, 'hmph!');
  }

  // Next spontaneous behaviour once the current one ends.
  function idle(world, p) {
    if (p.mood.sulk > 0) return goSulk(world, p);
    if (p.needs.energy < 0.2) { setState(p, 'sleep', rnd(30, 50)); return; }
    const r = Math.random();
    if (r < 0.5) { setState(p, 'walk', rnd(3, 7)); p.dir = Math.random() < 0.5 ? -1 : 1; }
    else if (r < 0.62) setState(p, 'groom', rnd(2, 4));
    else if (r < 0.72) setState(p, 'stretch', 1.4);
    else if (r < 0.78 && p.needs.fun > 0.5) setState(p, 'spin', 1.6);
    else setState(p, 'sit', rnd(2, 5));
  }

  function land(world, p) {
    const hard = p.vy > 1300;
    p.y = 0; p.vx = p.vy = 0; p.ang = 0; p.av = 0;
    if (hard) {
      Mood.poke(p.mood, ['dizzy']);          // being thrown counts as teasing (may lead to a sulk)
      setState(p, 'dizzy', 2.5); say(p, pick(['@_@', 'Choáng quá...']));
    } else setState(p, 'land', 0.3);
  }

  function stepPet(world, p, dt) {
    const k = size(world), n = p.needs;
    p.t += dt;
    Mood.decay(p.mood, dt);
    if (p.say && (p.say.t -= dt) <= 0) p.say = null;
    n.food = clamp(n.food - dt / 600, 0, 1);
    n.fun = clamp(n.fun - dt / 420, 0, 1);
    n.energy = clamp(n.energy + (p.state === 'sleep' ? dt / 25 : -dt / 900), 0, 1);
    p.rub = Math.max(0, p.rub - 260 * dt);
    p.greetT -= dt;

    if (p.state === 'held') {
      // Dangle from the cursor: the body swings against the drag direction like a pendulum.
      p.hold += dt;
      const target = clamp(-p.hvx * 0.0012, -1.1, 1.1);
      p.av += ((target - p.ang) * 60 - p.av * 5) * dt;
      p.ang += p.av * dt;
      p.hvx *= Math.max(0, 1 - 8 * dt); p.hvy *= Math.max(0, 1 - 8 * dt);
      p.walkPh += 16 * dt;                    // legs paddle in the air
      if (p.hold > 5 && !p.say) say(p, pick(['Thả ra!!', 'Cho xuống đi~', 'Hứ...']));
      return;
    }
    if (p.state === 'fall') {
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.ang += clamp(p.vx, -900, 900) * 0.006 * dt;
      p.walkPh += 16 * dt;
      if (p.x < EDGE) { p.x = EDGE; p.vx = Math.abs(p.vx) * 0.5; }
      if (p.x > world.w - EDGE) { p.x = world.w - EDGE; p.vx = -Math.abs(p.vx) * 0.5; }
      const top = -world.ground + type(p).h * k;
      if (p.y < top) { p.y = top; p.vy = Math.abs(p.vy) * 0.3; }
      if (p.y >= 0) land(world, p);
      return;
    }

    p.vx = 0; p.y = 0; p.ang = 0;
    const tick = () => (p.timer -= dt) <= 0;
    switch (p.state) {
      case 'walk':
        p.vx = p.dir * 60;
        if (tick()) idle(world, p);
        break;
      case 'run': {                                  // shooed away
        const dx = p.target - p.x;
        if (Math.abs(dx) < 6) setState(p, 'sit', rnd(2, 4));
        else { p.dir = dx > 0 ? 1 : -1; p.vx = p.dir * 320; }
        break;
      }
      case 'happy':
        p.timer -= dt;
        p.y = -Math.abs(Math.sin(p.timer * 8)) * 24;
        if (p.timer <= 0) { p.y = 0; setState(p, 'sit', 1.5); }
        break;
      case 'spin':                                   // chase own tail
        p.dir = Math.floor(p.t * 7) % 2 ? 1 : -1;
        p.y = -Math.abs(Math.sin(p.t * 14)) * 6;
        if (tick()) { p.y = 0; setState(p, 'sit', 1.5); }
        break;
      case 'dizzy':
        if (tick()) p.mood.sulk > 0 ? goSulk(world, p) : setState(p, 'sit', 1.5);
        break;
      case 'sulk': {
        if (p.mood.sulk <= 0) { setState(p, 'sit', 2); say(p, '...hết giận rồi'); break; }
        const dx = p.corner - p.x;
        p.lying = Math.abs(dx) <= 4;
        if (!p.lying) { p.dir = dx > 0 ? 1 : -1; p.vx = p.dir * 110; }
        break;
      }
      case 'sleep':
        if (tick() || n.energy >= 1) { setState(p, 'stretch', 1.4); say(p, 'Oáp~'); }
        break;
      case 'goEat': {
        if (!p.bowl || !world.bowls.includes(p.bowl)) { idle(world, p); break; }
        const dx = p.bowl.x - p.x;
        if (Math.abs(dx) < 14) { p.dir = dx >= 0 ? 1 : -1; setState(p, 'eat', 4); }
        else { p.dir = dx > 0 ? 1 : -1; p.vx = p.dir * 150; }
        break;
      }
      case 'eat':
        n.food = clamp(n.food + dt / 4, 0, 1);
        if (p.bowl) p.bowl.food = Math.max(0, p.timer / 4);
        if (tick()) {
          world.bowls = world.bowls.filter(b => b !== p.bowl); p.bowl = null;
          say(p, pick(['Ngon quá!', 'No rồi~', '♥'])); setState(p, 'sit', 2);
        }
        break;
      case 'play': {                                 // chase the ball and kick it
        const b = world.ball;
        if (!b) { setState(p, 'sit', 2); say(p, 'Hết bóng rồi?'); break; }
        if (b.held) { p.vx = 0; p.dir = b.x > p.x ? 1 : -1; break; }
        const dx = b.x - p.x;
        p.dir = dx > 0 ? 1 : -1;
        if (Math.abs(dx) < 20 * k && b.y > -30) {
          b.vx = p.dir * rnd(350, 750); b.vy = -rnd(350, 750);
          n.fun = clamp(n.fun + 0.06, 0, 1); if (Math.random() < 0.3) heart(world, p);
        } else if (Math.abs(dx) > 4) p.vx = p.dir * (Math.abs(dx) > 120 ? 280 : 140);
        break;
      }
      case 'chase': {                                // chase the red dot
        const l = world.laser;
        if (!l) { setState(p, 'sit', 2); break; }
        const dx = l.x - p.x;
        if (Math.abs(dx) > 10) { p.dir = dx > 0 ? 1 : -1; p.vx = p.dir * Math.min(360, Math.abs(dx) * 4); }
        else { p.y = -Math.abs(Math.sin(p.t * 9)) * 14; n.fun = clamp(n.fun + dt * 0.05, 0, 1); }
        break;
      }
      default:                                       // sit, groom, stretch, purr, greet, land, roll
        if (tick()) idle(world, p);
    }

    // Stride follows the ground covered so feet don't slide; running uses a fixed fast cadence.
    p.walkPh += (Math.abs(p.vx) > 150 ? 18 : Math.abs(p.vx) * 0.13) * dt;
    p.x += p.vx * dt;
    if (p.x < EDGE || p.x > world.w - EDGE) {
      p.x = clamp(p.x, EDGE, world.w - EDGE);
      if (p.state === 'walk') p.dir = -p.dir;
    }

    // Needs: ask for food / play now and then.
    if ((p.nagT -= dt) <= 0 && (p.state === 'walk' || p.state === 'sit')) {
      p.nagT = rnd(15, 25);
      if (n.food < 0.3) say(p, pick(['Đói quá~', '🍖?']), 2.5);
      else if (n.fun < 0.25) say(p, pick(['Chán quá...', 'Chơi với tớ đi!']), 2.5);
    }
  }

  // Two pets passing each other may stop to say hi.
  function meet(world) {
    const ps = world.pets;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        if (a.state !== 'walk' || b.state !== 'walk' || a.greetT > 0 || b.greetT > 0 || Math.abs(a.x - b.x) > 44) continue;
        a.greetT = b.greetT = 25;
        if (Math.random() < 0.6) {
          for (const [p, o] of [[a, b], [b, a]]) { setState(p, 'greet', 2.5); p.dir = o.x > p.x ? 1 : -1; }
          say(a, pick(type(a).sounds)); heart(world, a); heart(world, b);
        }
      }
    }
  }

  function stepBall(world, dt) {
    const b = world.ball;
    if (!b || b.held) return;
    b.vy += GRAVITY * 0.6 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y > -b.r) {
      b.y = -b.r; b.vy = Math.abs(b.vy) < 80 ? 0 : -b.vy * 0.6;
      b.vx *= Math.max(0, 1 - 1.5 * dt);
    }
    if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.7; }
    if (b.x > world.w - b.r) { b.x = world.w - b.r; b.vx = -Math.abs(b.vx) * 0.7; }
    if (b.y < -world.ground + b.r) { b.y = -world.ground + b.r; b.vy = Math.abs(b.vy) * 0.5; }
    b.spin += b.vx * dt / b.r;
    if ((b.life -= dt) <= 0) world.ball = null;
  }

  function stepWorld(world, dt) {
    world.t += dt;
    for (const p of world.pets) stepPet(world, p, dt);
    meet(world);
    stepBall(world, dt);
    if (world.laser && (world.laser.t -= dt) <= 0) world.laser = null;
    for (const f of world.fx) { f.y -= 40 * dt; f.t -= dt; }
    world.fx = world.fx.filter(f => f.t > 0);
  }

  // ---- interactions ----
  // Left click. Returns the action taken.
  function click(world, p) {
    if (p.state === 'held' || p.state === 'fall') return null;
    const a = Mood.poke(p.mood, ['happy', 'speak', 'roll', 'spin']);
    if (a === 'grumpy') { say(p, '💢', 1); return a; }
    if (a === 'sulk') { goSulk(world, p); return a; }
    if (p.state === 'sleep') { setState(p, 'sit', 2); say(p, '?!'); return 'wake'; }
    if (a === 'happy') { setState(p, 'happy', 0.9); say(p, '♥', 1.2); }
    else if (a === 'roll') { setState(p, 'roll', 1.2); say(p, pick(['Lăn~', 'Hihi'])); }
    else if (a === 'spin') setState(p, 'spin', 1.6);
    else { setState(p, 'sit', 2); say(p, pick(type(p).sounds)); }
    return a;
  }

  // Cursor rubbing back and forth over the pet (no button held): purr, hearts, and it soothes a sulk.
  function rub(world, p, dx) {
    if (['held', 'fall', 'dizzy'].includes(p.state)) return;
    const d = Math.abs(dx);
    p.rub = Math.min(600, p.rub + d);
    if (p.rub < 220) return;
    p.needs.fun = clamp(p.needs.fun + d * 0.0004, 0, 1);
    p.mood.annoy = Math.max(0, p.mood.annoy - d * 0.003);
    if (p.state === 'sulk') {
      p.mood.sulk = Math.max(0.01, p.mood.sulk - d * 0.02);    // the sulk state ends itself next step
      if (!p.say) say(p, '...', 1);
    } else if (p.state !== 'sleep' && p.state !== 'eat') {
      if (p.state !== 'purr') say(p, type(p).purr);
      setState(p, 'purr', 1.2);
    }
    if (Math.random() < d / 300) heart(world, p);
  }

  function grab(world, p, cx, cy) {
    setState(p, 'held');
    p.hold = 0; p.hvx = p.hvy = 0; p.av = 0;
    drag(world, p, cx, cy, 0);
    say(p, pick(['Ơ!', 'Meo?!', 'Á!']), 1);
  }

  function drag(world, p, cx, cy, dt) {
    const nx = clamp(cx, EDGE, world.w - EDGE), ny = Math.min(0, cy + hang(world, p) - world.ground);
    if (dt > 0) {
      p.hvx = p.hvx * 0.5 + (nx - p.x) / dt * 0.5;
      p.hvy = p.hvy * 0.5 + (ny - p.y) / dt * 0.5;
    }
    p.x = nx; p.y = ny;
  }

  function release(world, p) {
    if (p.state !== 'held') return;
    setState(p, 'fall');
    p.vx = clamp(p.hvx, -2500, 2500); p.vy = clamp(p.hvy, -2500, 2500);
  }

  // Right-click menu commands.
  function command(world, p, cmd) {
    const awake = q => !busy(q) || q.state === 'sleep' && q === p;
    if (cmd === 'feed') {
      world.bowls = world.bowls.filter(b => b !== p.bowl);
      p.bowl = { x: clamp(p.x + p.dir * rnd(80, 140), EDGE + 20, world.w - EDGE - 20), food: 1 };
      world.bowls.push(p.bowl);
      setState(p, 'goEat'); say(p, '!', 0.8);
    } else if (cmd === 'ball') {
      world.ball = { x: clamp(p.x + p.dir * 60, 20, world.w - 20), y: -160, vx: p.dir * rnd(100, 300), vy: -200, r: 9, spin: 0, life: 40, held: false };
      for (const q of world.pets) if (awake(q)) setState(q, 'play');
    } else if (cmd === 'laser') {
      world.laser = { x: p.x + p.dir * 80, t: 12 };
      for (const q of world.pets) if (awake(q)) setState(q, 'chase');
    } else if (cmd === 'sleep') {
      if (p.state === 'sleep') { setState(p, 'stretch', 1.4); say(p, 'Oáp~'); } else { setState(p, 'sleep', rnd(30, 50)); }
    } else if (cmd === 'shoo') {
      const a = Mood.poke(p.mood, ['flee']);
      if (a === 'sulk') goSulk(world, p);
      else if (a === 'grumpy') say(p, '💢', 1);
      else {
        setState(p, 'run'); say(p, '!', 0.8);
        p.target = p.x < world.w / 2 ? rnd(world.w * 0.6, world.w - EDGE) : rnd(EDGE, world.w * 0.4);
      }
    }
  }

  // Ball: the user can pick it up and throw it too.
  function grabBall(world) { const b = world.ball; if (b) { b.held = true; b.vx = b.vy = 0; b.life = Math.max(b.life, 20); } }
  function dragBall(world, cx, cy, dt) {
    const b = world.ball; if (!b) return;
    const nx = clamp(cx, b.r, world.w - b.r), ny = Math.min(-b.r, cy - world.ground);
    if (dt > 0) { b.vx = b.vx * 0.5 + (nx - b.x) / dt * 0.5; b.vy = b.vy * 0.5 + (ny - b.y) / dt * 0.5; }
    b.x = nx; b.y = ny;
  }
  function releaseBall(world) {
    const b = world.ball; if (!b) return;
    b.held = false; b.vx = clamp(b.vx, -2000, 2000); b.vy = clamp(b.vy, -2000, 2000);
    for (const q of world.pets) if (!busy(q) && q.state !== 'play') setState(q, 'play');
  }

  // ---- hit tests (canvas pixels) ----
  function petAt(world, x, y) {
    const k = size(world);
    for (let i = world.pets.length - 1; i >= 0; i--) {
      const p = world.pets[i], feet = world.ground + p.y;
      if (Math.abs(x - p.x) < 30 * k && y > feet - type(p).h * k && y < feet + 6) return p;
    }
    return null;
  }
  const ballAt = (world, x, y) => {
    const b = world.ball;
    return !!b && Math.hypot(x - b.x, y - (world.ground + b.y)) < b.r + 10;
  };

  Object.assign(exports, {
    TYPES, MAX_PETS, EDGE, addType, makeWorld, syncPets, stepWorld, stepPet, click, rub, grab, drag, release, command,
    grabBall, dragBall, releaseBall, petAt, ballAt, size, hang,
  });
})(typeof module === 'object' ? module.exports : (window.Pet = {}),
   typeof module === 'object' ? require('./mood') : window.Mood);
