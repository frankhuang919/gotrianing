import React from 'react';

interface WelcomeScreenProps {
    onSelectCategory: (category: string) => void;
    onStart: () => void;
}

// ═══ Real game data ═══
// Park Junghwan (B) vs Li Weiqing (W)
// 15th Chunlan Cup, Round of 16 — Position at Move 80
// 72 stones on board (with captures resolved)
const GAME_STONES: Array<{ t: 'b' | 'w'; x: number; y: number }> = [
    { t: 'w', x: 4, y: 1 }, { t: 'w', x: 5, y: 1 }, { t: 'w', x: 6, y: 1 },
    { t: 'w', x: 2, y: 2 }, { t: 'w', x: 3, y: 2 }, { t: 'w', x: 6, y: 2 },
    { t: 'b', x: 7, y: 2 }, { t: 'w', x: 2, y: 3 }, { t: 'b', x: 3, y: 3 },
    { t: 'w', x: 4, y: 3 }, { t: 'w', x: 5, y: 3 }, { t: 'b', x: 6, y: 3 },
    { t: 'b', x: 7, y: 3 }, { t: 'b', x: 15, y: 3 }, { t: 'w', x: 2, y: 4 },
    { t: 'b', x: 3, y: 4 }, { t: 'w', x: 9, y: 4 }, { t: 'b', x: 16, y: 4 },
    { t: 'b', x: 3, y: 5 }, { t: 'b', x: 5, y: 5 }, { t: 'w', x: 6, y: 5 },
    { t: 'b', x: 7, y: 5 }, { t: 'w', x: 8, y: 5 }, { t: 'w', x: 10, y: 5 },
    { t: 'w', x: 15, y: 5 }, { t: 'w', x: 16, y: 5 }, { t: 'b', x: 6, y: 6 },
    { t: 'b', x: 7, y: 6 }, { t: 'w', x: 9, y: 6 }, { t: 'b', x: 12, y: 8 },
    { t: 'w', x: 2, y: 11 }, { t: 'b', x: 1, y: 12 }, { t: 'w', x: 2, y: 12 },
    { t: 'b', x: 6, y: 12 }, { t: 'b', x: 16, y: 12 }, { t: 'b', x: 17, y: 12 },
    { t: 'b', x: 1, y: 13 }, { t: 'w', x: 2, y: 13 }, { t: 'w', x: 3, y: 13 },
    { t: 'b', x: 4, y: 13 }, { t: 'w', x: 8, y: 13 }, { t: 'b', x: 14, y: 13 },
    { t: 'w', x: 15, y: 13 }, { t: 'b', x: 16, y: 13 }, { t: 'w', x: 17, y: 13 },
    { t: 'b', x: 2, y: 14 }, { t: 'w', x: 3, y: 14 }, { t: 'b', x: 15, y: 14 },
    { t: 'w', x: 16, y: 14 }, { t: 'b', x: 17, y: 14 }, { t: 'b', x: 1, y: 15 },
    { t: 'b', x: 2, y: 15 }, { t: 'w', x: 3, y: 15 }, { t: 'w', x: 7, y: 15 },
    { t: 'b', x: 15, y: 15 }, { t: 'w', x: 16, y: 15 }, { t: 'w', x: 17, y: 15 },
    { t: 'b', x: 0, y: 16 }, { t: 'b', x: 2, y: 16 }, { t: 'w', x: 3, y: 16 },
    { t: 'b', x: 9, y: 16 }, { t: 'b', x: 15, y: 16 }, { t: 'w', x: 16, y: 16 },
    { t: 'b', x: 1, y: 17 }, { t: 'b', x: 3, y: 17 }, { t: 'w', x: 4, y: 17 },
    { t: 'b', x: 14, y: 17 }, { t: 'w', x: 15, y: 17 }, { t: 'w', x: 17, y: 17 },
    { t: 'b', x: 0, y: 18 }, { t: 'b', x: 2, y: 18 }, { t: 'w', x: 16, y: 18 },
];

// Star points on a 19x19 board
const HOSHI = [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15],
];

// Cell size as a fraction of the board (19 lines = 18 intervals)
const CELL_PCT = 100 / 18;

// Convert board coordinate (0-18) to percentage position
const pos = (v: number) => `${v * CELL_PCT}%`;

