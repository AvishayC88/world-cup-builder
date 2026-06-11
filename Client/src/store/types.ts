export type MatchStatus = 'NS' | 'LIVE' | 'HT' | 'FT' | 'AET' | 'PEN' | 'FINISHED'; // Not Started, Live, Half Time, Full Time, Extra Time, Penalties, Finished

export interface LiveMatch {
  id: string; // Our internal ID (e.g., 'GA_M1', 'P_32')
  status: MatchStatus;
  minute?: number; // Current minute if LIVE
  scoreA: number | null;
  scoreB: number | null;
  winnerTeamId?: string; // Crucial for playoff games that end in penalties
}

export interface TournamentState {
  liveMatches: Record<string, LiveMatch>;
  fetchLiveMatches: () => Promise<void>;
  importFinishedMatches: () => void;
}

export interface Team {
  id: string;
  name: string;
  flagUrl: string;
  pot: number;
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
  winnerTeamId: string | null | undefined; 
}

export interface AiPrediction {
  matchId: string;
  scoreA: number;
  scoreB: number;
  winnerTeamName?: string | null; // For playoff ties resolved by penalties
}

export interface TournamentState {
  groups: Record<string, Group>;
  matches: Record<string, Match>;
  isThirdPlaceAutoCalculated: boolean;
  playoffMatches: Record<number, PlayoffMatch>;
  thirdPlaceStandingsOverride: string[];
  isAutoFilling: boolean;

  // --- AI CHALLENGE STATE ---
  aiPredictions: Record<string, AiPrediction>;
  lockedUserPredictions: Record<string, { scoreA: number | null; scoreB: number | null }>; // Snapshot at challenge generation time
  isAiChallengeLoading: boolean;
  
  setMatchScore: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  toggleGroupMode: (groupId: string) => void;
  setGroupStandingsOverride: (groupId: string, teamIds: string[]) => void;
  syncPlayoffBracket: () => void;
  setPlayoffMatchScore: (matchId: number, scoreA: number | null, scoreB: number | null) => void;
  setPlayoffWinner: (matchId: number, teamId: string) => void;
  resetPlayoffs: () => void; 
  resetGroupStageState: () => void;
  setThirdPlaceStandingsOverride: (teamIds: string[]) => void;
  setAllGroupsMode: (mode: 'SCORES' | 'MANUAL') => void;
  autoFillGroupStage: (apiKey: string, fillEmptyOnly?: boolean) => Promise<void>;
  autoFillPlayoffs: (apiKey: string, fillEmptyOnly?: boolean) => Promise<void>;
  generateAiChallenge: (apiKey: string) => Promise<void>;
  clearAiChallenge: () => void;
}