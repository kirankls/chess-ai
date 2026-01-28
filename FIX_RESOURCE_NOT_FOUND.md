# 🔧 FIX: "Resource not found" Error

## Error You're Getting
```json
{
  "error": "Resource not found"
}
```

## 🎯 What This Means

The browser is reaching **the backend API** instead of the **frontend React app**. You're likely visiting the wrong URL or the frontend isn't deployed.

---

## ✅ QUICK DIAGNOSIS

### Check These 3 Things:

1. **Are you visiting the correct URL?**
   - ❌ Wrong: `http://localhost:5000` (this is the backend API)
   - ❌ Wrong: `http://localhost:5000/api/health` (API endpoint)
   - ✅ Right: `http://localhost:3000` (frontend React app)

2. **Is the frontend running?**
   - Run: `cd frontend && npm start`
   - Should see: Browser opens to `http://localhost:3000`

3. **Is the backend running?**
   - Run: `cd backend && python app.py`
   - Should see: `Running on http://0.0.0.0:5000`

---

## 🚀 QUICK FIX (3 Steps)

### Step 1: Make Sure Backend is Running

```bash
cd backend
python app.py
```

You should see:
```
* Running on http://0.0.0.0:5000
* Debug mode: on
```

### Step 2: Make Sure Frontend is Running

```bash
cd frontend
npm start
```

Browser should automatically open `http://localhost:3000`

### Step 3: Visit Correct URL

✅ **Correct URLs:**
- `http://localhost:3000` - Frontend (main app)
- `http://localhost:5000/api/health` - Backend health check
- `http://localhost:5000/api/chess/ai-move` - API endpoints

❌ **Wrong URLs that cause error:**
- `http://localhost:5000` - Just backend (causes "Resource not found")
- `http://localhost:5000/` - Also wrong
- `http://0.0.0.0:5000` - Can't use 0.0.0.0 in browser

---

## 📋 COMPLETE TROUBLESHOOTING

### Problem 1: Frontend Not Running

**Symptoms:**
- `http://localhost:3000` gives "Connection refused"
- No browser tab opens automatically

**Solution:**
```bash
cd frontend
npm install  # Install packages if needed
npm start
```

Should see:
```
Compiled successfully!
You can now view chess-app in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Problem 2: Backend Not Running

**Symptoms:**
- Frontend shows error connecting to API
- Console errors about `http://localhost:5000`

**Solution:**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your OpenAI API key
# Edit .env and add: OPENAI_API_KEY=sk-...

# Run
python app.py
```

Should see:
```
* Running on http://0.0.0.0:5000
* Press CTRL+C to quit
```

### Problem 3: Wrong Port Numbers

**If you see:**
```
Address already in use
```

**The port is taken. Solution:**

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000

# Kill the process
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>

# Then try again
python app.py
```

### Problem 4: Node Modules Not Installed

**Symptoms:**
- `npm start` fails
- Says "command not found"

**Solution:**
```bash
cd frontend
npm install
npm start
```

### Problem 5: Python Packages Not Installed

**Symptoms:**
- `python app.py` fails
- Says "ModuleNotFoundError"

**Solution:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

## 🔍 VERIFY EVERYTHING WORKS

### Test 1: Frontend Loads

```bash
# In browser, visit:
http://localhost:3000
```

Should see:
- ✅ Chess board with pieces
- ✅ Login/Register screen
- ✅ Menu with game options

### Test 2: API Responds

```bash
# In terminal
curl http://localhost:5000/api/health
```

Should return:
```json
{"status": "healthy", "timestamp": "..."}
```

### Test 3: API Endpoints Work

```bash
# Get legal moves
curl -X POST http://localhost:5000/api/chess/get-legal-moves \
  -H "Content-Type: application/json" \
  -d '{"board": [[null]], "row": 0, "col": 0}'
```

Should return a response (not error).

---

## 🐛 SPECIFIC ERROR SCENARIOS

### Scenario 1: "Resource not found" from Browser

```
URL: http://localhost:5000
Response: {"error": "Resource not found"}
```

**Problem**: Visiting backend instead of frontend
**Fix**: Go to `http://localhost:3000`

### Scenario 2: "Cannot GET /api"

```
URL: http://localhost:5000/api
Response: Cannot GET /api
```

**Problem**: Backend is running, but Flask doesn't have that route
**Fix**: Backend only has `/api/health`, `/api/chess/*`, etc.

### Scenario 3: Frontend Shows "Connection Refused"

```
Error: Failed to fetch http://localhost:5000/api/...
```

**Problem**: Backend not running
**Fix**: 
```bash
cd backend && python app.py
```

### Scenario 4: Blank Page at localhost:3000

```
URL: http://localhost:3000
Result: Blank page, no error
```

**Problem**: Frontend running but not fully loaded
**Fix**: 
- Wait 10 seconds for full load
- Check console (F12) for errors
- Try: `npm start` again

### Scenario 5: "npm: command not found"

**Problem**: Node.js not installed or not in PATH
**Fix**: 
- Install Node.js from https://nodejs.org
- Restart VS Code / terminal
- Verify: `node --version`

