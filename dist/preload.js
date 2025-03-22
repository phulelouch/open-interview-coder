"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Send prompt to ChatGPT
    sendPrompt: (prompt) => electron_1.ipcRenderer.invoke('chatgpt-request', prompt),
    // Window management
    closeWindow: () => electron_1.ipcRenderer.send('close-window'),
    hideWindow: () => electron_1.ipcRenderer.send('hide-window'),
    showWindow: () => electron_1.ipcRenderer.send('show-window'),
    moveWindow: (direction) => electron_1.ipcRenderer.send('move-window', direction),
    // Screenshot functionality
    takeScreenshot: () => electron_1.ipcRenderer.invoke('take-screenshot'),
    analyzeScreenshots: (options) => electron_1.ipcRenderer.invoke('analyze-screenshots', options),
    // Event listeners
    onScreenshotTaken: (callback) => {
        electron_1.ipcRenderer.on('screenshot-taken', (_event, data) => callback(data));
        // Return a function to remove the listener
        return () => {
            electron_1.ipcRenderer.removeAllListeners('screenshot-taken');
        };
    },
    onProcessScreenshots: (callback) => {
        electron_1.ipcRenderer.on('process-screenshots', () => callback());
        // Return a function to remove the listener
        return () => {
            electron_1.ipcRenderer.removeAllListeners('process-screenshots');
        };
    }
});
