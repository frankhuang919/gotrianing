import React, { useEffect, useState, useMemo } from 'react';

// Generic Interface to support both TesujiProblem and TsumegoProblem
export interface GenericProblem {
    id: string;
    title: string;
    sgf: string;
    label?: string;
    category?: string; // Optional implied category
    group?: string; // Optional Volume Group
}

interface ProblemListProps {
    title: string;
    problems: GenericProblem[]; // Flat list of problems
    isLoading: boolean;

    currentProblemId: string | null;
    mistakeIds: string[];
    completedIds: string[]; // NEW: For Progression Locking & Highlight
    problemStats: Record<string, { attempts: number; solved: number }>;

    onSelectProblem: (problem: GenericProblem) => void;
    filterMode?: 'ALL' | 'MISTAKES';
}

// Map keywords to friendly categories (Shared Logic)
const CATEGORY_MAP: Record<string, string[]> = {
    '联络 (Connection)': ['联络', '接不归', '渡', '连'],
    '切断 (Cutting)': ['切断', '枷吃', '分断', '断', '征子'],
    '攻击与杀气 (Attack & Semai)': ['攻击', '腾挪', '脱险', '整形', '杀气', '气', '对杀', '杀棋'],
    '官子 (Endgame)': ['官子', '收官', '目'],
};

