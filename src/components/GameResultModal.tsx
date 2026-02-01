import React from 'react';

interface GameResultModalProps {
    winner: 'Black' | 'White';
    reason: string;
    history: { moveNumber: number, whiteWinrate: number }[];
    onClose: () => void;
}

const GameResultModal: React.FC<GameResultModalProps> = ({ winner, reason, history, onClose }) => {
    // Generate SVG path for graph
    const width = 600;
    const height = 200;
    const padding = 20;

    // Normalize data
    // Y-axis: 0 to 1 (0% to 100% White Winrate)
    // X-axis: 0 to max moves
    const maxMoves = Math.max(10, history.length);

    const getX = (index: number) => padding + (index / (maxMoves - 1)) * (width - 2 * padding);
    const getY = (val: number) => height - padding - (val * (height - 2 * padding));

    let pathD = "";
    if (history.length > 1) {
        pathD = `M ${getX(0)} ${getY(history[0].whiteWinrate)}`;
        history.forEach((h, i) => {
            if (i === 0) return;
            pathD += ` L ${getX(i)} ${getY(h.whiteWinrate)}`;
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-900 border-2 border-amber-600 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-700 to-amber-900 p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
                    <h2 className="text-4xl font-black text-white mb-2 drop-shadow-md tracking-wider">
                        {winner === 'Black' ? "挑战成功 (VICTORY)" : "再接再厉 (DEFEAT)"}
                    </h2>
                    <p className="text-amber-200 font-bold text-lg">{reason}</p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Winrate Graph */}
                    <div>
                        <h3 className="text-stone-400 font-bold text-sm uppercase mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                            AI 胜率波动图 (Winrate)
                        </h3>
                        <div className="relative h-48 bg-stone-950 rounded border border-stone-800 shadow-inner">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none opacity-20">
                                <div className="border-t border-stone-500 w-full h-0"></div>
                                <div className="border-t border-stone-500 w-full h-0"></div>
                                <div className="border-t border-stone-500 w-full h-0"></div>
                            </div>

                            {/* The Graph */}
                            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                                {/* 50% Line */}
                                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#444" strokeDasharray="4" />

                                <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />

                                {/* Start Point */}
                                <circle cx={getX(0)} cy={getY(history[0]?.whiteWinrate || 0.5)} r="4" fill="#22d3ee" />
                                {/* End Point */}
                                <circle cx={getX(history.length - 1)} cy={getY(history[history.length - 1]?.whiteWinrate || 0.5)} r="4" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
                            </svg>

                            {/* Labels */}
                            <div className="absolute left-2 top-2 text-[10px] text-stone-500">100%</div>
                            <div className="absolute left-2 bottom-2 text-[10px] text-stone-500">0%</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-stone-800/50 p-4 rounded text-center">
                            <div className="text-stone-500 text-xs mb-1">总手数</div>
                            <div className="text-2xl font-mono font-bold text-stone-200">{history.length}</div>
                        </div>
                        <div className="bg-stone-800/50 p-4 rounded text-center">
                            <div className="text-stone-500 text-xs mb-1">平均胜率</div>
                            <div className="text-2xl font-mono font-bold text-stone-200">
                                {(history.reduce((a, b) => a + b.whiteWinrate, 0) / history.length * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-center">
                    <button onClick={onClose} className="px-8 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded transition-colors border border-stone-700">
                        关闭并复盘
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameResultModal;
