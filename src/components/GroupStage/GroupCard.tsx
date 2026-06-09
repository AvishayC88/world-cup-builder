import React, { useMemo } from 'react';
import type { Group } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { StandingsTable } from './StandingsTable';
import { MatchRow } from './MatchRow';
import { DraggableTeamList } from './DraggableTeamList';
import { matchMetadata } from '../../data/matchMetadata';

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const toggleGroupMode = useTournamentStore((state) => state.toggleGroupMode);
  
  // 1. Pull the raw matches object from the store (this won't trigger infinite loops)
  const allMatches = useTournamentStore((state) => state.matches);

  // 2. Memoize the filtered array so we only recalculate when allMatches or group.id changes
  const matches = useMemo(() => {
    return Object.values(allMatches)
      .filter((m) => m.groupId === group.id)
      .sort((a, b) => {
        const dateA = matchMetadata[a.id]?.utcDate ? new Date(matchMetadata[a.id].utcDate).getTime() : 0;
        const dateB = matchMetadata[b.id]?.utcDate ? new Date(matchMetadata[b.id].utcDate).getTime() : 0;
        return dateA - dateB;
      });
  }, [allMatches, group.id]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header section */}
      <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center">
        {/* Top-Left Toggle Switch */}
        <div className="flex items-center space-x-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={group.mode === 'MANUAL'}
              onChange={() => toggleGroupMode(group.id)}
            />
            <div className="w-9 h-5 bg-blue-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {group.mode === 'SCORES' ? 'Scores' : 'Manual'}
          </span>
        </div>

        {/* Group Title */}
        <h3 className="text-lg font-bold">Group {group.id}</h3>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Standings Table Component */}
        <StandingsTable 
          teams={group.teams} 
          matches={matches} 
          mode={group.mode}
          standingsOverride={group.standingsOverride}
        />

        {/* Dynamic bottom section based on mode */}
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