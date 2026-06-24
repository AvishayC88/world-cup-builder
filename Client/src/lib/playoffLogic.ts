import type { Group, Match, Team, PlayoffMatch, LiveMatch } from '../store/types';
import { calculateGroupStandings } from './fifaRules';
import { recalculateTree } from './playoffProgression';
import { ANNEX_C_TABLE } from './annexC';
type ThirdPlaceCandidate = { team: Team, points: number, gd: number, gf: number, groupId: string };

const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'FINISHED'];

/**
 * Returns true if all 3 group-stage matches for a given groupId are fully finished
 * in the live data (i.e. the standings are definitive and locked in).
 */
export const isGroupFullyComplete = (
  groupId: string,
  matches: Record<string, Match>,
  liveMatches: Record<string, LiveMatch>
): boolean => {
  const groupMatches = Object.values(matches).filter(m => m.groupId === groupId);
  if (groupMatches.length < 3) return false; // Sanity: a group must have at least 3 matches
  return groupMatches.every(m => {
    const lm = liveMatches[m.id];
    return lm && FINISHED_STATUSES.includes(lm.status);
  });
};

/**
 * Returns a Set of group IDs whose group-stage standings are now final
 * (every match in that group has been played to completion).
 */
export const computeGroupCompletionMap = (
  matches: Record<string, Match>,
  liveMatches: Record<string, LiveMatch>
): Set<string> => {
  const completed = new Set<string>();
  const groupIds = [...new Set(Object.values(matches).map(m => m.groupId))];
  groupIds.forEach(gid => {
    if (isGroupFullyComplete(gid, matches, liveMatches)) completed.add(gid);
  });
  return completed;
};
export const generateRoundOf32 = (
  groups: Record<string, Group>,
  matches: Record<string, Match>,
  isThirdPlaceAutoCalculated: boolean,
  thirdPlaceStandingsOverride: string[]
): PlayoffMatch[] => {
  const firstPlaces: Team[] = [];
  const secondPlaces: Team[] = [];
  const thirdPlaces: ThirdPlaceCandidate[] = [];

  // 1. Extract standings from all 12 groups
  Object.values(groups).forEach(group => {
    const groupMatches = Object.values(matches).filter(m => m.groupId === group.id);
    let standings = calculateGroupStandings(group.teams, groupMatches);

    if (group.mode === 'MANUAL') {
      standings = group.standingsOverride.map(teamId => standings.find(s => s.teamId === teamId)!);
    }

    firstPlaces.push(group.teams.find(t => t.id === standings[0].teamId)!);
    secondPlaces.push(group.teams.find(t => t.id === standings[1].teamId)!);

    const thirdTeam = group.teams.find(t => t.id === standings[2].teamId)!;
    thirdPlaces.push({
      team: thirdTeam,
      points: standings[2].points,
      gd: standings[2].goalDifference,
      gf: standings[2].goalsFor,
      groupId: group.id
    });
  });

  // 2. Sort 3rd places by performance to determine which 8 qualify
  //    (Points → Goal Difference → Goals For), then extract the best 8.
  const performanceSorted = [...thirdPlaces].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  let bestThirds: ThirdPlaceCandidate[];

  if (isThirdPlaceAutoCalculated) {
    // Pick the top 8 by performance, then sort them by GROUP LETTER (A→L).
    // FIFA Annex C assigns slots by group letter order, NOT by points —
    // so Group C always goes to M74 before Group F goes to M77, even if
    // Sweden (3F) has more points than Scotland (3C).
    bestThirds = performanceSorted
      .slice(0, 8)
      .sort((a, b) => {
        const letterA = a.groupId.split('_').pop() || a.groupId;
        const letterB = b.groupId.split('_').pop() || b.groupId;
        return letterA.localeCompare(letterB);
      });
  } else {
    // Manual mode: honour the user's explicit ranking order.
    const manualSorted = [...thirdPlaces].sort((a, b) => {
      const idxA = thirdPlaceStandingsOverride.indexOf(a.team.id);
      const idxB = thirdPlaceStandingsOverride.indexOf(b.team.id);
      const validIdxA = idxA !== -1 ? idxA : 999;
      const validIdxB = idxB !== -1 ? idxB : 999;
      return validIdxA - validIdxB;
    });
    // Top 8 by manual order, then also sort by group letter for Annex C compliance.
    bestThirds = manualSorted
      .slice(0, 8)
      .sort((a, b) => {
        const letterA = a.groupId.split('_').pop() || a.groupId;
        const letterB = b.groupId.split('_').pop() || b.groupId;
        return letterA.localeCompare(letterB);
      });
  }

  // 3. Define the Bracket Blueprint (Official FIFA 2026 Layout)
  // Ordered sequentially so a standard binary tree pairs them correctly for QF and SF
  const matchesTemplate = [
    // --- Left Side of the Bracket ---
    { a: firstPlaces[4], b: 'THIRD', slotId: '1E' },  // Match 1 (FIFA M74): 1E vs 3 A/B/C/D/F
    { a: firstPlaces[8], b: 'THIRD', slotId: '1I' },  // Match 2 (FIFA M77): 1I vs 3 C/D/F/G/H
    { a: secondPlaces[0], b: secondPlaces[1] },                                   // Match 3 (FIFA M73): 2A vs 2B
    { a: firstPlaces[5], b: secondPlaces[2] },                                    // Match 4 (FIFA M75): 1F vs 2C
    { a: secondPlaces[10], b: secondPlaces[11] },                                 // Match 5 (FIFA M83): 2K vs 2L
    { a: firstPlaces[7], b: secondPlaces[9] },                                    // Match 6 (FIFA M84): 1H vs 2J
    { a: firstPlaces[3], b: 'THIRD', slotId: '1D' },  // Match 7 (FIFA M81): 1D vs 3 B/E/F/I/J
    { a: firstPlaces[6], b: 'THIRD', slotId: '1G' },  // Match 8 (FIFA M82): 1G vs 3 A/E/H/I/J

    // --- Right Side of the Bracket ---
    { a: firstPlaces[2], b: secondPlaces[5] },                                    // Match 9 (FIFA M76): 1C vs 2F
    { a: secondPlaces[4], b: secondPlaces[8] },                                   // Match 10 (FIFA M78): 2E vs 2I
    { a: firstPlaces[0], b: 'THIRD', slotId: '1A' },  // Match 11 (FIFA M79): 1A vs 3 C/E/F/H/I
    { a: firstPlaces[11], b: 'THIRD', slotId: '1L' }, // Match 12 (FIFA M80): 1L vs 3 E/H/I/J/K
    { a: firstPlaces[9], b: secondPlaces[7] },                                    // Match 15 (FIFA M86): 1J vs 2H
    { a: secondPlaces[3], b: secondPlaces[6] },                                   // Match 16 (FIFA M88): 2D vs 2G
    { a: firstPlaces[1], b: 'THIRD', slotId: '1B' },  // Match 13 (FIFA M85): 1B vs 3 E/F/G/I/J
    { a: firstPlaces[10], b: 'THIRD', slotId: '1K' }, // Match 14 (FIFA M87): 1K vs 3 D/E/I/J/L
  ];

  // 4. Lookup the Annex C assignments
  const combinationKey = bestThirds
    .map(t => t.groupId.split('_').pop() || t.groupId)
    .sort()
    .join('');
    
  const annexCAssignment = ANNEX_C_TABLE[combinationKey];

  if (!annexCAssignment) {
    console.warn("Could not find Annex C assignment for combination:", combinationKey);
  }

  // 6. Map the final matches utilizing the solved allocation
  const finalMatches: PlayoffMatch[] = matchesTemplate.map((matchDef, index) => {
    let teamB: Team | null = null;

    if (matchDef.b === 'THIRD') {
      if (annexCAssignment && matchDef.slotId) {
        const assignedGroupLetter = annexCAssignment[matchDef.slotId];
        const assignedTeam = bestThirds.find(t => (t.groupId.split('_').pop() || t.groupId) === assignedGroupLetter);
        if (assignedTeam) {
          teamB = assignedTeam.team;
        }
      }
      
      // Fallback to greedy if something went wrong
      if (!teamB) {
        teamB = bestThirds[0]?.team || null; // Simplified fallback just to avoid crash
      }
    } else {
      teamB = matchDef.b as Team;
    }

    return {
      id: index + 1,
      teamA: matchDef.a as Team,
      teamB: teamB,
      scoreA: null,
      scoreB: null,
      winnerTeamId: null,
    };
  });

  return finalMatches;
};

