import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TournamentState, PlayoffMatch, Match, Group, AiPrediction } from './types';
import { generateRoundOf32 } from '../lib/playoffLogic';
import { recalculateTree } from '../lib/playoffProgression';
import { computeLivePlayoffTree } from '../lib/playoffLogic';
import { initializeTournament } from '../lib/initialData';

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
      isPlayoffBracketLocked: false,
      
      // --- AI CHALLENGE STATE ---
      aiGroupPredictions: {},
      aiPlayoffPredictions: {},
      lockedGroupUserPredictions: {},
      lockedPlayoffUserPredictions: {},
      isAiGroupLoading: false,
      isAiPlayoffLoading: false,

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

      importFinishedMatches: (phase: 'groups' | 'playoffs') => {
        const { liveMatches, setMatchScore, groups, matches } = get();
        
        if (phase === 'groups') {
          // Handle Group Stage matches
          Object.entries(liveMatches).forEach(([matchId, liveMatch]) => {
            const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(liveMatch.status);
            if (isFinished && liveMatch.scoreA !== null && liveMatch.scoreB !== null && matchId.startsWith('G')) {
              setMatchScore(matchId, liveMatch.scoreA, liveMatch.scoreB);
            }
          });
          return;
        }

        // --- PLAYOFFS PHASE ---
        // Step 1: Rebuild the bracket team slots from live group standings.
        // This ensures the real qualified teams (not the user's predicted teams) are
        // in each bracket slot before we apply scores. This mirrors what computeLivePlayoffTree
        // does for the Live Reality view.
        const liveTree = computeLivePlayoffTree(groups, matches, liveMatches);

        set((state) => {
          const playoffs = JSON.parse(JSON.stringify(state.playoffMatches)) as Record<number, PlayoffMatch>;

          // Update team slots for every match from the live-computed tree.
          // We only update teams — scores/winners are preserved for now and
          // will be overwritten by the live data in step 2.
          for (let id = 1; id <= 32; id++) {
            if (playoffs[id] && liveTree[id]) {
              playoffs[id].teamA = liveTree[id].teamA;
              playoffs[id].teamB = liveTree[id].teamB;
            }
          }

          // Step 2: Apply finished match scores and winners from live data.
          Object.entries(liveMatches).forEach(([matchId, liveMatch]) => {
            if (!matchId.startsWith('P_')) return;
            const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(liveMatch.status);
            if (!isFinished || liveMatch.scoreA === null || liveMatch.scoreB === null) return;

            const playoffId = parseInt(matchId.replace('P_', ''), 10);
            const match = playoffs[playoffId];
            if (!match) return;

            match.scoreA = liveMatch.scoreA;
            match.scoreB = liveMatch.scoreB;

            if (liveMatch.winnerTeamId) {
              // Explicit winner from live data (penalties etc.)
              match.winnerTeamId = liveMatch.winnerTeamId;
            } else if (liveMatch.scoreA > liveMatch.scoreB) {
              match.winnerTeamId = match.teamA?.id || null;
            } else if (liveMatch.scoreB > liveMatch.scoreA) {
              match.winnerTeamId = match.teamB?.id || null;
            } else {
              match.winnerTeamId = null;
            }
          });

          // Step 3: Recalculate the tree so winners propagate to the correct next-round slots.
          const updatedPlayoffs = recalculateTree(playoffs);
          return { playoffMatches: updatedPlayoffs, isPlayoffBracketLocked: true };
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
            group.mode = 'SCORES';
            group.standingsOverride = [...group.teams]
              .sort((a, b) => a.pot - b.pot)
              .map(t => t.id);
          });

          return { 
            matches: newMatches, 
            groups: newGroups, 
            isThirdPlaceAutoCalculated: true,
            thirdPlaceStandingsOverride: [] 
          };
        }),

      syncPlayoffBracket: () =>
        set((state) => {
          const playoffs = JSON.parse(JSON.stringify(state.playoffMatches)) as Record<number, PlayoffMatch>;

          // First time ever: initialize the full bracket structure.
          if (Object.keys(playoffs).length === 0) {
            const r32 = generateRoundOf32(
              state.groups,
              state.matches,
              state.isThirdPlaceAutoCalculated,
              state.thirdPlaceStandingsOverride
            );
            r32.forEach(match => { playoffs[match.id] = match; });
            for (let i = 17; i <= 32; i++) {
              playoffs[i] = { id: i, teamA: null, teamB: null, scoreA: null, scoreB: null, winnerTeamId: null };
            }
            return { playoffMatches: playoffs };
          }

          // If the bracket has been locked (real teams synced from live data),
          // do NOT overwrite the team slots from group predictions — the real
          // qualified teams must be preserved across tab switches.
          if (state.isPlayoffBracketLocked) {
            return {};
          }

          const r32 = generateRoundOf32(
            state.groups,
            state.matches,
            state.isThirdPlaceAutoCalculated,
            state.thirdPlaceStandingsOverride
          );

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

      resetPlayoffs: (keepSync?: boolean) =>
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
          
          return { 
            playoffMatches: updatedPlayoffs, 
            isPlayoffBracketLocked: keepSync ? state.isPlayoffBracketLocked : false 
          };
        }),

      setPlayoffBracketLocked: (locked) => set({ isPlayoffBracketLocked: locked }),

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

      autoFillGroupStage: async (apiKey: string, fillEmptyOnly?: boolean) => {
        const { groups, matches, setMatchScore } = get();
        set({ isAutoFilling: true });

        try {
          const allMatchInputs = Object.values(matches).map(match => {
            const group = groups[match.groupId];
            const teamA = group.teams.find(t => t.id === match.teamAId);
            const teamB = group.teams.find(t => t.id === match.teamBId);
            return {
              matchId: match.id,
              teamAName: teamA?.name || match.teamAId,
              teamBName: teamB?.name || match.teamBId,
              context: `Group ${match.groupId} - Group Stage`,
              hasScore: match.scoreA !== null && match.scoreB !== null,
            };
          });

          const matchInputs = fillEmptyOnly
            ? allMatchInputs.filter(m => !m.hasScore)
            : allMatchInputs;

          if (matchInputs.length === 0) {
            if (!fillEmptyOnly) {
              alert('All matches already have scores. Nothing to fill.');
            }
            return;
          }

          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';
          
          // Use a large batch size to fit all group matches in one request and minimize API calls
          const batchSize = 72;
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

      autoFillPlayoffs: async (apiKey: string, fillEmptyOnly?: boolean) => {
        set({ isAutoFilling: true });

        try {
          const roundLabels: Record<string, string> = {};
          for (let i = 1; i <= 16; i++) roundLabels[i] = 'Round of 32';
          for (let i = 17; i <= 24; i++) roundLabels[i] = 'Round of 16';
          for (let i = 25; i <= 28; i++) roundLabels[i] = 'Quarter-Final';
          for (let i = 29; i <= 30; i++) roundLabels[i] = 'Semi-Final';
          roundLabels[31] = 'Third Place Play-off';
          roundLabels[32] = 'World Cup Final';

          // Grouped to minimize API requests (4 instead of 5):
          const rounds: number[][] = [
            Array.from({ length: 16 }, (_, i) => i + 1),      // R32: 16 matches (1 request)
            Array.from({ length: 8 }, (_, i) => i + 17),      // R16: 8 matches (1 request)
            Array.from({ length: 4 }, (_, i) => i + 25),      // QF: 4 matches (1 request)
            [29, 30, 31, 32],                                  // SF + 3rd/Final: 4 matches (1 request)
          ];

          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';
          let anyMatchPredicted = false;

          for (const roundMatchIds of rounds) {
            const currentPlayoffs = get().playoffMatches;
            const { setPlayoffMatchScore, setPlayoffWinner } = get();

            const matchInputs: Array<{ matchId: string; teamAName: string; teamBName: string; context: string }> = [];

            for (const matchId of roundMatchIds) {
              const match = currentPlayoffs[matchId];
              if (match?.teamA && match?.teamB) {
                if (fillEmptyOnly && match.winnerTeamId) {
                  continue;
                }
                matchInputs.push({
                  matchId: `P_${match.id}`,
                  teamAName: match.teamA.name,
                  teamBName: match.teamB.name,
                  context: `${roundLabels[match.id] || 'Knockout Stage'} - Playoff`,
                });
              }
            }

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

            for (const pred of predictions) {
              if (pred.matchId && pred.scoreA !== undefined && pred.scoreB !== undefined) {
                const playoffId = parseInt(pred.matchId.replace('P_', ''), 10);
                
                setPlayoffMatchScore(playoffId, pred.scoreA, pred.scoreB);

                if (pred.scoreA === pred.scoreB && pred.winnerTeamName) {
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
          }

          if (!anyMatchPredicted) {
            if (!fillEmptyOnly) {
              alert('No playoff matches with known teams to predict. Make sure the bracket has teams filled in.');
            }
          }
        } catch (error) {
          console.error('AI Auto-Fill (Playoffs) failed:', error);
          alert('AI Auto-Fill failed. Please check that the API is running and your Gemini API key is configured.');
        } finally {
          set({ isAutoFilling: false });
        }
      },

      // --- AI CHALLENGE (split by phase) ---

      generateAiGroupChallenge: async (apiKey: string) => {
        const { groups, matches } = get();
        set({ isAiGroupLoading: true });

        const collectedPredictions: Record<string, AiPrediction> = {};

        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';

          const groupMatchInputs = Object.values(matches).map(match => {
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

          // All 48 group matches in one request
          const batchSize = 72;
          for (let i = 0; i < groupMatchInputs.length; i += batchSize) {
            const batch = groupMatchInputs.slice(i, i + batchSize);

            const response = await fetch(`${baseUrl}/api/ai-predict`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Gemini-Api-Key': apiKey,
              },
              body: JSON.stringify({ matches: batch }),
            });

            if (!response.ok) throw new Error(`AI predict API returned status: ${response.status}`);

            const data = await response.json();
            for (const pred of (data.predictions || [])) {
              if (pred.matchId && pred.scoreA !== undefined && pred.scoreB !== undefined) {
                collectedPredictions[pred.matchId] = {
                  matchId: pred.matchId,
                  scoreA: pred.scoreA,
                  scoreB: pred.scoreB,
                  winnerTeamName: pred.winnerTeamName || null,
                };
              }
            }
          }

          // Snapshot user's current group predictions
          const currentMatches = get().matches;
          const lockedGroup: Record<string, { scoreA: number | null; scoreB: number | null }> = {};
          Object.values(currentMatches).forEach(m => {
            lockedGroup[m.id] = { scoreA: m.scoreA, scoreB: m.scoreB };
          });

          set({ aiGroupPredictions: collectedPredictions, lockedGroupUserPredictions: lockedGroup });

        } catch (error) {
          console.error('AI Group Challenge generation failed:', error);
          alert('AI Challenge (Groups) failed. Please check that the API is running and your Gemini API key is configured.');
        } finally {
          set({ isAiGroupLoading: false });
        }
      },

      generateAiPlayoffChallenge: async (apiKey: string, onlyMissing: boolean = false) => {
        const { liveMatches } = get();
        set({ isAiPlayoffLoading: true });

        try {
          // Build real-teams tree from live data
          const realTeamsTree = computeLivePlayoffTree(get().groups, get().matches, get().liveMatches);

          const roundLabels: Record<number, string> = {};
          for (let i = 1; i <= 16; i++) roundLabels[i] = 'Round of 32';
          for (let i = 17; i <= 24; i++) roundLabels[i] = 'Round of 16';
          for (let i = 25; i <= 28; i++) roundLabels[i] = 'Quarter-Final';
          for (let i = 29; i <= 30; i++) roundLabels[i] = 'Semi-Final';
          roundLabels[31] = 'Third Place Play-off';
          roundLabels[32] = 'World Cup Final';

          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5220';
          const collectedPredictions: Record<string, AiPrediction> = {};
          
          const matchInputs: Array<{ matchId: string; teamAName: string; teamBName: string; context: string }> = [];

          for (let matchId = 1; matchId <= 32; matchId++) {
            const match = realTeamsTree[matchId];
            if (!match?.teamA || !match?.teamB) continue;

            // Skip already-finished matches
            const liveResult = liveMatches[`P_${matchId}`];
            const isFinished = liveResult && ['FT', 'AET', 'PEN', 'FINISHED'].includes(liveResult.status);
            if (isFinished) continue;

            if (onlyMissing && get().aiPlayoffPredictions[`P_${matchId}`]) {
              continue;
            }

            matchInputs.push({
              matchId: `P_${matchId}`,
              teamAName: match.teamA.name,
              teamBName: match.teamB.name,
              context: `${roundLabels[matchId] || 'Knockout Stage'} - Playoff`,
            });
          }

          if (matchInputs.length === 0) {
            alert('No playoff matches with real teams available to predict right now. Wait for more group stage or previous round matches to finish.');
            return;
          }

          const response = await fetch(`${baseUrl}/api/ai-predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Gemini-Api-Key': apiKey,
            },
            body: JSON.stringify({ matches: matchInputs }),
          });

          if (!response.ok) throw new Error(`AI predict API returned status: ${response.status}`);

          const data = await response.json();
          for (const pred of (data.predictions || [])) {
            if (pred.matchId && pred.scoreA !== undefined && pred.scoreB !== undefined) {
              collectedPredictions[pred.matchId] = {
                matchId: pred.matchId,
                scoreA: pred.scoreA,
                scoreB: pred.scoreB,
                winnerTeamName: pred.winnerTeamName || null,
              };
            }
          }

          // Snapshot user's current playoff predictions
          const currentPlayoffs = get().playoffMatches;
          const lockedPlayoff: Record<string, { scoreA: number | null; scoreB: number | null }> = {};
          Object.values(currentPlayoffs).forEach(m => {
            lockedPlayoff[`P_${m.id}`] = { scoreA: m.scoreA, scoreB: m.scoreB };
          });

          // MERGE so regenerating one round preserves other rounds
          set(state => ({
            aiPlayoffPredictions: { ...state.aiPlayoffPredictions, ...collectedPredictions },
            lockedPlayoffUserPredictions: { ...state.lockedPlayoffUserPredictions, ...lockedPlayoff },
          }));

        } catch (error) {
          console.error('AI Playoff Challenge generation failed:', error);
          alert('AI Challenge (Playoffs) failed. Please check that the API is running and your Gemini API key is configured.');
        } finally {
          set({ isAiPlayoffLoading: false });
        }
      },

      clearAiGroupChallenge: () => set({ aiGroupPredictions: {}, lockedGroupUserPredictions: {} }),
      clearAiPlayoffChallenge: () => set({ aiPlayoffPredictions: {}, lockedPlayoffUserPredictions: {} }),
    }),
    {
      name: 'world-cup-2026-storage', 
      version: 1,
      partialize: (state) => ({
        groups: state.groups,
        matches: state.matches,
        isThirdPlaceAutoCalculated: state.isThirdPlaceAutoCalculated,
        thirdPlaceStandingsOverride: state.thirdPlaceStandingsOverride,
        playoffMatches: state.playoffMatches,
        isPlayoffBracketLocked: state.isPlayoffBracketLocked,
        aiGroupPredictions: state.aiGroupPredictions,
        aiPlayoffPredictions: state.aiPlayoffPredictions,
        lockedGroupUserPredictions: state.lockedGroupUserPredictions,
        lockedPlayoffUserPredictions: state.lockedPlayoffUserPredictions,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const { groups: newGroups, matches: newMatches } = initializeTournament();
          const oldMatches = persistedState.matches || {};
          
          Object.values(newMatches).forEach((newM: any) => {
            const oldM = Object.values(oldMatches).find((m: any) => 
              (m.teamAId === newM.teamAId && m.teamBId === newM.teamBId) ||
              (m.teamAId === newM.teamBId && m.teamBId === newM.teamAId)
            ) as any;
            
            if (oldM) {
              if (oldM.teamAId === newM.teamAId) {
                newM.scoreA = oldM.scoreA;
                newM.scoreB = oldM.scoreB;
              } else {
                newM.scoreA = oldM.scoreB;
                newM.scoreB = oldM.scoreA;
              }
            }
          });
          
          persistedState.matches = newMatches;
          
          const oldGroups = persistedState.groups || {};
          Object.keys(newGroups).forEach(groupId => {
             if (oldGroups[groupId]) {
                 newGroups[groupId].standingsOverride = oldGroups[groupId].standingsOverride;
                 newGroups[groupId].mode = oldGroups[groupId].mode;
             }
          });
          persistedState.groups = newGroups;
        }
        return persistedState;
      }
    }
  )
);
