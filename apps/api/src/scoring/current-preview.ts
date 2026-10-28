import type { ReportDataset } from '../analytics/report.js';

// The OpenProject adapter has not yet connected approved baselines,
// acceptance events, contribution shares, or complete defect attribution.
// Current values cannot be substituted for them under c01-v1.
export function currentScorePreview(dataset: ReportDataset) {
  const candidates = dataset.tasks.filter(task => task.isExecutionUnit && ['TASK', 'SUBTASK'].includes(task.type.trim().toUpperCase()) && task.status.trim().toUpperCase() === 'DONE');
  const skipped = candidates.map(task => ({
    workPackageId: task.id,
    reasons: ['approved_baseline_unavailable', 'acceptance_evidence_unavailable', 'defect_attribution_unavailable'],
  }));
  return {
    kind: 'approved_score_unavailable' as const,
    ruleVersion: 'c01-v1',
    asOf: dataset.report.asOf,
    factor: null,
    candidateCount: candidates.length,
    scoredTaskCount: 0,
    skippedTaskCount: skipped.length,
    incomplete: true,
    grossPoints: null,
    people: [],
    tasks: [],
    skipped,
  };
}
