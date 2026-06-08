import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TournamentState, PlayoffMatch, Match, Group, LiveMatch } from './types';
import { generateRoundOf32 } from '../lib/playoffLogic';
import { recalculateTree } from '../lib/playoffProgression';
import { matchMetadata } from '../data/matchMetadata';

// Notice we added 'get' next to 'set' here so our actions can read the current state
export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      groups: {},
      matches: {},
      isThirdPlaceAutoCalculated: true,
      thirdPlaceStandingsOverride: [],
      playoffMatches: {},
      
      // --- LIVE MATCHES STATE ---
      liveMatches: {},

      fetchLiveMatches: async () => {
        // ARCHITECTURAL GUARD: Check if we actually need to fetch to save API quota
        const now = new Date();
        let hasActiveMatches = false;

        for (const matchId in matchMetadata) {
          const matchStart = new Date(matchMetadata[matchId].utcDate);
          const matchEndExpected = new Date(matchStart.getTime() + 150 * 60000); // 150 minutes

          if (now >= matchStart && now <= matchEndExpected) {
            hasActiveMatches = true;
            break;
          }
        }

        if (!hasActiveMatches) {
          console.log('No active matches detected. Skipping API fetch to save quota.');
          // NOTE: In production, you might return here. Commented out for testing.
          // return; 
        }

        try {
          // Dummy data injection for testing the UI. 
          // Replace with real fetch('/api/live-scores') later.
          const mockLiveData: Record<string, LiveMatch> = {
            'GA_M1': { id: 'GA_M1', status: 'FT', scoreA: 2, scoreB: 1 },
            'GA_M2': { id: 'GA_M2', status: 'LIVE', minute: 75, scoreA: 0, scoreB: 0 },
            'P_1': { id: 'P_1', status: 'FT', scoreA: 1, scoreB: 1, winnerTeamId: 'GER' }, // Example with penalties
            'P_2': { id: 'P_2', status: 'LIVE', minute: 75, scoreA: 1, scoreB: 1 },
          };

          set({ liveMatches: mockLiveData });
        } catch (error) {
          console.error('Failed to fetch live matches:', error);
        }
      },
        importFinishedMatches: () => {
          const { liveMatches, setMatchScore, setPlayoffMatchScore, setPlayoffWinner } = get();
          
          Object.values(liveMatches).forEach((liveMatch) => {
            // ARCHITECTURAL FIX: Support FT, AET (After Extra Time), and PEN (Penalties)
            const isFinished = ['FT', 'AET', 'PEN'].includes(liveMatch.status);
            
            if (isFinished && liveMatch.scoreA !== null && liveMatch.scoreB !== null) {
              
              // Handle Group Stage matches
              if (liveMatch.id.startsWith('G')) {
                setMatchScore(liveMatch.id, liveMatch.scoreA, liveMatch.scoreB);
              } 
              // Handle Playoff matches
              else if (liveMatch.id.startsWith('P_')) {
                const playoffId = parseInt(liveMatch.id.replace('P_', ''), 10);
                
                // First set the scores (e.g., 1-1)
                setPlayoffMatchScore(playoffId, liveMatch.scoreA, liveMatch.scoreB);
                
                // Then set the explicit winner if one exists (for penalties)
                if (liveMatch.winnerTeamId) {
                  setPlayoffWinner(playoffId, liveMatch.winnerTeamId);
                }
              }
            }
        });
      },
      // --- END LIVE MATCHES STATE ---

      setThirdPlaceStandingsOverride: (teamIds) =>
        set({ thirdPlaceStandingsOverride: teamIds }),

      setMatchScore: (matchId, scoreA, scoreB) =>
        set((state) => {
          const updatedMatches = { ...state.matches };
          updatedMatches[matchId] = { ...updatedMatches[matchId], scoreA, scoreB };
          return { matches: updatedMatches };
        }),

      toggleGroupMode: (groupId) =>
        set((state) => {
          const currentMode = state.groups[groupId].mode;
          const newMode: 'SCORES' | 'MANUAL' = currentMode === 'SCORES' ? 'MANUAL' : 'SCORES';
          
          const updatedGroups = {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              mode: newMode,
            },
          };

          const isAnyGroupManual = Object.values(updatedGroups).some(g => g.mode === 'MANUAL');

          return {
            groups: updatedGroups,
            isThirdPlaceAutoCalculated: !isAnyGroupManual,
          };
        }),

      setGroupStandingsOverride: (groupId, teamIds) =>
        set((state) => {
          const updatedGroups = {
            ...state.groups,
            [groupId]: {
              ...state.groups[groupId],
              standingsOverride: teamIds,
            },
          };

          return {
            groups: updatedGroups,
            isThirdPlaceAutoCalculated: false,
          };
        }),

      resetGroupStageState: () =>
        set((state) => {
          const newMatches = JSON.parse(JSON.stringify(state.matches)) as Record<string, Match>;
          Object.values(newMatches).forEach(match => {
            match.scoreA = null;
            match.scoreB = null;
          });

          const newGroups = JSON.parse(JSON.stringify(state.groups)) as Record<string, Group>;
          Object.values(newGroups).forEach(group => {
            group.standingsOverride = [...group.teams]
              .sort((a, b) => a.pot - b.pot)
              .map(t => t.id);
          });

          return { 
            matches: newMatches, 
            groups: newGroups, 
            isThirdPlaceAutoCalculated: state.isThirdPlaceAutoCalculated,
            thirdPlaceStandingsOverride: [] 
          };
        }),

      syncPlayoffBracket: () =>
        set((state) => {
          const r32 = generateRoundOf32(
            state.groups, 
            state.matches, 
            state.isThirdPlaceAutoCalculated, 
            state.thirdPlaceStandingsOverride
          );
          
          const playoffs = JSON.parse(JSON.stringify(state.playoffMatches)) as Record<number, PlayoffMatch>;

          if (Object.keys(playoffs).length === 0) {
            r32.forEach(match => { playoffs[match.id] = match; });
            for (let i = 17; i <= 32; i++) {
              playoffs[i] = { id: i, teamA: null, teamB: null, scoreA: null, scoreB: null, winnerTeamId: null };
            }
            return { playoffMatches: playoffs };
          }

          r32.forEach(newMatch => {
            const oldMatch = playoffs[newMatch.id];
            if (oldMatch) {
              oldMatch.teamA = newMatch.teamA;
              oldMatch.teamB = newMatch.teamB;

              if (
                oldMatch.winnerTeamId && 
                oldMatch.winnerTeamId !== oldMatch.teamA?.id && 
                oldMatch.winnerTeamId !== oldMatch.teamB?.id
              ) {
                oldMatch.winnerTeamId = null;
                oldMatch.scoreA = null;
                oldMatch.scoreB = null;
              }
            }
          });

          const updatedPlayoffs = recalculateTree(playoffs);
          return { playoffMatches: updatedPlayoffs };
        }),

      setPlayoffMatchScore: (matchId, scoreA, scoreB) =>
        set((state) => {
          const playoffMatches = JSON.parse(JSON.stringify(state.playoffMatches)) as Record<number, PlayoffMatch>;
          if (!playoffMatches[matchId]) return { playoffMatches };

          const match = playoffMatches[matchId];
          match.scoreA = scoreA;
          match.scoreB = scoreB;

          if (scoreA !== null && scoreB !== null) {
            if (scoreA > scoreB) {
              match.winnerTeamId = match.teamA?.id || null;
            } else if (scoreB > scoreA) {
              match.winnerTeamId = match.teamB?.id || null;
            } else {
              match.winnerTeamId = null;
            }
          } else {
            match.winnerTeamId = null;
          }

          const updatedPlayoffs = recalculateTree(playoffMatches);
          return { playoffMatches: updatedPlayoffs };
        }),

      setPlayoffWinner: (matchId, teamId) =>
        set((state) => {
          const playoffMatches = JSON.parse(JSON.stringify(state.playoffMatches)) as Record<number, PlayoffMatch>;
          if (!playoffMatches[matchId]) return { playoffMatches };

          const match = playoffMatches[matchId];
          
          if (match.winnerTeamId === teamId) {
            match.winnerTeamId = null; // Toggle off
          } else {
            match.winnerTeamId = teamId; // Toggle on
            // ARCHITECTURAL FIX: We no longer clear scoreA and scoreB here.
            // This allows a tie score to exist alongside an explicit winner.
          }

          const updatedPlayoffs = recalculateTree(playoffMatches);
          return { playoffMatches: updatedPlayoffs };
        }),

      resetPlayoffs: () =>
        set((state) => {
          const playoffs = JSON.parse(JSON.stringify(state.playoffMatches)) as Record<number, PlayoffMatch>;
          
          for (let i = 1; i <= 32; i++) {
            if (playoffs[i]) {
              playoffs[i].winnerTeamId = null;
              playoffs[i].scoreA = null;
              playoffs[i].scoreB = null;
            }
          }
          
          const updatedPlayoffs = recalculateTree(playoffs);
          return { playoffMatches: updatedPlayoffs };
        }),

      setAllGroupsMode: (mode) =>
        set((state) => {
          const updatedGroups = { ...state.groups };
          
          Object.keys(updatedGroups).forEach(groupId => {
            updatedGroups[groupId] = {
              ...updatedGroups[groupId],
              mode: mode,
            };
          });

          return {
            groups: updatedGroups,            
            isThirdPlaceAutoCalculated: mode === 'SCORES',
          };
        }),
    }),
    {
      name: 'world-cup-2026-storage', 
    }
  )
);