import type { Group, Match, Team, PlayoffMatch } from '../store/types';
import { calculateGroupStandings } from './fifaRules';

export const generateRoundOf32 = (groups: Record<string, Group>, matches: Record<string, Match>): PlayoffMatch[] => {
  const firstPlaces: Team[] = [];
  const secondPlaces: Team[] = [];
  const thirdPlaces: { team: Team, points: number, gd: number, gf: number, groupId: string }[] = [];

  // 1. Extract standings from all 12 groups
  Object.values(groups).forEach(group => {
    const groupMatches = Object.values(matches).filter(m => m.groupId === group.id);
    let standings = calculateGroupStandings(group.teams, groupMatches);
    
    // Apply manual override if group is in MANUAL mode
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

  // 2. Sort 3rd places strictly by FIFA rules: Points > Goal Difference > Goals For
  thirdPlaces.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  // Extract the top 8
  const bestThirds = thirdPlaces.slice(0, 8);

  // 3. Define the Bracket Blueprint for 16 matches (Round of 32)
  const matchesTemplate = [
    { a: firstPlaces[0], b: 'THIRD' }, // Match 1: 1A vs 3rd
    { a: secondPlaces[1], b: secondPlaces[5] }, // Match 2: 2B vs 2F
    { a: firstPlaces[2], b: 'THIRD' }, // Match 3: 1C vs 3rd
    { a: secondPlaces[3], b: secondPlaces[7] }, // Match 4: 2D vs 2H
    { a: firstPlaces[4], b: 'THIRD' }, // Match 5: 1E vs 3rd
    { a: secondPlaces[6], b: secondPlaces[9] }, // Match 6: 2G vs 2J
    { a: firstPlaces[8], b: 'THIRD' }, // Match 7: 1I vs 3rd
    { a: secondPlaces[10], b: secondPlaces[11] }, // Match 8: 2K vs 2L
    // Right side of the bracket
    { a: firstPlaces[1], b: 'THIRD' }, // Match 9: 1B vs 3rd
    { a: secondPlaces[0], b: secondPlaces[4] }, // Match 10: 2A vs 2E
    { a: firstPlaces[3], b: 'THIRD' }, // Match 11: 1D vs 3rd
    { a: secondPlaces[2], b: secondPlaces[8] }, // Match 12: 2C vs 2I
    { a: firstPlaces[5], b: 'THIRD' }, // Match 13: 1F vs 3rd
    { a: firstPlaces[10], b: secondPlaces[6] }, // Match 14: 1K vs 2G
    { a: firstPlaces[7], b: 'THIRD' }, // Match 15: 1H vs 3rd
    { a: firstPlaces[9], b: firstPlaces[11] }, // Match 16: 1J vs 1L
  ];

  // 4. Seed the 3rd place teams dynamically to avoid same-group matchups
  const availableThirds = [...bestThirds];
  
  const finalMatches: PlayoffMatch[] = matchesTemplate.map((matchDef, index) => {
    let teamB: Team | null = null;
    
    if (matchDef.b === 'THIRD') {
      const winnerTeam = matchDef.a as Team;
      const winnerGroupId = winnerTeam.id.split('_')[1]; 
      
      const validThirdIndex = availableThirds.findIndex(t => t.groupId !== winnerGroupId);
      
      if (validThirdIndex !== -1) {
        teamB = availableThirds[validThirdIndex].team;
        availableThirds.splice(validThirdIndex, 1);
      } else {
        teamB = availableThirds.shift()!.team; 
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