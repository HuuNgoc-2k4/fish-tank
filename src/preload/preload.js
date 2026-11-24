const { contextBridge, ipcRenderer } = require('electron');

// One bridge for every window. Named `bridge` (not `api`) to avoid clashing with page-level names.
contextBridge.exposeInMainWorld('bridge', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: cfg => ipcRenderer.send('config:set', cfg),
  onConfig: cb => ipcRenderer.on('config', (_e, cfg) => cb(cfg)),
  onFeed: cb => ipcRenderer.on('feed', () => cb()),
  capture: on => ipcRenderer.send('capture', on),
});
