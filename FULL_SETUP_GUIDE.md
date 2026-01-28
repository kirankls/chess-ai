# ♔ AI CHESS APPLICATION - SETUP & DEPLOYMENT GUIDE

## Full-Stack Application with Python + React + OpenAI

---

## 📋 PROJECT STRUCTURE

```
chess-ai/
├── backend/
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   ├── .env.example           # Example env template
│   └── chess.db              # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # React main component
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Styles
│   ├── package.json          # NPM dependencies
│   └── public/
│       └── index.html        # HTML template
│
└── README.md                 # This file
```

---

## 🚀 QUICK START

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- OpenAI API key

### Step 1: Clone/Setup Backend

```bash
# Create project directory
mkdir chess-ai
cd chess-ai

# Create backend folder
mkdir backend
cd backend

# Copy app.py, requirements.txt, .env.example
# Files provided in this guide

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env
# OR
vim .env
```

Add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-api-key-here
SECRET_KEY=your-secure-secret-key-change-in-production
```

### Step 3: Start Backend Server

```bash
python app.py
```

Server will run at: `http://localhost:5000`

You should see:
```
* Running on http://0.0.0.0:5000
* Debug mode: on
```

### Step 4: Setup Frontend

In a new terminal:

```bash
# Go back to project root
cd ..

# Create React app
npx create-react-app frontend
cd frontend

# Install additional dependencies
npm install axios

# Copy ChessApp.jsx to src/
cp ../ChessApp.jsx src/App.js

# Start development server
npm start
```

Frontend will run at: `http://localhost:3000`

---

## 🛠️ BACKEND SETUP DETAILS

### Python Dependencies

```
Flask==2.3.3                    # Web framework
Flask-CORS==4.0.0              # Cross-origin requests
Flask-SQLAlchemy==3.0.5        # Database ORM
SQLAlchemy==2.0.20             # Database toolkit
openai==0.27.8                 # OpenAI API client
python-dotenv==1.0.0           # Environment variables
Werkzeug==2.3.7                # WSGI utilities
```

### API Endpoints

#### Health Check
```
GET /api/health
Response: {"status": "healthy", "timestamp": "..."}
```

#### Authentication
```
POST /api/players/register
Body: {"username": "player1", "email": "email@example.com", "password": "pass"}

GET /api/players/<player_id>
GET /api/players/<player_id> (PUT)
```

#### Chess Game
```
POST /api/chess/validate-move
Body: {"board": [...], "from_pos": [0,0], "to_pos": [1,0]}

POST /api/chess/get-legal-moves
Body: {"board": [...], "row": 0, "col": 0}

POST /api/chess/ai-move
Body: {"board": [...], "difficulty": "medium"}

POST /api/chess/detect-checkmate
Body: {"board": [...], "player_color": "white"}
```

#### Games
```
POST /api/games
Body: {"player_id": 1, "difficulty": "medium"}

GET /api/games/<game_id>
PUT /api/games/<game_id>
Body: {"moves": [...], "result": "win", "completion_time": 120}

GET /api/games/player/<player_id>
```

#### Rankings
```
POST /api/rankings
Body: {"player_id": 1, "difficulty": "medium", "completion_time": 120}

GET /api/rankings/difficulty/medium?limit=10
GET /api/rankings/top?limit=10
GET /api/rankings/player/<player_id>
```

#### Training
```
GET /api/training/lessons
POST /api/training/generate-puzzle
Body: {"difficulty": "medium"}
```

### Database Schema

#### Players Table
- id (Integer, Primary Key)
- username (String, Unique)
- email (String, Unique)
- password_hash (String)
- created_at (DateTime)

#### Games Table
- id (Integer, Primary Key)
- player_id (Integer, Foreign Key)
- difficulty (String)
- moves (Text - JSON)
- board_state (Text - JSON)
- result (String)
- completion_time (Integer)
- created_at (DateTime)

#### Rankings Table
- id (Integer, Primary Key)
- player_id (Integer, Foreign Key)
- difficulty (String)
- completion_time (Integer)
- rank_position (Integer)
- created_at (DateTime)

---

## 🎨 FRONTEND SETUP DETAILS

### React Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.4.0",
    "lucide-react": "^0.263.1"
  }
}
```

### Key Components

#### ChessApp Component
- Main application container
- State management for all game modes
- API communication

#### Board Rendering
- 8x8 chess board with piece visualization
- Legal move highlighting
- Selected piece indication

#### Game Modes
1. **Menu** - Mode selection and rankings display
2. **Game** - Active chess gameplay
3. **Training** - Lesson selection and content
4. **Rankings** - Global leaderboard display

---

## 🔑 ENVIRONMENT VARIABLES

### Backend (.env)

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here

# Flask Configuration
SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=development
DEBUG=True

# Database
SQLALCHEMY_DATABASE_URI=sqlite:///chess.db

# Server
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
```

### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🎮 GAME FLOW

### Move Validation Flow
```
User clicks square → Frontend validates locally → 
Send to backend → Backend validates chess rules → 
Return legal moves → Display on board
```

### AI Move Flow
```
White move made → Turn changes to Black → 
Frontend calls /api/chess/ai-move → 
Backend sends board to OpenAI → 
OpenAI returns move → 
Backend validates move → 
Frontend updates board → 
Checks for checkmate
```

