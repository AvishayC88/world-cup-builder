import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateGroupStandings } from '../../lib/fifaRules';
import { LiveModeContext } from '../../App';
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
    liveMatches,
    isThirdPlaceAutoCalculated, 
    thirdPlaceStandingsOverride, 
    setThirdPlaceStandingsOverride 
  } = useTournamentStore();

  const isLiveMode = useContext(LiveModeContext);
  const effectiveAutoCalculated = isThirdPlaceAutoCalculated || isLiveMode;

  const [activeId, setActiveId] = useState<string | null>(null);

  // 1. Calculate the 3rd place team for each group
  const thirdPlaceTeams = useMemo(() => {
    return Object.values(groups).map(group => {
      let groupMatches = Object.values(matches).filter(m => m.groupId === group.id);
      
      if (isLiveMode) {
        groupMatches = groupMatches.map((match) => {
          const liveData = liveMatches[match.id];
          if (liveData) {
            return {
              ...match,
              scoreA: liveData.scoreA,
              scoreB: liveData.scoreB,
            };
          }
          return {
            ...match,
            scoreA: null,
            scoreB: null,
          };
        });
      }
      
      let thirdTeamId: string;
      let stats = { points: 0, goalDifference: 0, goalsFor: 0, matchesPlayed: 0 };

      if (group.mode === 'SCORES' || isLiveMode) {
        const standings = calculateGroupStandings(group.teams, groupMatches);
        thirdTeamId = standings[2]?.teamId;
        const foundStats = standings.find(s => s.teamId === thirdTeamId);
        if (foundStats) stats = foundStats;
      } else {
        thirdTeamId = group.standingsOverride[2];
      }

      const team = group.teams.find(t => t.id === thirdTeamId);
      return { team, stats, groupName: `Group ${group.id}` };
    }).filter(x => x.team) as { team: any, stats: any, groupName: string }[];
  }, [groups, matches, liveMatches, isLiveMode]);

  // 2. Smart Sync: Ensure the override array ALWAYS contains the exact current 3rd place teams
  useEffect(() => {
    if (isLiveMode) return; // Do not mutate the user's manual array based on live data
    
    const currentThirdIds = thirdPlaceTeams.map(t => t.team.id);
    
    // Check if there's any mismatch in team identities (not just array length)
    const hasMismatch = currentThirdIds.some(id => !thirdPlaceStandingsOverride.includes(id)) || 
                        thirdPlaceStandingsOverride.length !== currentThirdIds.length;

    if (hasMismatch) {
      // Keep existing valid teams in their current manual order
      const validExisting = thirdPlaceStandingsOverride.filter(id => currentThirdIds.includes(id));
      // Identify teams that just dropped into 3rd place
      const newArrivals = currentThirdIds.filter(id => !thirdPlaceStandingsOverride.includes(id));
      
      setThirdPlaceStandingsOverride([...validExisting, ...newArrivals]);
    }
  }, [thirdPlaceTeams, thirdPlaceStandingsOverride, setThirdPlaceStandingsOverride, isLiveMode]);

  // 3. Sort teams for display
  const displayTeams = useMemo(() => {
    let sorted = [...thirdPlaceTeams];
    
    if (effectiveAutoCalculated) {
      sorted.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        if (b.stats.goalDifference !== a.stats.goalDifference) return b.stats.goalDifference - a.stats.goalDifference;
        return (b.stats.goalsFor || 0) - (a.stats.goalsFor || 0);
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
  }, [thirdPlaceTeams, effectiveAutoCalculated, thirdPlaceStandingsOverride]);

  // Dynamic array of currently rendered IDs (crucial for dnd-kit stability)
  const renderedIds = displayTeams.map(t => t.team.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Base the movement strictly on what the user visually sees on screen
      const oldIndex = renderedIds.indexOf(active.id as string);
      const newIndex = renderedIds.indexOf(over.id as string);
      setThirdPlaceStandingsOverride(arrayMove(renderedIds, oldIndex, newIndex));
    }
  };

  const activeTeam = activeId ? displayTeams.find(t => t.team.id === activeId)?.team : null;
  const activeIndex = activeId ? renderedIds.indexOf(activeId) : -1;

  return (
    <div className="w-full mt-8 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-blue-900 text-white p-3 px-6 flex justify-between items-center">
        <h2 className="font-bold text-lg">Third-Place Ranking</h2>
        <span className="text-xs bg-white/20 px-2 py-1 rounded font-semibold uppercase tracking-wider">
          {isLiveMode ? 'Live Scores' : (effectiveAutoCalculated ? 'Auto (Scores)' : 'Manual Override')}
        </span>
      </div>

      <div className="p-4 md:p-6">
        <p className="text-sm text-gray-500 mb-4">
          {effectiveAutoCalculated 
            ? "Top 8 third-place teams advance to the Round of 32 based on points and goal difference."
            : "Drag and drop to rank the third-place teams manually. The top 8 will advance."}
        </p>

        {effectiveAutoCalculated ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="px-4 py-2 w-10 text-center">#</th>
                  <th className="px-4 py-2">Team</th>
                  <th className="px-4 py-2 text-center">Group</th>
                  <th className="px-4 py-2 text-center">Pts</th>
                  <th className="px-4 py-2 text-center">GD</th>
                  <th className="px-4 py-2 text-center">GF</th>
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
                      <td className="px-4 py-2 text-center">{item.stats.goalsFor || 0}</td>
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
            <SortableContext items={renderedIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {displayTeams.map((item, index) => (
                  <SortableTeamItem 
                    key={item.team.id} 
                    team={item.team} 
                    index={index} 
                    qualificationStatus={index < 8 ? 'advancing' : 'eliminated'}
                  />
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
              {activeTeam ? (
                <SortableTeamItem 
                  team={activeTeam} 
                  index={activeIndex} 
                  isOverlay={true} 
                  qualificationStatus={activeIndex < 8 ? 'advancing' : 'eliminated'}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};