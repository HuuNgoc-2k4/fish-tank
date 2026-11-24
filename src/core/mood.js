// Shared "teasing" model for fish and pets: clicks build annoyance, too much annoyance makes them sulk.
(function (exports) {
  const SULK_AT = 3.5;   // annoyance needed to sulk (4 quick clicks, or ~5 slow ones)
  const SULK_SECS = 25;
  const DECAY = 0.1;     // annoyance lost per second

  const newMood = () => ({ annoy: 0, sulk: 0 });

  function decay(m, dt) {
    m.annoy = Math.max(0, m.annoy - DECAY * dt);
    if (m.sulk > 0) {
      m.sulk -= dt;
      if (m.sulk <= 0) { m.sulk = 0; m.annoy = 0; }
    }
  }

  // Returns 'grumpy' (ignored, already sulking), 'sulk' (just started sulking) or one of `actions`.
  function poke(m, actions) {
    if (m.sulk > 0) return 'grumpy';
    m.annoy += 1;
    if (m.annoy >= SULK_AT) { m.sulk = SULK_SECS; return 'sulk'; }
    return actions[Math.floor(Math.random() * actions.length)];
  }

  exports.newMood = newMood; exports.decay = decay; exports.poke = poke;
  exports.SULK_SECS = SULK_SECS; exports.SULK_AT = SULK_AT;
})(typeof module === 'object' ? module.exports : (window.Mood = {}));
