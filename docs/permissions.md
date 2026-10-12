## 4. Tạo dự án và tài khoản nhóm

### Dự án trong OpenProject

Người A thực hiện trên môi trường tích hợp:

1. Tạo dự án **OpenProject AI Extension**, identifier dự kiến `op-ai`.
2. Bật Work packages, Wiki và Time and costs nếu nhóm cần ghi thời gian.
3. Tạo tài khoản A, B, C để nhận công việc; thêm vào Members của dự án.
4. Tạo các project role **PM**, **BA**, **BE**, **FE**, **Tester** trong Administration → Users and permissions → Roles and permissions [7]. Cấu hình quyền theo mục 4.1 và workflow riêng theo từng type ở mục 5; không dùng một workflow chung cho tất cả.
5. Gán quyền theo mục 4.1, đặc biệt tắt quyền sửa trực tiếp rộng cho BE/FE. PM quản lý thành viên và kế hoạch. Không cấp quyền xóa công việc cho tài khoản AI ở bản đầu.

Administrator là quyền toàn hệ thống; role PM trong dự án không tự có quyền sửa cấu hình toàn hệ thống. Người quản trị thực hiện phần workflow bên dưới [7]. Tránh đồng thời gán thêm role rộng quyền khi kiểm tra workflow, vì các quyền có thể cộng dồn.

### Các loại công việc

Vào Administration → Work packages → Types. Dùng loại đã có; tạo loại thiếu bằng **+ Type**, không đánh dấu là Milestone. Sau đó bật chúng tại Project settings → Work packages → Types [8][9].

| Type | Dùng để làm gì |
|---|---|
| Epic | Một mục tiêu lớn, ví dụ tích hợp AI hoặc báo cáo |
| Story | Kết quả người dùng cần, có tiêu chí chấp nhận |
| Task | Một việc triển khai cụ thể |
| Subtask | Phần nhỏ của task, có người và hạn riêng khi cần |
| Bug | Lỗi đã phát hiện, có bước tái hiện và liên kết nguồn |

Dùng quan hệ Parent/Child để tạo Epic → Story → Task → Subtask. Đây là quy ước nhóm; tên type không tự ép được toàn bộ cấu trúc phân cấp. A kiểm tra cấu trúc trong ứng dụng tích hợp. Với Bug, dùng quan hệ `relates` đến task nguồn và bản ghi xác nhận trong ứng dụng mở rộng, không coi mọi liên kết relates là nguyên nhân bug [10].

### API token

Đăng nhập tài khoản dự định dùng để tích hợp; vào My account → Access tokens để tạo token API [11]. API hành động với quyền tài khoản của token [2]. Bản phát triển một người có thể cấu hình token riêng ở backend. Khi bật phân quyền nhiều thành viên theo mục 4.1, token người dùng thường không có quyền sửa rộng; token tài khoản dịch vụ có quyền ghi chỉ được giữ trên backend do quản lý vận hành. Không phát token dịch vụ cho máy BE/FE, frontend, README, Git hoặc dữ liệu mẫu.

### 4.1. Phân quyền PM, BA, BE, FE và Tester

#### 4.1.1. Vai trò và phạm vi

| Role | Công việc chính | Phạm vi được sửa theo chính sách nhóm |
|---|---|---|
| PM — Project Manager | Quản lý kế hoạch, giao việc, hạn, nghiệm thu, điểm | Công việc trong dự án được quản lý; sửa kế hoạch phải có lý do |
| BA — Business Analyst | Phân tích yêu cầu, Epic/Story, tiêu chí chấp nhận | Nội dung nghiệp vụ của Epic/Story được chỉ định và task BA được giao |
| BE — Backend Developer | API, cơ sở dữ liệu, xử lý nghiệp vụ phía server | Trường thực thi của task/subtask/bug BE được giao trực tiếp cho mình |
| FE — Frontend Developer | Giao diện và tích hợp API | Trường thực thi của task/subtask/bug FE được giao trực tiếp cho mình |
| Tester | Kiểm thử, xác nhận bug, review kết quả | Task kiểm thử được giao; trường kết quả kiểm thử và trạng thái review được chỉ định |

