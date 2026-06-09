import type { Group, Match, Team } from '../store/types';

// ARCHITECTURAL DESIGN:
// We map the exact chronological matchup order for each specific group
// directly derived from the official API (wc_matches.json) to ensure
// 100% synchronization with the matchMetadata timestamps.
const groupMatchupPatterns: Record<string, number[][]> = {
  A: [[0, 1], [2, 3], [3, 1], [0, 2], [3, 0], [1, 2]],
  B: [[0, 3], [2, 1], [1, 3], [0, 2], [1, 0], [3, 2]],
  C: [[0, 1], [3, 2], [2, 1], [0, 3], [1, 3], [2, 0]],
  D: [[0, 2], [1, 3], [0, 1], [3, 2], [3, 0], [2, 1]],
  E: [[0, 3], [1, 2], [0, 1], [2, 3], [2, 0], [3, 1]],
  F: [[0, 1], [2, 3], [0, 2], [3, 1], [3, 0], [1, 2]],
  G: [[0, 2], [1, 3], [0, 1], [3, 2], [3, 0], [2, 1]],
  H: [[0, 3], [2, 1], [0, 2], [1, 3], [1, 0], [3, 2]],
  I: [[0, 1], [3, 2], [0, 3], [2, 1], [2, 0], [1, 3]],
  J: [[0, 2], [1, 3], [0, 1], [3, 2], [3, 0], [2, 1]],
  K: [[0, 3], [2, 1], [0, 2], [1, 3], [1, 0], [3, 2]],
  L: [[0, 1], [3, 2], [0, 3], [2, 1], [2, 0], [1, 3]],
};

