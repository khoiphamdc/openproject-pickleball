import { points } from '../services/dashboard';
import type { PageProps } from './types';

const chartWidth = 1100;
const chartHeight = 360;
const chartTop = 54;
const chartBottom = 270;
const barWidth = 30;
const barGap = 9;

export default function Overview({ data }: PageProps) {
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
  const metrics = [
    { key: 'tasks' as const, label: 'Task Done', color: '#2563eb' },
    { key: 'subtasks' as const, label: 'Subtask Done', color: '#0f766e' },
    { key: 'bugs' as const, label: 'Bug Done', color: '#d97706' },
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
      <div className="overview-total-value">{points(preview.netPoints)} điểm tạm</div>
      <p className="muted">Dự án có {data.workItems.length} Epic, Story, Task, Subtask và Bug.</p>
    </div>

    <section className="overview-chart" aria-labelledby="overview-chart-title">
      <div className="overview-chart-heading">
        <div>
          <h2 id="overview-chart-title">Đã hoàn thành đến hiện tại theo thành viên</h2>
          <p className="muted">Số Task/Subtask Done, Bug Done đã xác nhận và điểm tạm đã đạt.</p>
        </div>
      </div>

      {completedPeople.length ? <>
        <div className="overview-chart-scroll">
          <svg className="overview-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-labelledby="overview-chart-title overview-chart-description">
            <desc id="overview-chart-description">Biểu đồ nhóm gồm Task Done, Subtask Done, Bug Done và điểm tạm theo thành viên.</desc>
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
                <text x={center} y={chartBottom + 31} className="overview-chart-person">{person.name}</text>
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
          <p>Điểm Task/Subtask = max(0, story points × hệ số thời hạn − tổng điểm trừ Bug hợp lệ). Done đúng hạn có hệ số 1,00 nên không bị trừ điểm thời hạn.</p>
          <p>Done sớm ít nhất 1 ngày: hệ số 1,05 · đúng hạn: 1,00 · trễ 1–2 ngày: 0,90 · trễ trên 2 ngày: 0,80.</p>
          <p>Bug Low: 0,5 · Medium: 1 · High: 2 · Critical: 4.</p>
          <p className="muted">Bug gắn trực tiếp làm con của Task/Subtask và assignee trùng người phụ trách mới được tính. Điểm đang hiển thị là điểm demo tạm tính theo dữ liệu hiện tại.</p>
        </section>
      </div>
    </details>
  </section>;
}