A/B/C là **người được chia phần triển khai dự án mở rộng**, không phải role quyền cố định. Một người có thể làm nhiều chuyên môn, nhưng role phải được gán theo từng dự án và kiểm tra tổng quyền. BE trong bảng này là vai trò của thành viên sử dụng hệ thống; không đồng nghĩa người A/B đang viết backend của ứng dụng mở rộng.

Quy tắc mặc định được chọn: **BE/FE chỉ sửa task của chính mình**, chặt hơn việc cho mọi BE sửa mọi task BE. Task FE của đồng nghiệp cũng bị chặn đối với FE khác. Task chưa assign hoặc assign cho group chưa có cá nhân đại diện chỉ do PM điều phối; backend không tự mở quyền cho cả nhóm.

Mỗi work package cần `workstream` được PM duyệt: `BE`, `FE`, `BA`, `QA` hoặc `PM`; Epic/Story dùng thông tin người phụ trách nghiệp vụ. Bản đầu có thể lưu metadata này trong SQLite. Người dùng thường không được tự sửa workstream để vượt quyền. `assigneeId` lấy từ OpenProject hiện tại; `businessOwnerId` và `reviewerIds` là danh sách được PM/BA có thẩm quyền duyệt, không suy ra từ người tạo task.

#### 4.1.2. Ma trận quyền của ứng dụng mở rộng

Bảng sau là **chính sách cần lập trình trong backend của nhóm**, kết hợp quyền OpenProject và workflow. Đây không phải các ô cấu hình sẵn tương ứng một-một trong Community.

| Thao tác | PM | BA | BE | FE | Tester |
|---|---|---|---|---|---|
| Xem công việc trong dự án có quyền truy cập | Có | Có | Có | Có | Có |
| Bình luận trao đổi trong dự án | Có | Có | Có | Có | Có |
| Tạo Epic/Story | Có | Có, trong phạm vi nghiệp vụ được giao | Không | Không | Không |
| Sửa yêu cầu/tiêu chí của Epic/Story | Có | Có, là business owner | Không | Không | Chỉ đề xuất bằng bình luận |
| Tạo Task/Subtask | Có | Task BA của mình | Task BE của mình | Task FE của mình | Task QA của mình |
| Sửa mô tả thực thi của Task/Subtask | Có | Task BA của mình | Task BE của mình | Task FE của mình | Task QA của mình |
| Đổi assignee, workstream, parent hoặc type của công việc đã tạo | Có | Chỉ đề xuất | Không | Không | Không |
| Đổi hạn gốc, độ khó, tỷ lệ đóng góp đã duyệt | Có, lưu lý do/phiên bản | Chỉ đề xuất | Không | Không | Không |
| Task: TO DO → IN PROGRESS → REVIEW | Khi được giao phù hợp | Task BA của mình | Task BE của mình | Task FE của mình | Task QA của mình |
| Task: REVIEW → DONE/IN PROGRESS | Có, nếu không tự review | Chỉ nếu là reviewer nghiệp vụ được chỉ định | Không | Không | Có, nếu là reviewer được chỉ định |
| Subtask: IN PROGRESS → DONE (Complete) | Subtask của mình | Subtask BA của mình | Subtask BE của mình | Subtask FE của mình | Subtask QA của mình |
| Any → CANCELLED; CANCELLED → IN PROGRESS (REDO) | Có, theo mục 5.6 | Chỉ đề xuất | Không | Không | Không |
| Chấp nhận Done của Epic/Story | Có, nếu đạt điều kiện | Chỉ đề xuất nghiệm thu | Không | Không | Chỉ cung cấp kết quả kiểm thử |
| Tạo Bug với mô tả và bằng chứng | Có | Có | Có | Có | Có |
| Duyệt bug hợp lệ, mức độ và task nguồn | Có | Chỉ đề xuất | Chỉ đề xuất | Chỉ đề xuất | Có, theo phạm vi review được giao |
| Sửa nội dung khắc phục của Bug | Có | Bug BA được giao | Bug BE được giao | Bug FE được giao | Trường kết quả kiểm thử của bug được giao |
| Xem bảng điểm | Toàn dự án | Toàn dự án | Điểm của mình, tổng hợp nhóm | Điểm của mình, tổng hợp nhóm | Điểm của mình, tổng hợp nhóm |
| Đổi công thức/chốt hoặc hiệu chỉnh điểm | Có, có version/lý do | Không | Không | Không | Không |
| Xóa work package | Không qua ứng dụng ở bản đầu | Không | Không | Không | Không |

