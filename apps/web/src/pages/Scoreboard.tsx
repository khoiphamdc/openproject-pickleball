import { Bar, EmptyState } from '../components/common';
import { formatScore, userName } from '../services/mockData';
import type { PageProps } from './types';

export default function Scoreboard({ run }: PageProps) {
  const ranked = [...run.totals].sort((a, b) => b.score - a.score || a.userId - b.userId);
  const maxScore = Math.max(0, ...ranked.map((p) => p.score));

  if (ranked.length === 0) {
    return (
      <section>
        <h2>Bảng điểm</h2>
        <EmptyState text="Chưa có người nào được tính điểm trong kỳ đã chọn." />
      </section>
    );
  }

  return (
    <section>
      <h2>Bảng điểm</h2>
      <p className="muted">
        Xếp theo điểm giảm dần, bằng điểm thì xếp theo id tăng dần. Điểm này là điểm mẫu theo quy
        tắc {run.ruleVersion}, chưa phải điểm đã chốt — chốt điểm là việc của C04 khi có API thật.
      </p>
      <table className="data-table table-narrow">
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Người</th>
            <th className="num">Điểm</th>
            <th className="num">Task đã tính</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((person) => {
            // Hạng chung cho người bằng điểm.
            const rank = ranked.findIndex((p) => p.score === person.score) + 1;
            return (
              <tr key={person.userId}>
                <td>{rank}</td>
                <td>{userName(person.userId)}</td>
                <td className="num">
                  <strong>{formatScore(person.score)}</strong>
                </td>
                <td className="num">{person.taskCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Biểu đồ điểm</h3>
      {ranked.map((person) => (
        <Bar
          key={person.userId}
          label={userName(person.userId)}
          value={person.score}
          max={maxScore}
        />
      ))}
      <p className="muted">Tổng kỳ: {formatScore(run.totalScore)} điểm.</p>
    </section>
  );
}
