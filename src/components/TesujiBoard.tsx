
import React from 'react';
import { useTesujiStore } from '../store/tesujiStore';

export const TesujiBoard: React.FC = () => {
    const {
        boardStones,
        playMove,
        status,
        feedback,
        retry,
        currentProblemId
    } = useTesujiStore();

    // Board constants (same as GoBoard for consistency, or simplified)
    const gridSize = 40;
    const padding = 40;
    const size = 19;
    const boardPixelSize = gridSize * (size - 1) + padding * 2;

    const handleClick = (e: React.MouseEvent) => {
        if (status !== 'playing') return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;

        const gridX = Math.round(x / gridSize);
        const gridY = Math.round(y / gridSize);

        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
            playMove(gridX, gridY);
        }
    };

    if (!currentProblemId) {
        return <div className="flex items-center justify-center h-full text-gray-500">Please select a problem</div>;
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4">

            {/* Feedback / Explanation Box */}
            <div className={`w-full max-w-[600px] p-4 rounded text-center font-bold text-lg min-h-[80px] flex items-center justify-center transition-colors
                ${status === 'playing' ? 'bg-gray-800 text-white' : ''}
                ${status === 'correct' ? 'bg-green-800 text-green-100' : ''}
                ${status === 'wrong' ? 'bg-red-900 text-red-100' : ''}
            `}>
                {feedback}
            </div>

            {/* Board */}
            <div className="relative bg-[#DEB887] shadow-2xl rounded" style={{ width: boardPixelSize, height: boardPixelSize }}>
                <svg
                    width={boardPixelSize}
                    height={boardPixelSize}
                    onClick={handleClick}
                    className="cursor-pointer"
                >
                    {/* Grid */}
                    {Array.from({ length: size }).map((_, i) => (
                        <React.Fragment key={i}>
                            <line
                                x1={padding + i * gridSize} y1={padding}
                                x2={padding + i * gridSize} y2={boardPixelSize - padding}
                                stroke="#000" strokeWidth="1"
                            />
                            <line
                                x1={padding} y1={padding + i * gridSize}
                                x2={boardPixelSize - padding} y2={padding + i * gridSize}
                                stroke="#000" strokeWidth="1"
                            />
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
                            {/* Marker for last move? */}
                            {i === boardStones.length - 1 && (
                                <circle
                                    cx={padding + stone.x * gridSize}
                                    cy={padding + stone.y * gridSize}
                                    r={gridSize * 0.15}
                                    fill={stone.c === 1 ? '#fff' : '#000'} // Contrast dot
                                />
                            )}
                        </g>
                    ))}
                </svg>

                {/* Status Overlay (Optional) */}
                {status !== 'playing' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        {status === 'correct' && (
                            <div className="text-9xl text-green-500 font-bold opacity-80 animate-pulse">⭕</div>
                        )}
                        {status === 'wrong' && (
                            <div className="text-9xl text-red-600 font-bold opacity-80 animate-shake">❌</div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            {status !== 'playing' && (
                <button
                    onClick={retry}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg"
                >
                    再试一次 (Retry)
                </button>
            )}
        </div>
    );
};
