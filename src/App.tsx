import { useState, useEffect, useMemo } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { useGameStore } from './store/gameStore';
import { ProblemList, type GenericProblem } from './components/ProblemList';
import { TesujiBoard } from './components/TesujiBoard';
import { TsumegoBoard } from './components/TsumegoBoard';
import { useTesujiStore } from './store/tesujiStore';
import { useTsumegoStore } from './store/tsumegoStore';
import { JosekiMode } from './components/JosekiMode';
import AIMode from './components/AIMode';

function App() {
  const { status, reset } = useGameStore();
  const tesujiStore = useTesujiStore(); // Get whole store object
  const tsumegoStore = useTsumegoStore();

  const [module, setModule] = useState<'HOME' | 'JOSEKI' | 'TESUJI' | 'LIFE_DEATH' | 'MISTAKE_BOOK' | 'AI_SPARRING'>('HOME');

  // Pre-load libraries when App mounts (or when switching modules)
  useEffect(() => {
    // Lazy load libraries
    if (tesujiStore.volumes.length === 0) tesujiStore.loadLibrary();
    if (tsumegoStore.volumes.length === 0) tsumegoStore.loadLibrary();
  }, []);

  // Safety: If somehow status is NOT Welcome but we are at HOME, reset to Welcome to avoid blank screen
  useEffect(() => {
    if (module === 'HOME' && status !== 'WELCOME') {
      reset();
    }
  }, [module, status, reset]);

  const handleGoHome = () => {
    reset();
    setModule('HOME');
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === 'tesuji') setModule('TESUJI');
    else if (cat === 'joseki') setModule('JOSEKI'); // Archived but kept if user wants
    else if (cat === 'mistakes') setModule('MISTAKE_BOOK');
    else if (cat === 'tsumego') setModule('LIFE_DEATH'); // Need to add this to WelcomeScreen?
    else if (cat === 'ai_sparring') setModule('AI_SPARRING');
  };

  // UNIFIED MISTAKE BOOK DATA
  const mistakeData = useMemo(() => {
    // Combine Problems
    const allMistakeIds = new Set([...tesujiStore.mistakeBookIds, ...tsumegoStore.mistakeBookIds]);
    const p1 = tesujiStore.flatProblems.filter(p => tesujiStore.mistakeBookIds.includes(p.id));
    const p2 = tsumegoStore.flatProblems.filter(p => tsumegoStore.mistakeBookIds.includes(p.id));

    return {
      problems: [...p1, ...p2] as GenericProblem[],
      ids: Array.from(allMistakeIds),
      stats: { ...tesujiStore.problemStats, ...tsumegoStore.problemStats }
    };
  }, [tesujiStore.mistakeBookIds, tsumegoStore.mistakeBookIds, tesujiStore.flatProblems, tsumegoStore.flatProblems]);


  const handleSelectProblem = (prob: GenericProblem) => {
    // Check Source Type
    // The loaders inject 'sourceType': 'TESUJI' or 'TSUMEGO'
    const type = (prob as any).sourceType;

    if (type === 'TESUJI') {
      tesujiStore.loadProblem(prob.sgf, prob.id);
      if (module === 'MISTAKE_BOOK') {
        // Switch view mode? No, Mistake Book renders different boards?
        // Actually, Mistake Book should probably show the board relevant to the problem.
        // But we only have one Main Area!
        // We need to know WHICH board to render.
        // Let's add a state `activeMistakeType`?
        // Or just deduce it from currentProblemId if possible.
        // Store currentProblemId in local state or check stores?
      }
    } else if (type === 'TSUMEGO') {
      tsumegoStore.loadProblem(prob.sgf, prob.id);
    }
  };

  // Determine which board to show in Mistake Book
  // Heuristic: Check which store has `currentProblemId` set (and matches selection)
  // Or better: Tracking `activeBoard` state.
  const [activeBoard, setActiveBoard] = useState<'TESUJI' | 'TSUMEGO'>('TESUJI');

  // When selecting a problem, update active board
  const onSelect = (prob: GenericProblem) => {
    handleSelectProblem(prob);
    const type = (prob as any).sourceType;
    if (type === 'TESUJI') setActiveBoard('TESUJI');
    if (type === 'TSUMEGO') setActiveBoard('TSUMEGO');
  }

  // Standalone Welcome Screen Logic
  if (status === 'WELCOME' && module === 'HOME') {
    return (
      <WelcomeScreen
        onStart={() => { setModule('LIFE_DEATH'); }} // Default to Tsumego for now?
        onSelectCategory={handleSelectCategory}
      />
    );
  }

  // Early return for Joseki Mode
  if (module === 'JOSEKI') {
    return (
      <div className="h-screen w-screen relative">
        <button onClick={handleGoHome} className="absolute top-4 right-4 z-50 bg-stone-800 text-stone-400 p-2 rounded hover:text-white">✕</button>
        <JosekiMode />
      </div>
    );
  }

  // Early return for AI Sparring Mode
  if (module === 'AI_SPARRING') {
    return (
      <div className="h-screen w-screen relative">
        <button
          onClick={handleGoHome}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-stone-800 text-stone-400 rounded hover:bg-stone-700 border border-stone-600 shadow-xl"
        >
          ← 返回主页
        </button>
        <AIMode />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-950 font-sans text-stone-200 selection:bg-amber-500/30">

      {/* Header */}
      <header className="h-14 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 shadow-md z-30">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleGoHome}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-inner">
            <span className="text-white font-serif font-bold text-lg">Z</span>
          </div>
          <h1 className="text-lg font-bold tracking-wide text-stone-100">ZenGo <span className="text-stone-500 font-normal text-sm ml-2">训练场</span></h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setModule('TESUJI')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${module === 'TESUJI' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' : 'text-stone-400 hover:text-stone-200'}`}>手筋</button>
          <button onClick={() => setModule('LIFE_DEATH')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${module === 'LIFE_DEATH' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'text-stone-400 hover:text-stone-200'}`}>死活</button>
          <button onClick={() => setModule('MISTAKE_BOOK')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${module === 'MISTAKE_BOOK' ? 'bg-red-900/50 text-red-400 border border-red-800' : 'text-stone-400 hover:text-stone-200'}`}>错题本</button>
          <button onClick={() => setModule('AI_SPARRING')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${module === 'AI_SPARRING' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 'text-stone-400 hover:text-stone-200'}`}>AI 对弈</button>
        </div>

        <div className="bg-stone-800 px-3 py-1 rounded flex items-center gap-2 border border-stone-700 shadow-inner">
          <span className="text-amber-500 text-xs uppercase font-bold">筹码</span>
          <span className="text-stone-100 font-mono font-bold">{useGameStore.getState().chips}</span>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex">

        {/* ================= TESUJI & TSUMEGO & MISTAKE BOOK ================= */}
        {(module === 'TESUJI' || module === 'LIFE_DEATH' || module === 'MISTAKE_BOOK') && (
          <ErrorBoundary>
            {/* Left Panel: Problem List */}
            <aside className="w-64 bg-stone-900 border-r border-stone-700 z-20 shadow-xl overflow-y-auto">
              {/* Contextual Render based on Module */}
              {module === 'TESUJI' && (
                <ProblemList
                  title="手筋特训"
                  problems={tesujiStore.flatProblems as GenericProblem[]}
                  isLoading={tesujiStore.isLoadingLibrary}
                  currentProblemId={tesujiStore.currentProblemId}
                  mistakeIds={tesujiStore.mistakeBookIds}
                  completedIds={tesujiStore.completedProblemIds}
                  problemStats={tesujiStore.problemStats}
                  onSelectProblem={onSelect}
                />
              )}
              {module === 'LIFE_DEATH' && (
                <ProblemList
                  title="死活特训"
                  problems={tsumegoStore.flatProblems as GenericProblem[]}
                  isLoading={tsumegoStore.isLoadingLibrary}
                  currentProblemId={tsumegoStore.currentProblemId}
                  mistakeIds={tsumegoStore.mistakeBookIds}
                  completedIds={tsumegoStore.completedProblemIds}
                  problemStats={tsumegoStore.problemStats}
                  onSelectProblem={onSelect}
                />
              )}
              {module === 'MISTAKE_BOOK' && (
                <ProblemList
                  title="错题本"
                  filterMode='MISTAKES'
                  problems={mistakeData.problems}
                  isLoading={false}
                  currentProblemId={activeBoard === 'TESUJI' ? tesujiStore.currentProblemId : tsumegoStore.currentProblemId}
                  mistakeIds={mistakeData.ids}
                  completedIds={[]}
                  problemStats={mistakeData.stats}
                  onSelectProblem={onSelect}
                />
              )}
            </aside>

            {/* Main Area: Board */}
            <section className="flex-1 flex justify-center items-center bg-[#dc933c] md:bg-[url('/wood-pattern.jpg')] bg-cover bg-center relative min-w-0 shadow-inner">
              {/* If Mistake Book, check activeBoard. If others, dedicated board. */}
              {module === 'TESUJI' && <TesujiBoard />}
              {module === 'LIFE_DEATH' && <TsumegoBoard />}

              {module === 'MISTAKE_BOOK' && (
                activeBoard === 'TESUJI' ? <TesujiBoard /> : <TsumegoBoard />
              )}
            </section>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default App;
