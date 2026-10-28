import type { PageProps } from './types';

export default function WorkPackages({ data }: PageProps) {
  const epicGroups = new Map<string, typeof data.workItems>();
  const epicIds = new Set<number>();

  for (const item of data.workItems) {
    if (item.type.trim().toUpperCase() === 'EPIC') epicIds.add(item.id);
  }
  for (const item of data.workItems) {
    if (item.epicId == null) continue;
    const key = String(item.epicId);
    const group = epicGroups.get(key) ?? [];
    group.push(item);
    epicGroups.set(key, group);
  }
  for (const id of epicIds) {
    const group = epicGroups.get(String(id)) ?? [];
    if (!group.some(item => item.id === id)) {
      const epic = data.workItems.find(item => item.id === id);
      if (epic) group.unshift(epic);
    }
    epicGroups.set(String(id), group);
  }

  return <section className="overview-epics" aria-labelledby="overview-epics-title">
    <h2 id="overview-epics-title">Danh sách công việc theo Epic</h2>
    {!epicGroups.size ? <p>Chưa có Epic, Story, Task, Subtask hoặc Bug trong dự án.</p> : [...epicGroups.entries()].map(([epicId, items], index) => {
      const epicName = items[0].epicSubject || items[0].subject;
      return <details className="overview-epic" key={epicId} open={index === 0 || epicName.includes('Epic 2:')}>
        <summary>{epicName} (#{epicId}) · {items.length} công việc</summary>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>ID</th><th>Công việc</th><th>Loại</th><th>Trạng thái</th><th>Cha</th><th>Người được giao</th><th>Ưu tiên</th><th>Bắt đầu</th><th>Hạn</th><th>Story points</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <td>{data.openProjectUrl ? <a href={`${data.openProjectUrl}/work_packages/${item.id}`} target="_blank" rel="noreferrer">{item.id}</a> : item.id}</td>
            <td>{item.subject}</td><td>{item.type}</td><td>{item.status}</td><td>{item.parentId ?? '—'}</td>
            <td>{item.currentAssigneeName || 'Chưa giao'}</td><td>{item.priority || '—'}</td><td>{item.startDate || '—'}</td><td>{item.dueDate || '—'}</td><td>{item.storyPoints ?? '—'}</td>
          </tr>)}</tbody>
        </table></div>
      </details>;
    })}
  </section>;
}
