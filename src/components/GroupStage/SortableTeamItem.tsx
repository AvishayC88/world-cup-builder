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
    setActivatorNodeRef, // ה-Hook החדש שאחראי על בידוד הגרירה
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-1 pl-2 mb-2 bg-white border rounded-md shadow-sm transition-all w-full min-w-0 ${
        isDragging ? 'border-blue-500 shadow-md ring-1 ring-blue-500 opacity-90' : 'border-gray-200'
      }`}
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
      
      {/* כאן אנחנו קושרים את פונקציית האקטיבטור לאייקון כדי למנוע את הרעידות */}
      <div 
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="p-3 -mr-1 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center hover:bg-gray-50 rounded-md transition-colors"
      >
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
};