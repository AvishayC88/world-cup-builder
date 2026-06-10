import React, { useContext, useMemo } from 'react';
import type { Team, PlayoffMatch } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { matchMetadata } from '../../data/matchMetadata';
import { LiveModeContext } from '../../App';
import { recalculateTree } from '../../lib/playoffProgression';

interface BracketMatchProps {
  matchNumber: number;
  label: string;
  isReversed?: boolean;
}

export const BracketMatch: React.FC<BracketMatchProps> = ({ matchNumber, label, isReversed }) => {
  const isLiveMode = useContext(LiveModeContext);

  const playoffMatches = useTournamentStore((state) => state.playoffMatches);
  const liveMatches = useTournamentStore((state) => state.liveMatches);
  const setPlayoffMatchScore = useTournamentStore((state) => state.setPlayoffMatchScore);
  const setPlayoffWinner = useTournamentStore((state) => state.setPlayoffWinner);

  const liveComputedTree = useMemo(() => {
    if (!playoffMatches) return undefined;

    // 1. Create a "Live-Only" tree base
    const liveTree: Record<number, PlayoffMatch> = {};
    for (let i = 1; i <= 32; i++) {
      liveTree[i] = { id: i, teamA: null, teamB: null, scoreA: null, scoreB: null, winnerTeamId: null };
    }

    // 2. Set the initial teams from the R32 prediction (the only static baseline)
    for (let i = 1; i <= 16; i++) {
      liveTree[i].teamA = playoffMatches[i]?.teamA || null;
      liveTree[i].teamB = playoffMatches[i]?.teamB || null;
    }

    // 3. Inject live results into the tree
    Object.keys(liveMatches).forEach((key) => {
      const id = parseInt(key.replace('P_', ''), 10);
      if (id >= 1 && id <= 32) {
        const data = liveMatches[key];
        liveTree[id].scoreA = data.scoreA;
        liveTree[id].scoreB = data.scoreB;
        liveTree[id].winnerTeamId = data.winnerTeamId || (
          (data.scoreA !== null && data.scoreB !== null && data.scoreA > data.scoreB) ? liveTree[id].teamA?.id :
          (data.scoreA !== null && data.scoreB !== null && data.scoreB > data.scoreA) ? liveTree[id].teamB?.id : null
        );
      }
    });

    // 4. Run the engine on the PURE live data
    return recalculateTree(liveTree);
  }, [playoffMatches, liveMatches]);

  const liveComputedMatch = liveComputedTree?.[matchNumber];

  const match = useMemo(() => {
    if (!playoffMatches) return undefined;
    if (!isLiveMode) return playoffMatches[matchNumber];
    return liveComputedMatch;
  }, [isLiveMode, playoffMatches, liveComputedMatch, matchNumber]);

  const getPredictionStatus = () => {
    if (isLiveMode) return null;

    const originalPredictionMatch = playoffMatches ? playoffMatches[matchNumber] : undefined;
    const realA = liveComputedMatch?.scoreA;
    const realB = liveComputedMatch?.scoreB;
    const predA = originalPredictionMatch?.scoreA;
    const predB = originalPredictionMatch?.scoreB;

    if (realA == null || realB == null || predA == null || predB == null) return null;

    const predTeamA = originalPredictionMatch?.teamA?.id;
    const predTeamB = originalPredictionMatch?.teamB?.id;
    const actualTeamA = liveComputedMatch?.teamA?.id;
    const actualTeamB = liveComputedMatch?.teamB?.id;

    if (!predTeamA || !predTeamB || !actualTeamA || !actualTeamB || predTeamA !== actualTeamA || predTeamB !== actualTeamB) {
      return 'WRONG';
    }

    if (predA === realA && predB === realB) return 'EXACT';

    const predWinner = originalPredictionMatch?.winnerTeamId || (predA > predB ? predTeamA : predB > predA ? predTeamB : null);
    const realWinner = liveComputedMatch?.winnerTeamId || (realA > realB ? actualTeamA : realB > realA ? actualTeamB : null);

    if (predWinner && realWinner && predWinner === realWinner) {
      return 'RESULT';
    }
    
    return 'WRONG';
  };

  const predictionStatus = getPredictionStatus();
  let predictionRingClass = '';
  if (predictionStatus === 'EXACT') predictionRingClass = 'ring-2 ring-green-500 shadow-md shadow-green-500/20';
  else if (predictionStatus === 'RESULT') predictionRingClass = 'ring-2 ring-orange-400 shadow-md shadow-orange-400/20';
  else if (predictionStatus === 'WRONG') predictionRingClass = 'ring-2 ring-red-500 shadow-md shadow-red-500/20';

  const liveMatch = match ? (liveMatches[match.id] || liveMatches[`P_${match.id}`]) : undefined;

  const meta = matchMetadata[`P_${matchNumber}`];
  let metaSubtitle = '';
  if (meta) {
    const localDateTime = new Date(meta.utcDate).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    metaSubtitle = `${meta.venue} • ${localDateTime}`;
  }

  let isGameActive = false;
  if (isLiveMode && liveMatch) {
    if (liveMatch.status === 'LIVE') {
      metaSubtitle = liveMatch.minute == null ? '🔴 LIVE' : `🔴 LIVE • ${liveMatch.minute}' MIN`;
      isGameActive = true;
    } else if (['FT', 'AET', 'PEN'].includes(liveMatch.status)) {
      metaSubtitle = `Finished • ${metaSubtitle}`;
    }
  }

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>, team: 'A' | 'B') => {
    e.stopPropagation();
    if (isLiveMode || !setPlayoffMatchScore || !match) return;

    const parsedValue = e.target.value === '' ? null : parseInt(e.target.value, 10);
    if (parsedValue !== null && isNaN(parsedValue)) return;

    if (team === 'A') {
      setPlayoffMatchScore(match.id, parsedValue, match.scoreB);
    } else {
      setPlayoffMatchScore(match.id, match.scoreA, parsedValue);
    }
  };

  const handleTeamClick = (teamId: string) => {
    if (isLiveMode || !setPlayoffWinner || !match) return;
    setPlayoffWinner(match.id, teamId);
  };

  const renderTeam = (team: Team | null | undefined, score: number | null, teamType: 'A' | 'B') => {

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

    const isTie = match ? (match.scoreA !== null && match.scoreB !== null && match.scoreA === match.scoreB) : false;
    
    let isWinner = false;
    
    // ARCHITECTURAL FIX: Bypass recalculateTree which wipes winnerTeamId on ties. 
    // We pull the winner directly from live data or prediction data for the UI highlighting.
    const originalPredictionMatch = playoffMatches ? playoffMatches[matchNumber] : undefined;
    const activeWinnerId = isLiveMode 
      ? (liveMatch?.winnerTeamId || originalPredictionMatch?.winnerTeamId || match?.winnerTeamId)
      : match?.winnerTeamId;

    if (activeWinnerId) {
      // Case insensitive match to protect against mock vs store ID mismatches (e.g., 'ger' vs 'GER')
      isWinner = String(activeWinnerId).toLowerCase() === String(team.id).toLowerCase();
    } else if (match && score !== null) {
      const opponentScore = teamType === 'A' ? match.scoreB : match.scoreA;
      if (opponentScore !== null) {
        isWinner = score > opponentScore;
      }
    }

    const wonViaPenalties = isWinner && isTie;

    const baseBg = isLiveMode && !isWinner ? 'bg-slate-50' : 'bg-white hover:bg-gray-50';
    const bgClass = isWinner ? 'bg-green-100' : baseBg;
    const cursorClass = isLiveMode ? 'cursor-default' : 'cursor-pointer';
    
    const borderClass = isWinner 
      ? 'border-green-500 text-gray-900' 
      : (isLiveMode ? 'border-gray-200 text-gray-500 bg-gray-50' : 'border-gray-200 text-gray-800');
    
    const textColorClass = isWinner 
      ? 'text-green-800 font-bold' 
      : (isLiveMode ? 'text-gray-500' : 'text-gray-700');

    return (
      <div 
        onClick={() => handleTeamClick(team.id)}
        className={`flex items-center justify-between p-2 border-b last:border-0 border-gray-100 transition-colors ${cursorClass} ${bgClass} ${isReversed ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-2 min-w-0 ${isReversed ? 'pl-2 flex-row-reverse' : 'pr-2'}`}>
          <img 
            src={team.flagUrl} 
            alt={team.name} 
            className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 shadow-sm shrink-0"
          />
          <span className={`font-medium text-xs sm:text-sm flex items-center gap-1.5 truncate ${textColorClass}`}>
            {team.name}
            {wonViaPenalties && (
              <span className="text-[9px] font-black text-white bg-green-600/80 px-1 py-0.5 rounded border border-green-700/50 leading-none shadow-sm">
                PEN
              </span>
            )}
          </span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          readOnly={isLiveMode}
          onClick={(e) => e.stopPropagation()}
          className={`w-8 h-8 text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm shrink-0 shadow-sm ${borderClass} ${isLiveMode ? 'select-none pointer-events-none' : 'bg-white'}`}
          value={score !== null ? score : ''}
          onChange={(e) => handleScoreChange(e, teamType)}
        />      
      </div>
    );
  };

  return (
    <div className={`flex flex-col rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] border w-full min-w-[290px] overflow-hidden transition-all duration-300 ${isGameActive ? 'border-red-400/50 shadow-red-900/10' : 'border-gray-200 bg-white'} ${predictionRingClass}`}>
      <div className={`text-white flex flex-col items-center justify-center py-1.5 px-2 transition-colors duration-300 ${isGameActive ? 'bg-red-950/90' : 'bg-[#1a2b4c]'}`}>
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        {metaSubtitle && (
          <span className={`text-[9px] font-medium mt-0.5 text-center leading-tight tracking-wide truncate w-full ${isGameActive ? 'text-red-200' : 'text-blue-200/80'}`}>
            {metaSubtitle}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {renderTeam(match?.teamA, match?.scoreA ?? null, 'A')}
        {renderTeam(match?.teamB, match?.scoreB ?? null, 'B')}
      </div>
    </div>
  );
};