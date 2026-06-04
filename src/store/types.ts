export interface Team {
  id: string;
  name: string;
  flagUrl: string;
}

export interface Match {
  id: string;
  groupId: string;
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
}

export interface Group {
  id: string;
  mode: 'SCORES' | 'MANUAL';
  teams: Team[];
  standingsOverride: string[];
}

export interface PlayoffMatch {
  id: number;
  teamA: Team | null;
  teamB: Team | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerTeamId: string | null; 
}

export interface TournamentState {
  groups: Record<string, Group>;
  matches: Record<string, Match>;
  isThirdPlaceAutoCalculated: boolean;
  playoffMatches: Record<number, PlayoffMatch>;
  
  setMatchScore: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  toggleGroupMode: (groupId: string) => void;
  setGroupStandingsOverride: (groupId: string, teamIds: string[]) => void;
  syncPlayoffBracket: () => void;
  setPlayoffMatchScore: (matchId: number, scoreA: number | null, scoreB: number | null) => void;
  setPlayoffWinner: (matchId: number, teamId: string) => void;
  resetPlayoffs: () => void; 
  resetGroupStageState: () => void;
}