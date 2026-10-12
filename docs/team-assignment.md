## 9. Chia công việc cho 3 người

| Người | Chịu trách nhiệm chính | Thư mục | Người review |
|---|---|---|---|
| A | Nền dự án, xác thực/phân quyền, OpenProject adapter, MCP tạo/cập nhật | config, auth, permissions, openproject, mcp; infra; khởi tạo workspace | B |
| B | Dữ liệu chuẩn, đồng bộ, thống kê task/bug | analytics, db, routes báo cáo; tests analytics | C |
| C | Công thức điểm và giao diện báo cáo/điểm | scoring, web; tests scoring | A |

B sở hữu migration DB và API báo cáo; C gửi yêu cầu thay đổi schema cho B. A sở hữu entrypoint/routes chung; các endpoint mới phải ghi hợp đồng trước khi ghép. C làm phần giao diện cho cả thống kê và điểm, B cung cấp số liệu/endpoint. Đây là phần cần phối hợp để tránh C dồn việc cuối kỳ.

### 9.1. Người A — tích hợp OpenProject và MCP

**Đầu vào:** môi trường OpenProject, token có quyền phù hợp, type/status/role đã cấu hình.  
**Đầu ra:** A/B/C chạy được khung dự án; AI thao tác được với OpenProject thật.

Thực hiện theo thứ tự:

1. Khởi tạo workspace TypeScript, API và React; lệnh build/test/dev, cấu hình mẫu và mock mode. Chốt SDK MCP phù hợp client sẽ dùng.
2. Tạo adapter: liệt kê project/type/status/user; đọc task; xử lý phân trang; chuẩn hóa lỗi.
3. Ánh xạ type/status bằng cấu hình hoặc dữ liệu được truy vấn, không đoán ID giữa các máy. Dùng bốn workflow mục 5 và workflow-policy.example.json; triển khai truy vấn cạnh hợp lệ và tool transition dùng chung policy với update status.
4. Làm MCP tools đọc trước: `list_projects`, `list_work_packages`, `get_work_package`.
5. Làm `create_work_package`, `update_work_package`, `create_relation`, `add_comment` với đầu vào có schema, ID rõ ràng, giới hạn đúng dự án.
6. Tạo Epic → Story → Task → Subtask bằng kết quả ID thực nhận. Nếu bước giữa lỗi, trả danh sách đã tạo để người dùng xử lý; không báo thành công toàn bộ.
7. Khi update, đọc bản hiện tại và dùng lockVersion theo API. Xung đột cần trả lỗi để đọc lại, không tự ghi đè thay đổi của người khác [18].
8. Chống tạo trùng khi AI/client thử lại: lưu request ID, trạng thái và ID đã tạo. Nếu timeout chưa biết kết quả, phải đối chiếu trước khi tạo lại.
9. Ghi operation log không chứa token; trả ID/link và các trường đã thay đổi. Tài khoản thường giữ nguyên giới hạn workflow; không dùng quyền admin để vượt quy trình.
10. Triển khai phân quyền PM/BA/BE/FE/Tester theo mục 4.1. Token dịch vụ chỉ ở backend đáng tin cậy; MCP/client gửi danh tính được xác thực. Kiểm tra trường dữ liệu, owner/reviewer, các đường UI/REST/MCP/API trực tiếp trước khi nghiệm thu.

**Nghiệm thu:** tạo cây đúng; đổi nội dung/assignee/ngày; chuyển trạng thái hợp lệ thành công, không hợp lệ bị từ chối; retry không nhân đôi; lỗi mạng/xung đột báo đúng. Với thao tác hàng loạt, ứng dụng cho xem kế hoạch trước khi ghi.

### 9.2. Người B — dữ liệu và thống kê

**Đầu vào:** hợp đồng dữ liệu, adapter A hoặc mock cùng cấu trúc.  
**Đầu ra:** bộ số liệu kiểm tra được bằng cách đếm tay, API để C hiển thị.

1. Thiết kế SQLite và migrations: baselines, task snapshots/events, defect links, contribution shares, sync state, operation logs, score runs. Phối hợp A/C về trường dữ liệu.
2. Chuẩn hóa ID theo instance; phân biệt người làm, author và assignee hiện tại. Hoàn thành mapping type/status của máy thực tế.
3. Đồng bộ đầy đủ trang API; ghi thời điểm cập nhật và trạng thái lỗi. Dữ liệu cũ phải được gắn nhãn, không hiển thị như thời gian thực.
4. Ghi baseline trước Start work; sự kiện Complete/Approve/Accept, CANCELLED/REDO và lịch sử nghiệm thu. Tách completedAt của Subtask khỏi acceptedAt được duyệt ở task cha theo mục 5.7. Kiểm tra lịch sử nếu lấy dữ liệu cũ; đánh dấu thiếu dữ liệu thay vì suy đoán thời gian.
5. Làm chức năng xác nhận Bug → task nguồn, severity, duplicate/not-a-bug; không tự coi mọi relates là bug nguồn.
6. Tính từng chỉ số ở mục 6.3; dùng mẫu số đúng, loại parent/Cancelled, không đếm trùng quan hệ.
7. Cung cấp endpoint theo project/người/kỳ và CSV. Trả cả tử số, mẫu số, nhãn kỳ, thời điểm đồng bộ và số bản ghi thiếu dữ liệu.
8. Đối chiếu với `samples/demo-data.json`, rồi kiểm tra task thiếu hạn, assignee bị đổi, bug duplicate, không có task và nhiều trang API.

