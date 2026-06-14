import React, { useContext } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { GroupCard } from './GroupCard';
import { ThirdPlaceTable } from './ThirdPlaceTable';
import { LiveModeContext } from '../../App'; // Import the Live Context

export const GroupStageGrid: React.FC = () => {
  const isLiveMode = useContext(LiveModeContext);
  const groups = useTournamentStore((state) => state.groups);
  const setAllGroupsMode = useTournamentStore((state) => state.setAllGroupsMode);



  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full h-full">
      <div className="max-w-[1500px] mx-auto">

        {/* Global Control Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-3 sm:mb-0">
            <h2 className="text-lg font-bold text-gray-800">Group Stage Configuration</h2>
            <p className="text-xs text-gray-500">
              {isLiveMode
                ? 'Live Mode Active: Manual configurations are disabled.'
                : 'Set the data entry mode for all groups at once.'}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setAllGroupsMode('MANUAL')}
              disabled={isLiveMode}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-colors border flex items-center justify-center gap-2 ${isLiveMode
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
              Set All: Quick Rank
            </button>
            <button
              onClick={() => setAllGroupsMode('SCORES')}
              disabled={isLiveMode}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-colors border flex items-center justify-center gap-2 ${isLiveMode
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Set All: Advanced
            </button>
          </div>
        </div>

        {/* The Grid: Locked to a maximum of 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {Object.values(groups).map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>

        {/* Third Place Rankings */}
        <div className="mt-6 md:mt-8 mb-12">
          <ThirdPlaceTable />
        </div>
      </div>
    </div>
  );
};