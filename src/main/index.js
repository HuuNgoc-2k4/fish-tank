const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadConfig, saveConfig, sanitize } = require('./config');
const { listPacks, importImages } = require('./petpacks');

// Windows: transparent windows sometimes render nothing with GPU on; FISH_NOGPU=1 turns it off.
if (process.env.FISH_NOGPU) app.disableHardwareAcceleration();

let aquarium, pet, settings, tray, cfg, cfgFile, userPets, packs = [];
let quitting = false, saveTimer;
const hover = new Map(); // window -> cursor is over something clickable

const root = path.join(__dirname, '..', '..');
const preload = path.join(__dirname, '..', 'preload', 'preload.js');
const page = name => path.join(__dirname, '..', 'renderer', name, 'index.html');
const packIds = () => packs.map(p => p.id);

// Overlays are click-through; they only catch the mouse while the renderer says the cursor is over something.
function refreshMouse(win) {
  if (!win || win.isDestroyed()) return;
  win.setIgnoreMouseEvents(!hover.get(win), { forward: true });
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

const broadcast = (ch, data) => { for (const w of [aquarium, pet, settings]) if (w && !w.isDestroyed()) w.webContents.send(ch, data); };

function apply() {
  for (const w of [aquarium, pet]) w.webContents.send('config', cfg);
  // The aquarium stays shown (so its z-order under the apps never changes); its renderer just stops drawing.
  if (cfg.pets) { pet.showInactive(); pet.setAlwaysOnTop(true, 'screen-saver'); } else pet.hide();
}

function rescanPets() {
  packs = listPacks([path.join(root, 'assets', 'pets'), userPets]);
  broadcast('pettypes', packs);
  return packs;
}

function openSettings() {
  settings.show();
  settings.focus();
}

function start() {
  userPets = path.join(app.getPath('userData'), 'pets');
  packs = listPacks([path.join(root, 'assets', 'pets'), userPets]);
  cfgFile = path.join(app.getPath('userData'), 'config.json');
  cfg = loadConfig(cfgFile, packIds());
  const { workArea } = screen.getPrimaryDisplay();

  // Aquarium: NOT always-on-top, so normal app windows cover it. Fish only show on the bare desktop.
  aquarium = overlay('aquarium', workArea, {});
  aquarium.once('ready-to-show', () => aquarium.showInactive());

  // Pets: above everything, over the whole work area; they walk on its bottom edge (top of a bottom taskbar)
  // and can be picked up and dropped anywhere.
  pet = overlay('pet', workArea, { alwaysOnTop: true });
  pet.once('ready-to-show', apply);

  settings = makeWindow('settings', { width: 620, height: 800, title: 'Fish Tank', autoHideMenuBar: true, backgroundColor: '#0b1020' });
  settings.setMenu(null);
  settings.on('close', e => { if (!quitting) { e.preventDefault(); settings.hide(); } });
  if (!process.argv.includes('--hidden')) settings.once('ready-to-show', () => settings.show());

  ipcMain.handle('config:get', () => cfg);
  ipcMain.on('config:set', (_e, next) => {
    cfg = sanitize(next, packIds());
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
  ipcMain.handle('pets:types', () => packs);
  ipcMain.handle('pets:reload', rescanPets);
  ipcMain.handle('pets:folder', () => { fs.mkdirSync(userPets, { recursive: true }); return shell.openPath(userPets); });
  ipcMain.handle('pets:import', async () => {
    const r = await dialog.showOpenDialog(settings, {
      title: 'Chọn ảnh thú cưng (nền trong suốt)', properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Ảnh', extensions: ['png', 'webp', 'gif', 'svg', 'jpg', 'jpeg'] }],
    });
    if (r.canceled || !r.filePaths.length) return null;
    try {
      const folder = importImages(r.filePaths, userPets);
      rescanPets();
      return packs.find(p => p.id === 'img-' + folder.toLowerCase().replace(/[^a-z0-9_-]/g, '')) || null;
    } catch (err) { return { error: err.message }; }
  });

  // Drop a handful of food from the top (works even when apps cover the desktop).
  const feed = () => aquarium.webContents.send('feed');
  globalShortcut.register('Control+Alt+F', feed);

  tray = new Tray(path.join(root, 'assets', 'icon.png'));
  tray.setToolTip('Fish Tank');
  tray.on('double-click', openSettings);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mở cài đặt', click: openSettings },
    { label: 'Thả thức ăn (Ctrl+Alt+F)', click: feed },
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
    if (cfg) { try { saveConfig(cfgFile, cfg); } catch { /* best effort on exit */ } }
  });
  app.whenReady().then(start);
}
