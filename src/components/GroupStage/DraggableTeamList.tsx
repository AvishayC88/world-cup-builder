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

  // Sensors updated for instant feedback on the drag handle
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        // Removed the 200ms delay. Dragging via the handle is now instant!
        distance: 5, 
      },
    })
  );

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
        <div className="flex flex-col pt-2 w-full">
          {orderedTeams.map((team, index) => (
            <SortableTeamItem key={team.id} team={team} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};