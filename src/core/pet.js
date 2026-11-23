// Pet (cat/dog) that walks along the taskbar: state machine + filled cartoon drawing.
(function (exports, Mood) {
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const PETS = { cat: 'Mèo', dog: 'Chó' };
  const SOUNDS = { cat: ['Meo!', 'Meo meo~', 'Rrrr...'], dog: ['Gâu!', 'Gâu gâu!', 'Hộc hộc~'] };
  const EDGE = 40;   // keep the pet this far from the screen edges
  const SCALE = 1.25;

  function makePet(w, cfg) {
    return {
      type: cfg.type, color: cfg.color, w, x: w / 2, y: 0, vx: 0, dir: 1,
      state: 'walk', timer: 4, t: 0, walkPh: 0, lying: false, target: 0, corner: 0,
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
      p.vx = p.dir * 60;
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

    // Stride follows the ground covered, so feet don't slide; running uses a fixed fast cadence.
    p.walkPh += (Math.abs(p.vx) > 150 ? 18 : Math.abs(p.vx) * 0.13) * dt;
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
    return Math.abs(x - p.x) < 36 && y > baseY + p.y - 62 && y < baseY + 4;
  }

  // ---- drawing ----
  // Mix a "#rrggbb" colour toward white (amt > 0) or black (amt < 0).
  function shade(c, amt) {
    const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
    return 'rgb(' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * (1 - k) + target * k)).join(',') + ')';
  }

  function speechBubble(ctx, text, x, bottom) {
    ctx.save();
    ctx.font = 'bold 14px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 18, h = 24;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.roundRect(x - w / 2, bottom - h, w, h, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, bottom - 1); ctx.lineTo(x, bottom + 6); ctx.lineTo(x + 5, bottom - 1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, bottom - 1.5); ctx.lineTo(x + 4, bottom - 1.5); ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#2b2b3a'; ctx.fillText(text, x, bottom - h / 2 + 1);
    ctx.restore();
  }

  // Everything below is in "pet space": facing right, feet on y = 0, x = body centre.
  function drawPet(ctx, p, t, baseY) {
    const cat = p.type === 'cat';
    const lie = p.state === 'sulk' && p.lying, sit = p.state === 'sit', run = p.state === 'run';
    const happy = p.state === 'happy', sad = p.state === 'sulk', moving = Math.abs(p.vx) > 1;
    const base = p.color, dark = shade(base, -0.3), light = shade(base, 0.5), line = shade(base, -0.72);
    const eyeC = '#20212b', pink = '#ff9db8';
    const air = Math.min(1, -p.y / 24), ph = p.walkPh;

    ctx.save();                                                          // ground shadow
    ctx.fillStyle = `rgba(0,0,0,${0.28 - air * 0.15})`;
    ctx.beginPath(); ctx.ellipse(p.x, baseY + 1, 22 * (1 - air * 0.3), 4, 0, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, baseY + p.y);
    ctx.scale(p.dir * SCALE * (1 - air * 0.08), SCALE * (1 + air * 0.12)); // squash & stretch while hopping
    if (run) ctx.rotate(0.07);
    ctx.lineWidth = 2; ctx.lineJoin = ctx.lineCap = 'round'; ctx.strokeStyle = line;

    const path = fn => { ctx.beginPath(); fn(ctx); };
    const shape = (c, fn) => { path(fn); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
    const thick = (c, w, fn) => {                                        // outlined thick stroke: tail, legs
      path(fn); ctx.strokeStyle = line; ctx.lineWidth = w + 3; ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
      ctx.strokeStyle = line; ctx.lineWidth = 2;
    };

    const bob = lie ? 0 : moving ? -Math.abs(Math.sin(ph)) * 1.4 : Math.sin(t * 2) * 0.5;
    const B = lie ? { x: 0, y: -8, rx: 18, ry: 7, rot: 0 }
      : sit ? { x: -4, y: -14, rx: 11, ry: 13, rot: -0.3 }
        : { x: 0, y: -20 + bob, rx: cat ? 17 : 19, ry: 10, rot: 0 };
    const H = lie ? { x: 17, y: -10 } : sit ? { x: 8, y: -36 + bob } : { x: cat ? 20 : 22, y: B.y - 9 };

    // tail (behind everything)
    const sw = Math.sin(t * (happy ? 10 : 3)) * 5, wag = Math.sin(t * (happy ? 28 : 7)) * 4;
    if (cat) {
      thick(base, 5, c => {
        if (lie) { c.moveTo(-16, -8); c.quadraticCurveTo(-30, -2, -28, -13); }
        else if (sit) { c.moveTo(-12, -8); c.quadraticCurveTo(-28, -2, -24, -16 + sw * 0.3); }
        else { c.moveTo(-15, B.y - 4); c.quadraticCurveTo(-27 + sw * 0.3, B.y - 2, -24 + sw, B.y - 22); }
      });
    } else {
      thick(base, 5, c => {
        c.moveTo(-17, B.y - 3);
        if (lie || sit) c.quadraticCurveTo(-26, B.y - 2, -27, B.y + 3);
        else c.quadraticCurveTo(-23, B.y - 12, -22 + wag, B.y - 19);
      });
    }

    // legs
    const walkLeg = (hx, off, c) => {
      const amp = happy ? 0 : run ? 11 : moving ? 7 : 0;
      const s = Math.sin(ph + off) * amp;
      const lift = (moving && !happy ? Math.max(0, Math.cos(ph + off)) * (run ? 6 : 4) : 0) + (happy ? 5 + air * 6 : 0);
      const fx = hx + s, fy = -3 - lift;
      thick(c, 6, k => { k.moveTo(hx, B.y + B.ry - 3); k.lineTo(fx, fy); });
      thick(light, 6, k => { k.moveTo(fx, fy - 0.5); k.lineTo(fx, fy); });  // paw
    };
    const stand = !lie && !sit;
    if (stand) { walkLeg(B.rx * 0.35, Math.PI, dark); walkLeg(-B.rx * 0.65, 0, dark); }   // far legs

    // body, with belly / stripes / spot clipped to its outline
    const bodyPath = c => c.ellipse(B.x, B.y, B.rx, B.ry, B.rot, 0, TAU);
    path(bodyPath); ctx.fillStyle = base; ctx.fill();
    ctx.save();
    path(bodyPath); ctx.clip();
    path(c => c.ellipse(B.x + 2, B.y + B.ry * 0.95, B.rx * 0.8, B.ry * 0.6, B.rot, 0, TAU)); ctx.fillStyle = light; ctx.fill();
    if (cat) {
      ctx.strokeStyle = dark; ctx.lineWidth = 3;
      for (const k of [-8, -1, 6]) { path(c => { c.moveTo(B.x + k, B.y - B.ry - 2); c.lineTo(B.x + k + 1, B.y - B.ry + 6); }); ctx.stroke(); }
    } else {
      path(c => c.ellipse(B.x - 5, B.y - 3, 7, 5, 0, 0, TAU)); ctx.fillStyle = dark; ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = line; ctx.lineWidth = 2;
    path(bodyPath); ctx.stroke();

    if (stand) { walkLeg(B.rx * 0.62, 0, base); walkLeg(-B.rx * 0.55, Math.PI, base); }    // near legs
    if (sit) {
      shape(base, c => c.ellipse(-9, -8, 9, 8, 0, 0, TAU));                                // haunch
      shape(light, c => c.ellipse(-3, -2.5, 6.5, 3, 0, 0, TAU));
      thick(dark, 6, c => { c.moveTo(1, -20); c.lineTo(2, -3); });
      thick(base, 6, c => { c.moveTo(6, -20); c.lineTo(7, -3); });
      thick(light, 6, c => { c.moveTo(2, -3.5); c.lineTo(2, -3); });
      thick(light, 6, c => { c.moveTo(7, -3.5); c.lineTo(7, -3); });
    }
    if (lie) {
      shape(base, c => c.ellipse(-8, -5, 9, 5, 0, 0, TAU));
      shape(light, c => c.ellipse(21, -2.5, 5, 3, 0, 0, TAU));
      shape(light, c => c.ellipse(28, -3, 6, 3.2, 0, 0, TAU));
    }

    // ears (cat: pointy, dog: floppy) then head
    const earTilt = run ? -0.45 : lie || sad ? 0.4 : (t % 4) < 0.18 ? 0.2 : 0;
    if (cat) {
      ctx.save(); ctx.translate(H.x, H.y); ctx.rotate(earTilt);
      shape(base, c => { c.moveTo(-8, -4); c.lineTo(-6, -17); c.lineTo(2, -9); c.closePath(); });
      shape(base, c => { c.moveTo(3, -9); c.lineTo(10, -17); c.lineTo(11, -3); c.closePath(); });
      ctx.fillStyle = pink;
      path(c => { c.moveTo(-6.5, -7); c.lineTo(-5.5, -14); c.lineTo(-0.5, -9.5); c.closePath(); }); ctx.fill();
      path(c => { c.moveTo(4.5, -9.5); c.lineTo(8.5, -14.5); c.lineTo(9, -6); c.closePath(); }); ctx.fill();
      ctx.restore();
    } else {
      shape(dark, c => c.ellipse(H.x + 6, H.y - 8, 3.5, 6, 0.5, 0, TAU));                  // far ear
    }
    shape(base, c => c.arc(H.x, H.y, 10, 0, TAU));
    if (!cat) shape(dark, c => c.ellipse(H.x - 4, H.y + 2, 4.5, 8.5, run ? 0.9 : 0.25 + Math.sin(t * 3) * 0.05, 0, TAU));

    // face
    ctx.fillStyle = light;
    path(c => c.ellipse(H.x + (cat ? 7 : 8), H.y + 3.5, cat ? 4.5 : 7, cat ? 3.5 : 5, 0, 0, TAU)); ctx.fill();
    if (cat) {
      ctx.fillStyle = pink; path(c => { c.moveTo(H.x + 11, H.y + 1); c.lineTo(H.x + 14, H.y + 1); c.lineTo(H.x + 12.5, H.y + 3); c.closePath(); }); ctx.fill();
      ctx.globalAlpha = 0.5; path(c => c.ellipse(H.x - 1, H.y + 4, 3, 2, 0, 0, TAU)); ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      path(c => { c.moveTo(H.x + 9, H.y + 5.5); c.quadraticCurveTo(H.x + 10.5, H.y + 8, H.x + 12.5, H.y + 5.5); }); ctx.stroke();
      ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      path(c => { c.moveTo(H.x + 9, H.y + 4); c.lineTo(H.x + 19, H.y + 1); c.moveTo(H.x + 9, H.y + 5); c.lineTo(H.x + 19, H.y + 5.5); }); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = eyeC; path(c => c.ellipse(H.x + 14, H.y + 1.5, 2.6, 2, 0, 0, TAU)); ctx.fill();
      ctx.lineWidth = 1.5;
      path(c => { c.moveTo(H.x + 9, H.y + 8); c.quadraticCurveTo(H.x + 12, H.y + 10, H.x + 15, H.y + 7.5); }); ctx.stroke();
      if (run || happy) { ctx.lineWidth = 2; shape(pink, c => c.ellipse(H.x + 12.5, H.y + 11 + Math.sin(t * 20) * 0.8, 2.4, 3, 0, 0, TAU)); }
    }
    ctx.lineWidth = 2;

    const blink = (t % 3.5) < 0.12;
    const eye = (x, y, rx, ry) => {
      if (lie) { path(c => c.arc(x, y - 1, rx, 0.1 * Math.PI, 0.9 * Math.PI)); ctx.stroke(); }          // closed: u
      else if (happy) { path(c => c.arc(x, y + 1.5, rx, 1.1 * Math.PI, 1.9 * Math.PI)); ctx.stroke(); } // happy: ^
      else {
        const k = blink ? 0.15 : sad ? 0.55 : 1;
        ctx.fillStyle = eyeC; path(c => c.ellipse(x, y, rx, ry * k, 0, 0, TAU)); ctx.fill();
        if (!blink) { ctx.fillStyle = '#fff'; path(c => c.arc(x + 0.8, y - ry * k * 0.4, 0.9, 0, TAU)); ctx.fill(); }
      }
    };
    eye(H.x + 4, H.y - 2, 2.4, 3.2);
    eye(H.x + 10.5, H.y - 2, 1.9, 2.8);
    if (sad && !lie) {                                                    // grumpy brows
      ctx.lineWidth = 1.8;
      path(c => { c.moveTo(H.x + 1, H.y - 8); c.lineTo(H.x + 6.5, H.y - 5.5); c.moveTo(H.x + 13, H.y - 8); c.lineTo(H.x + 8.5, H.y - 5.5); }); ctx.stroke();
    }
    ctx.restore();

    if (p.say) speechBubble(ctx, p.say.text, p.x, baseY - 66 * SCALE / 1.25);
    else if (lie) speechBubble(ctx, 'Zzz', p.x, baseY - 40 - Math.sin(t * 2) * 3);
  }

  Object.assign(exports, { PETS, makePet, stepPet, pokePet, petHit, drawPet, shade });
})(typeof module === 'object' ? module.exports : (window.Pet = {}),
   typeof module === 'object' ? require('./mood') : window.Mood);
