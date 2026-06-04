import React from 'react';
import type { Match } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';

interface MatchRowProps {
  match: Match;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  const setMatchScore = useTournamentStore((state) => state.setMatchScore);
  const groups = useTournamentStore((state) => state.groups);

  const teamA = groups[match.groupId].teams.find((t) => t.id === match.teamAId);
  const teamB = groups[match.groupId].teams.find((t) => t.id === match.teamBId);

  if (!teamA || !teamB) return null;

  const handleScoreChange = (team: 'A' | 'B', value: string) => {
    const parsedValue = value === '' ? null : parseInt(value, 10);
    if (parsedValue !== null && isNaN(parsedValue)) return;

    if (team === 'A') {
      setMatchScore(match.id, parsedValue, match.scoreB);
    } else {
      setMatchScore(match.id, match.scoreA, parsedValue);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 w-full min-w-0">
      
      {/* Team A (Left Side): Flag on the far left, Text pushed securely to the right */}
      <div className="flex-1 flex items-center min-w-0 pr-2">
        <img 
          src={teamA.flagUrl} 
          alt={teamA.name} 
          className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 shadow-sm shrink-0"
        />
        <div className="flex-1 min-w-0 ml-2 flex justify-end">
          <span className="font-medium text-xs sm:text-sm text-gray-800 truncate">
            {teamA.name}
          </span>
        </div>
      </div>
      
      {/* Score Inputs (Center) */}
      <div className="flex items-center justify-center space-x-1 shrink-0">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="w-8 h-8 text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold text-sm bg-gray-50 focus:bg-white"
          value={match.scoreA !== null ? match.scoreA : ''}
          onChange={(e) => handleScoreChange('A', e.target.value)}
        />
        <span className="text-gray-400 font-bold text-xs shrink-0">-</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="w-8 h-8 text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold text-sm bg-gray-50 focus:bg-white"
          value={match.scoreB !== null ? match.scoreB : ''}
          onChange={(e) => handleScoreChange('B', e.target.value)}
        />
      </div>

      {/* Team B (Right Side): Text pushed securely to the left, Flag on the far right */}
      <div className="flex-1 flex items-center min-w-0 pl-2">
        <div className="flex-1 min-w-0 mr-2 flex justify-start">
          <span className="font-medium text-xs sm:text-sm text-gray-800 truncate">
            {teamB.name}
          </span>
        </div>
        <img 
          src={teamB.flagUrl} 
          alt={teamB.name} 
          className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 shadow-sm shrink-0"
        />
      </div>
      
    </div>
  );
};