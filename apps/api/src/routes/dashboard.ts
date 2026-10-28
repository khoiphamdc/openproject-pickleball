import { Router } from 'express';
import { openProjectDashboardDataProvider } from '../openproject/report-provider.js';
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
    const { dataset, workItems } = await openProjectDashboardDataProvider(projectId);
    if (!dataset) return res.status(404).json({ error: 'REPORT_DATA_NOT_FOUND' });
    const preview = currentScorePreview(dataset);
    const tasksById = new Map(dataset.tasks.map(task => [task.id, task]));
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
        storyPoints: task.storyPoints, acceptedAt: task.acceptedAt,
        parentId: task.parentId ?? null, epicId: task.epicId ?? null,
        epicSubject: task.epicSubject ?? null,
      })),
      workItems,
      bugs: dataset.defects.map(bug => {
        const source = bug.sourceTaskId === null ? null : tasksById.get(bug.sourceTaskId);
        return {
          id: bug.id,
          subject: bug.subject,
          status: bug.status ?? 'UNKNOWN',
          sourceTaskId: bug.sourceTaskId,
          currentAssigneeId: bug.currentAssigneeId ?? null,
          currentAssigneeName: bug.currentAssigneeName ?? null,
          severity: bug.severity,
          validated: source != null && source.currentAssigneeId === bug.currentAssigneeId && bug.status?.trim().toUpperCase() !== 'CANCELLED',
        };
      }),
      preview,
      webData: {
        meta: {
          projectId, projectName: null, from: null, toExclusive: null,
          asOf: dataset.report.asOf, timezone: dataset.report.timezone,
          openProjectBaseUrl: openProjectUrl,
        },
        tasks: dataset.tasks.map(task => ({
          workPackageId: task.id, subject: task.subject, type: task.type,
          status: task.status, isExecutionUnit: task.isExecutionUnit,
          currentAssigneeId: task.currentAssigneeId ?? null,
          currentAssigneeName: task.currentAssigneeName ?? null,
          currentDueDate: task.dueDate, currentStoryPoints: task.storyPoints ?? null,
          difficulty: null, baselineDueDate: null, acceptedAt: task.acceptedAt,
          contributions: null, bugs: null,
        })),
        run: {
          ruleVersion: preview.ruleVersion, incomplete: preview.incomplete,
          totalScore: preview.grossPoints, totals: null,
          scoredTaskCount: preview.scoredTaskCount, skipped: preview.skipped,
        },
      },
    });
  } catch (error) { return next(error); }
});
