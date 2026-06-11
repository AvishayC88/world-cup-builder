import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TournamentState, PlayoffMatch, Match, Group } from './types';
import { generateRoundOf32 } from '../lib/playoffLogic';
import { recalculateTree } from '../lib/playoffProgression';

// Notice we added 'get' next to 'set' here so our actions can read the current state
export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      groups: {},
      matches: {},
      isThirdPlaceAutoCalculated: true,
      thirdPlaceStandingsOverride: [],
      playoffMatches: {},
      isAutoFilling: false,
      
      // --- LIVE MATCHES STATE ---
      liveMatches: {},

      fetchLiveMatches: async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';
          const response = await fetch(`${baseUrl}/api/live-matches`);
          
          if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Update the local state with the BFF data
          set({ liveMatches: data });
        } catch (error) {
          // In a real production app, we would dispatch this to a logging service
          console.error('Failed to sync with BFF:', error);
        }
      },

      importFinishedMatches: () => {
        const { liveMatches, setMatchScore, setPlayoffMatchScore, setPlayoffWinner } = get();
        
        Object.entries(liveMatches).forEach(([matchId, liveMatch]) => {
          // ARCHITECTURAL FIX: Support FT, AET (After Extra Time), PEN (Penalties), and FINISHED
          const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(liveMatch.status);
          
          if (isFinished && liveMatch.scoreA !== null && liveMatch.scoreB !== null) {
            
            // Handle Group Stage matches
            if (matchId.startsWith('G')) {
              setMatchScore(matchId, liveMatch.scoreA, liveMatch.scoreB);
            } 
            // Handle Playoff matches
            else if (matchId.startsWith('P_')) {
              const playoffId = parseInt(matchId.replace('P_', ''), 10);
              
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

      autoFillGroupStage: async (apiKey: string) => {
        const { groups, matches, setMatchScore } = get();
        set({ isAutoFilling: true });

        try {
          // Build the request: collect all group stage matches with team names
          const matchInputs = Object.values(matches).map(match => {
            const group = groups[match.groupId];
            const teamA = group.teams.find(t => t.id === match.teamAId);
            const teamB = group.teams.find(t => t.id === match.teamBId);
            return {
              matchId: match.id,
              teamAName: teamA?.name || match.teamAId,
              teamBName: teamB?.name || match.teamBId,
              context: `Group ${match.groupId} - Group Stage`,
            };
          });

          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';
          
          // Chunk matches into batches to avoid 503/timeout from Gemini (72 matches is too much for one prompt)
          const batchSize = 18;
          for (let i = 0; i < matchInputs.length; i += batchSize) {
            const batch = matchInputs.slice(i, i + batchSize);
            
            const response = await fetch(`${baseUrl}/api/ai-predict`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Gemini-Api-Key': apiKey,
              },
              body: JSON.stringify({ matches: batch }),
            });

            if (!response.ok) {
              throw new Error(`AI predict API returned status: ${response.status}`);
            }

            const data = await response.json();
            const predictions = data.predictions || [];

            // Apply each prediction from this batch immediately
            for (const pred of predictions) {
              if (pred.matchId && pred.scoreA !== undefined && pred.scoreB !== undefined) {
                setMatchScore(pred.matchId, pred.scoreA, pred.scoreB);
              }
            }
          }
        } catch (error) {
          console.error('AI Auto-Fill (Groups) failed:', error);
          alert('AI Auto-Fill failed. Please check that the API is running and your Gemini API key is configured.');
        } finally {
          set({ isAutoFilling: false });
        }
      },

      autoFillPlayoffs: async (apiKey: string) => {
        set({ isAutoFilling: true });

        try {
          const roundLabels: Record<string, string> = {};
          for (let i = 1; i <= 16; i++) roundLabels[i] = 'Round of 32';
          for (let i = 17; i <= 24; i++) roundLabels[i] = 'Round of 16';
          for (let i = 25; i <= 28; i++) roundLabels[i] = 'Quarter-Final';
          for (let i = 29; i <= 30; i++) roundLabels[i] = 'Semi-Final';
          roundLabels[31] = 'Third Place Play-off';
          roundLabels[32] = 'World Cup Final';

          // Define the rounds in order so we process them sequentially
          const rounds: number[][] = [
            Array.from({ length: 16 }, (_, i) => i + 1),    // R32: matches 1-16
            Array.from({ length: 8 }, (_, i) => i + 17),     // R16: matches 17-24
            Array.from({ length: 4 }, (_, i) => i + 25),     // QF:  matches 25-28
            [29, 30],                                          // SF:  matches 29-30
            [31, 32],                                          // 3rd place + Final: matches 31-32
          ];

          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';
          let anyMatchPredicted = false;

          // Process round by round: predict → apply → teams propagate → next round
          for (const roundMatchIds of rounds) {
            // Re-read the current state each round (teams are now propagated from previous round)
            const currentPlayoffs = get().playoffMatches;
            const { setPlayoffMatchScore, setPlayoffWinner } = get();

            const matchInputs: Array<{ matchId: string; teamAName: string; teamBName: string; context: string }> = [];

            for (const matchId of roundMatchIds) {
              const match = currentPlayoffs[matchId];
              if (match?.teamA && match?.teamB) {
                matchInputs.push({
                  matchId: `P_${match.id}`,
                  teamAName: match.teamA.name,
                  teamBName: match.teamB.name,
                  context: `${roundLabels[match.id] || 'Knockout Stage'} - Playoff`,
                });
              }
            }

            // Skip this round if no matches have both teams resolved
            if (matchInputs.length === 0) continue;

            anyMatchPredicted = true;

            const response = await fetch(`${baseUrl}/api/ai-predict`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Gemini-Api-Key': apiKey,
              },
              body: JSON.stringify({ matches: matchInputs }),
            });

            if (!response.ok) {
              throw new Error(`AI predict API returned status: ${response.status}`);
            }

            const data = await response.json();
            const predictions = data.predictions || [];

            // Apply each prediction for this round
            for (const pred of predictions) {
              if (pred.matchId && pred.scoreA !== undefined && pred.scoreB !== undefined) {
                const playoffId = parseInt(pred.matchId.replace('P_', ''), 10);
                
                // Set the score (this calls recalculateTree, propagating winners)
                setPlayoffMatchScore(playoffId, pred.scoreA, pred.scoreB);

                // For ties in knockout matches, set the penalty winner
                if (pred.scoreA === pred.scoreB && pred.winnerTeamName) {
                  // Re-read state to get updated match with teams
                  const updatedMatch = get().playoffMatches[playoffId];
                  if (updatedMatch) {
                    const winnerTeam = 
                      updatedMatch.teamA?.name.toLowerCase() === pred.winnerTeamName.toLowerCase() ? updatedMatch.teamA :
                      updatedMatch.teamB?.name.toLowerCase() === pred.winnerTeamName.toLowerCase() ? updatedMatch.teamB :
                      null;
                    if (winnerTeam) {
                      setPlayoffWinner(playoffId, winnerTeam.id);
                    }
                  }
                }
              }
            }
            // After applying all predictions for this round, recalculateTree has
            // already propagated winners to the next round's team slots.
            // The next iteration of the loop will pick those up.
          }

          if (!anyMatchPredicted) {
            alert('No playoff matches with known teams to predict. Make sure the bracket has teams filled in.');
          }
        } catch (error) {
          console.error('AI Auto-Fill (Playoffs) failed:', error);
          alert('AI Auto-Fill failed. Please check that the API is running and your Gemini API key is configured.');
        } finally {
          set({ isAutoFilling: false });
        }
      },
    }),
    {
      name: 'world-cup-2026-storage', 
    }
  )
);