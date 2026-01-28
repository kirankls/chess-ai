# 🔧 VISUAL STUDIO CODE SETUP GUIDE

## Complete Configuration for Chess Application Development

---

## 📋 PREREQUISITES

✅ Node.js 14+ installed ([https://nodejs.org](https://nodejs.org))
✅ Python 3.8+ installed ([https://www.python.org](https://www.python.org))
✅ Visual Studio Code installed ([https://code.visualstudio.com](https://code.visualstudio.com))
✅ All project files downloaded

---

## 🚀 QUICK SETUP (5 Minutes)

### Step 1: Open Project in VS Code

```bash
# Open the chess-ai folder
code chess-ai
# OR use File → Open Folder in VS Code
```

### Step 2: Copy Configuration Files

Copy these files to your workspace root:

```
chess-ai/
├── .vscode/
│   ├── launch.json    # Copy from: .vscode_launch.json
│   └── settings.json  # Copy from: .vscode_settings.json
```

**On Windows:**
```bash
mkdir .vscode
copy .vscode_launch.json .vscode\launch.json
copy .vscode_settings.json .vscode\settings.json
```

**On Mac/Linux:**
```bash
mkdir -p .vscode
cp .vscode_launch.json .vscode/launch.json
cp .vscode_settings.json .vscode/settings.json
```

### Step 3: Install Recommended Extensions

1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
3. Install these extensions:
   - **Python** (Microsoft)
   - **Pylance** (Microsoft)
   - **Prettier** (Esben Petersen)
   - **ESLint** (Dirk Baeumer)
   - **Code Runner** (Jun Han)

### Step 4: Verify Node.js PATH

Open VS Code Terminal (`Ctrl+` or `Cmd+``):

```bash
node --version
npm --version
python --version
```

All should show version numbers.

---

## ✅ FIX NODE.JS ERROR

If you get: **"Can't find Node.js binary 'node'"**

### Quick Fix:
1. Edit `.vscode/launch.json`
2. Find: `"runtimeExecutable": "node"`
3. Replace with your Node.js path:

**Windows:**
```json
"runtimeExecutable": "C:\\Program Files\\nodejs\\node.exe"
```

**Mac:**
```json
"runtimeExecutable": "/usr/local/bin/node"
```

**Linux:**
```json
"runtimeExecutable": "/usr/bin/node"
```

To find your path, run in terminal:

```bash
# Windows
where node

# Mac/Linux
which node
```

### Permanent Fix:
1. Uninstall Node.js completely
2. Restart computer
3. Download Node.js from https://nodejs.org (LTS)
4. Run installer
5. **Check: "Add to PATH"**
6. Restart computer
7. Close and reopen VS Code

---

## 📁 PROJECT STRUCTURE

```
chess-ai/
├── .vscode/                 # VS Code configuration
│   ├── launch.json         # Debug configurations
│   └── settings.json       # Editor settings
│
├── backend/                # Python Flask API
│   ├── venv/              # Virtual environment
│   ├── app.py             # Main Flask app
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Configuration (create from .env.example)
│
├── frontend/              # React app
│   ├── node_modules/      # NPM packages
│   ├── public/            # Static files
│   ├── src/               # Source code
│   ├── package.json       # NPM dependencies
│   └── .env               # Configuration
│
└── Other files...
```

---

## 🎮 RUNNING THE APPLICATION

### Option 1: Use VS Code Debugger (Recommended)

1. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
2. Select configuration:
   - **"Full App: Frontend + Backend"** - Start both
   - **"Frontend: Start React Dev Server"** - Start just frontend
   - **"Backend: Flask Server"** - Start just backend
3. Click green play button
4. Frontend opens at `http://localhost:3000`
5. Backend runs at `http://localhost:5000`

### Option 2: Use Integrated Terminal (Alternative)

#### Terminal 1: Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Terminal 2: Frontend
```bash
cd frontend
npm install
npm start
```

### Option 3: Use Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: "Tasks: Run Task"
3. Select task to run

---

## 🔌 DEBUGGING

### Debug Frontend (React)

1. Press `Ctrl+Shift+D`
2. Select "Frontend: Start React Dev Server"
3. Click play button
4. Set breakpoints in `.jsx` files
5. Browser opens with DevTools integrated

**Breakpoints:**
- Click line number to set breakpoint
- Execution pauses when breakpoint hits
- Inspect variables in sidebar

### Debug Backend (Python)

1. Press `Ctrl+Shift+D`
2. Select "Backend: Flask Server"
3. Click play button
4. Set breakpoints in `.py` files
5. Execution pauses when breakpoint hits

**Breakpoints:**
- Click line number to set breakpoint
- Inspect variables in Debug Console
- Use Debug Console for Python commands

### View Logs

- **Output**: View → Output
- **Debug Console**: During debugging session
- **Terminal**: View → Terminal

---

## 🛠️ INTEGRATED TERMINAL

### Open Terminal
- `Ctrl+` (backtick) or `Cmd+` on Mac
- Or: View → Terminal

### Multiple Terminals
- Click "+" icon to create new terminal
- Select different terminals from dropdown
- Each terminal runs independently

### Terminal Commands

```bash
# Run backend
cd backend && python app.py

# Run frontend
cd frontend && npm start

# Install packages
npm install              # Frontend
pip install -r requirements.txt  # Backend

# Check versions
node --version
npm --version
python --version
```

---

## 📝 FILE EDITING

### Python Files (Backend)

- **Syntax Highlighting**: Automatic
- **Formatting**: On save (using Black)
- **Linting**: Real-time (using Pylint)
- **IntelliSense**: Code completion
- **Go to Definition**: `Ctrl+Click`

### JavaScript/React Files (Frontend)

- **Syntax Highlighting**: Automatic
- **Formatting**: On save (using Prettier)
- **Linting**: Real-time (using ESLint)
- **IntelliSense**: Code completion
- **Go to Definition**: `Ctrl+Click`

---

## 🔍 SEARCH AND NAVIGATION

### Find in Files
- `Ctrl+F` - Find in current file
- `Ctrl+H` - Find and Replace
- `Ctrl+Shift+F` - Find across project

### Navigate
- `Ctrl+P` - Quick file open
- `Ctrl+G` - Go to line
- `Ctrl+Shift+O` - Go to symbol
- `Alt+Up/Down` - Jump to error/warning

### Quick Actions
- `Ctrl+.` - Quick fix/suggestions
- `Alt+Enter` - Code action menu

---

## 📦 EXTENSION RECOMMENDATIONS

### Essential
1. **Python** - Language support
2. **Pylance** - Advanced Python features
3. **Prettier** - Code formatter
4. **ESLint** - JavaScript linter

### Recommended
5. **Code Runner** - Run code snippets
6. **Thunder Bookmarks** - Bookmark files
7. **Rest Client** - Test API endpoints
8. **Thunder Bookmarks** - Organize bookmarks

### Installation
```bash
# From terminal
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

---

## 🎯 KEYBOARD SHORTCUTS

### Essential
| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+X` | Cut line |
| `Ctrl+C` | Copy line |
| `Ctrl+V` | Paste |
| `Ctrl+/` | Toggle comment |
| `Ctrl+D` | Select word |
| `Alt+Up` | Move line up |
| `Alt+Down` | Move line down |

### Debugging
| Shortcut | Action |
|----------|--------|
| `F5` | Start debugging |
| `F6` | Pause |
| `F10` | Step over |
| `F11` | Step into |
| `Shift+F11` | Step out |
| `Ctrl+K Ctrl+I` | Show hover |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Quick open file |
| `Ctrl+G` | Go to line |
| `Ctrl+Shift+O` | Go to symbol |
| `Ctrl+Home` | Go to top |
| `Ctrl+End` | Go to bottom |

---

## ⚙️ SETTINGS EXPLAINED

### Python Settings
```json
"python.pythonPath": "${workspaceFolder}/backend/venv/bin/python"
```
Points to virtual environment Python

```json
"python.linting.enabled": true
"python.linting.pylintEnabled": true
```
Enable real-time linting

```json
"python.formatting.provider": "black"
"editor.formatOnSave": true
```
Format code automatically on save

### Node.js Settings
```json
"npm.useSameTerminalForScripts": true
```
Use same terminal for npm commands

```json
"terminal.integrated.env.windows": {
  "NODE_PATH": "${workspaceFolder}/frontend/node_modules"
}
```
Set Node path for terminal

### Editor Settings
```json
"editor.tabSize": 2
"editor.insertSpaces": true
```
Use 2-space indentation

```json
"files.exclude": {
  "**/__pycache__": true,
  "**/node_modules": true
}
```
Hide unnecessary folders

---

## 🆘 TROUBLESHOOTING

### Issue: Python Extension Not Working

**Solution:**
1. Uninstall Python extension
2. Reinstall Python extension
3. VS Code will automatically detect Python
4. Reload VS Code (`Ctrl+R`)

### Issue: Prettier Not Formatting

**Solution:**
1. Install Prettier: `npm install -g prettier`
2. Set as default formatter: `Ctrl+Shift+P` → "Format: Configure Default Formatter"
3. Select "Prettier"
4. Restart VS Code

### Issue: ESLint Not Showing Errors

**Solution:**
1. Install ESLint in frontend: `npm install eslint`
2. Reload VS Code
3. Check ESLint output: View → Output → ESLint

### Issue: Breakpoints Not Working

**Solution:**
1. Make sure debugger is running (F5)
2. Breakpoints must be in the same code that's running
3. Check Debug Console for errors
4. Try `debugger;` statement in code

### Issue: Terminal Not Working

**Solution:**
1. Select correct terminal from dropdown
2. Make sure you're in correct directory
3. Try closing and opening new terminal
4. Check if terminal profile is set correctly

---

## 🚀 ADVANCED FEATURES

### Multi-Root Workspace

Create `chess-ai.code-workspace`:

```json
{
  "folders": [
    {
      "path": "backend",
      "name": "Backend"
    },
    {
      "path": "frontend",
      "name": "Frontend"
    }
  ]
}
```

Open: File → Open Workspace from File

### Task Automation

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Backend",
      "type": "shell",
      "command": "python",
      "args": ["app.py"],
      "cwd": "${workspaceFolder}/backend",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Run Frontend",
      "type": "shell",
      "command": "npm",
      "args": ["start"],
      "cwd": "${workspaceFolder}/frontend",
      "isBackground": true,
      "problemMatcher": []
    }
  ]
}
```

Run: `Ctrl+Shift+P` → "Tasks: Run Task"

### Environment Variables

`.vscode/launch.json` environment section:

```json
"env": {
  "OPENAI_API_KEY": "sk-...",
  "FLASK_ENV": "development",
  "REACT_APP_API_URL": "http://localhost:5000/api"
}
```

---

## 📊 PRODUCTIVITY TIPS

### File Navigation
- Use breadcrumbs at top of editor
- Use "Open Recent" (`Ctrl+R`)
- Pin important files (right-click tab)

### Search Efficiently
- Use regex in search (`Alt+R`)
- Use case sensitivity (`Alt+C`)
- Use whole word (`Alt+W`)

### Code Editing
- Use multiple cursors (`Ctrl+D`)
- Use column selection (`Shift+Alt+Click`)
- Use expand/shrink selection (`Shift+Alt+→/←`)

### Debugging
- Use conditional breakpoints (right-click breakpoint)
- Use logpoints (breakpoint without pausing)
- Use Debug Console to execute code

---

## 📚 LEARNING RESOURCES

- VS Code Docs: https://code.visualstudio.com/docs
- Python in VS Code: https://code.visualstudio.com/docs/python/python-tutorial
- JavaScript in VS Code: https://code.visualstudio.com/docs/nodejs/nodejs-tutorial
- Debugging: https://code.visualstudio.com/docs/editor/debugging

---

## ✅ QUICK VERIFICATION

Run this checklist:

- [ ] Node.js installed: `node --version`
- [ ] Python installed: `python --version`
- [ ] Project files downloaded
- [ ] `.vscode/launch.json` created
- [ ] `.vscode/settings.json` created
- [ ] Extensions installed
- [ ] Backend virtual environment activated
- [ ] Frontend `npm install` run
- [ ] Backend `pip install -r requirements.txt` run
- [ ] Can start debugger without errors
- [ ] Frontend opens at `http://localhost:3000`
- [ ] Backend API responds at `http://localhost:5000`

---

## 🎉 YOU'RE READY!

You're all set up to develop the Chess Application in VS Code!

**Quick Start:**
1. Press `F5` to start debugging
2. Select "Full App: Frontend + Backend"
3. Watch both services start
4. Frontend opens automatically
5. Start developing! 🚀

---

**Version**: 1.0 | **Updated**: January 2026 | **Framework**: Python + React + VS Code
