const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  capture: on => ipcRenderer.send('capture', on),
  on: (channel, cb) => ipcRenderer.on(channel, (_e, v) => cb(v)),
});
