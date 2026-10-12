## 2. Chuẩn bị Windows

Ưu tiên Windows 11 64 bit còn trong thời gian hỗ trợ, CPU Intel/AMD; kiểm tra phiên bản/edition với trang Docker chính thức [3]. Docker yêu cầu ít nhất 8 GB RAM cho cấu hình WSL 2 được liệt kê; nhóm nên có 16 GB RAM và khoảng 30 GB dung lượng trống để chạy thử thoải mái. Hai con số khuyến nghị sau là đề xuất của tài liệu.

### Bước 1 — Kiểm tra ảo hóa

Mở Task Manager → Performance → CPU, tìm **Virtualization: Enabled**. Nếu Disabled, bật Intel VT-x hoặc AMD-V trong BIOS/UEFI theo hướng dẫn hãng máy. Docker Desktop phải chạy **Linux containers**.

### Bước 2 — Cài WSL 2

Mở PowerShell bằng **Run as administrator**, chạy:

```powershell
wsl --install
```

Khởi động lại máy nếu được yêu cầu; hoàn thành bước tạo người dùng Ubuntu nếu cửa sổ Ubuntu xuất hiện. Sau đó mở PowerShell và kiểm tra:

```powershell
wsl --update
wsl --version
wsl --status
wsl -l -v
```

WSL phải dùng version 2. Nếu Ubuntu hiện version 1, dùng `wsl --set-version Ubuntu 2`; thay Ubuntu bằng tên chính xác trong danh sách. Docker yêu cầu WSL 2.1.5 trở lên theo tài liệu đã đối chiếu [3][4].

### Bước 3 — Cài Docker Desktop

Tải từ https://docs.docker.com/desktop/setup/install/windows-install/.

Chọn bản Windows x86_64 cho Intel/AMD. Cài, mở Docker Desktop; dùng WSL 2 backend nếu trình cài đặt cho lựa chọn. Đợi Docker Engine hoạt động, rồi mở PowerShell mới:

```powershell
docker version
docker compose version
docker info --format '{{.OSType}}'
```

Lệnh cuối phải trả về `linux`. Nếu không có phần Server trong `docker version`, kiểm tra Docker Desktop đã mở và WSL đã hoạt động. Docker Desktop có điều kiện cấp phép riêng; nhóm học tập/cá nhân kiểm tra điều khoản ở trang cài đặt, đặc biệt nếu sau này dùng trong doanh nghiệp [3].

### Bước 4 — Cài công cụ phát triển

- Git for Windows: https://git-scm.com/downloads/win
- Node.js 22 LTS: https://nodejs.org/en/download
- Trình soạn thảo tùy chọn: VS Code hoặc công cụ quen dùng.

Kiểm tra trong PowerShell mới:

```powershell
git --version
node --version
npm --version
```


## 3. Tải và chạy OpenProject trên Windows

Hướng dẫn dùng **một container all-in-one để thử nghiệm local**, cùng kiểu với máy Mac của bạn. OpenProject khuyến nghị Compose nhiều dịch vụ với ảnh slim cho vận hành lâu dài; xem [5][6] khi chuyển sang máy chủ. Không có trình cài OpenProject `.exe` trong quy trình này.

### Bước 1 — Giải nén bộ khung

Giải nén ZIP để có đường dẫn:

```text
C:\Projects\openproject-ai\README.md
```

Nếu chọn thư mục khác, thay đường dẫn trong các lệnh. Không giải nén đè lên mã nguồn đang làm của nhóm.

### Bước 2 — Tạo cấu hình riêng của máy

Trong PowerShell:

```powershell
Set-Location C:\Projects\openproject-ai
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\init-openproject-env.ps1
Set-Location .\infra\openproject
docker compose config --quiet
```

