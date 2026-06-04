import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  type DragEndEvent 
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

  // Configure sensors for both mouse and touch interfaces
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay to differentiate from scrolling on mobile
        tolerance: 5,
      },
    })
  );

  // Order teams based on the standingsOverride array
  const orderedTeams = standingsOverride.map(id => teams.find(t => t.id === id)!);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = standingsOverride.indexOf(active.id as string);
      const newIndex = standingsOverride.indexOf(over.id as string);
      
      const newOrder = arrayMove(standingsOverride, oldIndex, newIndex);
      setGroupStandingsOverride(groupId, newOrder);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={standingsOverride} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col pt-2">
          {orderedTeams.map((team, index) => (
            <SortableTeamItem key={team.id} team={team} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};