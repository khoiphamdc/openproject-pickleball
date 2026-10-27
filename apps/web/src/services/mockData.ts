// Dữ liệu mẫu cho C03, chép đúng samples/demo-data.json của nhóm.
// File gốc ghi ruleVersion là demo-v1, nhưng điểm ở đây tính theo c01-v1
// (hàm scoring.ts), và giao diện ghi rõ là c01-v1 để khỏi nhầm.
// Dữ liệu mẫu này là hư cấu, mã task không phải mã thật trên OpenProject,
// nên link OpenProject ở giao diện chỉ là link mẫu trong chế độ mock.
// Tới C04, thay hàm loadMock() này bằng gọi API của B05, giao diện giữ nguyên.

import type { TaskInput } from './scoring';

export interface MockUser {
  id: number;
  name: string;
}

export interface MockMeta {
  projectId: number;
  projectName: string;
  from: string;
  toExclusive: string;
  asOf: string;
  timezone: string;
  source: string;
  openProjectBaseUrl: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
  { id: 3, name: 'C' },
];

export const MOCK_META: MockMeta = {
  projectId: 10,
  projectName: 'Demo project (dữ liệu mẫu)',
  from: '2026-10-01',
  toExclusive: '2026-10-11',
  asOf: '2026-10-10T08:00:00Z',
  timezone: 'Asia/Ho_Chi_Minh',
  source: 'samples/demo-data.json (mock, chưa phải API của B05)',
  openProjectBaseUrl: 'http://localhost:8080',
};

export function userName(userId: number): string {
  // Hiện cả tên và id để khỏi nhầm 2 người trùng tên.
  const user = MOCK_USERS.find((u) => u.id === userId);
  return user ? `${user.name} (id ${user.id})` : `Người dùng id ${userId}`;
}

export const MOCK_TASKS: TaskInput[] = [
  {
    workPackageId: 101,
    subject: 'Demo Task 101',
    isExecutionUnit: true,
    status: 'DONE',
    difficulty: 5,
    baselineDueDate: '2026-10-08',
    acceptedAt: '2026-10-08T10:00:00Z',
    contributions: [{ userId: 1, share: 1 }],
    bugs: [{ bugId: 201, severity: 'Medium', validated: true }],
  },
  {
    workPackageId: 102,
    subject: 'Demo Task 102',
    isExecutionUnit: true,
    status: 'DONE',
    difficulty: 3,
    baselineDueDate: '2026-10-07',
    acceptedAt: '2026-10-09T10:00:00Z',
    contributions: [{ userId: 1, share: 1 }],
    bugs: [{ bugId: 202, severity: 'Low', validated: true }],
  },
  {
    workPackageId: 103,
    subject: 'Demo Task 103',
    isExecutionUnit: true,
    status: 'DONE',
    difficulty: 8,
    baselineDueDate: '2026-10-08',
    acceptedAt: '2026-10-08T10:00:00Z',
    contributions: [{ userId: 2, share: 1 }],
    bugs: [{ bugId: 203, severity: 'Critical', validated: true }],
  },
  {
    workPackageId: 104,
    subject: 'Demo Task 104',
    isExecutionUnit: true,
    status: 'DONE',
    difficulty: 2,
    baselineDueDate: '2026-10-08',
    acceptedAt: '2026-10-07T10:00:00Z',
    contributions: [{ userId: 2, share: 1 }],
    bugs: [],
  },
  {
    workPackageId: 105,
    subject: 'Demo Task 105',
    isExecutionUnit: true,
    status: 'DONE',
    difficulty: 3,
    baselineDueDate: '2026-10-08',
    acceptedAt: '2026-10-08T10:00:00Z',
    contributions: [{ userId: 3, share: 1 }],
    bugs: [],
  },
  {
    workPackageId: 106,
    subject: 'Demo Task 106',
    isExecutionUnit: true,
    status: 'DONE',
    difficulty: 1,
    baselineDueDate: '2026-10-05',
    acceptedAt: '2026-10-09T10:00:00Z',
    contributions: [{ userId: 3, share: 1 }],
    bugs: [{ bugId: 204, severity: 'Medium', validated: true }],
  },
];

// Kỳ vọng trong file demo, để giao diện đối chiếu, không phải để tính lại.
export const EXPECTED_TOTALS: Array<{ userId: number; score: number }> = [
  { userId: 1, score: 6.2 },
  { userId: 2, score: 6.1 },
  { userId: 3, score: 3.0 },
];

export interface LoadResult {
  tasks: TaskInput[];
  meta: MockMeta;
}

// Giả lập tải dữ liệu bất đồng bộ để giao diện có trạng thái đang tải.
// Lỗi thật sẽ do API trả về ở C04; ở đây chỉ mô phỏng đường đi của lỗi.
export function loadMock(): Promise<LoadResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ tasks: MOCK_TASKS, meta: MOCK_META });
    }, 300);
  });
}

export function formatScore(value: number): string {
  // Chỉ làm tròn lúc hiển thị, trong hàm tính thì không làm tròn.
  return value.toFixed(2);
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const date = new Date(value);
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function openProjectTaskUrl(taskId: number): string {
  return `${MOCK_META.openProjectBaseUrl}/work_packages/${taskId}`;
}
