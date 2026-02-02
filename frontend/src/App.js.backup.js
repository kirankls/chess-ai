import React, { useState, useEffect, useRef } from 'react';

const ChessApp = () => {
  // Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayer, setCurrentPlayerInfo] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // ✅ Account storage in localStorage
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('chessAccounts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Navigation
  const [screenMode, setScreenMode] = useState('menu');

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
  const [lastMove, setLastMove] = useState(null);
  const dragDataRef = useRef(null);

  // Castling state
  const [castlingRights, setCastlingRights] = useState({
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  });

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState({ easy: [], medium: [], hard: [] });
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [trainingTopic, setTrainingTopic] = useState(null);

  const trainingLessons = {
    'piece-movements': {
      title: '♞ Piece Movements',
      description: 'Learn how each piece moves',
      tips: ['♙ Pawn: Moves forward 1 square (2 on first move). Captures diagonally.', '♘ Knight: Moves in L-shape (2 squares one direction, 1 perpendicular).', '♗ Bishop: Moves diagonally any number of squares.', '♖ Rook: Moves horizontally or vertically any number of squares.', '♕ Queen: Most powerful! Moves any direction any number of squares.', '♔ King: Moves 1 square in any direction.']
    },
    'opening-principles': {
      title: '📖 Opening Principles',
      description: 'Start your game strong',
      tips: ['1. Control the center (d4, e4, d5, e5)', '2. Develop pieces early - get knights and bishops out', '3. Castle early - move king to safety', '4. Move each piece only once in opening', '5. Don\'t bring queen out too early', '6. Connect your rooks']
    },
    'tactical-basics': {
      title: '⚔️ Tactical Basics',
      description: 'Win material through tactics',
      tips: ['🎯 Fork: Attack two pieces at once', '🎯 Pin: Immobilize a piece', '🎯 Skewer: Reverse pin', '🎯 Discovered Attack: Reveal attack from another piece', '🎯 Double Attack: Attack two pieces in one move', '🎯 Remove Defender: Capture the defending piece']
    },
    'endgame-basics': {
      title: '🏁 Endgame Basics',
      description: 'Finish the game and promote pawns',
      tips: ['1. Activate your king', '2. Passed pawns are golden', '3. Rook behind passed pawn is best', '4. Opposite colored bishops often drawn', '5. Triangulation is advanced technique', '6. Push pawns forward to promote']
    },
    'check-checkmate': {
      title: '👑 Check & Checkmate',
      description: 'Win the game',
      tips: ['♚ Check: King is under attack', '✓ Escape by moving king, blocking, or capturing', '♛ Checkmate: King in check with NO legal moves', '🎯 Common mates: Back rank, Fool\'s mate, Scholar\'s mate', '🏁 Two-rook mate works on any edge', '⭐ Learn checkmate patterns']
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // ✅ SAVE ACCOUNTS TO LOCALSTORAGE
  const saveAccounts = (newAccounts) => {
    try {
      localStorage.setItem('chessAccounts', JSON.stringify(newAccounts));
      setAccounts(newAccounts);
    } catch (e) {
      console.log('Error saving accounts:', e);
    }
  };

  // ✅ HANDLE REGISTRATION
  const handleRegister = () => {
    setLoginError('');

    if (!username || !password || !email) {
      setLoginError('All fields are required');
      return;
    }
    if (username.length < 3) {
      setLoginError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 4) {
      setLoginError('Password must be at least 4 characters');
      return;
    }
    if (!email.includes('@')) {
      setLoginError('Please enter a valid email');
      return;
    }
    if (accounts[username]) {
      setLoginError('Username already exists');
      return;
    }

    const newAccounts = {
      ...accounts,
      [username]: { password, email, createdAt: new Date().toISOString() }
    };
    saveAccounts(newAccounts);

    setIsLoggedIn(true);
    setCurrentPlayerInfo({ username, email });
    setUsername('');
    setPassword('');
    setEmail('');
    setIsRegistering(false);
  };

  // ✅ HANDLE LOGIN
  const handleLogin = () => {
    setLoginError('');

    if (!username || !password) {
      setLoginError('Please enter username and password');
      return;
    }

    const account = accounts[username];
    if (!account) {
      setLoginError('Username not found');
      return;
    }

    if (account.password !== password) {
      setLoginError('Incorrect password');
      return;
    }

    setIsLoggedIn(true);
    setCurrentPlayerInfo({ username, email: account.email });
    setUsername('');
    setPassword('');
  };

  // ✅ HANDLE LOGOUT
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPlayerInfo(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setIsRegistering(false);
    setLoginError('');
  };

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

  async function loadLeaderboard() {
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
    if (color === 'white') {
      // Filled white pieces
      const whiteSymbols = {
        pawn: '♙',
        rook: '♖',
        knight: '♘',
        bishop: '♗',
        queen: '♕',
        king: '♔'
      };
      return whiteSymbols[type] || '';
    } else {
      // Outlined black pieces
      const blackSymbols = {
        pawn: '♟',
        rook: '♜',
        knight: '♞',
        bishop: '♝',
        queen: '♛',
        king: '♚'
      };
      return blackSymbols[type] || '';
    }
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

    // If clicking on a white piece, select it and ALWAYS show legal moves
    if (piece && piece.color === 'white') {
      setSelectedSquare([row, col]);
      const moves = getLegalMoves(board, row, col);
      setLegalMoves(moves); // ALWAYS show moves!
      return;
    }

    // If clicking on a legal move square, make the move
    if (selectedSquare) {
      const legalMovesForSelected = getLegalMoves(board, selectedSquare[0], selectedSquare[1]);
      const isLegalMove = legalMovesForSelected.some(move => move[0] === row && move[1] === col);
      if (isLegalMove) {
        makeMove(selectedSquare[0], selectedSquare[1], row, col);
        return;
      }
    }

    // Otherwise deselect
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
    setLegalMoves(moves); // ALWAYS show legal moves!
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

    // Call AI immediately - no delay
    makeAIMove(newBoard, [...moveHistory, moveNotation]);
  };

  const makeAIMove = (boardState, moves) => {
    setAiThinking(true);

    // Ultra-fast AI with minimal computation
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
    
    const depths = { easy: 1, medium: 2, hard: 3 };
    const maxDepth = depths[difficulty];

    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === 'black') {
          const legalMoves = getLegalMoves(boardState, r, c);
          for (let move of legalMoves) {
            moves.push({ from: [r, c], to: move, score: 0 });
          }
        }
      }
    }

    moves.sort(() => Math.random() - 0.5);
    const limit = Math.min(moves.length, difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : moves.length);

    for (let i = 0; i < limit; i++) {
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

    return bestMove;
  };

  const minimax = (boardState, depth, alpha, beta, isMaximizing, maxDepth) => {
    if (depth === maxDepth) {
      return evaluatePosition(boardState);
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
            moves.push({ from: [r, c], to: move });
          }
        }
      }
    }

    for (let moveObj of moves) {
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
          score += piece.color === 'black' ? value : -value;
        }
      }
    }
    return score;
  };

  const renderBoard = () => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return (
      <div style={{
        display: 'inline-block',
        padding: '10px',
        backgroundColor: '#8b7355',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        border: '3px solid #5a4a3a'
      }}>
        {/* File labels (a-h) */}
        <div style={{ display: 'flex', marginLeft: '30px', marginBottom: '3px' }}>
          {files.map((file, i) => (
            <div key={`file-${i}`} style={{ width: '70px', textAlign: 'center', color: '#333', fontWeight: 'bold', fontSize: '12px' }}>
              {file}
            </div>
          ))}
        </div>

        {/* Board rows */}
        {board.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {/* Rank label (8-1) */}
            <div style={{ width: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 'bold', fontSize: '12px' }}>
              {8 - r}
            </div>

            {/* Board squares */}
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

              // Determine piece color for rendering
              let pieceColor = '#1a1a1a';  // Black pieces dark
              let textOutline = 'none';

              if (piece && piece.color === 'white') {
                // ✅ White pieces: SOLID WHITE with black outline
                pieceColor = '#FFFFFF';  // Solid white!
                textOutline = '-1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000, 1px 1px 0px #000000';
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
                    width: '70px',
                    height: '70px',
                    padding: '0',
                    border: 'none',
                    backgroundColor: backgroundColor,
                    cursor: (piece && piece.color === 'white' && gameStatus === 'ongoing' && currentTurn === 'white' && !aiThinking) 
                      ? 'grab' 
                      : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: piece && piece.type === 'pawn' ? '40px' : '50px',
                    fontWeight: 'bold',
                    textShadow: textOutline,
                    color: pieceColor,
                    transition: 'background-color 0.08s linear',
                    lineHeight: '1',
                    position: 'relative',
                    filter: 'none',
                    fontFamily: 'Arial, sans-serif'
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
        padding: '12px 20px',
        backgroundColor: isMyTurn ? '#27ae60' : '#c0392b',
        color: 'white',
        borderRadius: '6px',
        marginBottom: '15px',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        {isMyTurn ? `♔ YOUR TURN` : `♚ AI ${aiThinking ? '⚡' : 'THINKING'}`}
        {lastMove && <div style={{ fontSize: '11px', marginTop: '3px' }}>Last: {lastMove.notation}</div>}
      </div>
    );
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
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ color: '#f39c12', marginBottom: '10px', fontSize: '36px' }}>♔ CHESS MASTER</h1>
          <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '14px' }}>
            {isRegistering ? 'Create a new account' : 'Login to play'}
          </p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (isRegistering ? handleRegister() : handleLogin())}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#252541',
              color: '#eee',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
          {isRegistering && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#252541',
                color: '#eee',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (isRegistering ? handleRegister() : handleLogin())}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#252541',
              color: '#eee',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />

          {loginError && (
            <div style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              padding: '12px',
              borderRadius: '5px',
              marginBottom: '15px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              ⚠️ {loginError}
            </div>
          )}

          <button
            onClick={() => isRegistering ? handleRegister() : handleLogin()}
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
            {isRegistering ? '📝 CREATE ACCOUNT' : '🔓 LOGIN'}
          </button>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setLoginError('');
              setUsername('');
              setPassword('');
              setEmail('');
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {isRegistering ? '← BACK TO LOGIN' : '+ CREATE NEW ACCOUNT'}
          </button>
        </div>
      </div>
    );
  }

  // MENU
  if (screenMode === 'menu') {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '30px',
            textAlign: 'center',
            borderLeft: '4px solid #f39c12'
          }}>
            <p style={{ margin: '0', color: '#aaa', fontSize: '12px' }}>Logged in as</p>
            <p style={{ margin: '5px 0 0 0', color: '#f39c12', fontSize: '18px', fontWeight: 'bold' }}>
              👤 {currentPlayer?.username}
            </p>
          </div>

          <h1 style={{ textAlign: 'center', color: '#f39c12', marginBottom: '30px', fontSize: '36px' }}>♔ CHESS MASTER</h1>
          <button onClick={() => { setGameMode('difficulty'); setScreenMode('game'); }} style={{ width: '100%', padding: '20px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>⚔️ PLAY vs AI</button>
          <button onClick={() => setScreenMode('training')} style={{ width: '100%', padding: '20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>📚 TRAINING</button>
          <button onClick={() => setScreenMode('leaderboard')} style={{ width: '100%', padding: '20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '25px' }}>🏆 LEADERBOARD</button>
          <button onClick={handleLogout} style={{ width: '100%', padding: '15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>🔓 LOGOUT</button>
        </div>
      </div>
    );
  }

  // TRAINING
  if (screenMode === 'training') {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setScreenMode('menu')} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>← BACK</button>
          {trainingTopic ? (
            <>
              <h2 style={{ color: '#f39c12', marginBottom: '20px' }}>{trainingLessons[trainingTopic].title}</h2>
              <div style={{ backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                {trainingLessons[trainingTopic].tips.map((tip, i) => (
                  <div key={i} style={{ color: '#ddd', marginBottom: '10px', lineHeight: '1.6', fontSize: '14px' }}>{tip}</div>
                ))}
              </div>
              <button onClick={() => setTrainingTopic(null)} style={{ width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK TO LESSONS</button>
            </>
          ) : (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#f39c12' }}>📚 TRAINING MODE</h2>
              {Object.entries(trainingLessons).map(([key, lesson]) => (
                <button key={key} onClick={() => setTrainingTopic(key)} style={{ width: '100%', padding: '20px', backgroundColor: '#1a1a2e', color: '#fff', border: '2px solid #f39c12', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{lesson.title}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{lesson.description}</div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // LEADERBOARD
  if (screenMode === 'leaderboard') {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button onClick={() => setScreenMode('menu')} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>← BACK</button>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#f39c12', fontSize: '32px' }}>🏆 LEADERBOARD</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {['easy', 'medium', 'hard'].map(level => (
              <div key={level} style={{ backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ color: level === 'easy' ? '#2ecc71' : level === 'medium' ? '#f39c12' : '#e74c3c', marginTop: '0' }}>{level === 'easy' ? '⭐ EASY' : level === 'medium' ? '⭐⭐ MEDIUM' : '⭐⭐⭐ HARD'}</h3>
                {leaderboard[level].slice(0, 10).length > 0 ? (
                  leaderboard[level].slice(0, 10).map((entry, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #333', fontSize: '12px' }}>
                      <span style={{ color: '#f39c12', fontWeight: 'bold' }}>#{i + 1}</span>
                      <span style={{ color: '#ddd', flex: 1, marginLeft: '10px' }}>{entry.playerName}</span>
                      <span style={{ color: level === 'easy' ? '#2ecc71' : level === 'medium' ? '#f39c12' : '#e74c3c' }}>{entry.moves}m</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No wins yet</div>
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
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button onClick={() => setScreenMode('menu')} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>← BACK</button>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Select Difficulty</h2>
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
            }} style={{ width: '100%', padding: '15px', backgroundColor: level === 'easy' ? '#3498db' : level === 'medium' ? '#f39c12' : '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
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
      <div style={{
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={() => setScreenMode('menu')} style={{ padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>← HOME</button>
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
          }} style={{ width: '100%', padding: '15px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginBottom: '20px' }}>↻ NEW GAME</button>

          <div style={{ backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: '0', color: '#f39c12' }}>Moves ({moveHistory.length})</h3>
            {moveHistory.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                {moveHistory.map((move, i) => (
                  <div key={i} style={{ color: '#ddd' }}>
                    {i % 2 === 0 && <span style={{ color: '#f39c12' }}>{Math.floor(i / 2) + 1}.</span>} {move}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666' }}>No moves yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChessApp;
