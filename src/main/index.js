const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const { loadConfig, saveConfig, sanitize } = require('./config');
const { startFeedKey } = require('./input');

// Windows: transparent windows sometimes render nothing with GPU on; FISH_NOGPU=1 turns it off.
if (process.env.FISH_NOGPU) app.disableHardwareAcceleration();

const PET_STRIP_H = 100; // pet window height; its bottom edge sits on top of the taskbar

let aquarium, pet, settings, tray, cfg, cfgFile, feedKey;
let feedHeld = false, quitting = false, saveTimer;
const hover = new Map(); // window -> cursor is over something clickable

const root = path.join(__dirname, '..', '..');
const preload = path.join(__dirname, '..', 'preload', 'preload.js');
const page = name => path.join(__dirname, '..', 'renderer', name, 'index.html');

// Overlays are click-through; they only catch the mouse while hovering a fish/pet,
// or (aquarium only) while the feed key is held.
function refreshMouse(win) {
  if (!win || win.isDestroyed()) return;
  const catches = hover.get(win) || (win === aquarium && cfg.aquarium && feedHeld);
  win.setIgnoreMouseEvents(!catches, { forward: true });
}

function makeWindow(name, opts) {
  const win = new BrowserWindow({ show: false, webPreferences: { preload }, ...opts });
  const wc = win.webContents;
  wc.on('console-message', (_e, _level, msg) => console.log(`[${name}]`, msg));
  wc.on('did-fail-load', (_e, code, desc) => console.log(`[${name}] load failed`, code, desc));
  wc.on('render-process-gone', (_e, d) => console.log(`[${name}] renderer gone`, d.reason));
  wc.on('did-finish-load', () => console.log(`[${name}] loaded`, JSON.stringify(win.getBounds())));
  win.loadFile(page(name));
  return win;
}

function overlay(name, bounds, opts) {
  const win = makeWindow(name, {
    ...bounds, transparent: true, frame: false, resizable: false, hasShadow: false,
    skipTaskbar: true, focusable: false, ...opts,
  });
  win.setIgnoreMouseEvents(true, { forward: true });
  return win;
}

function apply() {
  for (const w of [aquarium, pet]) w.webContents.send('config', cfg);
  // The aquarium stays shown (so its z-order under the apps never changes); its renderer just stops drawing.
  if (cfg.pets) { pet.showInactive(); pet.setAlwaysOnTop(true, 'screen-saver'); } else pet.hide();
  refreshMouse(aquarium);
}

function openSettings() {
  settings.show();
  settings.focus();
}

function start() {
  cfgFile = path.join(app.getPath('userData'), 'config.json');
  cfg = loadConfig(cfgFile);
  const { workArea } = screen.getPrimaryDisplay();

  // Aquarium: NOT always-on-top, so normal app windows cover it. Fish only show on the bare desktop.
  aquarium = overlay('aquarium', workArea, {});
  aquarium.once('ready-to-show', () => aquarium.showInactive());

  // Pet: a strip whose bottom edge is the top edge of the taskbar (bottom taskbar assumed), above everything.
  pet = overlay('pet', {
    x: workArea.x, y: workArea.y + workArea.height - PET_STRIP_H, width: workArea.width, height: PET_STRIP_H,
  }, { alwaysOnTop: true });
  pet.once('ready-to-show', apply);

  settings = makeWindow('settings', { width: 560, height: 760, title: 'Fish Tank', autoHideMenuBar: true, backgroundColor: '#0b1020' });
  settings.setMenu(null);
  settings.on('close', e => { if (!quitting) { e.preventDefault(); settings.hide(); } });
  if (!process.argv.includes('--hidden')) settings.once('ready-to-show', () => settings.show());

  feedKey = startFeedKey(down => {
    feedHeld = down;
    refreshMouse(aquarium);
    aquarium.webContents.send('feedkey', down);
  });

  ipcMain.handle('config:get', () => cfg);
  ipcMain.handle('status:get', () => ({ feedKey: feedKey.ok }));
  ipcMain.on('config:set', (_e, next) => {
    cfg = sanitize(next);
    apply();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { saveConfig(cfgFile, cfg); } catch (err) { console.log('[config] save failed', err.message); } }, 300);
  });
  ipcMain.on('capture', (e, on) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return;
    hover.set(win, on);
    refreshMouse(win);
  });

  // Fallback when the global key hook isn't available: drop a handful of food from the top.
  globalShortcut.register('Control+Alt+F', () => aquarium.webContents.send('feed'));

  tray = new Tray(path.join(root, 'assets', 'icon.png'));
  tray.setToolTip('Fish Tank');
  tray.on('double-click', openSettings);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mở cài đặt', click: openSettings },
    // openAtLogin only makes sense for the packaged exe (in dev it would launch bare Electron).
    ...(app.isPackaged ? [{
      label: 'Chạy cùng Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
      click: m => app.setLoginItemSettings({ openAtLogin: m.checked, args: ['--hidden'] }),
    }] : []),
    { type: 'separator' },
    { label: 'Thoát', click: () => app.quit() },
  ]));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => settings && openSettings());
  app.on('before-quit', () => { quitting = true; });
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (feedKey) feedKey.stop();
    if (cfg) { try { saveConfig(cfgFile, cfg); } catch { /* best effort on exit */ } }
  });
  app.whenReady().then(start);
}
