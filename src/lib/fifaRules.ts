import type { Team, Match } from '../store/types';

export interface TeamStats {
  teamId: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  matchesPlayed: number;
}

// Helper: Calculate stats for a specific set of teams and matches
const calculateStats = (teamIds: string[], matches: Match[]): Map<string, TeamStats> => {
  const stats = new Map<string, TeamStats>();
  
  // Initialize empty stats for all provided teams
  teamIds.forEach(id => {
    stats.set(id, { 
      teamId: id, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, matchesPlayed: 0 
    });
  });

  matches.forEach(match => {
    if (match.scoreA !== null && match.scoreB !== null) {
      const statA = stats.get(match.teamAId);
      const statB = stats.get(match.teamBId);

      if (statA && statB) {
        statA.matchesPlayed++;
        statB.matchesPlayed++;
        statA.goalsFor += match.scoreA;
        statA.goalsAgainst += match.scoreB;
        statB.goalsFor += match.scoreB;
        statB.goalsAgainst += match.scoreA;
        
        statA.goalDifference = statA.goalsFor - statA.goalsAgainst;
        statB.goalDifference = statB.goalsFor - statB.goalsAgainst;

        if (match.scoreA > match.scoreB) {
          statA.points += 3;
        } else if (match.scoreA < match.scoreB) {
          statB.points += 3;
        } else {
          statA.points += 1;
          statB.points += 1;
        }
      }
    }
  });

  return stats;
};

// Helper: Sort stats based on Points -> Goal Difference -> Goals For
const applyBasicTieBreakers = (statsArray: TeamStats[]): TeamStats[] => {
  return statsArray.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return 0; // Needs Head-to-Head
  });
};

// Core exported function
export const calculateGroupStandings = (teams: Team[], matches: Match[]): TeamStats[] => {
  const teamIds = teams.map(t => t.id);
  
  // 1. Calculate overall stats
  const overallStatsMap = calculateStats(teamIds, matches);
  const overallStats = Array.from(overallStatsMap.values());
  
  // 2. Initial sort using basic rules
  const sortedStats = applyBasicTieBreakers(overallStats);

  // 3. Cluster teams that are tied on all basic rules
  const clusters: Map<string, TeamStats[]> = new Map();
  sortedStats.forEach(stat => {
    const key = `${stat.points}_${stat.goalDifference}_${stat.goalsFor}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(stat);
  });

  const finalStandings: TeamStats[] = [];

  // 4. Resolve clusters using Head-to-Head mini-leagues
  for (const cluster of clusters.values()) {
    if (cluster.length === 1) {
      finalStandings.push(cluster[0]); // No tie
    } else {
      // Tie exists: extract mini-league matches
      const tiedTeamIds = cluster.map(s => s.teamId);
      const miniLeagueMatches = matches.filter(m =>
        tiedTeamIds.includes(m.teamAId) && tiedTeamIds.includes(m.teamBId)
      );

      // Calculate and sort using only mini-league stats
      const h2hStatsMap = calculateStats(tiedTeamIds, miniLeagueMatches);
      const h2hStats = Array.from(h2hStatsMap.values());
      const sortedH2hStats = applyBasicTieBreakers(h2hStats);

      // Map back to overall stats to preserve total goals/points for display
      sortedH2hStats.forEach(h2hStat => {
        const originalStat = cluster.find(s => s.teamId === h2hStat.teamId)!;
        finalStandings.push(originalStat);
      });
    }
  }

  return finalStandings;
};