Task/Subtask tạo mới của BE/FE/BA/Tester mặc định TO DO, assign chính người đó, workstream khớp role. PM duyệt kế hoạch/baseline trước Start work; READY chỉ có trong workflow Epic. Người tạo được chỉnh nội dung bản nháp trong phạm vi của mình; việc tự tạo không cấp quyền sửa công việc người khác. Khi gắn Subtask mới vào parent khác người phụ trách, cần PM duyệt quan hệ; quyền tạo không đồng nghĩa quyền sửa parent.

BA chỉ sửa trường nghiệp vụ của Epic/Story, không tự điều chỉnh baseline hoặc trạng thái Done. Tester review task BE/FE chỉ được ghi kết quả kiểm thử, bằng chứng và chuyển trạng thái review hợp lệ; không tự sửa yêu cầu, người được giao hoặc độ khó. Bug đã được duyệt không cho tác giả tự thay task nguồn/severity để giảm điểm trừ.

#### 4.1.3. Ví dụ BE không được sửa task assign FE

Giả sử task 123 có workstream FE, assignee là tài khoản của Lan. Minh có role BE, đăng nhập bằng tài khoản riêng:

- Minh được xem và bình luận trao đổi nếu có quyền xem dự án.
- Minh bị chặn sửa subject, description, ngày, priority, assignee, parent và status của task 123.
- Minh yêu cầu AI “chuyển task 123 sang Done” cũng bị chặn với lỗi quyền; MCP không gửi yêu cầu ghi sang OpenProject.
- Minh không được dùng một lệnh đổi assignee thành mình rồi sửa trong cùng request để lách kiểm tra.
- Chỉ PM được điều phối lại. Nếu giao sang BE, PM phải duyệt thay workstream/phạm vi và cập nhật baseline/tỷ lệ đóng góp theo lịch sử, không ghi đè người nhận điểm cũ.

Ngay cả task BE được assign cho một BE khác, Minh vẫn không được sửa theo quy tắc “chỉ task của chính mình”. Nếu cùng làm, PM tách Subtask riêng cho từng người. Việc ghi nhận tỷ lệ đóng góp để tính điểm không tự cấp quyền sửa task.

#### 4.1.4. Khả năng sẵn có của Community và phương án áp dụng

OpenProject có quyền **Edit work packages** ở cấp dự án và quyền **Change work package status** độc lập. Workflow có điều kiện User is assignee, nhưng điều kiện đó áp dụng cho chuyển trạng thái, không tự hạn chế việc sửa toàn bộ nội dung theo assignee [23][15]. Các nguồn đã kiểm tra không cung cấp một quyền cấu hình chung “chỉ sửa mọi trường của task assign mình”. Không được ghi rằng chỉ tạo role BE/FE là đã hoàn thành yêu cầu này.

Phương án mặc định cho nhóm:

1. OpenProject gốc dùng để xem task, lịch sử và bình luận. BA/BE/FE/Tester không được cấp **Edit work packages** hoặc **Change work package status** trực tiếp ở cấu hình nghiêm ngặt.
2. Mọi thao tác tạo/sửa/chuyển trạng thái theo ma trận thực hiện qua giao diện mở rộng hoặc AI → MCP → backend có kiểm tra quyền. PM có thể có quyền quản lý trực tiếp trong OpenProject theo phạm vi được tin cậy.
3. Backend giữ token của **tài khoản dịch vụ không phải Administrator**, chỉ có các quyền cần dùng trong dự án. Backend xác thực người thao tác và kiểm tra ma trận trước khi dùng token đó; token dịch vụ không phải danh tính của người yêu cầu.
4. Backend dịch vụ chỉ được PM/người vận hành kiểm soát. Trên máy thành viên, MCP stdio kết nối backend bằng danh tính đã xác thực của thành viên; không nhúng token dịch vụ vào chương trình local mà thành viên có thể đọc hoặc sửa.
5. Nếu muốn BE/FE sửa trực tiếp mọi trường trên UI OpenProject mà vẫn giới hạn theo assignee, cần bổ sung kiểm tra phía server OpenProject bằng một mở rộng được phát triển/kiểm thử riêng, hoặc một cơ chế quyền cấp từng work package đã được xác minh. Bộ scaffold hiện tại không có chức năng đó. Chặn tại MCP hoặc ẩn nút UI không chặn được đường sửa trực tiếp khi tài khoản vẫn có quyền Edit rộng.

