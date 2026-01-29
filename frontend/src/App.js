import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://chess-backend-production-25ad.up.railway.app/api';

const ChessApp = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
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
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [aiThinking, setAiThinking] = useState(false);

  const apiClient = axios.create({ baseURL: API_BASE_URL });

  // Initialize board
  function initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Black pieces (top)
    board[0][0] = { type: 'rook', color: 'black' };
    board[0][1] = { type: 'knight', color: 'black' };
    board[0][2] = { type: 'bishop', color: 'black' };
    board[0][3] = { type: 'queen', color: 'black' };
    board[0][4] = { type: 'king', color: 'black' };
    board[0][5] = { type: 'bishop', color: 'black' };
    board[0][6] = { type: 'knight', color: 'black' };
    board[0][7] = { type: 'rook', color: 'black' };
    
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
      board[6][i] = { type: 'pawn', color: 'white' };
    }
    
    // White pieces (bottom)
    board[7][0] = { type: 'rook', color: 'white' };
    board[7][1] = { type: 'knight', color: 'white' };
    board[7][2] = { type: 'bishop', color: 'white' };
    board[7][3] = { type: 'queen', color: 'white' };
    board[7][4] = { type: 'king', color: 'white' };
    board[7][5] = { type: 'bishop', color: 'white' };
    board[7][6] = { type: 'knight', color: 'white' };
    board[7][7] = { type: 'rook', color: 'white' };
    
    return board;
  }

  // Get piece symbol with better distinction
  function getPieceSymbol(piece) {
    if (!piece) return '';
    
    const symbols = {
      pawn: piece.color === 'white' ? '♙' : '♟',
      rook: piece.color === 'white' ? '♖' : '♜',
      knight: piece.color === 'white' ? '♘' : '♞',
      bishop: piece.color === 'white' ? '♗' : '♝',
      queen: piece.color === 'white' ? '♕' : '♛',
      king: piece.color === 'white' ? '♔' : '♚'
    };
    
    return symbols[piece.type] || '';
  }

  // Get all possible moves
  function getAllMovesForPiece(boardState, row, col) {
    const piece = boardState[row][col];
    if (!piece) return [];

    let moves = [];
    const { type, color } = piece;

    if (type === 'pawn') {
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;

      if (boardState[row + direction]?.[col] === null) {
        moves.push([row + direction, col]);
        if (row === startRow && boardState[row + 2 * direction]?.[col] === null) {
          moves.push([row + 2 * direction, col]);
        }
      }

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

  // Convert board to FEN-like notation for GPT
  function boardToString(boardState) {
    let boardStr = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (!piece) {
          boardStr += '. ';
        } else {
          const symbol = piece.color === 'white' ? piece.type[0].toUpperCase() : piece.type[0].toLowerCase();
          boardStr += symbol + ' ';
        }
      }
      boardStr += '\n';
    }
    return boardStr;
  }

  // Get AI move using GPT
  async function getGPTMove(boardState) {
    try {
      const boardStr = boardToString(boardState);
      const prompt = `You are a chess AI playing as Black (lowercase pieces). Current board:
${boardStr}

Last move by White: ${moveHistory[moveHistory.length - 1] || 'opening'}

Your difficulty level: ${difficulty}

Provide ONLY the best move in format: from_square to_square (e.g., "e7 e5")
Consider:
- Easy: Make somewhat random legal moves
- Medium: Play decent moves, capture when possible
- Hard: Play optimal strategic moves, control center, protect pieces

Your move:`;

      const response = await apiClient.post('/chess/ai-move', {
        board_state: boardStr,
        difficulty: difficulty
      });

      // Parse response to get move
      return response.data.move || null;
    } catch (error) {
      console.error('GPT API error:', error);
      return null;
    }
  }

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'ongoing' || currentTurn !== 'white' || aiThinking) return;

    const piece = board[row][col];

    if (piece && piece.color === 'white') {
      setSelectedSquare([row, col]);
      setLegalMoves(getAllMovesForPiece(board, row, col));
      return;
    }

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
    const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    setMoveHistory([...moveHistory, moveNotation]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentTurn('black');

    setTimeout(() => {
      makeAIMove(newBoard);
    }, 1500);
  };

  // AI move
  const makeAIMove = async (boardState) => {
    setAiThinking(true);
    
    try {
      // Try GPT first
      const gptMove = await getGPTMove(boardState);
      
      if (gptMove) {
        // Parse GPT move
        const moveParts = gptMove.trim().split(' ');
        if (moveParts.length === 2) {
          const fromSquare = moveParts[0];
          const toSquare = moveParts[1];
          
          const fromCol = fromSquare.charCodeAt(0) - 97;
          const fromRow = 8 - parseInt(fromSquare[1]);
          const toCol = toSquare.charCodeAt(0) - 97;
          const toRow = 8 - parseInt(toSquare[1]);

          if (fromRow >= 0 && fromRow < 8 && fromCol >= 0 && fromCol < 8 &&
              toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
            
            const newBoard = boardState.map(row => [...row]);
            const piece = newBoard[fromRow][fromCol];
            
            if (piece && piece.color === 'black') {
              newBoard[toRow][toCol] = piece;
              newBoard[fromRow][fromCol] = null;

              setBoard(newBoard);
              const moveNotation = `AI: ${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;
              setMoveHistory(prev => [...prev, moveNotation]);
              setCurrentTurn('white');
              setAiThinking(false);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting GPT move:', error);
    }

    // Fallback to random move if GPT fails
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
      const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      const newBoard = boardState.map(row => [...row]);
      const piece = newBoard[randomMove.from[0]][randomMove.from[1]];
      
      newBoard[randomMove.to[0]][randomMove.to[1]] = piece;
      newBoard[randomMove.from[0]][randomMove.from[1]] = null;

      setBoard(newBoard);
      const moveNotation = `AI: ${String.fromCharCode(97 + randomMove.from[1])}${8 - randomMove.from[0]} → ${String.fromCharCode(97 + randomMove.to[1])}${8 - randomMove.to[0]}`;
      setMoveHistory(prev => [...prev, moveNotation]);
      setCurrentTurn('white');
    }

    setAiThinking(false);
  };

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      setIsLoggedIn(true);
      setCurrentPlayer(response.data.user);
      setGameMode('home');
      alert('Login successful!');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      setIsLoggedIn(true);
      setCurrentPlayer(response.data.user);
      setGameMode('home');
      alert('Registration successful!');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPlayer(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setGameMode('menu');
  };

  // Start game
  const startNewGame = () => {
    setBoard(initializeBoard());
    setMoveHistory([]);
    setCurrentTurn('white');
    setGameStatus('ongoing');
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameMode('playing');
  };

  // Render board
  const renderBoard = () => {
    const boardSize = 60;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${boardSize}px)`,
        gap: '0',
        backgroundColor: '#333',
        marginTop: '20px',
        border: '2px solid #666'
      }}>
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
            const isLegal = legalMoves.some(m => m[0] === r && m[1] === c);
            const isLight = (r + c) % 2 === 0;
            
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                style={{
                  width: `${boardSize}px`,
                  height: `${boardSize}px`,
                  backgroundColor: isSelected ? '#e74c3c' : isLegal ? '#2ecc71' : isLight ? '#f0d9b5' : '#b58863',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  cursor: aiThinking || currentTurn !== 'white' ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  fontWeight: 'bold'
                }}
              >
                {piece && getPieceSymbol(piece)}
                {isLegal && (
                  <div style={{
                    position: 'absolute',
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#2ecc71',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={{
        padding: '40px 20px',
        maxWidth: '400px',
        margin: '50px auto',
        backgroundColor: '#1a1a2e',
        color: '#eee',
        borderRadius: '15px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '32px' }}>♔ CHESS MASTER ♔</h1>
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '8px',
              border: 'none',
              boxSizing: 'border-box',
              backgroundColor: '#252541',
              color: '#eee'
            }}
            required
          />
          {isRegistering && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '8px',
                border: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#252541',
                color: '#eee'
              }}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: 'none',
              boxSizing: 'border-box',
              backgroundColor: '#252541',
              color: '#eee'
            }}
            required
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '10px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isRegistering ? 'REGISTER' : 'LOGIN'}
          </button>
        </form>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isRegistering ? 'Already have account? Login' : "Don't have account? Register"}
        </button>
      </div>
    );
  }

  // HOME SCREEN
  if (gameMode === 'home') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        padding: '60px 20px',
        backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            textAlign: 'center',
            fontSize: '48px',
            marginBottom: '15px',
            color: '#fff'
          }}>
            ♔ Chess Master ♔
          </h1>
          <p style={{
            textAlign: 'center',
            fontSize: '18px',
            color: '#bbb',
            marginBottom: '60px'
          }}>
            Challenge your mind against an AI opponent or sharpen your skills in training mode
          </p>

          <div
            onClick={() => setGameMode('menu')}
            style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #333',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '15px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚔️ Play vs AI</div>
              <div style={{ fontSize: '14px', color: '#999' }}>Challenge the AI at three difficulty levels</div>
            </div>
            <div style={{ fontSize: '24px', color: '#f39c12' }}>›</div>
          </div>

          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #333',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '15px',
            opacity: 0.6
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚 Training Mode</div>
            <div style={{ fontSize: '14px', color: '#999' }}>Learn moves, tactics, and strategies</div>
          </div>

          <div style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #333',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '30px',
            opacity: 0.6
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💾 Saved Games</div>
            <div style={{ fontSize: '14px', color: '#999' }}>Continue your previous games</div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  // DIFFICULTY SELECT
  if (gameMode === 'menu') {
    return (
      <div style={{
        padding: '40px 20px',
        maxWidth: '600px',
        margin: '50px auto',
        backgroundColor: '#1a1a2e',
        color: '#eee',
        borderRadius: '15px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Select Difficulty</h2>

        {['easy', 'medium', 'hard'].map(level => (
          <button
            key={level}
            onClick={() => {
              setDifficulty(level);
              startNewGame();
            }}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '10px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {level.toUpperCase()}
          </button>
        ))}

        <button
          onClick={() => setGameMode('home')}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          BACK
        </button>
      </div>
    );
  }

  // GAME SCREEN
  if (gameMode === 'playing') {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', gap: '30px', maxWidth: '1200px' }}>
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <button
                onClick={() => setGameMode('home')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← HOME
              </button>
              <h2>VS AI ({difficulty.toUpperCase()})</h2>
            </div>

            <div style={{
              textAlign: 'center',
              marginBottom: '15px',
              backgroundColor: '#1a1a2e',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <p style={{ marginBottom: '5px' }}>
                Current Turn: <strong style={{ color: currentTurn === 'white' ? '#2ecc71' : '#e74c3c' }}>
                  {currentTurn === 'white' ? '♔ WHITE' : '♚ BLACK'}
                </strong>
              </p>
              <p>Moves: {moveHistory.length}</p>
              {aiThinking && <p style={{ color: '#f39c12', fontWeight: 'bold' }}>🤖 AI is thinking...</p>}
            </div>

            {renderBoard()}

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setBoard(initializeBoard());
                  setMoveHistory([]);
                  setCurrentTurn('white');
                  setGameStatus('ongoing');
                  setSelectedSquare(null);
                  setLegalMoves([]);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                ↻ NEW GAME
              </button>
              <button
                onClick={() => setGameMode('home')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                EXIT
              </button>
            </div>
          </div>

          {/* Move History */}
          <div style={{
            backgroundColor: '#1a1a2e',
            padding: '20px',
            borderRadius: '8px',
            width: '250px',
            height: 'fit-content'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#f39c12' }}>Move History</h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {moveHistory.length > 0 ? (
                moveHistory.map((move, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#252541',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#ddd',
                      borderLeft: `3px solid ${i % 2 === 0 ? '#2ecc71' : '#e74c3c'}`
                    }}
                  >
                    <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{i + 1}.</span> {move}
                  </div>
                ))
              ) : (
                <p style={{ color: '#999', fontSize: '12px' }}>No moves yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default ChessApp;
