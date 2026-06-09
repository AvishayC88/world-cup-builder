import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Team } from '../../store/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { SortableTeamItem } from './SortableTeamItem';

interface DraggableTeamListProps {
  groupId: string;
  teams: Team[];
  standingsOverride: string[];
}

export const DraggableTeamList: React.FC<DraggableTeamListProps> = ({ groupId, teams, standingsOverride }) => {
  const setGroupStandingsOverride = useTournamentStore((state) => state.setGroupStandingsOverride);
  
  // Track which item is currently being dragged
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const orderedTeams = standingsOverride.map(id => teams.find(t => t.id === id)!);
  
  // Find the active team object and its current index for the overlay
  const activeTeam = activeId ? teams.find(t => t.id === activeId) : null;
  const activeIndex = activeId ? standingsOverride.indexOf(activeId) : -1;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = standingsOverride.indexOf(active.id as string);
      const newIndex = standingsOverride.indexOf(over.id as string);
      
      const newOrder = arrayMove(standingsOverride, oldIndex, newIndex);
      setGroupStandingsOverride(groupId, newOrder);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Prevent snap-back glitch when dropping
  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={standingsOverride} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col pt-2 w-full relative">
          {orderedTeams.map((team, index) => (
            <SortableTeamItem key={team.id} team={team} index={index} />
          ))}
        </div>
      </SortableContext>

      {/* The Overlay rendered out of the standard flow */}
      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeTeam ? (
          <SortableTeamItem 
            team={activeTeam} 
            index={activeIndex} 
            isOverlay={true} 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};