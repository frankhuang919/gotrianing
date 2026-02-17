import React from 'react';

interface WelcomeScreenProps {
    onSelectCategory: (category: string) => void;
    onStart: () => void;
}

// ═══ Real game: Park Junghwan (B) vs Li Weiqing (W) ═══
// 15th Chunlan Cup R16 — Move 80 (72 stones)
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

const CELL_PCT = 100 / 18;
const pos = (v: number) => `${v * CELL_PCT}%`;

// Mode card definitions
const MAIN_MODES = [
    { id: 'ai_sparring', title: 'AI 对弈', kanji: '碁', desc: '与 KataGo 实时对弈' },
    { id: 'tsumego', title: '死活特训', kanji: '活', desc: '一念之差，生死立判' },
    { id: 'tesuji', title: '手筋特训', kanji: '筋', desc: '接触战中的关键一击' },
    { id: 'mistakes', title: '错题本', kanji: '省', desc: '攻克你的薄弱环节' },
];

const COMING_MODES = [
    { id: 'joseki', title: '定式', desc: 'AI 时代定式' },
    { id: 'fuseki', title: '布局', desc: '急所与大场' },
    { id: 'trick', title: '骗招破解', desc: '制裁无理手' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectCategory }) => {
    const stoneSize = `${CELL_PCT * 0.82}%`;

    return (
        <div className="noise-layer vignette h-full w-full relative overflow-hidden" style={{ backgroundColor: '#1A1714' }}>

            {/* ═══ BG LAYER: Wood texture — very dark ═══ */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: "url('/wood-pattern.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.25) saturate(0.6)',
                }}
            />

            {/* ═══ BG LAYER: Game stones — blurred, ghostly ═══ */}
            <div className="fixed inset-0 z-[1] flex items-center justify-center pointer-events-none">
                <div
                    className="relative"
                    style={{
                        width: 'min(85vh, 85vw)',
                        height: 'min(85vh, 85vw)',
                        filter: 'blur(1.5px)',
                        opacity: 0.3,
                    }}
                >
                    {GAME_STONES.map((stone, i) => (
                        <div
                            key={`s-${i}`}
                            className={`stone stone-${stone.t === 'b' ? 'b' : 'w'}`}
                            style={{
                                width: stoneSize, height: stoneSize,
                                left: pos(stone.x), top: pos(stone.y),
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ═══ CONTENT: Asymmetric two-column ═══ */}
            <div className="relative z-10 h-full flex items-center justify-center px-6 md:px-12 lg:px-20">
                <div className="w-full max-w-7xl flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-20">

                    {/* ── LEFT: Brand & Hero ── */}
                    <div className="flex-1 lg:flex-[1] mb-10 lg:mb-0">
                        {/* Tiny top label */}
                        <div className="anim-1 flex items-center gap-3 mb-6">
                            <div className="w-6 h-px" style={{ backgroundColor: 'var(--gold-matte)', opacity: 0.4 }} />
                            <span className="text-[10px] font-sans-jp tracking-[0.4em] uppercase" style={{ color: 'var(--text-muted)' }}>
                                围棋训练平台
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="anim-1 title-hero font-serif-jp">
                            ZenGo
                        </h1>

                        {/* Subtitle with decorative lines */}
                        <div className="anim-2 flex items-center gap-3 mt-3 mb-6">
                            <span className="subtitle-zen font-serif-jp">
                                訓 練 場
                            </span>
                            <span className="flex-1 divider-gold" />
                        </div>

                        {/* Tagline */}
                        <p className="anim-3 text-sm md:text-base font-sans-jp font-light leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
                            职业级围棋特训系统。<br className="hidden md:block" />
                            <span style={{ color: 'var(--gold-matte)', opacity: 0.7 }}>每一步失误都会被「惩罚」</span>，直到你不再犯。
                        </p>

                        {/* Credit */}
                        <p className="anim-4 mt-10 text-[9px] font-sans-jp tracking-wider" style={{ color: 'var(--text-dim)' }}>
                            背景棋局 — 第15届春兰杯 · 朴廷桓 vs 李维清
                        </p>
                    </div>

                    {/* ── RIGHT: Mode Cards 2×2 ── */}
                    <div className="flex-1 lg:flex-[1.2]">
                        <div className="grid grid-cols-2 gap-3 md:gap-5">
                            {MAIN_MODES.map((mode) => (
                                <div
                                    key={mode.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectCategory(mode.id)}
                                    className="mode-card card-stagger"
                                >
                                    {/* Kanji watermark — bigger */}
                                    <span className="card-kanji font-serif-jp">{mode.kanji}</span>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        <h3 className="text-base md:text-lg font-serif-jp font-bold mb-1.5" style={{ color: 'var(--text-warm)' }}>
                                            {mode.title}
                                        </h3>
                                        <p className="text-xs md:text-sm font-sans-jp font-light leading-snug" style={{ color: 'var(--text-muted)' }}>
                                            {mode.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coming soon row */}
                        <div className="anim-5 mt-4 flex items-center gap-3 flex-wrap">
                            <span className="text-[9px] font-sans-jp tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
                                即将推出
                            </span>
                            {COMING_MODES.map((m) => (
                                <span key={m.id} className="chip-soon font-sans-jp">{m.title}</span>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
