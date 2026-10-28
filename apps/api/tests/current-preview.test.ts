import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentScorePreview } from '../src/scoring/current-preview.js';
import { scoreRun } from '../src/scoring/score.js';
import type { ReportDataset } from '../src/analytics/report.js';
import { MOCK_TASKS } from '../../web/src/services/mockData.js';

test('original scoring rules produce the documented sample results', () => {
  const result = scoreRun({ tasks: MOCK_TASKS });
  assert.deepEqual(result.totals.map(p => [p.userId, Number(p.score.toFixed(2))]), [[1, 6.2], [2, 6.1], [3, 3]]);
});

test('demo preview scores current fields only when acceptance history exists', () => {
  const data: ReportDataset = { report: { projectId: 6, from: '2026-01-01', toExclusive: '2027-01-01', asOf: '2026-10-28T00:00:00Z', timezone: 'Asia/Ho_Chi_Minh', ruleVersion: 'c01-v1' }, tasks: [{ id: 1, type: 'Task', isExecutionUnit: true, status: 'Done', ownerAtBaselineId: null, acceptedAt: '2026-10-28T00:00:00Z', dueDate: '2026-10-28', storyPoints: 3, currentAssigneeId: 1 }], defects: [] };
  const result = currentScorePreview(data);
  assert.equal(result.grossPoints, 3);
  assert.equal(result.scoredTaskCount, 1);
  assert.equal(result.skippedTaskCount, 0);
});
