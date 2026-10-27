import { EmptyState, ScoreBreakdownTable } from '../components/common';
import { formatDate, formatScore, userName } from '../services/mockData';
import type { PageProps } from './types';

export default function Overview({ tasks, run, meta }: PageProps) {
  if (tasks.length === 0) {
    return (
      <section>
        <EmptyState text="Thử chọn kỳ khác, hoặc kiểm tra lại dữ liệu mẫu." />
      </section>
    );
  }

  const ranked = [...run.totals].sort((a, b) => b.score - a.score || a.userId - b.userId);

  return (
    <section>
      <div className="overview-total">
        <div className="overview-total-value">{formatScore(run.totalScore)} điểm</div>
        <p className="muted">
          {run.scoredTaskCount} task đã tính • Dự án {meta.projectName} (id {meta.projectId}) • Kỳ{' '}
          {formatDate(meta.from)} – {formatDate(meta.toExclusive)}
        </p>
      </div>

      {run.incomplete ? (
        <div className="state-box state-error">
          Kỳ này thiếu dữ liệu, tổng trên chưa tính các task bị bỏ qua. Xem lý do ở trang Chi
          tiết task / bug.
        </div>
      ) : null}

      <h3>Xếp hạng</h3>
      <ol className="rank-list">
        {ranked.map((person) => {
          const rank = ranked.findIndex((p) => p.score === person.score) + 1;
          return (
            <li key={person.userId}>
              <span>
                {rank}. {userName(person.userId)} — {person.taskCount} task
              </span>
              <strong>{formatScore(person.score)}</strong>
            </li>
          );
        })}
      </ol>

      <h3>Điểm từng task</h3>
      <p className="muted">
        Điểm task = lớn nhất trong (0, độ khó × hệ số hạn − trừ bug đã xác thực). Quy tắc{' '}
        {run.ruleVersion}, giờ Việt Nam.
      </p>
      <ScoreBreakdownTable tasks={tasks} />
    </section>
  );
}
