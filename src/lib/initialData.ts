import type { Group, Match, Team } from '../store/types';

export const initializeTournament = (): { groups: Record<string, Group>, matches: Record<string, Match> } => {
  // Official FIFA World Cup 2026 Group Draw
  const groupsData: Record<string, Team[]> = {
    A: [
      { id: 'MEX', name: 'Mexico', flagUrl: 'https://flagcdn.com/w80/mx.png' },
      { id: 'RSA', name: 'South Africa', flagUrl: 'https://flagcdn.com/w80/za.png' },
      { id: 'KOR', name: 'South Korea', flagUrl: 'https://flagcdn.com/w80/kr.png' },
      { id: 'CZE', name: 'Czechia', flagUrl: 'https://flagcdn.com/w80/cz.png' },
    ],
    B: [
      { id: 'CAN', name: 'Canada', flagUrl: 'https://flagcdn.com/w80/ca.png' },
      { id: 'SUI', name: 'Switzerland', flagUrl: 'https://flagcdn.com/w80/ch.png' },
      { id: 'QAT', name: 'Qatar', flagUrl: 'https://flagcdn.com/w80/qa.png' },
      { id: 'BIH', name: 'Bosnia', flagUrl: 'https://flagcdn.com/w80/ba.png' },
    ],
    C: [
      { id: 'BRA', name: 'Brazil', flagUrl: 'https://flagcdn.com/w80/br.png' },
      { id: 'MAR', name: 'Morocco', flagUrl: 'https://flagcdn.com/w80/ma.png' },
      { id: 'SCO', name: 'Scotland', flagUrl: 'https://flagcdn.com/w80/gb-sct.png' },
      { id: 'HAI', name: 'Haiti', flagUrl: 'https://flagcdn.com/w80/ht.png' },
    ],
    D: [
      { id: 'USA', name: 'USA', flagUrl: 'https://flagcdn.com/w80/us.png' },
      { id: 'AUS', name: 'Australia', flagUrl: 'https://flagcdn.com/w80/au.png' },
      { id: 'PAR', name: 'Paraguay', flagUrl: 'https://flagcdn.com/w80/py.png' },
      { id: 'TUR', name: 'Türkiye', flagUrl: 'https://flagcdn.com/w80/tr.png' },
    ],
    E: [
      { id: 'GER', name: 'Germany', flagUrl: 'https://flagcdn.com/w80/de.png' },
      { id: 'CIV', name: 'Ivory Coast', flagUrl: 'https://flagcdn.com/w80/ci.png' },
      { id: 'ECU', name: 'Ecuador', flagUrl: 'https://flagcdn.com/w80/ec.png' },
      { id: 'CUW', name: 'Curaçao', flagUrl: 'https://flagcdn.com/w80/cw.png' },
    ],
    F: [
      { id: 'NED', name: 'Netherlands', flagUrl: 'https://flagcdn.com/w80/nl.png' },
      { id: 'JPN', name: 'Japan', flagUrl: 'https://flagcdn.com/w80/jp.png' },
      { id: 'SWE', name: 'Sweden', flagUrl: 'https://flagcdn.com/w80/se.png' },
      { id: 'TUN', name: 'Tunisia', flagUrl: 'https://flagcdn.com/w80/tn.png' },
    ],
    G: [
      { id: 'BEL', name: 'Belgium', flagUrl: 'https://flagcdn.com/w80/be.png' },
      { id: 'IRN', name: 'Iran', flagUrl: 'https://flagcdn.com/w80/ir.png' },
      { id: 'EGY', name: 'Egypt', flagUrl: 'https://flagcdn.com/w80/eg.png' },
      { id: 'NZL', name: 'New Zealand', flagUrl: 'https://flagcdn.com/w80/nz.png' },
    ],
    H: [
      { id: 'ESP', name: 'Spain', flagUrl: 'https://flagcdn.com/w80/es.png' },
      { id: 'URU', name: 'Uruguay', flagUrl: 'https://flagcdn.com/w80/uy.png' },
      { id: 'KSA', name: 'Saudi Arabia', flagUrl: 'https://flagcdn.com/w80/sa.png' },
      { id: 'CPV', name: 'Cape Verde', flagUrl: 'https://flagcdn.com/w80/cv.png' },
    ],
    I: [
      { id: 'FRA', name: 'France', flagUrl: 'https://flagcdn.com/w80/fr.png' },
      { id: 'SEN', name: 'Senegal', flagUrl: 'https://flagcdn.com/w80/sn.png' },
      { id: 'NOR', name: 'Norway', flagUrl: 'https://flagcdn.com/w80/no.png' },
      { id: 'IRQ', name: 'Iraq', flagUrl: 'https://flagcdn.com/w80/iq.png' },
    ],
    J: [
      { id: 'ARG', name: 'Argentina', flagUrl: 'https://flagcdn.com/w80/ar.png' },
      { id: 'AUT', name: 'Austria', flagUrl: 'https://flagcdn.com/w80/at.png' },
      { id: 'ALG', name: 'Algeria', flagUrl: 'https://flagcdn.com/w80/dz.png' },
      { id: 'JOR', name: 'Jordan', flagUrl: 'https://flagcdn.com/w80/jo.png' },
    ],
    K: [
      { id: 'POR', name: 'Portugal', flagUrl: 'https://flagcdn.com/w80/pt.png' },
      { id: 'COL', name: 'Colombia', flagUrl: 'https://flagcdn.com/w80/co.png' },
      { id: 'UZB', name: 'Uzbekistan', flagUrl: 'https://flagcdn.com/w80/uz.png' },
      { id: 'COD', name: 'DR Congo', flagUrl: 'https://flagcdn.com/w80/cd.png' },
    ],
    L: [
      { id: 'ENG', name: 'England', flagUrl: 'https://flagcdn.com/w80/gb-eng.png' },
      { id: 'CRO', name: 'Croatia', flagUrl: 'https://flagcdn.com/w80/hr.png' },
      { id: 'PAN', name: 'Panama', flagUrl: 'https://flagcdn.com/w80/pa.png' },
      { id: 'GHA', name: 'Ghana', flagUrl: 'https://flagcdn.com/w80/gh.png' },
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

    // 2. Generate Round-Robin Matches (6 matches per group)
    // Indices matchup: 1v2, 3v4, 1v3, 2v4, 1v4, 2v3
    const matchups = [
      [0, 1], [2, 3],
      [0, 2], [1, 3],
      [0, 3], [1, 2]
    ];

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