import React from 'react';
import type { Team } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { matchMetadata } from '../../data/matchMetadata';

interface BracketMatchProps {
  matchNumber: number;
  label: string;
  isReversed?: boolean;
}

export const BracketMatch: React.FC<BracketMatchProps> = ({ matchNumber, label, isReversed }) => {
  const playoffMatches = useTournamentStore((state) => state.playoffMatches); 
  const setPlayoffMatchScore = useTournamentStore((state) => state.setPlayoffMatchScore);
  const setPlayoffWinner = useTournamentStore((state) => state.setPlayoffWinner);

  const match = playoffMatches ? playoffMatches[matchNumber] : undefined;

  // Retrieve metadata and format into a single line: Full Venue • Local Time
  const meta = matchMetadata[`P_${matchNumber}`];
  let metaSubtitle = '';
  if (meta) {
    const localDateTime = new Date(meta.utcDate).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    // Use the full venue string (Stadium + City) as requested
    metaSubtitle = `${meta.venue} • ${localDateTime}`;
  }

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>, team: 'A' | 'B') => {
    // Prevent the click from triggering the row's onClick event
    e.stopPropagation();
    
    if (!setPlayoffMatchScore || !match) return;

    const parsedValue = e.target.value === '' ? null : parseInt(e.target.value, 10);
    if (parsedValue !== null && isNaN(parsedValue)) return;

    if (team === 'A') {
      setPlayoffMatchScore(match.id, parsedValue, match.scoreB);
    } else {
      setPlayoffMatchScore(match.id, match.scoreA, parsedValue);
    }
  };

  const handleTeamClick = (teamId: string) => {
    if (!setPlayoffWinner || !match) return;
    setPlayoffWinner(match.id, teamId);
  };

  const renderTeam = (team: Team | null | undefined, score: number | null, teamType: 'A' | 'B') => {
    // Handle TBD (To Be Decided) state
    if (!team) {
      return (
        <div className={`flex items-center justify-between p-2 border-b last:border-0 border-gray-100 bg-white ${isReversed ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 min-w-0 ${isReversed ? 'pl-2 flex-row-reverse' : 'pr-2'}`}>
            <div className="w-5 h-3.5 bg-gray-100 rounded-[2px] border border-gray-200 shrink-0" />
            <span className="font-medium text-xs sm:text-sm text-gray-400 italic">TBD</span>
          </div>
          <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded shrink-0" />
        </div>
      );
    }

    // Determine the winner dynamically
    let isWinner = false;
    if (match?.winnerTeamId) {
      isWinner = match.winnerTeamId === team.id;
    } else if (match && match.scoreA !== null && match.scoreB !== null) {
      if (teamType === 'A') isWinner = match.scoreA > match.scoreB;
      if (teamType === 'B') isWinner = match.scoreB > match.scoreA;
    }

    // Apply exact styling to restore the vibrant green look
    const bgClass = isWinner ? 'bg-green-100' : 'bg-white hover:bg-gray-50';
    const borderClass = isWinner ? 'border-green-500 text-gray-900' : 'border-gray-200 text-gray-800';
    const textColorClass = isWinner ? 'text-green-800 font-bold' : 'text-gray-700';

    return (
      <div 
        onClick={() => handleTeamClick(team.id)}
        className={`flex items-center justify-between p-2 border-b last:border-0 border-gray-100 transition-colors cursor-pointer ${bgClass} ${isReversed ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-2 min-w-0 ${isReversed ? 'pl-2 flex-row-reverse' : 'pr-2'}`}>
          <img 
            src={team.flagUrl} 
            alt={team.name} 
            className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 shadow-sm shrink-0"
          />
          <span className={`font-medium text-xs sm:text-sm truncate ${textColorClass}`}>
            {team.name}
          </span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onClick={(e) => e.stopPropagation()}
          className={`w-8 h-8 text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm shrink-0 bg-white shadow-sm ${borderClass}`}
          value={score !== null ? score : ''}
          onChange={(e) => handleScoreChange(e, teamType)}
        />
      </div>
    );
  };

  return (
    // Expanded min-width to 290px to test fitting the full venue string on one line
    <div className="flex flex-col bg-white rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200 w-full min-w-[290px] overflow-hidden">
      
      {/* Header containing label and full metadata on one line */}
      <div className="bg-[#1a2b4c] text-white flex flex-col items-center justify-center py-1.5 px-2">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{label}</span>
        {metaSubtitle && (
          // Added 'truncate w-full' to safeguard against line-breaks if the text is exceptionally long
          <span className="text-[9px] text-blue-200/80 font-medium mt-0.5 text-center leading-tight tracking-wide truncate w-full">
            {metaSubtitle}
          </span>
        )}
      </div>

      {/* Teams Container */}
      <div className="flex flex-col">
        {renderTeam(match?.teamA, match?.scoreA ?? null, 'A')}
        {renderTeam(match?.teamB, match?.scoreB ?? null, 'B')}
      </div>

    </div>
  );
};