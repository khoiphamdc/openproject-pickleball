export interface Task {
  id: number; subject: string; type: string; status: string; isExecutionUnit: boolean;
  currentAssigneeId: number | null; currentAssigneeName: string | null;
  dueDate: string | null; acceptedAt: string | null; storyPoints: number | null;
  parentId: number | null; epicId: number | null; epicSubject: string | null;
}
export interface Dashboard {
  report: { projectId: number; asOf: string };
  openProjectUrl: string | null;
  tasks: Task[];
  workItems: Array<{
    id: number; subject: string; type: string; status: string; parentId: number | null;
    epicId: number | null; epicSubject: string | null; currentAssigneeId: number | null;
    currentAssigneeName: string | null; dueDate: string | null; startDate: string | null;
    storyPoints: number | null; priority: string | null;
  }>;
  bugs: Array<{ id: number; subject: string; status: string; sourceTaskId: number | null; currentAssigneeId: number | null; currentAssigneeName: string | null; severity: 'Low' | 'Medium' | 'High' | 'Critical'; validated: boolean }>;
  preview: {
    ruleVersion: string; factor: number | null; grossPoints: number | null; netPoints: number | null;
    candidateCount: number; scoredTaskCount: number; skippedTaskCount: number;
    people: Array<{ userId: number; name: string | null; grossPoints: number; netPoints: number; bugPenalty: number; scoredBugPenalty: number; unscoredBugPenalty: number; bugCount: number; unscoredBugCount: number; taskCount: number }>;
  tasks: Array<{ workPackageId: number; userId: number; difficulty: number; factor: number; grossPoints: number; netPoints: number; bugCount: number; bugPenalty: number }>;
    skipped: Array<{ workPackageId: number; reasons: string[] }>;
  };
}

export async function loadDashboard(projectId: string, signal: AbortSignal): Promise<Dashboard> {
  const response = await fetch(`/api/dashboard?projectId=${encodeURIComponent(projectId)}`, { signal });
  if (!response.ok) throw new Error(`Không tải được dữ liệu (HTTP ${response.status}).`);
  return response.json() as Promise<Dashboard>;
}

export const points = (value: number | null | undefined) => value == null ? 'N/A' : value.toFixed(2);
export const reasons: Record<string, string> = {
  missing_current_assignee: 'Chưa có người được giao',
  missing_story_points: 'Thiếu story points',
  unsupported_story_points: 'Story points không thuộc thang 1, 2, 3, 5, 8',
  parent_task_not_done: 'Task cha chưa Done hoặc không tìm thấy',
  approved_baseline_unavailable: 'Chưa kết nối baseline được duyệt',
  acceptance_evidence_unavailable: 'Chưa kết nối thời điểm nghiệm thu',
  baseline_unavailable: 'Thiếu hạn gốc để tính hệ số thời hạn',
  defect_attribution_unavailable: 'Chưa kết nối dữ liệu bug đã xác nhận',
};

export function peopleSummary(data: Dashboard) {
  const people = new Map<number, { id: number; name: string; tasksDone: number; subtasksDone: number; tasksScored: number; subtasksScored: number; taskPoints: number; subtaskPoints: number; onTime: number }>();
  const scores = new Map(data.preview.tasks.map(item => [item.workPackageId, item]));
  for (const task of data.tasks) {
    if (task.currentAssigneeId == null) continue;
    const type = task.type.trim().toUpperCase();
    if (type !== 'TASK' && type !== 'SUBTASK') continue;
    const id = task.currentAssigneeId;
    const person = people.get(id) ?? { id, name: task.currentAssigneeName || 'Người dùng', tasksDone: 0, subtasksDone: 0, tasksScored: 0, subtasksScored: 0, taskPoints: 0, subtaskPoints: 0, onTime: 0 };
    if (task.status.trim().toUpperCase() === 'DONE') {
      if (type === 'TASK') person.tasksDone++; else person.subtasksDone++;
      if (task.isExecutionUnit) person.onTime++;
    }
    const score = scores.get(task.id);
      if (score?.userId === id) {
      if (type === 'TASK') { person.tasksScored++; person.taskPoints += score.netPoints; }
      else { person.subtasksScored++; person.subtaskPoints += score.netPoints; }
    }
    people.set(id, person);
  }
  return [...people.values()].sort((a, b) => a.id - b.id);
}