export const initializeTournament = (): { groups: Record<string, Group>, matches: Record<string, Match> } => {
  // Official FIFA World Cup 2026 Group Draw with explicit Pot assignments
  const groupsData: Record<string, Team[]> = {
    A: [
      { id: 'MEX', name: 'Mexico', flagUrl: 'https://flagcdn.com/w80/mx.png', pot: 1 },
      { id: 'RSA', name: 'South Africa', flagUrl: 'https://flagcdn.com/w80/za.png', pot: 2 },
      { id: 'KOR', name: 'South Korea', flagUrl: 'https://flagcdn.com/w80/kr.png', pot: 3 },
      { id: 'CZE', name: 'Czechia', flagUrl: 'https://flagcdn.com/w80/cz.png', pot: 4 },
    ],
    B: [
      { id: 'CAN', name: 'Canada', flagUrl: 'https://flagcdn.com/w80/ca.png', pot: 1 },
      { id: 'SUI', name: 'Switzerland', flagUrl: 'https://flagcdn.com/w80/ch.png', pot: 2 },
      { id: 'QAT', name: 'Qatar', flagUrl: 'https://flagcdn.com/w80/qa.png', pot: 3 },
      { id: 'BIH', name: 'Bosnia', flagUrl: 'https://flagcdn.com/w80/ba.png', pot: 4 },
    ],
    C: [
      { id: 'BRA', name: 'Brazil', flagUrl: 'https://flagcdn.com/w80/br.png', pot: 1 },
      { id: 'MAR', name: 'Morocco', flagUrl: 'https://flagcdn.com/w80/ma.png', pot: 2 },
      { id: 'SCO', name: 'Scotland', flagUrl: 'https://flagcdn.com/w80/gb-sct.png', pot: 3 },
      { id: 'HAI', name: 'Haiti', flagUrl: 'https://flagcdn.com/w80/ht.png', pot: 4 },
    ],
    D: [
      { id: 'USA', name: 'USA', flagUrl: 'https://flagcdn.com/w80/us.png', pot: 1 },
      { id: 'AUS', name: 'Australia', flagUrl: 'https://flagcdn.com/w80/au.png', pot: 2 },
      { id: 'PAR', name: 'Paraguay', flagUrl: 'https://flagcdn.com/w80/py.png', pot: 3 },
      { id: 'TUR', name: 'Türkiye', flagUrl: 'https://flagcdn.com/w80/tr.png', pot: 4 },
    ],
    E: [
      { id: 'GER', name: 'Germany', flagUrl: 'https://flagcdn.com/w80/de.png', pot: 1 },
      { id: 'CIV', name: 'Ivory Coast', flagUrl: 'https://flagcdn.com/w80/ci.png', pot: 2 },
      { id: 'ECU', name: 'Ecuador', flagUrl: 'https://flagcdn.com/w80/ec.png', pot: 3 },
      { id: 'CUW', name: 'Curaçao', flagUrl: 'https://flagcdn.com/w80/cw.png', pot: 4 },
    ],
    F: [
      { id: 'NED', name: 'Netherlands', flagUrl: 'https://flagcdn.com/w80/nl.png', pot: 1 },
      { id: 'JPN', name: 'Japan', flagUrl: 'https://flagcdn.com/w80/jp.png', pot: 2 },
      { id: 'SWE', name: 'Sweden', flagUrl: 'https://flagcdn.com/w80/se.png', pot: 3 },
      { id: 'TUN', name: 'Tunisia', flagUrl: 'https://flagcdn.com/w80/tn.png', pot: 4 },
    ],
    G: [
      { id: 'BEL', name: 'Belgium', flagUrl: 'https://flagcdn.com/w80/be.png', pot: 1 },
      { id: 'IRN', name: 'Iran', flagUrl: 'https://flagcdn.com/w80/ir.png', pot: 2 },
      { id: 'EGY', name: 'Egypt', flagUrl: 'https://flagcdn.com/w80/eg.png', pot: 3 },
      { id: 'NZL', name: 'New Zealand', flagUrl: 'https://flagcdn.com/w80/nz.png', pot: 4 },
    ],
    H: [
      { id: 'ESP', name: 'Spain', flagUrl: 'https://flagcdn.com/w80/es.png', pot: 1 },
      { id: 'URU', name: 'Uruguay', flagUrl: 'https://flagcdn.com/w80/uy.png', pot: 2 },
      { id: 'KSA', name: 'Saudi Arabia', flagUrl: 'https://flagcdn.com/w80/sa.png', pot: 3 },
      { id: 'CPV', name: 'Cape Verde', flagUrl: 'https://flagcdn.com/w80/cv.png', pot: 4 },
    ],
    I: [
      { id: 'FRA', name: 'France', flagUrl: 'https://flagcdn.com/w80/fr.png', pot: 1 },
      { id: 'SEN', name: 'Senegal', flagUrl: 'https://flagcdn.com/w80/sn.png', pot: 2 },
      { id: 'NOR', name: 'Norway', flagUrl: 'https://flagcdn.com/w80/no.png', pot: 3 },
      { id: 'IRQ', name: 'Iraq', flagUrl: 'https://flagcdn.com/w80/iq.png', pot: 4 },
    ],
    J: [
      { id: 'ARG', name: 'Argentina', flagUrl: 'https://flagcdn.com/w80/ar.png', pot: 1 },
      { id: 'AUT', name: 'Austria', flagUrl: 'https://flagcdn.com/w80/at.png', pot: 2 },
      { id: 'ALG', name: 'Algeria', flagUrl: 'https://flagcdn.com/w80/dz.png', pot: 3 },
      { id: 'JOR', name: 'Jordan', flagUrl: 'https://flagcdn.com/w80/jo.png', pot: 4 },
    ],
    K: [
      { id: 'POR', name: 'Portugal', flagUrl: 'https://flagcdn.com/w80/pt.png', pot: 1 },
      { id: 'COL', name: 'Colombia', flagUrl: 'https://flagcdn.com/w80/co.png', pot: 2 },
      { id: 'UZB', name: 'Uzbekistan', flagUrl: 'https://flagcdn.com/w80/uz.png', pot: 3 },
      { id: 'COD', name: 'DR Congo', flagUrl: 'https://flagcdn.com/w80/cd.png', pot: 4 },
    ],
    L: [
      { id: 'ENG', name: 'England', flagUrl: 'https://flagcdn.com/w80/gb-eng.png', pot: 1 },
      { id: 'CRO', name: 'Croatia', flagUrl: 'https://flagcdn.com/w80/hr.png', pot: 2 },
      { id: 'PAN', name: 'Panama', flagUrl: 'https://flagcdn.com/w80/pa.png', pot: 3 },
      { id: 'GHA', name: 'Ghana', flagUrl: 'https://flagcdn.com/w80/gh.png', pot: 4 },
    ],
  };

  const groups: Record<string, Group> = {};
  const matches: Record<string, Match> = {};

  Object.entries(groupsData).forEach(([groupId, teams]) => {
    // 1. Initialize Group State
    groups[groupId] = {
      id: groupId,
      mode: 'SCORES',
      teams: teams,
      standingsOverride: teams.map(t => t.id),
    };

    // 2. Fetch the specific matchup pattern for this group based on reality
    const matchups = groupMatchupPatterns[groupId];

    // 3. Generate matches based on the exact API chronological order
    matchups.forEach((pair, index) => {
      const matchId = `G${groupId}_M${index + 1}`;
      matches[matchId] = {
        id: matchId,
        groupId: groupId,
        teamAId: teams[pair[0]].id,
        teamBId: teams[pair[1]].id,
        scoreA: null,
        scoreB: null,
      };
    });
  });

  return { groups, matches };
};