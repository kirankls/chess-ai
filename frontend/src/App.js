import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Use environment variable if available, otherwise fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChessApp = () => {
  // Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayer, setCurrentPlayerInfo] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Game State
  const [gameMode, setGameMode] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [gameId, setGameId] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);

  const timerRef = useRef(null);
  const apiClient = axios.create({ baseURL: API_BASE_URL });

  // Initialize board
  function initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const pieces = { 'a': 'rook', 'b': 'knight', 'c': 'bishop', 'd': 'queen', 'e': 'king', 'f': 'bishop', 'g': 'knight', 'h': 'rook' };
    const fileMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };

    for (let file in pieces) {
      board[0][fileMap[file]] = { type: pieces[file], color: 'black' };
      board[1][fileMap[file]] = { type: 'pawn', color: 'black' };
    }

    for (let file in pieces) {
      board[6][fileMap[file]] = { type: 'pawn', color: 'white' };
      board[7][fileMap[file]] = { type: pieces[file], color: 'white' };
    }

    return board;
  }

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      setIsLoggedIn(true);
      setCurrentPlayerInfo(response.data.user);
      setGameMode('menu');
      alert('Login successful!');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      setIsLoggedIn(true);
      setCurrentPlayerInfo(response.data.user);
      setGameMode('menu');
      alert('Registration successful!');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPlayerInfo(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setGameMode('menu');
  };

  // Start new game
  const startNewGame = async () => {
    try {
      const response = await apiClient.post('/games', {
        player_id: currentPlayer.id,
        difficulty: difficulty
      });
      setGameId(response.data.game.id);
      setBoard(initializeBoard());
      setMoveHistory([]);
      setCurrentTurn('white');
      setGameStatus('ongoing');
      setGameMode('playing');
    } catch (error) {
      alert('Failed to create game: ' + error.message);
    }
  };

  // Render chess board
  const renderBoard = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 40px)', gap: '1px', backgroundColor: '#333', padding: '5px' }}>
        {board.map((row, r) =>
          row.map((piece, f) => (
            <div
              key={`${r}-${f}`}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: (r + f) % 2 === 0 ? '#ddd' : '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                cursor: 'pointer',
                border: selectedSquare && selectedSquare[0] === r && selectedSquare[1] === f ? '2px solid red' : 'none'
              }}
              onClick={() => setSelectedSquare([r, f])}
            >
              {piece ? (piece.color === 'white' ? '♙' : '♟') : ''}
            </div>
          ))
        )}
      </div>
    );
  };

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', backgroundColor: '#1a1a2e', color: '#eee', borderRadius: '10px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>♔ CHESS AI ♔</h1>
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none' }}
            required
          />
          {isRegistering && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none' }}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none' }}
            required
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ff8c42',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              fontSize: '16px'
            }}
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isRegistering ? 'Already have account? Login' : "Don't have account? Register"}
        </button>
      </div>
    );
  }

  // Main Menu
  if (gameMode === 'menu') {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto', backgroundColor: '#1a1a2e', color: '#eee', borderRadius: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>♔ CHESS AI ♔</h1>
          <p>Welcome, {currentPlayer?.username}!</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Select Difficulty:</h2>
          {['easy', 'medium', 'hard'].map(level => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              style={{
                marginRight: '10px',
                padding: '10px 20px',
                backgroundColor: difficulty === level ? '#ff8c42' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={startNewGame}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '10px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ▶ NEW GAME
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          LOGOUT
        </button>
      </div>
    );
  }

  // Game Screen
  if (gameMode === 'playing') {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto', backgroundColor: '#1a1a2e', color: '#eee', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => setGameMode('menu')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← MENU
          </button>
          <h2>VS AI ({difficulty.toUpperCase()})</h2>
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <p>Current Turn: <strong>{currentTurn.toUpperCase()}</strong></p>
          <p>Moves: {moveHistory.length}</p>
        </div>

        {renderBoard()}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setBoard(initializeBoard());
              setMoveHistory([]);
              setCurrentTurn('white');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff8c42',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            ↻ NEW GAME
          </button>
          <button
            onClick={() => setGameMode('menu')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            EXIT
          </button>
        </div>
      </div>
    );
  }
};

export default ChessApp;
