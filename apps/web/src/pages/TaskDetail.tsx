import { points, reasons } from '../services/dashboard';
import type { PageProps } from './types';

export default function TaskDetail({ data }: PageProps) {
  const scores = new Map(data.preview.tasks.map(item => [item.workPackageId, item]));
  const skipped = new Map(data.preview.skipped.map(item => [item.workPackageId, item]));
  const tasks = new Map(data.tasks.map(item => [item.id, item]));
  const groups = new Map<string, typeof data.tasks>();
  for (const task of data.tasks) {
    const key = task.epicId == null ? 'unknown' : String(task.epicId);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return <section><h2>Chi tiết task / bug</h2>
    <h3>Bug</h3>{data.bugs.length ? <ul>{data.bugs.map(bug => <li key={bug.id}>#{bug.id} — {bug.subject} · {bug.status} · Nguồn chưa xác nhận</li>)}</ul> : <p>Không có bug.</p>}
    <h3>Chưa tính ({data.preview.skippedTaskCount})</h3>{data.preview.skipped.length ? <ul>{data.preview.skipped.map(item => <li key={item.workPackageId}>#{item.workPackageId} — {tasks.get(item.workPackageId)?.subject}: {item.reasons.map(reason => reasons[reason] || reason).join('; ')}</li>)}</ul> : <p>Không có công việc bị bỏ qua.</p>}
    <h3>Task / Subtask theo Epic</h3>{[...groups.entries()].map(([epicId, items]) => <section key={epicId}><h4>{items[0].epicSubject ?? 'Không xác định Epic'}{epicId !== 'unknown' ? ` (#${epicId})` : ''}</h4>{items.map(task => { const score = scores.get(task.id); const omitted = skipped.get(task.id); return <article className="task-card" key={task.id}><h3>#{task.id} — {task.subject}</h3><p>{task.type} · Trạng thái: {task.status} · Cha: {task.parentId ?? '—'} · {task.currentAssigneeName || 'Chưa giao'} · Hạn: {task.dueDate || 'N/A'} · Story points: {task.storyPoints ?? 'N/A'}</p><p>{score ? <>Điểm tạm: {score.difficulty} × {score.factor.toFixed(2)} − {score.bugPenalty.toFixed(2)} bug = <strong>{points(score.netPoints)}</strong></> : omitted ? <>Chưa tính: {omitted.reasons.map(reason => reasons[reason] || reason).join('; ')}</> : 'Không thuộc phạm vi tính tạm'}{data.openProjectUrl && <> · <a href={`${data.openProjectUrl}/work_packages/${task.id}`} target="_blank" rel="noreferrer">Xem trên OpenProject</a></>}</p></article>; })}</section>)}
  </section>;
}
