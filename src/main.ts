import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, globalShortcut, screen } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import screenshot from 'screenshot-desktop';
import * as fs from 'fs';
import * as os from 'os';
import * as electronLog from 'electron-log';
// Use CommonJS require for electron-store with Node 18
const Store = require('electron-store');

// Configure logging
electronLog.initialize();
electronLog.transports.file.level = 'info';
const log = electronLog;

// Load environment variables
dotenv.config();

// Initialize store for settings
// Define schema type for TypeScript
interface StoreSchema {
  windowPosition: { x: number, y: number };
  windowSize: { width: number, height: number };
  preferredLanguage: string;
}

// Create store with schema
const store = new Store({
  defaults: {
    windowPosition: { x: 100, y: 100 },
    windowSize: { width: 800, height: 600 },
    preferredLanguage: 'python'
  }
});

// Global variables
let mainWindow: BrowserWindow | null = null;
let screenshotQueue: string[] = [];
const tempDir = path.join(os.tmpdir(), 'open-interview-coder');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

function createWindow() {
  // Get saved position and size or use defaults
  const savedPosition = store.get('windowPosition');
  const savedSize = store.get('windowSize');
  
  // Get screen dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Ensure window is within screen bounds
  const x = Math.min(Math.max(savedPosition.x, 0), width - savedSize.width);
  const y = Math.min(Math.max(savedPosition.y, 0), height - savedSize.height);

  mainWindow = new BrowserWindow({
    width: savedSize.width,
    height: savedSize.height,
    x: x,
    y: y,
    show: false, // Window is initially hidden

    // Enable transparent window
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    titleBarStyle: 'customButtonsOnHover',

    // WebPreferences
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Enhanced screen capture resistance
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

  // Save window position when moved
  mainWindow.on('moved', () => {
    if (mainWindow) {
      const position = mainWindow.getPosition();
      store.set('windowPosition', { x: position[0], y: position[1] });
    }
  });

  // Save window size when resized
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const size = mainWindow.getSize();
      store.set('windowSize', { width: size[0], height: size[1] });
    }
  });

  // Cleanup when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Take a screenshot and save it to temp directory
async function takeScreenshot(): Promise<string> {
  try {
    const timestamp = new Date().getTime();
    const screenshotPath = path.join(tempDir, `screenshot-${timestamp}.png`);
    
    // Take screenshot
    const imgBuffer = await screenshot();
    fs.writeFileSync(screenshotPath, imgBuffer);
    
    log.info(`Screenshot saved to ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log.error('Failed to take screenshot:', error);
    throw new Error(`Failed to take screenshot: ${(error as Error).message}`);
  }
}

// Handle calls from the renderer to ChatGPT
ipcMain.handle('chatgpt-request', async (_event: IpcMainInvokeEvent, prompt: string) => {
  // Ensure API key is loaded
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in .env');
  }

  try {
    log.info('Sending request to OpenAI API');
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
    log.info('Received response from OpenAI API');
    return assistantReply;
  } catch (error) {
    log.error('Failed to fetch from OpenAI:', error);
    throw new Error(`Failed to fetch from OpenAI: ${(error as Error).message}`);
  }
});

// Handle screenshot request
ipcMain.handle('take-screenshot', async () => {
  try {
    const screenshotPath = await takeScreenshot();
    screenshotQueue.push(screenshotPath);
    
    // Keep only the last 5 screenshots
    if (screenshotQueue.length > 5) {
      const oldScreenshot = screenshotQueue.shift();
      if (oldScreenshot && fs.existsSync(oldScreenshot)) {
        fs.unlinkSync(oldScreenshot);
      }
    }
    
    return { success: true, path: screenshotPath };
  } catch (error) {
    log.error('Error taking screenshot:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Handle screenshot analysis request
ipcMain.handle('analyze-screenshots', async (_event: IpcMainInvokeEvent, options: { language?: string }) => {
  if (screenshotQueue.length === 0) {
    return { success: false, error: 'No screenshots available to analyze' };
  }

  try {
    // Prepare screenshots for analysis
    const screenshots = [...screenshotQueue];
    const language = options.language || store.get('preferredLanguage') || 'python';
    
    // Build prompt for OpenAI
    let prompt = `I'm taking a coding interview and need help with the following problem. `;
    prompt += `Please analyze these screenshots and provide a solution in ${language}. `;
    prompt += `First explain the problem, then provide a step-by-step solution with code examples.`;
    
    // We would normally encode the images here, but for simplicity we'll just mention them
    prompt += `\n\nI've taken ${screenshots.length} screenshots of the problem.`;
    
    // Send to OpenAI
    const analysis = await ipcMain.emit('chatgpt-request', _event, prompt);
    
    return { 
      success: true, 
      analysis: analysis || 'Analysis completed, but no specific solution was generated.',
      screenshots: screenshots
    };
  } catch (error) {
    log.error('Error analyzing screenshots:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Window management handlers
ipcMain.on('close-window', () => {
  mainWindow?.close();
});

ipcMain.on('hide-window', () => {
  mainWindow?.hide();
});

ipcMain.on('show-window', () => {
  mainWindow?.show();
});

ipcMain.on('move-window', (_event, direction) => {
  if (!mainWindow) return;
  
  const position = mainWindow.getPosition();
  const step = 10; // pixels to move
  
  let newX = position[0];
  let newY = position[1];
  
  switch (direction) {
    case 'up':
      newY -= step;
      break;
    case 'down':
      newY += step;
      break;
    case 'left':
      newX -= step;
      break;
    case 'right':
      newX += step;
      break;
  }
  
  mainWindow.setPosition(newX, newY);
});

// Application initialization
app.whenReady().then(() => {
  createWindow();
  log.info('Application started');

  // Register global shortcuts
  
  // Toggle window visibility: Ctrl+Shift+A
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (!mainWindow) {
      createWindow();
    } else if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
  
  // Take screenshot: Ctrl+Shift+S
  globalShortcut.register('CommandOrControl+Shift+S', async () => {
    try {
      const screenshotPath = await takeScreenshot();
      screenshotQueue.push(screenshotPath);
      
      // Keep only the last 5 screenshots
      if (screenshotQueue.length > 5) {
        const oldScreenshot = screenshotQueue.shift();
        if (oldScreenshot && fs.existsSync(oldScreenshot)) {
          fs.unlinkSync(oldScreenshot);
        }
      }
      
      // Notify renderer
      if (mainWindow) {
        mainWindow.webContents.send('screenshot-taken', { path: screenshotPath });
      }
    } catch (error) {
      log.error('Error taking screenshot via shortcut:', error);
    }
  });
  
  // Move window: Ctrl+Shift+Arrow keys
  globalShortcut.register('CommandOrControl+Shift+Up', () => {
    ipcMain.emit('move-window', null, 'up');
  });
  
  globalShortcut.register('CommandOrControl+Shift+Down', () => {
    ipcMain.emit('move-window', null, 'down');
  });
  
  globalShortcut.register('CommandOrControl+Shift+Left', () => {
    ipcMain.emit('move-window', null, 'left');
  });
  
  globalShortcut.register('CommandOrControl+Shift+Right', () => {
    ipcMain.emit('move-window', null, 'right');
  });
  
  // Process screenshots: Ctrl+Shift+P
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow) {
      mainWindow.webContents.send('process-screenshots');
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

// Clean up before quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  
  // Clean up temp screenshots
  try {
    for (const screenshot of screenshotQueue) {
      if (fs.existsSync(screenshot)) {
        fs.unlinkSync(screenshot);
      }
    }
  } catch (error) {
    log.error('Error cleaning up screenshots:', error);
  }
});
