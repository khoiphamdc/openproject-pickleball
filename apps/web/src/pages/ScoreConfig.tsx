import { useMemo, useState } from 'react';
import { formatScore, userName } from '../services/mockData';
import {
  BUG_PENALTY,
  DEFAULT_CONFIG,
  RULE_VERSION,
  scoreTaskWithConfig,
  type BugSeverity,
  type ScoreConfig,
} from '../services/scoring';
import type { PageProps } from './types';

const SEVERITIES: BugSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

export default function ScoreConfig({ tasks, run }: PageProps) {
  const [config, setConfig] = useState<ScoreConfig>(DEFAULT_CONFIG);
  const [applied, setApplied] = useState(false);

  const previewTotals = useMemo(() => {
    const byUser = new Map<number, number>();
    for (const task of tasks) {
      const result = scoreTaskWithConfig(task, config);
      if (!result.ok) continue;
      for (const allocation of result.allocations) {
        byUser.set(allocation.userId, (byUser.get(allocation.userId) ?? 0) + allocation.score);
      }
    }
    return [...byUser.entries()]
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => a.userId - b.userId);
  }, [tasks, config]);

  const isDefault =
    config.early === DEFAULT_CONFIG.early &&
    config.onTime === DEFAULT_CONFIG.onTime &&
    config.late12 === DEFAULT_CONFIG.late12 &&
    config.late3plus === DEFAULT_CONFIG.late3plus &&
    SEVERITIES.every((s) => config.penalties[s] === DEFAULT_CONFIG.penalties[s]);

  return (
    <section>
      <h2>Cấu hình điểm (dành cho PM)</h2>
      <p className="muted">
        Trang này chỉ để xem trước trong chế độ mock. Thay đổi ở đây <strong>không lưu</strong>{' '}
        xuống dữ liệu, không chốt điểm. Chốt điểm thật là việc của C04 khi có API của B05.
        Quy tắc đang dùng trên giao diện: {RULE_VERSION}, giờ Việt Nam.
      </p>

      <h3>Hệ số hạn</h3>
      <div className="form-grid">
        <label>
          Sớm từ 1 ngày trở lên
          <input
            type="number"
            step="0.01"
            value={config.early}
            onChange={(e) => setConfig({ ...config, early: Number(e.target.value) })}
          />
        </label>
        <label>
          Đúng hạn
          <input
            type="number"
            step="0.01"
            value={config.onTime}
            onChange={(e) => setConfig({ ...config, onTime: Number(e.target.value) })}
          />
        </label>
        <label>
          Trễ 1–2 ngày
          <input
            type="number"
            step="0.01"
            value={config.late12}
            onChange={(e) => setConfig({ ...config, late12: Number(e.target.value) })}
          />
        </label>
        <label>
          Trễ từ 3 ngày trở lên
          <input
            type="number"
            step="0.01"
            value={config.late3plus}
            onChange={(e) => setConfig({ ...config, late3plus: Number(e.target.value) })}
          />
        </label>
      </div>

      <h3>Điểm trừ bug đã xác thực</h3>
      <div className="form-grid">
        {SEVERITIES.map((severity) => (
          <label key={severity}>
            {severity} (mặc định {BUG_PENALTY[severity]})
            <input
              type="number"
              step="0.5"
              value={config.penalties[severity]}
              onChange={(e) =>
                setConfig({
                  ...config,
                  penalties: { ...config.penalties, [severity]: Number(e.target.value) },
                })
              }
            />
          </label>
        ))}
      </div>

      <div className="button-row">
        <button type="button" onClick={() => setApplied(true)}>
          Áp dụng thử (chỉ xem trước)
        </button>
        <button
          type="button"
          onClick={() => {
            setConfig(DEFAULT_CONFIG);
            setApplied(false);
          }}
        >
          Về lại {RULE_VERSION}
        </button>
      </div>

      {!isDefault && !applied ? (
        <p className="muted">M đã sửa cấu hình nhưng chưa bấm áp dụng thử, bảng dưới vẫn là điểm cũ.</p>
      ) : null}

      <h3>Xem trước điểm theo cấu hình {applied && !isDefault ? 'đã sửa' : 'hiện tại'}</h3>
      <table className="data-table table-narrow">
        <thead>
          <tr>
            <th>Người</th>
            <th className="num">Điểm xem trước</th>
            <th className="num">Điểm theo {RULE_VERSION}</th>
          </tr>
        </thead>
        <tbody>
          {run.totals.map((person) => {
            const preview = previewTotals.find((p) => p.userId === person.userId);
            return (
              <tr key={person.userId}>
                <td>{userName(person.userId)}</td>
                <td className="num">
                  <strong>{formatScore(preview?.score ?? 0)}</strong>
                </td>
                <td className="num">{formatScore(person.score)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted">
        Độ khó chỉ nhận 1, 2, 3, 5, 8 và phải chốt trước khi bắt đầu task — phần này do PM chốt,
        không sửa ở đây.
      </p>
    </section>
  );
}
