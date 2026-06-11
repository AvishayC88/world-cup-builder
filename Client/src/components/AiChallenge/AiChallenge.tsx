import React, { useMemo, useState } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { matchMetadata } from '../../data/matchMetadata';
import { gradePrediction, getPoints, type PredictionGrade, type ChallengeScore } from '../../lib/scoringLogic';

interface AiChallengeProps {
  geminiApiKey: string;
  onRequestApiKey: () => void;
}

interface MatchComparisonData {
  matchId: string;
  teamAName: string;
  teamBName: string;
  teamAFlag: string;
  teamBFlag: string;
  userScoreA: number | null;
  userScoreB: number | null;
  aiScoreA: number | null;
  aiScoreB: number | null;
  realScoreA: number | null;
  realScoreB: number | null;
  userGrade: PredictionGrade;
  aiGrade: PredictionGrade;
  context: string;
  utcDate?: string;
  isLocked: boolean;
}

type FilterType = 'ALL' | 'GROUPS' | 'PLAYOFFS';

export const AiChallenge: React.FC<AiChallengeProps> = ({ geminiApiKey, onRequestApiKey }) => {
  const groups = useTournamentStore((s) => s.groups);
  const matches = useTournamentStore((s) => s.matches);
  const playoffMatches = useTournamentStore((s) => s.playoffMatches);
  const aiPredictions = useTournamentStore((s) => s.aiPredictions);
  const lockedUserPredictions = useTournamentStore((s) => s.lockedUserPredictions);
  const liveMatches = useTournamentStore((s) => s.liveMatches);
  const isAiChallengeLoading = useTournamentStore((s) => s.isAiChallengeLoading);
  const generateAiChallenge = useTournamentStore((s) => s.generateAiChallenge);
  const clearAiChallenge = useTournamentStore((s) => s.clearAiChallenge);

  const [filter, setFilter] = useState<FilterType>('ALL');

  const hasAiPredictions = Object.keys(aiPredictions).length > 0;

  // Build comparison data for all matches
  const comparisons = useMemo<MatchComparisonData[]>(() => {
    const result: MatchComparisonData[] = [];
    const now = new Date();

    // Group stage matches
    Object.values(matches).forEach(match => {
      const group = groups[match.groupId];
      if (!group) return;
      const teamA = group.teams.find(t => t.id === match.teamAId);
      const teamB = group.teams.find(t => t.id === match.teamBId);
      if (!teamA || !teamB) return;

      const aiPred = aiPredictions[match.id];
      const liveMatch = liveMatches[match.id];
      const isFinished = liveMatch && ['FT', 'AET', 'PEN', 'FINISHED'].includes(liveMatch.status);
      const realA = isFinished ? liveMatch.scoreA : null;
      const realB = isFinished ? liveMatch.scoreB : null;

      const meta = matchMetadata[match.id];
      const matchDate = meta ? new Date(meta.utcDate) : null;
      const isLocked = matchDate ? now >= matchDate : false;

      // Use locked (snapshotted) predictions for started matches so that
      // syncing real results or editing later doesn't change the challenge score
      const locked = lockedUserPredictions[match.id];
      const userA = (isLocked && locked) ? locked.scoreA : match.scoreA;
      const userB = (isLocked && locked) ? locked.scoreB : match.scoreB;

      result.push({
        matchId: match.id,
        teamAName: teamA.name,
        teamBName: teamB.name,
        teamAFlag: teamA.flagUrl,
        teamBFlag: teamB.flagUrl,
        userScoreA: userA,
        userScoreB: userB,
        aiScoreA: aiPred?.scoreA ?? null,
        aiScoreB: aiPred?.scoreB ?? null,
        realScoreA: realA,
        realScoreB: realB,
        userGrade: gradePrediction(userA, userB, realA, realB),
        aiGrade: gradePrediction(aiPred?.scoreA ?? null, aiPred?.scoreB ?? null, realA, realB),
        context: `Group ${match.groupId}`,
        utcDate: meta?.utcDate,
        isLocked,
      });
    });

    // Playoff matches
    Object.values(playoffMatches).forEach(match => {
      const playoffKey = `P_${match.id}`;
      const aiPred = aiPredictions[playoffKey];
      const liveMatch = liveMatches[playoffKey];
      const isFinished = liveMatch && ['FT', 'AET', 'PEN', 'FINISHED'].includes(liveMatch.status);
      const realA = isFinished ? liveMatch.scoreA : null;
      const realB = isFinished ? liveMatch.scoreB : null;

      const meta = matchMetadata[playoffKey];
      const matchDate = meta ? new Date(meta.utcDate) : null;
      const isLocked = matchDate ? now >= matchDate : false;

      const roundLabel = match.id <= 16 ? 'R32' : match.id <= 24 ? 'R16' : match.id <= 28 ? 'QF' : match.id <= 30 ? 'SF' : match.id === 31 ? '3rd' : 'Final';

      if (match.teamA && match.teamB) {
        // Use locked predictions for started playoff matches
        const locked = lockedUserPredictions[playoffKey];
        const userA = (isLocked && locked) ? locked.scoreA : match.scoreA;
        const userB = (isLocked && locked) ? locked.scoreB : match.scoreB;

        result.push({
          matchId: playoffKey,
          teamAName: match.teamA.name,
          teamBName: match.teamB.name,
          teamAFlag: match.teamA.flagUrl,
          teamBFlag: match.teamB.flagUrl,
          userScoreA: userA,
          userScoreB: userB,
          aiScoreA: aiPred?.scoreA ?? null,
          aiScoreB: aiPred?.scoreB ?? null,
          realScoreA: realA,
          realScoreB: realB,
          userGrade: gradePrediction(userA, userB, realA, realB),
          aiGrade: gradePrediction(aiPred?.scoreA ?? null, aiPred?.scoreB ?? null, realA, realB),
          context: roundLabel,
          utcDate: meta?.utcDate,
          isLocked,
        });
      }
    });

    // Sort by date
    result.sort((a, b) => {
      if (!a.utcDate && !b.utcDate) return 0;
      if (!a.utcDate) return 1;
      if (!b.utcDate) return -1;
      return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
    });

    return result;
  }, [matches, groups, playoffMatches, aiPredictions, lockedUserPredictions, liveMatches]);

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    if (filter === 'GROUPS') return comparisons.filter(c => c.matchId.startsWith('G'));
    if (filter === 'PLAYOFFS') return comparisons.filter(c => c.matchId.startsWith('P_'));
    return comparisons;
  }, [comparisons, filter]);

  // Calculate scores
  const { userScore, aiScore } = useMemo(() => {
    const user: ChallengeScore = { total: 0, exact: 0, result: 0, wrong: 0, pending: 0 };
    const ai: ChallengeScore = { total: 0, exact: 0, result: 0, wrong: 0, pending: 0 };

    comparisons.forEach(c => {
      user.total += getPoints(c.userGrade);
      ai.total += getPoints(c.aiGrade);
      user[c.userGrade.toLowerCase() as keyof ChallengeScore] = (user[c.userGrade.toLowerCase() as keyof ChallengeScore] as number) + 1;
      ai[c.aiGrade.toLowerCase() as keyof ChallengeScore] = (ai[c.aiGrade.toLowerCase() as keyof ChallengeScore] as number) + 1;
    });

    return { userScore: user, aiScore: ai };
  }, [comparisons]);

  const scoredMatchCount = comparisons.filter(c => c.userGrade !== 'PENDING' || c.aiGrade !== 'PENDING').length;

  const handleGenerate = () => {
    if (!geminiApiKey.trim()) {
      onRequestApiKey();
      return;
    }
    if (hasAiPredictions) {
      if (!window.confirm('⚠️ This will regenerate all AI predictions, replacing the current ones. Continue?')) return;
    }
    generateAiChallenge(geminiApiKey);
  };

  const gradeColor = (grade: PredictionGrade) => {
    switch (grade) {
      case 'EXACT': return 'text-green-400';
      case 'RESULT': return 'text-orange-400';
      case 'WRONG': return 'text-red-400';
      case 'PENDING': return 'text-gray-500';
    }
  };

  const gradeBg = (grade: PredictionGrade) => {
    switch (grade) {
      case 'EXACT': return 'bg-green-500/20 border-green-500/40';
      case 'RESULT': return 'bg-orange-500/20 border-orange-500/40';
      case 'WRONG': return 'bg-red-500/20 border-red-500/40';
      case 'PENDING': return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const gradeLabel = (grade: PredictionGrade) => {
    switch (grade) {
      case 'EXACT': return '✅ Exact';
      case 'RESULT': return '🟠 Result';
      case 'WRONG': return '❌ Wrong';
      case 'PENDING': return '⏳ Pending';
    }
  };

  // EMPTY STATE — no AI predictions yet
  if (!hasAiPredictions && !isAiChallengeLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl">
            <span className="text-5xl">⚔️</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">Play Against AI</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Challenge the AI to predict every World Cup match. Both you and the AI will be scored against 
            real match results. <strong>Exact score = 3pts</strong>, <strong>correct result = 1pt</strong>, 
            <strong>wrong = 0pts</strong>.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Make sure you've filled in your own predictions first — once a match starts, your score is locked!
          </p>
          <button
            onClick={handleGenerate}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg transition-all transform hover:scale-105"
          >
            🤖 Generate AI Predictions
          </button>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (isAiChallengeLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl animate-pulse">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">AI is Thinking...</h2>
          <p className="text-gray-500 text-sm">Generating predictions for all matches. This may take a minute.</p>
        </div>
      </div>
    );
  }

  // MAIN VIEW — AI predictions exist
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full h-full">
      <div className="max-w-[1100px] mx-auto">

        {/* --- SCOREBOARD --- */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-6 mb-6 overflow-hidden relative">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative flex items-center justify-between gap-4">
            {/* User Side */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-blue-600/30 border-2 border-blue-400/50 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">You</p>
              <p className={`text-4xl font-black tabular-nums ${userScore.total > aiScore.total ? 'text-green-400' : userScore.total < aiScore.total ? 'text-red-400' : 'text-white'}`}>
                {userScore.total}
              </p>
              <div className="flex justify-center gap-3 mt-2 text-[10px] font-semibold">
                <span className="text-green-400">✅ {userScore.exact}</span>
                <span className="text-orange-400">🟠 {userScore.result}</span>
                <span className="text-red-400">❌ {userScore.wrong}</span>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center gap-1 shrink-0 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl border-2 border-white/20">
                <span className="text-xl font-black text-white">VS</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium mt-1">
                {scoredMatchCount} scored
              </p>
            </div>

            {/* AI Side */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-purple-600/30 border-2 border-purple-400/50 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <p className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-1">AI</p>
              <p className={`text-4xl font-black tabular-nums ${aiScore.total > userScore.total ? 'text-green-400' : aiScore.total < userScore.total ? 'text-red-400' : 'text-white'}`}>
                {aiScore.total}
              </p>
              <div className="flex justify-center gap-3 mt-2 text-[10px] font-semibold">
                <span className="text-green-400">✅ {aiScore.exact}</span>
                <span className="text-orange-400">🟠 {aiScore.result}</span>
                <span className="text-red-400">❌ {aiScore.wrong}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {(userScore.total + aiScore.total) > 0 && (
            <div className="mt-5 relative">
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-700/50">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
                  style={{ width: `${(userScore.total / (userScore.total + aiScore.total)) * 100}%` }}
                />
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-700 ease-out"
                  style={{ width: `${(aiScore.total / (userScore.total + aiScore.total)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* --- CONTROLS --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
          {/* Filter tabs */}
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            {(['ALL', 'GROUPS', 'PLAYOFFS'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {f === 'ALL' ? 'All Matches' : f === 'GROUPS' ? 'Groups' : 'Playoffs'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isAiChallengeLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all border border-purple-400/30"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear all AI predictions?')) clearAiChallenge();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white hover:bg-gray-50 text-gray-600 shadow-sm transition-all border border-gray-200"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* --- MATCH LIST --- */}
        <div className="space-y-2">
          {filteredComparisons.map(c => {
            const hasRealResult = c.realScoreA !== null && c.realScoreB !== null;

            return (
              <div 
                key={c.matchId}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  hasRealResult ? 'border-gray-200' : 'border-gray-100 opacity-80'
                }`}
              >
                {/* Match header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{c.context}</span>
                  <div className="flex items-center gap-2">
                    {c.isLocked && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">🔒 Locked</span>
                    )}
                    {hasRealResult && (
                      <span className="text-[10px] font-bold text-gray-500">
                        Final: {c.realScoreA} - {c.realScoreB}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match body */}
                <div className="px-4 py-3">
                  {/* Teams row */}
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-sm font-bold text-gray-800 truncate">{c.teamAName}</span>
                      <img src={c.teamAFlag} alt="" className="w-6 h-4 object-cover rounded-sm border border-gray-300 shadow-sm shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-gray-300 shrink-0">vs</span>
                    <div className="flex items-center gap-2 flex-1">
                      <img src={c.teamBFlag} alt="" className="w-6 h-4 object-cover rounded-sm border border-gray-300 shadow-sm shrink-0" />
                      <span className="text-sm font-bold text-gray-800 truncate">{c.teamBName}</span>
                    </div>
                  </div>

                  {/* Predictions comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* User prediction */}
                    <div className={`rounded-lg border px-3 py-2 ${gradeBg(c.userGrade)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">👤 You</span>
                        <span className={`text-[10px] font-bold ${gradeColor(c.userGrade)}`}>
                          {hasRealResult ? `+${getPoints(c.userGrade)}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg font-black text-gray-800 tabular-nums">
                          {c.userScoreA !== null ? c.userScoreA : '?'} - {c.userScoreB !== null ? c.userScoreB : '?'}
                        </span>
                      </div>
                      {hasRealResult && (
                        <p className={`text-center text-[10px] font-bold mt-1 ${gradeColor(c.userGrade)}`}>
                          {gradeLabel(c.userGrade)}
                        </p>
                      )}
                    </div>

                    {/* AI prediction */}
                    <div className={`rounded-lg border px-3 py-2 ${gradeBg(c.aiGrade)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">🤖 AI</span>
                        <span className={`text-[10px] font-bold ${gradeColor(c.aiGrade)}`}>
                          {hasRealResult ? `+${getPoints(c.aiGrade)}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg font-black text-gray-800 tabular-nums">
                          {c.aiScoreA !== null ? c.aiScoreA : '?'} - {c.aiScoreB !== null ? c.aiScoreB : '?'}
                        </span>
                      </div>
                      {hasRealResult && (
                        <p className={`text-center text-[10px] font-bold mt-1 ${gradeColor(c.aiGrade)}`}>
                          {gradeLabel(c.aiGrade)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredComparisons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No matches found for this filter.</p>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-12" />
      </div>
    </div>
  );
};
