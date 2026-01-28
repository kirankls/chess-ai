# 📋 RAILWAY DEPLOYMENT - VISUAL CHECKLIST

## PART 1: LOCAL SETUP (Do on Your Computer)

### Backend Setup
```
[ ] cd backend
[ ] python -m venv venv
[ ] source venv/bin/activate  (or venv\Scripts\activate on Windows)
[ ] pip install -r requirements.txt
[ ] cp .env.example .env
[ ] Edit .env - add OPENAI_API_KEY=sk-...
[ ] python app.py
[ ] Test: http://localhost:5000/api/health returns {"status": "healthy"}
```

### Frontend Setup
```
[ ] cd frontend
[ ] npm install
[ ] Create .env with: REACT_APP_API_URL=http://localhost:5000/api
[ ] npm start
[ ] Test: http://localhost:3000 shows chess board
```

### Test Everything Works
```
[ ] Can see login screen at http://localhost:3000
[ ] Can register new account
[ ] Can login
[ ] Can start game
[ ] Can make moves
[ ] No errors in browser console (F12)
```

---

## PART 2: GITHUB SETUP (Create online repository)

### Step 1: Create Repository
```
[ ] Go to https://github.com/new
[ ] Create repo: chess-ai
[ ] Copy the commands provided
```

### Step 2: Push Code
```bash
[ ] git init
[ ] git add .
[ ] git commit -m "Initial commit"
[ ] git remote add origin https://github.com/YOUR-USER/chess-ai.git
[ ] git branch -M main
[ ] git push -u origin main
```

### Step 3: Verify on GitHub
```
[ ] Visit: https://github.com/YOUR-USER/chess-ai
[ ] Can see: backend/ folder
[ ] Can see: frontend/ folder
[ ] Can see: .gitignore file
[ ] Can see: Procfile in backend/
```

---

## PART 3: RAILWAY DEPLOYMENT

### Step 1: Create Railway Project
```
[ ] Go to https://railway.app
[ ] Sign up with GitHub
[ ] Click "New Project"
[ ] Select "Deploy from GitHub"
[ ] Select: chess-ai repository
```

### Step 2: Configure Backend Service
```
[ ] Service name: backend
[ ] Root Directory: backend
[ ] Build Command: pip install -r requirements.txt
[ ] Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
[ ] Add Variables:
    [ ] OPENAI_API_KEY = sk-your-key
    [ ] FLASK_ENV = production
    [ ] SECRET_KEY = random-secret-here
[ ] Click Deploy
```

### Step 3: Get Backend URL
```
[ ] Wait for deployment to complete
[ ] Go to Deployments tab
[ ] Copy Public Domain (e.g., chess-backend-prod.railway.app)
[ ] Test: curl https://chess-backend-prod.railway.app/api/health
```

### Step 4: Configure Frontend Service
```
[ ] Click "Add Service"
[ ] Select "GitHub Repo"
[ ] Service name: frontend
[ ] Root Directory: frontend
[ ] Build Command: npm install && npm run build
[ ] Start Command: npm start
[ ] Add Variables:
    [ ] REACT_APP_API_URL = https://YOUR-BACKEND-DOMAIN/api
    [ ] CI = false
[ ] Click Deploy
```

### Step 5: Get Frontend URL
```
[ ] Wait for deployment to complete
[ ] Go to Deployments tab
[ ] Copy Public Domain (e.g., chess-frontend-prod.railway.app)
[ ] This is your app URL!
```

---

## PART 4: TESTING

### Test Frontend
```
[ ] Open: https://chess-frontend-prod.railway.app
[ ] See login screen
[ ] Can register account
[ ] Can login
[ ] Can start game
[ ] Can make moves
[ ] No errors in console (F12)
```

### Test Backend
```bash
[ ] curl https://chess-backend-prod.railway.app/api/health
[ ] curl https://chess-backend-prod.railway.app/api/training/lessons
[ ] curl -X POST https://chess-backend-prod.railway.app/api/games \
    -H "Content-Type: application/json" \
    -d '{"player_id": 1, "difficulty": "easy"}'
```

### Check Logs
```
[ ] Backend: No error messages
[ ] Frontend: No error messages
[ ] Both services: "Running" status
```

---

## FILE CHECKLIST

### Backend Files (Should Exist)
```
backend/
├── app.py                     [✓] Provided
├── requirements.txt           [✓] Must include gunicorn
├── Procfile                   [✓] Rename from Procfile_backend
├── .env.example              [✓] Provided
└── .env                       [⚠] Create locally, DON'T commit
```

### Frontend Files (Should Exist)
```
frontend/
├── src/
│   ├── App.js                [✓] Copy from ChessApp.jsx
│   ├── index.js              [✓] Should exist
│   └── index.css             [✓] Should exist
├── public/
│   └── index.html            [✓] Should exist
├── package.json              [✓] Provided
├── .env                       [⚠] Create locally, DON'T commit
└── .gitignore                [✓] Should exist
```

### Root Files (Should Exist)
```
chess-ai/
├── .gitignore                [✓] Provided
├── README.md                 [✓] Provided
├── Procfile_backend          [✓] Copy to backend/Procfile
└── railway.json              [✓] Optional - copy to root
```

---

## ENVIRONMENT VARIABLES

### Backend (Set in Railway)
```
OPENAI_API_KEY = sk-your-actual-openai-key-here
FLASK_ENV = production
SECRET_KEY = generate-a-secure-random-string
```

### Frontend (Set in Railway)
```
REACT_APP_API_URL = https://your-backend-domain.railway.app/api
CI = false
```

---

## DEPLOYMENT TIMELINE

```
Task                           Time    Status
─────────────────────────────────────────────
Local setup (backend)          5 min   ⏳
Local setup (frontend)         5 min   ⏳
Local testing                  5 min   ⏳
GitHub repository              5 min   ⏳
GitHub push                    2 min   ⏳
Railway backend config         3 min   ⏳
Railway backend deploy         5 min   ⏳ (auto)
Get backend URL                1 min   ⏳
Railway frontend config        3 min   ⏳
Railway frontend deploy        5 min   ⏳ (auto)
Testing frontend               5 min   ⏳
Testing backend                2 min   ⏳
─────────────────────────────────────────────
TOTAL                          46 min  
```

---

## SUCCESS INDICATORS

✅ **Everything Working When:**
- Backend returns 200 OK on health check
- Frontend loads without errors
- Login/register works
- Can start and play game
- Can make moves
- Board updates in real-time
- No red errors in console
- Railway logs show no errors

---

## AFTER DEPLOYMENT

```
[ ] Share app URL with friends
[ ] Monitor logs for errors
[ ] Set up custom domain (optional)
[ ] Configure monitoring alerts (optional)
[ ] Keep code updated on GitHub
[ ] Redeploy if needed (just git push!)
```

---

## QUICK HELP

**Something not working?**

1. Check logs in Railway dashboard
2. Verify environment variables
3. Test API endpoint with curl
4. Check frontend console (F12)
5. Verify backend is running
6. Verify frontend is running
7. Check correct URLs

**Need more help?**

Read: `RAILWAY_COMPLETE_DEPLOYMENT.md`

---

## 🎉 YOU'RE DONE!

Your app is live at:
```
https://your-frontend-domain.railway.app
```

Enjoy! ♔

---

Print this page and check off as you go!
