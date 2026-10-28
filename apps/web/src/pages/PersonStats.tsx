import { EmptyState, ScoreBreakdownTable } from '../components/common';
import { formatScore, userName } from '../services/mockData';
import { scoreTask } from '../services/scoring';
import type { PageProps } from './types';

export default function PersonStats({ tasks, run }: PageProps) {
  if (run.totals.length === 0) {
    return (
      <section>
        <h2>Thống kê theo người</h2>
        <EmptyState text="Chưa có người nào được tính điểm trong kỳ đã chọn." />
      </section>
    );
  }

  return (
    <section>
      <h2>Thống kê theo người</h2>
      <p className="muted">
        Tên hiển thị kèm id để khỏi nhầm 2 người trùng tên. Bug ở đây hiểu là bug gắn với task
        người đó phụ trách, không có nghĩa là người đó gây ra bug.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Người</th>
            <th className="num">Điểm</th>
            <th className="num">Task đã tính</th>
            <th className="num">Bug đã xác thực gắn với task</th>
            <th className="num">Task có bug</th>
            <th className="num">Bug / task</th>
            <th className="num">Đúng hạn trở lên</th>
          </tr>
        </thead>
        <tbody>
          {run.totals.map((person) => {
            const personTasks = tasks.filter((t) =>
              t.contributions.some((c) => c.userId === person.userId),
            );
            const scoredTasks = personTasks.filter((t) => scoreTask(t).ok);
            const validBugs = personTasks.flatMap((t) => t.bugs).filter((b) => b.validated).length;
            const tasksWithBugs = personTasks.filter((t) =>
              t.bugs.some((b) => b.validated),
            ).length;
            const onTime = scoredTasks.filter((t) => {
              const result = scoreTask(t);
              return result.ok && result.breakdown.diffDays <= 0;
            }).length;
            return (
              <tr key={person.userId}>
                <td>{userName(person.userId)}</td>
                <td className="num">
                  <strong>{formatScore(person.score)}</strong>
                </td>
                <td className="num">{person.taskCount}</td>
                <td className="num">{validBugs}</td>
                <td className="num">{tasksWithBugs}</td>
                <td className="num">
                  {personTasks.length > 0 ? (validBugs / personTasks.length).toFixed(2) : '—'}
                </td>
                <td className="num">
                  {scoredTasks.length > 0 ? `${onTime}/${scoredTasks.length}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {run.totals.map((person) => {
        const personTasks = tasks.filter((t) =>
          t.contributions.some((c) => c.userId === person.userId),
        );
        return (
          <div key={person.userId}>
            <h3>
              {userName(person.userId)} — {formatScore(person.score)} điểm
            </h3>
            <ScoreBreakdownTable tasks={personTasks} />
          </div>
        );
      })}
    </section>
  );
}
