## 13. Kịch bản nghiệm thu toàn dự án

1. Trên máy người nhận: mở OpenProject, đăng nhập, tạo dự án/type/workflow như tài liệu.
2. Tạo token thường và mapping; API đọc đúng dự án, không truy cập dự án ngoài quyền.
3. AI tạo 1 Epic, 1 Story, 2 Task và 1 Subtask; kiểm tra cây, ID và kết quả từng bước.
4. AI cập nhật task, chuyển đúng workflow; thử chuyển không hợp lệ và xung đột.
5. Duyệt baseline khi TO DO; assignee Task gửi REVIEW, reviewer chấp nhận DONE. Thử cả Story → INSPECT, Epic → REVIEW / ACCEPTANCE và Subtask Complete; kiểm tra điểm Subtask chờ nghiệm thu parent.
6. Reviewer xác nhận 1 Bug gắn với task; B đồng bộ, C hiển thị đúng người tại baseline.
7. Dùng kỳ mẫu để đối chiếu thống kê và điểm; kiểm tra parent/duplicate/reopen/zero denominator.
8. Chốt điểm, thêm bug mới, tạo lần chốt mới và xem được lần cũ.
9. Dừng/khởi động OpenProject và backend; dữ liệu còn nguyên.
10. Người tiếp theo lấy mã nguồn và chạy lại theo README không cần cùng Wi-Fi.
11. Kiểm tra toàn bộ bảng 4.1.7, đặc biệt BE không sửa task FE qua UI, REST, AI-MCP hoặc OpenProject API trực tiếp; không dùng token admin của quản lý để đại diện quyền của BE.

**Định nghĩa công việc phát triển được nghiệm thu:** có mã nguồn, tiêu chí đạt, kiểm tra có ý nghĩa, người review khác tác giả, tài liệu chạy/bàn giao cập nhật. Không coi ảnh chụp màn hình là đủ bằng chứng cho toàn bộ chức năng.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