const modes = [
    { id: 'ai_sparring', title: 'AI 对弈', en: 'SPARRING', desc: '与 KataGo 实时对弈', active: true, color: '#A855F7' },
    { id: 'tsumego', title: '基本死活', en: 'LIFE & DEATH', desc: '一念之差，生死立判', active: true, color: '#EF4444' },
    { id: 'tesuji', title: '手筋', en: 'TESUJI', desc: '接触战中的关键一击', active: true, color: '#06B6D4' },
    { id: 'mistakes', title: '错题本', en: 'MISTAKES', desc: '攻克你的薄弱环节', active: true, color: '#F43F5E' },
    { id: 'joseki', title: '定式特训', en: 'JOSEKI', desc: 'AI 时代定式', active: false, color: '#F59E0B' },
    { id: 'fuseki', title: '布局大局观', en: 'FUSEKI', desc: '急所与大场', active: false, color: '#10B981' },
    { id: 'trick', title: '骗招破解', en: 'TRICK MOVES', desc: '制裁无理手', active: false, color: '#6366F1' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectCategory, onStart }) => {
    // Stone size: all stones are uniform — slightly smaller than cell interval
    const stoneSize = `${CELL_PCT * 0.82}%`;

    return (
        <div className="noise-layer vignette h-full w-full relative overflow-hidden">

            {/* ═══ LAYER 0: Wood texture background ═══ */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: "url('/wood-pattern.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.4) saturate(0.7)',
                }}
            />

            {/* ═══ LAYER 1: Go Board (centered square) ═══ */}
            <div className="fixed inset-0 z-[1] flex items-center justify-center pointer-events-none">
                <div
                    className="relative"
                    style={{
                        width: 'min(85vh, 85vw)',
                        height: 'min(85vh, 85vw)',
                        opacity: 0.55,
                    }}
                >
                    {/* Grid lines */}
                    {Array.from({ length: 19 }, (_, i) => (
                        <React.Fragment key={`line-${i}`}>
                            {/* Horizontal line */}
                            <div
                                className="absolute h-px bg-black/25"
                                style={{
                                    top: pos(i),
                                    left: '0%',
                                    right: '0%',
                                }}
                            />
                            {/* Vertical line */}
                            <div
                                className="absolute w-px bg-black/25"
                                style={{
                                    left: pos(i),
                                    top: '0%',
                                    bottom: '0%',
                                }}
                            />
                        </React.Fragment>
                    ))}

                    {/* Star points */}
                    {HOSHI.map(([x, y], i) => (
                        <div
                            key={`hoshi-${i}`}
                            className="absolute rounded-full bg-black/30"
                            style={{
                                width: 8,
                                height: 8,
                                left: pos(x),
                                top: pos(y),
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}

                    {/* Real game stones */}
                    {GAME_STONES.map((stone, i) => (
                        <div
                            key={`stone-${i}`}
                            className={`absolute rounded-full stone-${stone.t === 'b' ? 'b' : 'w'}`}
                            style={{
                                width: stoneSize,
                                height: stoneSize,
                                left: pos(stone.x),
                                top: pos(stone.y),
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ═══ LAYER 2: Warm light + extra darkening ═══ */}
            <div
                className="fixed inset-0 z-[3] pointer-events-none"
                style={{
                    background: `
                        radial-gradient(ellipse 70% 60% at 50% 40%, rgba(218, 165, 32, 0.04) 0%, transparent 60%),
                        linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.25) 100%)
                    `
                }}
            />

            {/* ═══ CONTENT ═══ */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">

                {/* Hero Title */}
                <div className="text-center mb-10 md:mb-14">
                    <h1 className="title-zen font-serif-jp hero-fade-1 mb-2">
                        ZenGo
                    </h1>
                    <div className="hero-fade-2 flex items-center justify-center gap-4">
                        <span className="w-10 md:w-16 h-px bg-gradient-to-r from-transparent to-amber-700/40" />
                        <span className="subtitle-zen font-serif-jp">
                            訓 練 場
                        </span>
                        <span className="w-10 md:w-16 h-px bg-gradient-to-l from-transparent to-amber-700/40" />
                    </div>
                    <p className="hero-fade-3 mt-5 text-amber-200/25 text-xs md:text-sm font-sans-jp font-light tracking-[0.15em]">
                        职业级围棋特训 — 每一次失误都会被「惩罚」
                    </p>
                </div>

                {/* Mode Selector Panel */}
                <div className="hero-fade-4 panel-glass w-full max-w-md p-5 md:p-6 zen-scroll max-h-[50vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                        <span className="text-amber-500/40 text-[10px] font-sans-jp tracking-[0.3em] uppercase font-medium">
                            选择模式
                        </span>
                        <span className="flex-1 divider-g" />
                    </div>

                    <div className="space-y-1">
                        {modes.map((mode) => (
                            <div
                                key={mode.id}
                                role="button"
                                tabIndex={mode.active ? 0 : -1}
                                onClick={() => {
                                    if (!mode.active) return;
                                    if (mode.id === 'joseki') onStart();
                                    else onSelectCategory(mode.id);
                                }}
                                className={`mode-item mode-stagger ${!mode.active ? 'disabled' : ''}`}
                            >
                                <div
                                    className="pulse-dot"
                                    style={{ backgroundColor: mode.active ? mode.color : '#44403C' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[15px] font-serif-jp font-bold text-amber-50/90">
                                            {mode.title}
                                        </span>
                                        <span className="text-[9px] font-sans-jp text-amber-500/20 tracking-widest font-medium">
                                            {mode.en}
                                        </span>
                                    </div>
                                    <p className="text-[12px] font-sans-jp text-amber-200/20 font-light mt-0.5">
                                        {mode.desc}
                                    </p>
                                </div>
                                {mode.active ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                                        className="w-4 h-4 text-amber-500/20 flex-shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                ) : (
                                    <span className="text-[8px] font-mono text-amber-500/15 tracking-widest flex-shrink-0">
                                        SOON
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game credit */}
                <p className="hero-fade-4 mt-6 text-amber-800/20 text-[8px] font-sans-jp tracking-wider">
                    背景棋局：第15届春兰杯 · 朴廷桓 vs 李维清
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
