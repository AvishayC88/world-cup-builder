import React, { useMemo, useContext } from 'react';
import type { Group } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { StandingsTable } from './StandingsTable';
import { MatchRow } from './MatchRow';
import { DraggableTeamList } from './DraggableTeamList';
import { LiveModeContext } from '../../App';

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const isLiveMode = useContext(LiveModeContext);
  const toggleGroupMode = useTournamentStore((state) => state.toggleGroupMode);
  
  const allMatches = useTournamentStore((state) => state.matches);
  const liveMatches = useTournamentStore((state) => state.liveMatches);

  const matches = useMemo(() => {
    const groupMatches = Object.values(allMatches).filter((m) => m.groupId === group.id);

    if (!isLiveMode) {
      return groupMatches;
    }

    return groupMatches.map((match) => {
      const liveData = liveMatches[match.id];
      if (liveData) {
        return {
          ...match,
          scoreA: liveData.scoreA,
          scoreB: liveData.scoreB,
        };
      }
      
      // ARCHITECTURAL FIX: If we are in Live Mode but the match hasn't 
      // happened yet in reality, explicitly strip out the manual predictions!
      return {
        ...match,
        scoreA: null,
        scoreB: null,
      };
    });
  }, [allMatches, group.id, isLiveMode, liveMatches]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={group.mode === 'MANUAL'}
              onChange={() => toggleGroupMode(group.id)}
              disabled={isLiveMode} 
            />
            <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${isLiveMode ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-blue-400 peer-checked:bg-orange-500'}`}></div>
          </label>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {group.mode === 'SCORES' ? 'Scores' : 'Manual'}
          </span>
        </div>

        <h3 className="text-lg font-bold">Group {group.id}</h3>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4">
        <StandingsTable 
          teams={group.teams} 
          matches={matches} 
          mode={group.mode}
          standingsOverride={group.standingsOverride}
        />

        <div className="mt-4 border-t border-gray-200 pt-4 flex-1">
          {group.mode === 'SCORES' ? (
            <div className="flex flex-col space-y-1">
              {matches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm p-4 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <DraggableTeamList 
              groupId={group.id} 
              teams={group.teams} 
              standingsOverride={group.standingsOverride} 
            />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};