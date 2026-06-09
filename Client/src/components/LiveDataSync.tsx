import React, { useEffect, useContext } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { LiveModeContext } from '../App';

export const LiveDataSync: React.FC = () => {
  const isLiveMode = useContext(LiveModeContext);
  const fetchLiveMatches = useTournamentStore((state) => state.fetchLiveMatches);

  useEffect(() => {
    // ARCHITECTURAL GUARD: Do not poll if Live Mode is off
    if (!isLiveMode) return;

    // 1. Fetch immediately upon entering Live Mode
    fetchLiveMatches();

    // 2. Establish the polling loop (every 30 seconds)
    // 30s is safe because our BFF handles the actual caching and limits
    const intervalId = setInterval(() => {
      fetchLiveMatches();
    }, 30000);

    // Cleanup interval on unmount or when mode toggles off
    return () => clearInterval(intervalId);
  }, [isLiveMode, fetchLiveMatches]);

  // This is a headless logic component
  return null;
};