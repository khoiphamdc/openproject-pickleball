# API va MCP — phan can trien khai

Thu muc nay chua co app hay package.json. A khoi tao Node.js 22 LTS + TypeScript
va ghi lenh install/build/test/dev chinh xac vao day sau khi hoan thanh.

Entrypoint REST cho web (127.0.0.1:3001); MCP stdio wrapper cho AI client.
Che do nhieu member: wrapper goi REST gateway da xac thuc, module adapter va
analytics/scoring/permissions o trusted backend. Tach config cua wrapper khoi
backend .env; khong sao chep nghiep vu hay service token vao client.

A so huu config/auth/permissions/openproject/mcp va entrypoint chung; B so huu analytics/DB;
C so huu scoring. Route moi va database migrations phai theo contract.
Ket noi OpenProject qua API v3, khong ghi truc tiep vao PostgreSQL cua OP.

Doc README goc muc 4.1 va docs/permissions.md. Che do nhieu thanh vien phai co
actor da xac thuc, kiem tra role + assignee + workstream + fields + reviewer
cho moi REST/MCP tool. Service token chi tren trusted backend; member local MCP
wrapper goi backend, khong mang token ghi. Trong OP, tat quyen Edit/Change status
truc tiep cua BA/BE/FE/Tester neu chon che do nghiem ngat. Scaffold chua co auth.

SQLite path theo backend root/repository root duoc chot trong config, khong phu
thuoc tuy tien vao cwd. Khi hai process cung truy cap, chot WAL, busy timeout,
transactions va mot dau moi migration; kiem tra concurrent operations.

Workflow rieng tung type: docs/workflow.md va
packages/contracts/workflow-policy.example.json (duong dan tu repository root).
A trien khai get_allowed_transitions va transition_work_package; update status
phai dung chung policy, khong vuot role/assignee/reviewer hoac lockVersion.
Story review o INSPECT; Task o REVIEW; Subtask Complete truc tiep DONE.
B luu completedAt Subtask rieng acceptedAt khi task cha nghiem thu; C chi tinh
diem sau nghiem thu. JSON chi la mau tham chieu, scaffold chua co tool/policy runtime.
