# Open Interview Coder - Development Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Development Environment Setup](#development-environment-setup)
5. [Building and Running](#building-and-running)
6. [Architecture Overview](#architecture-overview)
7. [Key Components](#key-components)
8. [Adding Features](#adding-features)
9. [Testing](#testing)
10. [Packaging and Distribution](#packaging-and-distribution)
11. [Contributing Guidelines](#contributing-guidelines)

## Introduction

This development guide provides information for developers who want to understand, modify, or contribute to the Open Interview Coder project. The application is an invisible desktop tool designed to help with technical coding interviews by providing screenshot capture, AI-powered analysis, and solution generation.

## Project Structure

```
open-interview-coder/
├── assets/                  # Application assets
│   └── icons/               # Application icons for different platforms
├── dist/                    # Compiled JavaScript files (generated)
├── docs/                    # Documentation
│   ├── USER_GUIDE.md        # User guide
│   └── DEVELOPMENT_GUIDE.md # This development guide
├── node_modules/            # Node.js dependencies (generated)
├── src/                     # Source code
│   ├── index.html           # Main HTML file
│   ├── main.ts              # Main Electron process
│   └── preload.ts           # Preload script for renderer process
├── .env                     # Environment variables (create this file)
├── .gitignore               # Git ignore file
├── package.json             # Project metadata and dependencies
├── package-lock.json        # Locked dependencies
├── README.md                # Project overview
└── tsconfig.json            # TypeScript configuration
```

## Technology Stack

The Open Interview Coder is built using the following technologies:

- **Electron**: Cross-platform desktop application framework
- **TypeScript**: Typed superset of JavaScript
- **Node.js**: JavaScript runtime
- **HTML/CSS**: Frontend UI
- **OpenAI API**: AI-powered analysis and solution generation
- **Electron Store**: Local storage for application settings
- **Screenshot Desktop**: Screen capture functionality

## Development Environment Setup

### Prerequisites

- Node.js (v18)
- npm (included with Node.js)
- Git
- OpenAI API Key

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/open-interview-coder.git
   cd open-interview-coder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Set up your IDE:
   - We recommend Visual Studio Code with the following extensions:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features
     - Electron Debug

## Building and Running

### Development Mode

To run the application in development mode:

```bash
npm run dev
```

This will:
- Compile TypeScript files
- Start the Electron application

### Production Build

To build the application for production:

```bash
npm run build
```

This will:
- Clean the output directories
- Compile TypeScript files
- Package the application using electron-builder

### Running the Production Build

To run the production build:

```bash
npm start
```

## Architecture Overview

The Open Interview Coder follows the standard Electron architecture with two main processes:

1. **Main Process** (`main.ts`):
   - Controls the application lifecycle
   - Creates and manages browser windows
   - Handles IPC (Inter-Process Communication)
   - Manages screenshot capture and storage
   - Communicates with the OpenAI API
   - Registers global shortcuts

2. **Renderer Process** (`index.html` and associated scripts):
   - Handles the user interface
   - Sends requests to the main process via IPC
   - Displays results from the main process

Communication between these processes is facilitated by the **Preload Script** (`preload.ts`), which exposes a limited API to the renderer process using Electron's contextBridge.

## Key Components

### Main Process Components

#### Window Management
The main process creates and manages the application window, setting properties for invisibility and screen capture resistance.

```typescript
function createWindow() {
  mainWindow = new BrowserWindow({
    // Window configuration
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    // Other properties
  });

  // Enhanced screen capture resistance
  mainWindow.setContentProtection(true);
  // Other window settings
}
```

#### Screenshot Capture
The application uses the screenshot-desktop package to capture screenshots.

```typescript
async function takeScreenshot(): Promise<string> {
  try {
    const timestamp = new Date().getTime();
    const screenshotPath = path.join(tempDir, `screenshot-${timestamp}.png`);
    
    // Take screenshot
    const imgBuffer = await screenshot();
    fs.writeFileSync(screenshotPath, imgBuffer);
    
    return screenshotPath;
  } catch (error) {
    // Error handling
  }
}
```

#### OpenAI Integration
The application communicates with the OpenAI API to analyze screenshots and generate solutions.

```typescript
ipcMain.handle('chatgpt-request', async (_event: IpcMainInvokeEvent, prompt: string) => {
  // Ensure API key is loaded
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in .env');
  }

  try {
    // Make a request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      // Request configuration
    });

    // Process response
  } catch (error) {
    // Error handling
  }
});
```

#### Global Shortcuts
The application registers global keyboard shortcuts for various functions.

```typescript
app.whenReady().then(() => {
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    // Toggle window visibility
  });
  
  // Other shortcuts
});
```

### Renderer Process Components

#### User Interface
The renderer process handles the user interface, including tabs, buttons, and input fields.

#### IPC Communication
The renderer process communicates with the main process using the exposed API.

```javascript
// Send prompt to ChatGPT
sendBtn.addEventListener('click', async () => {
  const prompt = userInput.value.trim();
  if (!prompt) return;
  
  responseContainer.textContent = 'Loading...';
  try {
    const reply = await window.electronAPI.sendPrompt(prompt);
    responseContainer.textContent = reply;
  } catch (error) {
    responseContainer.textContent = `Error: ${error.message}`;
  }
});
```

### Preload Script

The preload script exposes a limited API to the renderer process using Electron's contextBridge.

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // Send prompt to ChatGPT
  sendPrompt: (prompt: string) => ipcRenderer.invoke('chatgpt-request', prompt),
  
  // Window management
  closeWindow: () => ipcRenderer.send('close-window'),
  // Other methods
  
  // Event listeners
  onScreenshotTaken: (callback: (data: any) => void) => {
    ipcRenderer.on('screenshot-taken', (_event, data) => callback(data));
    // Return cleanup function
  },
  // Other event listeners
});
```

## Adding Features

### General Guidelines

1. **Maintain Process Separation**: Keep main process logic in main.ts and renderer process logic in the appropriate HTML/JS files.
2. **Use TypeScript**: Write all new code in TypeScript to maintain type safety.
3. **Follow Existing Patterns**: Maintain consistency with the existing codebase.
4. **Document Your Code**: Add comments to explain complex logic.

### Adding a New Feature

To add a new feature to the application:

1. **Identify the Process**: Determine whether the feature belongs in the main process, renderer process, or both.
2. **Update the Main Process** (if needed):
   - Add new functionality to main.ts
   - Register new IPC handlers if needed
3. **Update the Preload Script** (if needed):
   - Expose new functionality to the renderer process
4. **Update the Renderer Process** (if needed):
   - Add new UI elements to index.html
   - Add event handlers for the new functionality
5. **Test the Feature**: Ensure it works as expected in both development and production builds.

### Example: Adding a New Shortcut

```typescript
// In main.ts
globalShortcut.register('CommandOrControl+Shift+R', () => {
  // New shortcut functionality
});

// In preload.ts (if needed)
contextBridge.exposeInMainWorld('electronAPI', {
  // Existing methods
  newFunction: () => ipcRenderer.invoke('new-function'),
});

// In renderer process (if needed)
document.getElementById('newButton').addEventListener('click', () => {
  window.electronAPI.newFunction();
});
```

## Testing

### Manual Testing

The application does not currently have automated tests. Manual testing should focus on:

1. **Functionality Testing**: Ensure all features work as expected.
2. **Invisibility Testing**: Verify the application remains invisible in screen sharing applications.
3. **Performance Testing**: Check for any performance issues, especially with screenshot capture and AI analysis.
4. **Cross-Platform Testing**: Test on different operating systems (Windows, macOS, Linux).

### Testing Checklist

- [ ] Application starts correctly
- [ ] Window visibility toggle works
- [ ] Screenshot capture works
- [ ] AI analysis works
- [ ] Window movement shortcuts work
- [ ] UI elements function correctly
- [ ] Application remains invisible in screen sharing
- [ ] Application works on all target platforms

## Packaging and Distribution

### Building for Distribution

The application uses electron-builder for packaging. The configuration is in package.json:

```json
"build": {
  "appId": "com.openinterviewcoder.app",
  "productName": "Open Interview Coder",
  "files": [
    "dist/**/*",
    "package.json"
  ],
  "directories": {
    "output": "release"
  },
  "mac": {
    // Mac-specific configuration
  },
  "win": {
    // Windows-specific configuration
  },
  "linux": {
    // Linux-specific configuration
  }
}
```

To build for all platforms:

```bash
npm run build
```

This will create distribution packages in the `release` directory.

### Platform-Specific Considerations

#### macOS
- Ensure the application has proper entitlements for screen recording
- Consider notarization for distribution outside the App Store

#### Windows
- No special considerations required

#### Linux
- May require additional dependencies depending on the distribution
- Consider packaging as AppImage, deb, or rpm

## Contributing Guidelines

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request with a clear description of the changes

### Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add new feature X
fix: Fix bug in feature Y
docs: Update documentation for feature Z
refactor: Refactor feature W
```

### Code Review

All pull requests will be reviewed for:
- Code quality
- Adherence to the project's architecture
- Potential security issues
- Performance implications
- Documentation

## Conclusion

This development guide provides an overview of the Open Interview Coder project structure, architecture, and development processes. By following these guidelines, you can contribute to the project effectively and maintain its quality and consistency.

For any questions or issues not covered in this guide, please open an issue on the project's GitHub repository.
