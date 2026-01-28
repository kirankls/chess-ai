# ♔ AI CHESS APPLICATION

## Full-Stack Chess Game with OpenAI Integration

A complete web-based chess application featuring AI opponents powered by OpenAI's GPT models, interactive training mode, persistent game storage, and global ranking system.

---

## 🎯 FEATURES

### Game Modes
- **3 Difficulty Levels**: Easy (random), Medium (strategic), Hard (OpenAI-powered)
- **Training Mode**: 4 interactive lessons on chess fundamentals
- **Global Rankings**: Leaderboard system with time-based scoring
- **Game Persistence**: Save/load games with move history

### Chess Features
- Full chess rule implementation
- Legal move validation and highlighting
- Move history with algebraic notation
- Chess clock (10 minutes per side)
- Checkmate detection
- Real-time board state management

### AI Engine
- **Easy Mode**: Random move selection
- **Medium Mode**: Strategic move prioritization
- **Hard Mode**: OpenAI GPT-3.5-turbo analysis

### User System
- Player registration and authentication
- Profile management
- Performance tracking
- Personal game history

---

## 🏗️ ARCHITECTURE

### System Diagram
```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │          React Frontend (Port 3000)          │  │
│  │  - Board Rendering                           │  │
│  │  - Game State Management                     │  │
│  │  - Authentication UI                        │  │
│  │  - Training Mode Interface                  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                    HTTP/AXIOS
                         │
┌─────────────────────────────────────────────────────┐
│              SERVER (localhost:5000)                 │
│  ┌──────────────────────────────────────────────┐  │
│  │        Flask REST API (Python)               │  │
│  │  ├─ Authentication Routes                    │  │
│  │  ├─ Game Management Routes                   │  │
│  │  ├─ Chess Logic Routes                       │  │
│  │  ├─ AI Move Generation                       │  │
│  │  ├─ Rankings Management                      │  │
│  │  └─ Training Routes                          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │                    │                │
    OpenAI API         SQLite Database   File Storage
```

### Tech Stack

**Frontend:**
- React 18+ (UI Framework)
- Axios (HTTP Client)
- Tailwind CSS (Styling)
- Lucide Icons (UI Icons)

