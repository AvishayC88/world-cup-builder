import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Team } from '../../store/types';

interface SortableTeamItemProps {
  team: Team;
  index: number;
}

export const SortableTeamItem: React.FC<SortableTeamItemProps> = ({ team, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-2.5 mb-2 bg-white border rounded-md shadow-sm cursor-grab active:cursor-grabbing transition-all w-full min-w-0 ${
        isDragging ? 'border-blue-500 shadow-md ring-1 ring-blue-500 opacity-90' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Content Container - Sealed with min-w-0 to allow text truncation */}
      <div className="flex items-center min-w-0 flex-1 mr-4">
        {/* Index indicator */}
        <span className="w-5 text-center font-bold text-gray-400 mr-2 text-sm shrink-0">{index + 1}</span>
        
        {/* Left Flag */}
        <img 
          src={team.flagUrl} 
          alt={team.name} 
          className="w-5 h-3.5 object-cover rounded-sm border border-gray-300 mr-3 shrink-0" 
        />
        
        {/* Team Name - Safely truncated if it runs out of space */}
        <span className="font-semibold text-gray-800 text-sm truncate">{team.name}</span>
      </div>
      
      {/* Drag Handle Icon - Isolated on the right edge */}
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
      </svg>
    </div>
  );
};