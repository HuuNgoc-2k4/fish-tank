const { contextBridge, ipcRenderer } = require('electron');

// One bridge for every window. Named `bridge` (not `api`) to avoid clashing with page-level names.
contextBridge.exposeInMainWorld('bridge', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: cfg => ipcRenderer.send('config:set', cfg),
  onConfig: cb => ipcRenderer.on('config', (_e, cfg) => cb(cfg)),
  onFeed: cb => ipcRenderer.on('feed', () => cb()),
  capture: on => ipcRenderer.send('capture', on),
  // image pets
  getPetTypes: () => ipcRenderer.invoke('pets:types'),
  onPetTypes: cb => ipcRenderer.on('pettypes', (_e, list) => cb(list)),
  importPet: () => ipcRenderer.invoke('pets:import'),
  reloadPets: () => ipcRenderer.invoke('pets:reload'),
  openPetFolder: () => ipcRenderer.invoke('pets:folder'),
});
