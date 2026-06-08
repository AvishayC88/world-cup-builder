import { useState, useEffect, createContext } from 'react';
import { useTournamentStore } from './store/tournamentStore';
import { initializeTournament } from './lib/initialData';
import { GroupStageGrid } from './components/GroupStage/GroupStageGrid';
import { PlayoffBracket } from './components/Playoffs/PlayoffBracket';

type TabType = 'GROUPS' | 'PLAYOFFS';

export const LiveModeContext = createContext<boolean>(false);

function App() {
  const groups = useTournamentStore((state) => state.groups);
  const syncPlayoffBracket = useTournamentStore((state) => state.syncPlayoffBracket);
  const resetGroupStageState = useTournamentStore((state) => state.resetGroupStageState);
  const resetPlayoffs = useTournamentStore((state) => state.resetPlayoffs);
  
  const fetchLiveMatches = useTournamentStore((state) => state.fetchLiveMatches);
  const importFinishedMatches = useTournamentStore((state) => state.importFinishedMatches);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('world-cup-2026-active-tab');
    return (savedTab === 'PLAYOFFS' || savedTab === 'GROUPS') ? savedTab : 'GROUPS';
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
      fetchLiveMatches(); 
      
      interval = setInterval(() => {
        fetchLiveMatches();
      }, 60000); 
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
          </div>
        </div>

        <div className="w-full max-w-[98%] 2xl:max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/10 mt-2">
          
          <div className="flex bg-black/40 rounded-full p-1 border border-white/5 shadow-inner">
            <button 
              onClick={() => setIsLiveMode(false)} 
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${!isLiveMode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              🔮 My Predictions
            </button>
            <button 
              onClick={() => setIsLiveMode(true)} 
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isLiveMode ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              {isLiveMode && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
              Live Reality
            </button>
          </div>

          <button 
            onClick={handleImportResults} 
            className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full transition-all shadow-md border border-emerald-400/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Sync Finished Matches
          </button>
        </div>

      </header>

      <LiveModeContext.Provider value={isLiveMode}>
        <main className="relative z-10 flex-1 overflow-hidden flex flex-col w-full max-w-[98%] 2xl:max-w-[1800px] mx-auto mt-4">
          {activeTab === 'GROUPS' ? <GroupStageGrid /> : <PlayoffBracket />}
        </main>
      </LiveModeContext.Provider>
    </div>
  );
}

export default App;