import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.OPENPROJECT_BASE_URL = 'http://127.0.0.1:39999';
process.env.OPENPROJECT_API_TOKEN = 'test-placeholder';
process.env.OPENPROJECT_INSTANCE_ID = 'test';

test('reads each OpenProject page without inventing approved scoring data', async () => {
  const original = globalThis.fetch;
  const pages: number[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/activities')) return new Response(JSON.stringify({ total: 0, _embedded: { elements: [] } }));
    const page = Number(url.searchParams.get('offset'));
    pages.push(page);
    const ids = page === 1 ? Array.from({ length: 100 }, (_, i) => i + 1) : [101, 102];
    return new Response(JSON.stringify({ total: 102, _embedded: { elements: ids.map(id => ({
      id, subject: `Task ${id}`, storyPoints: 3, dueDate: '2026-10-30',
      _links: { type: { title: 'Task' }, status: { title: 'Done' }, assignee: { href: '/api/v3/users/2', title: 'Test user' } },
    })) } }));
  }) as typeof fetch;
  try {
    const { openProjectReportDatasetProvider } = await import('../src/openproject/report-provider.js');
    const result = await openProjectReportDatasetProvider(6);
    assert.ok(result);
    assert.deepEqual(pages, [1, 2]);
    assert.equal(result.tasks.length, 102);
    assert.equal(result.tasks[101].currentAssigneeId, 2);
    assert.equal(result.tasks[101].storyPoints, 3);
    assert.equal(result.tasks[101].baselineDifficulty, null);
    assert.equal(result.tasks[101].acceptedAt, null);
  } finally { globalThis.fetch = original; }
});

test('rejects missing pages rather than returning a partial report', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ total: 1, _embedded: { elements: [] } }))) as typeof fetch;
  try {
    const { openProjectReportDatasetProvider } = await import('../src/openproject/report-provider.js');
    await assert.rejects(openProjectReportDatasetProvider(6), /incomplete paginated result/);
  } finally { globalThis.fetch = original; }
});

test('reports connection failure and a missing project without exposing credentials', async () => {
  const originalFetch = globalThis.fetch;
  try {
    const { openProjectReportDatasetProvider } = await import('../src/openproject/report-provider.js');
    globalThis.fetch = (async () => { throw new Error('network failure'); }) as typeof fetch;
    await assert.rejects(openProjectReportDatasetProvider(6), (error: unknown) => {
      const e = error as { status?: number; code?: string; message?: string };
      return e.status === 503 && e.code === 'OPENPROJECT_UNAVAILABLE' && !e.message?.includes('test-placeholder');
    });
    globalThis.fetch = (async () => new Response('', { status: 404 })) as typeof fetch;
    await assert.rejects(openProjectReportDatasetProvider(6), (error: unknown) => (error as { status?: number }).status === 404);
  } finally { globalThis.fetch = originalFetch; }
});
