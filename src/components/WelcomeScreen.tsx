import React from 'react';

interface WelcomeScreenProps {
    onSelectCategory: (category: string) => void;
    onStart: () => void;
}

const categories = [
    {
        id: 'ai_sparring',
        title: 'AI 对弈',
        subtitle: 'Sparring',
        desc: '与本地 KataGo 实时对弈',
        active: true,
        stripe: 'bg-purple-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 010 18" fill="currentColor" opacity="0.15" />
                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                <circle cx="15" cy="15" r="1.5" />
            </svg>
        ),
    },
    {
        id: 'joseki',
        title: '定式特训',
        subtitle: 'Joseki',
        desc: '掌握 AI 时代定式',
        active: false,
        stripe: 'bg-amber-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'fuseki',
        title: '布局大局观',
        subtitle: 'Fuseki',
        desc: '寻找布局中的急所与大场',
        active: false,
        stripe: 'bg-emerald-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.15" />
                <circle cx="6" cy="18" r="2" fill="currentColor" opacity="0.15" />
                <circle cx="18" cy="18" r="2" />
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3" />
            </svg>
        ),
    },
    {
        id: 'trick',
        title: '骗招破解',
        subtitle: 'Trick Moves',
        desc: '识别并制裁对手的无理手',
        active: false,
        stripe: 'bg-indigo-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        ),
    },
    {
        id: 'tsumego',
        title: '基本死活',
        subtitle: 'Life & Death',
        desc: '一念之差，生死立判',
        active: true,
        stripe: 'bg-red-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12h8M12 8v8" strokeWidth={2} />
            </svg>
        ),
    },
    {
        id: 'tesuji',
        title: '手筋',
        subtitle: 'Tesuji',
        desc: '接触战中的关键一击',
        active: true,
        stripe: 'bg-cyan-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
    },
    {
        id: 'mistakes',
        title: '错题本',
        subtitle: 'Mistake Book',
        desc: '攻克你的薄弱环节',
        active: true,
        stripe: 'bg-rose-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                <path d="M9 10l2 2 4-4" strokeWidth={2} />
            </svg>
        ),
    }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectCategory, onStart }) => {
    return (
        <div className="h-full w-full flex flex-col items-center bg-ink-950 overflow-y-auto zen-scroll go-grid-bg relative">

            {/* Floating decorative stones */}
            <div className="floating-stone w-32 h-32 bg-white top-[10%] left-[5%]" style={{ animationDelay: '0s' }} />
            <div className="floating-stone w-20 h-20 bg-ink-950 border border-ink-700 top-[20%] right-[8%]" style={{ animationDelay: '2s' }} />
            <div className="floating-stone w-16 h-16 bg-white bottom-[15%] right-[12%]" style={{ animationDelay: '4s' }} />
            <div className="floating-stone w-24 h-24 bg-ink-950 border border-ink-700 bottom-[25%] left-[8%]" style={{ animationDelay: '6s' }} />

            {/* Vertical decorative text — right side */}
            <div className="vertical-text fixed right-6 top-1/2 -translate-y-1/2 text-ink-800 text-sm font-serif-jp tracking-[0.5em] select-none hidden lg:block">
                碁 · 修行
            </div>

            {/* Main content */}
            <div className="max-w-5xl w-full px-4 md:px-8 py-12 md:py-20 relative z-10">

                {/* ===== HERO ===== */}
                <header className="mb-16 md:mb-20 text-center">
                    {/* Ghost character */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[12rem] md:text-[18rem] font-serif-jp text-ink-900/30 select-none pointer-events-none leading-none" aria-hidden="true">
                        碁
                    </div>

                    <div className="relative pt-24 md:pt-32">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif-jp text-shimmer mb-6 tracking-wider">
                            ZenGo 训练場
                        </h1>
                        <p className="text-ink-400 text-base md:text-lg font-sans-jp font-light tracking-wide max-w-lg mx-auto mb-3">
                            职业级围棋特训 · 每一次失误都会被「惩罚」
                        </p>
                        <div className="flex items-center justify-center gap-3 text-ink-700 text-xs font-sans-jp mb-10">
                            <span className="w-8 h-px bg-ink-700" />
                            <span>死活 · 手筋 · 定式 · AI对弈</span>
                            <span className="w-8 h-px bg-ink-700" />
                        </div>

                        <button
                            onClick={() => onSelectCategory('ai_sparring')}
                            className="btn-gold font-sans-jp animate-glow-pulse"
                        >
                            开始修行
                        </button>
                    </div>
                </header>

                {/* ===== MODE CARDS ===== */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <span className="w-6 h-px bg-gold" />
                        <h2 className="text-ink-400 text-sm font-sans-jp font-medium tracking-widest uppercase">
                            训练模式
                        </h2>
                        <span className="flex-1 h-px bg-ink-850" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => cat.active && (cat.id === 'joseki' ? onStart() : onSelectCategory(cat.id))}
                                disabled={!cat.active}
                                className={`
                                    card-stagger card-zen group relative overflow-hidden rounded-xl p-5 text-left bg-ink-900
                                    ${cat.active
                                        ? 'cursor-pointer hover:bg-ink-850'
                                        : 'opacity-40 cursor-not-allowed grayscale'}
                                `}
                            >
                                {/* Left accent stripe */}
                                <div className={`card-stripe ${cat.stripe}`} />

                                {/* Content */}
                                <div className="pl-3 flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 mt-0.5 ${cat.active ? 'text-ink-500 group-hover:text-gold transition-colors duration-300' : 'text-ink-700'}`}>
                                        {cat.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <h3 className={`text-lg font-bold font-serif-jp ${cat.active ? 'text-ink-100' : 'text-ink-700'}`}>
                                                {cat.title}
                                            </h3>
                                            <span className="text-xs text-ink-700 font-sans-jp font-light">
                                                {cat.subtitle}
                                            </span>
                                        </div>
                                        <p className="text-sm text-ink-500 group-hover:text-ink-400 transition-colors font-sans-jp font-light">
                                            {cat.desc}
                                        </p>
                                    </div>

                                    {/* Arrow / DEV badge */}
                                    {cat.active ? (
                                        <div className="flex-shrink-0 text-ink-700 group-hover:text-gold transition-colors duration-300 mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0 text-xs font-mono bg-ink-950/80 px-2 py-0.5 rounded text-ink-700 border border-ink-800">
                                            DEV
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="mt-16 md:mt-20 text-center pb-8">
                    <div className="flex items-center justify-center gap-2 text-ink-800 text-xs font-sans-jp">
                        <span className="w-4 h-px bg-ink-800" />
                        <span>以棋入道 · 以道御棋</span>
                        <span className="w-4 h-px bg-ink-800" />
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default WelcomeScreen;
