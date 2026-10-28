import { useEffect, useState, type FormEvent } from 'react';
import Overview from './pages/Overview';
import WorkPackages from './pages/WorkPackages';
import { loadDashboard, type Dashboard } from './services/dashboard';
import './c03.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'work-packages'>('overview');
  const [id, setId] = useState('6');
  const [project, setProject] = useState('6');
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(project, controller.signal).then(setData)
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [project, revision]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^[1-9]\d*$/.test(id)) { setError('ID dự án phải là số nguyên dương.'); return; }
    setError(''); setData(null); setLoading(true); setProject(id); setRevision(n => n + 1);
  }

  return <div className="c03-layout">
    <header className="c03-header"><h1>Thống kê và bảng điểm</h1><p className="muted">OpenProject · Điểm tính theo dữ liệu đến thời điểm hiện tại</p></header>
    <form className="c03-filter" onSubmit={submit}><label>ID dự án<input type="number" min="1" value={id} onChange={e => setId(e.target.value)} /></label><button type="submit">Xem báo cáo</button></form>
    {loading && <div className="state-box" role="status">Đang tải dữ liệu…</div>}
    {error && <div className="state-box state-error" role="alert">{error}</div>}
    {data && !error && <main className="c03-main">
      <p className="muted">Dự án #{data.report.projectId} · Cập nhật {new Date(data.report.asOf).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
      <nav className="c03-nav" aria-label="Các tab báo cáo">
        <button type="button" className={activeTab === 'overview' ? 'nav-active' : ''} aria-current={activeTab === 'overview' ? 'page' : undefined} onClick={() => setActiveTab('overview')}>Tổng quan</button>
        <button type="button" className={activeTab === 'work-packages' ? 'nav-active' : ''} aria-current={activeTab === 'work-packages' ? 'page' : undefined} onClick={() => setActiveTab('work-packages')}>Danh sách công việc</button>
      </nav>
      {activeTab === 'overview' ? <Overview data={data} /> : <WorkPackages data={data} />}
    </main>}
  </div>;
}
