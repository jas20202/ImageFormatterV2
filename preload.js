const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (data) => ipcRenderer.invoke('save-entry', data),
  onSaveSuccess: (callback) => ipcRenderer.on('save-success', (e, msg) => callback(msg)),
  
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:readFile', filePath),

  readCSV: (filePath) => ipcRenderer.invoke('file:readCSV', filePath),
  writeCSV: (filePath, data) => ipcRenderer.invoke('file:writeCSV', filePath, data),

  joinPath: (...args) => path.join(...args),
  dirname: (filePath) => path.dirname(filePath),

  refreshCheckboxes: () => ipcRenderer.on('refresh-checkboxes'),
});
