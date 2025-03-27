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
const screenshot_desktop_1 = __importDefault(require("screenshot-desktop"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const electronLog = __importStar(require("electron-log"));
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
// Create store with schema
const store = new Store({
    defaults: {
        windowPosition: { x: 100, y: 100 },
        windowSize: { width: 1600, height: 1200 },
        preferredLanguage: 'python'
    }
});
// Global variables
let mainWindow = null;
let screenshotQueue = [];
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
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    // Ensure window is within screen bounds
    const x = Math.min(Math.max(savedPosition.x, 0), width - savedSize.width);
    const y = Math.min(Math.max(savedPosition.y, 0), height - savedSize.height);
    mainWindow = new electron_1.BrowserWindow({
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
    // Keep track of the current ignore state
    let isIgnoringMouseEvents = true;
    // Register a new global shortcut for toggling
    electron_1.globalShortcut.register('CommandOrControl+Shift+W', () => {
        // Flip the ignore state
        isIgnoringMouseEvents = !isIgnoringMouseEvents;
        // Apply the updated ignore state to the main window
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(isIgnoringMouseEvents, { forward: true });
        }
        console.log('Toggled mouse events ignoring:', isIgnoringMouseEvents);
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
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
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
async function takeScreenshot() {
    try {
        const timestamp = new Date().getTime();
        const screenshotPath = path.join(tempDir, `screenshot-${timestamp}.png`);
        // Take screenshot
        const imgBuffer = await (0, screenshot_desktop_1.default)();
        fs.writeFileSync(screenshotPath, imgBuffer);
        log.info(`Screenshot saved to ${screenshotPath}`);
        return screenshotPath;
    }
    catch (error) {
        log.error('Failed to take screenshot:', error);
        console.error('Failed to take screenshot:', error);
        throw new Error(`Failed to take screenshot: ${error.message}`);
    }
}
// Convert image to base64
function imageToBase64(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString('base64');
    }
    catch (error) {
        log.error('Failed to convert image to base64:', error);
        console.error('Failed to convert image to base64:', error);
        throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
}
// Handle calls from the renderer to ChatGPT
electron_1.ipcMain.handle('chatgpt-request', async (_event, prompt) => {
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
    }
    catch (error) {
        log.error('Failed to fetch from OpenAI:', error);
        console.error('Failed to fetch from OpenAI:', error);
        throw new Error(`Failed to fetch from OpenAI: ${error.message}`);
    }
});
// Handle screenshot request
electron_1.ipcMain.handle('take-screenshot', async () => {
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
    }
    catch (error) {
        log.error('Error taking screenshot:', error);
        console.error('Error taking screenshot:', error);
        return { success: false, error: error.message };
    }
});
// Handle screenshot analysis request with image upload using modern OpenAI SDK
electron_1.ipcMain.handle('analyze-screenshots', async (_event, options) => {
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
        const promptText = `I'm taking a coding interview and need help with the following problem. Please analyze these screenshots and provide a solution in ${language}. First explain the problem, then provide a step-by-step solution with code examples. But make it short and condense`;
        // Prepare message content array
        const messageContent = [
            { type: 'text', text: promptText }
        ];
        // Add images to the message content
        for (const screenshotPath of screenshots) {
            try {
                // Convert image to base64
                const base64Image = imageToBase64(screenshotPath);
                // Add image content
                messageContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:image/png;base64,${base64Image}`
                    }
                });
            }
            catch (error) {
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
                    content: messageContent
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
    }
    catch (error) {
        log.error('Error analyzing screenshots:', error);
        console.error('Error analyzing screenshots:', error);
        return { success: false, error: error.message };
    }
});
// API Key and Preferences handlers
electron_1.ipcMain.handle('save-api-key', (_event, apiKey) => {
    try {
        store.set('apiKey', apiKey);
        return { success: true };
    }
    catch (error) {
        log.error('Error saving API key:', error);
        console.error('Error saving API key:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-api-key', () => {
    return store.get('apiKey') || '';
});
electron_1.ipcMain.handle('save-preferences', (_event, preferences) => {
    try {
        if (preferences.preferredLanguage) {
            store.set('preferredLanguage', preferences.preferredLanguage);
        }
        return { success: true };
    }
    catch (error) {
        log.error('Error saving preferences:', error);
        console.error('Error saving preferences:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-preferences', () => {
    return {
        preferredLanguage: store.get('preferredLanguage') || 'python'
    };
});
electron_1.ipcMain.handle('get-screenshots', () => {
    return screenshotQueue;
});
electron_1.ipcMain.handle('remove-screenshot', (_event, index) => {
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
    }
    catch (error) {
        log.error('Error removing screenshot:', error);
        console.error('Error removing screenshot:', error);
        return { success: false, error: error.message };
    }
});
// Window management handlers
electron_1.ipcMain.on('close-window', () => {
    mainWindow?.close();
});
electron_1.ipcMain.on('hide-window', () => {
    mainWindow?.hide();
});
electron_1.ipcMain.on('show-window', () => {
    mainWindow?.show();
});
electron_1.ipcMain.on('move-window', (_event, direction) => {
    if (!mainWindow)
        return;
    const position = mainWindow.getPosition();
    const step = 200; // pixels to move
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
electron_1.app.whenReady().then(() => {
    createWindow();
    log.info('Application started');
    console.log('Application started');
    console.log('CMD/Control+Shift+A for showing up');
    // Register global shortcuts
    // Toggle window visibility: Ctrl+Shift+A
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
    // Take screenshot: Ctrl+Shift+S
    electron_1.globalShortcut.register('CommandOrControl+Shift+S', async () => {
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
        }
        catch (error) {
            log.error('Error taking screenshot via shortcut:', error);
            console.error('Error taking screenshot via shortcut:', error);
        }
    });
    // Move window: Ctrl+Shift+Arrow keys
    electron_1.globalShortcut.register('CommandOrControl+Shift+Up', () => {
        electron_1.ipcMain.emit('move-window', null, 'up');
    });
    electron_1.globalShortcut.register('CommandOrControl+Shift+Down', () => {
        electron_1.ipcMain.emit('move-window', null, 'down');
    });
    electron_1.globalShortcut.register('CommandOrControl+Shift+Left', () => {
        electron_1.ipcMain.emit('move-window', null, 'left');
    });
    electron_1.globalShortcut.register('CommandOrControl+Shift+Right', () => {
        electron_1.ipcMain.emit('move-window', null, 'right');
    });
    // Scroll window: Ctrl+Arrow keys
    electron_1.globalShortcut.register('CommandOrControl+Up', () => {
        if (mainWindow) {
            mainWindow.webContents.send('scroll-content', { direction: 'up' });
        }
    });
    electron_1.globalShortcut.register('CommandOrControl+Down', () => {
        if (mainWindow) {
            mainWindow.webContents.send('scroll-content', { direction: 'down' });
        }
    });
    // Process screenshots: Ctrl+Shift+P
    electron_1.globalShortcut.register('CommandOrControl+Shift+P', () => {
        if (mainWindow) {
            mainWindow.webContents.send('process-screenshots');
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
// Clean up before quitting
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
    // Clean up temp screenshots
    try {
        for (const screenshot of screenshotQueue) {
            if (fs.existsSync(screenshot)) {
                fs.unlinkSync(screenshot);
            }
        }
    }
    catch (error) {
        log.error('Error cleaning up screenshots:', error);
        console.error('Error cleaning up screenshots:', error);
    }
});
