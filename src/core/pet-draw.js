// Pet drawing: filled cartoon cat / dog / fox, a front-facing "fancy" cat, and image-based pets (sprites).
// Everything is drawn in "pet space": feet at y = 0, x = body centre, 1 unit = Pet.size(world) pixels.
(function (exports, Pet) {
  const TAU = Math.PI * 2;

  // Mix a "#rrggbb" colour toward white (amt > 0) or black (amt < 0).
  function shade(c, amt) {
    const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
    return 'rgb(' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * (1 - k) + target * k)).join(',') + ')';
  }

  function speechBubble(ctx, text, x, bottom) {
    ctx.save();
    ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 18, h = 24;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.roundRect(x - w / 2, bottom - h, w, h, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, bottom - 1); ctx.lineTo(x, bottom + 6); ctx.lineTo(x + 5, bottom - 1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, bottom - 1.5); ctx.lineTo(x + 4, bottom - 1.5); ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#2b2b3a'; ctx.fillText(text, x, bottom - h / 2 + 1);
    ctx.restore();
  }

  const POSE = {
    walk: 'stand', run: 'stand', happy: 'stand', spin: 'stand', stretch: 'stand', goEat: 'stand', eat: 'stand',
    play: 'stand', chase: 'stand', land: 'stand', sit: 'sit', groom: 'sit', purr: 'sit', greet: 'sit', dizzy: 'sit',
    sleep: 'lie', roll: 'lie', held: 'held', fall: 'held',
  };
  const poseOf = p => p.state === 'sulk' ? (p.lying ? 'lie' : 'stand') : POSE[p.state] || 'sit';
  function eyeStyle(p) {
    const s = p.state;
    if (s === 'sleep' || s === 'roll' || s === 'groom' || (s === 'sulk' && p.lying)) return 'closed';
    if (s === 'happy' || s === 'purr' || s === 'greet' || s === 'eat') return 'happy';
    if (s === 'dizzy') return 'dizzy';
    if (s === 'held' || s === 'fall') return 'wide';
    if (s === 'sulk') return 'sad';
    return 'open';
  }

  // Small drawing kit bound to one context and outline colour.
  function kit(ctx, line) {
    const path = fn => { ctx.beginPath(); fn(ctx); };
    return {
      path,
      shape: (c, fn) => { path(fn); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); },
      fill: (c, fn) => { path(fn); ctx.fillStyle = c; ctx.fill(); },
      thick: (c, w, fn) => {                               // outlined thick stroke: tails, legs
        path(fn); ctx.strokeStyle = line; ctx.lineWidth = w + 3; ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
        ctx.strokeStyle = line; ctx.lineWidth = 2;
      },
    };
  }

  // One eye in the given style. lid = outer-corner direction for lashes (fancy cat), 0 = none.
  function eye(ctx, x, y, rx, ry, st, t, colors, lid = 0) {
    const { path } = kit(ctx, colors.line);
    ctx.lineWidth = 1.8; ctx.strokeStyle = colors.line;
    if (st === 'closed') { path(c => c.arc(x, y - 1, rx, 0.1 * Math.PI, 0.9 * Math.PI)); ctx.stroke(); return; }
    if (st === 'happy') { path(c => c.arc(x, y + 1.5, rx, 1.1 * Math.PI, 1.9 * Math.PI)); ctx.stroke(); return; }
    if (st === 'dizzy') {
      path(c => { for (let a = 0; a < 3 * Math.PI; a += 0.3) c.lineTo(x + Math.cos(a + t * 8) * a / 9.4 * rx * 1.1, y + Math.sin(a + t * 8) * a / 9.4 * rx * 1.1); });
      ctx.stroke(); return;
    }
    const blink = st === 'open' && (t % 3.5) < 0.12;
    const kk = blink ? 0.15 : st === 'sad' ? 0.55 : st === 'wide' ? 1.25 : 1;
    if (colors.iris) {                                      // fancy eye: white, blue iris, pupil
      ctx.fillStyle = '#fff'; path(c => c.ellipse(x, y, rx * 1.5, ry * kk, 0, 0, TAU)); ctx.fill();
      if (!blink) {
        ctx.save(); path(c => c.ellipse(x, y, rx * 1.5, ry * kk, 0, 0, TAU)); ctx.clip();
        ctx.fillStyle = colors.iris; path(c => c.arc(x + 0.4, y + 0.3, ry * 0.95, 0, TAU)); ctx.fill();
        ctx.fillStyle = colors.eye; path(c => c.arc(x + 0.4, y + 0.3, ry * 0.45, 0, TAU)); ctx.fill();
        ctx.fillStyle = '#fff'; path(c => c.arc(x + 1.2, y - 0.8, 0.8, 0, TAU)); ctx.fill();
        ctx.restore();
      }
      ctx.lineWidth = 1.6;
      path(c => c.ellipse(x, y, rx * 1.5, ry * kk, 0, Math.PI, TAU)); ctx.stroke();       // upper lid
      if (lid) {
        const ex = x + lid * rx * 1.5;
        path(c => { c.moveTo(ex, y); c.lineTo(ex + lid * 2.2, y - 2.2); c.moveTo(ex - lid * 1, y - ry * kk * 0.7); c.lineTo(ex + lid * 1.2, y - ry * kk - 1.6); });
        ctx.stroke();
      }
      return;
    }
    ctx.fillStyle = colors.eye; path(c => c.ellipse(x, y, rx * (st === 'wide' ? 1.2 : 1), ry * kk, 0, 0, TAU)); ctx.fill();
    if (!blink) { ctx.fillStyle = '#fff'; path(c => c.arc(x + 0.8, y - ry * kk * 0.4, st === 'wide' ? 1.3 : 0.9, 0, TAU)); ctx.fill(); }
  }

  // ---- cat / dog / fox (side view, facing right) ----
  const FEAT = { cat: { rx: 17 }, dog: { rx: 19 }, fox: { rx: 18 } };

  function drawQuad(ctx, p, t, ps, st) {
    const ty = FEAT[p.type] ? p.type : 'cat', cat = ty === 'cat', dog = ty === 'dog', fox = ty === 'fox';
    const base = p.color, dark = shade(base, fox ? -0.55 : -0.3), light = fox ? '#fff6ea' : shade(base, 0.5), line = shade(base, -0.72);
    const colors = { line, eye: '#20212b' }, pink = '#ff9db8';
    const { path, shape, fill, thick } = kit(ctx, line);
    const happy = p.state === 'happy', run = Math.abs(p.vx) > 150, moving = Math.abs(p.vx) > 1, ph = p.walkPh;
    const air = p.state === 'happy' ? Math.min(1, -p.y / 24) : 0;

    ctx.scale(p.dir, 1);
    if (run) ctx.rotate(0.07);
    if (p.state === 'stretch') ctx.rotate(0.16);
    if (p.state === 'roll') { const a = (1 - p.timer / 1.2) * TAU; ctx.translate(0, -8); ctx.rotate(a); ctx.translate(0, 8); }
    ctx.lineWidth = 2; ctx.lineJoin = ctx.lineCap = 'round'; ctx.strokeStyle = line;

    const lie = ps === 'lie', sit = ps === 'sit', held = ps === 'held';
    const bob = lie || held ? 0 : moving ? -Math.abs(Math.sin(ph)) * 1.4 : Math.sin(t * 2) * 0.5;
    const B = lie ? { x: 0, y: -8, rx: 18, ry: 7, rot: 0 }
      : sit ? { x: -4, y: -14, rx: 11, ry: 13, rot: -0.3 }
        : held ? { x: 0, y: -21, rx: 9, ry: 15, rot: 0.1 }
          : { x: 0, y: -20 + bob, rx: FEAT[ty].rx, ry: 10, rot: 0 };
    const H = lie ? { x: 17, y: -10 } : sit ? { x: 8, y: -36 + bob } : held ? { x: 4, y: -40 }
      : { x: cat ? 20 : 22, y: B.y - 9 + (p.state === 'eat' ? 13 : 0) };
    if (p.state === 'eat') H.x += 4;

    // tail (behind everything)
    const sw = Math.sin(t * (happy ? 10 : 3)) * 5, wag = Math.sin(t * (happy || p.state === 'purr' ? 28 : 7)) * 4;
    const tailEnd = held ? [-9 + Math.sin(t * 5) * 4, 6] : lie ? [-28, -13] : sit ? [-24, -16 + sw * 0.3]
      : dog ? [-22 + wag, B.y - 19] : [-24 + sw, B.y - 22];
    const tailRoot = held ? [-3, -8] : lie ? [-16, -8] : sit ? [-12, -8] : [-15, B.y - 4];
    const tailMid = held ? [-10, -2] : lie ? [-30, -2] : sit ? [-28, -2] : dog ? [-23, B.y - 12] : [-27 + sw * 0.3, B.y - 2];
    const tailPath = c => { c.moveTo(...tailRoot); c.quadraticCurveTo(...tailMid, ...tailEnd); };
    if (fox) {
      thick(base, 11, tailPath);
      fill(light, c => c.arc(tailEnd[0], tailEnd[1], 5.5, 0, TAU)); path(c => c.arc(tailEnd[0], tailEnd[1], 5.5, 0, TAU)); ctx.stroke();
    } else thick(base, 5, tailPath);

    // legs
    const walkLeg = (hx, off, c) => {
      const amp = happy ? 0 : run ? 11 : moving ? 7 : 0;
      const s = Math.sin(ph + off) * amp;
      const lift = (moving && !happy ? Math.max(0, Math.cos(ph + off)) * (run ? 6 : 4) : 0) + (happy ? 5 + air * 6 : 0);
      const fx = hx + s, fy = -3 - lift;
      thick(c, 6, k => { k.moveTo(hx, B.y + B.ry - 3); k.lineTo(fx, fy); });
      thick(fox ? dark : light, 6, k => { k.moveTo(fx, fy - 0.5); k.lineTo(fx, fy); });
    };
    const dangle = (hx, hy, off, c) => {                    // held: legs paddle in the air
      const fx = hx + Math.sin(ph + off) * 3, fy = hy + 13;
      thick(c, 6, k => { k.moveTo(hx, hy); k.lineTo(fx, fy); });
      thick(fox ? dark : light, 6, k => { k.moveTo(fx, fy - 0.5); k.lineTo(fx, fy); });
    };
    const stand = !lie && !sit && !held;
    if (stand) { walkLeg(B.rx * 0.35, Math.PI, dark); walkLeg(-B.rx * 0.65, 0, dark); }
    if (held) { dangle(5, -26, 0, dark); dangle(-3, -12, Math.PI, dark); }

    // body, with belly / stripes / spot clipped to its outline
    const bodyPath = c => c.ellipse(B.x, B.y, B.rx, B.ry, B.rot, 0, TAU);
    fill(base, bodyPath);
    ctx.save();
    path(bodyPath); ctx.clip();
    fill(light, c => c.ellipse(B.x + 2 + (held ? 3 : 0), B.y + B.ry * (held ? 0 : 0.95), B.rx * (held ? 0.55 : 0.8), B.ry * 0.6, B.rot, 0, TAU));
    if (cat) {
      ctx.strokeStyle = dark; ctx.lineWidth = 3;
      for (const k of [-8, -1, 6]) {
        path(c => held ? (c.moveTo(B.x - B.rx - 2, B.y + k), c.lineTo(B.x - B.rx + 6, B.y + k + 1)) : (c.moveTo(B.x + k, B.y - B.ry - 2), c.lineTo(B.x + k + 1, B.y - B.ry + 6)));
        ctx.stroke();
      }
    } else if (dog) fill(dark, c => c.ellipse(B.x - 5, B.y - 3, 7, 5, 0, 0, TAU));
    ctx.restore();
    ctx.strokeStyle = line; ctx.lineWidth = 2;
    path(bodyPath); ctx.stroke();

    if (stand) { walkLeg(B.rx * 0.62, 0, base); walkLeg(-B.rx * 0.55, Math.PI, base); }
    if (held) { dangle(8, -25, Math.PI, base); dangle(0, -11, 0, base); }
    if (sit) {
      shape(base, c => c.ellipse(-9, -8, 9, 8, 0, 0, TAU));                                // haunch
      shape(light, c => c.ellipse(-3, -2.5, 6.5, 3, 0, 0, TAU));
      thick(dark, 6, c => { c.moveTo(1, -20); c.lineTo(2, -3); });
      if (p.state === 'groom') {                                                           // licking a raised paw
        const py = H.y + 9 + Math.sin(t * 10) * 1.5;
        thick(base, 6, c => { c.moveTo(6, -20); c.quadraticCurveTo(14, -18, H.x + 6, py); });
        thick(light, 6, c => { c.moveTo(H.x + 6, py - 0.5); c.lineTo(H.x + 6, py); });
      } else {
        thick(base, 6, c => { c.moveTo(6, -20); c.lineTo(7, -3); });
        thick(light, 6, c => { c.moveTo(7, -3.5); c.lineTo(7, -3); });
      }
      thick(fox ? dark : light, 6, c => { c.moveTo(2, -3.5); c.lineTo(2, -3); });
    }
    if (lie) {
      shape(base, c => c.ellipse(-8, -5, 9, 5, 0, 0, TAU));
      shape(light, c => c.ellipse(21, -2.5, 5, 3, 0, 0, TAU));
      shape(light, c => c.ellipse(28, -3, 6, 3.2, 0, 0, TAU));
    }

    // ears then head
    const earTilt = run ? -0.45 : lie || st === 'sad' ? 0.4 : held ? -0.3 : (t % 4) < 0.18 ? 0.2 : 0;
    if (cat || fox) {
      const s = fox ? 1.3 : 1;
      ctx.save(); ctx.translate(H.x, H.y); ctx.rotate(earTilt); ctx.scale(s, s);
      shape(base, c => { c.moveTo(-8, -4); c.lineTo(-6, -17); c.lineTo(2, -9); c.closePath(); });
      shape(base, c => { c.moveTo(3, -9); c.lineTo(10, -17); c.lineTo(11, -3); c.closePath(); });
      ctx.fillStyle = fox ? dark : pink;
      path(c => { c.moveTo(-6.5, -7); c.lineTo(-5.5, -14); c.lineTo(-0.5, -9.5); c.closePath(); }); ctx.fill();
      path(c => { c.moveTo(4.5, -9.5); c.lineTo(8.5, -14.5); c.lineTo(9, -6); c.closePath(); }); ctx.fill();
      ctx.restore();
    } else shape(dark, c => c.ellipse(H.x + 6, H.y - 8, 3.5, 6, 0.5, 0, TAU));             // far floppy ear
    shape(base, c => c.arc(H.x, H.y, 10, 0, TAU));
    if (dog) shape(dark, c => c.ellipse(H.x - 4, H.y + 2, 4.5, 8.5, run || held ? 0.9 : 0.25 + Math.sin(t * 3) * 0.05, 0, TAU));

    // face
    if (fox) {
      fill(light, c => c.ellipse(H.x + 1, H.y + 5, 7, 4.5, 0, 0, TAU));                    // white cheeks
      shape(light, c => { c.moveTo(H.x + 4, H.y); c.quadraticCurveTo(H.x + 16, H.y + 1, H.x + 18, H.y + 3.5); c.quadraticCurveTo(H.x + 12, H.y + 8, H.x + 4, H.y + 7); });
      fill(colors.eye, c => c.ellipse(H.x + 17.5, H.y + 3, 2, 1.6, 0, 0, TAU));
    } else {
      fill(light, c => c.ellipse(H.x + (cat ? 7 : 8), H.y + 3.5, cat ? 4.5 : 7, cat ? 3.5 : 5, 0, 0, TAU));
    }
    if (cat) {
      fill(pink, c => { c.moveTo(H.x + 11, H.y + 1); c.lineTo(H.x + 14, H.y + 1); c.lineTo(H.x + 12.5, H.y + 3); c.closePath(); });
      ctx.globalAlpha = 0.5; fill(pink, c => c.ellipse(H.x - 1, H.y + 4, 3, 2, 0, 0, TAU)); ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      path(c => { c.moveTo(H.x + 9, H.y + 5.5); c.quadraticCurveTo(H.x + 10.5, H.y + 8, H.x + 12.5, H.y + 5.5); }); ctx.stroke();
      ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      path(c => { c.moveTo(H.x + 9, H.y + 4); c.lineTo(H.x + 19, H.y + 1); c.moveTo(H.x + 9, H.y + 5); c.lineTo(H.x + 19, H.y + 5.5); }); ctx.stroke();
      ctx.globalAlpha = 1;
      if (p.state === 'groom') { ctx.lineWidth = 1.5; shape(pink, c => c.ellipse(H.x + 12, H.y + 7.5, 1.6, 2, 0, 0, TAU)); }
    } else if (dog) {
      fill(colors.eye, c => c.ellipse(H.x + 14, H.y + 1.5, 2.6, 2, 0, 0, TAU));
      ctx.lineWidth = 1.5;
      path(c => { c.moveTo(H.x + 9, H.y + 8); c.quadraticCurveTo(H.x + 12, H.y + 10, H.x + 15, H.y + 7.5); }); ctx.stroke();
    }
    if ((dog || fox) && (run || happy || p.state === 'play' || p.state === 'chase')) {
      ctx.lineWidth = 2; shape(pink, c => c.ellipse(H.x + 12.5, H.y + 11 + Math.sin(t * 20) * 0.8, 2.4, 3, 0, 0, TAU));
    }
    ctx.lineWidth = 2;
    eye(ctx, H.x + 4, H.y - 2, 2.4, 3.2, st, t, colors);
    eye(ctx, H.x + 10.5, H.y - 2, 1.9, 2.8, st, t, colors);
    if (st === 'sad') {                                                                    // grumpy brows
      ctx.lineWidth = 1.8;
      path(c => { c.moveTo(H.x + 1, H.y - 8); c.lineTo(H.x + 6.5, H.y - 5.5); c.moveTo(H.x + 13, H.y - 8); c.lineTo(H.x + 8.5, H.y - 5.5); }); ctx.stroke();
    }
  }

  // ---- fancy cat: front-facing chibi in a dress (fluffy white fur, bows, handbag). p.color = outfit colour ----
  function drawFancy(ctx, p, t, ps, st) {
    const fur = '#fdfcff', furS = '#d9d3e6', line = '#4b3f5c', c = p.color, c2 = shade(c, 0.45), cd = shade(c, -0.35);
    const colors = { line, eye: '#26323f', iris: '#86b9d8' };
    const { path, shape, fill, thick } = kit(ctx, line);
    const moving = Math.abs(p.vx) > 1, ph = p.walkPh;
    const lie = ps === 'lie', sit = ps === 'sit', held = ps === 'held', up = p.state === 'happy' || held;

    ctx.scale(p.dir * 0.9, 0.9);
    if (lie) { ctx.translate(30, -24); ctx.rotate(-Math.PI / 2); }
    ctx.lineJoin = ctx.lineCap = 'round'; ctx.strokeStyle = line; ctx.lineWidth = 1.8;
    const bob = lie || held ? 0 : moving ? -Math.abs(Math.sin(ph)) * 1.5 : Math.sin(t * 2) * 0.5;
    if (moving && !lie) ctx.rotate(Math.sin(ph) * 0.06);
    const low = sit ? 7 : 0;                                  // sitting lowers everything
    ctx.translate(0, low + bob);

    // tail: long and fluffy, sweeping behind
    const wave = Math.sin(t * (p.state === 'purr' ? 6 : 2.5)) * 4;
    const tail = held ? c2 => { c2.moveTo(-4, -14); c2.quadraticCurveTo(-12, -2, -8 + wave, 10); }
      : c2 => { c2.moveTo(-6, -14); c2.quadraticCurveTo(-22, -4, -34, -4 + wave); };
    thick(fur, 7, tail);
    const te = held ? [-8 + wave, 10] : [-34, -4 + wave];
    shape(fur, k => { k.moveTo(te[0] - 4, te[1] - 2); k.lineTo(te[0] - 9, te[1] - 1); k.lineTo(te[0] - 3, te[1] + 2); k.lineTo(te[0] - 8, te[1] + 4); k.lineTo(te[0] + 1, te[1] + 3); k.closePath(); });

    // legs
    if (sit) {
      shape(fur, k => k.ellipse(-6, -3 - low, 4, 3, 0, 0, TAU));
      shape(fur, k => k.ellipse(6, -3 - low, 4, 3, 0, 0, TAU));
    } else {
      for (const [x, off] of [[-5, 0], [5, Math.PI]]) {
        const lift = held ? 0 : moving ? Math.max(0, Math.sin(ph + off)) * 3 : 0;
        const fx = held ? x + Math.sin(ph + off) * 3 : x, fy = held ? 2 : -2 - lift;
        thick(fur, 6, k => { k.moveTo(x, -12); k.lineTo(fx, fy); });
      }
    }

    // skirt (sheer grey with sparkles and a pink hem)
    const hw = sit ? 18 : 15, hb = sit ? -3 - low : -6;
    const skirt = k => {
      k.moveTo(-8, -21); k.lineTo(8, -21); k.lineTo(hw, hb);
      for (let i = 0; i <= 6; i++) k.lineTo(hw - i * hw / 3, hb + (i % 2 ? 1.6 : 0) + Math.sin(t * 3 + i) * 0.4);
      k.closePath();
    };
    ctx.globalAlpha = 0.95; shape('#cfd3de', skirt); ctx.globalAlpha = 1;
    ctx.strokeStyle = c2; ctx.lineWidth = 2;
    path(k => { k.moveTo(-hw, hb); for (let i = 0; i <= 6; i++) k.lineTo(-hw + i * hw / 3, hb + (i % 2 ? 1.6 : 0)); }); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + i * 1.7));
      fill('#fff', k => k.arc(-9 + i * 3.6 + (i % 2) * 1.5, -16 + (i % 3) * 3.5, 0.8, 0, TAU));
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = line; ctx.lineWidth = 1.8;

    // striped top
    const top = k => k.roundRect(-9, -33, 18, 13, 4);
    fill(c, top);
    ctx.save(); path(top); ctx.clip();
    ctx.fillStyle = c2; for (let y = -31; y < -20; y += 3.4) ctx.fillRect(-10, y, 20, 1.5);
    ctx.restore();
    path(top); ctx.stroke();
    ctx.strokeStyle = cd; path(k => { k.moveTo(-5, -33); k.lineTo(0, -29.5); k.lineTo(5, -33); }); ctx.stroke();
    ctx.strokeStyle = line;

    // arms: the near hand carries the bag (except when arms go up)
    const armEnd = side => up ? [side * 15, -41 + Math.sin(t * 12 + side) * 2] : [side * 13, -21 + (moving ? Math.sin(ph + side) * 1.2 : 0)];
    for (const side of [-1, 1]) {
      const [x, y] = armEnd(side);
      thick(fur, 5, k => { k.moveTo(side * 8, -31); k.lineTo(x, y); });
    }
    const bagHand = up ? [9, -24] : armEnd(1);
    ctx.save(); ctx.translate(bagHand[0], bagHand[1]); ctx.rotate(moving ? Math.sin(ph) * 0.25 : Math.sin(t * 1.5) * 0.08);
    ctx.lineWidth = 1.5; ctx.strokeStyle = cd;
    path(k => k.arc(0, 2, 3, Math.PI, TAU)); ctx.stroke();
    ctx.strokeStyle = line; shape(c, k => k.roundRect(-4.5, 2, 9, 7, 2));
    fill(c2, k => k.roundRect(-3, 3.2, 3, 1.4, 0.7));
    ctx.restore();

    // ears (behind head), then the fluffy head
    const HY = -46, earTilt = st === 'sad' || lie ? 0.25 : held ? -0.15 : 0;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 12, HY - 8); ctx.rotate(side * earTilt);
      shape(fur, k => { k.moveTo(side * -7, 2); k.lineTo(side * 3, -22); k.lineTo(side * 9, 0); k.closePath(); });
      ctx.strokeStyle = furS; ctx.lineWidth = 1;
      path(k => { k.moveTo(side * 2, -1); k.lineTo(side * 2.5, -14); k.moveTo(side * 5, -1); k.lineTo(side * 3.5, -11); }); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = line; ctx.lineWidth = 1.8;
    shape(fur, k => {                                          // spiky cheek fur on the sides
      for (let i = 0; i < 32; i++) {
        const a = i / 32 * TAU, side = Math.abs(Math.cos(a)) > 0.5;
        const r = side && i % 2 ? 1.18 : 1;
        k.lineTo(Math.cos(a) * 23 * r, HY + Math.sin(a) * 16 * (side ? r * 0.95 : 1));
      }
      k.closePath();
    });
    ctx.strokeStyle = furS; ctx.lineWidth = 1;
    path(k => { k.moveTo(-17, HY + 9); k.quadraticCurveTo(0, HY + 14, 17, HY + 9); }); ctx.stroke();
    path(k => { k.arc(0, HY - 9, 2.2, 0.5, TAU + 1.5); k.arc(1.6, HY - 12.5, 1.4, Math.PI, TAU + 2); }); ctx.stroke(); // forehead curl
    ctx.strokeStyle = line;

    // face
    ctx.globalAlpha = 0.45; fill('#ffadc4', k => k.ellipse(-14, HY + 5, 4.5, 2.6, 0, 0, TAU)); fill('#ffadc4', k => k.ellipse(14, HY + 5, 4.5, 2.6, 0, 0, TAU));
    if (st === 'open' || st === 'wide' || st === 'sad') {
      ctx.globalAlpha = 0.5; fill('#c8a2e8', k => k.ellipse(-9, HY - 2, 6.5, 3, -0.1, 0, TAU)); fill('#c8a2e8', k => k.ellipse(9, HY - 2, 6.5, 3, 0.1, 0, TAU));
    }
    ctx.globalAlpha = 1;
    eye(ctx, -9, HY + 1, 3.2, 3.6, st, t, colors, -1);
    eye(ctx, 9, HY + 1, 3.2, 3.6, st, t, colors, 1);
    fill(line, k => k.ellipse(0, HY + 6, 1, 0.7, 0, 0, TAU));
    if (p.state === 'happy' || p.state === 'purr' || held) { ctx.lineWidth = 1.2; path(k => k.arc(0, HY + 8, 1.6, 0.15 * Math.PI, 0.85 * Math.PI)); ctx.stroke(); }

    // bows with curly whiskers
    for (const side of [-1, 1]) {
      const bx = side * 15, by = HY - 11;
      ctx.lineWidth = 1.4; ctx.strokeStyle = line;
      path(k => { k.moveTo(bx + side * 6, by + 2); k.bezierCurveTo(bx + side * 14, by - 2, bx + side * 16, by + 8, bx + side * 11, by + 7); k.arc(bx + side * 12, by + 9, 1.8, -Math.PI / 2, Math.PI); }); ctx.stroke();
      for (const s of [-1, 1]) {
        shape(c, k => { k.moveTo(bx, by); k.lineTo(bx + s * 7, by - 4.5); k.quadraticCurveTo(bx + s * 8.5, by, bx + s * 7, by + 4.5); k.closePath(); });
        ctx.strokeStyle = c2; ctx.lineWidth = 1.2;
        path(k => { k.moveTo(bx + s * 3, by - 1.8); k.lineTo(bx + s * 3, by + 1.8); k.moveTo(bx + s * 5.5, by - 3); k.lineTo(bx + s * 5.5, by + 3); }); ctx.stroke();
        ctx.strokeStyle = line; ctx.lineWidth = 1.4;
      }
      shape(cd, k => k.arc(bx, by, 2.2, 0, TAU));
    }
  }

  // ---- image-based pets ----
  const images = new Map();
  function image(url) {
    if (typeof Image === 'undefined') return null;                   // node tests
    let im = images.get(url);
    if (!im) { im = new Image(); im.src = url; images.set(url, im); }
    return im.complete && im.naturalWidth ? im : null;
  }
  // Which animation each state uses when the pet folder doesn't have one with that exact name.
  const FALLBACK = {
    run: 'walk', play: 'walk', chase: 'walk', goEat: 'walk', spin: 'walk', stretch: 'idle', groom: 'sit', purr: 'happy',
    greet: 'happy', eat: 'sit', dizzy: 'sit', land: 'idle', roll: 'sleep', fall: 'held', sulk: 'sit',
  };
  function spriteAnim(sprite, p) {
    const s = p.state === 'sulk' && p.lying ? 'sleep' : p.state;
    const name = [s, FALLBACK[s], 'idle'].find(n => n && sprite.anims[n]);
    return { name, a: name && sprite.anims[name] };
  }

  function drawSprite(ctx, p, t, ps, T) {
    const { name, a } = spriteAnim(T.sprite, p);
    if (!a) return;
    const n = a.frames.length, url = a.frames[Math.floor(t * (a.fps || 6)) % n];
    const im = image(url);
    if (!im) return;
    const h = T.h, w = im.naturalWidth / im.naturalHeight * h;
    ctx.scale(p.dir * (T.sprite.facing === 'left' ? -1 : 1), 1);
    // Motion the images don't have themselves: bob while walking, lie down to sleep, swing when held.
    if (Math.abs(p.vx) > 1 && name !== 'walk') { ctx.translate(0, -Math.abs(Math.sin(p.walkPh)) * 3); ctx.rotate(Math.sin(p.walkPh) * 0.06); }
    if (ps === 'lie' && name !== 'sleep') { ctx.translate(h / 2, -w / 2); ctx.rotate(-Math.PI / 2); }
    if (ps === 'held' && name !== 'held') ctx.rotate(Math.sin(t * 9) * 0.08);
    if (p.state === 'roll') { const r = (1 - p.timer / 1.2) * TAU; ctx.translate(0, -h / 2); ctx.rotate(r); ctx.translate(0, h / 2); }
    ctx.drawImage(im, -w / 2, -h, w, h);
  }

  // ---- whole pet + overlays ----
  function drawPet(ctx, world, p, t) {
    const k = Pet.size(world), T = Pet.TYPES[p.type] || Pet.TYPES.cat, feet = world.ground + p.y;
    const ps = poseOf(p), st = eyeStyle(p), top = feet - T.h * k;

    const air = Math.min(1, -p.y / 200);                             // ground shadow shrinks with height
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.28 - air * 0.18})`;
    ctx.beginPath(); ctx.ellipse(p.x, world.ground + 1, 22 * k * (1 - air * 0.6), 4 * k * 0.8, 0, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    if (p.state === 'held') {                                        // hang from the scruff, swinging
      const hg = Pet.hang(world, p);
      ctx.translate(p.x, feet - hg); ctx.rotate(p.ang); ctx.translate(0, hg);
    } else if (p.state === 'fall') {
      const c = 22 * k;
      ctx.translate(p.x, feet - c); ctx.rotate(p.ang); ctx.translate(0, c);
    } else ctx.translate(p.x, feet);
    const hop = p.state === 'happy' ? Math.min(1, -p.y / 24) : 0;
    const sq = p.state === 'land' ? Math.max(0, p.timer / 0.3) : 0;  // squash on landing
    ctx.scale(k * (1 - hop * 0.08 + sq * 0.15), k * (1 + hop * 0.12 - sq * 0.15));
    if (T.sprite) drawSprite(ctx, p, t, ps, T);
    else if (p.type === 'fancy') drawFancy(ctx, p, t, ps, st);
    else drawQuad(ctx, p, t, ps, st);
    ctx.restore();

    if (p.state === 'dizzy') {
      ctx.save(); ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#8a6d00'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + i * TAU / 3, x = p.x + Math.cos(a) * 16 * k, y = top + 4 + Math.sin(a) * 4;
        ctx.beginPath();
        for (let j = 0; j < 10; j++) { const r = j % 2 ? 2 : 5, b = j * Math.PI / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    const bubbleY = p.state === 'held' ? feet - Pet.hang(world, p) - 12 : top - 4;
    if (p.say) speechBubble(ctx, p.say.text, p.x, bubbleY);
    else if (p.lying) speechBubble(ctx, 'Zzz', p.x, feet - 30 * k - Math.sin(t * 2) * 3);
    else if (world.hover === p && p.name) {
      ctx.save();
      ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,20,35,.85)'; ctx.fillStyle = '#fff';
      ctx.strokeText(p.name, p.x, bubbleY); ctx.fillText(p.name, p.x, bubbleY);
      ctx.restore();
    }
  }

  function drawWorld(ctx, world, t) {
    const k = Pet.size(world), g = world.ground;
    for (const b of world.bowls) {
      ctx.save(); ctx.translate(b.x, g); ctx.scale(k * 0.8, k * 0.8);
      ctx.lineWidth = 2; ctx.strokeStyle = '#5a2236'; ctx.lineJoin = 'round';
      ctx.fillStyle = '#7a4a2a';
      for (let i = 0; i < Math.ceil(b.food * 6); i++) { ctx.beginPath(); ctx.arc(-9 + i * 3.6, -11 - (i % 2) * 2, 2.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ff7aa2';
      ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(15, -10); ctx.lineTo(11, 0); ctx.lineTo(-11, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, -3);
      ctx.restore();
    }
    if (world.laser) {
      ctx.save(); ctx.fillStyle = '#ff1744'; ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(world.laser.x, g - 3, 4, 0, TAU); ctx.fill(); ctx.restore();
    }
    for (const p of world.pets) drawPet(ctx, world, p, p.t);   // per-pet clock (random start) so pets don't blink in sync
    const b = world.ball;
    if (b) {
      const y = g + b.y;
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life / 2);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(b.x, g + 1, b.r, 2.5, 0, 0, TAU); ctx.fill();
      ctx.translate(b.x, y); ctx.rotate(b.spin);
      ctx.fillStyle = '#d4f53c'; ctx.strokeStyle = '#55661a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(-b.r, 0, b.r * 0.8, -0.9, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(b.r, 0, b.r * 0.8, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.font = 'bold 16px "Segoe UI", "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff4f8b';
    for (const f of world.fx) { ctx.globalAlpha = Math.min(1, f.t); ctx.fillText(f.text, f.x, f.y); }
    ctx.restore();
  }

  Object.assign(exports, { drawWorld, drawPet, shade, poseOf, eyeStyle, spriteAnim });
})(typeof module === 'object' ? module.exports : (window.PetDraw = {}),
   typeof module === 'object' ? require('./pet') : window.Pet);
