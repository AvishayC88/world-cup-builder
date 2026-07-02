import type { PlayoffMatch } from '../store/types';

// The Bracket Map: Defines where the winner of match X goes.
// e.g., Winner of 1 goes to Match 17, and becomes Team A there.
export const advancementMap: Record<number, { nextMatchId: number; slot: 'A' | 'B' }> = {
  // Round of 32 -> Round of 16
  1: { nextMatchId: 17, slot: 'A' }, 2: { nextMatchId: 17, slot: 'B' },
  3: { nextMatchId: 18, slot: 'A' }, 4: { nextMatchId: 18, slot: 'B' },
  5: { nextMatchId: 19, slot: 'A' }, 6: { nextMatchId: 19, slot: 'B' },
  7: { nextMatchId: 20, slot: 'A' }, 8: { nextMatchId: 20, slot: 'B' },
  9: { nextMatchId: 21, slot: 'A' }, 10: { nextMatchId: 21, slot: 'B' },
  11: { nextMatchId: 22, slot: 'A' }, 12: { nextMatchId: 22, slot: 'B' },
  13: { nextMatchId: 23, slot: 'A' }, 14: { nextMatchId: 23, slot: 'B' },
  15: { nextMatchId: 24, slot: 'A' }, 16: { nextMatchId: 24, slot: 'B' },

  // Round of 16 -> Quarter-Finals
  17: { nextMatchId: 25, slot: 'A' }, 18: { nextMatchId: 25, slot: 'B' },
  19: { nextMatchId: 26, slot: 'A' }, 20: { nextMatchId: 26, slot: 'B' },
  21: { nextMatchId: 27, slot: 'A' }, 22: { nextMatchId: 27, slot: 'B' },
  23: { nextMatchId: 28, slot: 'A' }, 24: { nextMatchId: 28, slot: 'B' },

  // Quarter-Finals -> Semi-Finals
  25: { nextMatchId: 29, slot: 'A' }, 26: { nextMatchId: 29, slot: 'B' },
  27: { nextMatchId: 30, slot: 'A' }, 28: { nextMatchId: 30, slot: 'B' },

  // Semi-Finals -> Final (Match 32) and Third Place (Match 31)
  // These are handled as special cases in the function below
};

// Main function to scan the entire tree and recalculate positions
export const recalculateTree = (playoffs: Record<number, PlayoffMatch>): Record<number, PlayoffMatch> => {
  const updatedPlayoffs = { ...playoffs };

  // Helper to safely clear future teams from subsequent rounds
  const clearFutureSlots = (matchId: number) => {
    const progression = advancementMap[matchId];
    if (progression) {
      const nextMatch = updatedPlayoffs[progression.nextMatchId];
      if (nextMatch) {
        if (progression.slot === 'A') nextMatch.teamA = null;
        else nextMatch.teamB = null;
        // Cascading clear: recursively clear if the cleared team was a winner before
        if (nextMatch.winnerTeamId) nextMatch.winnerTeamId = null;
        clearFutureSlots(progression.nextMatchId); 
      }
    }
  };

  // Iterate over all matches from 1 to 32 to ensure proper order
  for (let i = 1; i <= 32; i++) {
    const match = updatedPlayoffs[i];
    if (!match) continue;

    const winnerId = match.winnerTeamId;
      
    // Handle Semi-Finals (Matches 29 & 30) - Special handling for Final vs Third Place
    if (i === 29 || i === 30) {
      const slot = i === 29 ? 'A' : 'B';
      const finalMatch = updatedPlayoffs[32];
      const thirdPlaceMatch = updatedPlayoffs[31];

      // If we have a winner, they go to the Final
      if (winnerId && finalMatch) {

        const winningTeam = winnerId.toLowerCase() === match.teamA?.id.toLowerCase() ? match.teamA : match.teamB;
        if (winningTeam) {
          if (slot === 'A') finalMatch.teamA = winningTeam;
          else finalMatch.teamB = winningTeam;
        }
      } else if (finalMatch) {
        // Clear Final if winner is removed
        if (slot === 'A') finalMatch.teamA = null;
        else finalMatch.teamB = null;
        if (finalMatch.winnerTeamId) finalMatch.winnerTeamId = null;
      }

      // Identify the losing team for the 3rd place playoff
      const loserTeam = winnerId 
        ? (winnerId.toLowerCase() === match.teamA?.id.toLowerCase() ? match.teamB : match.teamA) // The one who did not win
        : null; // No clear loser yet

      if (loserTeam && thirdPlaceMatch) {
          if (slot === 'A') thirdPlaceMatch.teamA = loserTeam;
          else thirdPlaceMatch.teamB = loserTeam;
      } else if (thirdPlaceMatch) {
          // Clear Third Place if loser cannot be determined
          if (slot === 'A') thirdPlaceMatch.teamA = null;
          else thirdPlaceMatch.teamB = null;
          if (thirdPlaceMatch.winnerTeamId) thirdPlaceMatch.winnerTeamId = null;
      }

    } else {
      // Standard progression (R32 -> Semi)
      const progression = advancementMap[i];
      if (progression) {
        const nextMatch = updatedPlayoffs[progression.nextMatchId];
        
        if (winnerId) {
          const winningTeam = winnerId.toLowerCase() === match.teamA?.id.toLowerCase() ? match.teamA : match.teamB;
          if (winningTeam && nextMatch) {
            // Push the winner to the next slot
            if (progression.slot === 'A') nextMatch.teamA = winningTeam;
            else nextMatch.teamB = winningTeam;
          }
        } else {
          // No winner yet - must clear the next slot
          if (nextMatch) {
            if (progression.slot === 'A') nextMatch.teamA = null;
            else nextMatch.teamB = null;
          }
        }
      }
    }
  }

  return updatedPlayoffs;
};