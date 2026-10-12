## 6. Dữ liệu chung và các chỉ số

### 6.1. Dữ liệu lưu ở đâu

| Nguồn | Dữ liệu |
|---|---|
| OpenProject | Work package ID, type, subject, assignee, parent, status, ngày hiện tại, hoạt động, liên kết |
| SQLite của ứng dụng | Workstream/businessOwner/reviewer được duyệt; độ khó, hạn gốc, người được ghi nhận, tỷ lệ đóng góp, bug đã xác nhận, audit và lần chốt điểm |

Bản đầu giữ các dữ liệu chấm điểm trong SQLite, gắn khóa `(instanceId, workPackageId)`. Như vậy không phụ thuộc tùy chỉnh biểu mẫu Enterprise. Nếu muốn đồng bộ custom field vào OpenProject, A kiểm tra tính năng có sẵn trên Community thực tế trước; các tùy chỉnh nâng cao có thể thuộc Enterprise [16].

Trước Start work của Task/Subtask (đang TO DO), quản lý duyệt độ khó, hạn cam kết và người/tỷ lệ đóng góp; READY chỉ dùng cho Epic. Backend chụp baseline; sửa baseline phải có lý do và lịch sử. Assignee hiện tại, người sửa bug, người báo bug và người nhận điểm có thể là những người khác nhau.

### 6.2. Quy tắc đếm

- Đơn vị thực thi: Task không có Subtask, hoặc Subtask ở cuối cây. Không cộng cả task cha và subtask con.
- Epic/Story hiển thị tổng tiến độ, không cộng thêm điểm cá nhân.
- Bug không làm tăng số task hoàn thành ở bản đầu; việc sửa bug có thể được tách thành task nếu quản lý muốn ghi nhận riêng.
- Cancelled, duplicate và not-a-bug bị loại theo quy tắc tương ứng.
- Một bug chính chỉ có một task nguồn để tính tỷ lệ mặc định; các liên kết tham khảo khác không được cộng lại. Trường hợp liên quan nhiều task phải có cơ chế phân bổ riêng sau này.
- Task nhiều người làm: tỷ lệ được quản lý duyệt có tổng bằng 1; bản đầu ưu tiên một người chịu trách nhiệm chính.
- Thiếu baseline/owner/thời điểm nghiệm thu đáng tin cậy: báo “chưa đủ dữ liệu”, không tự điền điểm 0. Subtask DONE chưa được task cha nghiệm thu chỉ nằm trong số đã khai báo hoàn tất, chưa tính vào completedTasks/điểm.

### 6.3. Định nghĩa báo cáo

| Chỉ số | Công thức/quy tắc |
|---|---|
| Task hoàn thành theo người | Số đơn vị thực thi đạt DONE và được nghiệm thu, lần chấp nhận thuộc kỳ báo cáo (Subtask theo mục 5.7) |
| Tỷ trọng hoàn thành | Task của người / task hoàn thành toàn nhóm trong cùng kỳ |
| Tỷ lệ hoàn thành kế hoạch | Đơn vị thực thi cam kết trong kỳ đã được nghiệm thu trước thời điểm chốt / số đơn vị cam kết hợp lệ trong kỳ |
| Tỷ lệ đúng hạn | Đơn vị đã nghiệm thu đúng hạn gốc / đơn vị đã nghiệm thu có hạn gốc và acceptedAt hợp lệ |
| Bug trên task | Số bug chính hợp lệ liên kết với task |
| Bug trung bình mỗi task | Bug hợp lệ của tập task / số task trong tập đó |
| Tỷ lệ task có bug | Task có ít nhất 1 bug hợp lệ / tổng task trong tập × 100% |

Kỳ báo cáo có `from`, `toExclusive`, múi giờ Asia/Ho_Chi_Minh, thời điểm chốt `asOf`. Báo cáo chất lượng chọn tập đơn vị thực thi đã được nghiệm thu trong kỳ và các bug đã được xác nhận trước `asOf`; ghi rõ cửa sổ này. Subtask áp dụng điều kiện nghiệm thu task cha ở mục 5.7. Bug trung bình/task là số lượng, không phải phần trăm. Nếu mẫu số bằng 0, hiển thị N/A.

API có lịch sử hoạt động và thời điểm hoạt động [17]. A và B phải kiểm tra khả năng xác định lần chuyển DONE và lần nghiệm thu liên quan trên phiên bản thực tế; không dùng `updatedAt` của task làm thời gian hoàn thành. Với dữ liệu mới, lưu sự kiện do bridge ghi và đối chiếu lịch sử; Subtask cần sự kiện nghiệm thu tại task cha, không chỉ lần Complete. Nếu chỉ quan sát bằng polling mà không xác định được thời gian gốc, đánh dấu thời gian ước lượng và loại khỏi điểm đúng hạn. CANCELLED/REDO làm kết quả nghiệm thu hiện hành mất hiệu lực trong phạm vi được mở lại cho đến khi được duyệt lại; lưu lịch sử và lần chốt cũ để đối chiếu, không tái dùng acceptedAt cũ hoặc cộng trùng đơn vị.


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
