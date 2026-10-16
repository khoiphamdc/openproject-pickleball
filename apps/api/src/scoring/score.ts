export interface ScoreInput {
  difficulty: 1 | 2 | 3 | 5 | 8;
  acceptedAt: Date;
  dueDate: Date;
  bugs: Array<{ severity: 'Low' | 'Medium' | 'High' | 'Critical' }>;
  contributionShare: number;
}

const BUG_PENALTY = { Low: 0.5, Medium: 1, High: 2, Critical: 4 };

function deadlineFactor(accepted: Date, due: Date): number {
  const dayMs = 86_400_000;
  const diffDays = Math.floor((accepted.getTime() - due.getTime()) / dayMs);
  if (diffDays <= -1) return 1.05;
  if (diffDays === 0) return 1.0;
  if (diffDays <= 2) return 0.9;
  return 0.8;
}

export function computeTaskScore(input: ScoreInput) {
  const base = input.difficulty;
  const factor = deadlineFactor(input.acceptedAt, input.dueDate);
  const penalty = input.bugs.reduce((sum, b) => sum + BUG_PENALTY[b.severity], 0);
  const taskScore = Math.max(0, base * factor - penalty);
  return {
    taskScore,
    personScore: taskScore * input.contributionShare,
    breakdown: { base, factor, penalty, share: input.contributionShare },
  };
}