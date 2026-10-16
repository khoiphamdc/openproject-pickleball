export type Role = 'PM' | 'BA' | 'BE' | 'FE' | 'Tester';
export type Workstream = 'BE' | 'FE' | 'BA' | 'QA' | 'PM';

export interface TaskContext {
  type: 'Epic' | 'Story' | 'Task' | 'Subtask' | 'Bug';
  status: string;
  currentAssigneeId: number | null;
  workstream: Workstream | null;
  businessOwnerId: number | null;
  reviewerIds: number[];
  parentId: number | null;
}

export interface ActorContext {
  userId: number;
  role: Role;
}

export function allowedFields(
  actor: ActorContext,
  task: TaskContext,
  requestedFields: string[]
): string[] {
  if (actor.role === 'PM') {
    return requestedFields.filter(f => f !== 'delete');
  }

  if (actor.role === 'BA') {
    if (
      (task.type === 'Epic' || task.type === 'Story') &&
      task.businessOwnerId === actor.userId
    ) {
      return requestedFields.filter(f =>
        ['subject', 'description', 'acceptanceCriteria'].includes(f)
      );
    }
    return [];
  }

  const roleToWorkstream: Record<string, Workstream> = {
    BE: 'BE', FE: 'FE', Tester: 'QA',
  };
  const expected = roleToWorkstream[actor.role];
  if (
    task.workstream === expected &&
    task.currentAssigneeId === actor.userId &&
    ['Task', 'Subtask', 'Bug'].includes(task.type)
  ) {
    return requestedFields.filter(f =>
      ['description', 'status', 'comment'].includes(f)
    );
  }

  return [];
}