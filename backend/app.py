"""
Minimal Chess AI Backend - Just Works Version
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create app
app = Flask(__name__)
CORS(app)

logger.info("Flask app created")
logger.info("CORS enabled")

# ========================
# HEALTH & STATUS ENDPOINTS
# ========================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

@app.route('/api/status', methods=['GET'])
def status():
    """Status endpoint"""
    return jsonify({'status': 'ok', 'service': 'Chess API', 'version': '1.0.0'}), 200

# ========================
# AUTH ENDPOINTS
# ========================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register user"""
    try:
        data = request.get_json() or {}
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
        
        return jsonify({
            'message': 'User registered',
            'user': {
                'id': 1,
                'username': data.get('username'),
                'email': data.get('email', '')
            }
        }), 201
    except Exception as e:
        logger.error(f"Register error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json() or {}
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing credentials'}), 400
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': 1,
                'username': data.get('username')
            }
        }), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

# ========================
# GAME ENDPOINTS
# ========================

@app.route('/api/games', methods=['POST'])
def create_game():
    """Create game"""
    try:
        data = request.get_json() or {}
        return jsonify({
            'message': 'Game created',
            'game': {
                'id': 1,
                'player_id': data.get('player_id', 1),
                'difficulty': data.get('difficulty', 'medium'),
                'status': 'active'
            }
        }), 201
    except Exception as e:
        logger.error(f"Create game error: {str(e)}")
        return jsonify({'error': 'Game creation failed'}), 500

@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get game"""
    return jsonify({
        'id': game_id,
        'difficulty': 'medium',
        'status': 'active'
    }), 200

@app.route('/api/games/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    """Update game"""
    try:
        data = request.get_json() or {}
        return jsonify({
            'message': 'Game updated',
            'game': {'id': game_id}
        }), 200
    except Exception as e:
        logger.error(f"Update game error: {str(e)}")
        return jsonify({'error': 'Update failed'}), 500

# ========================
# RANKINGS ENDPOINTS
# ========================

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    """Get rankings"""
    return jsonify([
        {'id': 1, 'username': 'Player1', 'score': 100},
        {'id': 2, 'username': 'Player2', 'score': 90}
    ]), 200

@app.route('/api/rankings/top', methods=['GET'])
def get_top_rankings():
    """Get top rankings"""
    return jsonify([
        {'id': 1, 'username': 'Player1', 'score': 100}
    ]), 200

# ========================
# TRAINING ENDPOINTS
# ========================

@app.route('/api/training/lessons', methods=['GET'])
def get_lessons():
    """Get lessons"""
    return jsonify([
        {'id': 1, 'title': 'Chess Basics', 'level': 'beginner'},
        {'id': 2, 'title': 'Opening Theory', 'level': 'intermediate'},
        {'id': 3, 'title': 'Endgame Strategy', 'level': 'advanced'}
    ]), 200

# ========================
# AI ENDPOINT
# ========================

@app.route('/api/chess/ai-move', methods=['POST'])
def get_ai_move():
    """Get AI move"""
    try:
        data = request.get_json() or {}
        return jsonify({
            'move': 'e2e4',
            'difficulty': data.get('difficulty', 'medium')
        }), 200
    except Exception as e:
        logger.error(f"AI move error: {str(e)}")
        return jsonify({'error': 'AI move failed', 'move': 'e2e4'}), 200

# ========================
# ERROR HANDLERS
# ========================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

# ========================
# RUN APP
# ========================

if __name__ == '__main__':
    logger.info("Starting backend...")
    app.run(host='0.0.0.0', port=5000, debug=False)
