
import React, { useEffect, useState } from 'react';
import { useTesujiStore } from '../store/tesujiStore';


export const TesujiBoard: React.FC = () => {
    const {
        boardStones,
        playMove,
        status,
        feedback,
        retry,
        currentProblemId,
        lockEndTime,
        loadNextProblem
    } = useTesujiStore();

    // Local timer state for smooth countdown
    const [timeLeft, setTimeLeft] = useState(0);
    const [provisionalMove, setProvisionalMove] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (lockEndTime > Date.now()) {
            const interval = setInterval(() => {
                const diff = Math.max(0, Math.ceil((lockEndTime - Date.now()) / 1000));
                setTimeLeft(diff);
                if (diff <= 0) clearInterval(interval);
            }, 500);
            setTimeLeft(Math.max(0, Math.ceil((lockEndTime - Date.now()) / 1000)));
            return () => clearInterval(interval);
        } else {
            setTimeLeft(0);
        }
    }, [lockEndTime]);

    const isLocked = timeLeft > 0;

    // Board constants
    const gridSize = 40;
    const padding = 40;
    const size = 19;
    const boardPixelSize = gridSize * (size - 1) + padding * 2;

    const handleClick = (e: React.MouseEvent) => {
        if (isLocked) return; // STRICT LOCK
        if (status !== 'playing') return;

        const rect = e.currentTarget.getBoundingClientRect();
        // Scale Factor
        const scale = boardPixelSize / rect.width;

        const x = (e.clientX - rect.left) * scale - padding;
        const y = (e.clientY - rect.top) * scale - padding;

        const gridX = Math.round(x / gridSize);
        const gridY = Math.round(y / gridSize);

        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
            // Check if occupied
            if (boardStones.some(s => s.x === gridX && s.y === gridY)) return;

            setProvisionalMove({ x: gridX, y: gridY });
        }
    };

    const confirmMove = () => {
        if (!provisionalMove) return;
        playMove(provisionalMove.x, provisionalMove.y);
        setProvisionalMove(null);
    };

    const cancelMove = () => {
        setProvisionalMove(null);
    };

    if (!currentProblemId) {
        return <div className="flex items-center justify-center h-full text-gray-500">Please select a problem</div>;
    }

    // Coordinate Labels
    const COORDS_X = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    const COORDS_Y = Array.from({ length: 19 }, (_, i) => 19 - i);

    return (
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-stone-900">
            {/* LEFT: Main Board Area - Maximized */}
            <div className="flex-1 flex items-center justify-center p-2 md:p-4 relative bg-stone-800/30 min-h-0">

                {/* Board Container - Fit within both width AND height */}
                <div className={`relative aspect-square bg-[#DEB887] shadow-2xl rounded transition-opacity duration-500
                    max-h-full max-w-full
                    ${isLocked ? 'grayscale-[50%] cursor-not-allowed' : ''}
                `}>
                    <svg
                        viewBox={`0 0 ${boardPixelSize} ${boardPixelSize}`}
                        className={`w-full h-full ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={handleClick}
                    >
                        {/* Coordinate Labels */}
                        {Array.from({ length: size }).map((_, i) => (
                            <React.Fragment key={`coord-${i}`}>
                                <text x={padding + i * gridSize} y={padding - 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_X[i]}</text>
                                <text x={padding + i * gridSize} y={boardPixelSize - padding + 25} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_X[i]}</text>
                                <text x={padding - 20} y={padding + i * gridSize + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_Y[i]}</text>
                                <text x={boardPixelSize - padding + 20} y={padding + i * gridSize + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_Y[i]}</text>
                            </React.Fragment>
                        ))}

                        {/* Grid */}
                        {Array.from({ length: size }).map((_, i) => (
                            <React.Fragment key={i}>
                                <line x1={padding + i * gridSize} y1={padding} x2={padding + i * gridSize} y2={boardPixelSize - padding} stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                <line x1={padding} y1={padding + i * gridSize} x2={boardPixelSize - padding} y2={padding + i * gridSize} stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            </React.Fragment>
                        ))}

                        {/* Star Points */}
                        {[3, 9, 15].map(x => [3, 9, 15].map(y => (
                            <circle key={`${x}-${y}`} cx={padding + x * gridSize} cy={padding + y * gridSize} r={4} fill="#000" />
                        )))}

                        {/* Stones */}
                        {boardStones.map((stone, i) => (
                            <g key={i}>
                                <circle
                                    cx={padding + stone.x * gridSize}
                                    cy={padding + stone.y * gridSize}
                                    r={gridSize * 0.45}
                                    fill={stone.c === 1 ? '#000' : '#fff'}
                                    stroke={stone.c === -1 ? '#000' : 'none'}
                                    strokeWidth="1"
                                    filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.5))"
                                />
                                {i === boardStones.length - 1 && (
                                    <circle
                                        cx={padding + stone.x * gridSize}
                                        cy={padding + stone.y * gridSize}
                                        r={gridSize * 0.15}
                                        fill={stone.c === 1 ? '#fff' : '#000'}
                                    />
                                )}
                            </g>
                        ))}

                        {/* Provisional Stone (Ghost) */}
                        {provisionalMove && (
                            <circle
                                cx={padding + provisionalMove.x * gridSize}
                                cy={padding + provisionalMove.y * gridSize}
                                r={gridSize * 0.45}
                                fill="rgba(0,0,0,0.5)"
                                style={{ pointerEvents: 'none' }}
                            />
                        )}
                    </svg>

                    {/* Status icons overlay */}
                    {status !== 'playing' && status !== 'solution' && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/10 rounded">
                            {status === 'correct' && (
                                <svg className="w-32 h-32 animate-pulse drop-shadow-2xl" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" stroke="#22c55e" strokeWidth="8" fill="none" />
                                </svg>
                            )}
                            {status === 'wrong' && (
                                <svg className="w-32 h-32 animate-pulse drop-shadow-2xl" viewBox="0 0 100 100">
                                    <line x1="20" y1="20" x2="80" y2="80" stroke="#dc2626" strokeWidth="10" strokeLinecap="round" />
                                    <line x1="80" y1="20" x2="20" y2="80" stroke="#dc2626" strokeWidth="10" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                    )}



                </div>
            </div>

            {/* RIGHT Panel: Sidebar info */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col bg-stone-900 border-t md:border-t-0 md:border-l border-stone-700 shadow-2xl z-20 shrink-0 max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
                {/* Header / Status Banner */}
                <div className={`p-6 text-center shadow-md transition-colors duration-300
                     ${status === 'correct' ? 'bg-green-900/30 border-b border-green-800' : ''}
                     ${status === 'wrong' ? 'bg-red-900/30 border-b border-red-800' : ''}
                     ${status === 'solution' ? 'bg-blue-900/30 border-b border-blue-800' : ''}
                     ${status === 'playing' ? 'bg-stone-800 border-b border-stone-700' : ''}
                `}>
                    <div className={`text-2xl font-bold mb-1
                         ${status === 'correct' ? 'text-green-400' : ''}
                         ${status === 'wrong' ? 'text-red-400' : ''}
                         ${status === 'solution' ? 'text-blue-400' : ''}
                         ${status === 'playing' ? 'text-stone-200' : ''}
                     `}>
                        {status === 'playing' && (isLocked ? '⏳ 思考中' : '请落子')}
                        {status === 'correct' && '✅ 正解!'}
                        {status === 'wrong' && '❌ 失败'}
                        {status === 'solution' && '💡 正解演示'}
                    </div>
                    {isLocked && <div className="text-sm text-stone-400 font-mono">锁定时间: {timeLeft}s</div>}
                </div>

                {/* Main Content: Explanation / Feedback */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-stone-700">
                    <div className="text-lg leading-relaxed text-gray-300 whitespace-pre-wrap font-serif">
                        {feedback}
                    </div>
                </div>

                {/* Bottom Actions Area */}
                <div className="p-6 bg-stone-800/50 border-t border-stone-700 flex flex-col gap-4">
                    {/* Next Button (Primary) */}
                    {status === 'correct' && (
                        <button
                            onClick={loadNextProblem}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xl"
                        >
                            <span>下一题</span>
                            <span>▶</span>
                        </button>
                    )}

                    {/* Confirm Move Controls */}
                    {provisionalMove && (
                        <div className="flex gap-3 mb-2 animate-fade-in">
                            <button
                                onClick={confirmMove}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span>✅</span>
                                <span>确认落子</span>
                            </button>
                            <button
                                onClick={cancelMove}
                                className="flex-1 py-3 bg-stone-600 hover:bg-stone-500 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span>❌</span>
                                <span>取消</span>
                            </button>
                        </div>
                    )}

                    {/* Retry / Generic Action */}
                    <button
                        onClick={retry}
                        disabled={isLocked && status !== 'solution'}
                        className={`w-full py-3 rounded-lg font-bold shadow flex items-center justify-center gap-2 transition-all
                            ${isLocked
                                ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                                : 'bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white border border-stone-600'
                            }
                        `}
                    >
                        <span>🔄</span>
                        {status === 'solution' ? '重试 (Retry)' : (isLocked ? '锁定中...' : '重试本题')}
                    </button>
                </div>
            </div>
        </div>

    );
};