---

## 🎯 CORRECT URLS CHEAT SHEET

```
Frontend:
  Main App:        http://localhost:3000
  Game Page:       http://localhost:3000/game
  Training:        http://localhost:3000/training

Backend API:
  Health Check:    http://localhost:5000/api/health
  AI Move:         http://localhost:5000/api/chess/ai-move
  Players:         http://localhost:5000/api/players/register
  Games:           http://localhost:5000/api/games
  Rankings:        http://localhost:5000/api/rankings/top
  Training:        http://localhost:5000/api/training/lessons

Correct approach:
  1. Frontend (React):        http://localhost:3000
  2. Which calls backend API: http://localhost:5000
  3. Never visit backend directly in browser
```

---

## 📊 STARTUP CHECKLIST

When starting the app, verify in this order:

- [ ] Backend started: `cd backend && python app.py`
  - Port 5000 is free
  - No errors in terminal
  - Says "Running on..."

- [ ] Frontend started: `cd frontend && npm start`
  - Port 3000 is free
  - Browser tab opened
  - No errors in console

- [ ] Visit correct URL: `http://localhost:3000`
  - Page loads (not blank)
  - Can see game menu
  - No errors in console (F12)

- [ ] Test login: 
  - Can register new player
  - Can login

- [ ] Test game:
  - Can start game
  - Can make moves
  - Board updates

- [ ] Test API:
  - `curl http://localhost:5000/api/health` returns 200

---

## 🆘 STILL GETTING ERROR?

### Step 1: Check Terminals

**Terminal 1 (Backend):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Should show:
```
* Running on http://0.0.0.0:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm start
```

Should show:
```
Compiled successfully!
You can now view chess-app in the browser.
  Local: http://localhost:3000
```

### Step 2: Open Correct URL

**In browser, visit:**
```
http://localhost:3000
```

NOT:
```
http://localhost:5000  ❌ This causes the error!
```

### Step 3: Check Browser Console

1. Open browser (Chrome, Firefox, etc.)
2. Press `F12` to open Developer Tools
3. Click "Console" tab
4. Look for red errors
5. Fix any errors shown

### Step 4: Check Firewall

If ports are blocked:
```bash
# Allow ports through firewall
# Windows: Firewall settings → Allow apps → Python, Node
# Mac: System Preferences → Security → Allow
# Linux: sudo ufw allow 3000 && sudo ufw allow 5000
```

---

## 🎯 DEPLOYMENT SPECIFIC

### If Deploying to Railway

**Frontend URL:**
```
https://your-app.railway.app
```

**NOT:**
```
https://your-app.railway.app:5000  ❌
https://api.your-app.railway.app   ❌ (only for API calls)
```

**Backend URL (only for API calls):**
```
https://your-backend.railway.app/api
```

### If on Different Machines

**From another computer:**
```
http://your-computer-ip:3000
```

Find your IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep inet
```

---

## 💡 KEY REMEMBER

| Port | Service | Purpose | Browser |
|------|---------|---------|---------|
| 3000 | Frontend (React) | User interface | ✅ Visit here |
| 5000 | Backend (Flask) | API server | ❌ Don't visit directly |

**One Rule:**
- **Always visit port 3000 in browser**
- **Backend port 5000 only receives API calls from frontend**

---

## 📝 COMPLETE SETUP PROCESS

```bash
# 1. Open Terminal 1
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add OPENAI_API_KEY

python app.py
# Should say: Running on http://0.0.0.0:5000

# 2. Open Terminal 2 (new window)
cd frontend
npm install
npm start
# Browser automatically opens http://localhost:3000

# 3. Use the app
# Go to http://localhost:3000
# Register → Login → Play!
```

---

## ✅ SUCCESS INDICATORS

When everything works:
1. ✅ Backend terminal shows "Running on..."
2. ✅ Frontend terminal shows "Compiled successfully!"
3. ✅ Browser opens automatically to localhost:3000
4. ✅ Can see login screen
5. ✅ Can register and login
6. ✅ Can start game
7. ✅ Can make moves
8. ✅ No red errors in console (F12)

---

## 🚨 MOST COMMON MISTAKES

1. **Visiting wrong port:**
   - ❌ localhost:5000 → "Resource not found"
   - ✅ localhost:3000 → Works!

2. **Backend not running:**
   - ❌ Frontend tries to call API → Connection refused
   - ✅ Both terminals running → Works!

3. **Frontend not compiled:**
   - ❌ npm start didn't complete
   - ✅ Wait for "Compiled successfully!" → Works!

4. **Missing dependencies:**
   - ❌ pip install / npm install not run
   - ✅ Both run first → Works!

5. **Port conflicts:**
   - ❌ Another app on port 3000 or 5000
   - ✅ Kill process, restart → Works!

---

## 🎉 YOU'RE FIXED!

Now you should see:
- ✅ Chess board at localhost:3000
- ✅ Can play the game
- ✅ API connects properly
- ✅ No "Resource not found" error

**Enjoy your chess game!** ♔

---

**Version**: 1.0 | **Updated**: January 2026 | **Covers**: All common issues
