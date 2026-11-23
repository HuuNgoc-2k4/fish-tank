const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');

if (!app.requestSingleInstanceLock()) app.quit();

let win, tray;
let interactive = false, hover = false;

// Click-through overlay; it only catches the mouse while hovering the feed button or in interactive mode.
const applyMouse = () => win.setIgnoreMouseEvents(!(interactive || hover), { forward: true });

app.whenReady().then(() => {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    x, y, width, height, transparent: true, frame: false, resizable: false, hasShadow: false,
    skipTaskbar: true, focusable: false, alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  applyMouse();
  win.loadFile('index.html');

  const send = (ch, v) => win.webContents.send(ch, v);
  const feed = () => send('feed');
  globalShortcut.register('Control+Alt+F', feed);
  ipcMain.on('capture', (_e, on) => { hover = on; applyMouse(); });

  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setToolTip('Fish Tank');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Cho ăn (Ctrl+Alt+F)', click: feed },
    { label: 'Thêm cá', click: () => send('add') },
    { label: 'Click để thả thức ăn', type: 'checkbox', checked: false, click: m => { interactive = m.checked; applyMouse(); send('interactive', interactive); } },
    { label: 'Chạy cùng Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: m => app.setLoginItemSettings({ openAtLogin: m.checked }) },
    { type: 'separator' },
    { label: 'Thoát', click: () => app.quit() },
  ]));
});

app.on('will-quit', () => globalShortcut.unregisterAll());
