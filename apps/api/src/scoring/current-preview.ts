import type { ReportDataset } from '../analytics/report.js';
import { BUG_PENALTY, deadlineFactor, type BugSeverity } from './score.js';

// Demo projection: current story points/assignee stand in for approved
// snapshots. Deadline factor affects earned unit points. A valid parented Bug
// is deducted even while its source is not Done; when its source has no scored
// row, deduct it once from the responsible person's aggregate.
export function currentScorePreview(dataset: ReportDataset) {
  const candidates = dataset.tasks.filter(task => task.isExecutionUnit && ['TASK', 'SUBTASK'].includes(task.type.trim().toUpperCase()) && task.status.trim().toUpperCase() === 'DONE');
  const tasksById = new Map(dataset.tasks.map(task => [task.id, task]));
  const eligibleBugs = [...new Map(dataset.defects
    .filter(bug => {
      const source = bug.sourceTaskId === null ? null : tasksById.get(bug.sourceTaskId);
      return source != null &&
        ['TASK', 'SUBTASK'].includes(source.type.trim().toUpperCase()) &&
        source.currentAssigneeId != null &&
        bug.currentAssigneeId === source.currentAssigneeId &&
        bug.status?.trim().toUpperCase() !== 'CANCELLED' &&
        !bug.isDuplicate && !bug.isNotABug;
    })
    .map(bug => [bug.id, bug] as const)).values()];
  const scored = candidates.flatMap(task => {
    const difficulty = task.storyPoints;
    if (!difficulty || ![1, 2, 3, 5, 8].includes(difficulty) || !task.currentAssigneeId) return [];
    const parent = task.type.trim().toUpperCase() === 'SUBTASK' ? dataset.tasks.find(t => t.id === task.parentId) : null;
    const acceptedAt = parent?.acceptedAt ?? task.acceptedAt;
    if (!acceptedAt) return [];
    if (!task.dueDate) return [];
    const factor = deadlineFactor(acceptedAt, task.dueDate);
    const bugs = eligibleBugs.filter(bug => bug.sourceTaskId === task.id);
    const bugPenalty = bugs.reduce((sum, bug) => sum + BUG_PENALTY[bug.severity as BugSeverity], 0);
    const grossPoints = difficulty * factor;
    const netPoints = Math.max(0, grossPoints - bugPenalty);
    return [{ workPackageId: task.id, userId: task.currentAssigneeId, difficulty, factor, bugCount: bugs.length, bugPenalty, netPoints, grossPoints }];
  });
  const scoredIds = new Set(scored.map(task => task.workPackageId));
  const skipped = candidates.filter(task => !scoredIds.has(task.id)).map(task => ({
    workPackageId: task.id,
    reasons: [!task.currentAssigneeId ? 'missing_current_assignee' : null, !task.storyPoints ? 'missing_story_points' : null, task.storyPoints && ![1, 2, 3, 5, 8].includes(task.storyPoints) ? 'unsupported_story_points' : null, task.acceptedAt ? null : 'acceptance_evidence_unavailable', task.dueDate ? null : 'baseline_unavailable'].filter(Boolean) as string[],
  }));
  const peopleMap = new Map<number, {userId:number; name:string|null; netPoints:number; grossPoints:number; taskCount:number; bugPenalty:number; scoredBugPenalty:number; unscoredBugPenalty:number; bugCount:number; unscoredBugCount:number}>();
  const getPerson = (userId: number, name: string | null) => {
    const person = peopleMap.get(userId) ?? {userId, name, netPoints:0, grossPoints:0, taskCount:0, bugPenalty:0, scoredBugPenalty:0, unscoredBugPenalty:0, bugCount:0, unscoredBugCount:0};
    if (!person.name && name) person.name = name;
    peopleMap.set(userId, person);
    return person;
  };
  for (const item of scored) {
    const source = tasksById.get(item.workPackageId);
    const person = getPerson(item.userId, source?.currentAssigneeName ?? null);
    person.netPoints += item.netPoints;
    person.grossPoints += item.grossPoints;
    person.taskCount++;
    person.scoredBugPenalty += item.bugPenalty;
  }
  for (const bug of eligibleBugs) {
    const source = bug.sourceTaskId === null ? undefined : tasksById.get(bug.sourceTaskId);
    if (!source?.currentAssigneeId) continue;
    const person = getPerson(source.currentAssigneeId, source.currentAssigneeName ?? null);
    const penalty = BUG_PENALTY[bug.severity as BugSeverity];
    person.bugPenalty += penalty;
    person.bugCount++;
    if (!scoredIds.has(source.id)) {
      person.unscoredBugPenalty += penalty;
      person.unscoredBugCount++;
    }
  }
  for (const person of peopleMap.values()) {
    person.netPoints = Math.max(0, person.netPoints - person.unscoredBugPenalty);
  }
  const people = [...peopleMap.values()];
  return {
    kind: 'demo_estimate' as const,
    ruleVersion: 'demo-v2',
    asOf: dataset.report.asOf,
    factor: 1,
    candidateCount: candidates.length,
    scoredTaskCount: scored.length,
    skippedTaskCount: skipped.length,
    incomplete: true,
    grossPoints: scored.reduce((sum, item) => sum + item.grossPoints, 0),
    netPoints: people.reduce((sum, person) => sum + person.netPoints, 0),
    people,
    tasks: scored,
    skipped,
  };
}
