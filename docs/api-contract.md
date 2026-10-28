## 10. Hợp đồng giữa các phần

`GET /dashboard` bổ sung `webData` để tích hợp giao diện: `meta`, `tasks`, `run`. `workPackageId` tương ứng ID công việc OpenProject; `currentDueDate` và `currentStoryPoints` chỉ là giá trị hiện tại. Các trường chưa có nguồn tin cậy (tên dự án, kỳ, baseline, nghiệm thu, phân bổ, bug theo task và tổng điểm) trả `null`, không phải điểm 0 hay danh sách rỗng đã xác nhận. Cấu trúc web mẫu cần được sửa để chấp nhận các giá trị null này; chưa thể dùng trực tiếp như `PageProps` cũ. `report.from` cũ là giá trị kỹ thuật, không phải ngày bắt đầu kỳ thực tế.

`GET /dashboard?projectId=<id>` trả `report`, `openProjectUrl`, danh sách `tasks`, `bugs` và `preview`. `GET /scores?projectId=<id>` trả `report` và `preview`. Bản preview dùng quy tắc `demo-v2`: điểm từng đơn vị đủ dữ liệu là `max(0, story points × hệ số thời hạn - Bug gắn trực tiếp với đơn vị)`; hệ số là 1,05 khi sớm ít nhất 1 ngày, 1,00 khi đúng hạn, 0,90 khi trễ 1–2 ngày và 0,80 khi trễ trên 2 ngày. Bug hợp lệ trên nguồn chưa có dòng điểm riêng vẫn bị trừ một lần vào tổng người chịu trách nhiệm, kể cả nguồn chưa Done; điểm người thấp nhất là 0. `preview.people` trả thêm `scoredBugPenalty`, `unscoredBugPenalty`, `bugCount`, `unscoredBugCount` để giao diện giải thích khoản trừ. Bug nguồn được đọc từ quan hệ Parent/Child Bug → Task/Subtask; Bug chưa CANCELLED tính theo Priority, assignee phải trùng người phụ trách nguồn. Đây là dữ liệu demo từ trường hiện tại, chưa phải điểm chốt với baseline/đóng góp đã duyệt. `projectId` sai trả 400, dự án không tìm thấy trả 404, OpenProject không kết nối trả 503. Cần xác thực/phân quyền trước khi mở cho nhiều người.

Đầu tiên thống nhất tại `docs/data-contract.md` và `packages/contracts/`. Bản mẫu JSON trong ZIP là dữ liệu chuẩn nội bộ, **không phải payload gửi nguyên xi lên OpenProject API**.

Một bản ghi task tối thiểu cần: `instanceId`, `workPackageId`, `projectId`, `type`, `parentId`, `isExecutionUnit`, `ownerAtBaselineId`, `currentAssigneeId`, `baselineDifficulty`, `baselineDueDate`, `acceptedAt`, `completedAt` (Subtask), `acceptanceEventId`/`acceptedBy`, `status`, `baselineVersion`, `timeEvidence` và `contributions`. Bổ sung `workstream`, `businessOwnerId`, `reviewerIds` theo mục 4.1 khi triển khai phân quyền; fixture chấm điểm cũ chỉ dùng kiểm tra số học, không dùng làm fixture kiểm tra quyền.

Một bản ghi bug cần: `instanceId`, `bugId`, `sourceTaskId`, `severity`, `validatedAt`, `isDuplicate`, `isNotABug`, `approvedBy`. Một lần chốt điểm cần ID, kỳ, `asOf`, `ruleVersion` và bộ đầu vào.

### API nội bộ dự kiến

| Endpoint dự kiến | Chủ sở hữu | Chức năng |
|---|---|---|
| GET /health | A | API hoạt động, trạng thái kết nối không lộ secrets |
| GET /catalog | A | Project/type/status/user hợp lệ |
| POST /sync | B | Đồng bộ dự án có quyền; chống chạy trùng |
| GET /reports/people | B | Thống kê theo người và kỳ |
| GET /reports/defects | B | Bug/task, task có bug |
| PUT /tasks/:id/baseline | B phối hợp A | Duyệt baseline, lưu lịch sử |
| POST /defect-links | B | Xác nhận bug nguồn |
| GET /scores | C phối hợp A | Điểm tạm tính và breakdown |
| POST /score-runs | C phối hợp B | Chốt điểm có version |

Đây là hợp đồng đề xuất; không phải endpoint sẵn có của OpenProject. Bản local dùng một người vận hành có cấu hình token rõ ràng; khi nhiều người dùng, xác thực/phân quyền mục 4.1 là điều kiện bắt buộc. AI thao tác theo quyền actor đã xác thực; token ghi dịch vụ được backend giữ riêng. Baseline/chốt điểm dành cho PM; bug attribution dành cho PM/Tester có phạm vi review; truy vấn điểm chi tiết của BE/FE/Tester chỉ trả dữ liệu cá nhân được phép.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
