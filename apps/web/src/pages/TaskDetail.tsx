import { EmptyState } from '../components/common';
import { formatDate, formatScore, openProjectTaskUrl, userName } from '../services/mockData';
import { scoreTask } from '../services/scoring';
import type { PageProps } from './types';

export default function TaskDetail({ tasks, run, meta }: PageProps) {
  if (tasks.length === 0) {
    return (
      <section>
        <h2>Chi tiết task / bug</h2>
        <EmptyState text="Chưa có task nào trong kỳ đã chọn." />
      </section>
    );
  }

  return (
    <section>
      <h2>Chi tiết task / bug</h2>
      <p className="muted">
        Bug liệt kê ở đây là bug gắn với task người đó phụ trách, không có nghĩa là người đó gây
        ra bug. Mã task trong dữ liệu mẫu là mã hư cấu, link OpenProject chỉ là link mẫu trong
        chế độ mock, có thể không mở ra task thật.
      </p>

      {run.skipped.length > 0 ? (
        <div>
          <h3>Task bị bỏ qua (không tính điểm, không tự cho 0)</h3>
          <ul>
            {run.skipped.map((skipped) => (
              <li key={skipped.workPackageId}>
                Task #{skipped.workPackageId}: {skipped.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tasks.map((task) => {
        const result = scoreTask(task);
        const owners = task.contributions.map((c) => userName(c.userId)).join(', ');
        return (
          <article key={task.workPackageId} className="task-card">
            <h3>
              #{task.workPackageId} — {task.subject}
            </h3>
            <p>
              Người phụ trách: {owners || '—'} • Hạn: {formatDate(task.baselineDueDate)} • Nghiệm
              thu: {formatDate(task.acceptedAt)} • Trạng thái: {task.status}
            </p>
            <p>
              {result.ok ? (
                <>
                  Độ khó {result.breakdown.base} x hệ số {result.breakdown.factor.toFixed(2)} -
                  trừ bug {formatScore(result.breakdown.penalty)} ={' '}
                  <strong>{formatScore(result.taskScore)} điểm</strong>
                </>
              ) : (
                <>Không tính được: {result.reason}</>
              )}{' '}
              •{' '}
              <a href={openProjectTaskUrl(task.workPackageId)} target="_blank" rel="noreferrer">
                Xem trên OpenProject (mock)
              </a>
            </p>
            <p className="muted">Dữ liệu tới: {formatDate(meta.asOf)} • Nguồn: {meta.source}</p>
            {task.bugs.length === 0 ? (
              <p>Không có bug gắn với task này.</p>
            ) : (
              <ul>
                {task.bugs.map((bug) => (
                  <li key={bug.bugId}>
                    Bug #{bug.bugId} — mức {bug.severity} —{' '}
                    {bug.validated ? 'đã xác thực, có trừ điểm' : 'chưa xác thực, không trừ điểm'}
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </section>
  );
}
