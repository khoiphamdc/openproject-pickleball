## 12. Bàn giao khi không chung Wi-Fi

### Phương án chính: Git repository chung

A tạo repository riêng và mời B/C. Cả nhóm có Internet khi gửi/nhận mã nguồn, không cần chung mạng. Mỗi người chạy OpenProject riêng khi cần kiểm tra tích hợp; B/C có thể dùng mock khi máy chưa cài được Docker.

**Khởi tạo lần đầu — người A:** trên GitHub tạo repository `openproject-ai`, chọn Private và để trống (không tạo README tự động). Trong Settings → Collaborators, thêm đúng tài khoản GitHub của B/C; hai người chấp nhận lời mời. Sau đó tại thư mục đã giải nén:

```powershell
Set-Location C:\Projects\openproject-ai
git init -b main
git config user.name "TEN_CUA_BAN"
git config user.email "EMAIL_CUA_BAN"
git add README.md AGENTS.md .gitignore .env.example apps docs infra packages samples scripts runtime/.gitkeep
git status
git commit -m "Initialize project scaffold and team guide"
git remote add origin "https://github.com/TAI_KHOAN/openproject-ai.git"
git push -u origin main
```

Thay tên, email và URL bằng giá trị thật; kiểm tra danh sách file trước khi commit. Git có thể mở trình duyệt để xác thực GitHub; không dùng mật khẩu tài khoản làm mật khẩu Git trong terminal. Nếu thư mục đã là repository, giữ lịch sử hiện có và thực hiện theo cấu hình của nhóm, không khởi tạo đè.

**Nhận dự án lần đầu — B/C:** sau khi được cấp quyền, mở PowerShell ở thư mục cha muốn lưu rồi chạy:

```powershell
git clone "https://github.com/TAI_KHOAN/openproject-ai.git"
Set-Location .\openproject-ai
```

Thay URL bằng repository thật. Đọc README, điền cấu hình riêng và chạy script cài OpenProject khi cần. Không lấy `.env` của A đưa vào Git.

Nhánh: `feature/a-mcp`, `feature/b-analytics`, `feature/c-scoring-ui`. Thay đổi nhỏ, có commit và mô tả; ghép qua pull request để người review xem được [19]. Trước khi sửa file chung, trao đổi chủ sở hữu. Người giữ nhánh chính chỉ ghép phần đã qua tiêu chí nghiệm thu.

Trong repo đã nhận, mẫu lệnh PowerShell:

```powershell
git switch main
git pull --ff-only
git switch -c feature/a-mcp
git status
# Sau khi làm và kiểm tra; chỉ add các đường dẫn đã review
git add apps/api/src/mcp docs
git commit -m "Add MCP work package tools"
git push -u origin feature/a-mcp
```

Nếu nhánh đã có, dùng `git switch feature/a-mcp`. B/C thay tên nhánh và đường dẫn; không add `.env`, runtime, dumps hoặc token. Mẫu lệnh giả định Git đang ở repository đã clone và có remote; A điền URL thật vào README sau khi tạo repo.

### Nếu không có Internet lúc chuyển

Có thể dùng Git bundle: người gửi commit mọi file cần bàn giao trước, rồi:

```powershell
git bundle create ..\handover.bundle --all
```

Chuyển file bằng USB/cách gửi tệp phù hợp. Người nhận lần đầu:

```powershell
git clone .\handover.bundle openproject-ai
```

Người nhận đã có repo dùng fetch từ đường dẫn bundle, xem nhánh rồi merge/review; không clone đè repo đang làm. Bundle giữ lịch sử Git nhưng không chứa file chưa commit hoặc dependencies tải ngoài [20]. `.env` tạo riêng trên máy nhận.

### Dữ liệu OpenProject không đồng bộ bằng Git

Không ghép ba database riêng bằng cách chép Docker volume. Dùng cùng fixture và cùng quy tắc trên các máy; ID thực của mỗi instance có thể khác nhau. Khi demo, chọn **một instance tích hợp** làm bản chính. Việc chuyển nguyên instance cần backup database, assets và cấu hình riêng rồi restore theo tài liệu [21][22]; CSV không phải bản sao lưu đầy đủ và không bảo đảm giữ IDs, workflow hay lịch sử.

### Nội dung bắt buộc mỗi lần bàn giao

- Commit/nhánh, phiên bản môi trường, phần đã hoàn thành.
- Cách chạy thật sau khi implementation tồn tại; kết quả kiểm tra.
- Endpoint/type/field thay đổi; migration và hướng nâng cấp.
- Mẫu dữ liệu, kết quả mong đợi, hạn chế còn lại.
- Việc tiếp theo và người nhận, không có token/mật khẩu trong gói.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
