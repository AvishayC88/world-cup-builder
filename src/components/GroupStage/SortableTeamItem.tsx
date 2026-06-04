import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Team } from '../../store/types';

interface SortableTeamItemProps {
  team: Team;
  index: number;
  isOverlay?: boolean;
}

export const SortableTeamItem: React.FC<SortableTeamItemProps> = ({ team, index, isOverlay }) => {
  // Hook must be called unconditionally
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  // Render the floating overlay version
  if (isOverlay) {
    return (
      <div className="flex items-center justify-between p-1 pl-2 mb-2 bg-white border-2 border-blue-500 rounded-md shadow-xl ring-1 ring-blue-500 w-full opacity-95 cursor-grabbing scale-105">
        <div className="flex items-center min-w-0 flex-1 mr-2">
          <span className="w-5 text-center font-bold text-gray-400 mr-2 text-sm shrink-0">{index + 1}</span>
          <img 
            src={team.flagUrl} 
            alt={team.name} 
            className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 mr-3 shrink-0" 
          />
          <span className="font-semibold text-gray-900 text-sm truncate">{team.name}</span>
        </div>
        <div className="p-3 -mr-1 text-blue-500 flex items-center justify-center rounded-md">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
    );
  }

  // Regular rendering for the list items
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, 
    zIndex: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-1 pl-2 mb-2 bg-white border border-gray-200 rounded-md shadow-sm transition-opacity w-full min-w-0"
    >
      <div className="flex items-center min-w-0 flex-1 mr-2">
        <span className="w-5 text-center font-bold text-gray-400 mr-2 text-sm shrink-0">{index + 1}</span>
        <img 
          src={team.flagUrl} 
          alt={team.name} 
          className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 mr-3 shrink-0" 
        />
        <span className="font-semibold text-gray-800 text-sm truncate">{team.name}</span>
      </div>
      
      <div 
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="p-3 -mr-1 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
};