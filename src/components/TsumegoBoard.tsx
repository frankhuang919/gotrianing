
import React, { useEffect, useState } from 'react';
import { useTsumegoStore } from '../store/tsumegoStore';

export const TsumegoBoard: React.FC = () => {
    const {
        boardStones,
        playMove,
        status,
        feedback,
        retry,
        currentProblemId,
        lockEndTime,
        loadNextProblem,
        setupStones
    } = useTsumegoStore();

    // Local timer state for smooth countdown
    const [timeLeft, setTimeLeft] = useState(0);

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

    // Board constants (Same as TesujiBoard)
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
            playMove(gridX, gridY);
        }
    };

    if (!currentProblemId) {
        return <div className="flex items-center justify-center h-full text-gray-500">Please select a Tsumego problem</div>;
    }

    // Coordinate Labels
    const COORDS_X = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    const COORDS_Y = Array.from({ length: 19 }, (_, i) => 19 - i);

    return (
        <div className="flex flex-col h-full w-full p-4 gap-4 overflow-hidden">
            {/* Top Feedback Bar - Increased Height & Fixed Alignment for Overflow */}
            <div className={`w-full h-56 shrink-0 p-4 rounded text-center font-bold text-lg flex flex-col items-center justify-start transition-colors shadow-lg overflow-y-auto
                ${status === 'playing' ? (isLocked ? 'bg-stone-700 text-amber-500' : 'bg-stone-800 text-white') : ''}
                ${status === 'correct' ? 'bg-green-800 text-green-100' : ''}
                ${status === 'wrong' ? 'bg-red-900 text-red-100' : ''}
                ${status === 'solution' ? 'bg-blue-900 text-blue-100' : ''}
            `}>
                <span className="whitespace-pre-wrap leading-relaxed px-2 text-base">{feedback}</span>
                {isLocked && <span className="mt-1 text-xs font-mono animate-pulse opacity-80">⏳ 锁定 {timeLeft}s</span>}
            </div>

            {/* Main Content Area: Board + Sidebar */}
            <div className="flex-1 flex flex-row items-start justify-center gap-6 min-h-0">

                {/* Board Container */}
                <div className={`relative h-full aspect-square bg-[#DEB887] shadow-2xl rounded transition-opacity duration-500 flex-shrink-0
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
                                {/* Top X */}
                                <text x={padding + i * gridSize} y={padding - 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_X[i]}</text>
                                {/* Bottom X */}
                                <text x={padding + i * gridSize} y={boardPixelSize - padding + 25} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_X[i]}</text>

                                {/* Left Y */}
                                <text x={padding - 20} y={padding + i * gridSize + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_Y[i]}</text>
                                {/* Right Y */}
                                <text x={boardPixelSize - padding + 20} y={padding + i * gridSize + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#3f2e18">{COORDS_Y[i]}</text>
                            </React.Fragment>
                        ))}

                        {/* Grid */}
                        {Array.from({ length: size }).map((_, i) => (
                            <React.Fragment key={i}>
                                <line
                                    x1={padding + i * gridSize} y1={padding}
                                    x2={padding + i * gridSize} y2={boardPixelSize - padding}
                                    stroke="#000" strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <line
                                    x1={padding} y1={padding + i * gridSize}
                                    x2={boardPixelSize - padding} y2={padding + i * gridSize}
                                    stroke="#000" strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </React.Fragment>
                        ))}

                        {/* Star Points */}
                        {[3, 9, 15].map(x => [3, 9, 15].map(y => (
                            <circle key={`${x}-${y}`} cx={padding + x * gridSize} cy={padding + y * gridSize} r={4} fill="#000" />
                        )))}

                        {/* Stones */}
                        {boardStones.map((stone, i) => {
                            const isSetup = i < setupStones.length;
                            const moveNum = i - setupStones.length + 1;
                            const isBlack = stone.c === 1;

                            return (
                                <g key={i}>
                                    <circle
                                        cx={padding + stone.x * gridSize}
                                        cy={padding + stone.y * gridSize}
                                        r={gridSize * 0.45}
                                        fill={isBlack ? '#000' : '#fff'}
                                        stroke={!isBlack ? '#000' : 'none'}
                                        strokeWidth="1"
                                        filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.5))"
                                    />
                                    {/* Move Number */}
                                    {!isSetup && (
                                        <text
                                            x={padding + stone.x * gridSize}
                                            y={padding + stone.y * gridSize}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={gridSize * 0.5}
                                            fontWeight="bold"
                                            fill={isBlack ? '#FFF' : '#000'}
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {moveNum}
                                        </text>
                                    )}

                                    {/* Marker for last move (Only if it's setup? Or just Red dot?) 
                                        If we have numbers, we don't strictly need the marker, but a red highlight on the border might be nice.
                                        Let's keep the marker logic simple: Remove distinct dot, Number is enough.
                                        Or keep it if it is setup stone? Setup stones rarely have order.
                                    */}
                                    {i === boardStones.length - 1 && isSetup && (
                                        <circle
                                            cx={padding + stone.x * gridSize}
                                            cy={padding + stone.y * gridSize}
                                            r={gridSize * 0.15}
                                            fill={isBlack ? '#fff' : '#000'}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Status Icons Overlay */}
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

                {/* Right Control Panel */}
                <div className="w-48 flex flex-col gap-4 py-8 shrink-0">
                    {/* Next Button */}
                    {status === 'correct' && (
                        <button
                            onClick={loadNextProblem}
                            className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-all"
                        >
                            <span>下一题 (Next)</span>
                            <span>▶</span>
                        </button>
                    )}

                    {/* Retry */}
                    {(status !== 'playing' || isLocked) && (
                        <button
                            onClick={retry}
                            disabled={isLocked && status !== 'solution'}
                            className={`px-4 py-3 rounded font-bold shadow-lg flex items-center justify-center gap-2 transition-all
                                ${isLocked
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }
                            `}
                        >
                            <span>🔄</span>
                            {isLocked ? `锁定 (${timeLeft}s)` : '重试 (Retry)'}
                        </button>
                    )}

                    <div className="mt-auto p-4 bg-stone-800 rounded text-xs text-stone-500">
                        <h4 className="font-bold text-stone-400 mb-1">训练信息</h4>
                        <div>死活题模块</div>
                        <div>状态: {status}</div>
                    </div>
                </div>

            </div>
        </div>
    );
};
