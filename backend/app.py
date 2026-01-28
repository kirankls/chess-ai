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

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chess.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# Initialize database
db = SQLAlchemy(app)

# Set OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

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
    difficulty = db.Column(db.String(20), nullable=False)  # easy, medium, hard
    moves = db.Column(db.Text)  # JSON array of moves
    board_state = db.Column(db.Text)  # Final board state
    result = db.Column(db.String(20))  # win, loss, draw
    completion_time = db.Column(db.Integer)  # seconds
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
    completion_time = db.Column(db.Integer, nullable=False)  # seconds
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
# API ROUTES
# ========================

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if server is running"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})


# ========================
# PLAYER ROUTES
# ========================

@app.route('/api/players/register', methods=['POST'])
def register():
    """Register a new player"""
    data = request.get_json()
    
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Player.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    player = Player(
        username=data['username'],
        email=data['email']
    )
    player.set_password(data['password'])
    
    db.session.add(player)
    db.session.commit()
    
    return jsonify({
        'message': 'Player registered successfully',
        'player': player.to_dict()
    }), 201


@app.route('/api/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    """Get player profile"""
    player = Player.query.get_or_404(player_id)
    return jsonify(player.to_dict())


@app.route('/api/players/<int:player_id>', methods=['PUT'])
def update_player(player_id):
    """Update player profile"""
    player = Player.query.get_or_404(player_id)
    data = request.get_json()
    
    if 'email' in data:
        player.email = data['email']
    
    db.session.commit()
    return jsonify(player.to_dict())


# ========================
# CHESS AI ROUTES
# ========================

def is_valid_move(board, from_pos, to_pos, piece):
    """Validate if a move is legal in chess"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    # Basic boundary check
    if not (0 <= to_row < 8 and 0 <= to_col < 8):
        return False
    
    target = board[to_row][to_col]
    
    # Can't capture own pieces
    if target and target.get('color') == piece.get('color'):
        return False
    
    # Piece-specific move validation
    piece_type = piece.get('type')
    
    if piece_type == 'pawn':
        direction = -1 if piece['color'] == 'white' else 1
        # Forward move
        if from_col == to_col and not target:
            if to_row == from_row + direction:
                return True
            # Two-square initial move
            if (from_row == 6 and piece['color'] == 'white') or (from_row == 1 and piece['color'] == 'black'):
                if to_row == from_row + 2 * direction and not board[from_row + direction][from_col]:
                    return True
        # Capture
        if abs(from_col - to_col) == 1 and to_row == from_row + direction and target:
            return True
        return False
    
    elif piece_type == 'knight':
        row_diff = abs(to_row - from_row)
        col_diff = abs(to_col - from_col)
        return (row_diff == 2 and col_diff == 1) or (row_diff == 1 and col_diff == 2)
    
    elif piece_type == 'king':
        return abs(to_row - from_row) <= 1 and abs(to_col - from_col) <= 1
    
    elif piece_type in ['rook', 'bishop', 'queen']:
        # Check path is clear
        row_dir = 0 if from_row == to_row else (1 if to_row > from_row else -1)
        col_dir = 0 if from_col == to_col else (1 if to_col > from_col else -1)
        
        # Rook/Queen can't move diagonally (unless queen or bishop)
        if piece_type == 'rook' and row_dir != 0 and col_dir != 0:
            return False
        
        # Bishop/Queen can't move straight (unless queen or rook)
        if piece_type == 'bishop' and (row_dir == 0 or col_dir == 0):
            return False
        
        # Check path is clear
        r, c = from_row + row_dir, from_col + col_dir
        while (r, c) != (to_row, to_col):
            if board[r][c]:
                return False
            r += row_dir
            c += col_dir
        
        return True
    
    return False


@app.route('/api/chess/validate-move', methods=['POST'])
def validate_move():
    """Validate a chess move"""
    data = request.get_json()
    board = data.get('board')
    from_pos = data.get('from_pos')
    to_pos = data.get('to_pos')
    
    piece = board[from_pos[0]][from_pos[1]]
    if not piece:
        return jsonify({'valid': False, 'error': 'No piece at source'}), 400
    
    valid = is_valid_move(board, from_pos, to_pos, piece)
    return jsonify({'valid': valid})


@app.route('/api/chess/get-legal-moves', methods=['POST'])
def get_legal_moves():
    """Get all legal moves for a piece"""
    data = request.get_json()
    board = data.get('board')
    row = data.get('row')
    col = data.get('col')
    
    piece = board[row][col]
    if not piece:
        return jsonify({'legal_moves': []}), 400
    
    legal_moves = []
    for to_row in range(8):
        for to_col in range(8):
            if is_valid_move(board, (row, col), (to_row, to_col), piece):
                legal_moves.append({'row': to_row, 'col': to_col})
    
    return jsonify({'legal_moves': legal_moves})


@app.route('/api/chess/ai-move', methods=['POST'])
def ai_move():
    """Get AI move using OpenAI"""
    data = request.get_json()
    board = data.get('board')
    difficulty = data.get('difficulty', 'medium')
    
    try:
        # Format board state for AI
        board_str = json.dumps(board)
        
        system_prompt = f"""You are an expert chess AI playing as Black. 
        Analyze the chess board position and suggest ONE best move.
        Difficulty level: {difficulty}
        
        Respond with ONLY a JSON object:
        {{"from_row": 0, "from_col": 0, "to_row": 0, "to_col": 0}}
        
        Use 0-based indexing. Row 0 is rank 8, row 7 is rank 1.
        Column 0 is file 'a', column 7 is file 'h'.
        """
        
        user_prompt = f"""Current board state:
        {board_str}
        
        Find the best move for Black piece (move from a Black piece to an empty square or capture a White piece).
        Analyze the position and suggest one strong move."""
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7 if difficulty == 'easy' else (0.5 if difficulty == 'medium' else 0.3),
            max_tokens=100
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON from response
        json_match = re.search(r'\{[^}]+\}', response_text)
        if json_match:
            move = json.loads(json_match.group())
            return jsonify({
                'move': move,
                'from_row': move.get('from_row'),
                'from_col': move.get('from_col'),
                'to_row': move.get('to_row'),
                'to_col': move.get('to_col')
            })
        else:
            # Fallback: return default move
            return jsonify({'error': 'Could not parse move', 'move': None}), 400
    
    except Exception as e:
        print(f"Error in AI move: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chess/detect-checkmate', methods=['POST'])
def detect_checkmate():
    """Detect if position is checkmate"""
    data = request.get_json()
    board = data.get('board')
    player_color = data.get('player_color')
    
    try:
        board_str = json.dumps(board)
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a chess expert. Analyze if the given position is checkmate for the specified player."
                },
                {
                    "role": "user",
                    "content": f"""Board state: {board_str}
                    
                    Is {player_color} in checkmate? Answer with only 'yes' or 'no'."""
                }
            ],
            max_tokens=10,
            temperature=0
        )
        
        answer = response.choices[0].message.content.strip().lower()
        is_checkmate = 'yes' in answer
        
        return jsonify({'is_checkmate': is_checkmate})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========================
# GAME ROUTES
# ========================

@app.route('/api/games', methods=['POST'])
def create_game():
    """Create a new game record"""
    data = request.get_json()
    
    game = Game(
        player_id=data.get('player_id'),
        difficulty=data.get('difficulty'),
        moves='[]'
    )
    
    db.session.add(game)
    db.session.commit()
    
    return jsonify(game.to_dict()), 201


@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get game details"""
    game = Game.query.get_or_404(game_id)
    return jsonify(game.to_dict())


@app.route('/api/games/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    """Update game record"""
    game = Game.query.get_or_404(game_id)
    data = request.get_json()
    
    if 'moves' in data:
        game.moves = json.dumps(data['moves'])
    if 'board_state' in data:
        game.board_state = json.dumps(data['board_state'])
    if 'result' in data:
        game.result = data['result']
    if 'completion_time' in data:
        game.completion_time = data['completion_time']
    
    db.session.commit()
    return jsonify(game.to_dict())


@app.route('/api/games/player/<int:player_id>', methods=['GET'])
def get_player_games(player_id):
    """Get all games for a player"""
    games = Game.query.filter_by(player_id=player_id).all()
    return jsonify([game.to_dict() for game in games])


# ========================
# RANKING ROUTES
# ========================

@app.route('/api/rankings', methods=['POST'])
def submit_ranking():
    """Submit a ranking"""
    data = request.get_json()
    
    ranking = Ranking(
        player_id=data.get('player_id'),
        difficulty=data.get('difficulty'),
        completion_time=data.get('completion_time')
    )
    
    db.session.add(ranking)
    db.session.commit()
    
    # Update rank position
    same_difficulty_rankings = Ranking.query.filter_by(
        difficulty=data.get('difficulty')
    ).order_by(Ranking.completion_time).all()
    
    for idx, rank in enumerate(same_difficulty_rankings, 1):
        rank.rank_position = idx
    
    db.session.commit()
    
    return jsonify(ranking.to_dict()), 201


@app.route('/api/rankings/difficulty/<difficulty>', methods=['GET'])
def get_rankings_by_difficulty(difficulty):
    """Get rankings for specific difficulty"""
    limit = request.args.get('limit', 10, type=int)
    rankings = Ranking.query.filter_by(
        difficulty=difficulty
    ).order_by(Ranking.completion_time).limit(limit).all()
    
    return jsonify([rank.to_dict() for rank in rankings])


@app.route('/api/rankings/top', methods=['GET'])
def get_top_rankings():
    """Get top rankings across all difficulties"""
    limit = request.args.get('limit', 10, type=int)
    
    result = {}
    for difficulty in ['easy', 'medium', 'hard']:
        rankings = Ranking.query.filter_by(
            difficulty=difficulty
        ).order_by(Ranking.completion_time).limit(limit).all()
        result[difficulty] = [rank.to_dict() for rank in rankings]
    
    return jsonify(result)


@app.route('/api/rankings/player/<int:player_id>', methods=['GET'])
def get_player_rankings(player_id):
    """Get rankings for a specific player"""
    rankings = Ranking.query.filter_by(player_id=player_id).all()
    return jsonify([rank.to_dict() for rank in rankings])


# ========================
# TRAINING ROUTES
# ========================

@app.route('/api/training/lessons', methods=['GET'])
def get_lessons():
    """Get training lessons"""
    lessons = [
        {
            'id': 1,
            'name': 'Piece Movements',
            'description': 'Learn how each piece moves',
            'content': 'Pawns move forward 1 square (or 2 from start). Rooks move horizontally or vertically. Bishops move diagonally. Knights move in L-shapes (2+1). Queens combine rook and bishop. Kings move 1 square in any direction.'
        },
        {
            'id': 2,
            'name': 'Basic Checkmate Patterns',
            'description': 'Master fundamental checkmate patterns',
            'content': 'Back Rank Mate: Trap king on back rank. Two Rook Mate: Coordinate rooks. Fool\'s Mate: 2-move mate. Scholar\'s Mate: 4-move mate. Smothered Mate: Knight mate with blocked king.'
        },
        {
            'id': 3,
            'name': 'Opening Principles',
            'description': 'Understand good opening strategies',
            'content': 'Control center (d4, e4, d5, e5). Develop pieces (knights, bishops first). Castle early for safety. Avoid moving same piece twice. Keep queen protected.'
        },
        {
            'id': 4,
            'name': 'Tactical Puzzles',
            'description': 'Solve tactical puzzles',
            'content': 'Pins: Restrict movement. Forks: Attack two pieces. Skewers: Force valuable piece away. Discovered Attack: Move to reveal attack. X-Ray: Attack through pieces.'
        }
    ]
    return jsonify(lessons)


@app.route('/api/training/generate-puzzle', methods=['POST'])
def generate_puzzle():
    """Generate tactical puzzle using OpenAI"""
    data = request.get_json()
    difficulty = data.get('difficulty', 'medium')
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": f"Generate a chess puzzle at {difficulty} level. Provide a description of the position and the solution."
                },
                {
                    "role": "user",
                    "content": "Create a tactical chess puzzle for training."
                }
            ],
            max_tokens=500,
            temperature=0.8
        )
        
        puzzle = response.choices[0].message.content.strip()
        
        return jsonify({
            'puzzle': puzzle,
            'difficulty': difficulty
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========================
# ERROR HANDLERS
# ========================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ========================
# DATABASE INITIALIZATION
# ========================

@app.before_request
def create_tables():
    """Create database tables if they don't exist"""
    db.create_all()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