### Game Save Flow
```
User clicks Save → Create game record → 
Store board state and moves → 
Database stores game → 
Return game ID → Show confirmation
```

### Ranking Submission Flow
```
Game ends with checkmate → User clicks Submit → 
Calculate completion time → 
Send to /api/rankings → 
Database stores ranking → 
Recalculate positions → 
Frontend fetches updated rankings → Display leaderboard
```

---

## 🚀 DEPLOYMENT

### Development Mode

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate  # Or venv\Scripts\activate on Windows
python app.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### Production Deployment

#### Option 1: Heroku

Backend:
```bash
cd backend
heroku create chess-ai-backend
git push heroku main
heroku config:set OPENAI_API_KEY=sk-...
```

Frontend:
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or similar
```

#### Option 2: Docker

Create `Dockerfile` for backend:
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
CMD ["python", "app.py"]
```

Run:
```bash
docker build -t chess-ai-backend .
docker run -p 5000:5000 -e OPENAI_API_KEY=sk-... chess-ai-backend
```

#### Option 3: AWS/GCP/Azure

1. Create backend instance with Python runtime
2. Deploy React frontend to CDN/static hosting
3. Update API URL in frontend for production

---

## 🔒 SECURITY CONSIDERATIONS

### Before Production:

1. **Change SECRET_KEY**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Enable HTTPS**
   - Use SSL certificates
   - Update CORS for production domain

3. **Environment Variables**
   - Never commit .env file
   - Use environment secrets in CI/CD

4. **API Rate Limiting**
   - Add rate limiting to prevent abuse
   - Implement request throttling

5. **Input Validation**
   - Validate all board positions
   - Validate player inputs

6. **Authentication**
   - Implement JWT tokens (optional)
   - Secure password hashing (already using Werkzeug)

---

## 🐛 TROUBLESHOOTING

### Backend Issues

#### OpenAI API Error
```
Error: "Invalid API key"
Solution: Check OPENAI_API_KEY in .env
```

#### CORS Error
```
Error: "Access to XMLHttpRequest blocked"
Solution: Check Flask-CORS is enabled, verify frontend URL
```

#### Database Error
```
Error: "database is locked"
Solution: Ensure only one app instance, restart server
```

### Frontend Issues

#### API Connection Failed
```
Error: "Cannot reach http://localhost:5000"
Solution: Ensure backend is running, check port 5000
```

#### Moves Not Working
```
Error: "Cannot read property 'from_pos'"
Solution: Check board state is being sent correctly
```

### Common Solutions

```bash
# Clear database
rm chess.db

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Clear npm cache
npm cache clean --force
npm install

# Check port availability
lsof -i :5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows
```

---

## 📊 TESTING

### Backend Testing

```bash
# Test API endpoints
curl http://localhost:5000/api/health

# Test move validation
curl -X POST http://localhost:5000/api/chess/validate-move \
  -H "Content-Type: application/json" \
  -d '{"board": [...], "from_pos": [0,0], "to_pos": [1,0]}'

# Test AI move
curl -X POST http://localhost:5000/api/chess/ai-move \
  -H "Content-Type: application/json" \
  -d '{"board": [...], "difficulty": "medium"}'
```

### Frontend Testing

1. Test game flow in browser
2. Open DevTools (F12)
3. Check Network tab for API calls
4. Verify game state updates

---

## 📈 PERFORMANCE OPTIMIZATION

### Backend
- Cache legal moves calculation
- Batch API calls to OpenAI
- Use connection pooling for database
- Implement caching layer (Redis optional)

### Frontend
- Memoize board rendering components
- Lazy load training lessons
- Debounce move validation
- Use React.memo for pieces

---

## 🔄 UPDATING OPENAI API

The application uses `openai==0.27.8`. To update to newer version:

```bash
pip install --upgrade openai
```

Then update `app.py` imports:
```python
from openai import OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
# Update API calls to use client instead of openai module
```

---

## 📚 ADDITIONAL RESOURCES

- OpenAI API Docs: https://platform.openai.com/docs
- Flask Documentation: https://flask.palletsprojects.com
- React Documentation: https://react.dev
- Chess.com API: https://www.chess.com/news/view/published-data-api

---

## 🎓 LEARNING OUTCOMES

After completing this project, you'll understand:
- ✅ Full-stack web development
- ✅ Python backend with Flask
- ✅ React frontend architecture
- ✅ API design and integration
- ✅ Database modeling with SQLAlchemy
- ✅ OpenAI API integration
- ✅ CORS and cross-origin requests
- ✅ Authentication and security basics

---

## 💡 FUTURE ENHANCEMENTS

- [ ] WebSocket for real-time multiplayer
- [ ] Implement full chess rules (castling, en passant)
- [ ] Chess engine (Stockfish integration)
- [ ] Game analysis and move suggestions
- [ ] Elo rating system
- [ ] Tournament functionality
- [ ] Video tutorials
- [ ] Mobile app (React Native)
- [ ] Live streaming integration
- [ ] Social features (friends, messaging)

---

## 📞 SUPPORT

For issues:
1. Check browser console (F12)
2. Check server logs
3. Verify API keys and configuration
4. Review error messages carefully
5. Check database status

---

## 📄 LICENSE

This project is provided for educational purposes.

---

**Version**: 1.0
**Last Updated**: January 2026
**Framework**: Flask + React + OpenAI
