# ♔ AI CHESS APPLICATION - QUICK REFERENCE

## Installation (5 Minutes)

### Linux/Mac
```bash
# Run setup script
chmod +x setup.sh
./setup.sh

# Edit config
nano backend/.env

# Terminal 1: Start Backend
cd backend && source venv/bin/activate && python app.py

# Terminal 2: Start Frontend
cd frontend && npm start

# Open http://localhost:3000
```

### Windows
```bash
# Run setup script
setup.bat

# Edit config
# Open backend\.env in text editor

# Terminal 1: Start Backend
cd backend && venv\Scripts\activate && python app.py

# Terminal 2: Start Frontend
cd frontend && npm start

# Open http://localhost:3000
```

### Docker
```bash
docker-compose up --build
# Open http://localhost:3000
```

---

## API Endpoints

### Health Check
```
GET /api/health
```

### Game
```
POST /api/chess/ai-move
POST /api/chess/validate-move
POST /api/chess/get-legal-moves
POST /api/chess/detect-checkmate
```

### Players
```
POST /api/players/register
GET /api/players/<id>
```

### Games
```
POST /api/games
GET /api/games/<id>
PUT /api/games/<id>
GET /api/games/player/<id>
```

### Rankings
```
POST /api/rankings
GET /api/rankings/top
GET /api/rankings/difficulty/<difficulty>
GET /api/rankings/player/<id>
```

### Training
```
GET /api/training/lessons
POST /api/training/generate-puzzle
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'flask'` | Run `pip install -r requirements.txt` in backend |
| `Cannot connect to localhost:5000` | Check backend is running on port 5000 |
| `CORS error` | Ensure Flask-CORS is installed |
| `OpenAI API error` | Check OPENAI_API_KEY in .env |
| `npm: command not found` | Install Node.js from nodejs.org |
| `Port 5000/3000 already in use` | Change port in app.py / .env |

---

## Key Files

- `app.py` - Flask backend main file
- `ChessApp.jsx` - React frontend component
- `requirements.txt` - Python dependencies
- `package.json` - Node dependencies
- `.env` - Configuration (DO NOT COMMIT)
- `docker-compose.yml` - Docker configuration

---

## Game Modes

- **Easy**: Random AI moves
- **Medium**: Strategic play with OpenAI
- **Hard**: Advanced OpenAI analysis

---

## Features Checklist

- ✅ 3 AI Difficulty Levels
- ✅ Training Mode (4 Lessons)
- ✅ Global Rankings
- ✅ Save/Load Games
- ✅ Move History
- ✅ Chess Clock (10 min/side)
- ✅ User Accounts
- ✅ Game Statistics

---

## Frontend Structure

```
React Component (ChessApp)
├── Login/Register Screen
├── Menu Screen
├── Game Screen
│   ├── Board Rendering
│   ├── Move Validation
│   ├── AI Integration
│   └── Timer
├── Training Screen
└── Rankings Screen
```

---

## Backend Structure

```
Flask App
├── Database (SQLAlchemy)
│   ├── Players
│   ├── Games
│   └── Rankings
├── API Routes
│   ├── /api/players/*
│   ├── /api/chess/*
│   ├── /api/games/*
│   ├── /api/rankings/*
│   └── /api/training/*
└── OpenAI Integration
```

---

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
SECRET_KEY=your-secret-key
FLASK_ENV=development
DATABASE_URL=sqlite:///chess.db
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
```

---

## Common Commands

```bash
# Backend
python app.py                 # Start server
pip install -r requirements.txt  # Install packages
python -c "import openai"     # Test OpenAI import

# Frontend
npm start                     # Development server
npm run build                 # Production build
npm test                      # Run tests

# Database
rm backend/chess.db           # Reset database
sqlite3 backend/chess.db      # Access database

# Docker
docker-compose up             # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
```

---

## Chess Notation

**Move Format**: `a2-a4`
- First: From square (file + rank)
- Last: To square (file + rank)

**Board Coordinates**:
- Files: a-h (columns, left to right)
- Ranks: 1-8 (rows, bottom to top)

**Example Moves**:
- e2-e4: Pawn opening move
- g1-f3: Knight development
- e7-e5: Black counter

---

## Support Resources

- OpenAI Docs: https://platform.openai.com/docs
- Flask Docs: https://flask.palletsprojects.com
- React Docs: https://react.dev
- SQLAlchemy: https://docs.sqlalchemy.org

---

## Performance Tips

- Clear browser cache for updates
- Monitor API calls in DevTools
- Check database size: `ls -lh chess.db`
- Use production mode for deployment
- Enable gzip compression
- Cache API responses

---

## Security Notes

- ✅ Passwords hashed with Werkzeug
- ✅ CORS enabled for frontend
- ✅ Input validation on endpoints
- ⚠️ Never commit .env file
- ⚠️ Change SECRET_KEY in production
- ⚠️ Use environment secrets for API keys

---

**Version**: 1.0 | **Updated**: January 2026 | **Framework**: Flask + React + OpenAI
