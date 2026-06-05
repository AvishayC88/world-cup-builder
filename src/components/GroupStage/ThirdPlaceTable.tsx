import React, { useMemo, useState, useEffect } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateGroupStandings } from '../../lib/fifaRules';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTeamItem } from './SortableTeamItem';

export const ThirdPlaceTable: React.FC = () => {
  const { 
    groups, 
    matches, 
    isThirdPlaceAutoCalculated, 
    thirdPlaceStandingsOverride, 
    setThirdPlaceStandingsOverride 
  } = useTournamentStore();

  const [activeId, setActiveId] = useState<string | null>(null);

  // Calculate the 3rd place team for each group
  const thirdPlaceTeams = useMemo(() => {
    return Object.values(groups).map(group => {
      const groupMatches = Object.values(matches).filter(m => m.groupId === group.id);
      
      let thirdTeamId: string;
      let stats = { points: 0, goalDifference: 0, matchesPlayed: 0 };

      if (group.mode === 'SCORES') {
        const standings = calculateGroupStandings(group.teams, groupMatches);
        thirdTeamId = standings[2]?.teamId;
        const foundStats = standings.find(s => s.teamId === thirdTeamId);
        if (foundStats) stats = foundStats;
      } else {
        thirdTeamId = group.standingsOverride[2];
      }

      const team = group.teams.find(t => t.id === thirdTeamId);
      // TS Fix: Using group.id instead of group.name
      return { team, stats, groupName: `Group ${group.id}` };
    }).filter(x => x.team) as { team: any, stats: any, groupName: string }[];
  }, [groups, matches]);

  // Sort teams based on mode
  const displayTeams = useMemo(() => {
    let sorted = [...thirdPlaceTeams];
    
    if (isThirdPlaceAutoCalculated) {
      sorted.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return b.stats.goalDifference - a.stats.goalDifference;
      });
    } else {
      sorted.sort((a, b) => {
        const idxA = thirdPlaceStandingsOverride.indexOf(a.team.id);
        const idxB = thirdPlaceStandingsOverride.indexOf(b.team.id);
        const validIdxA = idxA !== -1 ? idxA : 999;
        const validIdxB = idxB !== -1 ? idxB : 999;
        return validIdxA - validIdxB;
      });
    }
    return sorted;
  }, [thirdPlaceTeams, isThirdPlaceAutoCalculated, thirdPlaceStandingsOverride]);

  // Initialize override array if needed
  useEffect(() => {
    if (!isThirdPlaceAutoCalculated && thirdPlaceStandingsOverride.length !== thirdPlaceTeams.length) {
      const currentIds = displayTeams.map(t => t.team.id);
      setThirdPlaceStandingsOverride(currentIds);
    }
  }, [isThirdPlaceAutoCalculated, displayTeams, thirdPlaceStandingsOverride, thirdPlaceTeams.length, setThirdPlaceStandingsOverride]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = thirdPlaceStandingsOverride.indexOf(active.id as string);
      const newIndex = thirdPlaceStandingsOverride.indexOf(over.id as string);
      setThirdPlaceStandingsOverride(arrayMove(thirdPlaceStandingsOverride, oldIndex, newIndex));
    }
  };

  const activeTeam = activeId ? displayTeams.find(t => t.team.id === activeId)?.team : null;

  return (
    <div className="w-full mt-8 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-blue-900 text-white p-3 px-6 flex justify-between items-center">
        <h2 className="font-bold text-lg">Third-Place Ranking</h2>
        <span className="text-xs bg-white/20 px-2 py-1 rounded font-semibold uppercase tracking-wider">
          {isThirdPlaceAutoCalculated ? 'Auto (Scores)' : 'Manual Override'}
        </span>
      </div>

      <div className="p-4 md:p-6">
        <p className="text-sm text-gray-500 mb-4">
          {isThirdPlaceAutoCalculated 
            ? "Top 8 third-place teams advance to the Round of 32 based on points and goal difference."
            : "Drag and drop to rank the third-place teams manually. The top 8 will advance."}
        </p>

        {isThirdPlaceAutoCalculated ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="px-4 py-2 w-10 text-center">#</th>
                  <th className="px-4 py-2">Team</th>
                  <th className="px-4 py-2 text-center">Group</th>
                  <th className="px-4 py-2 text-center">Pts</th>
                  <th className="px-4 py-2 text-center">GD</th>
                </tr>
              </thead>
              <tbody>
                {displayTeams.map((item, index) => {
                  const isAdvancing = index < 8;
                  return (
                    <tr key={item.team.id} className={`border-b last:border-0 ${isAdvancing ? 'bg-green-50' : 'bg-red-50/30 text-gray-500'}`}>
                      <td className="px-4 py-2 text-center font-bold">{index + 1}</td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <img src={item.team.flagUrl} alt={item.team.name} className={`w-5 h-3.5 object-cover border border-gray-300 rounded-[2px] ${!isAdvancing && 'opacity-50'}`} />
                        <span className="font-medium">{item.team.name}</span>
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-bold text-gray-500">{item.groupName}</td>
                      <td className="px-4 py-2 text-center font-bold">{item.stats.points}</td>
                      <td className="px-4 py-2 text-center">{item.stats.goalDifference > 0 ? `+${item.stats.goalDifference}` : item.stats.goalDifference}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={thirdPlaceStandingsOverride} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {displayTeams.map((item, index) => (
                  <div key={item.team.id} className={`relative rounded-md border ${index < 8 ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50/30'}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md opacity-70" style={{ backgroundColor: index < 8 ? '#22c55e' : '#ef4444' }} />
                    <SortableTeamItem team={item.team} index={index} />
                  </div>
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
              {activeTeam ? <SortableTeamItem team={activeTeam} index={thirdPlaceStandingsOverride.indexOf(activeId as string)} isOverlay={true} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};