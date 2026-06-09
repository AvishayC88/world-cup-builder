import React, { useMemo } from 'react';
import type { Team, Match } from '../../store/types';
import { calculateGroupStandings } from '../../lib/fifaRules';

interface StandingsTableProps {
  teams: Team[];
  matches: Match[];
  mode: 'SCORES' | 'MANUAL';
  standingsOverride: string[]; 
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ 
  teams, 
  matches, 
  mode,
  standingsOverride
}) => {
  const calculatedStandings = useMemo(
    () => calculateGroupStandings(teams, matches),
    [teams, matches]
  );

  const displayStandings = useMemo(() => {
    if (mode === 'SCORES') {
      return calculatedStandings;
    }
    
    return [...calculatedStandings].sort((a, b) => {
      const indexA = standingsOverride.indexOf(a.teamId);
      const indexB = standingsOverride.indexOf(b.teamId);
      return indexA - indexB;
    });
  }, [calculatedStandings, mode, standingsOverride]);

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs uppercase bg-gray-100 text-gray-600">
          <tr>
            <th className="px-2 py-1 text-center w-8">#</th>
            <th className="px-2 py-1">Team</th>
            <th className="px-2 py-1 text-center" title="Played">P</th>
            <th className="px-2 py-1 text-center" title="Goal Difference">GD</th>
            <th className="px-2 py-1 text-center font-bold" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {displayStandings.map((stat, index) => {
            const team = teams.find(t => t.id === stat.teamId);
            const isTopTwo = index < 2;

            return (
              <tr 
                key={stat.teamId} 
                className={`border-b last:border-b-0 ${isTopTwo ? 'bg-green-50' : 'bg-white'}`}
              >
                <td className="px-2 py-2 text-center font-semibold text-gray-900">
                  {index + 1}
                </td>
                
                {/* Team Name with Flag */}
                <td className="px-2 py-2">
                  <div className="flex items-center">
                    {team && (
                      <img 
                        src={team.flagUrl} 
                        alt={team.name} 
                        className="w-5 h-3.5 object-cover rounded-sm border border-gray-300 mr-2 shrink-0"
                      />
                    )}
                    <span className="font-medium">{team?.name || 'Unknown'}</span>
                  </div>
                </td>
                
                <td className="px-2 py-2 text-center text-gray-500">
                  {stat.matchesPlayed}
                </td>
                <td className="px-2 py-2 text-center text-gray-500">
                  {stat.goalDifference > 0 ? `+${stat.goalDifference}` : stat.goalDifference}
                </td>
                <td className="px-2 py-2 text-center font-bold text-gray-900">
                  {stat.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};