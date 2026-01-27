import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface GoBoardProps {
    size?: number;
}

const GoBoard: React.FC<GoBoardProps> = ({ size = 19 }) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const { boardState, playMove, status, initialStones } = useGameStore();
    const [boardSizePx, setBoardSizePx] = useState(600);

    // Responsive board size
    useEffect(() => {
        const handleResize = () => {
            if (boardRef.current) {
                const width = Math.min(window.innerWidth - 40, 600);
                setBoardSizePx(width);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const gridSize = boardSizePx / (size + 1);
    const padding = gridSize;

    // Helper to get coords from click
    const handleClick = (e: React.MouseEvent) => {
        if (status === 'LOCKED' || status === 'REFUTATION') return;

        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to grid coords
        // 0-indexed: 0..18
        // Position on screen = padding + index * gridSize
        // index = (Pos - padding) / gridSize

        const gridX = Math.round((x - padding) / gridSize);
        const gridY = Math.round((y - padding) / gridSize);

        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
            playMove(gridX, gridY);
        }
    };

    // Generate Grid Lines
    const lines = [];
    for (let i = 0; i < size; i++) {
        const pos = padding + i * gridSize;
        // Vertical
        lines.push(<line key={`v-${i}`} x1={pos} y1={padding} x2={pos} y2={boardSizePx - padding} stroke="#000" strokeWidth="1" />);
        // Horizontal
        lines.push(<line key={`h-${i}`} x1={padding} y1={pos} x2={boardSizePx - padding} y2={pos} stroke="#000" strokeWidth="1" />);
    }

    // Star Points (3,3), (9,3), (15,3) etc for 19x19
    const starPoints: { x: number, y: number }[] = [];
    if (size === 19) {
        const points = [3, 9, 15];
        points.forEach(row => {
            points.forEach(col => {
                starPoints.push({ x: row, y: col });
            });
        });
    }

    return (
        <div className="flex justify-center items-center h-full bg-stone-800 p-4">
            <div
                ref={boardRef}
                className="relative bg-[#DBB06C] shadow-2xl rounded"
                style={{ width: boardSizePx, height: boardSizePx, cursor: 'pointer' }}
                onClick={handleClick}
            >
                <svg width={boardSizePx} height={boardSizePx}>
                    {/* Grid Lines */}
                    {lines}

                    {/* Star Points */}
                    {starPoints.map((p, i) => (
                        <circle
                            key={`star-${i}`}
                            cx={padding + p.x * gridSize}
                            cy={padding + p.y * gridSize}
                            r={3}
                            fill="#000"
                        />
                    ))}

                    {/* Stones */}
                    {boardState.map((stone, i) => (
                        <g key={`stone-${i}`}>
                            {/* Shadow */}
                            <circle
                                cx={padding + stone.x * gridSize + 2}
                                cy={padding + stone.y * gridSize + 2}
                                r={gridSize * 0.45}
                                fill="rgba(0,0,0,0.3)"
                            />
                            {/* Stone Body */}
                            <circle
                                cx={padding + stone.x * gridSize}
                                cy={padding + stone.y * gridSize}
                                r={gridSize * 0.45}
                                fill={stone.c === 1 ? '#000' : '#fff'}
                                stroke={stone.c === -1 ? '#ccc' : 'none'}
                                strokeWidth={1}
                            />
                            {/* Simple shine for aesthetic */}
                            {stone.c === 1 ? (
                                <circle
                                    cx={padding + stone.x * gridSize - gridSize * 0.15}
                                    cy={padding + stone.y * gridSize - gridSize * 0.15}
                                    r={gridSize * 0.15}
                                    fill="rgba(255,255,255,0.2)"
                                />
                            ) : (
                                <circle
                                    cx={padding + stone.x * gridSize - gridSize * 0.15}
                                    cy={padding + stone.y * gridSize - gridSize * 0.15}
                                    r={gridSize * 0.2}
                                    fill="rgba(255,255,255,0.8)"
                                />
                            )}

                            {/* Move Number */}
                            {i >= initialStones.length && (
                                <text
                                    x={padding + stone.x * gridSize}
                                    y={padding + stone.y * gridSize}
                                    dy=".35em"
                                    textAnchor="middle"
                                    fill={stone.c === 1 ? '#fff' : '#000'}
                                    fontSize={gridSize * 0.5}
                                    fontFamily="sans-serif"
                                    pointerEvents="none"
                                >
                                    {i - initialStones.length + 1}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Hover Effect? Optional */}
                </svg>
            </div>
        </div>
    );
};

export default GoBoard;
