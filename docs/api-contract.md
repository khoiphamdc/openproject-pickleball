## 10. Hợp đồng giữa các phần

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