Script đi kèm tạo `.env` với khóa ngẫu nhiên, không ghi đè file đã tồn tại. Chỉ dùng `ExecutionPolicy Bypass` cho lần chạy file này sau khi đọc nội dung; không cần đổi chính sách toàn máy. Giữ nguyên khóa qua các lần khởi động và giữ bản cấu hình riêng khi chuyển dữ liệu [5].

### Bước 3 — Tải image và khởi động

```powershell
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail 100 openproject
```

Lần đầu có thể mất nhiều phút vì tải image và khởi tạo dữ liệu. Khi sẵn sàng, mở **http://localhost:8080**. Tài khoản khởi tạo thường là `admin` / `admin`; đổi mật khẩu ngay khi đăng nhập [5]. Nếu gặp 503, xem bảng xử lý lỗi ở dưới; container Up chưa chứng minh web đã sẵn sàng.

### File Compose đi kèm

File `infra/openproject/compose.yaml` chứa:

```yaml
services:
  openproject:
    image: ${OPENPROJECT_IMAGE:-openproject/openproject:17}
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    environment:
      SECRET_KEY_BASE: ${SECRET_KEY_BASE:?Run init-openproject-env.ps1 first}
      OPENPROJECT_HOST__NAME: localhost:8080
      OPENPROJECT_HTTPS: "false"
      OPENPROJECT_DEFAULT__LANGUAGE: en
    volumes:
      - pgdata:/var/openproject/pgdata
      - assets:/var/openproject/assets
volumes:
  pgdata:
  assets:
```

Đây là cấu hình local của nhóm, dựa trên các tham số Docker chính thức [5]. Named volumes giữ cơ sở dữ liệu và tệp đính kèm. Port chỉ nghe trên máy đó; bạn bè ở máy khác không vào bằng localhost của bạn. HTTP local này phục vụ thử nghiệm.

### Bước 4 — Ghi nhận phiên bản chung

Tag `17` có thể trỏ đến bản 17.x khác theo thời gian. Sau khi cả nhóm thống nhất bản hoạt động, ghi bản OpenProject trong giao diện quản trị và digest:

```powershell
docker image inspect openproject/openproject:17 --format '{{index .RepoDigests 0}}'
```

Chép giá trị thực nhận được vào `OPENPROJECT_IMAGE=` trong `.env`, đồng thời ghi vào `docs/environment.md`. Không tự điền một digest giả. Khi chuyển dữ liệu giữa máy, dùng cùng phiên bản trước khi khôi phục.

### Khởi động những lần sau

Mở Docker Desktop trước, vào `infra/openproject`, rồi dùng:

```powershell
docker compose up -d
```

Dừng để nghỉ: `docker compose stop`. Tạo lại container khi đổi cấu hình: `docker compose up -d`. **Không dùng `docker compose down -v` để dừng thông thường:** cờ `-v` có thể xóa các volume chứa dữ liệu.

### Xử lý lỗi thường gặp

| Hiện tượng | Kiểm tra và xử lý |
|---|---|
| `docker` không được nhận diện | Mở PowerShell mới; kiểm tra Docker Desktop đã cài |
| Không kết nối Docker daemon | Mở Docker Desktop; kiểm tra WSL và ảo hóa |
| Port 8080 đã được dùng | Dừng ứng dụng đang giữ port, hoặc đổi port cùng `OPENPROJECT_HOST__NAME` |
| Web trả 503 | Xem logs, `docker stats --no-stream`; đợi khởi tạo, xử lý lỗi RAM/database nếu có |
| Container restart liên tục | Xem lỗi đầu tiên trong logs; kiểm tra khóa `.env` và bộ nhớ |
| Đăng nhập được nhưng thiếu type/trạng thái | Kiểm tra type đã bật trong dự án và workflow của đúng role |

503 không nên được xử lý bằng cách xóa volume. Khi nhờ hỗ trợ, gửi logs đã loại token/mật khẩu và phiên bản Windows, Docker, OpenProject.


Nguồn và bối cảnh đầy đủ: [README](../README.md), mục 14.
