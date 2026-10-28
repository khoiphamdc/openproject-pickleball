export default function ScoreConfig() {
  return <section><h2>Quy tắc điểm</h2><p>Điểm Task/Subtask = max(0, story points × hệ số thời hạn − tổng điểm trừ Bug hợp lệ).</p><p>Done sớm ít nhất 1 ngày: 1,05 · đúng hạn: 1,00 · trễ 1–2 ngày: 0,90 · trễ trên 2 ngày: 0,80.</p><p>Bug Low: 0,5 · Medium: 1 · High: 2 · Critical: 4.</p><p className="muted">Chỉ tính Bug là con trực tiếp của Task/Subtask và có assignee trùng người phụ trách. Chưa hỗ trợ chốt điểm.</p></section>;
}
