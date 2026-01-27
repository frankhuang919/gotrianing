

import GoBoard from './components/GoBoard';
import WelcomeScreen from './components/WelcomeScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { useGameStore } from './store/gameStore';

function App() {
  const { status, feedback, josekiMeta, reset, loadRandomJoseki, startChallenge } = useGameStore();

  const handleRetry = () => {
    // Retry with current color
    const { userColor } = useGameStore.getState();
    useGameStore.getState().startChallenge(userColor);
  };



  if (status === 'WELCOME') {
    return (
      <WelcomeScreen
        onStart={() => loadRandomJoseki()}
        onSelectCategory={(cat) => console.log('Selected category:', cat)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-950 font-sans text-stone-200 selection:bg-amber-500/30">

      {/* Header */}
      <header className="h-14 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 shadow-md z-30">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={reset}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-inner">
            <span className="text-white font-serif font-bold text-lg">Z</span>
          </div>
          <h1 className="text-lg font-bold tracking-wide text-stone-100">ZenGo <span className="text-stone-500 font-normal text-sm ml-2">训练场</span></h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Chips Display */}
          <div className="bg-stone-800 px-3 py-1 rounded flex items-center gap-2 border border-stone-700 shadow-inner">
            <span className="text-amber-500 text-xs uppercase font-bold">筹码</span>
            <span className="text-stone-100 font-mono font-bold">{useGameStore.getState().chips}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex">
        {/* Left Panel - Study Controls */}
        <aside className="w-80 bg-stone-900 border-r border-stone-700 p-6 hidden md:flex flex-col gap-6 z-20 shadow-xl overflow-y-auto">
          {status === 'STUDY' ? (
            <div className="animate-fade-in-left">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded font-bold tracking-wider">演示模式</span>
              </div>
              <h2 className="text-2xl font-bold text-amber-100 mb-2">{josekiMeta?.title}</h2>
              <p className="text-stone-400 text-sm mb-4 leading-relaxed">
                {josekiMeta?.description || "正在演示标准变化，请仔细记忆棋形..."}
              </p>

              {/* Usage Context */}
              {josekiMeta?.usage && (
                <div className="bg-stone-800/80 p-3 rounded border-l-4 border-amber-600/50 mb-4">
                  <p className="text-xs text-amber-500/80 font-bold mb-1 uppercase tracking-wider">何时使用 (Usage)</p>
                  <p className="text-stone-300 text-xs leading-relaxed">{josekiMeta.usage}</p>
                </div>
              )}

              <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700 mb-6">
                <p className="text-xs text-stone-500 uppercase mb-2 tracking-widest">Instruction</p>
                <p className="text-stone-300 text-sm">
                  观察棋盘上的变化。当你准备好后，点击下方按钮开始挑战。
                </p>
              </div>

              <button
                onClick={() => startChallenge()}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 border border-amber-400/50 flex items-center justify-center gap-2"
              >
                <span>我记住了，开始挑战</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50">
              <div className="w-16 h-16 rounded-full bg-stone-800 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-stone-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-stone-500">
                {status === 'LOCKED' ? '思考中...' : status === 'PLAYING' ? '对弈进行中' : '等待操作'}
              </p>
            </div>
          )}
        </aside>

        {/* Main Board Area */}
        <section className="flex-1 flex justify-center items-center bg-[#dc933c] md:bg-[url('/wood-pattern.jpg')] bg-cover bg-center relative min-w-0 shadow-inner">
          {/* Mobile-only Overlay (Fallback for small screens) */}
          {/* EMERGENCY DEBUGGER */}
          <div className="absolute top-4 left-4 z-[100] bg-black/90 text-green-400 p-4 rounded font-mono text-xs border border-green-500 shadow-xl pointer-events-auto">
            <p className="font-bold border-b border-green-800 mb-2 pb-1">DEBUG PANEL</p>
            <p>STATUS: <span className="text-white">{status}</span></p>
            <p>STONES: <span className="text-white">{useGameStore.getState().boardState.length}</span></p>
            <p>META: {josekiMeta?.id || 'None'}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  useGameStore.setState(s => ({
                    boardState: [...s.boardState, { x: 9, y: 9, c: 1 }]
                  }))
                }}
                className="bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded"
              >
                [+] Force Test Stone
              </button>
              <button
                onClick={() => loadRandomJoseki()}
                className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded"
              >
                [R] Reload Joseki
              </button>
            </div>
          </div>

          <ErrorBoundary>
            <GoBoard />
          </ErrorBoundary>
        </section>

        {/* Right Panel / HUD */}
        <aside className="w-80 bg-stone-800 border-l border-stone-700 p-4 hidden md:flex flex-col">
          <h2 className="text-stone-400 text-sm uppercase mb-4">训练日志</h2>
          <div className="flex-1 bg-stone-900/50 p-4 rounded text-stone-300 font-mono text-sm overflow-y-auto border border-stone-700">
            <p className="mb-2 text-stone-500">&gt;&gt; {status}</p>

            {status === 'STUDY' && (
              <div className="bg-amber-900/20 text-amber-200 p-2 rounded mb-2 border border-amber-800/50 italic">
                "别只是看，看清每一手的气和棋形，走错一步扣 20 筹码哦！"
              </div>
            )}

            <div className="text-xs text-stone-600 mb-2 font-mono border-b border-stone-800 pb-2">
              [DEBUG] Stones: {useGameStore.getState().boardState.length} | Status: {status}
            </div>

            <div className={`p-2 rounded ${status === 'REFUTATION' ? 'bg-red-900/20 border border-red-800 text-red-300' : 'text-stone-300'}`}>
              {feedback}
            </div>
          </div>
          {status === 'REFUTATION' && (
            <button
              onClick={handleRetry}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded uppercase tracking-wider font-bold transition-colors shadow-lg animate-bounce"
            >
              再试一次 (-20 Chips)
            </button>
          )}

          {status === 'WIN' && (
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={() => loadRandomJoseki()}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded uppercase tracking-wider font-bold transition-colors shadow-lg animate-bounce"
              >
                下一题 (Next Problem) →
              </button>
            </div>
          )}

          {/* Debug / Skip Button (Always Visible during Debug Phase) */}
          <div className="mt-8 pt-4 border-t border-stone-700">
            <button
              onClick={() => loadRandomJoseki()}
              className="w-full bg-stone-800 hover:bg-stone-700 text-stone-400 text-sm py-2 rounded border border-stone-600 flex items-center justify-center gap-2"
            >
              <span>🛠 调试：换一题 (Skip)</span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
