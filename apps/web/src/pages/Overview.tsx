import { useState } from 'react';
import { points, reasons } from '../services/dashboard';
import type { PageProps } from './types';

const chartWidth = 1100;
const chartHeight = 360;
const chartTop = 54;
const chartBottom = 270;
const barWidth = 30;
const barGap = 9;
const severityPenalty = { Low: 0.5, Medium: 1, High: 2, Critical: 4 } as const;
const severityNames = ['Low', 'Medium', 'High', 'Critical'] as const;

function deadlineLabel(factor: number) {
  if (factor > 1) return 'sớm ít nhất 1 ngày';
  if (factor === 1) return 'đúng hạn';
  return factor === 0.9 ? 'trễ 1–2 ngày' : 'trễ trên 2 ngày';
}

function shortDate(value: string | null | undefined) {
  if (!value) return 'thiếu ngày';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export default function Overview({ data }: PageProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const { preview } = data;
  const peopleById = new Map<number, { id: number; name: string; tasks: number; subtasks: number }>();
  const completedById = new Map<number, { id: number; name: string; tasks: number; subtasks: number; bugs: number; points: number }>();
  const addPerson = (map: Map<number, { id: number; name: string; tasks: number; subtasks: number }>, id: number, name: string | null) => {
    const person = map.get(id) ?? { id, name: name || `Người dùng ${id}`, tasks: 0, subtasks: 0 };
    map.set(id, person);
    return person;
  };
  for (const item of data.workItems) {
    const type = item.type.trim().toUpperCase();
    if ((type !== 'TASK' && type !== 'SUBTASK') || item.currentAssigneeId == null) continue;
    const person = addPerson(peopleById, item.currentAssigneeId, item.currentAssigneeName);
    if (type === 'TASK') person.tasks++; else person.subtasks++;
    if (item.status.trim().toUpperCase() === 'DONE') {
      const done = completedById.get(item.currentAssigneeId) ?? { id: item.currentAssigneeId, name: person.name, tasks: 0, subtasks: 0, bugs: 0, points: 0 };
      if (type === 'TASK') done.tasks++; else done.subtasks++;
      completedById.set(item.currentAssigneeId, done);
    }
  }
  for (const bug of data.bugs) {
    if (!bug.validated || bug.currentAssigneeId == null) continue;
    const person = completedById.get(bug.currentAssigneeId) ?? { id: bug.currentAssigneeId, name: bug.currentAssigneeName || `Người dùng ${bug.currentAssigneeId}`, tasks: 0, subtasks: 0, bugs: 0, points: 0 };
    person.bugs++;
    completedById.set(bug.currentAssigneeId, person);
  }
  for (const scored of preview.people) {
    const person = completedById.get(scored.userId) ?? { id: scored.userId, name: scored.name || `Người dùng ${scored.userId}`, tasks: 0, subtasks: 0, bugs: 0, points: 0 };
    person.points = scored.netPoints;
    completedById.set(scored.userId, person);
  }
  const people = [...peopleById.values()].sort((a, b) => a.id - b.id);
  const completedPeople = [...completedById.values()].sort((a, b) => a.id - b.id);
  const selectedPerson = completedPeople.find(person => person.id === selectedPersonId) ?? null;
  const selectedPersonTasks = selectedPerson ? data.tasks.filter(task =>
    task.currentAssigneeId === selectedPerson.id &&
    ['TASK', 'SUBTASK'].includes(task.type.trim().toUpperCase()) &&
    task.status.trim().toUpperCase() === 'DONE'
  ) : [];
  const selectedScoredRows = selectedPerson ? preview.tasks
    .filter(row => row.userId === selectedPerson.id)
    .map(row => {
      const task = data.tasks.find(item => item.id === row.workPackageId);
      const type = task?.type.trim().toUpperCase() === 'SUBTASK' ? 'SUBTASK' : 'TASK';
      const parent = task?.parentId == null ? undefined : data.tasks.find(item => item.id === task.parentId);
      const linkedBugs = data.bugs.filter(bug => bug.validated && bug.sourceTaskId === row.workPackageId && bug.currentAssigneeId === selectedPerson.id);
      const severityCounts = Object.fromEntries(severityNames.map(severity => [severity, linkedBugs.filter(bug => bug.severity === severity).length])) as Record<typeof severityNames[number], number>;
      return { ...row, task, type, severityCounts, effectiveAcceptedAt: type === 'SUBTASK' ? parent?.acceptedAt ?? task?.acceptedAt : task?.acceptedAt };
    }) : [];
  const selectedPersonScore = selectedPerson ? preview.people.find(person => person.userId === selectedPerson.id) : undefined;
  const selectedPersonBugs = selectedPerson ? data.bugs.filter(bug => {
    const source = bug.sourceTaskId == null ? undefined : data.tasks.find(task => task.id === bug.sourceTaskId);
    return bug.currentAssigneeId === selectedPerson.id || source?.currentAssigneeId === selectedPerson.id;
  }).map(bug => {
    const source = bug.sourceTaskId == null ? undefined : data.tasks.find(task => task.id === bug.sourceTaskId);
    const score = preview.tasks.find(row => row.workPackageId === bug.sourceTaskId);
    const skipped = preview.skipped.find(row => row.workPackageId === bug.sourceTaskId);
    const isCancelled = bug.status.trim().toUpperCase() === 'CANCELLED';
    const validForPenalty = bug.validated && !isCancelled && source != null &&
      ['TASK', 'SUBTASK'].includes(source.type.trim().toUpperCase()) &&
      source.currentAssigneeId != null && source.currentAssigneeId === bug.currentAssigneeId;
    let reason: string;
    let deducted = 0;
    if (isCancelled) reason = 'Bug đã hủy nên bị loại khỏi tính điểm';
    else if (!source || !['TASK', 'SUBTASK'].includes(source.type.trim().toUpperCase())) reason = 'Bug chưa gắn trực tiếp với Task/Subtask nguồn hợp lệ';
    else if (source.currentAssigneeId !== bug.currentAssigneeId) reason = 'Assignee Bug chưa trùng người phụ trách Task/Subtask nguồn';
    else if (validForPenalty && score) {
      deducted = severityPenalty[bug.severity];
      reason = `Đã được tính trừ ${points(deducted)} điểm`;
    } else if (validForPenalty) {
      deducted = severityPenalty[bug.severity];
      reason = source.status.trim().toUpperCase() !== 'DONE'
        ? `Đã trừ vào tổng điểm dù nguồn đang ${source.status}`
        : !source.isExecutionUnit
          ? 'Đã trừ vào tổng điểm; Task cha có Subtask nên không được tính điểm nền riêng'
          : skipped
            ? `Đã trừ vào tổng điểm; nguồn thiếu dữ liệu điểm nền: ${skipped.reasons.map(code => reasons[code] || code).join('; ')}`
            : 'Đã trừ trực tiếp vào tổng điểm thành viên';
    } else if (!bug.validated) reason = 'API chưa xác nhận đủ điều kiện quy Bug cho người phụ trách nguồn';
    else reason = 'Bug chưa đủ điều kiện tính trừ';
    return { bug, source, deducted, reason };
  }) : [];
  const selectedValidBugs = selectedPersonBugs.filter(item => item.bug.validated);
  const selectedScoredIds = new Set(selectedScoredRows.map(row => row.workPackageId));
  const selectedSkipped = selectedPerson ? preview.skipped
    .filter(row => selectedPersonTasks.some(task => task.id === row.workPackageId) && !selectedScoredIds.has(row.workPackageId))
    .map(row => ({ ...row, task: data.tasks.find(task => task.id === row.workPackageId) })) : [];
  const taskRows = selectedScoredRows.filter(row => row.type === 'TASK');
  const subtaskRows = selectedScoredRows.filter(row => row.type === 'SUBTASK');
  const taskNet = taskRows.reduce((sum, row) => sum + row.netPoints, 0);
  const subtaskNet = subtaskRows.reduce((sum, row) => sum + row.netPoints, 0);
  const taskGross = taskRows.reduce((sum, row) => sum + row.grossPoints, 0);
  const subtaskGross = subtaskRows.reduce((sum, row) => sum + row.grossPoints, 0);
  const taskPenalty = taskRows.reduce((sum, row) => sum + row.bugPenalty, 0);
  const subtaskPenalty = subtaskRows.reduce((sum, row) => sum + row.bugPenalty, 0);
  const unscoredBugPenalty = selectedPersonScore?.unscoredBugPenalty ?? 0;
  const memberNetPoints = selectedPerson ? Math.max(0, taskNet + subtaskNet - unscoredBugPenalty) : 0;
  const doneCount = selectedPersonTasks.length;
  const bugRate = doneCount ? selectedValidBugs.length / doneCount * 100 : null;
  const metrics = [
    { key: 'tasks' as const, label: 'Task Done', color: '#2563eb' },
    { key: 'subtasks' as const, label: 'Subtask Done', color: '#0f766e' },
    { key: 'bugs' as const, label: 'Bug hợp lệ', color: '#d97706' },
    { key: 'points' as const, label: 'Điểm đã đạt', color: '#7c3aed' },
  ];
  const maxByMetric = metrics.map(metric => Math.max(1, ...completedPeople.map(person => person[metric.key])));
  const barsPerGroup = barWidth * metrics.length + barGap * (metrics.length - 1);
  const workloadMetrics = [
    { key: 'tasks' as const, label: 'Task', color: '#2563eb' },
    { key: 'subtasks' as const, label: 'Subtask', color: '#0f766e' },
  ];
  const workloadMax = workloadMetrics.map(metric => Math.max(1, ...people.map(person => person[metric.key])));
  const workloadBars = barWidth * workloadMetrics.length + barGap;
  const projectTypes = [
    { key: 'EPIC', label: 'Epic', color: '#7c3aed' },
    { key: 'TASK', label: 'Task', color: '#2563eb' },
    { key: 'SUBTASK', label: 'Subtask', color: '#0f766e' },
  ];
  const projectCounts = projectTypes.map(type => ({ ...type, count: data.workItems.filter(item => item.type.trim().toUpperCase() === type.key).length }));
  const chartRange = chartBottom - chartTop;

  return <section>
    <div className="overview-total">
      <div className="overview-total-value">{points(preview.netPoints)} điểm </div>
      <p className="muted">Dự án có {data.workItems.length} Epic, Story, Task, Subtask và Bug.</p>
    </div>

    <section className="overview-chart" aria-labelledby="overview-chart-title">
      <div className="overview-chart-heading">
        <div>
          <h2 id="overview-chart-title">Đã hoàn thành đến hiện tại theo thành viên</h2>
          <p className="muted">Số Task/Subtask Done, Bug hợp lệ được giao hiện tại và điểm . Bấm tên thành viên để xem cách tính điểm.</p>
        </div>
      </div>

      {completedPeople.length ? <>
        <div className="overview-chart-scroll">
          <svg className="overview-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="group" aria-labelledby="overview-chart-title overview-chart-description">
            <desc id="overview-chart-description">Biểu đồ nhóm gồm Task Done, Subtask Done, Bug hợp lệ và điểm theo thành viên.</desc>
            {[0, 0.5, 1].map(level => {
              const y = chartBottom - chartRange * level;
              return <line key={level} x1="24" x2={chartWidth - 24} y1={y} y2={y} className="overview-chart-gridline" />;
            })}

            {completedPeople.map((person, personIndex) => {
              const center = chartWidth / completedPeople.length * personIndex + chartWidth / completedPeople.length / 2;
              const groupStart = center - barsPerGroup / 2;
              return <g key={person.id}>
                {metrics.map((metric, metricIndex) => {
                  const value = person[metric.key];
                  const barHeight = value === 0 ? 0 : Math.max(4, (value / maxByMetric[metricIndex]) * chartRange);
                  const x = groupStart + metricIndex * (barWidth + barGap);
                  const y = chartBottom - barHeight;
                  return <g key={metric.key}>
                    <title>{`${person.name}: ${metric.label} ${metric.key === 'points' ? points(value) : value}`}</title>
                    <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="4" fill={metric.color} />
                    <text x={x + barWidth / 2} y={Math.max(18, y - 8)} className="overview-chart-value">
                      {metric.key === 'points' ? value.toFixed(1) : value}
                    </text>
                  </g>;
                })}
                <g
                  className={`overview-chart-person-hit${selectedPersonId === person.id ? ' is-selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Xem thống kê chi tiết của ${person.name}`}
                  aria-expanded={selectedPersonId === person.id}
                  onClick={() => setSelectedPersonId(current => current === person.id ? null : person.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPersonId(current => current === person.id ? null : person.id);
                    }
                  }}
                >
                  <text x={center} y={chartBottom + 31} className="overview-chart-person">{person.name}</text>
                </g>
              </g>;
            })}
          </svg>
        </div>

        <div className="overview-chart-legend" aria-label="Chú giải biểu đồ">
          {metrics.map(metric => <span className="overview-chart-legend-item" key={metric.key}>
            <i style={{ backgroundColor: metric.color }} aria-hidden="true" />{metric.label}
          </span>)}
        </div>
        <p className="muted overview-chart-note">Chiều cao cột được so sánh riêng theo từng chỉ số; số trên cột là giá trị thực.</p>
        {selectedPerson && <section className="member-score-detail" aria-labelledby="member-score-detail-title">
          <div className="member-score-detail-heading">
            <div><h3 id="member-score-detail-title">Chi tiết hoàn thành · {selectedPerson.name}</h3><p className="muted">Bug được tính theo người phụ trách công việc nguồn.</p></div>
            <button type="button" className="member-score-detail-close" onClick={() => setSelectedPersonId(null)} aria-label="Đóng chi tiết">Đóng</button>
          </div>
          <div className="member-score-metrics">
            <div><span>Task Done</span><strong>{selectedPersonTasks.filter(task => task.type.trim().toUpperCase() === 'TASK').length}</strong></div>
            <div><span>Subtask Done</span><strong>{selectedPersonTasks.filter(task => task.type.trim().toUpperCase() === 'SUBTASK').length}</strong></div>
            <div><span>Bug hợp lệ</span><strong>{selectedValidBugs.length}</strong></div>
            <div><span>Tỷ lệ Bug / đơn vị Done</span><strong>{bugRate === null ? '—' : `${bugRate.toFixed(1)}%`}</strong></div>
          </div>
          <p className="muted member-score-rate-note">Tỷ lệ = {selectedValidBugs.length} Bug hợp lệ ÷ {doneCount} Task/Subtask Done{bugRate === null ? ' (chưa có mẫu số)' : ` = ${bugRate.toFixed(1)}%`}.</p>
          <p className="muted member-score-rate-note">Bug hợp lệ theo mức độ: {severityNames.map(severity => `${severity} ${selectedValidBugs.filter(item => item.bug.severity === severity).length}`).join(' · ')}.</p>

          <h4>Điểm từng Task/Subtask đã đủ dữ liệu</h4>
          {selectedScoredRows.length ? <div className="table-scroll"><table className="member-score-table">
            <thead><tr><th>Công việc</th><th>Ngày nghiệm thu / hạn</th><th>Phép tính</th><th>Điểm</th></tr></thead>
            <tbody>{selectedScoredRows.map(row => <tr key={row.workPackageId}>
              <td>{row.type === 'SUBTASK' ? 'Subtask' : 'Task'} #{row.workPackageId}<br /><span className="muted">{row.task?.subject || 'Không có tiêu đề'}</span></td>
              <td>{shortDate(row.effectiveAcceptedAt)} / {shortDate(row.task?.dueDate)}<br /><span className="muted">{deadlineLabel(row.factor)} · hệ số {row.factor.toFixed(2)}</span></td>
              <td>max(0, {row.difficulty} × {row.factor.toFixed(2)} − {points(row.bugPenalty)}{row.bugCount ? ` · ${row.bugCount} Bug (${severityNames.filter(severity => row.severityCounts[severity] > 0).map(severity => `${row.severityCounts[severity]} ${severity} − ${points(row.severityCounts[severity] * severityPenalty[severity])} điểm`).join(', ')})` : ''})</td>
              <td>{points(row.netPoints)}</td>
            </tr>)}</tbody>
          </table></div> : <p>Chưa có Task/Subtask nào đủ dữ liệu để tính điểm.</p>}

          <div className="member-score-totals">
            <p><strong>Điểm Task:</strong> {points(taskNet)} ({taskRows.length} Task đã tính · điểm nền {points(taskGross)} · tổng Bug trừ {points(taskPenalty)}).</p>
            <p><strong>Điểm Subtask:</strong> {points(subtaskNet)} ({subtaskRows.length} Subtask đã tính · điểm nền {points(subtaskGross)} · tổng Bug trừ {points(subtaskPenalty)}).</p>
            <p><strong>Bug trừ ngoài điểm từng công việc:</strong> {points(unscoredBugPenalty)} ({selectedPersonScore?.unscoredBugCount ?? 0} Bug gắn với nguồn chưa có dòng điểm riêng).</p>
            <p className="member-score-total"><strong>Tổng điểm:</strong> max(0, {points(taskNet)} + {points(subtaskNet)} − {points(unscoredBugPenalty)}) = <strong>{points(memberNetPoints)}</strong></p>
          </div>
          <p className="muted member-score-rate-note">Mức trừ Bug: Low 0,5 · Medium 1 · High 2 · Critical 4. Bug hợp lệ bị trừ kể cả khi nguồn chưa Done; nếu nguồn chưa có dòng điểm riêng, khoản trừ áp dụng vào tổng điểm thành viên. Bug chỉ bị loại khi đã hủy, không gắn trực tiếp với Task/Subtask, assignee không trùng hoặc bị đánh dấu duplicate/not-a-bug. Tổng điểm thấp nhất là 0.</p>

          <h4>Kiểm tra Bug và khoản trừ</h4>
          {selectedPersonBugs.length ? <div className="table-scroll"><table className="member-score-table member-bug-audit-table">
            <thead><tr><th>Bug</th><th>Mức / trạng thái</th><th>Task/Subtask nguồn</th><th>Điểm trừ / lý do</th></tr></thead>
            <tbody>{selectedPersonBugs.map(({ bug, source, deducted, reason }) => <tr key={bug.id}>
              <td>#{bug.id}<br /><span className="muted">{bug.subject}</span></td>
              <td>{bug.severity}<br /><span className="muted">{bug.status}</span></td>
              <td>{source ? `${source.type} #${source.id}` : bug.sourceTaskId == null ? 'Chưa liên kết' : `#${bug.sourceTaskId} (không tìm thấy)`}<br /><span className="muted">{source?.subject || ''}</span></td>
              <td><strong>{deducted > 0 ? `−${points(deducted)} điểm` : '0,00 điểm'}</strong><br /><span className="muted">{reason}</span></td>
            </tr>)}</tbody>
          </table></div> : <p>Không có Bug liên quan đến thành viên này trong dữ liệu API.</p>}

          {selectedSkipped.length > 0 && <div className="member-score-skipped"><h4>Done nhưng chưa đủ dữ liệu tính điểm ({selectedSkipped.length})</h4><ul>{selectedSkipped.map(item => <li key={item.workPackageId}>#{item.workPackageId} · {item.task?.subject || 'Không có tiêu đề'} — {item.reasons.map(reason => reasons[reason] || reason).join('; ')}</li>)}</ul></div>}
        </section>}
      </> : <p>Chưa có công việc hoàn thành hoặc điểm để thống kê.</p>}
    </section>

    <section className="overview-chart" aria-labelledby="member-workload-title">
      <div className="overview-chart-heading"><h2 id="member-workload-title">Task/Subtask trên toàn dự án theo thành viên</h2><p className="muted">Đếm tất cả trạng thái theo người được giao hiện tại.</p></div>
      {people.length ? <div className="overview-chart-scroll"><svg className="overview-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Số Task và Subtask toàn dự án theo thành viên">
        {[0, 0.5, 1].map(level => <line key={level} x1="24" x2={chartWidth - 24} y1={chartBottom - chartRange * level} y2={chartBottom - chartRange * level} className="overview-chart-gridline" />)}
        {people.map((person, index) => {
          const width = chartWidth / people.length;
          const center = width * index + width / 2;
          const start = center - workloadBars / 2;
          return <g key={person.id}>{workloadMetrics.map((metric, metricIndex) => {
            const value = person[metric.key];
            const height = value ? Math.max(4, value / workloadMax[metricIndex] * chartRange) : 0;
            const x = start + metricIndex * (barWidth + barGap);
            const y = chartBottom - height;
            return <g key={metric.key}><title>{`${person.name}: ${metric.label} ${value}`}</title><rect x={x} y={y} width={barWidth} height={Math.max(2, height)} rx="4" fill={metric.color} /><text x={x + barWidth / 2} y={Math.max(18, y - 8)} className="overview-chart-value">{value}</text></g>;
          })}<text x={center} y={chartBottom + 31} className="overview-chart-person">{person.name}</text></g>;
        })}
      </svg></div> : <p>Chưa có thành viên được giao Task/Subtask.</p>}
      <div className="overview-chart-legend">{workloadMetrics.map(metric => <span className="overview-chart-legend-item" key={metric.key}><i style={{ backgroundColor: metric.color }} aria-hidden="true" />{metric.label}</span>)}</div>
    </section>

    <section className="overview-chart" aria-labelledby="project-counts-title">
      <div className="overview-chart-heading"><h2 id="project-counts-title">Số lượng công việc trong dự án</h2><p className="muted">Thống kê riêng Epic, Task và Subtask.</p></div>
      <div className="overview-project-counts" role="img" aria-label={projectCounts.map(item => `${item.label}: ${item.count}`).join(', ')}>
        {projectCounts.map(item => <div className="overview-project-count" key={item.key}>
          <div className="overview-project-count-bar" style={{ height: `${Math.max(6, item.count / Math.max(1, ...projectCounts.map(value => value.count)) * 190)}px`, backgroundColor: item.color }} />
          <strong>{item.count}</strong><span>{item.label}</span>
        </div>)}
      </div>
      <div className="overview-chart-legend" aria-label="Chú giải biểu đồ">{projectCounts.map(item => <span className="overview-chart-legend-item" key={item.key}><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span>)}</div>
    </section>

    <details className="overview-note">
      <summary>Note · Quy tắc điểm và dữ liệu chi tiết</summary>
      <div className="overview-note-content">
        <section>
          <h3>Quy tắc điểm demo</h3>
          <p>Điểm đơn vị đủ dữ liệu = max(0, story points × hệ số thời hạn − Bug gắn trực tiếp với đơn vị). Bug hợp lệ trên nguồn chưa có dòng điểm riêng vẫn trừ một lần vào tổng điểm người phụ trách, kể cả khi Task/Subtask chưa Done; tổng điểm không thấp hơn 0.</p>
          <p>Done sớm ít nhất 1 ngày: hệ số 1,05 · đúng hạn: 1,00 · trễ 1–2 ngày: 0,90 · trễ trên 2 ngày: 0,80.</p>
          <p>Bug Low: 0,5 · Medium: 1 · High: 2 · Critical: 4.</p>
          <p className="muted">Bug gắn trực tiếp làm con của Task/Subtask và assignee trùng người phụ trách mới được tính. Bug trên đơn vị đã chấm được trừ trong dòng điểm; Bug trên nguồn chưa có dòng điểm được trừ vào tổng thành viên và không cộng trùng. Điểm đang hiển thị là điểm tính theo dữ liệu hiện tại.</p>
        </section>
      </div>
    </details>
  </section>;
}
