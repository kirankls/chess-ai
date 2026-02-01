import React, { useState, useEffect, useRef } from 'react';

const ChessApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayer, setCurrentPlayerInfo] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [screenMode, setScreenMode] = useState('menu');
  const [gameMode, setGameMode] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const dragDataRef = useRef(null);

  const [castlingRights, setCastlingRights] = useState({
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  });

  const [leaderboard, setLeaderboard] = useState({ easy: [], medium: [], hard: [] });
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [trainingTopic, setTrainingTopic] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const trainingLessons = {
    'piece-movements': {
      title: '♞ Piece Movements',
      description: 'Learn how each piece moves',
      tips: ['♙ Pawn: Moves forward 1 square (2 on first move). Captures diagonally.', '♘ Knight: Moves in L-shape (2 squares one direction, 1 perpendicular).', '♗ Bishop: Moves diagonally any number of squares.', '♖ Rook: Moves horizontally or vertically any number of squares.', '♕ Queen: Most powerful! Moves any direction any number of squares.', '♔ King: Moves 1 square in any direction.']
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

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

  function loadLeaderboard() {
    try {
      const data = localStorage.getItem('chessLeaderboard');
      if (data) setLeaderboard(JSON.parse(data));
    } catch (e) {
      console.log('Error loading leaderboard:', e);
    }
  }

  function saveLeaderboard(newLeaderboard) {
    try {
      localStorage.setItem('chessLeaderboard', JSON.stringify(newLeaderboard));
      setLeaderboard(newLeaderboard);
    } catch (e) {
      console.log('Error saving leaderboard:', e);
    }
  }

  function recordWinOnLeaderboard() {
    const newLeaderboard = { ...leaderboard };
    const playerName = currentPlayer?.username || 'Anonymous';
    const entry = { playerName, date: new Date().toLocaleDateString(), moves: moveHistory.length, timestamp: Date.now() };
    newLeaderboard[difficulty].push(entry);
    newLeaderboard[difficulty].sort((a, b) => a.moves - b.moves);
    newLeaderboard[difficulty] = newLeaderboard[difficulty].slice(0, 20);
    saveLeaderboard(newLeaderboard);
  }

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

  function getLegalMoves(boardState, row, col) {
    const piece = boardState[row][col];
    if (!piece) return [];

    let moves = getAllPseudoLegalMoves(boardState, row, col);
    if (piece.type === 'king') {
      const castlingMoves = getCastlingMoves(boardState, row, col);
      moves = [...moves, ...castlingMoves];
    }

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

  function getCastlingMoves(boardState, row, col) {
    const piece = boardState[row][col];
    if (piece.type !== 'king') return [];
    const color = piece.color;
    const castlingMoves = [];
    if (isKingInCheck(boardState, color)) return [];
    if (canCastle(boardState, color, 'kingside', castlingRights)) castlingMoves.push([row, 6]);
    if (canCastle(boardState, color, 'queenside', castlingRights)) castlingMoves.push([row, 2]);
    return castlingMoves;
  }

  function canCastle(boardState, color, side, rights) {
    const row = color === 'white' ? 7 : 0;
    const kingCol = 4;
    if (!rights[color][side]) return false;
    const start = side === 'kingside' ? 5 : 1;
    const end = side === 'kingside' ? 6 : 3;
    for (let c = start; c <= end; c++) {
      if (boardState[row][c] !== null) return false;
    }
    const testBoard = boardState.map(r => [...r]);
    const intermediatecol = side === 'kingside' ? 5 : 3;
    testBoard[row][intermediatecol] = boardState[row][kingCol];
    testBoard[row][kingCol] = null;
    if (isKingInCheck(testBoard, color)) return false;
    return true;
  }

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

  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'ongoing' || currentTurn !== 'white' || aiThinking) return;
    const piece = board[row][col];

    if (piece && piece.color === 'white') {
      setSelectedSquare([row, col]);
      const moves = getLegalMoves(board, row, col);
      if (difficulty !== 'hard') {
        setLegalMoves(moves);
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

  const handleDragStart = (e, row, col) => {
    if (gameStatus !== 'ongoing' || currentTurn !== 'white' || aiThinking) return;
    const piece = board[row][col];
    if (!piece || piece.color !== 'white') return;

    dragDataRef.current = { fromRow: row, fromCol: col };
    const moves = getLegalMoves(board, row, col);
    setSelectedSquare([row, col]);
    if (difficulty !== 'hard') {
      setLegalMoves(moves);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault();
    if (!dragDataRef.current) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const { fromRow, fromCol } = dragDataRef.current;
    const legalMovesForSelected = getLegalMoves(board, fromRow, fromCol);
    const isLegalMove = legalMovesForSelected.some(move => move[0] === toRow && move[1] === toCol);

    if (isLegalMove) {
      makeMove(fromRow, fromCol, toRow, toCol);
    }

    dragDataRef.current = null;
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleDragEnd = () => {
    dragDataRef.current = null;
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(r => [...r]);
    const piece = newBoard[fromRow][fromCol];

    const capturedPiece = newBoard[toRow][toCol];
    if (capturedPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        white: [...prev.white, capturedPiece]
      }));
    }

    if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
      const newRights = { ...castlingRights };
      newRights[piece.color] = { kingside: false, queenside: false };
      setCastlingRights(newRights);

      if (toCol > fromCol) {
        newBoard[toRow][6] = piece;
        newBoard[toRow][4] = null;
        newBoard[toRow][5] = newBoard[toRow][7];
        newBoard[toRow][7] = null;
      } else {
        newBoard[toRow][2] = piece;
        newBoard[toRow][4] = null;
        newBoard[toRow][3] = newBoard[toRow][0];
        newBoard[toRow][0] = null;
      }
    } else {
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;

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
    
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol], notation: moveNotation });
    setBoard(newBoard);
    setMoveHistory([...moveHistory, moveNotation]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentTurn('black');

    makeAIMove(newBoard, [...moveHistory, moveNotation]);
  };

  const makeAIMove = (boardState, moves) => {
    setAiThinking(true);

    const bestMove = findBestAIMove(boardState);

    if (bestMove) {
      const newBoard = boardState.map(r => [...r]);
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

      if (piece.type === 'king') {
        const newRights = { ...castlingRights };
        newRights[piece.color] = { kingside: false, queenside: false };
        setCastlingRights(newRights);
      }

      const moveNotation = `${String.fromCharCode(97 + bestMove.from[1])}${8 - bestMove.from[0]}-${String.fromCharCode(97 + bestMove.to[1])}${8 - bestMove.to[0]}`;
      
      setLastMove({ from: bestMove.from, to: bestMove.to, notation: moveNotation });
      setBoard(newBoard);
      setMoveHistory([...moves, moveNotation]);

      if (isCheckmate(newBoard, 'white')) {
        setGameStatus('black_wins');
        setAiThinking(false);
        return;
      }

      setCurrentTurn('white');
    }
    
    setAiThinking(false);
  };

  const findBestAIMove = (boardState) => {
    let bestMove = null;
    let bestValue = -Infinity;
    
    const depths = { easy: 1, medium: 2, hard: 5 };
    const maxDepth = depths[difficulty];

    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === 'black') {
          const legalMoves = getLegalMoves(boardState, r, c);
          for (let move of legalMoves) {
            const score = scoreMoveForOrdering(boardState, r, c, move[0], move[1]);
            moves.push({ from: [r, c], to: move, score: score });
          }
        }
      }
    }

    moves.sort((a, b) => b.score - a.score);

    // Simple, working move limits
    let limit = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 20;

    for (let i = 0; i < Math.min(limit, moves.length); i++) {
      const moveObj = moves[i];
      const newBoard = boardState.map(r => [...r]);
      const piece = newBoard[moveObj.from[0]][moveObj.from[1]];
      newBoard[moveObj.to[0]][moveObj.to[1]] = piece;
      newBoard[moveObj.from[0]][moveObj.from[1]] = null;

      const value = minimax(newBoard, 0, -Infinity, Infinity, false, maxDepth);

      if (value > bestValue) {
        bestValue = value;
        bestMove = { from: moveObj.from, to: moveObj.to };
      }
    }

    return bestMove || (moves.length > 0 ? { from: moves[0].from, to: moves[0].to } : null);
  };

  const scoreMoveForOrdering = (boardState, fromR, fromC, toR, toC) => {
    let score = 0;
    const piece = boardState[fromR][fromC];
    const target = boardState[toR][toC];

    if (target) {
      const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
      const captureValue = pieceValues[target.type] * 100;
      const attackerValue = pieceValues[piece.type] * 10;
      score += captureValue - attackerValue;
    }

    const testBoard = boardState.map(r => [...r]);
    testBoard[toR][toC] = piece;
    testBoard[fromR][fromC] = null;
    if (isCheckmate(testBoard, 'white')) {
      return 100000;
    }

    if (isKingInCheck(testBoard, 'white')) {
      score += 500;
    }

    if (piece.type === 'pawn' && toR === 7) {
      score += 800;
    }

    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    if (centerSquares.some(sq => sq[0] === toR && sq[1] === toC)) {
      score += 50;
    }

    if (piece.type === 'pawn') {
      score += (6 - toR) * 5;
    }

    return score;
  };

  const minimax = (boardState, depth, alpha, beta, isMaximizing, maxDepth) => {
    if (depth === maxDepth) {
      return evaluatePosition(boardState);
    }

    if (isCheckmate(boardState, 'white')) return 50000 + depth;
    if (isCheckmate(boardState, 'black')) return -50000 - depth;

    const color = isMaximizing ? 'black' : 'white';
    let bestValue = isMaximizing ? -Infinity : Infinity;

    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const legalMoves = getLegalMoves(boardState, r, c);
          for (let move of legalMoves) {
            const moveScore = isMaximizing 
              ? scoreMoveForOrdering(boardState, r, c, move[0], move[1])
              : -scoreMoveForOrdering(boardState, r, c, move[0], move[1]);
            moves.push({ from: [r, c], to: move, score: moveScore });
          }
        }
      }
    }

    moves.sort((a, b) => b.score - a.score);
    const moveLimit = depth >= 3 ? 10 : depth >= 2 ? 15 : 20;

    for (let i = 0; i < Math.min(moveLimit, moves.length); i++) {
      const moveObj = moves[i];
      const newBoard = boardState.map(r => [...r]);
      const piece = newBoard[moveObj.from[0]][moveObj.from[1]];
      newBoard[moveObj.to[0]][moveObj.to[1]] = piece;
      newBoard[moveObj.from[0]][moveObj.from[1]] = null;

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
  };

  const evaluatePosition = (boardState) => {
    let score = 0;
    const pieceValues = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          if (piece.color === 'black') {
            score += value;
          } else {
            score -= value;
          }
        }
      }
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (!piece) continue;

        let posValue = 0;
        const distance = Math.abs(r - 3.5) + Math.abs(c - 3.5);
        posValue += (7 - distance) * 5;

        if (piece.type === 'pawn') {
          if (piece.color === 'black') {
            posValue += (6 - r) * 10;
          } else {
            posValue += (r - 1) * 10;
          }
        }

        if (piece.type === 'knight') {
          if (c === 0 || c === 7 || r === 0 || r === 7) posValue -= 30;
        }

        if (piece.type === 'bishop') {
          const diagonalLength = Math.min(r, c, 7-r, 7-c);
          posValue += diagonalLength * 5;
        }

        if (piece.type === 'rook') {
          let isOpenFile = true;
          for (let i = 0; i < 8; i++) {
            if (i !== r && boardState[i][c] !== null) {
              isOpenFile = false;
              break;
            }
          }
          if (isOpenFile) posValue += 50;
        }

        if (piece.color === 'black') {
          score += posValue;
        } else {
          score -= posValue;
        }
      }
    }

    let blackMobility = 0;
    let whiteMobility = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          const moves = getAllPseudoLegalMoves(boardState, r, c);
          if (piece.color === 'black') {
            blackMobility += moves.length;
          } else {
            whiteMobility += moves.length;
          }
        }
      }
    }

    score += (blackMobility - whiteMobility) * 2;
    return score;
  };

  const renderBoard = () => {
    const squareSize = isMobile ? 45 : 70;
    const fontSize = isMobile ? 36 : 56;

    return (
      <div style={{
        display: 'inline-block',
        padding: isMobile ? '6px' : '10px',
        backgroundColor: '#8b7355',
        borderRadius: isMobile ? '6px' : '8px',
        boxShadow: '0 0 15px rgba(0,0,0,0.5)',
        border: `${isMobile ? 2 : 3}px solid #5a4a3a`
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

              let pieceColor = '#000000';
              let textOutline = '2px 2px 0px #FFFFFF, -2px -2px 0px #FFFFFF, 2px -2px 0px #FFFFFF, -2px 2px 0px #FFFFFF';

              if (piece && piece.color === 'white') {
                pieceColor = '#FFFFFF';
                textOutline = '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  draggable={piece && piece.color === 'white' && gameStatus === 'ongoing' && currentTurn === 'white' && !aiThinking}
                  onDragStart={(e) => handleDragStart(e, r, c)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, r, c)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSquareClick(r, c)}
                  style={{
                    width: `${squareSize}px`,
                    height: `${squareSize}px`,
                    padding: '0',
                    border: 'none',
                    backgroundColor: backgroundColor,
                    cursor: (piece && piece.color === 'white' && gameStatus === 'ongoing' && currentTurn === 'white' && !aiThinking) 
                      ? 'grab' 
                      : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${fontSize}px`,
                    fontWeight: 'bold',
                    textShadow: textOutline,
                    color: pieceColor,
                    transition: 'background-color 0.08s linear',
                    touchAction: 'none'
                  }}
                >
                  {piece && getPieceSymbol(piece.type, piece.color)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderGameInfo = () => {
    const isMyTurn = currentTurn === 'white';
    return (
      <div style={{
        padding: isMobile ? '10px 15px' : '12px 20px',
        backgroundColor: isMyTurn ? '#27ae60' : '#c0392b',
        color: 'white',
        borderRadius: '6px',
        marginBottom: '15px',
        textAlign: 'center',
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: 'bold'
      }}>
        {isMyTurn ? `♔ YOUR TURN` : `♚ AI ${aiThinking ? '⚡' : 'THINKING'}`}
        {lastMove && <div style={{ fontSize: isMobile ? '10px' : '11px', marginTop: '3px' }}>Last: {lastMove.notation}</div>}
      </div>
    );
  };

  const buttonStyle = (bg) => ({
    width: '100%',
    padding: isMobile ? '12px' : '15px',
    backgroundColor: bg,
    color: 'white',
    border: 'none',
    borderRadius: isMobile ? '6px' : '8px',
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '10px'
  });

  const containerStyle = {
    minHeight: '100vh',
    padding: isMobile ? '20px 15px' : '40px 20px',
    backgroundColor: '#0a0a0a',
    color: '#fff'
  };

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        padding: isMobile ? '20px' : '0'
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: isMobile ? '30px 20px' : '40px',
          borderRadius: isMobile ? '8px' : '10px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ color: '#f39c12', marginBottom: '30px', fontSize: isMobile ? '28px' : '36px' }}>♔ CHESS</h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              marginBottom: '10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#252541',
              color: '#eee',
              boxSizing: 'border-box',
              fontSize: isMobile ? '14px' : '16px'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              marginBottom: '20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#252541',
              color: '#eee',
              boxSizing: 'border-box',
              fontSize: isMobile ? '14px' : '16px'
            }}
          />

          <button
            onClick={() => {
              setIsLoggedIn(true);
              setCurrentPlayerInfo({ username });
            }}
            style={buttonStyle('#f39c12')}
          >
            LOGIN
          </button>
        </div>
      </div>
    );
  }

  // MENU
  if (screenMode === 'menu') {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: isMobile ? '100%' : '800px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', color: '#f39c12', marginBottom: '40px', fontSize: isMobile ? '36px' : '48px' }}>♔ CHESS MASTER</h1>

          <button onClick={() => { setGameMode('difficulty'); setScreenMode('game'); }} style={buttonStyle('#f39c12')}>⚔️ PLAY vs AI</button>
          <button onClick={() => setScreenMode('leaderboard')} style={buttonStyle('#2ecc71')}>🏆 LEADERBOARD</button>
          <button onClick={() => setIsLoggedIn(false)} style={buttonStyle('#e74c3c')}>LOGOUT</button>
        </div>
      </div>
    );
  }

  // LEADERBOARD
  if (screenMode === 'leaderboard') {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: isMobile ? '100%' : '1000px', margin: '0 auto' }}>
          <button onClick={() => setScreenMode('menu')} style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>← BACK</button>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#f39c12', fontSize: isMobile ? '28px' : '32px' }}>🏆 LEADERBOARD</h2>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '15px' }}>
            {['easy', 'medium', 'hard'].map(level => (
              <div key={level} style={{ backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${level === 'easy' ? '#2ecc71' : level === 'medium' ? '#f39c12' : '#e74c3c'}` }}>
                <h3 style={{ color: level === 'easy' ? '#2ecc71' : level === 'medium' ? '#f39c12' : '#e74c3c', marginTop: '0', fontSize: isMobile ? '14px' : '16px' }}>
                  {level === 'easy' ? '⭐ EASY' : level === 'medium' ? '⭐⭐ MEDIUM' : '⭐⭐⭐ HARD'}
                </h3>

                {leaderboard[level].slice(0, 10).length > 0 ? (
                  leaderboard[level].slice(0, 10).map((entry, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #333', fontSize: isMobile ? '11px' : '12px' }}>
                      <span style={{ color: '#f39c12', fontWeight: 'bold' }}>#{i + 1}</span>
                      <span style={{ color: '#ddd', flex: 1, marginLeft: '10px' }}>{entry.playerName}</span>
                      <span style={{ color: level === 'easy' ? '#2ecc71' : level === 'medium' ? '#f39c12' : '#e74c3c' }}>{entry.moves}m</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', padding: '15px', fontSize: '12px' }}>No wins yet</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DIFFICULTY
  if (screenMode === 'game' && gameMode === 'difficulty') {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button onClick={() => setScreenMode('menu')} style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>← BACK</button>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: isMobile ? '20px' : '24px' }}>Select Difficulty</h2>
          {['easy', 'medium', 'hard'].map(level => (
            <button key={level} onClick={() => {
              setDifficulty(level);
              setBoard(initializeBoard());
              setMoveHistory([]);
              setCurrentTurn('white');
              setGameStatus('ongoing');
              setSelectedSquare(null);
              setLegalMoves([]);
              setLastMove(null);
              setCastlingRights({ white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } });
              setCapturedPieces({ white: [], black: [] });
              setGameMode('playing');
            }} style={buttonStyle(level === 'easy' ? '#3498db' : level === 'medium' ? '#f39c12' : '#e74c3c')}>
              {level === 'easy' && '⭐ EASY'} {level === 'medium' && '⭐⭐ MEDIUM'} {level === 'hard' && '⭐⭐⭐ HARD'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // GAME
  if (screenMode === 'game' && gameMode === 'playing') {
    return (
      <div style={{ ...containerStyle, padding: isMobile ? '15px' : '20px' }}>
        <div style={{ maxWidth: isMobile ? '100%' : '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
            <button onClick={() => setScreenMode('menu')} style={{ padding: isMobile ? '8px 12px' : '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>← HOME</button>
            <h2 style={{ color: '#f39c12', margin: '0', fontSize: isMobile ? '16px' : '18px' }}>VS AI - {difficulty.toUpperCase()}</h2>
          </div>

          {renderGameInfo()}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', overflowX: 'auto' }}>
            {renderBoard()}
          </div>

          {gameStatus !== 'ongoing' && (
            <div style={{
              padding: '15px',
              backgroundColor: gameStatus === 'white_wins' ? '#27ae60' : '#e74c3c',
              borderRadius: '6px',
              textAlign: 'center',
              marginBottom: '15px',
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 'bold'
            }}>
              {gameStatus === 'white_wins' && '🎉 YOU WIN! 🎉'}
              {gameStatus === 'black_wins' && '😢 AI WINS 😢'}
            </div>
          )}

          <button onClick={() => {
            recordWinOnLeaderboard();
            setBoard(initializeBoard());
            setMoveHistory([]);
            setCurrentTurn('white');
            setGameStatus('ongoing');
            setSelectedSquare(null);
            setLegalMoves([]);
            setLastMove(null);
            setCastlingRights({ white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } });
            setCapturedPieces({ white: [], black: [] });
          }} style={buttonStyle('#f39c12')}>↻ NEW GAME</button>

          <div style={{ backgroundColor: '#1a1a2e', padding: '12px', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            <h3 style={{ marginTop: '0', color: '#f39c12', fontSize: isMobile ? '13px' : '14px' }}>Moves ({moveHistory.length})</h3>
            {moveHistory.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: isMobile ? '12px' : '13px' }}>
                {moveHistory.map((move, i) => (
                  <div key={i} style={{ color: '#ddd' }}>
                    {i % 2 === 0 && <span style={{ color: '#f39c12' }}>{Math.floor(i / 2) + 1}.</span>} {move}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontSize: '12px' }}>No moves yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChessApp;
