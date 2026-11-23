// Global "hold Ctrl" detection (the overlay never has keyboard focus, so the DOM can't see keys).
// uiohook-napi is only used for key up/down; clicks are handled by the overlay window itself.
function startFeedKey(onChange) {
  try {
    const { uIOhook, UiohookKey } = require('uiohook-napi');
    const keys = new Set([UiohookKey.Ctrl, UiohookKey.CtrlRight]);
    const down = new Set(); // keydown auto-repeats while held, so track pressed keycodes
    uIOhook.on('keydown', e => {
      if (keys.has(e.keycode) && !down.has(e.keycode)) { down.add(e.keycode); if (down.size === 1) onChange(true); }
    });
    uIOhook.on('keyup', e => {
      if (down.delete(e.keycode) && down.size === 0) onChange(false);
    });
    uIOhook.start();
    return { ok: true, stop: () => uIOhook.stop() };
  } catch (err) {
    console.log('[input] global key hook unavailable:', err.message);
    return { ok: false, stop() {} };
  }
}

module.exports = { startFeedKey };
