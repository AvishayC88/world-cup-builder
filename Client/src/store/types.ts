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
  importFinishedMatches: (phase: 'groups' | 'playoffs') => void;
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
  // When true, syncPlayoffBracket() will NOT overwrite R32 team slots from group predictions.
  // Set to true after importFinishedMatches('playoffs') so real qualified teams are preserved
  // even when the user switches tabs and comes back to the Playoffs screen.
  isPlayoffBracketLocked: boolean;
  // Tracks which next-round team slots (e.g., "17_A", "25_B") were placed by
  // importFinishedMatches(). recalculateTree() will skip overwriting these slots
  // so that real advancing teams aren't reverted to stale user predictions.
  liveSyncedSlots: Record<string, boolean>;

  // --- AI CHALLENGE STATE (split by phase) ---
  aiGroupPredictions: Record<string, AiPrediction>;
  aiPlayoffPredictions: Record<string, AiPrediction>;
  lockedGroupUserPredictions: Record<string, { scoreA: number | null; scoreB: number | null }>;
  lockedPlayoffUserPredictions: Record<string, { scoreA: number | null; scoreB: number | null }>;
  isAiGroupLoading: boolean;
  isAiPlayoffLoading: boolean;
  
  setMatchScore: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  toggleGroupMode: (groupId: string) => void;
  setGroupStandingsOverride: (groupId: string, teamIds: string[]) => void;
  syncPlayoffBracket: () => void;
  setPlayoffMatchScore: (matchId: number, scoreA: number | null, scoreB: number | null) => void;
  setPlayoffWinner: (matchId: number, teamId: string) => void;
  resetPlayoffs: (keepSync?: boolean) => void; 
  resetGroupStageState: () => void;
  setThirdPlaceStandingsOverride: (teamIds: string[]) => void;
  setAllGroupsMode: (mode: 'SCORES' | 'MANUAL') => void;
  setPlayoffBracketLocked: (locked: boolean) => void;
  autoFillGroupStage: (apiKey: string, fillEmptyOnly?: boolean) => Promise<void>;
  autoFillPlayoffs: (apiKey: string, fillEmptyOnly?: boolean) => Promise<void>;
  generateAiGroupChallenge: (apiKey: string) => Promise<void>;
  generateAiPlayoffChallenge: (apiKey: string, onlyMissing?: boolean) => Promise<void>;
  clearAiGroupChallenge: () => void;
  clearAiPlayoffChallenge: () => void;
}