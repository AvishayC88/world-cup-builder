import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TournamentState, PlayoffMatch, Match, Group } from './types';
import { generateRoundOf32 } from '../lib/playoffLogic';
import { recalculateTree } from '../lib/playoffProgression';

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set) => ({
      groups: {},
      matches: {},
      isThirdPlaceAutoCalculated: true,
      playoffMatches: {},

      setMatchScore: (matchId, scoreA, scoreB) =>
        set((state) => {
          const updatedMatches = { ...state.matches };
          updatedMatches[matchId] = { ...updatedMatches[matchId], scoreA, scoreB };
          return { matches: updatedMatches };
        }),

      toggleGroupMode: (groupId) =>
        set((state) => {
          const currentMode = state.groups[groupId].mode;
          const newMode = currentMode === 'SCORES' ? 'MANUAL' : 'SCORES';
          
          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...state.groups[groupId],
                mode: newMode,
              },
            },
            isThirdPlaceAutoCalculated: newMode === 'MANUAL' ? false : state.isThirdPlaceAutoCalculated,
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
            // התיקון: החזרת ה-IDs המקוריים במקום מערך ריק
            group.standingsOverride = group.teams.map(t => t.id);
          });

          return { matches: newMatches, groups: newGroups, isThirdPlaceAutoCalculated: true };
        }),

      syncPlayoffBracket: () =>
        set((state) => {
          const r32 = generateRoundOf32(state.groups, state.matches);
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
            match.winnerTeamId = null;
          } else {
            match.winnerTeamId = teamId;
            match.scoreA = null;
            match.scoreB = null;
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
    }),
    {
      name: 'world-cup-2026-storage', 
    }
  )
);