import React, { useState, useEffect } from 'react';
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
  const [screenMode, setScreenMode] = useState('home'); // home, menu, playing, training, saved-games
  const [difficulty, setDifficulty] = useState('medium');
  const [trainingTopic, setTrainingTopic] = useState(null);
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [gameMessage, setGameMessage] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [promotionDialog, setPromotionDialog] = useState(null);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [savedGames, setSavedGames] = useState([]);
  const [gameId, setGameId] = useState(Date.now());

  const apiClient = axios.create({ baseURL: API_BASE_URL });

  // Piece square tables
  const pawnTable = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 20, 20, 10, 5, 5],
    [0, 0, 5, 15, 15, 5, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  const knightTable = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ];

  const bishopTable = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 5, 0, 0, 5, 0, -10],
    [-10, 5, 10, 10, 10, 10, 5, -10],
    [-10, 0, 10, 15, 15, 10, 0, -10],
    [-10, 0, 10, 15, 15, 10, 0, -10],
    [-10, 5, 10, 10, 10, 10, 5, -10],
    [-10, 0, 5, 0, 0, 5, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ];

  const rookTable = [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 5, 5, 0, 0, 0]
  ];

  // Training lessons
  const trainingLessons = {
    'piece-movements': {
      title: 'Piece Movements',
      description: 'Learn how each piece moves on the board',
      tips: [
        '♟ Pawn: Moves forward 1 square (2 squares on first move)',
        '♞ Knight: Moves in L-shape (2+1 squares)',
        '♝ Bishop: Moves diagonally any distance',
        '♖ Rook: Moves horizontally/vertically any distance',
        '♕ Queen: Combines bishop and rook movements',
        '♔ King: Moves 1 square in any direction'
      ]
    },
    'opening-principles': {
      title: 'Opening Principles',
      description: 'Essential strategies for starting the game',
      tips: [
        '1. Control the center with pawns (d4, d5, e4, e5)',
        '2. Develop pieces early (knights before bishops)',
        '3. Castle early to protect your king',
        '4. Move each piece only once in opening',
        '5. Do not bring your queen out too early',
        '6. Connect your rooks by moving pieces out'
      ]
    },
    'tactical-basics': {
      title: 'Tactical Basics',
      description: 'Common tactics to win material',
      tips: [
        '🎯 Fork: Attack two pieces at once',
        '🎯 Pin: Attack a piece that cannot move',
        '🎯 Skewer: Attack valuable piece to win lesser one',
        '🎯 Discovered Attack: Move piece to reveal attack',
        '🎯 Double Attack: Attack two targets simultaneously',
        '🎯 Remove Defender: Capture piece defending something'
      ]
    },
    'endgame-basics': {
      title: 'Endgame Basics',
      description: 'How to finish the game with few pieces',
      tips: [
        '1. Activate your king (bring it to center)',
        '2. Passed pawns are very powerful',
        '3. Rook should be behind passed pawn',
        '4. Opposite colored bishops = usually draw',
        '5. Triangulation is key in pawn endgames',
        '6. Push passed pawns forward aggressively'
      ]
    },
    'chess-etiquette': {
      title: 'Chess Etiquette',
      description: 'Proper conduct and fair play',
      tips: [
        '✓ Say "check" when attacking the king',
        '✓ Touch-move rule: You must move touched piece',
        '✓ Resign when position is hopeless',
        '✓ Offer handshake before/after game',
        '✓ Do not distract opponent during game',
        '✓ Learn from losses, celebrate wins humbly'
      ]
    }
  };

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

  // Save game to localStorage
  function saveGame() {
    const gameData = {
      id: gameId,
      timestamp: new Date().toLocaleString(),
      difficulty: difficulty,
      board: board,
      moveHistory: moveHistory,
      currentTurn: currentTurn,
      capturedPieces: capturedPieces,
      gameStatus: gameStatus
    };
    
    const games = JSON.parse(localStorage.getItem('savedGames') || '[]');
    const existingIndex = games.findIndex(g => g.id === gameId);
    
    if (existingIndex >= 0) {
      games[existingIndex] = gameData;
    } else {
      games.push(gameData);
    }
    
    localStorage.setItem('savedGames', JSON.stringify(games));
    alert('Game saved successfully!');
  }

  // Load saved games
  function loadSavedGames() {
    const games = JSON.parse(localStorage.getItem('savedGames') || '[]');
    setSavedGames(games);
    setScreenMode('saved-games');
  }

  // Resume game
  function resumeGame(gameData) {
    setBoard(gameData.board);
    setMoveHistory(gameData.moveHistory);
    setCurrentTurn(gameData.currentTurn);
    setCapturedPieces(gameData.capturedPieces);
    setGameStatus(gameData.gameStatus);
    setDifficulty(gameData.difficulty);
    setGameId(gameData.id);
    setGameMode('playing');
    setScreenMode('playing');
  }

  // Delete saved game
  function deleteSavedGame(id) {
    const games = JSON.parse(localStorage.getItem('savedGames') || '[]');
    const filtered = games.filter(g => g.id !== id);
    localStorage.setItem('savedGames', JSON.stringify(filtered));
    setSavedGames(filtered);
  }

  // Get piece symbol
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

  // Checkmate check
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

  // Stalemate check
  function isStalemate(boardState, color) {
    if (isKingInCheck(boardState, color)) return false;

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
    const tables = { pawn: pawnTable, knight: knightTable, bishop: bishopTable, rook: rookTable };

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

  // Score moves
  function scoreMoveForOrdering(boardState, fromR, fromC, toR, toC) {
    let score = 0;
    const piece = boardState[fromR][fromC];
    const target = boardState[toR][toC];

    if (target) {
      const victimValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
      const attackerValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
      score += victimValues[target.type] * 10 - attackerValues[piece.type];
    }

    if (piece.type === 'pawn') {
      if ((piece.color === 'black' && toR === 7) || (piece.color === 'white' && toR === 0)) {
        score += 800;
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
              score: scoreMoveForOrdering(boardState, r, c, move[0], move[1])
            });
          }
        }
      }
    }
    
    moves.sort((a, b) => b.score - a.score);

    for (let moveObj of moves) {
      const newBoard = boardState.map(row => [...row]);
      const piece = newBoard[moveObj.from[0]][moveObj.from[1]];
      newBoard[moveObj.to[0]][moveObj.to[1]] = piece;
      newBoard[moveObj.from[0]][moveObj.from[1]] = null;

      if (newBoard[moveObj.to[0]][moveObj.to[1]].type === 'pawn') {
        if ((color === 'black' && moveObj.to[0] === 7) || (color === 'white' && moveObj.to[0] === 0)) {
          newBoard[moveObj.to[0]][moveObj.to[1]] = { type: 'queen', color: color };
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

    return bestValue;
  }

  // Find best move
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
              score: scoreMoveForOrdering(boardState, r, c, move[0], move[1])
            });
          }
        }
      }
    }

    moves.sort((a, b) => b.score - a.score);
    
    const limit = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : moves.length;
    
    for (let i = 0; i < Math.min(limit, moves.length); i++) {
      const moveObj = moves[i];
      const newBoard = boardState.map(row => [...row]);
      const piece = newBoard[moveObj.from[0]][moveObj.from[1]];
      newBoard[moveObj.to[0]][moveObj.to[1]] = piece;
      newBoard[moveObj.from[0]][moveObj.from[1]] = null;

      if (newBoard[moveObj.to[0]][moveObj.to[1]].type === 'pawn' && moveObj.to[0] === 7) {
        newBoard[moveObj.to[0]][moveObj.to[1]] = { type: 'queen', color: 'black' };
      }

      const value = minimax(newBoard, 0, -Infinity, Infinity, false, maxDepth);

      if (value > bestValue) {
        bestValue = value;
        bestMove = { from: moveObj.from, to: moveObj.to };
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
      // In hard mode, don't show legal moves
      if (difficulty !== 'hard') {
        setLegalMoves(getLegalMoves(board, row, col));
      }
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
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    const capturedPiece = newBoard[toRow][toCol];
    
    if (capturedPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        white: [...prev.white, capturedPiece]
      }));
    }
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    if (piece.type === 'pawn' && piece.color === 'white' && toRow === 0) {
      setPromotionDialog({ boardState: newBoard, row: toRow, col: toCol });
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    continueMove(newBoard, fromRow, fromCol, toRow, toCol);
  };

  // Continue move
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
    }, 500);
  };

  // AI move
  const makeAIMove = (boardState) => {
    setAiThinking(true);
    
    setTimeout(() => {
      const bestMove = findBestAIMove(boardState);
      
      if (bestMove) {
        const newBoard = boardState.map(row => [...row]);
        const piece = newBoard[bestMove.from[0]][bestMove.from[1]];
        const capturedPiece = newBoard[bestMove.to[0]][bestMove.to[1]];
        
        if (capturedPiece) {
          setCapturedPieces(prev => ({
            ...prev,
            black: [...prev.black, capturedPiece]
          }));
        }
        
        newBoard[bestMove.to[0]][bestMove.to[1]] = piece;
        newBoard[bestMove.from[0]][bestMove.from[1]] = null;

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
    }, 300);
  };

  // Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      setIsLoggedIn(true);
      setCurrentPlayer(response.data.user);
      setScreenMode('home');
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
      setScreenMode('home');
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
    setScreenMode('home');
  };

  // Render captured pieces
  const renderCapturedPieces = (color) => {
    const pieces = capturedPieces[color];
    const pieceValue = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
    const totalValue = pieces.reduce((sum, piece) => sum + pieceValue[piece.type], 0);
    
    return (
      <div style={{
        backgroundColor: '#252541',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: color === 'white' ? '#2ecc71' : '#e74c3c', fontSize: '14px' }}>
          {color === 'white' ? 'WHITE CAPTURES' : 'BLACK CAPTURES'}
        </h4>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          minHeight: '30px'
        }}>
          {pieces.length > 0 ? (
            <>
              {pieces.map((piece, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '20px',
                    padding: '4px 6px',
                    backgroundColor: '#1a1a2e',
                    borderRadius: '4px'
                  }}
                >
                  {getPieceSymbol(piece.type, color)}
                </span>
              ))}
              <span style={{
                fontSize: '12px',
                color: '#999',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center'
              }}>
                Points: {totalValue}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '12px', color: '#666' }}>No captures yet</span>
          )}
        </div>
      </div>
    );
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
          <p style={{ marginBottom: '30px', fontSize: '16px' }}>Choose a piece:</p>
          
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
  if (screenMode === 'home') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        padding: '60px 20px',
        backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', fontSize: '48px', marginBottom: '15px', color: '#fff' }}>
            ♔ Chess Master ♔
          </h1>
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#bbb', marginBottom: '60px' }}>
            Learn, play, and master chess!
          </p>

          {/* Play vs AI */}
          <div
            onClick={() => setScreenMode('menu')}
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
              <div style={{ fontSize: '14px', color: '#999' }}>Challenge the AI - Easy, Medium, Hard</div>
            </div>
            <div style={{ fontSize: '24px', color: '#f39c12' }}>›</div>
          </div>

          {/* Training Mode */}
          <div
            onClick={() => setScreenMode('training')}
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
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚 Training Mode</div>
              <div style={{ fontSize: '14px', color: '#999' }}>Learn piece movements, tactics, and strategy</div>
            </div>
            <div style={{ fontSize: '24px', color: '#f39c12' }}>›</div>
          </div>

          {/* Saved Games */}
          <div
            onClick={loadSavedGames}
            style={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #333',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '30px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💾 Saved Games</div>
              <div style={{ fontSize: '14px', color: '#999' }}>Resume games in progress</div>
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
              fontWeight: 'bold'
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  // TRAINING MODE
  if (screenMode === 'training') {
    return (
      <div style={{
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        color: '#eee'
      }}>
        {trainingTopic ? (
          <>
            <button
              onClick={() => setTrainingTopic(null)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '30px'
              }}
            >
              ← BACK
            </button>

            <div style={{ backgroundColor: '#1a1a2e', padding: '30px', borderRadius: '10px' }}>
              <h2 style={{ color: '#f39c12', marginTop: 0 }}>{trainingLessons[trainingTopic].title}</h2>
              <p style={{ color: '#999', marginBottom: '30px' }}>{trainingLessons[trainingTopic].description}</p>

              <div style={{ backgroundColor: '#252541', padding: '20px', borderRadius: '8px' }}>
                {trainingLessons[trainingTopic].tips.map((tip, i) => (
                  <div key={i} style={{ marginBottom: '15px', fontSize: '16px', lineHeight: '1.6' }}>
                    {tip}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setScreenMode('home')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '30px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                BACK TO HOME
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setScreenMode('home')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '30px'
              }}
            >
              ← BACK
            </button>

            <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#f39c12' }}>📚 Training Mode</h1>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {Object.entries(trainingLessons).map(([key, lesson]) => (
                <div
                  key={key}
                  onClick={() => setTrainingTopic(key)}
                  style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    padding: '20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#f39c12';
                    e.currentTarget.style.transform = 'translateY(-5px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <h3 style={{ color: '#f39c12', marginTop: 0 }}>{lesson.title}</h3>
                  <p style={{ color: '#999', margin: 0 }}>{lesson.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // SAVED GAMES
  if (screenMode === 'saved-games') {
    return (
      <div style={{
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        color: '#eee'
      }}>
        <button
          onClick={() => setScreenMode('home')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '30px'
          }}
        >
          ← BACK
        </button>

        <h1 style={{ marginBottom: '30px', color: '#f39c12' }}>💾 Saved Games</h1>

        {savedGames.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {savedGames.map(game => (
              <div key={game.id} style={{
                backgroundColor: '#1a1a2e',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#f39c12' }}>
                    Difficulty: {game.difficulty.toUpperCase()}
                  </h3>
                  <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '14px' }}>
                    Saved: {game.timestamp}
                  </p>
                  <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
                    Moves: {game.moveHistory.length}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => resumeGame(game)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => deleteSavedGame(game.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: '#1a1a2e',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '18px', color: '#999' }}>No saved games yet</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Start a new game and save it to see it here</p>
          </div>
        )}
      </div>
    );
  }

  // DIFFICULTY SELECT
  if (screenMode === 'menu') {
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
              setCapturedPieces({ white: [], black: [] });
              setCurrentTurn('white');
              setGameStatus('ongoing');
              setGameMessage('');
              setSelectedSquare(null);
              setLegalMoves([]);
              setGameId(Date.now());
              setGameMode('playing');
              setScreenMode('playing');
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
            {level === 'easy' && '⭐ EASY (Hints visible)'}
            {level === 'medium' && '⭐⭐ MEDIUM (Hints visible)'}
            {level === 'hard' && '⭐⭐⭐ HARD (No hints!)'}
          </button>
        ))}

        <button
          onClick={() => setScreenMode('home')}
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
  if (screenMode === 'playing') {
    const isGameOver = gameStatus !== 'ongoing';
    
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1400px', width: '100%' }}>
          {/* Left side - Black captures */}
          <div style={{ width: '200px' }}>
            <div style={{ color: '#eee', textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>🎯 AI (BLACK)</h3>
            </div>
            {renderCapturedPieces('black')}
          </div>

          {/* Center - Board and Game Info */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <button
                onClick={() => setScreenMode('home')}
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
                  {aiThinking && <p style={{ color: '#f39c12', fontWeight: 'bold' }}>⚡ AI thinks...</p>}
                  {difficulty === 'hard' && <p style={{ color: '#f39c12', fontSize: '12px' }}>🔥 No hints in HARD mode!</p>}
                </div>
              )}
            </div>

            {renderBoard()}

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                onClick={saveGame}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                💾 SAVE GAME
              </button>
              <button
                onClick={() => {
                  setBoard(initializeBoard());
                  setMoveHistory([]);
                  setCapturedPieces({ white: [], black: [] });
                  setCurrentTurn('white');
                  setGameStatus('ongoing');
                  setGameMessage('');
                  setSelectedSquare(null);
                  setLegalMoves([]);
                  setGameId(Date.now());
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
                onClick={() => setScreenMode('home')}
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

            <div style={{
              marginTop: '15px',
              backgroundColor: '#1a1a2e',
              padding: '20px',
              borderRadius: '8px',
              width: '480px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#f39c12' }}>Move History</h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '300px',
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

          {/* Right side - White captures */}
          <div style={{ width: '200px' }}>
            <div style={{ color: '#eee', textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#2ecc71', margin: '0 0 10px 0' }}>👤 YOU (WHITE)</h3>
            </div>
            {renderCapturedPieces('white')}
          </div>
        </div>
      </div>
    );
  }
};

export default ChessApp;
