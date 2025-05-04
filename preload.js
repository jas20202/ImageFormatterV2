const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (data) => ipcRenderer.send('save-entry', data),
  onSaveSuccess: (callback) => ipcRenderer.on('save-success', (e, msg) => callback(msg)),

  joinPath: (...args) => path.join(...args),
  dirname: (filePath) => path.dirname(filePath)
});
