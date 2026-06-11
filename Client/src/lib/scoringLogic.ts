/**
 * Scoring logic for the "Play Against AI" challenge.
 * Both the user's and AI's predictions are graded against real match results.
 *
 * Scoring tiers:
 *   EXACT  = 3 pts  — Predicted the exact scoreline
 *   RESULT = 1 pt   — Predicted the correct outcome (win/draw/loss) but not exact score
 *   WRONG  = 0 pts  — Predicted the wrong outcome
 *   PENDING         — Real result not yet available
 */

export type PredictionGrade = 'EXACT' | 'RESULT' | 'WRONG' | 'PENDING';

export function gradePrediction(
  predScoreA: number | null | undefined,
  predScoreB: number | null | undefined,
  realScoreA: number | null | undefined,
  realScoreB: number | null | undefined,
): PredictionGrade {
  // If any value is missing, we can't grade
  if (
    predScoreA == null || predScoreB == null ||
    realScoreA == null || realScoreB == null
  ) {
    return 'PENDING';
  }

  // Exact scoreline match
  if (predScoreA === realScoreA && predScoreB === realScoreB) {
    return 'EXACT';
  }

  // Check if the outcome (win/draw/loss) is correct
  const predOutcome = Math.sign(predScoreA - predScoreB); // 1 = A wins, 0 = draw, -1 = B wins
  const realOutcome = Math.sign(realScoreA - realScoreB);

  if (predOutcome === realOutcome) {
    return 'RESULT';
  }

  return 'WRONG';
}

export function getPoints(grade: PredictionGrade): number {
  switch (grade) {
    case 'EXACT': return 3;
    case 'RESULT': return 1;
    default: return 0;
  }
}

export interface ChallengeScore {
  total: number;
  exact: number;
  result: number;
  wrong: number;
  pending: number;
}

export function calculateChallengeScore(
  predictions: Record<string, { scoreA: number; scoreB: number }>,
  realResults: Record<string, { scoreA: number | null; scoreB: number | null }>,
): ChallengeScore {
  const score: ChallengeScore = { total: 0, exact: 0, result: 0, wrong: 0, pending: 0 };

  for (const matchId of Object.keys(predictions)) {
    const pred = predictions[matchId];
    const real = realResults[matchId];

    const grade = gradePrediction(
      pred.scoreA, pred.scoreB,
      real?.scoreA, real?.scoreB,
    );

    score.total += getPoints(grade);

    switch (grade) {
      case 'EXACT': score.exact++; break;
      case 'RESULT': score.result++; break;
      case 'WRONG': score.wrong++; break;
      case 'PENDING': score.pending++; break;
    }
  }

  return score;
}
