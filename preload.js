const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (data) => ipcRenderer.send('save-entry', data),
  onSaveSuccess: (callback) => ipcRenderer.on('save-success', (e, msg) => callback(msg))
});
