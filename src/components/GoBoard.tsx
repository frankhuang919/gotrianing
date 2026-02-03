import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface GoBoardProps {
    size?: number;
    stones?: { x: number, y: number, c: 1 | -1 }[];
    ghostStones?: { x: number, y: number, c: 1 | -1, order?: number }[];
    lastMove?: { x: number, y: number } | null;
    onIntersectionClick?: (x: number, y: number) => void;
    interactive?: boolean;
    showCoords?: boolean;
}

const GoBoard: React.FC<GoBoardProps> = ({
    size = 19,
    stones,
    ghostStones,
    lastMove,
    onIntersectionClick,
    interactive = true,
    showCoords = true
}) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const { boardState, playMove, status, initialStones } = useGameStore();
    const [boardSizePx, setBoardSizePx] = useState(600);

    // Determine Source of Truth (Props > Store)
    const displayStones = (stones || boardState).filter(s => s.x >= 0 && s.y >= 0);
    const activeLastMove = lastMove !== undefined ? lastMove : null;
    // Wait, useGameStore doesn't return lastMove? 
    // Checking GameStore... usually it does or we infer it.
    // If props lastMove is provided, use it. If not, maybe store doesn't show it?
    // Let's assume store handles it implicitly or check logic.
    // Existing code didn't render lastMove marker? 
    // Checked lines 97+: "Refactoring GoBoard...". Original code had no lastMove marker logic visible in snippets. 
    // Just stones.
    // I will use stones for now.

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

    // Add more padding so edge stones (at x=0 or x=18) aren't clipped
    const gridSize = boardSizePx / (size + 1.5);
    const padding = gridSize * 1.25;

    // Helper to get coords from click
    const handleClick = (e: React.MouseEvent) => {
        // If props control interaction, use that check
        if (stones && !interactive) return;

        // If store controls, check status
        if (!stones && (status === 'LOCKED' || status === 'REFUTATION')) return;

        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gridX = Math.round((x - padding) / gridSize);
        const gridY = Math.round((y - padding) / gridSize);

        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
            if (onIntersectionClick) {
                onIntersectionClick(gridX, gridY);
            } else {
                playMove(gridX, gridY);
            }
        }
    };

    // Generate Grid Lines
    const lines = [];
    for (let i = 0; i < size; i++) {
        const pos = padding + i * gridSize;
        lines.push(<line key={`v-${i}`} x1={pos} y1={padding} x2={pos} y2={boardSizePx - padding} stroke="#000" strokeWidth="1" />);
        lines.push(<line key={`h-${i}`} x1={padding} y1={pos} x2={boardSizePx - padding} y2={pos} stroke="#000" strokeWidth="1" />);
    }

    const starPoints: { x: number, y: number }[] = [];
    if (size === 19) {
        const points = [3, 9, 15];
        points.forEach(row => points.forEach(col => starPoints.push({ x: row, y: col })));
    }

    // Coordinates
    const coords = [];
    if (showCoords) {
        const letters = "ABCDEFGHJKLMNOPQRST";
        for (let i = 0; i < size; i++) {
            const pos = padding + i * gridSize;
            // Top Letters
            if (i < letters.length) {
                coords.push(
                    <text key={`lx-${i}`} x={pos} y={padding * 0.4} textAnchor="middle" fontSize={gridSize * 0.4} fill="#8B4513" fontWeight="bold">
                        {letters[i]}
                    </text>
                );
            }
            // Left Numbers (19 down to 1)
            const num = size - i;
            coords.push(
                <text key={`ny-${i}`} x={padding * 0.4} y={pos + gridSize * 0.15} textAnchor="middle" fontSize={gridSize * 0.4} fill="#8B4513" fontWeight="bold">
                    {num}
                </text>
            );
        }
    }

    return (
        <div className="flex justify-center items-center h-full bg-stone-800 p-8">
            <div
                ref={boardRef}
                className="relative bg-[#DBB06C] shadow-2xl rounded"
                style={{ width: boardSizePx, height: boardSizePx, cursor: interactive ? 'pointer' : 'default' }}
                onClick={handleClick}
            >
                <svg width={boardSizePx} height={boardSizePx} style={{ overflow: 'visible', display: 'block' }}>
                    {lines}
                    {coords}
                    {starPoints.map((p, i) => (
                        <circle key={`star-${i}`} cx={padding + p.x * gridSize} cy={padding + p.y * gridSize} r={3} fill="#000" />
                    ))}

                    {displayStones.map((stone, i) => (
                        <g key={`stone-${i}`}>
                            <circle
                                cx={padding + stone.x * gridSize + 2}
                                cy={padding + stone.y * gridSize + 2}
                                r={gridSize * 0.45}
                                fill="rgba(0,0,0,0.3)"
                            />
                            <circle
                                cx={padding + stone.x * gridSize}
                                cy={padding + stone.y * gridSize}
                                r={gridSize * 0.45}
                                fill={stone.c === 1 ? '#000' : '#fff'}
                                stroke={stone.c === -1 ? '#ccc' : 'none'}
                                strokeWidth={1}
                            />
                            {stone.c === 1 ? (
                                <circle cx={padding + stone.x * gridSize - gridSize * 0.15} cy={padding + stone.y * gridSize - gridSize * 0.15} r={gridSize * 0.15} fill="rgba(255,255,255,0.2)" />
                            ) : (
                                <circle cx={padding + stone.x * gridSize - gridSize * 0.15} cy={padding + stone.y * gridSize - gridSize * 0.15} r={gridSize * 0.2} fill="rgba(255,255,255,0.8)" />
                            )}

                            {/* Last Move Marker (Red Triangle) if provided or enabled */}
                            {activeLastMove && activeLastMove.x === stone.x && activeLastMove.y === stone.y && (
                                <path
                                    d={`M ${padding + stone.x * gridSize} ${padding + stone.y * gridSize - gridSize * 0.25} L ${padding + stone.x * gridSize + gridSize * 0.25} ${padding + stone.y * gridSize + gridSize * 0.15} L ${padding + stone.x * gridSize - gridSize * 0.25} ${padding + stone.y * gridSize + gridSize * 0.15} Z`}
                                    fill={stone.c === 1 ? '#fff' : '#000'} // Contrast
                                />
                            )}

                            {/* Move Number (Only for default mode or if requested) */}
                            {!stones && i >= initialStones.length && (
                                <text
                                    x={padding + stone.x * gridSize}
                                    y={padding + stone.y * gridSize}
                                    dy=".35em"
                                    textAnchor="middle"
                                    fill={stone.c === 1 ? '#fff' : '#000'}
                                    fontSize={gridSize * 0.6}
                                    fontFamily="sans-serif"
                                    fontWeight="bold"
                                    pointerEvents="none"
                                >
                                    {i - initialStones.length + 1}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Ghost Stones (Variations) */}
                    {ghostStones?.map((stone, i) => (
                        <g key={`ghost-${i}`} style={{ opacity: 0.6, pointerEvents: 'none' }}>
                            <circle
                                cx={padding + stone.x * gridSize}
                                cy={padding + stone.y * gridSize}
                                r={gridSize * 0.4}
                                fill={stone.c === 1 ? '#000' : '#fff'}
                                stroke="#888"
                                strokeWidth={1}
                                strokeDasharray="4 2"
                            />
                            {stone.order && (
                                <text
                                    x={padding + stone.x * gridSize}
                                    y={padding + stone.y * gridSize}
                                    dy=".35em"
                                    textAnchor="middle"
                                    fill={stone.c === 1 ? '#fff' : '#000'}
                                    fontSize={gridSize * 0.5}
                                    fontFamily="sans-serif"
                                    fontWeight="bold"
                                >
                                    {stone.order}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default GoBoard;
