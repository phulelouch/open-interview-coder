import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send prompt to ChatGPT
  sendPrompt: (prompt: string) => ipcRenderer.invoke('chatgpt-request', prompt),
  
  // Window management
  closeWindow: () => ipcRenderer.send('close-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  showWindow: () => ipcRenderer.send('show-window'),
  moveWindow: (direction: 'up' | 'down' | 'left' | 'right') => 
    ipcRenderer.send('move-window', direction),
  
  // Screenshot functionality
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  analyzeScreenshots: (options: { language?: string }) => 
    ipcRenderer.invoke('analyze-screenshots', options),
  
  // Event listeners
  onScreenshotTaken: (callback: (data: any) => void) => {
    ipcRenderer.on('screenshot-taken', (_event, data) => callback(data));
    
    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeAllListeners('screenshot-taken');
    };
  },
  
  onProcessScreenshots: (callback: () => void) => {
    ipcRenderer.on('process-screenshots', () => callback());
    
    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeAllListeners('process-screenshots');
    };
  }
});
