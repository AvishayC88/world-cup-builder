import type { Group, Match, Team, PlayoffMatch, LiveMatch } from '../store/types';
import { calculateGroupStandings } from './fifaRules';
import { recalculateTree } from './playoffProgression';
type ThirdPlaceCandidate = { team: Team, points: number, gd: number, gf: number, groupId: string };

/**
 * Backtracking algorithm to find a valid assignment of 3rd place teams
 * to their respective matches based on FIFA's explicit allowed groups.
 */
const solveThirdPlaceAllocation = (
  candidates: ThirdPlaceCandidate[],
  slots: { allowedThirds: string[] }[],
  currentAllocation: ThirdPlaceCandidate[] = []
): ThirdPlaceCandidate[] | null => {
  if (currentAllocation.length === slots.length) {
    return currentAllocation;
  }

  const currentSlotIndex = currentAllocation.length;
  const allowedGroups = slots[currentSlotIndex].allowedThirds;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    // Extract the group letter cleanly (e.g., "A" from "group_A" or just "A")
    const candidateLetter = candidate.groupId.split('_').pop() || candidate.groupId;

    // Only assign if FIFA specifically allows this 3rd place group in this match slot
    if (allowedGroups.includes(candidateLetter)) {
      const remainingCandidates = [...candidates];
      remainingCandidates.splice(i, 1);

      const result = solveThirdPlaceAllocation(
        remainingCandidates,
        slots,
        [...currentAllocation, candidate]
      );

      if (result) return result;
    }
  }

  return null;
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

  // 2. Sort 3rd places based on auto or manual mode
  if (isThirdPlaceAutoCalculated) {
    thirdPlaces.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  } else {
    thirdPlaces.sort((a, b) => {
      const idxA = thirdPlaceStandingsOverride.indexOf(a.team.id);
      const idxB = thirdPlaceStandingsOverride.indexOf(b.team.id);
      const validIdxA = idxA !== -1 ? idxA : 999;
      const validIdxB = idxB !== -1 ? idxB : 999;
      return validIdxA - validIdxB;
    });
  }

  const bestThirds = thirdPlaces.slice(0, 8);

  // 3. Define the Bracket Blueprint (Official FIFA 2026 Layout)
  // Ordered sequentially so a standard binary tree pairs them correctly for QF and SF
  const matchesTemplate = [
    // --- Left Side of the Bracket ---
    { a: firstPlaces[4], b: 'THIRD', allowedThirds: ['A', 'B', 'C', 'D', 'F'] },  // Match 1 (FIFA M74): 1E vs 3 A/B/C/D/F
    { a: firstPlaces[8], b: 'THIRD', allowedThirds: ['C', 'D', 'F', 'G', 'H'] },  // Match 2 (FIFA M77): 1I vs 3 C/D/F/G/H
    { a: secondPlaces[0], b: secondPlaces[1] },                                   // Match 3 (FIFA M73): 2A vs 2B
    { a: firstPlaces[5], b: secondPlaces[2] },                                    // Match 4 (FIFA M75): 1F vs 2C
    { a: secondPlaces[10], b: secondPlaces[11] },                                 // Match 5 (FIFA M83): 2K vs 2L
    { a: firstPlaces[7], b: secondPlaces[9] },                                    // Match 6 (FIFA M84): 1H vs 2J
    { a: firstPlaces[3], b: 'THIRD', allowedThirds: ['B', 'E', 'F', 'I', 'J'] },  // Match 7 (FIFA M81): 1D vs 3 B/E/F/I/J
    { a: firstPlaces[6], b: 'THIRD', allowedThirds: ['A', 'E', 'H', 'I', 'J'] },  // Match 8 (FIFA M82): 1G vs 3 A/E/H/I/J
    
    // --- Right Side of the Bracket ---
    { a: firstPlaces[2], b: secondPlaces[5] },                                    // Match 9 (FIFA M76): 1C vs 2F
    { a: secondPlaces[4], b: secondPlaces[8] },                                   // Match 10 (FIFA M78): 2E vs 2I
    { a: firstPlaces[0], b: 'THIRD', allowedThirds: ['C', 'E', 'F', 'H', 'I'] },  // Match 11 (FIFA M79): 1A vs 3 C/E/F/H/I
    { a: firstPlaces[11], b: 'THIRD', allowedThirds: ['E', 'H', 'I', 'J', 'K'] }, // Match 12 (FIFA M80): 1L vs 3 E/H/I/J/K
    { a: firstPlaces[1], b: 'THIRD', allowedThirds: ['E', 'F', 'G', 'I', 'J'] },  // Match 13 (FIFA M85): 1B vs 3 E/F/G/I/J
    { a: firstPlaces[10], b: 'THIRD', allowedThirds: ['D', 'E', 'I', 'J', 'L'] }, // Match 14 (FIFA M87): 1K vs 3 D/E/I/J/L
    { a: firstPlaces[9], b: secondPlaces[7] },                                    // Match 15 (FIFA M86): 1J vs 2H
    { a: secondPlaces[3], b: secondPlaces[6] },                                   // Match 16 (FIFA M88): 2D vs 2G
  ];

  // 4. Extract the slots requirements
  const thirdPlaceSlots = matchesTemplate
    .filter(m => m.b === 'THIRD')
    .map(m => ({
      allowedThirds: m.allowedThirds as string[]
    }));

  // 5. Run the Backtracking Solver
  let allocatedThirds = solveThirdPlaceAllocation([...bestThirds], thirdPlaceSlots);

  if (!allocatedThirds) {
    console.warn("Backtracking Solver failed to find a zero-conflict allocation. Falling back to greedy allocation.");
    allocatedThirds = [...bestThirds]; 
  }

  // 6. Map the final matches utilizing the solved allocation
  let thirdPlaceAllocationIndex = 0;
  const finalMatches: PlayoffMatch[] = matchesTemplate.map((matchDef, index) => {
    let teamB: Team | null = null;
    
    if (matchDef.b === 'THIRD') {
      teamB = allocatedThirds![thirdPlaceAllocationIndex].team;
      thirdPlaceAllocationIndex++;
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
  liveMatches: Record<string, LiveMatch>,
  isThirdPlaceAutoCalculated: boolean,
  thirdPlaceStandingsOverride: string[]
): Record<number, PlayoffMatch> => {
  const liveTree: Record<number, PlayoffMatch> = {};
  for (let i = 1; i <= 32; i++) {
    liveTree[i] = { id: i, teamA: null, teamB: null, scoreA: null, scoreB: null, winnerTeamId: null };
  }

  let allFinished = true;
  const liveGroupMatches: Record<string, Match> = {};
  
  for (const m of Object.values(matches)) {
    const lm = liveMatches[m.id];
    const isFinished = lm && ['FT', 'AET', 'PEN', 'FINISHED'].includes(lm.status);
    if (!isFinished) {
      allFinished = false;
    }
    liveGroupMatches[m.id] = { ...m, scoreA: isFinished ? lm.scoreA : null, scoreB: isFinished ? lm.scoreB : null };
  }

  // Only populate R32 real teams if the group stage is completely finished in live results
  if (allFinished) {
    // ARCHITECTURAL FIX: Ignore user's manual predictions when building the real live tree
    const forcedScoresGroups = Object.fromEntries(
      Object.entries(groups).map(([id, g]) => [id, { ...g, mode: 'SCORES' as const }])
    );
    
    const r32 = generateRoundOf32(forcedScoresGroups, liveGroupMatches, true, thirdPlaceStandingsOverride);
    r32.forEach(m => {
      liveTree[m.id].teamA = m.teamA;
      liveTree[m.id].teamB = m.teamB;
    });
  }

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