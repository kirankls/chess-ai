"""
AI Chess Application Backend
Flask server with OpenAI integration for chess AI
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import openai
import os
from datetime import datetime
from dotenv import load_dotenv
import json
import re
import logging
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///chess.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'connect_args': {'check_same_thread': False} if 'sqlite' in app.config['SQLALCHEMY_DATABASE_URI'] else {},
    'pool_pre_ping': True,
    'pool_recycle': 3600,
}
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize database
db = SQLAlchemy(app)

# Set OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY', '')

logger.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
logger.info(f"OpenAI API Key set: {bool(openai.api_key)}")

# ========================
# DATABASE MODELS
# ========================

class Player(db.Model):
    __tablename__ = 'player'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    games = db.relationship('Game', backref='player', lazy=True, cascade='all, delete-orphan')
    rankings = db.relationship('Ranking', backref='player', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Game(db.Model):
    __tablename__ = 'game'
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    moves = db.Column(db.Text)
    board_state = db.Column(db.Text)
    result = db.Column(db.String(20))
    completion_time = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'difficulty': self.difficulty,
            'moves': json.loads(self.moves) if self.moves else [],
            'result': self.result,
            'completion_time': self.completion_time,
            'created_at': self.created_at.isoformat()
        }


class Ranking(db.Model):
    __tablename__ = 'ranking'
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    completion_time = db.Column(db.Integer, nullable=False)
    rank_position = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'username': self.player.username,
            'difficulty': self.difficulty,
            'completion_time': self.completion_time,
            'rank_position': self.rank_position,
            'created_at': self.created_at.isoformat()
        }


# ========================
# HEALTH CHECK & STATUS
# ========================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database
        db.session.execute('SELECT 1')
        db.session.commit()
        
        return jsonify({
            'status': 'healthy',
            'message': 'Backend is running',
            'database': 'connected'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'database': 'disconnected'
        }), 503


@app.route('/api/status', methods=['GET'])
def status():
    """Status endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Chess API',
        'version': '1.0.0'
    }), 200


# ========================
# AUTH ENDPOINTS
# ========================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new player"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if Player.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if Player.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Create new player
        player = Player(username=data['username'], email=data['email'])
        player.set_password(data['password'])
        
        db.session.add(player)
        db.session.commit()
        
        return jsonify({
            'message': 'Player registered successfully',
            'player': player.to_dict()
        }), 201
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login player"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing credentials'}), 400
        
        player = Player.query.filter_by(username=data['username']).first()
        
        if not player or not player.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'message': 'Login successful',
            'player': player.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ========================
# GAME ENDPOINTS
# ========================

@app.route('/api/games', methods=['POST'])
def create_game():
    """Create new game"""
    try:
        data = request.get_json()
        
        if not data or not data.get('player_id') or not data.get('difficulty'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        game = Game(
            player_id=data['player_id'],
            difficulty=data['difficulty'],
            moves='[]',
            board_state='',
            result=None
        )
        
        db.session.add(game)
        db.session.commit()
        
        return jsonify({
            'message': 'Game created',
            'game': game.to_dict()
        }), 201
    
    except Exception as e:
        logger.error(f"Create game error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get game details"""
    try:
        game = Game.query.get(game_id)
        
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        return jsonify(game.to_dict()), 200
    
    except Exception as e:
        logger.error(f"Get game error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/games/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    """Update game"""
    try:
        data = request.get_json()
        game = Game.query.get(game_id)
        
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        if 'moves' in data:
            game.moves = json.dumps(data['moves'])
        if 'board_state' in data:
            game.board_state = data['board_state']
        if 'result' in data:
            game.result = data['result']
        if 'completion_time' in data:
            game.completion_time = data['completion_time']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Game updated',
            'game': game.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"Update game error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ========================
# RANKINGS ENDPOINTS
# ========================

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    """Get rankings"""
    try:
        difficulty = request.args.get('difficulty', 'all')
        
        if difficulty == 'all':
            rankings = Ranking.query.order_by(Ranking.rank_position).all()
        else:
            rankings = Ranking.query.filter_by(difficulty=difficulty).order_by(Ranking.rank_position).all()
        
        return jsonify([r.to_dict() for r in rankings]), 200
    
    except Exception as e:
        logger.error(f"Get rankings error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/rankings/top', methods=['GET'])
def get_top_rankings():
    """Get top 10 rankings"""
    try:
        limit = request.args.get('limit', 10, type=int)
        rankings = Ranking.query.order_by(Ranking.rank_position).limit(limit).all()
        
        return jsonify([r.to_dict() for r in rankings]), 200
    
    except Exception as e:
        logger.error(f"Get top rankings error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ========================
# TRAINING ENDPOINTS
# ========================

@app.route('/api/training/lessons', methods=['GET'])
def get_lessons():
    """Get chess lessons"""
    try:
        lessons = [
            {
                'id': 1,
                'title': 'Chess Basics',
                'description': 'Learn the fundamental rules and pieces',
                'level': 'beginner'
            },
            {
                'id': 2,
                'title': 'Opening Theory',
                'description': 'Master popular chess openings',
                'level': 'intermediate'
            },
            {
                'id': 3,
                'title': 'Endgame Strategy',
                'description': 'Win in the endgame',
                'level': 'advanced'
            }
        ]
        return jsonify(lessons), 200
    
    except Exception as e:
        logger.error(f"Get lessons error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ========================
# AI MOVE ENDPOINT
# ========================

@app.route('/api/chess/ai-move', methods=['POST'])
def get_ai_move():
    """Get AI move for chess game"""
    try:
        if not openai.api_key:
            return jsonify({
                'error': 'OpenAI API key not configured',
                'move': 'e2e4'
            }), 200
        
        data = request.get_json()
        board_state = data.get('board_state', '')
        difficulty = data.get('difficulty', 'medium')
        
        prompt = f"""You are a chess engine at {difficulty} difficulty level.
        Current board state: {board_state}
        
        Provide the best next move in algebraic notation (e.g., e2e4).
        Only respond with the move, nothing else."""
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0.7 if difficulty == 'easy' else 0.5
        )
        
        move = response.choices[0].message.content.strip()
        
        return jsonify({
            'move': move,
            'difficulty': difficulty
        }), 200
    
    except Exception as e:
        logger.error(f"AI move error: {str(e)}")
        return jsonify({
            'error': str(e),
            'move': 'e2e4'
        }), 200


# ========================
# ERROR HANDLERS
# ========================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


# ========================
# DATABASE INITIALIZATION
# ========================

def init_db():
    """Initialize database"""
    try:
        with app.app_context():
            db.create_all()
            logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")


# Create tables on startup
@app.before_request
def create_tables():
    """Create tables if they don't exist"""
    try:
        db.create_all()
    except Exception as e:
        logger.error(f"Create tables error: {str(e)}")


# ========================
# APPLICATION ENTRY POINT
# ========================

if __name__ == '__main__':
    logger.info("Starting Chess AI Backend")
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
