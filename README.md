# Open Interview Coder - Improved Version

### For Windows, please use https://github.com/phulelouch/open-interview-coder/tree/window-version 



https://github.com/user-attachments/assets/23365245-2f4b-4f9a-af44-5358402b0546





## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Features](#features)
5. [User Interface](#user-interface)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Taking Screenshots](#taking-screenshots)
8. [Analyzing Code Problems](#analyzing-code-problems)
9. [Window Management](#window-management)
10. [Troubleshooting](#troubleshooting)

### Introduction:
You know about the Interview Coder guy who made invisible AI window? 🫠🫠🫠 I don't like the fact that he taking advantage of poor job market and rip off poor students 😐😐. I rather make a fair game for everyone. I reverse engineering it and his whole thing was based on one functionality: `setContentProtection` from electron https://www.electronjs.org/docs/latest/api/browser-window
This project is an improved version of the Open Interview Coder, an invisible desktop application that helps with technical interviews. It provides features like screenshot capture, AI-powered analysis, and solution generation without requiring login or authentication.

Open Interview Coder is an opensource invisible desktop application designed to help you succeed in technical coding interviews. It provides a discreet way to capture, analyze, and solve coding problems during interviews without being detected by most screen sharing and recording software.

The application works by creating an invisible window that can be toggled on and off with keyboard shortcuts. When visible, you can take screenshots of coding problems, get AI-powered analysis and solutions, and manage the application window.

## Installation

### Prerequisites
- Node.js (v18.19.0 or higher)
- OpenAI API Key

### Installation Steps

1. Download the latest release from the GitHub repository or clone the repository:
   ```bash
   git clone https://github.com/yourusername/open-interview-coder.git
   cd open-interview-coder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```
5. Apply your OpenAI API key in settings

## Getting Started

1. After starting the application, the window will be invisible by default.
2. Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on macOS) to toggle the window visibility.
3. When the window appears, you'll see the main interface with tabs for Prompt, Screenshots, and Shortcuts.
4. You can now use the application to take screenshots, analyze coding problems, and get solutions.

## Features

## Features

- 🎯 Invisibility: Undetectable window that bypasses most screen capture methods
- 📸 Screenshot Capture: Capture screenshots of coding problems with a simple keyboard shortcut.
- 🤖 AI-Powered Analysis: Automatically analyzes coding problems
- 💡 Solution Generation: Get detailed explanations and solutions
- 🔧 Real-time Debugging: Debug your code with AI assistance (GPT for now)
- 🎨 Window Management: Freely move and position the window anywhere on screen


## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+Shift+A | Toggle window visibility |
| Ctrl/Cmd+Shift+S | Take screenshot |
| Ctrl/Cmd+Shift+P | Process screenshots |
| Ctrl/Cmd+Shift+↑ | Move window up |
| Ctrl/Cmd+Shift+↓ | Move window down |
| Ctrl/Cmd+Shift+← | Move window left |
| Ctrl/Cmd+Shift+→ | Move window right |

## Taking Screenshots

There are two ways to take screenshots:

1. **Using keyboard shortcut**:
   - Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on macOS) to capture a screenshot
   - The screenshot will be automatically added to the queue

2. **Using the UI**:
   - Navigate to the Screenshots tab
   - Click the "Take Screenshot" button
   - The screenshot will be added to the list below

The application stores up to 5 recent screenshots. When you exceed this limit, the oldest screenshot will be automatically removed.

## Analyzing Code Problems

To analyze coding problems from your screenshots:

1. Take one or more screenshots of the problem
2. Process the screenshots using one of these methods:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Click the "Process Screenshots" button in the Screenshots tab

3. The AI will analyze the screenshots and generate a solution
4. The solution will be displayed in the Prompt tab, including:
   - Problem explanation
   - Solution approach
   - Code implementation
   - Explanation of the code

You can also enter custom prompts in the Prompt tab for specific questions about the problem.

## Window Management

### Moving the Window
You can move the window using keyboard shortcuts:
- `Ctrl+Shift+↑` (or `Cmd+Shift+↑` on macOS): Move window up
- `Ctrl+Shift+↓` (or `Cmd+Shift+↓` on macOS): Move window down
- `Ctrl+Shift+←` (or `Cmd+Shift+←` on macOS): Move window left
- `Ctrl+Shift+→` (or `Cmd+Shift+→` on macOS): Move window right

### Hiding the Window
To hide the window:
- Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on macOS)
- Click the minimize button in the top-right corner

### Showing the Window
To show the window after it's been hidden:
- Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on macOS)

## Troubleshooting

### Application Not Starting
- Ensure Node.js is installed and is version 18.19.0 
- Check that all dependencies are installed with `npm install`

### Screenshots Not Working
- Ensure the application has screen recording permissions
- On macOS: System Preferences > Security & Privacy > Privacy > Screen Recording
- On Windows: No special permissions needed
- On Linux: May require `xhost` access depending on your distribution

### OpenAI API Errors
- Check your internet connection
- Ensure your OpenAI account has available credits

### Window Not Invisible in Screen Sharing
- Some newer versions of screen sharing software may detect the window
- Try positioning the window in a less noticeable area of the screen
- Use the keyboard shortcuts to hide the window when not in use

