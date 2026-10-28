// Scoring cho web, bản mock của C03.
// Logic này chép đúng quy tắc demo-v1 của apps/api/src/scoring/score.ts,
// KHÔNG gọi API, KHÔNG đọc DB. Tới C04, web sẽ gọi API của B05 thay cho
// hàm scoreRun() ở đây, còn giao diện thì giữ nguyên.
// Quy tắc: điểm task = max(0, story points * hệ số hạn - trừ bug hợp lệ).

export type BugSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export const RULE_VERSION = 'demo-v1';
export const SCORE_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const BUG_PENALTY: Record<BugSeverity, number> = {
  Low: 0.5,
  Medium: 1,
  High: 2,
  Critical: 4,
};

const VALID_DIFFICULTIES = [1, 2, 3, 5, 8];

export interface ContributionInput {
  userId: number;
  share: number;
}

export interface BugInput {
  bugId: number;
  severity: BugSeverity;
  validated: boolean;
  isDuplicate?: boolean;
  isNotABug?: boolean;
}

export interface TaskInput {
  workPackageId: number;
  subject: string;
  isExecutionUnit: boolean;
  status: string;
  difficulty: number | null;
  baselineDueDate: string | null;
  acceptedAt: string | null;
  contributions: ContributionInput[];
  bugs: BugInput[];
}

export type SkippedReason =
  | 'not-execution-unit'
  | 'not-done'
  | 'missing-difficulty'
  | 'missing-deadline-data'
  | 'invalid-difficulty'
  | 'invalid-bug-id'
  | 'invalid-bug-severity'
  | 'invalid-contribution-shares';

export type ScoreTaskResult =
  | {
      ok: true;
      workPackageId: number;
      taskScore: number;
      allocations: Array<{ userId: number; score: number }>;
      breakdown: { base: number; factor: number; grossPoints: number; penalty: number };
    }
  | { ok: false; workPackageId: number; reason: SkippedReason };

