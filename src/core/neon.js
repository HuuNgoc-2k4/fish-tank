// Neon drawing helpers shared by every renderer. Loaded as a classic <script> (window.Neon) or via require().
(function (exports) {
  function glow(ctx, color, lw) {
    ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }

  function drawStar(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  }

  function neonText(ctx, text, x, y, color) {
    ctx.save();
    ctx.font = 'bold 15px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  exports.glow = glow; exports.drawStar = drawStar; exports.neonText = neonText;
})(typeof module === 'object' ? module.exports : (window.Neon = {}));