Mỗi người vẫn có thể phát triển bằng mock/môi trường riêng như mục 12. Khi cả nhóm dùng một hệ thống thật, phải có backend đáng tin cậy và xác thực; ba bản local do từng thành viên toàn quyền quản lý không tạo được một ranh giới quyền chung đáng tin cậy.

#### 4.1.5. Cấu hình project role trong OpenProject

Administrator thực hiện tại Administration → Users and permissions → Roles and permissions, tạo project role (không đánh dấu Global role), rồi gán qua Members của dự án:

| Quyền gốc OpenProject | PM | BA/BE/FE/Tester trong cấu hình nghiêm ngặt | Tài khoản dịch vụ |
|---|---|---|---|
| View work packages | Bật | Bật | Bật |
| Add comments / Edit own comments | Bật | Bật | Bật nếu ứng dụng hỗ trợ |
| Become assignee/responsible | Bật | Bật | Theo nhu cầu, không cần là người thực hiện task |
| Add work packages / Edit work packages | Bật theo nhiệm vụ | Tắt; dùng ứng dụng mở rộng | Bật trong dự án đích |
| Change work package status | Bật | Tắt; dùng ứng dụng mở rộng | Bật và cấu hình workflow riêng phù hợp |
| Manage work package relations/hierarchies | Bật | Tắt | Bật theo các thao tác được hỗ trợ |
| Add attachments | Theo nhu cầu | Tắt nếu phải kiểm tra quyền theo task; gửi qua ứng dụng | Chỉ bật khi có chức năng upload kiểm tra quyền |
| Move/Duplicate/Delete work packages | Tắt ở bản đầu nếu không cần | Tắt | Tắt |
| Manage members / cấu hình dự án | PM theo nhiệm vụ | Tắt | Tắt |
| Administrator / quyền quản trị toàn hệ thống | Không mặc định | Tắt | Tắt |

Nguồn [23] mô tả ý nghĩa các quyền. Bảng bật/tắt này là đề xuất của nhóm. Không dùng Non-member/Anonymous để cho truy cập dự án riêng; kiểm tra các role bổ sung hoặc group không cấp lại quyền đã tắt. Add attachments hoạt động độc lập với Edit work packages, vì vậy phải kiểm tra riêng [23].

Workflow mục 5 thể hiện chính sách nghiệp vụ. Trong cấu hình nghiêm ngặt, tài khoản người dùng thường không đổi trạng thái trực tiếp; backend áp ma trận role/người được giao/người review, rồi dùng workflow của tài khoản dịch vụ để ghi. Workflow của tài khoản dịch vụ phải hỗ trợ những chuyển trạng thái đã được backend cho phép. Điều kiện User is assignee của role BE không tự áp dụng khi OpenProject thấy tài khoản dịch vụ là người ghi.

#### 4.1.6. Kiểm tra bắt buộc trong backend/AI-MCP

Người A xây `auth/` và `permissions/`, dùng chung cho REST/MCP. Trình tự mỗi thao tác:

