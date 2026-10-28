import { formatScore } from '../services/mockData';
import { scoreTask, type TaskInput } from '../services/scoring';

export function LoadingState({ text }: { text: string }) {
  return (
    <div className="state-box" role="status">
      Đang tải… {text}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="state-box">Không có dữ liệu. {text}</div>;
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="state-box state-error" role="alert">
      <div>{text}</div>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${width}%` }} />
      </span>
      <span className="bar-value">{formatScore(value)}</span>
    </div>
  );
}

// Bảng giải thích từng khoản cộng/trừ của 1 task, dùng chung cho nhiều trang.
export function ScoreBreakdownTable({ tasks }: { tasks: TaskInput[] }) {
  if (tasks.length === 0) {
    return <EmptyState text="Chưa có task nào trong kỳ đã chọn." />;
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Task</th>
          <th className="num">Độ khó</th>
          <th className="num">Bug đã tính</th>
          <th className="num">Trừ bug</th>
          <th className="num">Điểm task</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const result = scoreTask(task);
          if (!result.ok) {
            return (
              <tr key={task.workPackageId}>
                <td>
                  #{task.workPackageId} — {task.subject}
                </td>
                <td colSpan={3}>Không tính được: {result.reason}</td>
              </tr>
            );
          }
          return (
            <tr key={task.workPackageId}>
              <td>
                #{task.workPackageId} — {task.subject}
              </td>
              <td className="num">{result.breakdown.base}</td>
              <td className="num">{task.bugs.filter(bug => bug.validated && !bug.isDuplicate && !bug.isNotABug).length}</td>
              <td className="num">{formatScore(result.breakdown.penalty)}</td>
              <td className="num">
                <strong>{formatScore(result.taskScore)}</strong>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
