import React from 'react';

interface WelcomeScreenProps {
    onSelectCategory: (category: string) => void;
    onStart: () => void;
}

const categories = [
    {
        id: 'joseki',
        title: '定式特训 (Joseki)',
        desc: '惩罚俗手，掌握 AI 时代定式',
        active: true,
        color: 'from-amber-600 to-yellow-600'
    },
    {
        id: 'fuseki',
        title: '布局大局观 (Fuseki)',
        desc: '寻找布局中的急所与大场',
        active: false,
        color: 'from-emerald-600 to-teal-600'
    },
    {
        id: 'trick',
        title: '骗招破解 (Trick Moves)',
        desc: '识别并制裁对手的无理手',
        active: false,
        color: 'from-purple-600 to-indigo-600'
    },
    {
        id: 'life_death',
        title: '基本死活 (Life & Death)',
        desc: '一念之差，生死立判',
        active: false,
        color: 'from-red-600 to-rose-600'
    },
    {
        id: 'tesuji',
        title: '手筋 (Tesuji)',
        desc: '接触战中的关键一击',
        active: false,
        color: 'from-blue-600 to-cyan-600'
    }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectCategory, onStart }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-stone-900 p-8 overflow-y-auto">
            <div className="max-w-4xl w-full">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 mb-4 tracking-wider">
                        ZenGo 训练场
                    </h1>
                    <p className="text-stone-400 text-lg">
                        职业级围棋特训 · 这里的每一次失误都会被"惩罚"
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => cat.active && (cat.id === 'joseki' ? onStart() : onSelectCategory(cat.id))}
                            disabled={!cat.active}
                            className={`
                group relative overflow-hidden rounded-xl p-6 text-left border border-stone-700 transition-all duration-300
                ${cat.active
                                    ? 'hover:scale-105 hover:shadow-2xl hover:border-stone-500 cursor-pointer bg-stone-800'
                                    : 'opacity-50 cursor-not-allowed bg-stone-900 grayscale'}
              `}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${cat.color} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 transition-opacity group-hover:opacity-20`}></div>

                            <h3 className={`text-xl font-bold mb-2 ${cat.active ? 'text-stone-200' : 'text-stone-500'}`}>
                                {cat.title}
                            </h3>
                            <p className="text-sm text-stone-500 group-hover:text-stone-400 transition-colors">
                                {cat.desc}
                            </p>

                            {!cat.active && (
                                <div className="absolute top-4 right-4 text-xs font-mono bg-stone-950/50 px-2 py-1 rounded text-stone-600">
                                    DEV
                                </div>
                            )}

                            {cat.active && (
                                <div className="absolute bottom-4 right-4 text-stone-600 group-hover:text-amber-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
