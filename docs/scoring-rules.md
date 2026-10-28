## 7. Quy tắc chấm điểm đề xuất

Đây là **quy tắc bản đầu để nhóm duyệt**, không phải chuẩn đánh giá nhân viên. Độ khó chốt trước khi bắt đầu; cùng một task không được tự tăng điểm sau khi biết kết quả.

### 7.1. Điểm độ khó

Chọn 1, 2, 3, 5 hoặc 8 điểm: từ việc nhỏ, rõ cách làm đến việc nhiều thành phần/phụ thuộc. Task lớn hơn 8 cần xem xét chia nhỏ. Dùng điểm này làm điểm nền, không nhân thêm lần nữa với độ khó.

### 7.2. Hệ số thời hạn

So sánh ngày nghiệm thu với hạn gốc theo ngày lịch Việt Nam. Done đúng hạn có hệ số **1,00**, không bị trừ điểm thời hạn; hoàn thành sớm ít nhất 1 ngày được hệ số 1,05; trễ 1–2 ngày là 0,90; trễ trên 2 ngày là 0,80. Thiếu ngày nghiệm thu hoặc hạn gốc thì chưa đủ dữ liệu để tính.

### 7.3. Điểm trừ bug

| Mức bug | Điểm trừ |
|---|---:|
| Low | 0.5 |
| Medium | 1 |
| High | 2 |
| Critical | 4 |

Chỉ trừ Bug gắn trực tiếp làm con của Task/Subtask nguồn; assignee Bug phải trùng người chịu trách nhiệm công việc nguồn. Người phát hiện bug được ghi riêng và không bị phạt chỉ vì phát hiện. Tester/PM xác nhận mức độ; AI chỉ được đề xuất.

Trong bản demo, Bug có cha là Task/Subtask và chưa bị hủy được xem là hợp lệ; Priority quy đổi sang Low/Medium/High/Critical (Immediate tương ứng Critical). Bug duplicate hoặc “not a bug” phải bị loại. Mỗi ID bug chỉ được tính một lần cho nguồn.

```text
Điểm task/subtask = max(0, story points × hệ số thời hạn − tổng điểm trừ bug)
Điểm người = tổng(điểm task × tỷ lệ đóng góp được duyệt)
```

Tỷ lệ đóng góp của những người trên cùng task phải cộng đúng 100% (cho phép sai số số học rất nhỏ); mỗi người chỉ xuất hiện một lần trong phân bổ. Nếu chưa có phân bổ được duyệt, task chưa đủ dữ liệu để tính. Khi không có đóng góp nhiều người, quản lý lưu một người với tỷ lệ 100%.

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

### Cách đọc điểm cho một task

Ví dụ task có độ khó 5, được chấp nhận đúng hạn và có một bug Medium đã xác nhận:

```text
Điểm task = max(0, 5 × 1,00 − 1) = 4.00
```

Nếu hai người có tỷ lệ đóng góp 75% và 25%, lần lượt nhận 3.00 và 1.00 điểm. Giao diện làm tròn để hiển thị; phép tính nội bộ giữ số lẻ để không làm lệch tổng.

Task chỉ được chấm khi là đơn vị thực thi (Task không có Subtask hoặc Subtask lá), trạng thái là DONE, có story points, ngày nghiệm thu, hạn gốc hợp lệ và assignee. Bug cha–con trừ vào đơn vị nguồn. Thiếu dữ liệu cần thiết thì trả trạng thái chưa đủ dữ liệu, không tự coi là 0 điểm.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
