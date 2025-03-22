# Open Interview Coder - Additional Documentation

## Table of Contents
1. [Installation Guide](#installation-guide)
2. [API Documentation](#api-documentation)
3. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Changelog](#changelog)
6. [License Information](#license-information)

## Installation Guide

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+ recommended)
- **Processor**: 1.6 GHz or faster, dual-core
- **Memory**: 4 GB RAM minimum, 8 GB recommended
- **Disk Space**: 200 MB available space
- **Internet Connection**: Required for AI functionality
- **Node.js**: Version 20.19.0 or higher

### Installation Steps by Platform

#### Windows
1. Download the latest Windows installer (.exe) from the releases page
2. Run the installer and follow the on-screen instructions
3. Create a `.env` file in the installation directory with your OpenAI API key
4. Launch the application from the Start menu or desktop shortcut

#### macOS
1. Download the latest macOS disk image (.dmg) from the releases page
2. Open the disk image and drag the application to your Applications folder
3. Create a `.env` file in the application contents folder with your OpenAI API key
4. Launch the application from the Applications folder or Dock

#### Linux
1. Download the latest AppImage from the releases page
2. Make the AppImage executable: `chmod +x OpenInterviewCoder-*.AppImage`
3. Create a `.env` file in the same directory as the AppImage with your OpenAI API key
4. Run the AppImage: `./OpenInterviewCoder-*.AppImage`

### From Source
1. Clone the repository: `git clone https://github.com/yourusername/open-interview-coder.git`
2. Navigate to the project directory: `cd open-interview-coder`
3. Install dependencies: `npm install`
4. Create a `.env` file with your OpenAI API key
5. Build the application: `npm run build`
6. Start the application: `npm start`

## API Documentation

The Open Interview Coder exposes several APIs through the Electron IPC system. These APIs are primarily for internal use but can be useful for developers extending the application.

### Main Process APIs

#### Screenshot Management

```typescript
// Take a screenshot
ipcMain.handle('take-screenshot', async () => {
  // Returns: { success: boolean, path?: string, error?: string }
});

// Analyze screenshots
ipcMain.handle('analyze-screenshots', async (_event, options: { language?: string }) => {
  // Returns: { success: boolean, analysis?: string, screenshots?: string[], error?: string }
});
```

#### OpenAI Integration

```typescript
// Send a prompt to OpenAI
ipcMain.handle('chatgpt-request', async (_event, prompt: string) => {
  // Returns: string (the AI response)
});
```

#### Window Management

```typescript
// Close the window
ipcMain.on('close-window', () => {});

// Hide the window
ipcMain.on('hide-window', () => {});

// Show the window
ipcMain.on('show-window', () => {});

// Move the window
ipcMain.on('move-window', (_event, direction: 'up' | 'down' | 'left' | 'right') => {});
```

### Renderer Process APIs

The following APIs are exposed to the renderer process through the preload script:

```typescript
window.electronAPI = {
  // Send prompt to ChatGPT
  sendPrompt: (prompt: string) => Promise<string>,
  
  // Window management
  closeWindow: () => void,
  hideWindow: () => void,
  showWindow: () => void,
  moveWindow: (direction: 'up' | 'down' | 'left' | 'right') => void,
  
  // Screenshot functionality
  takeScreenshot: () => Promise<{ success: boolean, path?: string, error?: string }>,
  analyzeScreenshots: (options: { language?: string }) => Promise<{ success: boolean, analysis?: string, screenshots?: string[], error?: string }>,
  
  // Event listeners
  onScreenshotTaken: (callback: (data: any) => void) => Function,
  onProcessScreenshots: (callback: () => void) => Function
}
```

## Keyboard Shortcuts Reference

| Shortcut | Platform | Action |
|----------|----------|--------|
| Ctrl+Shift+A | Windows/Linux | Toggle window visibility |
| Cmd+Shift+A | macOS | Toggle window visibility |
| Ctrl+Shift+S | Windows/Linux | Take screenshot |
| Cmd+Shift+S | macOS | Take screenshot |
| Ctrl+Shift+P | Windows/Linux | Process screenshots |
| Cmd+Shift+P | macOS | Process screenshots |
| Ctrl+Shift+↑ | Windows/Linux | Move window up |
| Cmd+Shift+↑ | macOS | Move window up |
| Ctrl+Shift+↓ | Windows/Linux | Move window down |
| Cmd+Shift+↓ | macOS | Move window down |
| Ctrl+Shift+← | Windows/Linux | Move window left |
| Cmd+Shift+← | macOS | Move window left |
| Ctrl+Shift+→ | Windows/Linux | Move window right |
| Cmd+Shift+→ | macOS | Move window right |

## Troubleshooting Guide

### Common Issues and Solutions

#### Application Won't Start

**Symptoms**: Application fails to launch or crashes immediately after launch.

**Possible Causes and Solutions**:
1. **Missing Node.js**: Ensure Node.js v20.19.0 or higher is installed.
2. **Missing Dependencies**: Run `npm install` to ensure all dependencies are installed.
3. **Corrupted Installation**: Try reinstalling the application.
4. **Port Conflict**: Check if another application is using the same port.

#### Screenshots Not Working

**Symptoms**: Unable to take screenshots or screenshots are blank.

**Possible Causes and Solutions**:
1. **Missing Permissions**: Ensure the application has screen recording permissions.
   - macOS: System Preferences > Security & Privacy > Privacy > Screen Recording
   - Windows: No special permissions needed
   - Linux: May require `xhost` access
2. **Graphics Driver Issues**: Update your graphics drivers.
3. **Multiple Displays**: Try taking screenshots on the primary display.

#### OpenAI API Errors

**Symptoms**: AI analysis fails or returns errors.

**Possible Causes and Solutions**:
1. **Missing API Key**: Ensure your OpenAI API key is correctly set in the `.env` file.
2. **API Key Format**: Check that the API key is in the correct format.
3. **API Quota**: Verify that your OpenAI account has available credits.
4. **Network Issues**: Check your internet connection.

#### Window Not Invisible

**Symptoms**: The application window is visible in screen sharing software.

**Possible Causes and Solutions**:
1. **Incompatible Software**: Some newer versions of screen sharing software can detect the window.
2. **Window Position**: Try positioning the window in a less noticeable area.
3. **Alternative Method**: Use the keyboard shortcut to hide the window when not in use.

### Logging

The application uses electron-log for logging. Logs are stored in:
- **Windows**: `%USERPROFILE%\AppData\Roaming\open-interview-coder\logs\`
- **macOS**: `~/Library/Logs/open-interview-coder/`
- **Linux**: `~/.config/open-interview-coder/logs/`

These logs can be helpful for diagnosing issues.

## Changelog

### Version 1.0.0 (Current)
- Initial release of the improved Open Interview Coder
- Added screenshot capture functionality
- Added AI-powered analysis of screenshots
- Implemented window management features
- Added global keyboard shortcuts
- Created modern, tabbed UI interface
- Removed login/logout functionality
- Enhanced error handling and logging

### Version 0.1.0 (Original)
- Basic invisible window functionality
- Simple ChatGPT integration
- Minimal UI

## License Information

### Open Interview Coder License (MIT)

```
MIT License

Copyright (c) 2025 Open Interview Coder Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Third-Party Licenses

The Open Interview Coder uses several third-party libraries, each with its own license:

- **Electron**: MIT License
- **TypeScript**: Apache License 2.0
- **Node.js**: MIT License
- **electron-store**: MIT License
- **screenshot-desktop**: MIT License
- **electron-log**: MIT License
- **dotenv**: BSD 2-Clause License
- **node-fetch**: MIT License

Full license texts for these dependencies can be found in the `node_modules` directory of the project.
