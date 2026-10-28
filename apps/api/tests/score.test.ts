import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTask, scoreRun, type TaskScoreInput } from '../src/scoring/score.js';

function task(overrides: Partial<TaskScoreInput> = {}): TaskScoreInput {
  return {
    workPackageId: 42,
    isExecutionUnit: true,
    status: 'done',
    difficulty: 5,
    baselineDueDate: '2026-10-28',
    acceptedAt: '2026-10-28T16:00:00+07:00',
    contributions: [{ userId: 6, share: 1 }],
    bugs: [],
    ...overrides,
  };
}

test('scores only accepted execution units and allocates the approved shares', () => {
  const result = scoreTask(task({
    contributions: [{ userId: 6, share: 0.75 }, { userId: 7, share: 0.25 }],
    bugs: [
      { bugId: 101, severity: 'Low', validated: true },
      { bugId: 102, severity: 'Critical', validated: false },
      { bugId: 101, severity: 'Low', validated: true },
      { bugId: 103, severity: 'High', validated: true, isDuplicate: true },
    ],
  }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.taskScore, 4.5);
  assert.deepEqual(result.allocations, [
    { userId: 6, score: 3.375 },
    { userId: 7, score: 1.125 },
  ]);
  assert.equal(result.breakdown.penalty, 0.5);
});

test('rejects partial, duplicate, or invalid contribution allocations', () => {
  for (const contributions of [
    [{ userId: 6, share: 0.8 }],
    [{ userId: 6, share: 0.5 }, { userId: 6, share: 0.5 }],
    [{ userId: 0, share: 1 }],
  ]) {
    const result = scoreTask(task({ contributions }));
    assert.deepEqual(result, {
      ok: false,
      workPackageId: 42,
      reason: 'invalid-contribution-shares',
    });
  }
});

test('keeps invalid dates and unaccepted subtasks incomplete instead of assigning points', () => {
  assert.equal(scoreTask(task({ baselineDueDate: '2026-02-30' })).ok, false);
  assert.equal(scoreTask(task({ acceptedAt: 'not-a-date' })).ok, false);
  assert.deepEqual(scoreTask(task({ acceptedAt: null })), {
    ok: false,
    workPackageId: 42,
    reason: 'missing-accepted-at',
  });
});

test('a score run does not make an incomplete task look like a zero-point task', () => {
  const result = scoreRun({ tasks: [task({ baselineDueDate: null })] });
  assert.equal(result.incomplete, true);
  assert.equal(result.scoredTaskCount, 0);
  assert.deepEqual(result.skipped, [{ workPackageId: 42, reason: 'missing-due-date' }]);
});
