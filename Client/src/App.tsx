import { useState, useEffect, createContext } from 'react';
import { useTournamentStore } from './store/tournamentStore';
import { initializeTournament } from './lib/initialData';
import { GroupStageGrid } from './components/GroupStage/GroupStageGrid';
import { PlayoffBracket } from './components/Playoffs/PlayoffBracket';
import { AiChallenge } from './components/AiChallenge/AiChallenge';

type TabType = 'GROUPS' | 'PLAYOFFS' | 'AI_CHALLENGE';

export const LiveModeContext = createContext<boolean>(false);

function App() {
  const groups = useTournamentStore((state) => state.groups);
  const syncPlayoffBracket = useTournamentStore((state) => state.syncPlayoffBracket);
  const resetGroupStageState = useTournamentStore((state) => state.resetGroupStageState);
  const resetPlayoffs = useTournamentStore((state) => state.resetPlayoffs);
  const autoFillGroupStage = useTournamentStore((state) => state.autoFillGroupStage);
  const autoFillPlayoffs = useTournamentStore((state) => state.autoFillPlayoffs);
  const isAutoFilling = useTournamentStore((state) => state.isAutoFilling);
  
  const fetchLiveMatches = useTournamentStore((state) => state.fetchLiveMatches);
  const importFinishedMatches = useTournamentStore((state) => state.importFinishedMatches);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('world-cup-2026-active-tab');
    return (savedTab === 'PLAYOFFS' || savedTab === 'GROUPS' || savedTab === 'AI_CHALLENGE') ? savedTab : 'GROUPS';
  });

  // ARCHITECTURAL FIX: Persist Live Mode to localStorage to survive page refreshes
  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => {
    const savedLiveMode = localStorage.getItem('world-cup-2026-live-mode');
    return savedLiveMode === 'true';
  });

  useEffect(() => {
    if (Object.keys(groups).length === 0) {
      const { groups: initialGroups, matches: initialMatches } = initializeTournament();
      useTournamentStore.setState({
        groups: initialGroups,
        matches: initialMatches,
      });
    }
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('world-cup-2026-active-tab', activeTab);
  }, [activeTab]);

  // Save Live Mode state whenever it changes
  useEffect(() => {
    localStorage.setItem('world-cup-2026-live-mode', String(isLiveMode));
  }, [isLiveMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isLiveMode) {
      // 1. Fetch immediately upon entering Live Mode
      fetchLiveMatches(); 
      
      // 2. Establish the polling loop (every 30 seconds)
      // 30s is safe because our BFF handles the actual caching and limits
      interval = setInterval(() => {
        fetchLiveMatches();
      }, 30000); 
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMode, fetchLiveMatches]);

  const handleGlobalReset = () => {
    const message = activeTab === 'GROUPS' 
      ? 'Are you sure you want to reset all Group Stage scores and modes? This cannot be undone.' 
      : 'Are you sure you want to reset the Playoff Bracket? All playoff scores and manual selections will be cleared.';

    if (window.confirm(message)) {
      if (activeTab === 'GROUPS') {
        resetGroupStageState();
      } else {
        resetPlayoffs();
      }
    }
  };

  const handleImportResults = () => {
    if (window.confirm('Are you sure you want to sync finished matches? This will override your manual predictions for those games.')) {
      importFinishedMatches();
      setIsLiveMode(false); 
    }
  };

  // --- API Key State ---
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('world-cup-2026-gemini-key') || '';
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAiFillModal, setShowAiFillModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('world-cup-2026-gemini-key', geminiApiKey);
  }, [geminiApiKey]);

  const handleAutoFill = () => {
    if (!geminiApiKey.trim()) {
      setShowApiKeyModal(true);
      return;
    }
    setShowAiFillModal(true);
  };

  const executeAutoFill = (fillEmptyOnly: boolean) => {
    setShowAiFillModal(false);
    if (activeTab === 'GROUPS') {
      autoFillGroupStage(geminiApiKey, fillEmptyOnly);
    } else {
      autoFillPlayoffs(geminiApiKey, fillEmptyOnly);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 relative flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-blue-100/50 to-transparent pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-transparent to-red-800/80 pointer-events-none z-0"></div>

      <header className="relative bg-blue-950/95 backdrop-blur-md border-b border-white/20 text-white p-4 shadow-xl z-10 flex flex-col gap-4">
        
        <a 
          href="https://www.youtube.com/watch?v=mJJsL1fFYew" 
          target="_blank" 
          rel="noreferrer"
          className="absolute top-2 right-2 opacity-5 hover:opacity-100 transition-opacity duration-700 z-50 cursor-pointer"
          title="First and foremost – Maccabi Haifa. Everything else... is just a bonus."
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Maccabi_Haifa_FC_Logo_2023.png/250px-Maccabi_Haifa_FC_Logo_2023.png" 
            alt="Maccabi Haifa" 
            className="w-6 h-6 drop-shadow-lg"
          />
        </a>

        <div className="w-full max-w-[98%] 2xl:max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 drop-shadow-md">
              World Cup 2026
            </h1>
            
            <button
              onClick={handleGlobalReset}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white shadow-inner px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider backdrop-blur-sm border border-white/10"
              title={`Reset current stage (${activeTab})`}
            >
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
          
          <div className="flex bg-black/30 rounded-lg p-1 backdrop-blur-sm">
            <button 
              onClick={() => setActiveTab('GROUPS')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'GROUPS' ? 'bg-white text-blue-900 shadow' : 'text-white/70 hover:text-white'}`}
            >
              Group Stage
            </button>
            <button 
              onClick={() => {
                setActiveTab('PLAYOFFS');
                syncPlayoffBracket();
              }}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'PLAYOFFS' ? 'bg-white text-red-800 shadow' : 'text-white/70 hover:text-white'}`}
            >
              Playoffs
            </button>
            <button 
              onClick={() => setActiveTab('AI_CHALLENGE')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'AI_CHALLENGE' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow' : 'text-white/70 hover:text-white'}`}
            >
              ⚔️ AI Challenge
            </button>
          </div>
        </div>

        <div className="w-full max-w-[98%] 2xl:max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/10 mt-2">
          
          <div className={`flex bg-black/40 rounded-full p-1 border border-white/5 shadow-inner ${activeTab === 'AI_CHALLENGE' ? 'opacity-50 pointer-events-none' : ''}`}>
            <button 
              onClick={() => setIsLiveMode(false)} 
              disabled={activeTab === 'AI_CHALLENGE'}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${!isLiveMode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              🔮 My Predictions
            </button>
            <button 
              onClick={() => setIsLiveMode(true)} 
              disabled={activeTab === 'AI_CHALLENGE'}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isLiveMode ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              {isLiveMode && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
              Live Reality
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleImportResults} 
              className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full transition-all shadow-md border border-emerald-400/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Sync Finished Matches
            </button>

            {/* API Key Indicator Button */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full transition-all shadow-md border ${
                geminiApiKey.trim()
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  : 'bg-amber-600/80 hover:bg-amber-500/80 text-white border-amber-400/30 animate-pulse'
              }`}
              title={geminiApiKey.trim() ? 'API key configured ✓' : 'Set your Gemini API key'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {geminiApiKey.trim() ? '🟢' : '⚠️'}
            </button>

            {/* AI Auto Fill Button */}
            <button 
              onClick={handleAutoFill}
              disabled={isLiveMode || isAutoFilling}
              className={`flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full transition-all shadow-md border ${
                isLiveMode || isAutoFilling
                  ? 'bg-gray-500/50 text-gray-300 border-gray-500/30 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/30'
              }`}
            >
              {isAutoFilling ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI Thinking...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  🤖 AI Auto Fill
                </>
              )}
            </button>
          </div>
        </div>

      </header>

      {/* API Key Modal — rendered at root level, above everything */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowApiKeyModal(false)}
          />
          
          {/* Modal Card */}
          <div className="relative bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-6 w-[400px] max-w-[90vw] z-10">
            {/* Close button */}
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gemini API Key</h3>
                <p className="text-xs text-gray-400">Required for AI predictions</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Each user provides their own API key. Your key is stored <strong className="text-gray-300">only in your browser</strong> and is never saved on the server.
            </p>

            {/* Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">API Key</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Paste your Gemini API key here..."
                className="w-full px-4 py-2.5 bg-black/40 border border-white/20 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            {/* Status & Link */}
            <div className="flex items-center justify-between mb-5">
              <span className={`text-xs font-medium flex items-center gap-1.5 ${geminiApiKey.trim() ? 'text-green-400' : 'text-gray-500'}`}>
                {geminiApiKey.trim() ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    Key saved locally
                  </>
                ) : 'No key set'}
              </span>
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-2 flex items-center gap-1"
              >
                Get a free key
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>

            {/* Action button */}
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg"
            >
              {geminiApiKey.trim() ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* AI Fill Mode Modal */}
      {showAiFillModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAiFillModal(false)}
          />
          
          {/* Modal Card */}
          <div className="relative bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-6 w-[420px] max-w-[90vw] z-10">
            {/* Close button */}
            <button
              onClick={() => setShowAiFillModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Auto-Fill</h3>
                <p className="text-xs text-gray-400">
                  {activeTab === 'GROUPS' ? 'Group Stage' : 'Playoffs'} predictions
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Choose how the AI should handle matches that already have scores:
            </p>

            {/* Option Buttons */}
            <div className="space-y-3 mb-4">
              <button
                onClick={() => executeAutoFill(false)}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors mt-0.5">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Override All Scores</span>
                  <span className="text-xs text-gray-500 mt-0.5 block">Replace every match score with AI predictions, including ones you've already filled in.</span>
                </div>
              </button>

              <button
                onClick={() => executeAutoFill(true)}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/30 transition-colors mt-0.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Fill Empty Only</span>
                  <span className="text-xs text-gray-500 mt-0.5 block">Keep your existing predictions and only use AI for matches you haven't scored yet.</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <LiveModeContext.Provider value={isLiveMode}>
        <main className="relative z-10 flex-1 overflow-hidden flex flex-col w-full max-w-[98%] 2xl:max-w-[1800px] mx-auto mt-4">
          {activeTab === 'GROUPS' ? <GroupStageGrid /> : activeTab === 'PLAYOFFS' ? <PlayoffBracket /> : <AiChallenge geminiApiKey={geminiApiKey} onRequestApiKey={() => setShowApiKeyModal(true)} />}
        </main>
      </LiveModeContext.Provider>
    </div>
  );
}

export default App;