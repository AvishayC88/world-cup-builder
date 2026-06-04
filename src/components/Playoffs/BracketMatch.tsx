import React from 'react';
import { useTournamentStore } from '../../store/tournamentStore';

interface BracketMatchProps {
  matchNumber: number;
  label?: string;
  isReversed?: boolean; 
}

export const BracketMatch: React.FC<BracketMatchProps> = ({ matchNumber, label, isReversed = false }) => {
  const match = useTournamentStore((state) => state.playoffMatches[matchNumber]);
  const setPlayoffScore = useTournamentStore((state) => state.setPlayoffMatchScore);
  const setPlayoffWinner = useTournamentStore((state) => state.setPlayoffWinner);

  const teamA = match?.teamA;
  const teamB = match?.teamB;
  const winnerId = match?.winnerTeamId;

  const handleScoreChange = (team: 'A' | 'B', value: string) => {
    if (!match) return;
    const parsedValue = value === '' ? null : parseInt(value, 10);
    
    if (parsedValue !== null && isNaN(parsedValue)) return;

    if (team === 'A') {
      setPlayoffScore(matchNumber, parsedValue, match.scoreB);
    } else {
      setPlayoffScore(matchNumber, match.scoreA, parsedValue);
    }
  };

  const handleTeamClick = (teamId?: string) => {
    if (!teamId || !teamA || !teamB) return; 
    setPlayoffWinner(matchNumber, teamId);
  };

  const isWinnerA = teamA && winnerId === teamA.id;
  const isWinnerB = teamB && winnerId === teamB.id;

  return (
    <div className={`w-56 sm:w-64 bg-white/95 backdrop-blur-sm rounded-md shadow-md border ${winnerId ? 'border-gray-400' : 'border-gray-300'} overflow-hidden shrink-0 flex flex-col transition-all`}>
      {/* Match Header */}
      <div className="bg-blue-950 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest">
        {label || `Match ${matchNumber}`}
      </div>
      
      {/* Teams Container */}
      <div className="flex flex-col divide-y divide-gray-100">
        
        {/* Team A */}
        <div 
          onClick={() => handleTeamClick(teamA?.id)}
          className={`flex items-center justify-between p-1.5 transition-colors ${teamA && teamB ? 'cursor-pointer' : ''} ${isReversed ? 'flex-row-reverse' : ''} ${isWinnerA ? 'bg-green-100' : teamA ? 'hover:bg-gray-50 bg-white' : 'bg-gray-100/50'}`}
        >
          {/* Flag and Name Wrapper */}
          <div className={`flex items-center overflow-hidden flex-1 ${isReversed ? 'flex-row-reverse' : ''}`}>
            {teamA && (
              <img 
                src={teamA.flagUrl} 
                alt={teamA.name} 
                className={`w-5 h-3.5 object-cover rounded-sm border border-gray-300 shadow-sm shrink-0 ${isReversed ? 'ml-2' : 'mr-2'}`}
              />
            )}
            <span className={`font-semibold text-sm truncate px-1 ${isReversed ? 'text-right' : 'text-left'} ${isWinnerA ? 'text-green-800' : teamA ? 'text-gray-800' : 'text-gray-400'}`}>
              {teamA ? teamA.name : 'TBD'}
            </span>
          </div>

          <input 
            type="text" 
            inputMode="numeric"
            pattern="[0-9]*"
            className={`w-8 h-7 text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold shadow-inner disabled:bg-gray-200 disabled:text-transparent shrink-0 ${isWinnerA ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-100 focus:bg-white'}`}
            disabled={!teamA || !teamB}
            value={match?.scoreA !== null && match?.scoreA !== undefined ? match.scoreA : ''}
            onChange={(e) => handleScoreChange('A', e.target.value)}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>

        {/* Team B */}
        <div 
          onClick={() => handleTeamClick(teamB?.id)}
          className={`flex items-center justify-between p-1.5 transition-colors ${teamA && teamB ? 'cursor-pointer' : ''} ${isReversed ? 'flex-row-reverse' : ''} ${isWinnerB ? 'bg-green-100' : teamB ? 'hover:bg-gray-50 bg-white' : 'bg-gray-100/50'}`}
        >
          {/* Flag and Name Wrapper */}
          <div className={`flex items-center overflow-hidden flex-1 ${isReversed ? 'flex-row-reverse' : ''}`}>
            {teamB && (
              <img 
                src={teamB.flagUrl} 
                alt={teamB.name} 
                className={`w-5 h-3.5 object-cover rounded-sm border border-gray-300 shadow-sm shrink-0 ${isReversed ? 'ml-2' : 'mr-2'}`}
              />
            )}
            <span className={`font-semibold text-sm truncate px-1 ${isReversed ? 'text-right' : 'text-left'} ${isWinnerB ? 'text-green-800' : teamB ? 'text-gray-800' : 'text-gray-400'}`}>
              {teamB ? teamB.name : 'TBD'}
            </span>
          </div>

          <input 
            type="text" 
            inputMode="numeric"
            pattern="[0-9]*"
            className={`w-8 h-7 text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold shadow-inner disabled:bg-gray-200 disabled:text-transparent shrink-0 ${isWinnerB ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-100 focus:bg-white'}`}
            disabled={!teamA || !teamB}
            value={match?.scoreB !== null && match?.scoreB !== undefined ? match.scoreB : ''}
            onChange={(e) => handleScoreChange('B', e.target.value)}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      </div>
    </div>
  );
};