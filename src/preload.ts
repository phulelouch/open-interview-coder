import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendPrompt: (prompt: string) => ipcRenderer.invoke('chatgpt-request', prompt)
});