import React from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { GroupCard } from './GroupCard';

export const GroupStageGrid: React.FC = () => {
  const groups = useTournamentStore((state) => state.groups);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
        {Object.values(groups).map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
};