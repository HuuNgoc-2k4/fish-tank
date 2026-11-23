// Pet (cat/dog) that walks along the taskbar: state machine + neon drawing.
(function (exports, Neon, Mood) {
  const { glow, neonText } = Neon;
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const PETS = { cat: 'Mèo', dog: 'Chó' };
  const SOUNDS = { cat: ['Meo!', 'Meo meo~', 'Rrrr...'], dog: ['Gâu!', 'Gâu gâu!', 'Hộc hộc~'] };
  const EDGE = 40; // keep the pet this far from the screen edges

  function makePet(w, cfg) {
    return {
      type: cfg.type, color: cfg.color, w, x: w / 2, y: 0, vx: 0, dir: 1,
      state: 'walk', timer: 4, t: 0, lying: false, target: 0, corner: 0,
      mood: Mood.newMood(), say: null,
    };
  }

  // States: walk | sit | run (shooed) | happy (jumping) | sulk (go to a corner, lie down).
  function stepPet(p, dt) {
    p.t += dt;
    Mood.decay(p.mood, dt);
    if (p.say && (p.say.t -= dt) <= 0) p.say = null;
    if (p.state === 'sulk' && p.mood.sulk <= 0) { p.state = 'sit'; p.timer = 2; p.lying = false; }
    p.vx = 0; p.y = 0;

    if (p.state === 'walk') {
      p.vx = p.dir * 55;
      if ((p.timer -= dt) <= 0) { p.state = 'sit'; p.timer = rnd(2, 5); }
    } else if (p.state === 'sit') {
      if ((p.timer -= dt) <= 0) { p.state = 'walk'; p.dir = Math.random() < 0.5 ? -1 : 1; p.timer = rnd(3, 7); }
    } else if (p.state === 'run') {
      const dx = p.target - p.x;
      if (Math.abs(dx) < 6) { p.state = 'sit'; p.timer = rnd(2, 4); }
      else { p.dir = dx > 0 ? 1 : -1; p.vx = p.dir * 320; }
    } else if (p.state === 'happy') {
      p.timer -= dt;
      p.y = -Math.abs(Math.sin(p.timer * 8)) * 24;
      if (p.timer <= 0) { p.state = 'sit'; p.timer = 1.5; p.y = 0; }
    } else if (p.state === 'sulk') {
      const dx = p.corner - p.x;
      p.lying = Math.abs(dx) <= 4;
      if (!p.lying) { p.dir = dx > 0 ? 1 : -1; p.vx = p.dir * 110; }
    }

    p.x += p.vx * dt;
    if (p.x < EDGE || p.x > p.w - EDGE) {
      p.x = Math.min(p.w - EDGE, Math.max(EDGE, p.x));
      if (p.state === 'walk') p.dir = -p.dir;
    }
  }

  // shoo=false: tease (happy hop / sound). shoo=true: chase away to another spot. Returns the action taken.
  function pokePet(p, shoo) {
    const a = Mood.poke(p.mood, shoo ? ['flee'] : ['happy', 'speak']);
    if (a === 'sulk') {
      p.state = 'sulk'; p.lying = false; p.corner = p.x < p.w / 2 ? EDGE : p.w - EDGE;
      p.say = { text: 'hmph!', t: 1.5 };
    } else if (a === 'grumpy') {
      p.say = { text: '💢', t: 1 };
    } else if (a === 'flee') {
      p.state = 'run';
      p.target = p.x < p.w / 2 ? rnd(p.w * 0.6, p.w - EDGE) : rnd(EDGE, p.w * 0.4);
      p.say = { text: '!', t: 0.8 };
    } else if (a === 'happy') {
      p.state = 'happy'; p.timer = 0.9; p.say = { text: '♥', t: 1.2 };
    } else {
      const list = SOUNDS[p.type] || SOUNDS.cat;
      p.state = 'sit'; p.timer = 2; p.say = { text: list[Math.floor(Math.random() * list.length)], t: 1.5 };
    }
    return a;
  }

  // (x, y) in canvas pixels; baseY = canvas y of the feet.
  function petHit(p, x, y, baseY) {
    return Math.abs(x - p.x) < 32 && y > baseY + p.y - 50 && y < baseY + 4;
  }

  function drawPet(ctx, p, t, baseY) {
    const S = 1.1, cat = p.type === 'cat';
    const lie = p.state === 'sulk' && p.lying, sit = p.state === 'sit';
    const moving = Math.abs(p.vx) > 1, happy = p.state === 'happy';
    const by = lie ? -7 : sit ? -13 : -17, ry = lie ? 6 : 8, rx = cat ? 16 : 17;
    const hx = 18, hy = lie ? by - 3 : by - 9, hr = lie ? 7 : 8;
    const line = fn => { ctx.beginPath(); fn(ctx); ctx.stroke(); };

    ctx.save();
    ctx.translate(p.x, baseY + p.y);
    ctx.scale(p.dir * S, S);
    glow(ctx, p.color, 2.6);
    ctx.fillStyle = p.color;
    if (lie) ctx.globalAlpha = 0.7;

    line(c => c.ellipse(0, by, rx, ry, 0, 0, TAU));                       // body
    line(c => c.arc(hx, hy, hr, 0, TAU));                                 // head
    if (cat) {
      line(c => { c.moveTo(hx - 5, hy - 6); c.lineTo(hx - 4, hy - 14); c.lineTo(hx + 1, hy - 7.5); });
      line(c => { c.moveTo(hx + 3, hy - 7.5); c.lineTo(hx + 7, hy - 14); c.lineTo(hx + 8, hy - 5); });
      line(c => { c.moveTo(hx + 7, hy + 2); c.lineTo(hx + 13, hy + 1); });
      line(c => { c.moveTo(hx + 7, hy + 3.5); c.lineTo(hx + 13, hy + 5); });
    } else {
      line(c => c.ellipse(hx - 4, hy + 1, 3, 6, 0.3, 0, TAU));            // floppy ear
      line(c => c.ellipse(hx + 9, hy + 2.5, 5, 3.3, 0, 0, TAU));          // snout
      ctx.beginPath(); ctx.arc(hx + 13.5, hy + 1.5, 1.4, 0, TAU); ctx.fill();
    }
    if (lie) line(c => { c.moveTo(hx + 2, hy - 1.5); c.lineTo(hx + 6, hy - 1.5); });   // closed eye
    else { ctx.beginPath(); ctx.arc(hx + 4, hy - 1.5, 1.2, 0, TAU); ctx.fill(); }

    const sway = Math.sin(t * (happy ? 12 : 3)) * 4;                      // tail
    if (cat) {
      line(c => { c.moveTo(-rx + 1, by - 2); c.quadraticCurveTo(-rx - 10 + sway, by - 4, -rx - 9 + sway, lie ? by + 2 : by - 18); });
    } else {
      const wag = Math.sin(t * (happy ? 25 : 6)) * 3;
      line(c => { c.moveTo(-rx + 1, by - 3); c.lineTo(-rx - 6 + wag, lie ? by + 1 : by - 12); });
    }

    if (!lie) {                                                           // legs
      [[-11, 0], [-6, Math.PI], [8, Math.PI], [13, 0]].forEach(([x, ph]) => {
        const swing = moving ? Math.sin(t * (p.state === 'run' ? 18 : 10) + ph) * 6 : 0;
        line(c => { c.moveTo(x, by + ry - 1); c.lineTo(x + swing, 0); });
      });
    }
    ctx.restore();

    if (lie) neonText(ctx, 'Zzz', p.x, baseY - 36 - Math.sin(t * 2) * 3, p.color);
    if (p.say) neonText(ctx, p.say.text, p.x, baseY + p.y - 52, p.color);
  }

  Object.assign(exports, { PETS, makePet, stepPet, pokePet, petHit, drawPet });
})(typeof module === 'object' ? module.exports : (window.Pet = {}),
   typeof module === 'object' ? require('./neon') : window.Neon,
   typeof module === 'object' ? require('./mood') : window.Mood);
