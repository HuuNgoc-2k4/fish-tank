// "Mèo điệu": a fluffy white chibi cat in a striped top, sheer skirt, bows and a little handbag. p.color = outfit colour.
// Drawn from several angles so it never just slides a flat picture around:
//   side view  - walking, running, playing, eating (stride, swinging arms, skirt and tail flowing back)
//   front view - idle, sitting, purring, waving, grooming, stretching, jumping, held up, dizzy
//   back view  - sulking in the corner (turned away, tail lashing, puffs of anger)
//   curled up  - asleep (breathing, tail wrapped round, head on its paw)
(function (exports, PetDraw) {
  const { kit, eye, shade, models } = PetDraw;
  const TAU = Math.PI * 2;
  const C = {
    fur: '#fdfcff', furS: '#e2dcee', furD: '#c9c0da', line: '#4b3f5c', blush: '#ffadc4', lid: '#c8a2e8',
    iris: '#86b9d8', eye: '#26323f', mouth: '#a8344f', tongue: '#ff8fab', skirt: '#d3d7e2',
  };
  const SIDE = ['walk', 'run', 'play', 'chase', 'goEat', 'spin', 'eat'];

  function view(p) {
    if (p.state === 'sleep' || p.state === 'roll') return 'lie';
    if (p.state === 'sulk') return p.lying ? 'back' : 'side';
    return SIDE.includes(p.state) ? 'side' : 'front';
  }

  // Expression for the current state: eyes (style for eye()), mouth, angry brows, extra blush.
  function face(p) {
    switch (p.state) {
      case 'happy': return { eyes: 'happy', mouth: 'open' };
      case 'purr': return { eyes: 'happy', mouth: 'smile', blush: 1 };
      case 'greet': return { eyes: 'happy', mouth: 'smile' };
      case 'groom': return { eyes: 'closed', mouth: 'tongue' };
      case 'stretch': return { eyes: 'closed', mouth: 'yawn' };
      case 'dizzy': return { eyes: 'dizzy', mouth: 'wavy' };
      case 'held': case 'fall': return { eyes: 'wide', mouth: 'o' };
      case 'land': return { eyes: 'wide', mouth: 'small' };
      case 'eat': return { eyes: 'closed', mouth: 'chew' };
      case 'play': case 'chase': return { eyes: 'open', mouth: 'open' };
      case 'sulk': return { eyes: 'sad', mouth: 'pout', brows: 1 };
    }
    return p.mood && p.mood.annoy >= 2 ? { eyes: 'sad', mouth: 'pout', brows: 1 } : { eyes: 'open', mouth: 'small' };
  }

  // ---- shared parts ----
  const outfit = p => ({ c: p.color, c2: shade(p.color, 0.45), cd: shade(p.color, -0.35) });

  // A fluffy outline: radius multiplier r(angle, index) lets the fur stick out where we want it.
  function fluffy(k, cx, cy, rx, ry, r) {
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * TAU, m = r(a, i);
      k.lineTo(cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m);
    }
    k.closePath();
  }

  function striped(ctx, K, shapeFn, o, box) {
    K.fill(o.c, shapeFn);
    ctx.save(); K.path(shapeFn); ctx.clip();
    ctx.fillStyle = o.c2;
    for (let y = box[1] + 2; y < box[1] + box[3]; y += 3.4) ctx.fillRect(box[0], y, box[2], 1.5);
    ctx.restore();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.8; K.path(shapeFn); ctx.stroke();
  }

  function sparkles(ctx, K, pts, t) {
    pts.forEach(([x, y], i) => {
      ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 3 + i * 1.7));
      K.fill('#fff', k => k.arc(x, y, 0.8, 0, TAU));
    });
    ctx.globalAlpha = 1;
  }

  function bow(ctx, K, x, y, s, o, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.lineWidth = 1.4; ctx.strokeStyle = C.line;
    for (const d of [-1, 1]) {
      K.shape(o.c, k => { k.moveTo(0, 0); k.lineTo(d * 7, -4.5); k.quadraticCurveTo(d * 8.5, 0, d * 7, 4.5); k.closePath(); });
      ctx.strokeStyle = o.c2; ctx.lineWidth = 1.2;
      K.path(k => { k.moveTo(d * 3, -1.8); k.lineTo(d * 3, 1.8); k.moveTo(d * 5.5, -3); k.lineTo(d * 5.5, 3); }); ctx.stroke();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.4;
    }
    K.shape(o.cd, k => k.arc(0, 0, 2.2, 0, TAU));
    ctx.restore();
  }

  function curl(ctx, K, x, y, d) {                              // curly whisker
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.2;
    K.path(k => { k.moveTo(x, y); k.bezierCurveTo(x + d * 7, y - 4, x + d * 10, y + 5, x + d * 5, y + 5); k.arc(x + d * 6, y + 7, 1.8, -Math.PI / 2, Math.PI); });
    ctx.stroke();
  }

  function bag(ctx, K, x, y, rot, o) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineWidth = 1.5; ctx.strokeStyle = o.cd;
    K.path(k => k.arc(0, 2, 3, Math.PI, TAU)); ctx.stroke();
    ctx.strokeStyle = C.line; K.shape(o.c, k => k.roundRect(-4.5, 2, 9, 7, 2));
    K.fill(o.c2, k => k.roundRect(-3, 3.2, 3, 1.4, 0.7));
    ctx.restore();
  }

  function mouth(ctx, K, x, y, type, t) {
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.2;
    if (type === 'chew') type = Math.sin(t * 12) > 0 ? 'open' : 'small';
    if (type === 'small') { K.path(k => { k.arc(x - 1, y, 1, 0.1 * Math.PI, 0.9 * Math.PI); k.moveTo(x + 2, y); k.arc(x + 1, y, 1, 0.1 * Math.PI, 0.9 * Math.PI); }); ctx.stroke(); }
    else if (type === 'smile') { K.path(k => k.arc(x, y - 0.8, 2.4, 0.15 * Math.PI, 0.85 * Math.PI)); ctx.stroke(); }
    else if (type === 'open') {
      K.shape(C.mouth, k => { k.moveTo(x - 2.6, y - 0.6); k.quadraticCurveTo(x, y + 4.2, x + 2.6, y - 0.6); k.closePath(); });
      K.fill(C.tongue, k => k.ellipse(x, y + 1.6, 1.3, 0.9, 0, 0, TAU));
    } else if (type === 'o') K.shape(C.mouth, k => k.ellipse(x, y + 0.6, 1.2, 1.5, 0, 0, TAU));
    else if (type === 'yawn') { K.shape(C.mouth, k => k.ellipse(x, y + 1.4, 2.2, 3.2, 0, 0, TAU)); K.fill(C.tongue, k => k.ellipse(x, y + 3, 1.4, 1, 0, 0, TAU)); }
    else if (type === 'pout') { K.path(k => { k.moveTo(x - 2, y + 0.8); k.quadraticCurveTo(x, y - 1, x + 2, y + 0.8); }); ctx.stroke(); }
    else if (type === 'wavy') { K.path(k => { for (let i = 0; i <= 4; i++) k.lineTo(x - 2.4 + i * 1.2, y + (i % 2 ? -0.7 : 0.7)); }); ctx.stroke(); }
    else if (type === 'tongue') { K.path(k => k.arc(x, y - 0.6, 1.6, 0.15 * Math.PI, 0.85 * Math.PI)); ctx.stroke(); K.shape(C.tongue, k => k.ellipse(x, y + 1.8, 1.3, 1.6, 0, 0, TAU)); }
  }

  // Profile eye looking forward (+x); lashes flick back.
  function sideEye(ctx, K, x, y, st, t) {
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.6;
    if (st === 'happy') { K.path(k => k.arc(x, y + 1.5, 3, 1.1 * Math.PI, 1.9 * Math.PI)); ctx.stroke(); return; }
    if (st === 'dizzy') return eye(ctx, x, y, 2.6, 2.6, 'dizzy', t, { line: C.line, eye: C.eye });
    if (st === 'closed') {
      K.path(k => { k.arc(x, y - 1, 3, 0.1 * Math.PI, 0.9 * Math.PI); k.moveTo(x - 2.7, y); k.lineTo(x - 5, y + 1.2); }); ctx.stroke();
      return;
    }
    const blink = st === 'open' && (t % 3.5) < 0.12;
    const kk = blink ? 0.15 : st === 'sad' ? 0.5 : st === 'wide' ? 1.3 : 1;
    const lid = k => { k.moveTo(x - 3.5, y); k.quadraticCurveTo(x, y - 4.2 * kk, x + 3.2, y - 0.6 * kk); };
    const ball = k => { lid(k); k.quadraticCurveTo(x + 0.5, y + 3.2 * Math.max(kk, 0.6), x - 3.5, y); };
    if (!blink) {
      K.fill('#fff', ball);
      ctx.save(); K.path(ball); ctx.clip();
      K.fill(C.iris, k => k.arc(x + 1.1, y + 0.2, 2.6, 0, TAU));
      K.fill(C.eye, k => k.arc(x + 1.5, y + 0.2, 1.25, 0, TAU));
      K.fill('#fff', k => k.arc(x + 2.1, y - 0.9, 0.6, 0, TAU));
      ctx.restore();
    }
    ctx.lineWidth = 1.9; K.path(lid); ctx.stroke();
    ctx.lineWidth = 1.3; K.path(k => { k.moveTo(x - 3.4, y); k.lineTo(x - 6, y - 2); k.moveTo(x - 2.4, y - 1.9 * kk); k.lineTo(x - 4.4, y - 4.4); }); ctx.stroke();
  }

  // Tail tuft at the end point (ex, ey).
  function tuft(K, ex, ey, d = -1) {
    K.shape(C.fur, k => { k.moveTo(ex + d * -1, ey - 3); k.lineTo(ex + d * 5, ey - 2); k.lineTo(ex + d * 2, ey); k.lineTo(ex + d * 6, ey + 2.5); k.lineTo(ex + d * -1, ey + 3); k.closePath(); });
  }

  // ---- side view ----
  function side(ctx, p, t, f, K, o) {
    const s = p.state, run = Math.abs(p.vx) > 150, moving = Math.abs(p.vx) > 1, ph = p.walkPh;
    const eat = s === 'eat', reach = s === 'play' || s === 'chase';
    const stride = run ? 8 : 5.5, lift = run ? 4 : 2.6, flow = moving ? (run ? 5 : 2.5) : 0;
    const bob = moving ? -Math.abs(Math.sin(ph)) * (run ? 2.2 : 1.4) : Math.sin(t * 2) * 0.4;
    if (run) ctx.rotate(0.1);
    ctx.translate(0, bob);

    // tail streams out behind, waving
    const wave = Math.sin(t * (run ? 9 : 4)) * (run ? 2 : 4);
    const tEnd = run ? [-38, -16 + wave] : [-30, -30 + wave];
    K.thick(C.fur, 6.5, k => { k.moveTo(-6, -15); k.quadraticCurveTo(-24, run ? -12 : -10, ...tEnd); });
    tuft(K, tEnd[0], tEnd[1]);

    const leg = (hx, off, c) => {
      const fx = moving ? hx + Math.sin(ph + off) * stride : hx + (off ? -2 : 2);
      const fy = moving ? -2 - Math.max(0, Math.cos(ph + off)) * lift : -2;
      K.thick(c, 6, k => { k.moveTo(hx, -12); k.lineTo(fx, fy - 1); });
      ctx.lineWidth = 1.8; K.shape(c, k => k.ellipse(fx + 1.6, fy, 3.7, 2.3, 0, 0, TAU));
    };
    const arm = (sign, c) => {
      const amp = run ? 1.6 : 1;
      const hand = reach ? [10, -27 + Math.sin(t * 10 + sign) * 1.5] : eat ? [9, -23] : [1 + sign * Math.sin(ph) * 5 * amp * (moving ? 1 : 0), -22];
      K.thick(c, 5, k => { k.moveTo(1, -31); k.lineTo(...hand); });
      return hand;
    };

    arm(1, C.furS);                                            // far arm
    leg(1, Math.PI, C.furS);                                   // far leg
    leg(-1, 0, C.fur);                                         // near leg
    // skirt flares backwards while moving
    const skirt = k => {
      k.moveTo(-6, -21); k.lineTo(6, -21); k.lineTo(11 - flow * 0.4, -6);
      for (let i = 0; i <= 6; i++) k.lineTo(11 - flow * 0.4 - i * (28 + flow * 0.6) / 6, -6 + (i % 2 ? 1.6 : 0) + Math.sin(t * 6 + i) * (moving ? 0.6 : 0.3));
      k.closePath();
    };
    ctx.lineWidth = 1.8; K.shape(C.skirt, skirt);
    ctx.strokeStyle = o.c2; ctx.lineWidth = 2;
    K.path(k => { k.moveTo(11 - flow * 0.4, -6); for (let i = 1; i <= 6; i++) k.lineTo(11 - flow * 0.4 - i * (28 + flow * 0.6) / 6, -6 + (i % 2 ? 1.6 : 0)); }); ctx.stroke();
    sparkles(ctx, K, [[-8, -15], [-3, -11], [2, -16], [5, -10], [-12, -9]], t);
    striped(ctx, K, k => k.roundRect(-6, -33, 13, 13, 4), o, [-7, -33, 15, 13]);
    const hand = arm(-1, C.fur);                               // near arm with the bag
    if (!reach && !eat) bag(ctx, K, hand[0], hand[1], moving ? Math.sin(ph) * 0.35 : Math.sin(t * 1.5) * 0.08, o);

    // head (lowered to the bowl when eating; nose in the air when sulking)
    const tilt = eat ? 0.35 : s === 'sulk' ? -0.14 : run ? 0.05 : Math.sin(t * 1.3) * 0.03;
    ctx.save();
    ctx.translate(eat ? 9 : 4, eat ? -38 : -46); ctx.rotate(tilt);
    const earBack = run ? -0.35 : s === 'sulk' ? -0.2 : 0;
    ctx.lineWidth = 1.8; ctx.strokeStyle = C.line;
    ctx.save(); ctx.translate(-5, -10); ctx.rotate(earBack - 0.15);       // far ear
    K.shape(C.furS, k => { k.moveTo(-6, 2); k.lineTo(-2, -20); k.lineTo(5, 0); k.closePath(); });
    ctx.restore();
    ctx.save(); ctx.translate(3, -11); ctx.rotate(earBack);               // near ear
    K.shape(C.fur, k => { k.moveTo(-7, 2); k.lineTo(-1, -21); k.lineTo(7, 1); k.closePath(); });
    ctx.strokeStyle = C.furD; ctx.lineWidth = 1;
    K.path(k => { k.moveTo(-1, 0); k.lineTo(-1, -13); k.moveTo(2, 0); k.lineTo(0.5, -10); }); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.8;
    K.shape(C.fur, k => fluffy(k, 0, 0, 19, 15, (a, i) => {
      const c = Math.cos(a), sn = Math.sin(a);
      if (c < -0.35 && i % 2) return 1.17;                     // cheek fur sticks out at the back
      if (c > 0.6 && sn > 0) return 1 + 0.12 * Math.exp(-((a - 0.45) ** 2) / 0.06);  // muzzle
      return 1;
    }));
    ctx.strokeStyle = C.furD; ctx.lineWidth = 1;
    K.path(k => { k.arc(3, -10, 2, 0.5, TAU + 1.5); k.arc(4.4, -13, 1.2, Math.PI, TAU + 2); }); ctx.stroke();
    K.path(k => { k.moveTo(-10, 10); k.quadraticCurveTo(2, 15, 12, 10); }); ctx.stroke();
    ctx.globalAlpha = f.blush ? 0.75 : 0.45; K.fill(C.blush, k => k.ellipse(8, 6, 4, 2.2, 0, 0, TAU));
    if (['open', 'wide', 'sad'].includes(f.eyes)) { ctx.globalAlpha = 0.5; K.fill(C.lid, k => k.ellipse(8.5, -4, 5.2, 2.3, -0.1, 0, TAU)); }
    ctx.globalAlpha = 1;
    sideEye(ctx, K, 9, -1, f.eyes, t);
    if (f.brows) { ctx.strokeStyle = C.line; ctx.lineWidth = 1.6; K.path(k => { k.moveTo(5, -7.5); k.lineTo(11.5, -5); }); ctx.stroke(); }
    K.fill(C.line, k => k.ellipse(19.3, 1.5, 1, 0.75, 0, 0, TAU));
    mouth(ctx, K, 16.5, 5, f.mouth, t);
    curl(ctx, K, -17, -2, -1);
    bow(ctx, K, -4, -12, 0.9, o, -0.3);
    ctx.restore();
  }

  // ---- front view ----
  function front(ctx, p, t, f, K, o) {
    const s = p.state, held = s === 'held' || s === 'fall', sit = ['sit', 'purr', 'groom', 'dizzy', 'greet'].includes(s);
    const breathe = Math.sin(t * 2) * 0.5;
    if (s === 'dizzy') ctx.rotate(Math.sin(t * 5) * 0.07);
    const low = sit ? 7 : 0;
    ctx.translate(0, low + (sit || held ? 0 : breathe * 0.4));
    if (s === 'stretch') ctx.scale(1, 1.05);

    // tail
    const wave = Math.sin(t * (s === 'purr' ? 6 : 2.5)) * 4;
    if (held) { K.thick(C.fur, 6.5, k => { k.moveTo(-4, -14); k.quadraticCurveTo(-12, -2, -8 + wave, 10); }); tuft(K, -8 + wave, 12, 1); }
    else if (sit) { K.thick(C.fur, 6.5, k => { k.moveTo(-8, -12 - low); k.quadraticCurveTo(-28, -2 - low, -30, -14 - low + wave * 0.5); }); tuft(K, -30, -14 - low + wave * 0.5); }
    else { K.thick(C.fur, 6.5, k => { k.moveTo(-6, -15); k.bezierCurveTo(-24, -14, -18, -34, -28 + wave * 0.5, -40); }); tuft(K, -28 + wave * 0.5, -40); }

    // legs
    ctx.lineWidth = 1.8;
    if (sit) { K.shape(C.fur, k => k.ellipse(-6, -3 - low, 4, 3, 0, 0, TAU)); K.shape(C.fur, k => k.ellipse(6, -3 - low, 4, 3, 0, 0, TAU)); }
    else for (const [x, off] of [[-5, 0], [5, Math.PI]]) {
      const fx = held ? x + Math.sin(t * 12 + off) * 3 : x, fy = held ? 2 : -2;
      K.thick(C.fur, 6, k => { k.moveTo(x, -12); k.lineTo(fx, fy); });
      if (!held) { ctx.lineWidth = 1.8; K.shape(C.fur, k => k.ellipse(fx + (x < 0 ? -1 : 1), -1.5, 3.6, 2.2, 0, 0, TAU)); }
    }

    // skirt
    const hw = sit ? 18 : 15, hb = sit ? -3 - low : -6;
    const skirt = k => {
      k.moveTo(-8, -21); k.lineTo(8, -21); k.lineTo(hw, hb);
      for (let i = 0; i <= 6; i++) k.lineTo(hw - i * hw / 3, hb + (i % 2 ? 1.6 : 0) + Math.sin(t * 3 + i) * 0.4);
      k.closePath();
    };
    ctx.lineWidth = 1.8; K.shape(C.skirt, skirt);
    ctx.strokeStyle = o.c2; ctx.lineWidth = 2;
    K.path(k => { k.moveTo(-hw, hb); for (let i = 0; i <= 6; i++) k.lineTo(-hw + i * hw / 3, hb + (i % 2 ? 1.6 : 0)); }); ctx.stroke();
    sparkles(ctx, K, [[-9, -16], [-5, -12], [-1, -17], [3, -11], [7, -15], [10, -9]], t);
    striped(ctx, K, k => k.roundRect(-9, -33, 18, 13, 4), o, [-10, -33, 20, 13]);
    ctx.strokeStyle = o.cd; K.path(k => { k.moveTo(-5, -33); k.lineTo(0, -29.5); k.lineTo(5, -33); }); ctx.stroke();

    // arms: pose depends on what she's doing
    const wobble = (a, b) => Math.sin(t * a + b);
    const hands = {
      happy: [[-16, -42 + wobble(12, 0) * 2], [16, -42 + wobble(12, 1) * 2]],
      stretch: [[-19, -45], [19, -45]],
      held: [[-17, -37 + wobble(14, 0) * 3], [17, -37 + wobble(14, 2) * 3]],
      greet: [[-17, -41 + wobble(10, 0) * 3], [13, -21]],
      groom: [[-6, -27], [13, -21]],
      dizzy: [[-15, -24 + wobble(6, 0) * 2], [15, -24 + wobble(6, 2) * 2]],
      purr: [[-4, -23], [4, -23]],
      land: [[-15, -27], [15, -27]],
    }[held ? 'held' : s] || [[-13, -21 + breathe * 0.3], [13, -21 + breathe * 0.3]];
    hands.forEach(([x, y], i) => K.thick(C.fur, 5, k => { k.moveTo(i ? 8 : -8, -31); k.lineTo(x, y); }));
    const up = hands[1][1] < -30;
    bag(ctx, K, hands[1][0], hands[1][1], up ? Math.sin(t * 8) * 0.3 : Math.sin(t * 1.5) * 0.08, o);

    // ears + head
    const HY = -46, earTilt = s === 'dizzy' ? 0.3 : held ? -0.15 : s === 'purr' ? 0.15 : 0;
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(d * 12, HY - 8); ctx.rotate(d * earTilt + (s === 'greet' && d < 0 ? -0.1 : 0));
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.8;
      K.shape(C.fur, k => { k.moveTo(d * -7, 2); k.lineTo(d * 3, -22); k.lineTo(d * 9, 0); k.closePath(); });
      ctx.strokeStyle = C.furD; ctx.lineWidth = 1;
      K.path(k => { k.moveTo(d * 2, -1); k.lineTo(d * 2.5, -14); k.moveTo(d * 5, -1); k.lineTo(d * 3.5, -11); }); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    if (s === 'greet' || s === 'purr') { ctx.translate(0, HY); ctx.rotate(s === 'greet' ? -0.08 : Math.sin(t * 1.5) * 0.06); ctx.translate(0, -HY); }
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.8;
    K.shape(C.fur, k => fluffy(k, 0, HY, 23, 16, (a, i) => (Math.abs(Math.cos(a)) > 0.5 && i % 2 ? 1.18 : 1)));
    ctx.strokeStyle = C.furD; ctx.lineWidth = 1;
    K.path(k => { k.moveTo(-17, HY + 9); k.quadraticCurveTo(0, HY + 14, 17, HY + 9); }); ctx.stroke();
    K.path(k => { k.arc(0, HY - 9, 2.2, 0.5, TAU + 1.5); k.arc(1.6, HY - 12.5, 1.4, Math.PI, TAU + 2); }); ctx.stroke();

    ctx.globalAlpha = f.blush ? 0.75 : 0.45;
    K.fill(C.blush, k => k.ellipse(-14, HY + 5, 4.5, 2.6, 0, 0, TAU)); K.fill(C.blush, k => k.ellipse(14, HY + 5, 4.5, 2.6, 0, 0, TAU));
    if (['open', 'wide', 'sad'].includes(f.eyes)) {
      ctx.globalAlpha = 0.5;
      K.fill(C.lid, k => k.ellipse(-9, HY - 2, 6.5, 3, -0.1, 0, TAU)); K.fill(C.lid, k => k.ellipse(9, HY - 2, 6.5, 3, 0.1, 0, TAU));
    }
    ctx.globalAlpha = 1;
    const colors = { line: C.line, eye: C.eye, iris: C.iris };
    eye(ctx, -9, HY + 1, 3.2, 3.6, f.eyes, t, colors, -1);
    eye(ctx, 9, HY + 1, 3.2, 3.6, f.eyes, t, colors, 1);
    if (f.brows) {
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.6;
      K.path(k => { k.moveTo(-13, HY - 7); k.lineTo(-5, HY - 4.5); k.moveTo(13, HY - 7); k.lineTo(5, HY - 4.5); }); ctx.stroke();
    }
    K.fill(C.line, k => k.ellipse(0, HY + 6, 1, 0.7, 0, 0, TAU));
    mouth(ctx, K, 0, HY + 8.5, f.mouth, t);
    if (s === 'groom') { ctx.lineWidth = 1.6; K.shape(C.fur, k => k.ellipse(-3.5, HY + 11 + Math.sin(t * 10), 3.6, 3, 0.3, 0, TAU)); }
    for (const d of [-1, 1]) { curl(ctx, K, d * 22, HY - 9, d); bow(ctx, K, d * 15, HY - 11, 1, o); }
    ctx.restore();
  }

  // ---- back view: sulking in the corner ----
  function back(ctx, p, t, f, K, o) {
    const huff = Math.max(0, Math.sin(t * 1.7)), lash = Math.sin(t * 7) * 6;
    ctx.translate(0, 7);
    K.thick(C.fur, 6.5, k => { k.moveTo(4, -9); k.quadraticCurveTo(22, -4, 28, -14 + lash); });           // tail lashing
    tuft(K, 28, -14 + lash, 1);
    ctx.lineWidth = 1.8;
    K.shape(C.skirt, k => { k.moveTo(-8, -21); k.lineTo(8, -21); k.lineTo(18, -3); k.lineTo(-18, -3); k.closePath(); });
    sparkles(ctx, K, [[-8, -12], [-2, -16], [4, -10], [9, -14]], t);
    striped(ctx, K, k => k.roundRect(-9, -34, 18, 14, 4), o, [-10, -34, 20, 14]);
    for (const d of [-1, 1]) K.thick(C.fur, 5, k => { k.moveTo(d * 8, -31); k.lineTo(d * 11, -23); });      // arms crossed in front
    const HY = -43 + Math.sin(t * 2) * 0.4;                                                                 // head hangs a bit
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(d * 12, HY - 8); ctx.rotate(d * 0.28);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.8;
      K.shape(C.fur, k => { k.moveTo(d * -7, 2); k.lineTo(d * 3, -20); k.lineTo(d * 9, 0); k.closePath(); });
      ctx.restore();
    }
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.8;
    K.shape(C.fur, k => fluffy(k, 0, HY, 22, 16, (a, i) => (Math.abs(Math.cos(a)) > 0.45 && i % 2 ? 1.16 : 1)));
    ctx.strokeStyle = C.furD; ctx.lineWidth = 1;
    K.path(k => { for (const x of [-8, 0, 8]) { k.moveTo(x, HY + 6); k.quadraticCurveTo(x + 2, HY + 10, x, HY + 14); } }); ctx.stroke();
    for (const d of [-1, 1]) bow(ctx, K, d * 15, HY - 11, 1, o, d * 0.2);
    if (huff > 0.6) {                                                                                       // puffs of anger
      ctx.globalAlpha = (huff - 0.6) * 2.5; ctx.fillStyle = '#fff'; ctx.strokeStyle = C.furD; ctx.lineWidth = 1;
      for (const d of [-1, 1]) K.shape('#fff', k => k.arc(d * (27 + huff * 4), HY - 6 - huff * 4, 2.8, 0, TAU));
      ctx.globalAlpha = 1;
    }
  }

  // ---- curled up asleep ----
  function lie(ctx, p, t, f, K, o) {
    if (p.state === 'roll') { const r = (1 - p.timer / 1.2) * TAU; ctx.translate(0, -12); ctx.rotate(r); ctx.translate(0, 12); }
    ctx.scale(1, 1 + Math.sin(t * 2) * 0.03);                                                               // breathing
    ctx.lineWidth = 1.8; ctx.strokeStyle = C.line;
    K.shape(C.fur, k => k.ellipse(-27, -3, 3.6, 2.4, 0, 0, TAU));
    K.shape(C.fur, k => k.ellipse(-22, -2.5, 3.6, 2.4, 0, 0, TAU));
    K.shape(C.skirt, k => { k.ellipse(-8, 0, 20, 10, 0, Math.PI, TAU); k.closePath(); });
    sparkles(ctx, K, [[-18, -4], [-10, -7], [-2, -4]], t);
    striped(ctx, K, k => k.ellipse(-4, -9, 11, 7, -0.1, 0, TAU), o, [-15, -16, 22, 14]);
    ctx.save(); ctx.translate(14, -13);
    ctx.save(); ctx.translate(-6, -9); ctx.rotate(-0.7);
    K.shape(C.fur, k => { k.moveTo(-6, 2); k.lineTo(-1, -17); k.lineTo(6, 1); k.closePath(); });
    ctx.restore();
    K.shape(C.fur, k => fluffy(k, 0, 0, 16, 12.5, (a, i) => (Math.cos(a) < -0.3 && i % 2 ? 1.15 : 1)));
    ctx.globalAlpha = 0.5; K.fill(C.blush, k => k.ellipse(7, 4, 3.6, 2, 0, 0, TAU)); ctx.globalAlpha = 1;
    sideEye(ctx, K, 7, -1, 'closed', t);
    K.fill(C.line, k => k.ellipse(15.5, 1.5, 0.9, 0.7, 0, 0, TAU));
    mouth(ctx, K, 13, 4.5, 'small', t);
    bow(ctx, K, -6, -9, 0.85, o, -0.6);
    ctx.restore();
    K.shape(C.fur, k => k.ellipse(22, -2.5, 4.2, 2.6, 0, 0, TAU));                                       // paw under chin
    K.thick(C.fur, 6.5, k => { k.moveTo(-26, -6); k.quadraticCurveTo(-12, 4, 10, 0); });                  // tail wrapped round
    tuft(K, 12, 0, 1);
  }

  function draw(ctx, p, t) {
    const K = kit(ctx, C.line), o = outfit(p), f = face(p), v = view(p);
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.scale((v === 'back' ? 1 : p.dir) * 0.9, 0.9);
    ({ side, front, back, lie })[v](ctx, p, t, f, K, o);
  }

  models.fancy = draw;
  Object.assign(exports, { view, face, draw });
})(typeof module === 'object' ? module.exports : (window.PetFancy = {}),
   typeof module === 'object' ? require('./pet-draw') : window.PetDraw);
