import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Save, Trophy, BookOpen, Clock, LogOut, Settings } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
  const [savedGames, setSavedGames] = useState([]);
  const [rankings, setRankings] = useState({});
  const [aiThinking, setAiThinking] = useState(false);
  const [trainingLesson, setTrainingLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);

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

  // Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // In a real app, you'd validate against backend
      setCurrentPlayerInfo({ username, id: Math.random() });
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
      setGameMode('menu');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/players/register', {
        username,
        email,
        password
      });
      setCurrentPlayerInfo(response.data.player);
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
      setEmail('');
      setIsRegistering(false);
      setGameMode('menu');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPlayerInfo(null);
    setGameMode('menu');
  };

  // Fetch lessons
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await apiClient.get('/training/lessons');
        setLessons(response.data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      }
    };
    fetchLessons();
  }, []);

  // Fetch rankings
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await apiClient.get('/rankings/top');
        setRankings(response.data);
      } catch (error) {
        console.error('Error fetching rankings:', error);
      }
    };
    if (isLoggedIn) fetchRankings();
  }, [isLoggedIn]);

  // Calculate legal moves
  const calculateLegalMoves = async (row, col, boardState = board) => {
    try {
      const response = await apiClient.post('/chess/get-legal-moves', {
        board: boardState,
        row,
        col
      });
      return response.data.legal_moves || [];
    } catch (error) {
      console.error('Error calculating moves:', error);
      return [];
    }
  };

  // Handle square click
  const handleSquareClick = async (row, col) => {
    if (gameMode !== 'game' || currentTurn === 'black' || aiThinking) return;

    const piece = board[row][col];

    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === currentTurn) {
      setSelectedSquare({ row, col });
      const moves = await calculateLegalMoves(row, col);
      setLegalMoves(moves);
      return;
    }

    if (selectedSquare && legalMoves.some(m => m.row === row && m.col === col)) {
      await makeMove(selectedSquare.row, selectedSquare.col, row, col);
    }
  };

  const makeMove = async (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(r => [...r]);
    const piece = newBoard[fromRow][fromCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}-${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    const newMoveHistory = [...moveHistory, moveNotation];

    setBoard(newBoard);
    setMoveHistory(newMoveHistory);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCurrentTurn('black');
    setGameStatus('ongoing');

    // Trigger AI move after brief delay
    setTimeout(() => makeAIMove(newBoard, newMoveHistory), 1000);
  };

  const makeAIMove = async (boardState, moves) => {
    if (gameStatus !== 'ongoing') return;

    setAiThinking(true);
    try {
      const response = await apiClient.post('/chess/ai-move', {
        board: boardState,
        difficulty
      });

      if (response.data.move) {
        const { from_row, from_col, to_row, to_col } = response.data.move;
        const newBoard = boardState.map(r => [...r]);
        const piece = newBoard[from_row][from_col];

        if (piece) {
          newBoard[to_row][to_col] = piece;
          newBoard[from_row][from_col] = null;

          const moveNotation = `${String.fromCharCode(97 + from_col)}${8 - from_row}-${String.fromCharCode(97 + to_col)}${8 - to_row}`;
          const newMoveHistory = [...moves, moveNotation];

          setBoard(newBoard);
          setMoveHistory(newMoveHistory);
          setCurrentTurn('white');

          // Check for checkmate
          checkCheckmate(newBoard, 'white');
        }
      }
    } catch (error) {
      console.error('AI move error:', error);
    }
    setAiThinking(false);
  };

  const checkCheckmate = async (boardState, player) => {
    try {
      const response = await apiClient.post('/chess/detect-checkmate', {
        board: boardState,
        player_color: player
      });

      if (response.data.is_checkmate) {
        setGameStatus('checkmate');
      }
    } catch (error) {
      console.error('Checkmate detection error:', error);
    }
  };

  // Timer
  useEffect(() => {
    if (gameMode !== 'game' || gameStatus !== 'ongoing') return;

    timerRef.current = setInterval(() => {
      if (currentTurn === 'white') {
        setWhiteTime(t => t > 0 ? t - 1 : 0);
      } else {
        setBlackTime(t => t > 0 ? t - 1 : 0);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameMode, currentTurn, gameStatus]);

  // Save game
  const saveGame = async () => {
    try {
      const response = await apiClient.post('/games', {
        player_id: currentPlayer.id,
        difficulty,
        moves: moveHistory
      });

      setGameId(response.data.id);
      alert('Game saved successfully!');
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Failed to save game');
    }
  };

  // Submit ranking
  const submitRanking = async () => {
    if (gameStatus !== 'checkmate') {
      alert('You must win the game to submit a ranking!');
      return;
    }

    try {
      const completionTime = 600 - whiteTime;
      const response = await apiClient.post('/rankings', {
        player_id: currentPlayer.id,
        difficulty,
        completion_time: completionTime
      });

      alert(`Score submitted! Time: ${completionTime}s`);
      
      // Refresh rankings
      const rankingsResponse = await apiClient.get('/rankings/top');
      setRankings(rankingsResponse.data);
    } catch (error) {
      console.error('Error submitting ranking:', error);
      alert('Failed to submit ranking');
    }
  };

  // Render board
  const renderBoard = () => {
    return (
      <div className="flex justify-center mb-8">
        <div className="inline-block border-8" style={{ borderColor: '#5c4033', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
              {row.map((piece, colIdx) => {
                const isLight = (rowIdx + colIdx) % 2 === 0;
                const isSelected = selectedSquare?.row === rowIdx && selectedSquare?.col === colIdx;
                const isLegalMove = legalMoves.some(m => m.row === rowIdx && m.col === colIdx);

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleSquareClick(rowIdx, colIdx)}
                    className="w-20 h-20 flex items-center justify-center cursor-pointer text-5xl font-bold transition-all hover:opacity-80"
                    style={{
                      backgroundColor: isLight ? '#f5e6d3' : '#c19a6b',
                      boxShadow: isSelected ? 'inset 0 0 0 3px #fbbf24' : isLegalMove ? 'inset 0 0 0 3px #4ade80' : 'none'
                    }}
                  >
                    {piece && (
                      <span style={{ color: piece.color === 'white' ? '#ffffff' : '#1a1a1a', textShadow: piece.color === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : '1px 1px 2px rgba(255,255,255,0.3)' }}>
                        {piece.type === 'king' && '♔'} {piece.type === 'queen' && '♕'} {piece.type === 'rook' && '♖'} 
                        {piece.type === 'bishop' && '♗'} {piece.type === 'knight' && '♘'} {piece.type === 'pawn' && '♙'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // LOGIN/REGISTER VIEW
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #78350f 100%)' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
          * { font-family: 'Cinzel', serif; }
        `}</style>

        <div className="max-w-md w-full mx-auto flex flex-col justify-center min-h-screen">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-amber-50 drop-shadow-lg mb-2">♔ CHESS AI ♔</h1>
            <p className="text-amber-100 text-lg">Master the Royal Game</p>
          </div>

          <div className="bg-amber-50 rounded-lg shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
              {isRegistering ? 'Create Account' : 'Login'}
            </h2>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              {isRegistering && (
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              )}

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all font-bold text-lg"
              >
                {isRegistering ? 'Register' : 'Login'}
              </button>
            </form>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full mt-4 text-amber-700 text-sm hover:underline"
            >
              {isRegistering ? 'Already have an account? Login' : 'Create new account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MENU VIEW
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #78350f 100%)' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
          * { font-family: 'Cinzel', serif; }
        `}</style>

        <div className="max-w-2xl w-full mx-auto flex flex-col justify-center min-h-screen">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-amber-50">♔ CHESS AI ♔</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="text-center mb-8">
            <p className="text-amber-100 text-lg">Welcome, <span className="font-bold">{currentPlayer?.username}</span>!</p>
          </div>

          <div className="bg-amber-50 rounded-lg shadow-2xl p-8 space-y-4">
            <button
              onClick={() => {
                setBoard(initializeBoard());
                setDifficulty('easy');
                setGameMode('game');
                setCurrentTurn('white');
                setGameStatus('ongoing');
                setWhiteTime(600);
                setBlackTime(600);
                setMoveHistory([]);
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg hover:from-green-700 hover:to-green-800 font-bold text-lg"
            >
              🟢 EASY MODE
            </button>

            <button
              onClick={() => {
                setBoard(initializeBoard());
                setDifficulty('medium');
                setGameMode('game');
                setCurrentTurn('white');
                setGameStatus('ongoing');
                setWhiteTime(600);
                setBlackTime(600);
                setMoveHistory([]);
              }}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-lg hover:from-orange-700 hover:to-orange-800 font-bold text-lg"
            >
              🟡 MEDIUM MODE
            </button>

            <button
              onClick={() => {
                setBoard(initializeBoard());
                setDifficulty('hard');
                setGameMode('game');
                setCurrentTurn('white');
                setGameStatus('ongoing');
                setWhiteTime(600);
                setBlackTime(600);
                setMoveHistory([]);
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-lg hover:from-red-700 hover:to-red-800 font-bold text-lg"
            >
              🔴 HARD MODE
            </button>

            <button
              onClick={() => setGameMode('training')}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-bold text-lg flex items-center justify-center gap-2"
            >
              <BookOpen size={20} /> TRAINING MODE
            </button>

            <button
              onClick={() => setGameMode('rankings')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg hover:from-purple-700 hover:to-purple-800 font-bold text-lg flex items-center justify-center gap-2"
            >
              <Trophy size={20} /> GLOBAL RANKINGS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME VIEW
  if (gameMode === 'game') {
    return (
      <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #78350f 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => { setGameMode('menu'); clearInterval(timerRef.current); }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
            >
              ← Menu
            </button>
            <h1 className="text-4xl font-bold text-amber-50">VS AI ({difficulty.toUpperCase()})</h1>
            <div className="text-amber-50 text-sm">Moves: {moveHistory.length}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-amber-800 text-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm opacity-75">⏱ Black</p>
              <p className="text-2xl font-bold">{Math.floor(blackTime / 60)}:{String(blackTime % 60).padStart(2, '0')}</p>
            </div>
            <div className="bg-amber-700 text-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm opacity-75">Current</p>
              <p className="text-2xl font-bold">{currentTurn.toUpperCase()}</p>
              {aiThinking && <p className="text-sm text-yellow-300 animate-pulse">🤖 Thinking...</p>}
            </div>
            <div className="bg-amber-800 text-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm opacity-75">⏱ White</p>
              <p className="text-2xl font-bold">{Math.floor(whiteTime / 60)}:{String(whiteTime % 60).padStart(2, '0')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              {renderBoard()}

              {gameStatus !== 'ongoing' && (
                <div className="bg-yellow-400 border-4 border-yellow-600 p-4 rounded-lg text-center font-bold text-lg mb-4">
                  {gameStatus === 'checkmate' && '🎉 Checkmate! You Win!'}
                </div>
              )}

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setBoard(initializeBoard());
                    setCurrentTurn('white');
                    setGameStatus('ongoing');
                    setWhiteTime(600);
                    setBlackTime(600);
                    setMoveHistory([]);
                    setSelectedSquare(null);
                    setLegalMoves([]);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  ↻ New Game
                </button>

                <button
                  onClick={saveGame}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  💾 Save
                </button>

                {gameStatus !== 'ongoing' && (
                  <button
                    onClick={submitRanking}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    🏆 Submit Score
                  </button>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-6 shadow-lg h-fit">
              <h3 className="text-xl font-bold text-amber-900 mb-4">📋 Moves</h3>
              <div className="bg-white rounded p-3 max-h-96 overflow-y-auto text-sm mb-4 border-2 border-amber-200">
                {moveHistory.length === 0 ? (
                  <p className="text-gray-400">No moves yet</p>
                ) : (
                  moveHistory.map((move, idx) => (
                    <div key={idx} className="py-1 border-b border-gray-200 last:border-0 text-amber-900">
                      <span className="font-semibold">{Math.floor(idx / 2) + 1}.</span> {move}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-amber-100 rounded p-3 text-sm text-amber-900">
                <p><strong>Status:</strong> {gameStatus === 'ongoing' ? '🔄 Playing' : '✓ ' + gameStatus}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TRAINING VIEW
  if (gameMode === 'training') {
    if (!trainingLesson) {
      return (
        <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #065f46 100%)' }}>
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setGameMode('menu')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold mb-8"
            >
              ← Back
            </button>

            <h1 className="text-5xl font-bold text-emerald-50 mb-12">📚 Training Mode</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lessons.map(lesson => (
                <div
                  key={lesson.id}
                  onClick={() => setTrainingLesson(lesson)}
                  className="bg-emerald-50 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 border-4 border-emerald-200"
                >
                  <h2 className="text-2xl font-bold text-emerald-900 mb-2">{lesson.name}</h2>
                  <p className="text-emerald-700 mb-4">{lesson.description}</p>
                  {completedLessons.includes(lesson.id) && (
                    <div className="text-center text-green-600 font-bold">✓ Completed</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #065f46 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setTrainingLesson(null)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold mb-8"
          >
            ← Back
          </button>

          <div className="bg-emerald-50 rounded-lg shadow-2xl p-8">
            <h1 className="text-4xl font-bold text-emerald-900 mb-6">{trainingLesson.name}</h1>

            <div className="bg-white rounded-lg p-6 border-2 border-emerald-200 mb-6 text-lg leading-relaxed text-emerald-900">
              {trainingLesson.content}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCompletedLessons([...completedLessons, trainingLesson.id]);
                  setTrainingLesson(null);
                }}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold"
              >
                ✓ Complete
              </button>
              <button
                onClick={() => {
                  setBoard(initializeBoard());
                  setCurrentTurn('white');
                  setGameStatus('ongoing');
                  setMoveHistory([]);
                  setGameMode('game');
                  setTrainingLesson(null);
                }}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold"
              >
                ▶ Play
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RANKINGS VIEW
  if (gameMode === 'rankings') {
    return (
      <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #92400e 50%, #7c2d12 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setGameMode('menu')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold mb-8"
          >
            ← Back
          </button>

          <h1 className="text-5xl font-bold text-amber-50 mb-12">🏆 Global Rankings</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['easy', 'medium', 'hard'].map(diff => (
              <div key={diff} className="bg-amber-50 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-4 capitalize">{diff} Mode</h2>
                <div className="space-y-3">
                  {rankings[diff]?.slice(0, 5).map((rank, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-amber-200">
                      <span className="font-bold">#{idx + 1}</span>
                      <span className="text-sm">{rank.username}</span>
                      <span className="font-bold text-amber-700">{rank.completion_time}s</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChessApp;