function hcmDayNumber(value: string): number {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return Date.UTC(Number(y), Number(m) - 1, Number(d)) / 86_400_000;
  }
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCORE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Cannot read ${type} from date`);
    return Number(part.value);
  };
  return Date.UTC(get('year'), get('month') - 1, get('day')) / 86_400_000;
}

function validatedBugPenalty(bugs: BugInput[], penalties: Record<BugSeverity, number>): number {
  const unique = new Map(bugs.map(bug => [bug.bugId, bug]));
  return [...unique.values()]
    .filter(bug => bug.validated && !bug.isDuplicate && !bug.isNotABug)
    .reduce((sum, bug) => sum + penalties[bug.severity], 0);
}

export function deadlineFactor(acceptedAt: string, dueDate: string): number {
  const diffDays = hcmDayNumber(acceptedAt) - hcmDayNumber(dueDate);
  if (diffDays <= -1) return 1.05;
  if (diffDays === 0) return 1.0;
  if (diffDays <= 2) return 0.9;
  return 0.8;
}

export function scoreTask(input: TaskInput): ScoreTaskResult {
  const { workPackageId } = input;
  if (!input.isExecutionUnit) return { ok: false, workPackageId, reason: 'not-execution-unit' };
  if (input.status.trim().toUpperCase() !== 'DONE') return { ok: false, workPackageId, reason: 'not-done' };
  if (input.difficulty === null || input.difficulty === undefined) {
    return { ok: false, workPackageId, reason: 'missing-difficulty' };
  }
  if (!VALID_DIFFICULTIES.includes(input.difficulty)) {
    return { ok: false, workPackageId, reason: 'invalid-difficulty' };
  }
  if (!input.acceptedAt || !input.baselineDueDate) {
    return { ok: false, workPackageId, reason: 'missing-deadline-data' };
  }
  const shareSum = input.contributions.reduce((s, c) => s + c.share, 0);
  const sharesValid =
    input.contributions.length > 0 &&
    input.contributions.every((c) => Number.isInteger(c.userId) && c.userId > 0 && Number.isFinite(c.share) && c.share > 0 && c.share <= 1) &&
    new Set(input.contributions.map(c => c.userId)).size === input.contributions.length &&
    Math.abs(shareSum - 1) <= 1e-9;
  if (!sharesValid) return { ok: false, workPackageId, reason: 'invalid-contribution-shares' };

  if (input.bugs.some(bug => !Number.isInteger(bug.bugId) || bug.bugId <= 0)) {
    return { ok: false, workPackageId, reason: 'invalid-bug-id' };
  }
  if (input.bugs.some(bug => !Object.hasOwn(BUG_PENALTY, bug.severity))) {
    return { ok: false, workPackageId, reason: 'invalid-bug-severity' };
  }

  const penalty = validatedBugPenalty(input.bugs, BUG_PENALTY);
  const factor = deadlineFactor(input.acceptedAt, input.baselineDueDate);
  const grossPoints = input.difficulty * factor;
  const taskScore = Math.max(0, grossPoints - penalty);
  return {
    ok: true,
    workPackageId,
    taskScore,
    allocations: input.contributions.map((c) => ({
      userId: c.userId,
      score: taskScore * c.share,
    })),
    breakdown: { base: input.difficulty, factor, grossPoints, penalty },
  };
}

export interface ScoreConfig {
  penalties: Record<BugSeverity, number>;
}

export const DEFAULT_CONFIG: ScoreConfig = {
  penalties: { ...BUG_PENALTY },
};

// Chỉ dùng để xem trước ở trang cấu hình (C03, mock). Chốt điểm thật là C04.
export function scoreTaskWithConfig(input: TaskInput, config: ScoreConfig): ScoreTaskResult {
  const base = scoreTask(input);
  if (!base.ok) return base;
  const penalty = validatedBugPenalty(input.bugs, config.penalties);
  const taskScore = Math.max(0, base.breakdown.grossPoints - penalty);
  return {
    ok: true,
    workPackageId: input.workPackageId,
    taskScore,
    allocations: input.contributions.map((c) => ({
      userId: c.userId,
      score: taskScore * c.share,
    })),
    breakdown: { ...base.breakdown, penalty },
  };
}

export interface PersonScore {
  userId: number;
  score: number;
  taskCount: number;
}

export interface ScoredTask {
  workPackageId: number;
  taskScore: number;
}

export interface SkippedTask {
  workPackageId: number;
  reason: SkippedReason;
}

export interface ScoreRunResult {
  ruleVersion: string;
  totals: PersonScore[];
  scored: ScoredTask[];
  skipped: SkippedTask[];
  scoredTaskCount: number;
  skippedTaskCount: number;
  incomplete: boolean;
  totalScore: number;
}

export function scoreRun(tasks: TaskInput[]): ScoreRunResult {
  // Khử trùng reopen: cùng mã task thì bản ghi cuối thắng.
  // Dữ liệu mẫu đưa vào đã xếp theo thứ tự thời gian.
  const deduped = new Map<number, TaskInput>();
  for (const task of tasks) deduped.set(task.workPackageId, task);
  const results = [...deduped.values()].map((task) => scoreTask(task));

  const scored: ScoredTask[] = [];
  const skipped: SkippedTask[] = [];
  const byUser = new Map<number, PersonScore>();
  for (const r of results) {
    if (r.ok) {
      scored.push({ workPackageId: r.workPackageId, taskScore: r.taskScore });
      for (const a of r.allocations) {
        const cur = byUser.get(a.userId) ?? { userId: a.userId, score: 0, taskCount: 0 };
        cur.score += a.score;
        cur.taskCount += 1;
        byUser.set(a.userId, cur);
      }
    } else {
      skipped.push({ workPackageId: r.workPackageId, reason: r.reason });
    }
  }
  const totals = [...byUser.values()].sort((a, b) => a.userId - b.userId);
  return {
    ruleVersion: RULE_VERSION,
    totals,
    scored,
    skipped,
    scoredTaskCount: scored.length,
    skippedTaskCount: skipped.length,
    incomplete: skipped.length > 0,
    totalScore: scored.reduce((sum, s) => sum + s.taskScore, 0),
  };
}
