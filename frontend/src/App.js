import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

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
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [gameId, setGameId] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null); // NEW: Track last move
  const [highlightedSquares, setHighlightedSquares] = useState([]); // NEW: For move highlighting

  // Castling state (NEW)
  const [castlingRights, setCastlingRights] = useState({
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  });

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

  // Get piece symbol with better visibility (NEW)
  function getPieceSymbol(type, color) {
    const symbols = {
      pawn: color === 'white' ? '♙' : '♟',
      rook: color === 'white' ? '♖' : '♜',
      knight: color === 'white' ? '♘' : '♞',
      bishop: color === 'white' ? '♗' : '♝',
      queen: color === 'white' ? '♕' : '♛',
      king: color === 'white' ? '♔' : '♚'
    };
    return symbols[type] || '';
  }

  // Check legal moves including castling (UPDATED)
  function getLegalMoves(boardState, row, col) {
    const piece = boardState[row][col];
    if (!piece) return [];

    let moves = getAllPseudoLegalMoves(boardState, row, col);

    // Add castling moves (NEW)
    if (piece.type === 'king') {
      const castlingMoves = getCastlingMoves(boardState, row, col);
      moves = [...moves, ...castlingMoves];
    }

    // Filter out moves that leave king in check
    const legalMoves = [];
    for (let move of moves) {
      const testBoard = boardState.map(r => [...r]);
      testBoard[move[0]][move[1]] = testBoard[row][col];
      testBoard[row][col] = null;

      if (!isKingInCheck(testBoard, piece.color)) {
        legalMoves.push(move);
      }
    }

    return legalMoves;
  }

  // Check castling moves (NEW)
  function getCastlingMoves(boardState, row, col) {
    const piece = boardState[row][col];
    if (piece.type !== 'king') return [];

    const color = piece.color;
    const castlingMoves = [];

    // Check if in check (can't castle from check)
    if (isKingInCheck(boardState, color)) return [];

    // King-side castling
    if (canCastle(boardState, color, 'kingside', castlingRights)) {
      const destCol = 6;
      castlingMoves.push([row, destCol]);
    }

    // Queen-side castling
    if (canCastle(boardState, color, 'queenside', castlingRights)) {
      const destCol = 2;
      castlingMoves.push([row, destCol]);
    }

    return castlingMoves;
  }

  // Check if castling is legal (NEW)
  function canCastle(boardState, color, side, rights) {
    const row = color === 'white' ? 7 : 0;
    const kingCol = 4;
    const rookCol = side === 'kingside' ? 7 : 0;

    // Check castling rights
    if (!rights[color][side]) return false;

    // Check squares between
    const start = side === 'kingside' ? 5 : 1;
    const end = side === 'kingside' ? 6 : 3;
    for (let c = start; c <= end; c++) {
      if (boardState[row][c] !== null) return false;
    }

    // Check if king moves through check
    const testBoard = boardState.map(r => [...r]);
    const intermediatecol = side === 'kingside' ? 5 : 3;
    testBoard[row][intermediatecol] = boardState[row][kingCol];
    testBoard[row][kingCol] = null;
    if (isKingInCheck(testBoard, color)) return false;

    return true;
  }

  // All pseudo-legal moves (without castling)
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
      const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
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

  // Check if king in check
  function isKingInCheck(boardState, color) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (boardState[r][c]?.type === 'king' && boardState[r][c].color === color) {
          kingPos = [r, c];
          break;
        }
      }
    }
    if (!kingPos) return false;

    const opponentColor = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === opponentColor) {
          const moves = getAllPseudoLegalMoves(boardState, r, c);
          if (moves.some(m => m[0] === kingPos[0] && m[1] === kingPos[1])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Check checkmate
  function isCheckmate(boardState, color) {
    if (!isKingInCheck(boardState, color)) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          if (getLegalMoves(boardState, r, c).length > 0) return false;
        }
      }
    }
    return true;
  }

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'ongoing' || currentTurn !== 'white' || aiThinking) return;

    const piece = board[row][col];

    if (piece && piece.color === 'white') {
      setSelectedSquare([row, col]);
      setLegalMoves(getLegalMoves(board, row, col));
      return;
    }

    if (selectedSquare) {
      const legalMovesForSelected = getLegalMoves(board, selectedSquare[0], selectedSquare[1]);
      const isLegalMove = legalMovesForSelected.some(move => move[0] === row && move[1] === col);

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
    const newBoard = board.map(r => [...r]);
    const piece = newBoard[fromRow][fromCol];

    // Handle castling (NEW)
    if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
      // Castling move
      const newRights = { ...castlingRights };
      newRights[piece.color] = { kingside: false, queenside: false };
      setCastlingRights(newRights);

      if (toCol > fromCol) {
        // King-side
        newBoard[toRow][6] = piece;
        newBoard[toRow][4] = null;
        newBoard[toRow][5] = newBoard[toRow][7];
        newBoard[toRow][7] = null;
      } else {
        // Queen-side
        newBoard[toRow][2] = piece;
        newBoard[toRow][4] = null;
        newBoard[toRow][3] = newBoard[toRow][0];
        newBoard[toRow][0] = null;
      }
    } else {
      // Normal move
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;

      // Update castling rights (NEW)
      if (piece.type === 'king') {
        const newRights = { ...castlingRights };
        newRights[piece.color] = { kingside: false, queenside: false };
        setCastlingRights(newRights);
      }
      if (piece.type === 'rook') {
        const newRights = { ...castlingRights };
        if (fromCol === 0) newRights[piece.color].queenside = false;
        if (fromCol === 7) newRights[piece.color].kingside = false;
        setCastlingRights(newRights);
      }
    }

    const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}-${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    
    // NEW: Show move immediately
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol], notation: moveNotation });
    setHighlightedSquares([
      { row: fromRow, col: fromCol },
      { row: toRow, col: toCol }
    ]);

    setBoard(newBoard);
    setMoveHistory([...moveHistory, moveNotation]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentTurn('black');

    setTimeout(() => {
      if (isCheckmate(newBoard, 'black')) {
        setGameStatus('white_wins');
        return;
      }

      makeAIMove(newBoard, [...moveHistory, moveNotation]);
    }, 1500);
  };

  // AI move (IMPROVED with better visibility)
  const makeAIMove = async (boardState, moves) => {
    setAiThinking(true);

    setTimeout(() => {
      try {
        // Use minimax AI (client-side)
        const bestMove = findBestAIMove(boardState);

        if (bestMove) {
          const newBoard = boardState.map(r => [...r]);
          const piece = newBoard[bestMove.from[0]][bestMove.from[1]];

          newBoard[bestMove.to[0]][bestMove.to[1]] = piece;
          newBoard[bestMove.from[0]][bestMove.from[1]] = null;

          // Update castling rights for AI
          if (piece.type === 'king') {
            const newRights = { ...castlingRights };
            newRights[piece.color] = { kingside: false, queenside: false };
            setCastlingRights(newRights);
          }

          const moveNotation = `${String.fromCharCode(97 + bestMove.from[1])}${8 - bestMove.from[0]}-${String.fromCharCode(97 + bestMove.to[1])}${8 - bestMove.to[0]}`;
          
          // NEW: Show move with highlights
          setLastMove({ 
            from: bestMove.from, 
            to: bestMove.to, 
            notation: moveNotation 
          });
          setHighlightedSquares([
            { row: bestMove.from[0], col: bestMove.from[1] },
            { row: bestMove.to[0], col: bestMove.to[1] }
          ]);

          setBoard(newBoard);
          setMoveHistory([...moves, moveNotation]);

          if (isCheckmate(newBoard, 'white')) {
            setGameStatus('black_wins');
            setAiThinking(false);
            return;
          }

          // Keep highlights for 2 seconds then clear
          setTimeout(() => {
            setHighlightedSquares([]);
          }, 2000);

          setCurrentTurn('white');
          setAiThinking(false);
        }
      } catch (error) {
        console.error('AI move error:', error);
        setAiThinking(false);
      }
    }, 800);
  };

  // Minimax with improved difficulty (IMPROVED)
  function findBestAIMove(boardState) {
    let bestMove = null;
    let bestValue = -Infinity;
    
    const depths = { easy: 1, medium: 2, hard: 3 };
    const maxDepth = depths[difficulty];

    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === 'black') {
          const legalMoves = getLegalMoves(boardState, r, c);
          for (let move of legalMoves) {
            moves.push({
              from: [r, c],
              to: move,
              score: scoreMoveForOrdering(boardState, r, c, move[0], move[1], difficulty)
            });
          }
        }
      }
    }

    moves.sort((a, b) => b.score - a.score);

    const limit = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 16 : moves.length;

    for (let i = 0; i < Math.min(limit, moves.length); i++) {
      const moveObj = moves[i];
      const newBoard = boardState.map(r => [...r]);
      const piece = newBoard[moveObj.from[0]][moveObj.from[1]];
      newBoard[moveObj.to[0]][moveObj.to[1]] = piece;
      newBoard[moveObj.from[0]][moveObj.from[1]] = null;

      const value = minimax(newBoard, 0, -Infinity, Infinity, false, maxDepth, difficulty);

      if (value > bestValue) {
        bestValue = value;
        bestMove = { from: moveObj.from, to: moveObj.to };
      }
    }

    return bestMove;
  }

  // Score moves with difficulty variation (NEW)
  function scoreMoveForOrdering(boardState, fromR, fromC, toR, toC, difficulty) {
    let score = 0;
    const piece = boardState[fromR][fromC];
    const target = boardState[toR][toC];

    // Captures
    if (target) {
      const victimValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
      const captureScore = victimValues[target.type] * 10;

      if (difficulty === 'hard') {
        score += captureScore * 1.3;
      } else if (difficulty === 'medium') {
        score += captureScore * 0.8;
      } else {
        score += captureScore * 0.4;
      }
    }

    // Promotions
    if (piece.type === 'pawn' && toR === 7) {
      score += 900;
    }

    // Center control
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4], [2, 2], [2, 5], [5, 2], [5, 5]];
    if (centerSquares.some(sq => sq[0] === toR && sq[1] === toC)) {
      if (difficulty === 'hard') {
        score += 30;
      } else if (difficulty === 'medium') {
        score += 8;
      }
    }

    // Pawn advancement
    if (piece.type === 'pawn' && difficulty === 'hard') {
      score += (toR - 6) * 3;
    }

    // Add randomness for easy mode
    if (difficulty === 'easy') {
      score += Math.random() * 50;
    } else if (difficulty === 'medium') {
      score += Math.random() * 15;
    }

    return score;
  }

  // Minimax with alpha-beta pruning
  function minimax(boardState, depth, alpha, beta, isMaximizing, maxDepth, difficulty) {
    if (depth === maxDepth) {
      return evaluatePosition(boardState, 'black', difficulty);
    }

    if (isCheckmate(boardState, 'white')) return 10000 + depth;
    if (isCheckmate(boardState, 'black')) return -10000 - depth;

    const color = isMaximizing ? 'black' : 'white';
    let bestValue = isMaximizing ? -Infinity : Infinity;

    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const legalMoves = getLegalMoves(boardState, r, c);
          for (let move of legalMoves) {
            moves.push({
              from: [r, c],
              to: move,
              score: scoreMoveForOrdering(boardState, r, c, move[0], move[1], difficulty)
            });
          }
        }
      }
    }

    moves.sort((a, b) => b.score - a.score);

    for (let moveObj of moves) {
      const newBoard = boardState.map(r => [...r]);
      const piece = newBoard[moveObj.from[0]][moveObj.from[1]];
      newBoard[moveObj.to[0]][moveObj.to[1]] = piece;
      newBoard[moveObj.from[0]][moveObj.from[1]] = null;

      const value = minimax(newBoard, depth + 1, alpha, beta, !isMaximizing, maxDepth, difficulty);

      if (isMaximizing) {
        bestValue = Math.max(bestValue, value);
        alpha = Math.max(alpha, value);
      } else {
        bestValue = Math.min(bestValue, value);
        beta = Math.min(beta, value);
      }

      if (beta <= alpha) break;
    }

    return bestValue;
  }

  // Evaluate position with difficulty variation (IMPROVED)
  function evaluatePosition(boardState, color, difficulty) {
    let score = 0;
    const pieceValues = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          let value = pieceValues[piece.type];

          // Add positional bonuses for harder difficulties
          if (difficulty === 'hard') {
            if (piece.type === 'pawn') {
              const advancement = color === 'black' ? r - 1 : 6 - r;
              value += advancement * 15;
            }
            if (piece.type === 'knight' || piece.type === 'bishop') {
              const inCenter = (r >= 2 && r <= 5 && c >= 2 && c <= 5);
              if (inCenter) value += 60;
            }
            // King centralization in endgame
            if (piece.type === 'king' && countPieces(boardState) < 10) {
              value += (3.5 - Math.abs(r - 3.5) - Math.abs(c - 3.5)) * 10;
            }
          }

          if (piece.color === color) {
            score += value;
          } else {
            score -= value;
          }
        }
      }
    }

    return score;
  }

  // Count pieces for endgame detection
  function countPieces(boardState) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (boardState[r][c]) count++;
      }
    }
    return count;
  }

  // Render board with highlighting (UPDATED)
  function renderBoard() {
    return (
      <div style={{
        display: 'inline-block',
        padding: '10px',
        backgroundColor: '#8b7355',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
      }}>
        {board.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((piece, c) => {
              const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
              const isLegal = legalMoves.some(m => m[0] === r && m[1] === c);
              const isLight = (r + c) % 2 === 0;
              
              const isLastMoveSource = lastMove && lastMove.from[0] === r && lastMove.from[1] === c;
              const isLastMoveDest = lastMove && lastMove.to[0] === r && lastMove.to[1] === c;

              let backgroundColor;
              if (isLastMoveSource) {
                backgroundColor = '#FFF8DC';
              } else if (isLastMoveDest) {
                backgroundColor = '#FFFFCC';
              } else if (isSelected) {
                backgroundColor = '#FF6B6B';
              } else if (isLegal) {
                backgroundColor = '#FFE66D';
              } else {
                backgroundColor = isLight ? '#f0d9b5' : '#b58863';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  style={{
                    width: '70px',
                    height: '70px',
                    padding: '0',
                    border: 'none',
                    backgroundColor: backgroundColor,
                    cursor: currentTurn === 'white' && gameStatus === 'ongoing' ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '54px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s',
                    textShadow: piece?.color === 'white' 
                      ? '0 0 5px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,0.8)' 
                      : '0 0 3px rgba(255,255,255,0.8)',
                    color: piece?.color === 'white' ? '#FFFACD' : '#1a1a1a'
                  }}
                >
                  {piece && getPieceSymbol(piece.type, piece.color)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // NEW: Game info panel
  function renderGameInfo() {
    const isMyTurn = currentTurn === 'white';

    return (
      <div style={{
        padding: '20px',
        backgroundColor: isMyTurn ? '#27ae60' : '#c0392b',
        color: 'white',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease'
      }}>
        {isMyTurn ? (
          <>
            ♔ YOUR TURN (White)
            {lastMove && <div style={{ fontSize: '14px', marginTop: '8px', fontWeight: 'normal', color: '#ecf0f1' }}>
              Last move: <span style={{ color: '#FFFACD' }}>{lastMove.notation}</span>
            </div>}
          </>
        ) : (
          <>
            ♚ AI IS THINKING ({difficulty.toUpperCase()})
            {aiThinking && <div style={{ fontSize: '14px', marginTop: '8px', fontWeight: 'normal' }}>
              ⚡ Calculating best move...
            </div>}
          </>
        )}
      </div>
    );
  }

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#f39c12', marginBottom: '30px', fontSize: '36px' }}>♔ CHESS MASTER</h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#252541',
              color: '#eee',
              boxSizing: 'border-box'
            }}
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
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#252541',
                color: '#eee',
                boxSizing: 'border-box'
              }}
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
              marginBottom: '20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#252541',
              color: '#eee',
              boxSizing: 'border-box'
            }}
          />

          <button
            onClick={() => {
              setIsLoggedIn(true);
              setCurrentPlayerInfo({ username });
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '10px',
              fontSize: '16px'
            }}
          >
            {isRegistering ? 'REGISTER' : 'LOGIN'}
          </button>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isRegistering ? 'Back to Login' : 'Create Account'}
          </button>
        </div>
      </div>
    );
  }

  // MENU
  if (gameMode === 'menu') {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', color: '#f39c12', marginBottom: '40px', fontSize: '48px' }}>♔ CHESS MASTER</h1>

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setGameMode('difficulty')}
              style={{
                width: '100%',
                padding: '20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⚔️ PLAY vs AI
            </button>
          </div>

          <button
            onClick={() => setIsLoggedIn(false)}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  // DIFFICULTY SELECT
  if (gameMode === 'difficulty') {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button
            onClick={() => setGameMode('menu')}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← BACK
          </button>

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
                setSelectedSquare(null);
                setLegalMoves([]);
                setLastMove(null);
                setHighlightedSquares([]);
                setCastlingRights({
                  white: { kingside: true, queenside: true },
                  black: { kingside: true, queenside: true }
                });
                setGameMode('playing');
              }}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: level === 'easy' ? '#3498db' : level === 'medium' ? '#f39c12' : '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                marginBottom: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {level === 'easy' && '⭐ EASY - Beginner'}
              {level === 'medium' && '⭐⭐ MEDIUM - Intermediate'}
              {level === 'hard' && '⭐⭐⭐ HARD - Expert'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // GAME
  if (gameMode === 'playing') {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setGameMode('menu')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ← HOME
            </button>
            <h2 style={{ color: '#f39c12', margin: '0' }}>VS AI - {difficulty.toUpperCase()}</h2>
          </div>

          {renderGameInfo()}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {renderBoard()}
          </div>

          {gameStatus !== 'ongoing' && (
            <div style={{
              padding: '20px',
              backgroundColor: gameStatus === 'white_wins' ? '#27ae60' : '#e74c3c',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {gameStatus === 'white_wins' && '🎉 YOU WIN! 🎉'}
              {gameStatus === 'black_wins' && '😢 AI WINS 😢'}
              {gameStatus === 'draw' && '🤝 DRAW 🤝'}
            </div>
          )}

          <button
            onClick={() => {
              setBoard(initializeBoard());
              setMoveHistory([]);
              setCurrentTurn('white');
              setGameStatus('ongoing');
              setSelectedSquare(null);
              setLegalMoves([]);
              setLastMove(null);
              setHighlightedSquares([]);
              setCastlingRights({
                white: { kingside: true, queenside: true },
                black: { kingside: true, queenside: true }
              });
            }}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '20px'
            }}
          >
            ↻ NEW GAME
          </button>

          <div style={{
            backgroundColor: '#1a1a2e',
            padding: '15px',
            borderRadius: '8px',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: '0', color: '#f39c12' }}>Move History ({moveHistory.length} moves)</h3>
            {moveHistory.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                {moveHistory.map((move, i) => (
                  <div key={i} style={{ color: '#ddd' }}>
                    {i % 2 === 0 && <span style={{ color: '#f39c12' }}>{Math.floor(i / 2) + 1}.</span>} {move}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666' }}>No moves yet - Make your first move!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChessApp;
