import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, globalShortcut } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch'; // CommonJS-compatible node-fetch v2

// Load .env contents into process.env
dotenv.config();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
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
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Cleanup when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle calls from the renderer to ChatGPT
ipcMain.handle('chatgpt-request', async (_event: IpcMainInvokeEvent, prompt: string) => {
  // Ensure API key is loaded
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in .env');
  }

  try {
    // Make a request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    const data: any = await response.json();
    const assistantReply = data?.choices?.[0]?.message?.content || '';
    return assistantReply;
  } catch (error) {
    throw new Error(`Failed to fetch from OpenAI: ${(error as Error).message}`);
  }
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
});

ipcMain.on('hide-window', () => {
  mainWindow?.hide();
});

app.whenReady().then(() => {
  createWindow();
  console.log("Cmd/Ctrl+Shift+A pressed: toggling window visibility");

  // Register global shortcut for CommandOrControl+Shift+A to toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (!mainWindow) {
      createWindow();
    } else if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // On macOS, re-create a window when clicking the dock icon if none open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});