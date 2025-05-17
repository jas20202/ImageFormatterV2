const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (data) => ipcRenderer.send('save-entry', data),
  onSaveSuccess: (callback) => ipcRenderer.on('save-success', (e, msg) => callback(msg)),
  
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:readFile', filePath),

  joinPath: (...args) => path.join(...args),
  dirname: (filePath) => path.dirname(filePath)
});
