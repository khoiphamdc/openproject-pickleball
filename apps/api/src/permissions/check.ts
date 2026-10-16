import { allowedFields, ActorContext, TaskContext } from './matrix.js';

export function assertCanWrite(
  actor: ActorContext,
  task: TaskContext,
  requestedFields: string[]
): void {
  const allowed = allowedFields(actor, task, requestedFields);
  const forbidden = requestedFields.filter(f => !allowed.includes(f));
  if (forbidden.length > 0) {
    throw new Error(`FORBIDDEN_FIELDS: ${forbidden.join(', ')} for role ${actor.role}`);
  }
}

export function assertTransitionAllowed(
  type: string,
  from: string,
  to: string,
  actor: ActorContext,
  task: TaskContext
): void {
  const transitions: Record<string, Array<[string, string, string[]]>> = {
    Epic: [
      ['TO DO', 'DISCOVERY / PLANNING', ['PM', 'BA']],
      ['DISCOVERY / PLANNING', 'READY', ['PM']],
      ['READY', 'IN PROGRESS', ['PM', 'BA']],
      ['IN PROGRESS', 'REVIEW / ACCEPTANCE', ['PM', 'BA']],
      ['REVIEW / ACCEPTANCE', 'DONE', ['PM']],
      ['REVIEW / ACCEPTANCE', 'IN PROGRESS', ['PM']],
    ],
    Story: [
      ['TO DO', 'IN PROGRESS', ['PM', 'BA']],
      ['IN PROGRESS', 'INSPECT', ['PM', 'BA']],
      ['INSPECT', 'IN PROGRESS', ['PM', 'BA', 'Tester']],
      ['INSPECT', 'DONE', ['PM']],
    ],
    Task: [
      ['TO DO', 'IN PROGRESS', ['BE', 'FE', 'BA', 'Tester', 'PM']],
      ['IN PROGRESS', 'REVIEW', ['BE', 'FE', 'BA', 'Tester', 'PM']],
      ['REVIEW', 'DONE', ['PM', 'BA', 'Tester']],
      ['REVIEW', 'IN PROGRESS', ['PM', 'BA', 'Tester']],
    ],
    Subtask: [
      ['TO DO', 'IN PROGRESS', ['BE', 'FE', 'BA', 'Tester', 'PM']],
      ['IN PROGRESS', 'DONE', ['BE', 'FE', 'BA', 'Tester', 'PM']],
    ],
  };

  const edges = transitions[type] ?? [];
  const match = edges.find(
    ([f, t, roles]) => f === from && t === to && roles.includes(actor.role)
  );
  if (!match) {
    throw new Error(`INVALID_TRANSITION: ${type} ${from} -> ${to}`);
  }

  if (
    to === 'DONE' &&
    actor.userId === task.currentAssigneeId &&
    !['PM'].includes(actor.role)
  ) {
    throw new Error('CANNOT_SELF_REVIEW');
  }
}