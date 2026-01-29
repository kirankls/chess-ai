import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://chess-backend-production-25ad.up.railway.app/api';

const ChessApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [gameMode, setGameMode] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [gameMessage, setGameMessage] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [promotionDialog, setPromotionDialog] = useState(null);

  const apiClient = axios.create({ baseURL: API_BASE_URL });

  // Piece square tables
  const pawnTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5,  10, 25, 25, 10, 5,  5],
    [0,  0,  5,  20, 20, 5,  0,  0],
    [5,  -5, -10, 0,  0,  -10, -5, 5],
    [5,  10, 10,  -20, -20, 10, 10, 5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];

  const knightTable = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0,   0,   0,   0,   -20, -40],
    [-30, 0,   10,  15,  15,  10,  0,   -30],
    [-30, 5,   15,  20,  20,  15,  5,   -30],
    [-30, 0,   15,  20,  20,  15,  0,   -30],
    [-30, 5,   10,  15,  15,  10,  5,   -30],
    [-40, -20, 0,   5,   5,   0,   -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ];

  const bishopTable = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0,   0,   0,   0,   0,   0,   -10],
    [-10, 0,   5,   10,  10,  5,   0,   -10],
    [-10, 5,   5,   10,  10,  5,   5,   -10],
    [-10, 0,   10,  10,  10,  10,  0,   -10],
    [-10, 10,  10,  10,  10,  10,  10,  -10],
    [-10, 5,   0,   0,   0,   0,   5,   -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ];

  const rookTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5,  10, 10, 10, 10, 10, 10, 5],
    [-5, 0,  0,  0,  0,  0,  0,  -5],
    [-5, 0,  0,  0,  0,  0,  0,  -5],
    [-5, 0,  0,  0,  0,  0,  0,  -5],
    [-5, 0,  0,  0,  0,  0,  0,  -5],
    [-5, 0,  0,  0,  0,  0,  0,  -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ];

  const queenTable = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0,   0,   0,  0,  0,   0,   -10],
    [-10, 0,   5,   5,  5,  5,   0,   -10],
    [-5,  0,   5,   5,  5,  5,   0,   -5],
    [0,   0,   5,   5,  5,  5,   0,   -5],
    [-10, 5,   5,   5,  5,  5,   0,   -10],
    [-10, 0,   5,   0,  0,  0,   0,   -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
  ];

  const kingTable = [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20,  20,  0,   0,   0,   0,   20,  20],
    [20,  30,  10,  0,   0,   10,  30,  20]
  ];

  // Initialize board
  function initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
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

  // Find king
  function findKing(boardState, color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.type === 'king' && piece.color === color) {
          return [r, c];
        }
      }
    }
    return null;
  }

  // Check if square attacked
  function isSquareAttacked(boardState, row, col, byColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === byColor) {
          const moves = getAllPseudoLegalMoves(boardState, r, c);
          if (moves.some(move => move[0] === row && move[1] === col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Check if king in check
  function isKingInCheck(boardState, color) {
    const kingPos = findKing(boardState, color);
    if (!kingPos) return false;
    const opponentColor = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(boardState, kingPos[0], kingPos[1], opponentColor);
  }

  // Pseudo legal moves
  function getAllPseudoLegalMoves(boardState, row, col) {
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

  // Get legal moves
  function getLegalMoves(boardState, row, col) {
    const piece = boardState[row][col];
    if (!piece) return [];

    const pseudoMoves = getAllPseudoLegalMoves(boardState, row, col);
    const legalMoves = [];

    for (let move of pseudoMoves) {
      const testBoard = boardState.map(r => [...r]);
      testBoard[move[0]][move[1]] = testBoard[row][col];
      testBoard[row][col] = null;

      if (!isKingInCheck(testBoard, piece.color)) {
        legalMoves.push(move);
      }
    }

    return legalMoves;
  }

  // Check checkmate
  function isCheckmate(boardState, color) {
    if (!isKingInCheck(boardState, color)) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const moves = getLegalMoves(boardState, r, c);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }

  // Check stalemate
  function isStalemate(boardState, color) {
    if (isKingInCheck(boardState, color)) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const moves = getLegalMoves(boardState, r, c);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }

  // Promote pawn
  function promotePawn(boardState, row, col, newType) {
    const newBoard = boardState.map(r => [...r]);
    const pawn = newBoard[row][col];
    if (pawn && pawn.type === 'pawn') {
      newBoard[row][col] = { type: newType, color: pawn.color };
    }
    return newBoard;
  }

  // Position evaluation
  function evaluatePosition(boardState, color) {
    let score = 0;
    const pieceValues = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 };
    const tables = { pawn: pawnTable, knight: knightTable, bishop: bishopTable, rook: rookTable, queen: queenTable, king: kingTable };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          let pieceScore = pieceValues[piece.type];
          
          const positionTable = tables[piece.type];
          if (positionTable) {
            const adjustedRow = piece.color === 'white' ? 7 - r : r;
            pieceScore += positionTable[adjustedRow][c];
          }

          const mobilityMoves = getLegalMoves(boardState, r, c);
          pieceScore += mobilityMoves.length * 2;

          if (piece.color === color) {
            score += pieceScore;
          } else {
            score -= pieceScore;
          }
        }
      }
    }

    return score;
  }

  // Minimax
  function minimax(boardState, depth, alpha, beta, isMaximizing, maxDepth) {
    if (depth === maxDepth) {
      return evaluatePosition(boardState, 'black');
    }

    if (isCheckmate(boardState, 'white')) return 10000 + depth;
    if (isCheckmate(boardState, 'black')) return -10000 - depth;
    if (isStalemate(boardState, isMaximizing ? 'black' : 'white')) return 0;

    const color = isMaximizing ? 'black' : 'white';
    let bestValue = isMaximizing ? -Infinity : Infinity;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const moves = getLegalMoves(boardState, r, c);
          
          for (let move of moves) {
            const newBoard = boardState.map(row => [...row]);
            newBoard[move[0]][move[1]] = newBoard[r][c];
            newBoard[r][c] = null;

            // Check for pawn promotion
            if (newBoard[move[0]][move[1]].type === 'pawn') {
              if ((color === 'black' && move[0] === 7) || (color === 'white' && move[0] === 0)) {
                newBoard[move[0]][move[1]] = { type: 'queen', color: color };
              }
            }

            const value = minimax(newBoard, depth + 1, alpha, beta, !isMaximizing, maxDepth);

            if (isMaximizing) {
              bestValue = Math.max(bestValue, value);
              alpha = Math.max(alpha, value);
            } else {
              bestValue = Math.min(bestValue, value);
              beta = Math.min(beta, value);
            }

            if (beta <= alpha) break;
          }
        }
      }
    }

    return bestValue;
  }

  // Find best AI move
  function findBestAIMove(boardState) {
    let bestMove = null;
    let bestValue = -Infinity;
    const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === 'black') {
          const moves = getLegalMoves(boardState, r, c);
          
          for (let move of moves) {
            const newBoard = boardState.map(row => [...row]);
            newBoard[move[0]][move[1]] = newBoard[r][c];
            newBoard[r][c] = null;

            // Auto-promote to queen for AI
            if (newBoard[move[0]][move[1]].type === 'pawn' && move[0] === 7) {
              newBoard[move[0]][move[1]] = { type: 'queen', color: 'black' };
            }

            const value = minimax(newBoard, 0, -Infinity, Infinity, false, depth);

            if (value > bestValue) {
              bestValue = value;
              bestMove = { from: [r, c], to: move };
            }
          }
        }
      }
    }

    return bestMove;
  }

  // Render piece
  function renderPiece(piece) {
    if (!piece) return null;
    const isBlack = piece.color === 'black';
    const symbols = {
      pawn: isBlack ? '♟' : '♙',
      rook: isBlack ? '♜' : '♖',
      knight: isBlack ? '♞' : '♘',
      bishop: isBlack ? '♝' : '♗',
      queen: isBlack ? '♛' : '♕',
      king: isBlack ? '♚' : '♔'
    };

    return (
      <div style={{
        fontSize: 90,
        fontWeight: 'bold',
        color: isBlack ? '#000000' : '#FFFFFF',
        textShadow: isBlack 
          ? '0 0 0 2px #000000, 0 0 3px rgba(0,0,0,0.8)' 
          : '0 0 0 2px #CCCCCC, 0 0 3px rgba(100,100,100,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        filter: isBlack ? 'brightness(0.9)' : 'brightness(1.1)'
      }}>
        {symbols[piece.type]}
      </div>
    );
  }

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'ongoing' || currentTurn !== 'white' || aiThinking || promotionDialog) return;

    const piece = board[row][col];

    if (piece && piece.color === 'white') {
      setSelectedSquare([row, col]);
      setLegalMoves(getLegalMoves(board, row, col));
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

  // Make move
  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    // Check for pawn promotion (white pawn reaches row 0)
    if (piece.type === 'pawn' && piece.color === 'white' && toRow === 0) {
      setPromotionDialog({ boardState: newBoard, row: toRow, col: toCol });
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    continueMove(newBoard, fromRow, fromCol, toRow, toCol);
  };

  // Continue move after promotion
  const continueMove = (newBoard, fromRow, fromCol, toRow, toCol) => {
    setBoard(newBoard);
    const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    setMoveHistory([...moveHistory, moveNotation]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentTurn('black');

    setTimeout(() => {
      if (isCheckmate(newBoard, 'black')) {
        setGameStatus('white_wins');
        setGameMessage('White wins! Black is checkmate!');
        return;
      }
      if (isStalemate(newBoard, 'black')) {
        setGameStatus('draw');
        setGameMessage('Draw! Black is in stalemate!');
        return;
      }

      makeAIMove(newBoard);
    }, 1200);
  };

  // AI move
  const makeAIMove = (boardState) => {
    setAiThinking(true);
    
    setTimeout(() => {
      const bestMove = findBestAIMove(boardState);
      
      if (bestMove) {
        const newBoard = boardState.map(row => [...row]);
        const piece = newBoard[bestMove.from[0]][bestMove.from[1]];
        
        newBoard[bestMove.to[0]][bestMove.to[1]] = piece;
        newBoard[bestMove.from[0]][bestMove.from[1]] = null;

        // Auto-promote black pawn to queen
        if (newBoard[bestMove.to[0]][bestMove.to[1]].type === 'pawn' && bestMove.to[0] === 7) {
          newBoard[bestMove.to[0]][bestMove.to[1]] = { type: 'queen', color: 'black' };
        }

        setBoard(newBoard);
        const moveNotation = `AI: ${String.fromCharCode(97 + bestMove.from[1])}${8 - bestMove.from[0]} → ${String.fromCharCode(97 + bestMove.to[1])}${8 - bestMove.to[0]}`;
        setMoveHistory(prev => [...prev, moveNotation]);
        
        if (isCheckmate(newBoard, 'white')) {
          setGameStatus('black_wins');
          setGameMessage('Black wins! White is checkmate!');
          setAiThinking(false);
          return;
        }
        if (isStalemate(newBoard, 'white')) {
          setGameStatus('draw');
          setGameMessage('Draw! White is in stalemate!');
          setAiThinking(false);
          return;
        }

        setCurrentTurn('white');
      }

      setAiThinking(false);
    }, 1000);
  };

  // Auth
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

  // Render board
  const renderBoard = () => {
    const squareSize = 90;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${squareSize}px)`,
        gap: '0',
        backgroundColor: '#333',
        marginTop: '20px',
        border: '4px solid #333'
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
                  width: `${squareSize}px`,
                  height: `${squareSize}px`,
                  backgroundColor: isSelected ? '#e74c3c' : isLegal ? '#2ecc71' : isLight ? '#f0d9b5' : '#b58863',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: aiThinking || currentTurn !== 'white' ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              >
                {piece && renderPiece(piece)}
                {isLegal && (
                  <div style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#2ecc71',
                    borderRadius: '50%',
                    opacity: 0.8,
                    border: '2px solid #1abc9c'
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Promotion Dialog
  if (promotionDialog) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center',
          color: '#eee'
        }}>
          <h2 style={{ marginBottom: '30px', color: '#f39c12' }}>♙ Pawn Promotion!</h2>
          <p style={{ marginBottom: '30px', fontSize: '16px' }}>Choose a piece to promote your pawn to:</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {['queen', 'rook', 'bishop', 'knight'].map(type => (
              <button
                key={type}
                onClick={() => {
                  const promotedBoard = promotePawn(promotionDialog.boardState, promotionDialog.row, promotionDialog.col, type);
                  setPromotionDialog(null);
                  continueMove(promotedBoard, 0, 0, 0, 0);
                }}
                style={{
                  padding: '20px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e67e22'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f39c12'}
              >
                {type === 'queen' && '♕ Queen'}
                {type === 'rook' && '♖ Rook'}
                {type === 'bishop' && '♗ Bishop'}
                {type === 'knight' && '♘ Knight'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LOGIN
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

  // HOME
  if (gameMode === 'home') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        padding: '60px 20px',
        backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', fontSize: '48px', marginBottom: '15px', color: '#fff' }}>
            ♔ Chess Master ♔
          </h1>
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#bbb', marginBottom: '60px' }}>
            Challenge your mind against an intelligent AI opponent
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
              <div style={{ fontSize: '14px', color: '#999' }}>Three difficulty levels</div>
            </div>
            <div style={{ fontSize: '24px', color: '#f39c12' }}>›</div>
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
              fontWeight: 'bold',
              marginTop: '40px'
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  // DIFFICULTY
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
              setBoard(initializeBoard());
              setMoveHistory([]);
              setCurrentTurn('white');
              setGameStatus('ongoing');
              setGameMessage('');
              setSelectedSquare(null);
              setLegalMoves([]);
              setGameMode('playing');
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

  // GAME
  if (gameMode === 'playing') {
    const isGameOver = gameStatus !== 'ongoing';
    
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
              borderRadius: '8px',
              border: isGameOver ? '2px solid #f39c12' : 'none'
            }}>
              {isGameOver ? (
                <div>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#f39c12', marginBottom: '5px' }}>
                    {gameMessage}
                  </p>
                  <p style={{ marginTop: '10px' }}>Game Over!</p>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '5px' }}>
                    Current Turn: <strong style={{ color: currentTurn === 'white' ? '#2ecc71' : '#e74c3c' }}>
                      {currentTurn === 'white' ? '♔ WHITE' : '♚ BLACK'}
                    </strong>
                  </p>
                  <p>Moves: {moveHistory.length}</p>
                  {aiThinking && <p style={{ color: '#f39c12', fontWeight: 'bold' }}>🤖 Thinking...</p>}
                </div>
              )}
            </div>

            {renderBoard()}

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setBoard(initializeBoard());
                  setMoveHistory([]);
                  setCurrentTurn('white');
                  setGameStatus('ongoing');
                  setGameMessage('');
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
