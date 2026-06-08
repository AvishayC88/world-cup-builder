import React, { useContext } from 'react';
import type { Match } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { MatchMetaInfo } from '../shared/MatchMetaInfo'; 
import { LiveModeContext } from '../../App'; // Import the Live Context

interface MatchRowProps {
  match: Match;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  // 1. Consume Live Mode state
  const isLiveMode = useContext(LiveModeContext);

  const setMatchScore = useTournamentStore((state) => state.setMatchScore);
  const groups = useTournamentStore((state) => state.groups);
  const liveMatches = useTournamentStore((state) => state.liveMatches);

  const teamA = groups[match.groupId].teams.find((t) => t.id === match.teamAId);
  const teamB = groups[match.groupId].teams.find((t) => t.id === match.teamBId);

  if (!teamA || !teamB) return null;

  // 2. Fetch active live data if available
  const liveMatch = liveMatches[match.id];

  // 3. Data Routing: Switch between user predictions and reality
  const displayScoreA = isLiveMode ? (liveMatch?.scoreA ?? null) : match.scoreA;
  const displayScoreB = isLiveMode ? (liveMatch?.scoreB ?? null) : match.scoreB;

  const handleScoreChange = (team: 'A' | 'B', value: string) => {
    // ARCHITECTURAL GUARD: Lock inputs in live mode
    if (isLiveMode) return;

    const parsedValue = value === '' ? null : parseInt(value, 10);
    if (parsedValue !== null && isNaN(parsedValue)) return;

    if (team === 'A') {
      setMatchScore(match.id, parsedValue, match.scoreB);
    } else {
      setMatchScore(match.id, match.scoreA, parsedValue);
    }
  };

  // UI States for live visualization
  const isGameActive = isLiveMode && liveMatch?.status === 'LIVE';

  return (
    <div className={`flex flex-col py-2 border-b border-gray-100 last:border-0 w-full min-w-0 transition-colors duration-300 ${isGameActive ? 'bg-red-50/30' : ''}`}>
      
      {/* Top Row: Meta Info & Live Indicator */}
      <div className="flex flex-col items-center">
        <MatchMetaInfo matchId={match.id} />
        
        {/* Dynamic badge that only renders in Live Mode */}
        {isLiveMode && liveMatch && (
          <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isGameActive ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
            {isGameActive ? `🔴 LIVE • ${liveMatch.minute}' MIN` : 'Finished'}
          </span>
        )}
      </div>

      {/* Bottom Row: Teams and Score Inputs */}
      <div className="flex items-center justify-between w-full min-w-0 pt-1">
        
        {/* Team A */}
        <div className="flex-1 flex items-center min-w-0 pr-2">
          <img 
            src={teamA.flagUrl} 
            alt={teamA.name} 
            className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0 ml-2 flex justify-end">
            <span className={`font-medium text-xs sm:text-sm truncate ${isLiveMode ? 'text-gray-600' : 'text-gray-800'}`}>
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
            readOnly={isLiveMode}
            className={`w-8 h-8 text-center border rounded focus:outline-none font-bold text-sm transition-colors ${
              isLiveMode 
                ? 'border-gray-200 bg-gray-100 text-gray-500 select-none pointer-events-none shadow-inner' 
                : 'border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900'
            }`}
            value={displayScoreA !== null ? displayScoreA : ''}
            onChange={(e) => handleScoreChange('A', e.target.value)}
          />
          <span className={`font-bold text-xs shrink-0 ${isLiveMode ? 'text-gray-300' : 'text-gray-400'}`}>-</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            readOnly={isLiveMode}
            className={`w-8 h-8 text-center border rounded focus:outline-none font-bold text-sm transition-colors ${
              isLiveMode 
                ? 'border-gray-200 bg-gray-100 text-gray-500 select-none pointer-events-none shadow-inner' 
                : 'border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900'
            }`}
            value={displayScoreB !== null ? displayScoreB : ''}
            onChange={(e) => handleScoreChange('B', e.target.value)}
          />
        </div>

        {/* Team B */}
        <div className="flex-1 flex items-center min-w-0 pl-2">
          <div className="flex-1 min-w-0 mr-2 flex justify-start">
            <span className={`font-medium text-xs sm:text-sm truncate ${isLiveMode ? 'text-gray-600' : 'text-gray-800'}`}>
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
    </div>
  );
};