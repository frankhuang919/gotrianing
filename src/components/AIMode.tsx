import React, { useState, useEffect, useRef } from 'react';
import GoBoard from './GoBoard';
import GameResultModal from './GameResultModal';


// --- CONFIG ---
// --- CONFIG ---
const BLUNDER_THRESHOLD = 0.07; // 7% drop is a blunder (Relaxed from 5% for calibration stability)

// GTP Coordinate Mapping
const COL_LETTERS = "ABCDEFGHJKLMNOPQRST";
const toGTP = (x: number, y: number): string => {
    if (x < 0 || x >= 19 || y < 0 || y >= 19) return "pass";
    const col = COL_LETTERS[x];
    const row = 19 - y;
    return `${col}${row}`;
};
const fromGTP = (gtp: string): { x: number, y: number } | null => {
    if (!gtp || gtp.toLowerCase() === 'pass' || gtp.toLowerCase() === 'resign') return null;
    const colStr = gtp[0].toUpperCase();
    const rowStr = gtp.slice(1);
    const x = COL_LETTERS.indexOf(colStr);
    const y = 19 - parseInt(rowStr, 10);
    if (x < 0 || isNaN(y)) return null;
    return { x, y };
};

// Parse 'info move ... winrate X ... scoreMean Y ... pv ...'
const parseAIInfo = (response: string) => {
    try {
        const winrateMatch = response.match(/winrate\s+([\d.]+)/);
        const scoreMatch = response.match(/scoreMean\s+([-\d.]+)/);
        const pvMatch = response.match(/pv\s+(.+)$/);

        return {
            winrate: winrateMatch ? parseFloat(winrateMatch[1]) : null,
            scoreLead: scoreMatch ? parseFloat(scoreMatch[1]) : null,
            pv: pvMatch ? pvMatch[1] : null
        };
    } catch (e) {
        console.error("Failed to parse AI info", e);
        return { winrate: null, scoreLead: null, pv: null };
    }
};

import { resolveBoardState, type Point } from '../utils/goLogic';

