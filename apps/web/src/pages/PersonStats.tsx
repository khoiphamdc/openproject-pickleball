import { peopleSummary, points } from '../services/dashboard';
import type { PageProps } from './types';

export default function PersonStats({ data }: PageProps) {
  const people = peopleSummary(data);
  const tasksById = new Map(data.tasks.map(task => [task.id, task]));
  const bugStats = new Map<number, { confirmed: number; tasks: Set<number>; bugs: number }>();
  for (const bug of data.bugs) {
    const task = bug.sourceTaskId == null ? null : tasksById.get(bug.sourceTaskId);
    const ownerIds = new Set([task?.currentAssigneeId, bug.currentAssigneeId].filter((id): id is number => id != null));
    for (const ownerId of ownerIds) {
      const stat = bugStats.get(ownerId) ?? { confirmed: 0, tasks: new Set<number>(), bugs: 0 };
      if (bug.validated && bug.currentAssigneeId === ownerId) stat.confirmed++;
      if (task?.currentAssigneeId === ownerId && task.id != null) stat.tasks.add(task.id);
      if (bug.currentAssigneeId === ownerId) stat.bugs++;
      bugStats.set(ownerId, stat);
    }
  }
  return <section><h2>Thống kê theo người</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Người</th><th>Task Done</th><th>Subtask Done</th><th>Task đã tính</th><th>Điểm Task</th><th>Subtask đã tính</th><th>Điểm Subtask</th><th>Tổng điểm tạm</th><th>Bug đã xác nhận</th><th>Task có bug</th><th>Bug / task</th></tr></thead><tbody>{people.map(person => { const bugs = bugStats.get(person.id) ?? { confirmed: 0, tasks: new Set<number>(), bugs: 0 }; const done = person.tasksDone + person.subtasksDone; return <tr key={person.id}><td>{person.name} (id {person.id})</td><td>{person.tasksDone}</td><td>{person.subtasksDone}</td><td>{person.tasksScored}</td><td>{points(person.taskPoints)}</td><td>{person.subtasksScored}</td><td>{points(person.subtaskPoints)}</td><td>{points(data.preview.people.find(p => p.userId === person.id)?.netPoints ?? 0)}</td><td>{bugs.confirmed}</td><td>{bugs.tasks.size}</td><td>{done ? `${(bugs.bugs / done).toFixed(2)} (${bugs.bugs}/${done})` : 'Chưa có mẫu số'}</td></tr>; })}</tbody></table></div>{!people.length && <p>Không có người được giao.</p>}<p className="muted">Điểm demo tạm · Task cha không cộng trùng Subtask. Bug được tính khi có quan hệ cha–con tới Task/Subtask nguồn và chưa bị hủy; mức trừ lấy theo Priority bug. Tỷ lệ bug dùng tổng Task và Subtask Done làm mẫu số.</p></section>;
}
