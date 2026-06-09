import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Team } from '../../store/types';

interface SortableTeamItemProps {
  team: Team;
  index: number;
  isOverlay?: boolean;
  qualificationStatus?: 'advancing' | 'eliminated';
}

export const SortableTeamItem: React.FC<SortableTeamItemProps> = ({ team, index, isOverlay, qualificationStatus }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

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

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, 
    zIndex: isDragging ? 0 : 1,
  };

  // Dynamic styling based on status (for Third Place Table)
  let bgClass = "bg-white";
  let borderClass = "border-gray-200";
  let indicatorColor = "";

  if (qualificationStatus === 'advancing') {
    bgClass = "bg-green-50";
    borderClass = "border-green-200";
    indicatorColor = "bg-green-500";
  } else if (qualificationStatus === 'eliminated') {
    bgClass = "bg-red-50";
    borderClass = "border-red-100";
    indicatorColor = "bg-red-500";
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-1 pl-2 mb-2 ${bgClass} border ${borderClass} rounded-md shadow-sm transition-opacity w-full min-w-0 relative overflow-hidden`}
    >
      {/* Visual indicator bar */}
      {indicatorColor && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-70 ${indicatorColor}`} />
      )}

      <div className="flex items-center min-w-0 flex-1 mr-2 z-10">
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
        className="p-3 -mr-1 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center hover:bg-black/5 rounded-md transition-colors text-gray-400 hover:text-gray-600 z-10"
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
};