const AIMode: React.FC = () => {
    // Game State
    const [connected, setConnected] = useState(false);
    // Explicitly define state type to match GoBoard expectations
    const [stones, setStones] = useState<{ x: number, y: number, c: 1 | -1 }[]>([]);
    const [lastMove, setLastMove] = useState<{ x: number, y: number } | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [provisionalMove, setProvisionalMove] = useState<{ x: number, y: number } | null>(null);

    // AI & Rules
    const [lastPlayerWinrate, setLastPlayerWinrate] = useState(0.5); // Start at 50%
    const [lastScoreLead, setLastScoreLead] = useState<number | null>(null); // Track score
    const [difficulty, setDifficulty] = useState(50); // Default to Amateur (50 visits)
    const [feedback, setFeedback] = useState<{ msg: string, type: 'good' | 'bad' | 'neutral' } | null>(null);

    // --- STATE REFS (Fix Closure Staleness) ---
    const gameHistoryRef = useRef<{ moveNumber: number, whiteWinrate: number }[]>([]);
    const lastScoreLeadRef = useRef<number | null>(null);

    // History & Results
    const [gameHistory, setGameHistory] = useState<{ moveNumber: number, whiteWinrate: number }[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [gameResult, setGameResult] = useState<{ winner: 'Black' | 'White', reason: string }>({ winner: 'White', reason: 'Resignation' });

    // Review & Coaching
    const [bestSequence, setBestSequence] = useState<{ x: number, y: number, c: 1 | -1, order: number }[]>([]);
    const [reviewStep, setReviewStep] = useState<'NONE' | 'ALERT' | 'HINT' | 'SOLUTION'>('NONE');

    // Sync refs with state
    useEffect(() => { gameHistoryRef.current = gameHistory; }, [gameHistory]);
    useEffect(() => { lastScoreLeadRef.current = lastScoreLead; }, [lastScoreLead]);

    const ws = useRef<WebSocket | null>(null);
    const thinkingTimeout = useRef<number | null>(null);

    const undoLastMove = () => {
        setStones(prev => {
            if (prev.length === 0) return prev;
            const newStones = [...prev];
            const last = newStones[newStones.length - 1];
            if (last.c === -1) {
                newStones.pop();
                if (newStones.length > 0) newStones.pop();
            } else {
                newStones.pop();
            }
            return newStones;
        });

        setGameHistory(prev => {
            const newHist = [...prev];
            if (newHist.length > 0) newHist.pop();
            return newHist;
        });

        setFeedback({ msg: "已悔棋，AI 正在分析正解...", type: 'neutral' });
        setReviewStep('NONE');
        setIsThinking(true);

        sendCommand("undo");
        sendCommand("undo"); // Undo AI move and User move from engine
        sendCommand("kata-analyze", ["B", 50]); // Ask for hint for Black
    };

    const reconnectInterval = useRef<number | null>(null);

    const connectToAI = () => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        // Cloud-Ready Config: Use Env Variable or default to Local
        const wsUrl = import.meta.env.VITE_AI_ENDPOINT || 'ws://127.0.0.1:3001';
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
            console.log("AI Connected");
            setConnected(true);
            setFeedback({ msg: "BOSS ENCOUNTER STARTED", type: 'neutral' });
            // Clear reconnect interval if connected
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
                reconnectInterval.current = null;
            }

            // Initial Reset
            sendCommand("clear_board");
            sendCommand("komi 7.5"); // Chinese rules usually
            // Set initial difficulty
            sendCommand("time_settings", ["0", "1", "1"]);
        };

        socket.onclose = () => {
            console.log("AI Disconnected");
            setConnected(false);
            setFeedback({ msg: "CONNECTION LOST - RECONNECTING...", type: 'bad' });
            setIsThinking(false);

            // Try to reconnect every 3s
            if (!reconnectInterval.current) {
                reconnectInterval.current = window.setInterval(connectToAI, 3000);
            }
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleBackendResponse(data);
        };
    };

    useEffect(() => {
        connectToAI();

        return () => {
            if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);
            if (reconnectInterval.current) clearInterval(reconnectInterval.current);
            ws.current?.close();
        };
    }, []);

    // Update MaxVisits when difficulty changes
    useEffect(() => {
        if (connected) {
            // KataGo supports `kata-set-param` key value
            // If this fails, AI might ignore it, which is fine for now.
            sendCommand("kata-set-param", ["maxVisits", difficulty]);
        }
    }, [difficulty, connected]);

    const sendCommand = (cmd: string, args: any[] = []) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ command: cmd, args }));
        }
    };

    // --- GAME LOOP ---

    const playStone = (x: number, y: number, color: 1 | -1) => {
        setStones(prev => {
            // Use goLogic to resolve captures
            // Note: resolveBoardState expects Point[] with {x,y,c}
            // And newMove as Point
            const newMove: Point = { x, y, c: color }; // 1=Black, -1=White

            // Check if spot occupied (UI optimization, engine checks too)
            if (prev.some(s => s.x === x && s.y === y)) return prev;

            // Cast to any to bypass exact literal type match (number vs 1|-1)
            // We know resolveBoardState preserves the input color which is 1|-1
            const nextState = resolveBoardState(prev, newMove);
            return nextState as { x: number, y: number, c: 1 | -1 }[];
        });
        setLastMove({ x, y });
    };

    const handleUserClick = (x: number, y: number) => {
        // Block clicks during AI thinking, disconnected, or while reviewing hints/solutions
        if (isThinking || !connected || reviewStep !== 'NONE') return;

        // Check if point is occupied
        if (stones.some(s => s.x === x && s.y === y)) return;

        setProvisionalMove({ x, y });
    };

    const confirmMove = () => {
        if (!provisionalMove) return;
        const { x, y } = provisionalMove;

        // Re-check conditions
        if (isThinking || !connected || reviewStep !== 'NONE') return;

        // 1. User Plays (Optimistic)
        playStone(x, y, 1); // Black
        const gtpCoord = toGTP(x, y);
        sendCommand("play", ["B", gtpCoord]);

        // 2. Trigger Analysis immediately
        setIsThinking(true);

        // Safety: Auto-unlock after 15s
        if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);
        thinkingTimeout.current = window.setTimeout(() => {
            setIsThinking(false);
            setFeedback({ msg: "AI TIMEOUT - RETRY", type: 'neutral' });
        }, 15000);

        // Combined Genmove + Analyze
        sendCommand("kata-genmove_analyze", ["W", difficulty]);

        setProvisionalMove(null);
    };

    const cancelMove = () => {
        setProvisionalMove(null);
    };

    const handleBackendResponse = (data: any) => {
        // Handle AI Move (Standard)
        if (data.command === 'kata-genmove_analyze' || data.command === 'genmove') {
            setIsThinking(false);
            if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);

            if (data.success) {
                const responseText = data.response || "";
                let moveStr = "";
                let whiteWinrate = null;
                let currentScoreLead = null;

                const lines = responseText.split('\n');
                for (const line of lines) {
                    if (line.startsWith('play ')) {
                        moveStr = line.split(' ')[1];
                    } else if (line.startsWith('info') && line.includes('winrate')) {
                        const info = parseAIInfo(line);
                        // Prioritize info line with winrate
                        if (info.winrate !== null && whiteWinrate === null) {
                            whiteWinrate = info.winrate;
                            currentScoreLead = info.scoreLead;

                            // Parse PV if available
                            if (info.pv) {
                                const moves = info.pv.split(' ').map(m => fromGTP(m)).filter(p => p !== null) as { x: number, y: number }[];
                                // We are analyzing White's turn, so PV starts with White (-1)
                                const sequence = moves.map((m, i) => ({
                                    ...m,
                                    c: (i % 2 === 0 ? -1 : 1) as 1 | -1,
                                    order: i + 1
                                }));
                                setBestSequence(sequence);
                            }
                        }
                    }
                    else if (!moveStr && fromGTP(line)) {
                        moveStr = line;
                    }
                }

                if (moveStr) {
                    if (moveStr.toLowerCase() === 'resign') {
                        setFeedback({ msg: "AI 认输!", type: 'good' });
                        setGameResult({ winner: 'Black', reason: 'AI 认输' });
                        setShowResult(true);
                        return;
                    }
                    if (moveStr.toLowerCase() === 'pass') {
                        setFeedback({ msg: "AI 停一手", type: 'neutral' });
                        return;
                    }

                    const coords = fromGTP(moveStr);
                    if (coords) {
                        // CRITICAL: Verify position is empty before placing
                        const isOccupied = stones.some(s => s.x === coords.x && s.y === coords.y);
                        if (isOccupied) {
                            console.error("AI tried to play on occupied position:", moveStr, coords);
                            setFeedback({ msg: "AI走棋错误，请重试", type: 'bad' });
                            return;
                        }
                        playStone(coords.x, coords.y, -1);
                    }
                }

                if (whiteWinrate !== null) {
                    const blackWinrate = 1.0 - whiteWinrate;
                    setGameHistory(prev => [...prev, { moveNumber: prev.length + 1, whiteWinrate: whiteWinrate! }]);

                    // USE REFS TO AVOID STALENESS
                    const historyLen = gameHistoryRef.current.length;

                    if (historyLen === 0) {
                        setLastPlayerWinrate(blackWinrate);
                        setFeedback({ msg: "AI 预热完成", type: 'neutral' });
                        return;
                    }

                    const prevEntry = gameHistoryRef.current[gameHistoryRef.current.length - 1];
                    const prevBlackWinrate = 1.0 - prevEntry.whiteWinrate;

                    const delta = prevBlackWinrate - blackWinrate; // Positive means we lost winrate

                    // Score Calculation
                    let scoreDiff = 0;
                    if (currentScoreLead !== null && lastScoreLeadRef.current !== null) {
                        scoreDiff = lastScoreLeadRef.current - currentScoreLead;
                    }
                    if (currentScoreLead !== null) setLastScoreLead(currentScoreLead);

                    if (delta > BLUNDER_THRESHOLD) {
                        // Show generic blunder message first, but enable "Review"
                        const scoreMsg = scoreDiff > 1 ? ` (亏 ${scoreDiff.toFixed(1)} 目)` : "";
                        setFeedback({ msg: `大恶手! 胜率跌了 ${(delta * 100).toFixed(1)}%${scoreMsg}`, type: 'bad' });
                        // Active Learning: Trigger Alert
                        setReviewStep('ALERT');
                    } else {
                        if (delta < -0.02) setFeedback({ msg: "妙手!", type: 'good' });
                        else setFeedback({ msg: "进行中...", type: 'neutral' });
                        // Clear Review Step if good move
                        setReviewStep('NONE');
                    }
                    setLastPlayerWinrate(blackWinrate);
                }
            }
        }
        // Handle Hint/Analysis (No Move Played)
        else if (data.command === 'kata-analyze') {
            setIsThinking(false);
            if (data.success) {
                const responseText = data.response || "";
                const lines = responseText.split('\n');
                for (const line of lines) {
                    if (line.startsWith('info') && line.includes('pv')) {
                        const info = parseAIInfo(line);
                        // We take the first info line with PV
                        if (info.pv) {
                            const moves = info.pv.split(' ').map(m => fromGTP(m)).filter(p => p !== null) as { x: number, y: number }[];
                            // Analyzing BLACK's turn (after undo)
                            // So PV starts with Black (1)
                            const sequence = moves.map((m, i) => ({
                                ...m,
                                c: (i % 2 === 0 ? 1 : -1) as 1 | -1, // 0=Black, 1=White
                                order: i + 1
                            }));
                            setBestSequence(sequence);
                            setFeedback({ msg: "正解已生成 (点击'提示'或'查看正解')", type: 'neutral' });
                            setReviewStep('HINT'); // Enable buttons
                            break;
                        }
                    }
                }
            }
        }
    };

    const resetGame = () => {
        setStones([]);
        setLastMove(null);
        setLastPlayerWinrate(0.5);
        setGameHistory([]);
        setShowResult(false);
        setFeedback({ msg: "新对局开始", type: 'neutral' });
        setIsThinking(false);
        if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);

        // Clear Refs manually to be safe (Effect will sync, but latency matters)
        gameHistoryRef.current = [];
        lastScoreLeadRef.current = null;

        sendCommand("clear_board");
        // Re-apply difficulty just in case
        sendCommand("kata-set-param", ["maxVisits", difficulty]);
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col md:flex-row h-screen bg-stone-950 text-stone-200 overflow-hidden">
            {/* Modal */}
            {showResult && (
                <GameResultModal
                    winner={gameResult.winner}
                    reason={gameResult.reason}
                    history={gameHistory}
                    onClose={() => setShowResult(false)}
                />
            )}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-1deg); }
                    75% { transform: translateX(5px) rotate(1deg); }
                }
                .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-short { animation: bounce-short 0.6s ease-in-out; }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                
                @keyframes draw-line {
                    from { 
                        opacity: 0;
                        stroke-dasharray: 200;
                        stroke-dashoffset: 200;
                    }
                    to { 
                        opacity: 1;
                        stroke-dasharray: 200;
                        stroke-dashoffset: 0;
                    }
                }
                .animate-draw-line { animation: draw-line 0.3s ease-out forwards; }
            `}</style>

            {/* Main Board Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-stone-900 to-stone-950">
                {/* Header */}
                <div className="w-full max-w-5xl flex items-center justify-between p-3 md:p-6 z-10">
                    <div className="text-base md:text-xl font-black text-cyan-400">
                        AI 对弈练习
                    </div>
                    <div className={`text-xs font-mono font-bold ${connected ? 'text-green-500' : 'text-stone-600'}`}>
                        {connected ? "已连接" : "连接中..."}
                    </div>
                    <div className={`text-lg font-bold ${(lastPlayerWinrate * 100) > 50 ? 'text-cyan-400' : 'text-red-500'}`}>
                        黑棋胜率: {(lastPlayerWinrate * 100).toFixed(1)}%
                    </div>
                </div>

                {/* Feedback Area - Active Learning UI */}
                <div className="min-h-[4rem] flex flex-col items-center justify-center w-full my-4 gap-2 transition-all">
                    {feedback && (
                        <div className={`
                            text-lg font-black tracking-widest px-8 py-2 rounded-lg backdrop-blur-md border-2 shadow-xl transform transition-all
                            flex items-center gap-3 animate-fade-in
                            ${feedback.type === 'good' ? 'bg-green-950/80 text-green-400 border-green-500 shadow-green-900/50' : ''}
                            ${feedback.type === 'bad' ? 'bg-red-950/80 text-red-500 border-red-500 shadow-red-900/50' : ''}
                            ${feedback.type === 'neutral' ? 'bg-stone-900/80 text-stone-300 border-stone-600' : ''}
                        `}>
                            {feedback.type === 'good' && <span>⚔️</span>}
                            {feedback.type === 'bad' && <span>💔</span>}
                            {feedback.msg}

                            {/* Alert Logic: Show Undo Button */}
                            {reviewStep === 'ALERT' && (
                                <button
                                    onClick={undoLastMove}
                                    className="ml-4 px-3 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs rounded border border-stone-500 transition-all font-bold"
                                >
                                    🔙 悔棋重试
                                </button>
                            )}
                        </div>
                    )}

                    {/* Active Learning Controls */}
                    {reviewStep !== 'NONE' && (
                        <div className="flex gap-2">
                            {/* Step 2: Hint (Simple toggle for now) */}
                            {reviewStep === 'ALERT' && (
                                <button
                                    onClick={() => setReviewStep('HINT')}
                                    className="px-4 py-1 rounded-full text-xs font-bold border transition-all bg-amber-900/50 text-amber-500 border-amber-800 hover:text-amber-300"
                                >
                                    💡 提示 (Hint)
                                </button>
                            )}

                            {/* Step 3: Solution */}
                            {(reviewStep === 'ALERT' || reviewStep === 'HINT') && (
                                <button
                                    onClick={() => setReviewStep('SOLUTION')}
                                    className="px-4 py-1 rounded-full text-xs font-bold border transition-all bg-stone-800 text-stone-500 border-stone-700 hover:text-stone-300"
                                >
                                    👀 查看正解
                                </button>
                            )}

                            {reviewStep === 'SOLUTION' && (
                                <button
                                    onClick={() => setReviewStep('NONE')}
                                    className="px-4 py-1 rounded-full text-xs font-bold border transition-all bg-stone-800 text-stone-500 border-stone-700 hover:text-stone-300"
                                >
                                    ❌ 收起
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Feedback Overlay REMOVED (Moved to HUD) */}

                {/* Board */}
                <div className="h-[50vh] md:h-[75vh] aspect-square relative shadow-2xl rounded-sm overflow-hidden border-[8px] md:border-[12px] border-stone-800 bg-[#dc933c] max-w-[95vw]">
                    <GoBoard
                        size={19}
                        stones={stones}
                        // Only show ghost stones in SOLUTION step
                        // Filter out move 0 (overlap fix) and limit to 5 moves.
                        // Also re-index orders to start from 1.
                        ghostStones={
                            (() => {
                                const ghosts = [];

                                // 1. Solution/Hint Ghosts
                                if (reviewStep === 'SOLUTION') {
                                    const filtered = bestSequence.filter(
                                        s => !stones.some(st => st.x === s.x && st.y === s.y)
                                    );
                                    for (let i = 0; i < Math.min(filtered.length, 10); i++) {
                                        ghosts.push({
                                            x: filtered[i].x,
                                            y: filtered[i].y,
                                            c: filtered[i].c,
                                            order: i + 1
                                        });
                                    }
                                } else if (reviewStep === 'HINT') {
                                    const first = bestSequence.find(
                                        s => !stones.some(st => st.x === s.x && st.y === s.y)
                                    );
                                    if (first) ghosts.push({ x: first.x, y: first.y, c: first.c, order: 1 });
                                }

                                // 2. Provisional Move Ghost (User's pending move)
                                if (provisionalMove) {
                                    // Current turn color
                                    const nextColor = stones.length % 2 === 0 ? 1 : -1;
                                    ghosts.push({
                                        x: provisionalMove.x,
                                        y: provisionalMove.y,
                                        c: nextColor as 1 | -1,
                                        // Distinct style? GoBoard handles ghost stones with opacity.
                                        // Maybe no order number.
                                    });
                                }

                                return ghosts;
                            })()
                        }
                        lastMove={lastMove}
                        onIntersectionClick={handleUserClick}
                        interactive={connected && !isThinking}
                    />


                </div>
            </div>

            {/* Right Panel: AI Info - Bottom on mobile */}
            <div className="w-full md:w-80 bg-[#1c1917] border-t md:border-t-0 md:border-l border-stone-800 flex flex-col shadow-2xl z-20 max-h-[40vh] md:max-h-none overflow-y-auto">
                <div className="p-4 md:p-8 border-b border-stone-800 bg-gradient-to-b from-stone-800 to-[#1c1917] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5"></div>
                    <div className="w-24 h-24 mx-auto bg-stone-950 rounded-full border-4 border-cyan-900/50 flex items-center justify-center mb-4 relative overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.3)] group cursor-help">
                        <div className={`w-16 h-16 bg-cyan-600 rounded-full blur-xl absolute opacity-60 transition-all duration-200 ${isThinking ? 'animate-pulse scale-110' : 'group-hover:opacity-80'}`}></div>
                        <span className="text-4xl relative z-10 filter drop-shadow-lg">🤖</span>
                    </div>
                    <h2 className="text-center text-2xl font-black text-stone-200 tracking-wide">KataGo <span className="text-cyan-500 text-sm align-top">AI</span></h2>

                    {/* Status Badge */}
                    <div className="flex flex-col items-center justify-center mt-3 gap-2">
                        {/* Status / Confirm Controls */}
                        {isThinking ? (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full animate-pulse border border-amber-500/30 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                                AI 思考中...
                            </span>
                        ) : provisionalMove ? (
                            <div className="flex gap-2 animate-fade-in">
                                <button
                                    onClick={confirmMove}
                                    className="px-4 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-full border border-green-500 shadow transition-all flex items-center gap-1"
                                >
                                    <span>✅ 确认</span>
                                </button>
                                <button
                                    onClick={cancelMove}
                                    className="px-4 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold rounded-full border border-stone-600 shadow transition-all flex items-center gap-1"
                                >
                                    <span>❌ 取消</span>
                                </button>
                            </div>
                        ) : (
                            <span className="px-3 py-1 bg-stone-800 text-stone-500 text-xs font-bold rounded-full border border-stone-700">
                                等待落子
                            </span>
                        )}

                        {/* Difficulty Selector */}
                        <select
                            className="bg-stone-900 text-stone-400 text-xs border border-stone-700 rounded px-2 py-1 outline-none focus:border-cyan-500 mt-2"
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                        >
                            <option value="10">难度: 入门 (10 Visits)</option>
                            <option value="50">难度: 业余 (50 Visits)</option>
                            <option value="500">难度: 职业 (500 Visits)</option>
                            <option value="3000">难度: 职业+ (3000 Visits)</option>
                        </select>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    {/* Win-Rate Chart (野狐样式) */}
                    <div className="bg-gradient-to-b from-indigo-950/50 to-purple-950/30 border border-purple-900/50 rounded-lg p-3 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">黑棋胜率变化图</h4>
                            <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${lastPlayerWinrate * 100 > 60 ? 'bg-green-900/50 text-green-400' :
                                lastPlayerWinrate * 100 < 40 ? 'bg-red-900/50 text-red-400' :
                                    'bg-yellow-900/50 text-yellow-400'
                                }`}>
                                {(lastPlayerWinrate * 100).toFixed(1)}%
                            </span>
                        </div>

                        {/* Chart Container */}
                        <div className="relative h-24 w-full bg-gradient-to-b from-stone-950/50 to-stone-900/50 rounded border border-stone-800">
                            {/* Y-Axis Labels */}
                            <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between text-[9px] text-stone-500 font-mono py-1">
                                <span>99</span>
                                <span>70</span>
                                <span>50</span>
                                <span>30</span>
                                <span>0</span>
                            </div>

                            {/* Chart Area */}
                            <div className="absolute left-6 right-0 top-0 bottom-0">
                                <svg viewBox="0 0 200 100" preserveAspectRatio="none" width="100%" height="100%" className="overflow-visible">
                                    {/* Grid Lines */}
                                    <line x1="0" y1="30" x2="200" y2="30" stroke="#4a5568" strokeWidth="0.5" strokeOpacity="0.3" />
                                    <line x1="0" y1="50" x2="200" y2="50" stroke="#718096" strokeWidth="1" strokeDasharray="4 2" />
                                    <line x1="0" y1="70" x2="200" y2="70" stroke="#4a5568" strokeWidth="0.5" strokeOpacity="0.3" />

                                    {gameHistory.length > 0 && (() => {
                                        // 黑棋胜率 = 1 - whiteWinrate
                                        const allPoints = [{ moveNumber: 0, blackWinrate: 0.5 }, ...gameHistory.map(h => ({ moveNumber: h.moveNumber, blackWinrate: 1 - h.whiteWinrate }))];
                                        const maxMove = Math.max(1, allPoints[allPoints.length - 1].moveNumber);

                                        const getX = (moveNum: number) => (moveNum / maxMove) * 200;
                                        const getY = (blackWr: number) => 100 - (blackWr * 100); // Y=0 is top (100%), Y=100 is bottom (0%)

                                        // Find blunders (胜率下降 >= 7%), skip first 2 moves (opening)
                                        const blunders: { moveNumber: number, drop: number, isBlack: boolean }[] = [];
                                        for (let i = 1; i < allPoints.length; i++) {
                                            // Skip first 2 moves - opening is free
                                            if (allPoints[i].moveNumber <= 2) continue;

                                            const drop = allPoints[i - 1].blackWinrate - allPoints[i].blackWinrate;
                                            if (drop >= BLUNDER_THRESHOLD) {
                                                blunders.push({ moveNumber: allPoints[i].moveNumber, drop: drop * 100, isBlack: allPoints[i].moveNumber % 2 === 1 });
                                            }
                                            const whiteWrPrev = 1 - allPoints[i - 1].blackWinrate;
                                            const whiteWrCur = 1 - allPoints[i].blackWinrate;
                                            const whiteDrop = whiteWrPrev - whiteWrCur;
                                            if (whiteDrop >= BLUNDER_THRESHOLD) {
                                                blunders.push({ moveNumber: allPoints[i].moveNumber, drop: whiteDrop * 100, isBlack: false });
                                            }
                                        }

                                        return (
                                            <>
                                                {/* Main Line - Red color like Yehuo */}
                                                {allPoints.slice(1).map((p, i) => {
                                                    const prevP = allPoints[i];
                                                    return (
                                                        <line
                                                            key={`seg-${p.moveNumber}`}
                                                            x1={getX(prevP.moveNumber).toFixed(1)}
                                                            y1={getY(prevP.blackWinrate).toFixed(1)}
                                                            x2={getX(p.moveNumber).toFixed(1)}
                                                            y2={getY(p.blackWinrate).toFixed(1)}
                                                            stroke="#ef4444"
                                                            strokeWidth="2"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    );
                                                })}

                                                {/* Blunder Markers */}
                                                {blunders.filter(b => b.isBlack).slice(0, 5).map((b) => (
                                                    <circle
                                                        key={`blunder-${b.moveNumber}`}
                                                        cx={getX(b.moveNumber).toFixed(1)}
                                                        cy={getY(allPoints.find(p => p.moveNumber === b.moveNumber)?.blackWinrate || 0.5).toFixed(1)}
                                                        r="4"
                                                        fill="#ef4444"
                                                        stroke="#fca5a5"
                                                        strokeWidth="1"
                                                    />
                                                ))}
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex justify-between text-[9px] text-stone-500 font-mono mt-1 px-6">
                            <span>0</span>
                            {gameHistory.length > 0 && (
                                <>
                                    <span>{Math.round(gameHistory[gameHistory.length - 1]?.moveNumber / 4) || ''}</span>
                                    <span>{Math.round(gameHistory[gameHistory.length - 1]?.moveNumber / 2) || ''}</span>
                                    <span>{Math.round(gameHistory[gameHistory.length - 1]?.moveNumber * 3 / 4) || ''}</span>
                                    <span>{gameHistory[gameHistory.length - 1]?.moveNumber || ''}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Problem Moves List */}
                    {gameHistory.length > 5 && (() => {
                        const allPoints = [{ moveNumber: 0, blackWinrate: 0.5 }, ...gameHistory.map(h => ({ moveNumber: h.moveNumber, blackWinrate: 1 - h.whiteWinrate }))];
                        const blackBlunders: { moveNumber: number, drop: number }[] = [];
                        const whiteBlunders: { moveNumber: number, drop: number }[] = [];

                        for (let i = 1; i < allPoints.length; i++) {
                            // Skip first 2 moves - opening is free
                            if (allPoints[i].moveNumber <= 2) continue;

                            const blackDrop = allPoints[i - 1].blackWinrate - allPoints[i].blackWinrate;
                            if (blackDrop >= BLUNDER_THRESHOLD && allPoints[i].moveNumber % 2 === 1) {
                                blackBlunders.push({ moveNumber: allPoints[i].moveNumber, drop: blackDrop * 100 });
                            }
                            const whiteDrop = (1 - allPoints[i - 1].blackWinrate) - (1 - allPoints[i].blackWinrate);
                            if (whiteDrop >= BLUNDER_THRESHOLD && allPoints[i].moveNumber % 2 === 0) {
                                whiteBlunders.push({ moveNumber: allPoints[i].moveNumber, drop: Math.abs(whiteDrop) * 100 });
                            }
                        }

                        if (blackBlunders.length === 0 && whiteBlunders.length === 0) return null;

                        return (
                            <div className="bg-gradient-to-b from-purple-950/30 to-indigo-950/30 border border-purple-900/30 rounded-lg p-3">
                                <div className="flex gap-2 mb-2">
                                    <span className="text-xs font-bold text-stone-300 bg-stone-800 px-2 py-0.5 rounded">⚫ 黑问题手</span>
                                    <span className="text-xs font-bold text-stone-300 bg-stone-700 px-2 py-0.5 rounded">⚪ 白问题手</span>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {blackBlunders.sort((a, b) => b.drop - a.drop).slice(0, 5).map((b, i) => (
                                        <div key={`black-${b.moveNumber}`} className="flex justify-between text-xs bg-stone-900/50 px-2 py-1 rounded">
                                            <span className="text-stone-400">{i + 1}. 第{b.moveNumber}手</span>
                                            <span className="text-red-400 font-mono">胜率降低{b.drop.toFixed(1)}点</span>
                                        </div>
                                    ))}
                                    {whiteBlunders.sort((a, b) => b.drop - a.drop).slice(0, 3).map((b, i) => (
                                        <div key={`white-${b.moveNumber}`} className="flex justify-between text-xs bg-stone-800/50 px-2 py-1 rounded">
                                            <span className="text-stone-500">{i + 1}. 第{b.moveNumber}手 (白)</span>
                                            <span className="text-orange-400 font-mono">胜率降低{b.drop.toFixed(1)}点</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    <div>
                        <h3 className="text-stone-400 font-bold text-xs uppercase tracking-wider mb-3 border-b border-stone-800 pb-2">使用说明</h3>
                        <ul className="space-y-3 text-sm text-stone-400">
                            <li className="flex gap-3">
                                <span className="text-cyan-500 font-bold">📖</span>
                                <span><strong className="text-stone-300">主动学习：</strong>走出恶手时，可悔棋并查看AI正解。</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">💡</span>
                                <span><strong className="text-stone-300">提示功能：</strong>点击"提示"可显示最佳落点。</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Score Lead Display */}
                <div className="px-4 py-3 border-t border-stone-800 bg-stone-900/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500 uppercase tracking-wider">目数估计</span>
                        <span className={`text-lg font-bold font-mono ${lastScoreLead === null ? 'text-stone-500' :
                            lastScoreLead < 0 ? 'text-cyan-400' :
                                lastScoreLead > 0 ? 'text-red-400' : 'text-stone-400'
                            }`}>
                            {lastScoreLead === null ? '--' :
                                lastScoreLead < 0 ? `黑+${Math.abs(lastScoreLead).toFixed(1)}` :
                                    lastScoreLead > 0 ? `白+${lastScoreLead.toFixed(1)}` : '均势'}
                        </span>
                    </div>
                </div>

                <div className="p-4 border-t border-stone-800 bg-stone-900/50 space-y-2">
                    <button onClick={resetGame} className="w-full py-3 bg-stone-800 hover:bg-stone-700 hover:text-white text-stone-400 rounded transition-all font-bold text-sm border border-stone-700 hover:border-stone-500">
                        🔄 重新开始
                    </button>
                    <button
                        onClick={() => {
                            setGameResult({ winner: 'White', reason: '黑棋认输' });
                            setShowResult(true);
                        }}
                        className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded transition-all font-bold text-sm border border-red-900/50 hover:border-red-700"
                    >
                        🏳️ 认输
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIMode;