**Nghiệm thu:** mẫu 6 task cho đúng kết quả; zero denominator trả N/A/null; API cũ hoặc mất kết nối không làm mất số liệu đã lưu; báo rõ phạm vi truy cập của tài khoản. Không gọi báo cáo là “toàn dự án” nếu token chỉ thấy một phần dữ liệu.

### 9.3. Người C — điểm và giao diện

**Đầu vào:** dữ liệu chuẩn/mocks của B, công thức được quản lý duyệt.  
**Đầu ra:** tính điểm có thể tái lập và giao diện giải thích được kết quả.

1. Viết hàm tính điểm độc lập với giao diện và gọi mạng: đầu vào cố định → kết quả cố định, có breakdown.
2. Triển khai độ khó, hệ số ngày và bug penalty; làm tròn ở lúc hiển thị/chốt, không làm tròn từng bước gây sai tổng.
3. Xử lý missing data, tỷ lệ đóng góp, reopen, score floor và version quy tắc.
4. Cùng B lưu lần chốt điểm đủ dữ liệu để tái lập; phiên bản mới không âm thầm sửa kết quả cũ.
5. Làm trang Tổng quan, Thống kê theo người, Chi tiết task/bug, Bảng điểm, Cấu hình điểm cho quản lý.
6. Dùng mock trước; ghép API B sau. Bộ lọc project/kỳ phải được dùng nhất quán cho cả biểu đồ, bảng và export.
7. Hiển thị rõ “bug liên kết với task người này phụ trách”, không diễn giải thành AI kết luận cá nhân gây lỗi.
8. Giao diện có loading/empty/error, thời điểm dữ liệu, link về OpenProject và bảng breakdown; xử lý label người trùng tên bằng ID.

**Nghiệm thu:** A 6.20, B 6.10, C 3.00 trên kỳ mẫu; task 106 không âm; thiếu hạn không được tự chấm 0; thay cấu hình có version; tổng bảng cá nhân bằng tổng task được phân bổ. Mọi khóa AI/OpenProject giữ ở backend.


## 11. Backlog triển khai và thứ tự làm

| Mã | Công việc | Người | Phụ thuộc |
|---|---|---|---|
| A01 | Khung workspace, mock mode, build/test | A | Không |
| A02 | Cài OP, types/roles/workflow, mapping | A | Không |
| A03 | Adapter đọc dữ liệu và phân trang | A | A02 |
| A04 | MCP tạo cây công việc | A | A01,A03 |
| A05 | MCP cập nhật, lỗi quyền/xung đột/retry | A | A04 |
| A06 | Xác thực, phân quyền PM/BA/BE/FE/Tester, mọi đường ghi | A | A01,A02; hoàn tất trước nghiệm thu A04/A05 |
| B01 | Hợp đồng dữ liệu, fixture chung | B | Thống nhất nhóm |
| B02 | SQLite, baseline và sync state | B | B01,A01 |
| B03 | Đồng bộ task/hoạt động, attribution | B | B02,A03 |
| B04 | Thống kê task và bug | B | B01; mock trước |
| B05 | API báo cáo, CSV và kiểm tra mẫu số | B | B04 |
| C01 | Chốt công thức và hàm scoring | C | B01; mock trước |
| C02 | Kiểm tra điểm, reopen, thiếu dữ liệu | C | C01 |
| C03 | UI thống kê và bảng điểm với mock | C | A01,B01 |
| C04 | Ghép API, cấu hình và chốt điểm | C | B05,C02,C03 |
| ALL01 | Demo từ AI → OP → báo cáo → điểm, kiểm tra quyền | Cả nhóm | A05,A06,B03,B05,C04 |

Mốc 1: môi trường, dữ liệu và chính sách quyền chung. Mốc 2: ba phần chạy được bằng mock. Mốc 3: ghép OpenProject thật và hoàn tất A06 trước sử dụng nhiều thành viên. Mốc 4: kiểm tra chéo và bàn giao. Chưa gán ngày cứng khi nhóm chưa thống nhất thời gian làm; quản lý đặt hạn và độ khó cho từng đơn vị thực thi trước Start work; READY chỉ dùng cho Epic.

Trong OpenProject tạo 3 Epic: **AI Integration**, **Work & Defect Analytics**, **Personal Scoring & Dashboard**. Dưới mỗi Epic tạo các Story theo kết quả người dùng và các Task theo bảng; tách Subtask khi có tiêu chí độc lập. Dùng Wiki ghi đường dẫn Git và tài liệu, giữ mã nguồn trong repository ngoài.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
