const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  store: {
    get: (k) => ipcRenderer.invoke('store:get', k),
    set: (k, v) => ipcRenderer.invoke('store:set', k, v),
    delete: (k) => ipcRenderer.invoke('store:delete', k),
  },
  openImage: () => ipcRenderer.invoke('dialog:openImage'),
  extractPdfText: () => ipcRenderer.invoke('pdf:extract'),
  openJson: () => ipcRenderer.invoke('dialog:openJson'),
  save: (opts) => ipcRenderer.invoke('dialog:save', opts),
  renderPdf: (opts) => ipcRenderer.invoke('pdf:renderFromHtml', opts),
  aiGenerate: (opts) => ipcRenderer.invoke('ai:generate', opts),
  onMenu: (event, cb) => ipcRenderer.on(`menu:${event}`, cb),
});
