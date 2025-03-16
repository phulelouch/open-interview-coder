"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const dotenv = __importStar(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch")); // CommonJS-compatible node-fetch v2
// Load .env contents into process.env
dotenv.config();
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Window is initially closed (hidden)
        // Enable transparent window
        transparent: true,
        backgroundColor: '#00000000',
        frame: false,
        titleBarStyle: 'customButtonsOnHover', // Allows custom buttons at the top
        // WebPreferences
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });
    //
    // Enhanced screen capture resistance
    //
    mainWindow.setContentProtection(true);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    if (process.platform === 'darwin') {
        mainWindow.setHiddenInMissionControl(true);
        mainWindow.setWindowButtonVisibility(false);
        mainWindow.setSkipTaskbar(true);
        mainWindow.setHasShadow(false);
    }
    mainWindow.webContents.setBackgroundThrottling(false);
    mainWindow.webContents.setFrameRate(60);
    // Load index.html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Cleanup when closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Handle calls from the renderer to ChatGPT
electron_1.ipcMain.handle('chatgpt-request', async (_event, prompt) => {
    // Ensure API key is loaded
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing OPENAI_API_KEY in .env');
    }
    try {
        // Make a request to OpenAI
        const response = await (0, node_fetch_1.default)('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI API returned error: ${response.statusText}`);
        }
        // Extract the response
        const data = await response.json();
        const assistantReply = data?.choices?.[0]?.message?.content || '';
        return assistantReply;
    }
    catch (error) {
        throw new Error(`Failed to fetch from OpenAI: ${error.message}`);
    }
});
electron_1.ipcMain.on('close-window', () => {
    mainWindow?.close();
});
electron_1.ipcMain.on('hide-window', () => {
    mainWindow?.hide();
});
electron_1.app.whenReady().then(() => {
    createWindow();
    console.log("Cmd/Ctrl+Shift+A pressed: toggling window visibility");
    // Register global shortcut for CommandOrControl+Shift+A to toggle window visibility
    electron_1.globalShortcut.register('CommandOrControl+Shift+A', () => {
        if (!mainWindow) {
            createWindow();
        }
        else if (mainWindow.isVisible()) {
            mainWindow.hide();
        }
        else {
            mainWindow.show();
        }
    });
    // On macOS, re-create a window when clicking the dock icon if none open
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed, except on macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
