import type { ReportDataset } from '../analytics/report.js';
import { BUG_PENALTY, deadlineFactor, type BugSeverity } from './score.js';

// Demo projection: current story points/assignee stand in for approved
// snapshots. Deadline factor and bug penalties both affect points. A bug
// explicitly parented to an execution unit is treated as confirmed unless cancelled.
export function currentScorePreview(dataset: ReportDataset) {
  const candidates = dataset.tasks.filter(task => task.isExecutionUnit && ['TASK', 'SUBTASK'].includes(task.type.trim().toUpperCase()) && task.status.trim().toUpperCase() === 'DONE');
  const scored = candidates.flatMap(task => {
    const difficulty = task.storyPoints;
    if (!difficulty || ![1, 2, 3, 5, 8].includes(difficulty) || !task.currentAssigneeId) return [];
    const parent = task.type.trim().toUpperCase() === 'SUBTASK' ? dataset.tasks.find(t => t.id === task.parentId) : null;
    const acceptedAt = parent?.acceptedAt ?? task.acceptedAt;
    if (!acceptedAt) return [];
    if (!task.dueDate) return [];
    const factor = deadlineFactor(acceptedAt, task.dueDate);
    const bugs = dataset.defects.filter(bug => bug.sourceTaskId === task.id && bug.currentAssigneeId === task.currentAssigneeId && bug.status?.trim().toUpperCase() !== 'CANCELLED' && !bug.isDuplicate && !bug.isNotABug);
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
  const peopleMap = new Map<number, {userId:number; name:string|null; netPoints:number; grossPoints:number; taskCount:number; bugPenalty:number}>();
  for (const item of scored) { const person = peopleMap.get(item.userId) ?? {userId:item.userId, name:dataset.tasks.find(t=>t.id===item.workPackageId)?.currentAssigneeName ?? null, netPoints:0, grossPoints:0, taskCount:0, bugPenalty:0}; person.netPoints += item.netPoints; person.grossPoints += item.grossPoints; person.taskCount++; person.bugPenalty += item.bugPenalty; peopleMap.set(item.userId, person); }
  return {
    kind: 'demo_estimate' as const,
    ruleVersion: 'demo-v1',
    asOf: dataset.report.asOf,
    factor: 1,
    candidateCount: candidates.length,
    scoredTaskCount: scored.length,
    skippedTaskCount: skipped.length,
    incomplete: true,
    grossPoints: scored.reduce((sum, item) => sum + item.grossPoints, 0),
    netPoints: scored.reduce((sum, item) => sum + item.netPoints, 0),
    people: [...peopleMap.values()],
    tasks: scored,
    skipped,
  };
}
