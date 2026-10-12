## 7. Quy tắc chấm điểm đề xuất

Đây là **quy tắc bản đầu để nhóm duyệt**, không phải chuẩn đánh giá nhân viên. Độ khó chốt trước khi bắt đầu; cùng một task không được tự tăng điểm sau khi biết kết quả.

### 7.1. Điểm độ khó

Chọn 1, 2, 3, 5 hoặc 8 điểm: từ việc nhỏ, rõ cách làm đến việc nhiều thành phần/phụ thuộc. Task lớn hơn 8 cần xem xét chia nhỏ. Dùng điểm này làm điểm nền, không nhân thêm lần nữa với độ khó.

### 7.2. Hệ số thời hạn

| Kết quả | Hệ số |
|---|---:|
| Được chấp nhận sớm ít nhất 1 ngày so với hạn gốc | 1.05 |
| Được chấp nhận trong ngày hạn gốc | 1.00 |
| Trễ 1–2 ngày | 0.90 |
| Trễ từ 3 ngày | 0.80 |

So sánh **ngày được chấp nhận**, không phải ngày gửi REVIEW hay ngày tự Complete Subtask. Subtask lấy ngày nghiệm thu phần việc ở task cha theo mục 5.7. Bản đầu dùng ngày lịch ở Asia/Ho_Chi_Minh; hạn ngày có điểm cuối 23:59:59. Chưa có quy tắc tự loại ngày nghỉ. Việc chờ phụ thuộc hoặc đổi phạm vi được quản lý xử lý bằng phiên bản baseline và lý do, không tự sửa ngày gốc.

### 7.3. Điểm trừ bug

| Mức bug | Điểm trừ |
|---|---:|
| Low | 0.5 |
| Medium | 1 |
| High | 2 |
| Critical | 4 |

Chỉ trừ bug hợp lệ có task nguồn đã xác nhận; không tính người tạo bản ghi bug là người gây lỗi. Tester được chỉ định/PM xác nhận mức độ và liên kết, AI chỉ được đề xuất.

```text
Điểm task = max(0, điểm độ khó × hệ số thời hạn − tổng điểm trừ bug)
Điểm người = tổng(điểm task × tỷ lệ đóng góp được duyệt)
```

Không chuẩn hóa tổng điểm thành thang 100 trong bản đầu. Hiển thị đồng thời số task, tổng độ khó, đúng hạn, bug theo mức và điểm. Điểm là chỉ số hỗ trợ review; người nhận việc khó có thể có nhiều bug hơn vì phạm vi lớn.

### 7.4. Ví dụ để kiểm tra chương trình

| Task | Người | Độ khó | Thời hạn | Bug | Điểm |
|---|---|---:|---|---|---:|
| 101 | A | 5 | Đúng hạn | 1 Medium | 4.00 |
| 102 | A | 3 | Trễ 2 ngày | 1 Low | 2.20 |
| 103 | B | 8 | Đúng hạn | 1 Critical | 4.00 |
| 104 | B | 2 | Sớm 1 ngày | Không | 2.10 |
| 105 | C | 3 | Đúng hạn | Không | 3.00 |
| 106 | C | 1 | Trễ 4 ngày | 1 Medium | 0.00 |

Kết quả kỳ mẫu: **A = 6.20; B = 6.10; C = 3.00**. Có 6 task, 4 bug; bug/task = 0.6667 và tỷ lệ task có bug = 66.67%. Mỗi người làm 2 task, tỷ trọng 33.33%. Task 106 bị chặn điểm âm.

Task được reopen không cộng thêm lần hoàn thành. Điểm tạm tính có thể thay đổi khi bug mới được xác nhận. Lần chốt điểm lưu `ruleVersion`, baseline, dữ liệu đầu vào và `asOf`; muốn sửa điểm đã chốt cần tạo lần tính mới, giữ lần cũ để đối chiếu.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
