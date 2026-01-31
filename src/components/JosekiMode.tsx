import React, { useEffect } from 'react';
import GoBoard from './GoBoard';
import { useJosekiStore } from '../store/josekiStore';
import type { JosekiType } from '../data/joseki_loader';

export const JosekiMode: React.FC = () => {
    const {
        selectedType,
        selectType,
        phase,
        boardStones,
        lastMove,
        feedback,
        startPractice,
        playMove,
        nextProblem,
        isCorrect
    } = useJosekiStore();

    useEffect(() => {
        // Default to 4-4 on load if nothing selected
        if (!selectedType) {
            selectType('4-4');
        }
    }, [selectedType, selectType]);

    const handleBoardClick = (x: number, y: number) => {
        if (phase === 'PRACTICE_WHITE' || phase === 'PRACTICE_BLACK') {
            playMove(x, y);
        }
    };

    // Status Color
    const getStatusColor = () => {
        if (isCorrect === true) return 'text-green-400';
        if (isCorrect === false) return 'text-red-400';
        return 'text-amber-100';
    };

    return (
        <div className="flex flex-col h-screen bg-stone-900 text-stone-200">
            {/* Header: Selectors & Status */}
            <div className="h-16 bg-stone-800 border-b border-stone-700 flex items-center px-4 justify-between shadow-md z-10">
                <div className="flex gap-2">
                    {(['3-3', '3-4', '4-4', '5-4'] as JosekiType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => selectType(type)}
                            className={`px-3 py-1 rounded text-sm font-bold transition-all ${selectedType === type
                                ? 'bg-amber-600 text-white shadow'
                                : 'bg-stone-700 text-stone-400 hover:bg-stone-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className={`font-bold text-lg animate-pulse-short ${getStatusColor()}`}>
                    {feedback}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">

                {/* Board Container */}
                <div className="relative h-full aspect-square max-h-[80vh] bg-[#DEB887] shadow-2xl rounded flex-shrink-0">
                    <GoBoard
                        size={19}
                        stones={boardStones}
                        lastMove={lastMove}
                        onIntersectionClick={handleBoardClick}
                        interactive={phase === 'PRACTICE_WHITE' || phase === 'PRACTICE_BLACK'}
                        showCoords={true}
                    />

                    {/* Phase Overlay (Optional) */}
                    {phase === 'TRANSITION' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                            <div className="text-4xl font-bold text-white animate-bounce">
                                ↺ Switching Sides...
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="h-20 w-full max-w-2xl px-4 flex items-center justify-center gap-4 mt-4">
                    {phase === 'DEMO' && (
                        <button
                            onClick={startPractice}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-lg text-lg transform hover:scale-105 transition-all"
                        >
                            Start Practice
                        </button>
                    )}

                    {phase === 'COMPLETED' && (
                        <button
                            onClick={nextProblem}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg text-lg transform hover:scale-105 transition-all"
                        >
                            Next Problem
                        </button>
                    )}

                    {/* Retry Button? Maybe always show reload */}
                    <button
                        onClick={() => selectType(selectedType || '4-4')}
                        className="px-4 py-2 text-stone-500 hover:text-stone-300 text-sm"
                    >
                        ⟳ Restart
                    </button>
                </div>
            </div>
        </div>
    );
};
