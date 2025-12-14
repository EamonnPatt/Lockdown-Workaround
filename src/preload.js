// preload.js - Preload Script

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message, apiKey, provider) => ipcRenderer.invoke('send-message', message, apiKey, provider)
});