import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Hardcoded backend URL
const API_BASE_URL = 'https://chess-backend-production-25ad.up.railway.app/api';

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
  const [board, setBoard] = useState(createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [gameId, setGameId] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);

  const apiClient = axios.create({ baseURL: API_BASE_URL });

  // Initialize chess board
  function createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Setup pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
      board[6][i] = { type: 'pawn', color: 'white' };
    }

    // Setup back row
    const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: backRow[i], color: 'black' };
      board[7][i] = { type: backRow[i], color: 'white' };
    }

    return board;
  }

  // Get piece symbol
  function getPieceSymbol(piece) {
    if (!piece) return '';
    const symbols = {
      white: { pawn: '♙', rook: '♖', knight: '♘', bishop: '♗', queen: '♕', king: '♔' },
      black: { pawn: '♟', rook: '♜', knight: '♞', bishop: '♝', queen: '♛', king: '♚' }
    };
    return symbols[piece.color][piece.type];
  }

  // Get all possible moves for a piece
  function getAllMovesForPiece(boardState, row, col) {
    const piece = boardState[row][col];
    if (!piece) return [];

    let moves = [];
    const { type, color } = piece;

    if (type === 'pawn') {
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;

      // Forward move
      if (boardState[row + direction]?.[col] === null) {
        moves.push([row + direction, col]);

        // Double move from start
        if (row === startRow && boardState[row + 2 * direction]?.[col] === null) {
          moves.push([row + 2 * direction, col]);
        }
      }

      // Captures
      for (let dc of [-1, 1]) {
        const newRow = row + direction;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const target = boardState[newRow][newCol];
          if (target && target.color !== color) {
            moves.push([newRow, newCol]);
          }
        }
      }
    } else if (type === 'knight') {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (let [dr, dc] of knightMoves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const target = boardState[newRow][newCol];
          if (!target || target.color !== color) {
            moves.push([newRow, newCol]);
          }
        }
      }
    } else if (type === 'bishop' || type === 'rook' || type === 'queen') {
      const directions = type === 'bishop' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] :
        type === 'rook' ? [[-1, 0], [1, 0], [0, -1], [0, 1]] :
        [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];

      for (let [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
          
          const target = boardState[newRow][newCol];
          if (!target) {
            moves.push([newRow, newCol]);
          } else {
            if (target.color !== color) {
              moves.push([newRow, newCol]);
            }
            break;
          }
        }
      }
    } else if (type === 'king') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const target = boardState[newRow][newCol];
            if (!target || target.color !== color) {
              moves.push([newRow, newCol]);
            }
          }
        }
      }
    }

    return moves;
  }

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'ongoing' || currentTurn !== 'white') return;

    const piece = board[row][col];

    // If clicking on own piece, select it
    if (piece && piece.color === 'white') {
      setSelectedSquare([row, col]);
      setLegalMoves(getAllMovesForPiece(board, row, col));
      return;
    }

    // If clicking on a legal move, make the move
    if (selectedSquare) {
      const isLegalMove = legalMoves.some(move => move[0] === row && move[1] === col);
      if (isLegalMove) {
        makeMove(selectedSquare[0], selectedSquare[1], row, col);
        return;
      }
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Make a move
  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    setBoard(newBoard);
    setMoveHistory([...moveHistory, `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentTurn('black');

    // AI makes a move after a short delay
    setTimeout(() => {
      makeAIMove(newBoard);
    }, 1000);
  };

  // AI makes a random move
  const makeAIMove = (boardState) => {
    setAiThinking(true);
    
    // Find all possible moves for black pieces
    let allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === 'black') {
          const moves = getAllMovesForPiece(boardState, r, c);
          for (let move of moves) {
            allMoves.push({ from: [r, c], to: move });
          }
        }
      }
    }

    if (allMoves.length > 0) {
      // Random move
      const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      const newBoard = boardState.map(row => [...row]);
      const piece = newBoard[randomMove.from[0]][randomMove.from[1]];
      
      newBoard[randomMove.to[0]][randomMove.to[1]] = piece;
      newBoard[randomMove.from[0]][randomMove.from[1]] = null;

      setBoard(newBoard);
      setMoveHistory(prev => [...prev, `AI: ${String.fromCharCode(97 + randomMove.from[1])}${8 - randomMove.from[0]} → ${String.fromCharCode(97 + randomMove.to[1])}${8 - randomMove.to[0]}`]);
      setCurrentTurn('white');
    }

    setAiThinking(false);
  };

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
      setBoard(createInitialBoard());
      setMoveHistory([]);
      setCurrentTurn('white');
      setGameStatus('ongoing');
      setSelectedSquare(null);
      setLegalMoves([]);
      setGameMode('playing');
    } catch (error) {
      alert('Failed to create game: ' + error.message);
    }
  };

  // Render chess board
  const renderBoard = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 50px)', gap: '1px', backgroundColor: '#333', padding: '5px', margin: '20px auto' }}>
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
            const isLegal = legalMoves.some(move => move[0] === r && move[1] === c);
            const isLight = (r + c) % 2 === 0;
            
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: isSelected ? '#ff6b6b' : isLegal ? '#4CAF50' : isLight ? '#ddd' : '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid red' : 'none',
                  userSelect: 'none'
                }}
                onClick={() => handleSquareClick(r, c)}
              >
                {getPieceSymbol(piece)}
              </div>
            );
          })
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
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none', boxSizing: 'border-box' }}
            required
          />
          {isRegistering && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none', boxSizing: 'border-box' }}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none', boxSizing: 'border-box' }}
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
      <div style={{ padding: '20px', maxWidth: '700px', margin: '20px auto', backgroundColor: '#1a1a2e', color: '#eee', borderRadius: '10px' }}>
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

        <div style={{ marginBottom: '20px', textAlign: 'center', backgroundColor: '#252541', padding: '15px', borderRadius: '5px' }}>
          <p>Current Turn: <strong style={{ color: currentTurn === 'white' ? '#4CAF50' : '#f44336' }}>{currentTurn.toUpperCase()}</strong></p>
          <p>Moves: {moveHistory.length}</p>
          {aiThinking && <p style={{ color: '#ff8c42' }}>🤖 AI is thinking...</p>}
        </div>

        {renderBoard()}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setBoard(createInitialBoard());
              setMoveHistory([]);
              setCurrentTurn('white');
              setSelectedSquare(null);
              setLegalMoves([]);
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

        <div style={{ marginTop: '20px', backgroundColor: '#252541', padding: '10px', borderRadius: '5px', maxHeight: '100px', overflow: 'auto' }}>
          <p style={{ fontSize: '12px', color: '#aaa' }}>Moves: {moveHistory.join(' | ')}</p>
        </div>
      </div>
    );
  }
};

export default ChessApp;
