// Neon tank decorations along the bottom of the desktop. Positions are fractions of the width
// (fish.js uses the same ones for the airstone / chest bubbles).
(function (exports, Neon) {
  const { glow } = Neon;
  const TAU = Math.PI * 2;
  const LABELS = { plants: 'Rong biển', rocks: 'Đá', castle: 'Lâu đài', chest: 'Rương báu', airstone: 'Sủi bọt khí' };

  function seaweed(ctx, x, h, t, n, color, i) {
    glow(ctx, color, 3);
    ctx.beginPath();
    for (let k = 0; k <= n; k++) ctx.lineTo(x + Math.sin(t * 1.2 + k * 0.6 + i) * k * 2.6, h - k * 14);
    ctx.stroke();
  }

  function rocks(ctx, x, h) {
    glow(ctx, '#8c9eff', 2.5);
    for (const [dx, r] of [[-22, 18], [8, 24], [34, 13]]) { ctx.beginPath(); ctx.arc(x + dx, h, r, Math.PI, TAU); ctx.stroke(); }
  }

  function castle(ctx, x, h, t) {
    glow(ctx, '#b388ff', 2.5);
    const tower = (cx, w, top) => {
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, h); ctx.lineTo(cx - w / 2, top);
      for (let i = 0; i < 4; i++) { const a = cx - w / 2 + i * w / 4; ctx.lineTo(a, top - 7); ctx.lineTo(a + w / 8, top - 7); ctx.lineTo(a + w / 8, top); ctx.lineTo(a + w / 4, top); }
      ctx.lineTo(cx + w / 2, h);
      ctx.stroke();
    };
    tower(x - 38, 30, h - 96); tower(x + 38, 30, h - 96); tower(x, 54, h - 70);
    ctx.beginPath(); ctx.moveTo(x - 11, h); ctx.lineTo(x - 11, h - 22); ctx.arc(x, h - 22, 11, Math.PI, TAU); ctx.lineTo(x + 11, h); ctx.stroke();
    ctx.fillStyle = `rgba(255,214,102,${0.5 + 0.3 * Math.sin(t * 2)})`;
    for (const wx of [x - 38, x + 38]) { ctx.beginPath(); ctx.roundRect(wx - 4, h - 74, 8, 12, 4); ctx.fill(); ctx.stroke(); }
    glow(ctx, '#ff6ec7', 2);
    ctx.beginPath(); ctx.moveTo(x, h - 77); ctx.lineTo(x, h - 100); ctx.lineTo(x + 14, h - 95 + Math.sin(t * 3) * 2); ctx.lineTo(x, h - 90); ctx.stroke();
  }

  function chest(ctx, x, h, t) {
    const open = t % 9 < 1.5 ? Math.sin(Math.min(1, (t % 9) / 0.3) * Math.PI / 2) * (t % 9 > 1.2 ? (1.5 - t % 9) / 0.3 : 1) : 0;
    glow(ctx, '#ffb300', 2.5);
    ctx.beginPath(); ctx.rect(x - 22, h - 22, 44, 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 22, h - 12); ctx.lineTo(x + 22, h - 12); ctx.stroke();
    ctx.save(); ctx.translate(x - 22, h - 22); ctx.rotate(-open * 0.9);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(22, -16, 44, 0); ctx.stroke();
    ctx.restore();
    if (open > 0.3) { ctx.fillStyle = '#ffd54f'; for (const d of [-10, 0, 10]) { ctx.beginPath(); ctx.arc(x + d, h - 24, 3.5, 0, TAU); ctx.fill(); } }
  }

  function airstone(ctx, x, h) {
    glow(ctx, '#29b6f6', 2.5);
    ctx.beginPath(); ctx.ellipse(x, h - 5, 12, 5, 0, 0, TAU); ctx.stroke();
  }

  function draw(ctx, s) {
    const d = s.decor || {}, w = s.w, h = s.h - 2, t = s.t;
    ctx.save();
    if (d.plants) {
      [[0.04, 9, '#19e0a0'], [0.065, 6, '#2ee6a6'], [0.3, 7, '#19e0a0'], [0.52, 10, '#7cffcb'], [0.9, 8, '#19e0a0'], [0.93, 11, '#2ee6a6']]
        .forEach(([fx, n, c], i) => seaweed(ctx, fx * w, h, t, n, c, i));
    }
    if (d.rocks) { rocks(ctx, w * 0.17, h); rocks(ctx, w * 0.72, h); }
    if (d.castle) castle(ctx, w * 0.82, h, t);
    if (d.chest) chest(ctx, w * 0.42, h, t);
    if (d.airstone) airstone(ctx, w * 0.62, h);
    ctx.restore();
  }

  Object.assign(exports, { LABELS, draw });
})(typeof module === 'object' ? module.exports : (window.Decor = {}),
   typeof module === 'object' ? require('./neon') : window.Neon);
