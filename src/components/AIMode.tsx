import React, { useState, useEffect, useRef } from 'react';
import GoBoard from './GoBoard';
import GameResultModal from './GameResultModal';

// --- CONFIG ---
const PLAYER_MAX_HP = 100;
const BOSS_MAX_HP = 3000; // Big boss
const DAMAGE_SCALE = 5; // 1% winrate drop = 5 damage
const BASE_BOSS_DAMAGE = 150; // Every non-blunder move hurts boss
const BLUNDER_THRESHOLD = 0.05; // 5% drop is a blunder

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

// Parse 'info move ... winrate X ...'
const parseWinrate = (response: string): number | null => {
    try {
        // Look for "winrate <FLOAT>"
        // response might be multi-line, take the first "info" line with highest visits or just first line
        const match = response.match(/winrate\s+([\d.]+)/);
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
    } catch (e) {
        console.error("Failed to parse winrate", e);
    }
    return null;
};

import { resolveBoardState, type Point } from '../utils/goLogic';

const AIMode: React.FC = () => {
    // Game State
    const [connected, setConnected] = useState(false);
    // Explicitly define state type to match GoBoard expectations
    const [stones, setStones] = useState<{ x: number, y: number, c: 1 | -1 }[]>([]);
    const [lastMove, setLastMove] = useState<{ x: number, y: number } | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    // ... (rest of component state)

    // ... (skip down to playStone) ...
    // Note: I need to target playStone as well to fix the return type


    // Boss Logic
    const [playerHP, setPlayerHP] = useState(PLAYER_MAX_HP);
    const [bossHP, setBossHP] = useState(BOSS_MAX_HP);
    const [lastPlayerWinrate, setLastPlayerWinrate] = useState(0.5); // Start at 50%
    const [difficulty, setDifficulty] = useState(50); // Default to Amateur (50 visits)
    const [feedback, setFeedback] = useState<{ msg: string, type: 'good' | 'bad' | 'neutral' } | null>(null);
    const [shake, setShake] = useState(false);

    // History & Results
    const [gameHistory, setGameHistory] = useState<{ moveNumber: number, whiteWinrate: number }[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [gameResult, setGameResult] = useState<{ winner: 'Black' | 'White', reason: string }>({ winner: 'White', reason: 'Resignation' });

    const ws = useRef<WebSocket | null>(null);
    const thinkingTimeout = useRef<number | null>(null); // Safety timeout

    useEffect(() => {
        // Cloud-Ready Config: Use Env Variable or default to Local
        const wsUrl = import.meta.env.VITE_AI_ENDPOINT || 'ws://127.0.0.1:3001';
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
            setConnected(true);
            setFeedback({ msg: "BOSS ENCOUNTER STARTED", type: 'neutral' });
            // Initial Reset
            sendCommand("clear_board");
            sendCommand("komi 7.5"); // Chinese rules usually
            // Set initial difficulty
            sendCommand("time_settings", ["0", "1", "1"]); // Speed up simple moves
            // We use maxVisits to control strength
            // sendCommand("kata-set-param", ["maxVisits", difficulty]); // Try to set initial
        };

        socket.onclose = () => {
            setConnected(false);
            setFeedback({ msg: "CONNECTION LOST", type: 'bad' });
            setIsThinking(false);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleBackendResponse(data);
        };

        return () => {
            if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);
            socket.close();
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
        if (isThinking || !connected || playerHP <= 0 || bossHP <= 0) return;

        // 1. User Plays (Optimistic)
        playStone(x, y, 1); // Black
        const gtpCoord = toGTP(x, y);
        sendCommand("play", ["B", gtpCoord]);

        // 2. Trigger Analysis immediately to judge the move
        // Why? We want to know if THIS move was bad.
        // We ask AI: "Analyze White's turn now".
        // White's Winrate = 1 - Black's Winrate.
        setIsThinking(true);

        // Safety: Auto-unlock after 15s if AI doesn't respond
        if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);
        thinkingTimeout.current = window.setTimeout(() => {
            setIsThinking(false);
            setFeedback({ msg: "AI TIMEOUT - RETRY", type: 'neutral' });
        }, 15000);

        // setFeedback({ msg: "Analyzing move...", type: 'neutral' }); // Removed noisy feedback
        // Use FAST analysis (15 visits) just for blunder check
        // TEMPORARILY DISABLED: Blocking analyze command causing freezes
        // sendCommand("analyze", ["W", 15]); 

        // Combined Genmove + Analyze (Efficient)
        // This returns the move AND the winrate evaluation
        sendCommand("kata-genmove_analyze", ["W", difficulty]);
    };

    const handleBackendResponse = (data: any) => {
        // Handle AI Move & Analysis together
        if (data.command === 'kata-genmove_analyze' || data.command === 'genmove') {
            setIsThinking(false);
            if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);

            if (data.success) {
                const responseText = data.response || "";

                // Parse Move (First token usually)
                // kata-genmove_analyze output format:
                // play <move>
                // info ...
                let moveStr = "";
                let whiteWinrate = null;

                const lines = responseText.split('\n');
                for (const line of lines) {
                    if (line.startsWith('play ')) {
                        moveStr = line.split(' ')[1];
                    } else if (line.startsWith('info') && line.includes('winrate')) {
                        // Extract winrate from the info line with highest visits (usually first info line is best)
                        const w = parseWinrate(line);
                        if (w !== null && whiteWinrate === null) whiteWinrate = w;
                    }
                    // Fallback for standard genmove
                    else if (!moveStr && fromGTP(line)) {
                        moveStr = line;
                    }
                }

                // Handle Move
                if (moveStr) {
                    if (moveStr.toLowerCase() === 'resign') {
                        setBossHP(0);
                        setFeedback({ msg: "BOSS RESIGNED!", type: 'good' });
                        setGameResult({ winner: 'Black', reason: 'Boss Resigned' });
                        setShowResult(true);
                        return;
                    }
                    if (moveStr.toLowerCase() === 'pass') {
                        setFeedback({ msg: "AI Passed", type: 'neutral' });
                        return;
                    }

                    const coords = fromGTP(moveStr);
                    if (coords) {
                        playStone(coords.x, coords.y, -1);
                    }
                }

                // Handle Winrate / HP Logic
                if (whiteWinrate !== null) {
                    const blackWinrate = 1.0 - whiteWinrate;

                    // Record History
                    setGameHistory(prev => [...prev, { moveNumber: prev.length + 1, whiteWinrate: whiteWinrate! }]);

                    // SPECIAL: First move calibration (Fix for "Star Point Blunder" bug)
                    if (gameHistory.length === 0) {
                        setLastPlayerWinrate(blackWinrate);
                        setFeedback({ msg: "AI 校准完成 (Calibration)", type: 'neutral' });
                        takeBossDamage(10); // Encouragement
                        return;
                    }

                    // Calculate Damage
                    const delta = lastPlayerWinrate - blackWinrate;

                    if (delta > 0.07) {
                        // Player made a bad move (Winrate dropped significantly)
                        const dmg = Math.floor(delta * 100 * DAMAGE_SCALE);
                        takePlayerDamage(dmg);
                        setFeedback({ msg: `大恶手! 胜率跌了 ${(delta * 100).toFixed(1)}%`, type: 'bad' });
                    } else {
                        // Player played well or AI improved slightly
                        const dmg = BASE_BOSS_DAMAGE + (delta < 0 ? 50 : 0);
                        takeBossDamage(dmg);
                        if (delta < -0.02) setFeedback({ msg: "妙手! (EXCELLENT)", type: 'good' });
                    }
                    setLastPlayerWinrate(blackWinrate);
                } else {
                    // Fallback if no winrate returned (e.g. plain genmove)
                    takeBossDamage(50);
                }
            }
        }
    };

    // --- EFFECTS ---
    const takePlayerDamage = (amount: number) => {
        setPlayerHP(prev => Math.max(0, prev - amount));
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const takeBossDamage = (amount: number) => {
        setBossHP(prev => {
            const next = Math.max(0, prev - amount);
            if (next === 0 && prev > 0) {
                // Boss Defeated
                setGameResult({ winner: 'Black', reason: 'Boss HP Depleted' });
                setShowResult(true);
            }
            return next;
        });
    };

    const resetGame = () => {
        setStones([]);
        setLastMove(null);
        setPlayerHP(PLAYER_MAX_HP);
        setBossHP(BOSS_MAX_HP);
        setLastPlayerWinrate(0.5);
        setGameHistory([]);
        setShowResult(false);
        setFeedback({ msg: "NEW ROUND STARTED", type: 'neutral' });
        setIsThinking(false);
        if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current);

        sendCommand("clear_board");
        // Re-apply difficulty just in case
        sendCommand("kata-set-param", ["maxVisits", difficulty]);
    };

    // --- RENDER ---
    return (
        <div className={`flex h-screen bg-stone-950 text-stone-200 overflow-hidden ${shake ? 'animate-shake' : ''}`}>
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
            `}</style>

            {/* Main Board Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-stone-900 to-stone-950">
                {/* HUD: Health Bars */}
                <div className="w-full max-w-5xl flex items-center justify-between p-6 z-10 gap-8">

                    {/* Player Health */}
                    <div className="flex flex-col w-1/3 relative group">
                        <div className="flex justify-between text-cyan-400 font-bold mb-1 items-end">
                            <span className="text-xl">你的心态 (Stability)</span>
                            <span className="font-mono text-lg">{Math.ceil(playerHP)}/{PLAYER_MAX_HP}</span>
                        </div>
                        <div className="h-6 bg-stone-800/80 rounded border border-stone-600 shadow-[0_0_15px_rgba(34,211,238,0.15)] relative overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-700 via-cyan-500 to-blue-500 transition-all duration-500 relative"
                                style={{ width: `${(playerHP / PLAYER_MAX_HP) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                            </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5">
                            出现恶手会大幅扣血
                        </p>
                    </div>

                    {/* VS Badge / Round Info */}
                    <div className="flex flex-col items-center justify-center -mt-2">
                        <div className="text-stone-700 font-black text-4xl italic opacity-30 select-none">VS</div>
                        <div className={`text-xs font-mono font-bold ${connected ? 'text-green-500' : 'text-stone-600'}`}>
                            {connected ? "LINKED" : "OFFLINE"}
                        </div>
                    </div>

                    {/* Boss Health */}
                    <div className="flex flex-col w-1/3 items-end relative group">
                        <div className="flex justify-between w-full text-red-500 font-bold mb-1 items-end">
                            <span className="font-mono text-lg">{Math.ceil(bossHP)}/{BOSS_MAX_HP}</span>
                            <span className="text-xl">Boss 血量</span>
                        </div>
                        <div className="h-6 bg-stone-800/80 rounded border border-stone-600 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden backdrop-blur-sm w-full">
                            <div
                                className="h-full bg-gradient-to-l from-red-700 via-red-600 to-rose-500 transition-all duration-500 absolute right-0"
                                style={{ width: `${(bossHP / BOSS_MAX_HP) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 right-0">
                            每一步有效棋都在造成伤害
                        </p>
                    </div>
                </div>

                {/* Feedback Area - Integrated to prevent blocking */}
                <div className="h-12 flex items-center justify-center w-full my-4">
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
                        </div>
                    )}
                </div>

                {/* Feedback Overlay REMOVED (Moved to HUD) */}

                {/* Board */}
                <div className="h-[75vh] aspect-square relative shadow-2xl rounded-sm overflow-hidden border-[12px] border-stone-800 bg-[#dc933c]">
                    <GoBoard
                        size={19}
                        stones={stones}
                        lastMove={lastMove}
                        onIntersectionClick={handleUserClick}
                        interactive={connected && !isThinking && playerHP > 0 && bossHP > 0}
                    />

                    {/* Game Over Overlays */}
                    {playerHP <= 0 && (
                        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in text-center p-8">
                            <h1 className="text-7xl font-black text-red-600 mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">挑战失败</h1>
                            <p className="text-stone-400 text-xl mb-8">你的心态崩了 (恶手过多)</p>
                            <button onClick={resetGame} className="px-10 py-4 bg-gradient-to-r from-red-700 to-red-600 text-white font-bold rounded hover:scale-105 transition-transform shadow-lg border border-red-500">
                                再次挑战
                            </button>
                        </div>
                    )}
                    {bossHP <= 0 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-yellow-600/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in text-center p-8">
                            <h1 className="text-7xl font-black text-white mb-2 drop-shadow-lg">挑战成功!</h1>
                            <p className="text-amber-100 text-xl mb-8">你击败了 KataGo (Lv.1)</p>
                            <button onClick={resetGame} className="px-10 py-4 bg-white text-amber-700 font-bold rounded hover:scale-105 transition-transform shadow-xl">
                                下一关
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Boss Info */}
            <div className="w-80 bg-[#1c1917] border-l border-stone-800 flex flex-col shadow-2xl z-20">
                <div className="p-8 border-b border-stone-800 bg-gradient-to-b from-stone-800 to-[#1c1917] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5"></div>
                    <div className="w-24 h-24 mx-auto bg-stone-950 rounded-full border-4 border-red-900/50 flex items-center justify-center mb-4 relative overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.3)] group cursor-help">
                        {/* Abstract Boss Eye */}
                        <div className={`w-16 h-16 bg-red-600 rounded-full blur-xl absolute opacity-60 transition-all duration-200 ${isThinking ? 'animate-pulse scale-110' : 'group-hover:opacity-80'}`}></div>
                        <span className="text-4xl relative z-10 filter drop-shadow-lg">👹</span>
                    </div>
                    <h2 className="text-center text-2xl font-black text-stone-200 tracking-wide">KataGo <span className="text-red-500 text-sm align-top">魔王</span></h2>

                    {/* Status Badge */}
                    <div className="flex flex-col items-center justify-center mt-3 gap-2">
                        {isThinking ? (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full animate-pulse border border-amber-500/30 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                                AI 正在思考/分析...
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-stone-800 text-stone-500 text-xs font-bold rounded-full border border-stone-700">
                                等待黑棋落子
                            </span>
                        )}

                        {/* Difficulty Selector */}
                        <select
                            className="bg-stone-900 text-stone-400 text-xs border border-stone-700 rounded px-2 py-1 outline-none focus:border-cyan-500 mt-2"
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                        // Always enabled to allow difficulty switch during hangs
                        >
                            <option value="10">难度: 入门 (10 Visits)</option>
                            <option value="50">难度: 业余 (50 Visits)</option>
                            <option value="500">难度: 职业 (500 Visits)</option>
                            <option value="3000">难度: 魔王 (3000 Visits)</option>
                        </select>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Live Winrate Graph */}
                    <div className="bg-stone-900 border border-stone-800 rounded p-3 shadow-inner">
                        <div className="flex justify-between items-end mb-2">
                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">形势走势</h4>
                            <span className={`text-xs font-mono font-bold ${(lastPlayerWinrate * 100) > 40 ? 'text-green-500' : 'text-red-500'}`}>
                                {(lastPlayerWinrate * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-16 relative w-full overflow-hidden">
                            {/* Sparkline */}
                            <svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
                                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#333" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                                {gameHistory.length > 1 && (
                                    <path
                                        d={`M 0 ${64 * (1 - (gameHistory[0]?.whiteWinrate || 0.5))} ` +
                                            gameHistory.map((h, i) =>
                                                `L ${(i / (Math.max(1, gameHistory.length - 1))) * 100}% ${64 * (1 - h.whiteWinrate)}`
                                            ).join(' ')
                                        }
                                        fill="none"
                                        stroke={lastPlayerWinrate > 0.4 ? "#22d3ee" : "#ef4444"}
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                )}
                            </svg>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-stone-400 font-bold text-xs uppercase tracking-wider mb-3 border-b border-stone-800 pb-2">游戏规则</h3>
                        <ul className="space-y-3 text-sm text-stone-400">
                            <li className="flex gap-3">
                                <span className="text-red-500 font-bold">⚔️</span>
                                <span><strong className="text-stone-300">削弱 Boss：</strong>每走一步稳健的棋，Boss 都会掉血。</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">✨</span>
                                <span><strong className="text-stone-300">暴击伤害：</strong>走出 AI 认可的绝妙手段，造成巨额伤害。</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-stone-800 bg-stone-900/50">
                    <button onClick={resetGame} className="w-full py-3 bg-stone-800 hover:bg-stone-700 hover:text-white text-stone-400 rounded transition-all font-bold text-sm border border-stone-700 hover:border-stone-500">
                        🔄 重新开始
                    </button>
                    <div className="mt-2 text-center">
                        <button className="text-[10px] text-stone-600 hover:text-stone-400 underline">
                            切换回传统模式
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIMode;