export const ProblemList: React.FC<ProblemListProps> = ({
    title,
    problems,
    isLoading,
    currentProblemId,
    mistakeIds,
    completedIds,
    problemStats,
    onSelectProblem,
    filterMode = 'ALL'
}) => {
    // State for Accordions
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    const hasGroups = useMemo(() => problems.some(p => !!p.group), [problems]);

    // === FLAVOR 1: FLAT CATEGORIES (Tesuji) ===
    const flatData = useMemo(() => {
        if (hasGroups) return [];

        const categories: Record<string, GenericProblem[]> = {};
        // Initialize keys
        Object.keys(CATEGORY_MAP).forEach(k => categories[k] = []);
        categories['其他 (Other)'] = [];

        problems.forEach(prob => {
            // Explicit Category?
            if (prob.category) {
                if (!categories[prob.category]) categories[prob.category] = [];
                categories[prob.category].push(prob);
                return;
            }
            // Keyword Matching
            let matched = false;
            for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
                if (keywords.some(k => prob.title.includes(k) || (prob.label && prob.label.includes(k)))) {
                    categories[catName].push(prob);
                    matched = true;
                    break;
                }
            }
            if (!matched) categories['其他 (Other)'].push(prob);
        });

        const allKeys = Object.keys(categories).filter(k => categories[k].length > 0);
        const sortedKeys = allKeys.sort((a, b) => {
            const idxA = Object.keys(CATEGORY_MAP).indexOf(a);
            const idxB = Object.keys(CATEGORY_MAP).indexOf(b);
            if (idxA >= 0 && idxB >= 0) return idxA - idxB;
            if (idxA >= 0) return -1;
            if (idxB >= 0) return 1;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
        return sortedKeys.map(k => ({ name: k, list: categories[k] }));
    }, [problems, hasGroups]);


    // === FLAVOR 2: NESTED GROUPS (Tsumego) ===
    const nestedData = useMemo(() => {
        if (!hasGroups) return [];
        const groups: Record<string, Record<string, GenericProblem[]>> = {};

        problems.forEach(prob => {
            const groupName = prob.group || '其他 (Other)';
            if (!groups[groupName]) groups[groupName] = {};

            const catName = prob.category || '默认';
            if (!groups[groupName][catName]) groups[groupName][catName] = [];
            groups[groupName][catName].push(prob);
        });

        return Object.entries(groups).map(([gName, gCats]) => {
            const catEntries = Object.entries(gCats).map(([cName, list]) => ({ name: cName, list }));
            // Sort Categories (Numeric usually for Chapters)
            catEntries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            return { name: gName, categories: catEntries };
        }).sort((a, b) => {
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    }, [problems, hasGroups]);


    // Auto-Expand
    useEffect(() => {
        if (currentProblemId) {
            if (hasGroups && nestedData.length > 0) {
                for (const grp of nestedData) {
                    for (const cat of grp.categories) {
                        if (cat.list.some(p => p.id === currentProblemId)) {
                            if (expandedGroup !== grp.name) setExpandedGroup(grp.name);
                            if (expandedCat !== cat.name) setExpandedCat(cat.name);
                            setTimeout(() => {
                                const el = document.getElementById(`prob-btn-${currentProblemId}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }, 200);
                            return;
                        }
                    }
                }
            } else if (!hasGroups && flatData.length > 0) {
                // Flat
                const found = flatData.find(c => c.list.some(p => p.id === currentProblemId));
                if (found && expandedCat !== found.name) {
                    setExpandedCat(found.name);
                    setTimeout(() => {
                        const el = document.getElementById(`prob-btn-${currentProblemId}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 200);
                }
            }
        }
    }, [currentProblemId, nestedData, flatData, hasGroups]);

    const mistakeProblems = useMemo(() => {
        if (filterMode !== 'MISTAKES') return [];
        const idSet = new Set(mistakeIds);
        return problems.filter(p => idSet.has(p.id));
    }, [problems, mistakeIds, filterMode]);

    const renderProblemButton = (prob: GenericProblem, categoryList?: GenericProblem[]) => {
        const stats = problemStats?.[prob.id];
        const isSolved = completedIds.includes(prob.id);
        const isAttempted = (stats?.attempts || 0) > 0;
        const isCurrent = currentProblemId === prob.id;

        // Progression Lock Logic (Within category, not global)
        // First problem in category is always unlocked
        // Subsequent problems unlock after previous in same category is completed
        let isLocked = false;
        if (!isSolved && filterMode === 'ALL' && categoryList) {
            const indexInCategory = categoryList.findIndex(p => p.id === prob.id);
            if (indexInCategory > 0) {
                const prevProbId = categoryList[indexInCategory - 1].id;
                isLocked = !completedIds.includes(prevProbId);
            }
        }

        let statusIcon = null;
        if (isLocked) {
            statusIcon = <span className="text-xs">🔒</span>;
        } else if (isSolved) {
            statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" className="ml-auto"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 7-7" /></svg>;
        } else if (isAttempted) {
            statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" className="ml-auto"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
        }

        const buttonClass = `text-left text-xs p-2 rounded flex items-center gap-2 transition-colors w-full pl-6
            ${isCurrent
                ? 'bg-amber-900/50 text-amber-200 border border-amber-800 font-bold'
                : (isLocked
                    ? 'text-stone-600 cursor-not-allowed opacity-70'
                    : (isSolved ? 'text-green-400 hover:bg-stone-800' : 'text-stone-400 hover:text-amber-400 hover:bg-stone-800')
                )
            }
        `;

        return (
            <button
                key={prob.id}
                id={`prob-btn-${prob.id}`}
                onClick={() => !isLocked && onSelectProblem(prob)}
                disabled={isLocked}
                className={buttonClass}
                title={prob.title}
            >
                <span className={`opacity-50 w-4 text-center ${isSolved ? 'text-green-600' : ''}`}>{
                    prob.label?.match(/\d+/)?.[0] || '•'
                }</span>
                <span className="truncate flex-1">{prob.label || prob.title}</span>
                {statusIcon}
            </button>
        );
    };

    if (isLoading && problems.length === 0) return <div className="text-gray-400 p-4">Loading Library...</div>;

    if (filterMode === 'MISTAKES') {
        return (
            <div className="h-full flex flex-col bg-stone-900 border-r border-stone-700 text-sm text-gray-300">
                <div className="p-4 border-b border-stone-700 bg-red-950/30">
                    <h2 className="font-bold text-lg text-red-100 mb-1">❌ 错题本</h2>
                    <div className="text-xs text-red-300/60">{mistakeProblems.length} 道错题</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-1 gap-0.5">
                        {mistakeProblems.map(p => renderProblemButton(p, mistakeProblems))}
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: FLAT (Legacy/Tesuji)
    if (!hasGroups) {
        return (
            <div className="h-full flex flex-col bg-stone-900 border-r border-stone-700 text-sm text-gray-300">
                <div className="p-3 border-b border-stone-700 bg-stone-800 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-white">{title}</h2>
                    {currentProblemId && <div className="text-xs text-amber-500 animate-pulse">Running</div>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {flatData.map((cat) => (
                        <div key={cat.name}>
                            <div
                                className="font-bold cursor-pointer hover:text-green-400 py-2 px-1 flex items-center justify-between bg-stone-800/50 rounded mb-1"
                                onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                            >
                                <span className={expandedCat === cat.name ? 'text-amber-400' : ''}>
                                    {expandedCat === cat.name ? '▼' : '▶'} {cat.name}
                                </span>
                                <span className="text-xs text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded-full">{cat.list.length}</span>
                            </div>
                            {expandedCat === cat.name && (
                                <div className="pl-1 grid grid-cols-1 gap-1 animate-fade-in-down">
                                    {cat.list.map(p => renderProblemButton(p, cat.list))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // RENDER: NESTED (Tsumego)
    return (
        <div className="h-full flex flex-col bg-stone-900 border-r border-stone-700 text-sm text-gray-300">
            <div className="p-3 border-b border-stone-700 bg-stone-800 flex justify-between items-center">
                <h2 className="font-bold text-lg text-white">{title}</h2>
                {currentProblemId && <div className="text-xs text-amber-500 animate-pulse">Running</div>}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {nestedData.map((group) => (
                    <div key={group.name} className="border border-stone-800 rounded bg-stone-900/50 overflow-hidden">
                        {/* Group Header */}
                        <div
                            className="bg-stone-800 p-2 font-bold flex items-center cursor-pointer hover:bg-stone-700 transition"
                            onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
                        >
                            <span className={`mr-2 transform transition-transform ${expandedGroup === group.name ? 'rotate-90 text-amber-500' : 'text-stone-500'}`}>▶</span>
                            <span className={expandedGroup === group.name ? 'text-amber-100' : 'text-stone-300'}>{group.name}</span>
                            <span className="ml-auto text-xs bg-black/20 px-2 py-0.5 rounded text-stone-500">
                                {group.categories.reduce((acc, c) => acc + c.list.length, 0)}
                            </span>
                        </div>

                        {/* Group Body (Categories) */}
                        {expandedGroup === group.name && (
                            <div className="bg-stone-900/80">
                                {group.categories.map((cat) => (
                                    <div key={cat.name}>
                                        <div
                                            className="py-2 px-8 flex items-center cursor-pointer hover:text-white text-stone-400 text-xs font-bold border-l-2 border-transparent hover:border-amber-500/50"
                                            onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                                        >
                                            <span className="flex-1">{cat.name}</span>
                                            <span className="text-[10px] opacity-50">{cat.list.length}</span>
                                        </div>
                                        {/* Problems */}
                                        {expandedCat === cat.name && (
                                            <div className="pl-4 pr-1 pb-2 grid grid-cols-1 gap-0.5 animate-fade-in-down">
                                                {cat.list.map(p => renderProblemButton(p, cat.list))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
