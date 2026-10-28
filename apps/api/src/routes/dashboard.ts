import { Router } from 'express';
import { openProjectReportDatasetProvider } from '../openproject/report-provider.js';
import { currentScorePreview } from '../scoring/current-preview.js';
import { env } from '../config/env.js';

export const dashboardRouter = Router();

// This local, read-only preview does not establish an approved score.
dashboardRouter.get(['/dashboard', '/scores'], async (req, res, next) => {
  const raw = typeof req.query.projectId === 'string' ? req.query.projectId : '';
  const projectId = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(projectId)) {
    return res.status(400).json({ error: 'INVALID_PROJECT_ID', message: 'ID dự án phải là số nguyên dương.' });
  }
  try {
    const dataset = await openProjectReportDatasetProvider(projectId);
    if (!dataset) return res.status(404).json({ error: 'REPORT_DATA_NOT_FOUND' });
    const preview = currentScorePreview(dataset);
    if (req.path === '/scores') return res.json({ report: dataset.report, preview });
    const base = new URL(env.openprojectUrl);
    base.username = ''; base.password = ''; base.search = ''; base.hash = '';
    const openProjectUrl = ['http:', 'https:'].includes(base.protocol) ? base.toString().replace(/\/$/, '') : null;
    return res.json({
      report: dataset.report,
      openProjectUrl,
      tasks: dataset.tasks.map(task => ({
        id: task.id, subject: task.subject, type: task.type, status: task.status,
        isExecutionUnit: task.isExecutionUnit, currentAssigneeId: task.currentAssigneeId,
        currentAssigneeName: task.currentAssigneeName, dueDate: task.dueDate,
        storyPoints: task.storyPoints,
      })),
      bugs: dataset.defects.map(bug => ({ id: bug.id, subject: bug.subject, status: bug.status })),
      preview,
    });
  } catch (error) { return next(error); }
});