export const computeLivePlayoffTree = (
  groups: Record<string, Group>,
  matches: Record<string, Match>,
  liveMatches: Record<string, LiveMatch>
): Record<number, PlayoffMatch> => {
  const liveTree: Record<number, PlayoffMatch> = {};
  for (let i = 1; i <= 32; i++) {
    liveTree[i] = { id: i, teamA: null, teamB: null, scoreA: null, scoreB: null, winnerTeamId: null };
  }

  const liveGroupMatches: Record<string, Match> = {};

  for (const m of Object.values(matches)) {
    const lm = liveMatches[m.id];
    const isFinished = lm && ['FT', 'AET', 'PEN', 'FINISHED'].includes(lm.status);
    // Finished matches use live scores; unplayed/in-progress matches contribute null scores
    // (calculateGroupStandings ignores null-score matches, so they simply won't count yet)
    liveGroupMatches[m.id] = { ...m, scoreA: isFinished ? lm.scoreA : null, scoreB: isFinished ? lm.scoreB : null };
  }

  // Always populate R32 teams from the current live group standings.
  // As group stage matches finish, the bracket updates to reflect who is currently
  // leading each group — teams not yet played stay at 0pts and rank by default order.
  // ARCHITECTURAL FIX: Ignore user's manual predictions when building the real live tree
  const forcedScoresGroups = Object.fromEntries(
    Object.entries(groups).map(([id, g]) => [id, { ...g, mode: 'SCORES' as const }])
  );

  const r32 = generateRoundOf32(forcedScoresGroups, liveGroupMatches, true, []);
  r32.forEach(m => {
    liveTree[m.id].teamA = m.teamA;
    liveTree[m.id].teamB = m.teamB;
  });

  Object.keys(liveMatches).forEach((key) => {
    if (key.startsWith('P_')) {
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
    }
  });

  return recalculateTree(liveTree);
};