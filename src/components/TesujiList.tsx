import React, { useEffect, useState, useMemo } from 'react';
import { type TesujiProblem } from '../data/tesuji_loader';
import { useTesujiStore } from '../store/tesujiStore';

interface TesujiListProps {
    onSelectProblem: (problem: TesujiProblem) => void;
    filterMode?: 'ALL' | 'MISTAKES';
}

// Map keywords to friendly categories
const CATEGORY_MAP: Record<string, string[]> = {
    '联络 (Connection)': ['联络', '接不归'],
    '切断 (Cutting)': ['切断', '枷吃', '分断'],
    '杀气 (Capturing Race)': ['杀气', '气'],
    '死活 (Life & Death)': ['死活', '做活', '杀棋'],
    '攻击与腾挪 (Attack)': ['攻击', '腾挪', '脱险', '整形'],
    '官子 (Endgame)': ['官子', '收官'],
};

export const TesujiList: React.FC<TesujiListProps> = ({ onSelectProblem, filterMode = 'ALL' }) => {
    // Consume from Store
    const { volumes, isLoadingLibrary, loadLibrary, problemStats, mistakeBookIds, currentProblemId } = useTesujiStore();

    // Category View State
    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    useEffect(() => {
        // Load library if empty
        if (volumes.length === 0) {
            loadLibrary().then(() => {
                const { restoreSession } = useTesujiStore.getState();
                if (restoreSession) restoreSession();
            });
        }
    }, [loadLibrary, volumes.length]);

    // Flatten and Group by Category
    const categorizedData = useMemo(() => {
        const categories: Record<string, TesujiProblem[]> = {};

        // Initialize keys
        Object.keys(CATEGORY_MAP).forEach(k => categories[k] = []);
        categories['其他 (Other)'] = [];

        volumes.forEach(vol => {
            vol.chapters.forEach(chap => {
                let matched = false;
                for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
                    if (keywords.some(k => chap.title.includes(k))) {
                        categories[catName].push(...chap.problems);
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    categories['其他 (Other)'].push(...chap.problems);
                }
            });
        });

        // Remove empty categories
        return Object.entries(categories).filter(([_, probs]) => probs.length > 0);
    }, [volumes]);

    // Auto-Expand & Scroll to Current Problem
    useEffect(() => {
        if (currentProblemId && categorizedData.length > 0) {
            const foundEntry = categorizedData.find(([_, probs]) => probs.some(p => p.id === currentProblemId));
            if (foundEntry) {
                const catName = foundEntry[0];
                if (expandedCat !== catName) {
                    setExpandedCat(catName);
                }

                // Scroll with slight delay
                setTimeout(() => {
                    const el = document.getElementById(`tesuji-btn-${currentProblemId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            }
        }
    }, [currentProblemId, categorizedData]);

    // Mistake Book Data
    const mistakeProblems = useMemo(() => {
        const found: TesujiProblem[] = [];
        const idSet = new Set(mistakeBookIds);
        volumes.forEach(vol => {
            vol.chapters.forEach(chap => {
                chap.problems.forEach(prob => {
                    if (idSet.has(prob.id)) {
                        found.push(prob);
                    }
                });
            });
        });
        return found;
    }, [volumes, mistakeBookIds]);

    const renderProblemButton = (prob: TesujiProblem) => {
        const stats = problemStats?.[prob.id];
        const isSolved = (stats?.solved || 0) > 0;
        const isAttempted = (stats?.attempts || 0) > 0;

        const isCurrent = currentProblemId === prob.id;
        // Relaxed Strict Mode: Locked only if session active AND not current AND NOT Attempted
        const isLocked = !!currentProblemId && !isCurrent && !isAttempted;

        let statusIcon = null;
        if (isSolved) {
            statusIcon = (
                <svg width="16" height="16" viewBox="0 0 24 24" className="ml-auto flex-shrink-0" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
        } else if (isAttempted) {
            statusIcon = (
                <svg width="16" height="16" viewBox="0 0 24 24" className="ml-auto flex-shrink-0" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            );
        }

        return (
            <button
                key={prob.id}
                id={`tesuji-btn-${prob.id}`}
                onClick={() => onSelectProblem(prob)}
                disabled={isLocked}
                className={`text-left text-xs p-2 rounded flex items-center gap-2 transition-colors w-full ${isCurrent
                    ? 'bg-amber-900/50 text-amber-200 border border-amber-800 font-bold'
                    : (isLocked ? 'text-stone-600 cursor-not-allowed opacity-50' : 'text-stone-400 hover:text-amber-400 hover:bg-stone-800')
                    }`}
                title={prob.title}
            >
                <span>{isCurrent ? '👉' : (isLocked ? '🔒' : '📄')}</span>
                <span className="truncate flex-1">{prob.label || prob.title}</span>
                {statusIcon}
            </button>
        );
    };

    if (isLoadingLibrary && volumes.length === 0) return <div className="text-gray-400 p-4">Loading Library...</div>;

    // RENDER: MISTAKE LIST
    if (filterMode === 'MISTAKES') {
        const removeMistake = useTesujiStore.getState().removeMistake;
        return (
            <div className="h-full flex flex-col bg-stone-900 border-r border-stone-700 text-sm text-gray-300">
                <div className="p-4 border-b border-stone-700 bg-red-950/30">
                    <h2 className="font-bold text-lg text-red-100 mb-1">❌ 错题本</h2>
                    <div className="text-xs text-red-300/60">共 {mistakeProblems.length} 道错题</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-1 gap-0.5 animate-fade-in-down">
                        {mistakeProblems.map(prob => (
                            <div key={prob.id} className="flex items-center gap-1">
                                <div className="flex-1 min-w-0">{renderProblemButton(prob)}</div>
                                <button
                                    onClick={() => removeMistake(prob.id)}
                                    className="flex-shrink-0 p-1.5 text-stone-600 hover:text-red-400 transition-colors rounded"
                                    title="从错题本移除"
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>
                    {mistakeProblems.length === 0 && (
                        <div className="text-center text-gray-500 mt-10 p-4 border border-dashed border-gray-800 rounded mx-4">
                            👏 暂无错题，继续保持！<br />(Mistake Book is Empty)
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // RENDER: NORMAL LIST (CATEGORY ONLY)
    return (
        <div className="h-full flex flex-col bg-stone-900 border-r border-stone-700 text-sm text-gray-300">
            {/* Header */}
            <div className="p-3 border-b border-stone-700 bg-stone-800 flex justify-between items-center">
                <h2 className="font-bold text-lg text-white">手筋 (Tesuji)</h2>
                {currentProblemId && <div className="text-xs text-amber-500 animate-pulse">进行中...</div>}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                    {categorizedData.map(([catName, problems]) => (
                        <div key={catName}>
                            <div
                                className="font-bold cursor-pointer hover:text-green-400 py-2 px-1 flex items-center justify-between bg-stone-800/50 rounded mb-1"
                                onClick={() => setExpandedCat(expandedCat === catName ? null : catName)}
                            >
                                <span className={expandedCat === catName ? 'text-amber-400' : ''}>
                                    {expandedCat === catName ? '▼' : '▶'} {catName}
                                </span>
                                <span className="text-xs text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded-full">{problems.length}</span>
                            </div>
                            {expandedCat === catName && (
                                <div className="pl-1 grid grid-cols-1 gap-1 animate-fade-in-down">
                                    {problems.map(renderProblemButton)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
