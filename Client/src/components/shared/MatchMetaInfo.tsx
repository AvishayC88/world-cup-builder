import React from 'react';
import { matchMetadata } from '../../data/matchMetadata';

interface MatchMetaInfoProps {
  matchId: string;
}

export const MatchMetaInfo: React.FC<MatchMetaInfoProps> = ({ matchId }) => {
  const meta = matchMetadata[matchId];
  if (!meta) return null;

  // Format to user's local timezone automatically
  const localDateTime = new Date(meta.utcDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Safely split the venue into stadium and city
  const venueParts = meta.venue.split(',');
  const stadium = venueParts[0]?.trim();
  const city = venueParts[1]?.trim();

  return (
    <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 mb-2 pb-1 border-b border-gray-100 uppercase tracking-wide w-full">
      
      {/* Venue (Stadium & City) */}
      <span className="flex items-center gap-1.5 truncate pr-2" title={meta.venue}>
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="truncate">
          {stadium} {city && <span className="opacity-75"> • {city}</span>}
        </span>
      </span>

      {/* Date & Time */}
      <span className="flex items-center gap-1.5 shrink-0 text-indigo-600 font-medium">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {localDateTime}
      </span>
      
    </div>
  );
};