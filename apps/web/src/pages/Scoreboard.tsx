import { peopleSummary, points } from '../services/dashboard';
import type { PageProps } from './types';

export default function Scoreboard({ data }: PageProps) {
  const ranked = [...data.preview.people].sort((a, b) => b.netPoints - a.netPoints || a.userId - b.userId);
  const people = peopleSummary(data);
  return <section><h2>Bảng điểm tạm</h2>{ranked.length ? <><table className="data-table table-narrow"><thead><tr><th>Hạng</th><th>Người</th><th>Điểm tạm</th><th>Task đã tính</th><th>Subtask đã tính</th></tr></thead><tbody>{ranked.map(person => { const counts = people.find(p => p.id === person.userId); return <tr key={person.userId}><td>{ranked.findIndex(p => p.netPoints === person.netPoints) + 1}</td><td>{person.name || 'Người dùng'} (id {person.userId})</td><td>{points(person.netPoints)}</td><td>{counts?.tasksScored ?? 'N/A'}</td><td>{counts?.subtasksScored ?? 'N/A'}</td></tr>; })}</tbody></table><h3>Biểu đồ điểm</h3>{ranked.map(person => <div className="bar-row" key={person.userId}><span className="bar-label">{person.name || 'Người dùng'} (id {person.userId})</span><span className="bar-track"><span className="bar-fill" style={{ width: `${ranked[0].netPoints > 0 ? person.netPoints / ranked[0].netPoints * 100 : 0}%` }} /></span><span className="bar-value">{points(person.netPoints)}</span></div>)}</> : <p>Chưa có điểm tạm.</p>}</section>;
}
