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
// Use CommonJS require for OpenAI with Node 18
const { OpenAI } = require('openai');

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
  apiKey?: string;
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
    console.error('Failed to take screenshot:', error);
    throw new Error(`Failed to take screenshot: ${(error as Error).message}`);
  }
}

// Convert image to base64
function imageToBase64(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    log.error('Failed to convert image to base64:', error);
    console.error('Failed to convert image to base64:', error);
    throw new Error(`Failed to convert image to base64: ${(error as Error).message}`);
  }
}

// Handle calls from the renderer to ChatGPT
ipcMain.handle('chatgpt-request', async (_event: IpcMainInvokeEvent, prompt: string) => {
  // Get API key from store
  const apiKey = store.get('apiKey');
  
  if (!apiKey) {
    const errorMsg = 'Missing OpenAI API Key. Please add your API key in the Settings tab.';
    log.error(errorMsg);
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    log.info('Sending request to OpenAI API');
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Make a request to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: prompt }]
    });

    // Extract the response
    const assistantReply = completion.choices[0].message.content || '';
    log.info('Received response from OpenAI API');
    return assistantReply;
  } catch (error) {
    log.error('Failed to fetch from OpenAI:', error);
    console.error('Failed to fetch from OpenAI:', error);
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
    console.error('Error taking screenshot:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Define the type for message content
type MessageContent = string | Array<{
  type: string;
  text?: string;
  image_url?: { url: string };
}>;

// Handle screenshot analysis request with image upload using modern OpenAI SDK
ipcMain.handle('analyze-screenshots', async (_event: IpcMainInvokeEvent, options: { language?: string }) => {
  if (screenshotQueue.length === 0) {
    const errorMsg = 'No screenshots available to analyze';
    log.error(errorMsg);
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    // Get API key from store
    const apiKey = store.get('apiKey');
    
    if (!apiKey) {
      const errorMsg = 'Missing OpenAI API Key. Please add your API key in the Settings tab.';
      log.error(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Prepare screenshots for analysis
    const screenshots = [...screenshotQueue];
    const language = options.language || store.get('preferredLanguage') || 'python';
    
    // Build prompt for OpenAI
    const promptText = `I'm taking a coding interview and need help with the following problem. Please analyze these screenshots and provide a solution in ${language}. First explain the problem, then provide a step-by-step solution with code examples.`;
    
    // Prepare message content array
    const messageContent: MessageContent = [
      { type: 'text', text: promptText }
    ];
    
    // Add images to the message content
    for (const screenshotPath of screenshots) {
      try {
        // Convert image to base64
        const base64Image = imageToBase64(screenshotPath);
        
        // Add image content
        (messageContent as Array<any>).push({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${base64Image}`
          }
        });
      } catch (error) {
        log.error(`Error processing image ${screenshotPath}:`, error);
        console.error(`Error processing image ${screenshotPath}:`, error);
      }
    }
    
    log.info('Sending request to OpenAI API with images');
    console.log('Sending request to OpenAI API with images');
    
    // Make a request to OpenAI with images using the SDK
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: messageContent as any
      }],
      max_tokens: 2000
    });

    // Extract the response
    const analysis = completion.choices[0].message.content || 'Analysis completed, but no specific solution was generated.';
    
    log.info('Received analysis from OpenAI API');
    console.log('Received analysis from OpenAI API');
    
    return { 
      success: true, 
      analysis: analysis,
      screenshots: screenshots
    };
  } catch (error) {
    log.error('Error analyzing screenshots:', error);
    console.error('Error analyzing screenshots:', error);
    return { success: false, error: (error as Error).message };
  }
});

// API Key and Preferences handlers
ipcMain.handle('save-api-key', (_event: IpcMainInvokeEvent, apiKey: string) => {
  try {
    store.set('apiKey', apiKey);
    return { success: true };
  } catch (error) {
    log.error('Error saving API key:', error);
    console.error('Error saving API key:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-api-key', () => {
  return store.get('apiKey') || '';
});

ipcMain.handle('save-preferences', (_event: IpcMainInvokeEvent, preferences: { preferredLanguage: string }) => {
  try {
    if (preferences.preferredLanguage) {
      store.set('preferredLanguage', preferences.preferredLanguage);
    }
    return { success: true };
  } catch (error) {
    log.error('Error saving preferences:', error);
    console.error('Error saving preferences:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-preferences', () => {
  return {
    preferredLanguage: store.get('preferredLanguage') || 'python'
  };
});

ipcMain.handle('get-screenshots', () => {
  return screenshotQueue;
});

ipcMain.handle('remove-screenshot', (_event: IpcMainInvokeEvent, index: number) => {
  try {
    if (index >= 0 && index < screenshotQueue.length) {
      const screenshotPath = screenshotQueue[index];
      screenshotQueue.splice(index, 1);
      
      if (fs.existsSync(screenshotPath)) {
        fs.unlinkSync(screenshotPath);
      }
      
      return { success: true };
    }
    return { success: false, error: 'Invalid screenshot index' };
  } catch (error) {
    log.error('Error removing screenshot:', error);
    console.error('Error removing screenshot:', error);
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
  console.log('Application started');

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
      console.error('Error taking screenshot via shortcut:', error);
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
    console.error('Error cleaning up screenshots:', error);
  }
});