1. Xác thực actor từ phiên đăng nhập/token đã kiểm chứng; không tin `actorId`, `role=PM` hay câu “tôi là PM” trong prompt/body của AI.
2. Lấy role và quyền trong dự án, công việc hiện tại, assignee, workstream, businessOwner/reviewer và trạng thái từ nguồn đáng tin cậy.
3. Kiểm tra cả quyền thao tác và từng trường thay đổi. BE/FE cần đúng role/workstream và `actor.userId == currentAssigneeId`; task đang DONE/CANCELLED không cho sửa thực thi nếu chưa được mở lại hợp lệ.
4. Thay đổi assignee/type/workstream/parent/baseline chỉ thuộc PM. Đánh giá bằng dữ liệu **trước thay đổi**; không cho payload tự chuyển quyền cho actor.
5. Reviewer phải được chỉ định, không phải người thực hiện/nhận đóng góp của task. PM tự làm task cũng cần người review khác hoặc ngoại lệ được phê duyệt, ghi rõ lý do.
6. Dùng lockVersion; nếu task được PM đổi assignee trong lúc thao tác, từ chối bản ghi cũ và kiểm tra quyền lại trên bản mới.
7. Ghi audit actor thực, tài khoản dịch vụ, task ID, action, thay đổi, kết quả, thời gian. OpenProject có thể hiển thị tài khoản dịch vụ là người ghi; không được diễn giải đó là người làm task.
8. Request nhiều task kiểm tra từng mục trước khi ghi. Nếu kế hoạch có mục không được phép, bản đầu từ chối cả kế hoạch và trả danh sách nguyên nhân; lỗi phát sinh sau khi ghi phải báo chính xác các mục đã/ chưa cập nhật.

Không dùng endpoint cập nhật tổng quát hoặc chuyển tiếp payload tùy ý để bypass `permissions/`. Với quan hệ cha/con hoặc bug nguồn, kiểm tra các đầu mút liên quan. Cấu hình quyền phải được version hóa; nguồn role hoặc task không lấy được thì không cho ghi theo dữ liệu cũ.

#### 4.1.7. Phân công bổ sung và nghiệm thu

| Người triển khai | Bổ sung vào phần việc |
|---|---|
| A | Xác thực actor, ma trận role/trường, kiểm tra assignee, bảo vệ mọi tool MCP/REST và tài khoản dịch vụ |
| B | Lưu metadata workstream/businessOwner/reviewer, lịch sử giao lại, audit và ánh xạ ID; báo cáo đúng phạm vi được xem |
| C | Giao diện chỉ cho thao tác hợp lệ, giải thích bị chặn, giới hạn bảng điểm cá nhân; backend vẫn kiểm tra độc lập |

Các tình huống phải được kiểm tra trên hệ thống đã triển khai:

| Tình huống | Kết quả mong đợi |
|---|---|
| BE sửa nội dung/chuyển trạng thái task FE | Từ chối; dữ liệu task không đổi |
| BE sửa task BE của chính mình | Cho phép các trường thực thi và chuyển trạng thái hợp lệ |
| BE sửa task BE của người khác hoặc task chưa assign | Từ chối |
| FE đổi assignee/workstream/type để tự nhận quyền | Từ chối |
| BA sửa tiêu chí Story mình phụ trách | Cho phép; không đổi baseline/Done |
| Tester được chỉ định review task BE | Cho phép ghi kết quả và REVIEW → DONE/IN PROGRESS; không sửa mô tả thực thi |
| Tester không được chỉ định review task đó | Từ chối thao tác review; vẫn được bình luận theo quyền |
| PM đổi assignee sang FE | Cho phép, có audit; BE mất quyền sửa ngay sau đổi |
| Actor giả PM trong prompt/payload, hoặc dùng ID task dự án khác | Từ chối |
| BE gọi thẳng OpenProject API hoặc UI để sửa task FE | Bị từ chối vì role gốc không có quyền sửa trực tiếp rộng |
| Bulk update chứa cả task BE của mình và task FE | Từ chối kế hoạch trước ghi ở bản đầu |
| BE gọi API bảng điểm cá nhân của người khác | Không trả chi tiết ngoài phạm vi; chỉ tổng hợp được phép |

Đây là tiêu chí nghiệm thu thiết kế, không phải kết quả test đã chạy. Tài liệu và ZIP chưa chứa implementation phân quyền. Chỉ xem chức năng hoàn thành khi các phép thử UI, REST, MCP và gọi API trực tiếp đều đạt theo mô hình được chọn.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
