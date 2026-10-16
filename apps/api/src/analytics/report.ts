export interface TaskSnapshot {
  id: number;
  type: string;
  isExecutionUnit: boolean;
  ownerAtBaselineId: number | null;
  acceptedAt: string | null;
  dueDate: string | null;
  status: string;
}

export function countCompletedTasks(tasks: TaskSnapshot[]): number {
  return tasks.filter(t =>
    t.isExecutionUnit &&
    t.status === 'DONE' &&
    t.acceptedAt !== null
  ).length;
}

export function countDefects(
  defects: Array<{ sourceTaskId: number; isDuplicate: boolean; isNotABug: boolean }>
): number {
  return defects.filter(d => !d.isDuplicate && !d.isNotABug).length;
}

export function defectRate(totalDefects: number, taskCount: number): number | null {
  if (taskCount === 0) return null;
  return totalDefects / taskCount;
}