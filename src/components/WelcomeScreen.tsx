import React from 'react';

interface WelcomeScreenProps {
    onSelectCategory: (category: string) => void;
    onStart: () => void;
}

const modes = [
    { id: 'ai_sparring', title: 'AI 对弈', en: 'SPARRING', desc: '与 KataGo 实时对弈', active: true, color: '#A855F7' },
    { id: 'tsumego', title: '基本死活', en: 'LIFE & DEATH', desc: '一念之差，生死立判', active: true, color: '#EF4444' },
    { id: 'tesuji', title: '手筋', en: 'TESUJI', desc: '接触战中的关键一击', active: true, color: '#06B6D4' },
    { id: 'mistakes', title: '错题本', en: 'MISTAKES', desc: '攻克你的薄弱环节', active: true, color: '#F43F5E' },
    { id: 'joseki', title: '定式特训', en: 'JOSEKI', desc: 'AI 时代定式', active: false, color: '#F59E0B' },
    { id: 'fuseki', title: '布局大局观', en: 'FUSEKI', desc: '急所与大场', active: false, color: '#10B981' },
    { id: 'trick', title: '骗招破解', en: 'TRICK MOVES', desc: '制裁无理手', active: false, color: '#6366F1' },
];

// Stones placed on the board for visual effect — positions as % of viewport
const decorativeStones = [
    { type: 'b', size: 36, top: '18%', left: '12%' },
    { type: 'w', size: 36, top: '18%', left: '17.5%' },
    { type: 'b', size: 36, top: '23.5%', left: '12%' },
    { type: 'w', size: 32, top: '72%', right: '14%' },
    { type: 'b', size: 32, top: '72%', right: '19%' },
    { type: 'w', size: 32, top: '77%', right: '14%' },
    { type: 'b', size: 32, top: '77%', right: '19%' },
    { type: 'w', size: 28, top: '40%', left: '8%' },
    { type: 'b', size: 28, top: '55%', right: '10%' },
    { type: 'w', size: 24, top: '35%', right: '22%' },
    { type: 'b', size: 24, top: '60%', left: '20%' },
];

// Star points (hoshi) positions on a 19x19 mapped to viewport
const hoshiPoints = [
    { top: '21%', left: '21%' },
    { top: '21%', left: '50%' },
    { top: '21%', left: '79%' },
    { top: '50%', left: '21%' },
    { top: '50%', left: '50%' },
    { top: '50%', left: '79%' },
    { top: '79%', left: '21%' },
    { top: '79%', left: '50%' },
    { top: '79%', left: '79%' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectCategory, onStart }) => {
    return (
        <div className="noise-layer vignette h-full w-full relative overflow-hidden">

            {/* ═══ LAYER 0: Wood texture (the board) ═══ */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: "url('/wood-pattern.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.45) saturate(0.8)',
                }}
            />

            {/* ═══ LAYER 1: Board grid lines ═══ */}
            <div className="board-lines" />

            {/* ═══ LAYER 2: Star points ═══ */}
            {hoshiPoints.map((pos, i) => (
                <div key={i} className="hoshi" style={pos} />
            ))}

            {/* ═══ LAYER 3: Decorative stones ═══ */}
            {decorativeStones.map((s, i) => (
                <div
                    key={i}
                    className={`stone stone-${s.type}`}
                    style={{
                        width: s.size,
                        height: s.size,
                        top: s.top,
                        left: s.left,
                        right: (s as any).right,
                    }}
                />
            ))}

            {/* ═══ LAYER 4: Warm light gradient (top-down) ═══ */}
            <div
                className="fixed inset-0 z-[3] pointer-events-none"
                style={{
                    background: `
                        radial-gradient(ellipse 80% 50% at 50% 20%, rgba(218, 165, 32, 0.04) 0%, transparent 70%),
                        linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)
                    `
                }}
            />

            {/* ═══ CONTENT: Centered overlay ═══ */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">

                {/* Hero Title Block */}
                <div className="text-center mb-12 md:mb-16">
                    {/* Main title */}
                    <h1 className="title-zen font-serif-jp hero-fade-1 mb-3">
                        ZenGo
                    </h1>

                    {/* Subtitle with decorative lines */}
                    <div className="hero-fade-2 flex items-center justify-center gap-4">
                        <span className="w-10 md:w-16 h-px bg-gradient-to-r from-transparent to-amber-700/40" />
                        <span className="subtitle-zen font-serif-jp">
                            訓 練 場
                        </span>
                        <span className="w-10 md:w-16 h-px bg-gradient-to-l from-transparent to-amber-700/40" />
                    </div>

                    {/* Tagline */}
                    <p className="hero-fade-3 mt-6 text-amber-200/30 text-xs md:text-sm font-sans-jp font-light tracking-[0.2em]">
                        职业级围棋特训 — 每一次失误都会被「惩罚」
                    </p>
                </div>

                {/* ═══ MODE SELECTOR PANEL ═══ */}
                <div className="hero-fade-4 panel-glass w-full max-w-md p-5 md:p-6 zen-scroll max-h-[50vh] overflow-y-auto">

                    {/* Panel header */}
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                        <span className="text-amber-500/40 text-[10px] font-sans-jp tracking-[0.3em] uppercase font-medium">
                            选择模式
                        </span>
                        <span className="flex-1 divider-g" />
                        <span className="text-amber-500/20 text-[9px] font-sans-jp tracking-wider">
                            {modes.filter(m => m.active).length}/{modes.length}
                        </span>
                    </div>

                    {/* Mode list */}
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
                                {/* Accent dot */}
                                <div
                                    className="pulse-dot"
                                    style={{ backgroundColor: mode.active ? mode.color : '#44403C' }}
                                />

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[15px] font-serif-jp font-bold text-amber-50/90">
                                            {mode.title}
                                        </span>
                                        <span className="text-[9px] font-sans-jp text-amber-500/25 tracking-widest font-medium">
                                            {mode.en}
                                        </span>
                                    </div>
                                    <p className="text-[12px] font-sans-jp text-amber-200/20 font-light mt-0.5 leading-snug">
                                        {mode.desc}
                                    </p>
                                </div>

                                {/* Arrow or status */}
                                {mode.active ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                                        className="w-4 h-4 text-amber-500/20 group-hover:text-amber-500/60 transition-colors flex-shrink-0">
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

                {/* Bottom tag */}
                <p className="hero-fade-4 mt-8 text-amber-800/20 text-[9px] font-serif-jp tracking-[0.6em]">
                    以棋入道 · 以道御棋
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