**Backend:**
- Flask 2.3+ (Web Framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- OpenAI API (AI Engine)

**Infrastructure:**
- Docker & Docker Compose (Containerization)
- Python 3.8+ (Runtime)
- Node.js 14+ (Build Tool)

---

## 📦 PROJECT STRUCTURE

```
chess-ai/
├── backend/
│   ├── app.py                           # Main Flask application
│   ├── requirements.txt                 # Python dependencies
│   ├── .env.example                     # Environment template
│   ├── .env                             # Environment config (create)
│   ├── chess.db                         # SQLite database (auto-created)
│   └── Dockerfile                       # Container config
│
├── frontend/
│   ├── public/
│   │   └── index.html                   # HTML entry point
│   ├── src/
│   │   ├── App.js                       # Main React component
│   │   ├── index.js                     # React initialization
│   │   └── index.css                    # Stylesheet
│   ├── package.json                     # NPM dependencies
│   ├── .env                             # Frontend config (create)
│   └── Dockerfile                       # Container config
│
├── docker-compose.yml                   # Docker orchestration
├── FULL_SETUP_GUIDE.md                 # Detailed setup guide
└── README.md                            # This file
```

---

## 🚀 QUICK START

### Prerequisites
- **Python**: 3.8 or higher
- **Node.js**: 14 or higher
- **OpenAI API Key**: Get from https://platform.openai.com
- **Git**: For cloning repository

### Option 1: Direct Setup (Recommended for Development)

#### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-api-key-here
```

#### Step 2: Start Backend
```bash
python app.py
```

Output:
```
* Running on http://0.0.0.0:5000
* Debug mode: on
```

#### Step 3: Frontend Setup (New Terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (if needed)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

Frontend opens at: `http://localhost:3000`

### Option 2: Docker Compose (Production-Ready)

```bash
# Clone repository
git clone <repo-url>
cd chess-ai

# Create .env file in backend directory
cd backend
cp .env.example .env
# Edit .env with your OpenAI API key

# Go back to root
cd ..

# Start all services
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

## 🎮 GAMEPLAY GUIDE

### Getting Started

1. **Register/Login**
   - Create new account or login
   - Enter username, email, password

2. **Choose Difficulty**
   - Easy: Random AI moves
   - Medium: Strategic play
   - Hard: OpenAI-powered analysis

3. **Play Game**
   - Click pieces to select
   - Green highlights show legal moves
   - AI responds automatically

4. **Win & Submit**
   - Achieve checkmate to win
   - Click "Submit Score"
   - Appear on global leaderboard

### Game Rules

**Piece Movements:**
- **Pawns**: Move 1 square forward (2 from start), capture diagonally
- **Rooks**: Move horizontally/vertically any distance
- **Bishops**: Move diagonally any distance
- **Knights**: Move in L-shape (2+1)
- **Queens**: Combine rook and bishop
- **Kings**: Move 1 square in any direction

**Game Objectives:**
- Checkmate the AI king
- Complete game faster than other players
- Reach high ranking positions

### Training Mode

Learn chess fundamentals through 4 interactive lessons:

1. **Piece Movements** - How each piece moves
2. **Checkmate Patterns** - Common mating techniques
3. **Opening Principles** - Strong game openings
4. **Tactical Puzzles** - Chess tactics and motifs

---

## 🔌 API DOCUMENTATION

### Authentication

```python
# Register new player
POST /api/players/register
{
    "username": "player1",
    "email": "player1@example.com",
    "password": "secure_password"
}

# Login (optional - app uses username for now)
GET /api/players/<player_id>
```

### Chess Logic

```python
# Validate a move
POST /api/chess/validate-move
{
    "board": [board_state],
    "from_pos": [row, col],
    "to_pos": [row, col]
}
Response: {"valid": true}

# Get legal moves for a piece
POST /api/chess/get-legal-moves
{
    "board": [board_state],
    "row": 0,
    "col": 0
}
Response: {"legal_moves": [{"row": 1, "col": 0}, ...]}

# Get AI move (uses OpenAI)
POST /api/chess/ai-move
{
    "board": [board_state],
    "difficulty": "medium"
}
Response: {
    "from_row": 7,
    "from_col": 4,
    "to_row": 5,
    "to_col": 4
}

# Detect checkmate
POST /api/chess/detect-checkmate
{
    "board": [board_state],
    "player_color": "white"
}
Response: {"is_checkmate": true}
```

### Game Management

```python
# Create game
POST /api/games
{
    "player_id": 1,
    "difficulty": "medium"
}

# Save game progress
PUT /api/games/<game_id>
{
    "moves": [move_list],
    "board_state": [board],
    "result": "ongoing",
    "completion_time": 120
}

# Get player games
GET /api/games/player/<player_id>
```

### Rankings

```python
# Submit ranking (after winning)
POST /api/rankings
{
    "player_id": 1,
    "difficulty": "medium",
    "completion_time": 120
}

# Get top rankings by difficulty
GET /api/rankings/difficulty/medium?limit=10

# Get all top rankings
GET /api/rankings/top?limit=10

# Get player rankings
GET /api/rankings/player/<player_id>
```

### Training

```python
# Get all lessons
GET /api/training/lessons

# Generate AI puzzle
POST /api/training/generate-puzzle
{
    "difficulty": "medium"
}
```

---

## 🔐 SECURITY

### Environment Variables
Never commit `.env` file! Use `.env.example` as template.

```bash
# .env (DO NOT COMMIT)
OPENAI_API_KEY=sk-...
SECRET_KEY=your-random-secure-key
DATABASE_URL=sqlite:///chess.db
FLASK_ENV=production
```

### Password Security
- Passwords hashed with Werkzeug
- No plaintext password storage
- Secure password validation

### API Security
- CORS enabled for frontend
- Input validation on all endpoints
- Database escape to prevent SQL injection

### Production Checklist
- [ ] Change SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Set FLASK_ENV=production
- [ ] Use strong database password
- [ ] Enable rate limiting
- [ ] Setup proper logging
- [ ] Use environment secrets in CI/CD

---

## 🧪 TESTING

### Backend Testing

```bash
# Test API health
curl http://localhost:5000/api/health

# Test move validation
curl -X POST http://localhost:5000/api/chess/validate-move \
  -H "Content-Type: application/json" \
  -d '{"board": [], "from_pos": [0,0], "to_pos": [1,0]}'

# Test AI move generation
curl -X POST http://localhost:5000/api/chess/ai-move \
  -H "Content-Type: application/json" \
  -d '{"board": [], "difficulty": "medium"}'
```

### Frontend Testing

1. Open browser DevTools (F12)
2. Check Network tab for API calls
3. Test game flow in all modes
4. Verify board updates correctly

---

## 🐛 TROUBLESHOOTING

### Backend Issues

**OpenAI API Error**
```
Error: Invalid API key
Solution: Check OPENAI_API_KEY in .env
```

**Database Locked**
```
Error: database is locked
Solution: Restart Flask server
```

**CORS Error**
```
Error: Access blocked by CORS policy
Solution: Verify Flask-CORS is installed, frontend URL correct
```

### Frontend Issues

**Cannot Connect to Backend**
```
Error: Cannot reach http://localhost:5000
Solution: 
- Ensure backend running on port 5000
- Check firewall settings
- Verify REACT_APP_API_URL in .env
```

**Moves Not Working**
```
Error: Cannot parse board position
Solution:
- Check board state format
- Verify move coordinates valid
- Check console for error details
```

### Common Solutions

```bash
# Reset database
rm backend/chess.db

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Clear npm cache
npm cache clean --force
npm install

# Check running processes
lsof -i :5000      # Backend port
lsof -i :3000      # Frontend port
```

---

## 📈 PERFORMANCE

### Optimization Tips

**Backend:**
- Cache calculated legal moves
- Batch OpenAI API calls
- Use database indexing
- Implement request caching

**Frontend:**
- Memoize board components
- Lazy load lessons
- Debounce API calls
- Use React.memo

### Monitoring

```bash
# Monitor API requests
# Use Chrome DevTools Network tab

# Monitor backend logs
tail -f app.log

# Monitor database size
ls -lh backend/chess.db
```

---

## 🚀 DEPLOYMENT

### Heroku Deployment

**Backend:**
```bash
cd backend
heroku create chess-ai-backend
heroku config:set OPENAI_API_KEY=sk-...
git push heroku main
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, etc.
```

### AWS Deployment

1. Create EC2 instance (Ubuntu 20.04)
2. Install Python, Node.js
3. Clone repository
4. Run setup script
5. Use nginx for reverse proxy

### Azure Deployment

1. Create App Service
2. Configure deployment source
3. Set environment variables
4. Deploy backend and frontend

---

## 🔄 UPDATING OPENAI

```bash
# Check current version
pip show openai

# Update to latest
pip install --upgrade openai

# Update import (if using newer version)
# Old: import openai
# New: from openai import OpenAI
```

---

## 📚 LEARNING RESOURCES

- **Flask**: https://flask.palletsprojects.com
- **React**: https://react.dev
- **OpenAI API**: https://platform.openai.com/docs
- **Chess.com**: https://www.chess.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org

---

## 🎓 PROJECT SKILLS

This project teaches:
- ✅ Full-stack web development
- ✅ Python backend development
- ✅ React frontend architecture
- ✅ REST API design
- ✅ Database design with SQLAlchemy
- ✅ OpenAI API integration
- ✅ Authentication basics
- ✅ Docker containerization
- ✅ Game logic implementation
- ✅ Real-time state management

---

## 📝 LICENSE

Educational use. See LICENSE file for details.

---

## 🤝 CONTRIBUTING

Contributions welcome! Please:

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

## 📞 SUPPORT

For issues:
1. Check FULL_SETUP_GUIDE.md
2. Review troubleshooting section
3. Check browser console (F12)
4. Review server logs
5. Create GitHub issue with details

---

**Version**: 1.0
**Last Updated**: January 2026
**Framework**: Flask + React + OpenAI
**License**: Educational Use

---

## 🎉 ENJOY!

Start playing chess against AI and challenge yourself!

```
♔ CHESS AI ♔
Master the Royal Game
```
