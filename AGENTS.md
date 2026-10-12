# Huong dan cho Codex va thanh vien nhom

Doc README.md truoc khi sua. Day la scaffold/tai lieu, chua co app hoan chinh.

## Pham vi

- A: khoi tao workspace TypeScript, config, auth, permissions, OpenProject adapter, MCP, entrypoints.
- B: analytics, database/migrations, task/bug attribution, reporting API.
- C: scoring, dashboard React, giao dien va score-run contract voi B.
- Khong sua ma nguon OpenProject; ket noi API v3. Khong ghi SQL truc tiep vao DB OpenProject.
- Khong dua token vao frontend, logs, Git, fixtures. Khong tao secret that trong repo.
- Khong dua .env/runtime/data dump vao commit. Kiem tra diff va git status truoc commit.
- Doc README muc 4.1 va docs/permissions.md: PM/BA/BE/FE/Tester la role su dung,
  A/B/C la nguoi trien khai. BE/FE chi sua task cua chinh minh, dung workstream.
- Khong coi workflow User is assignee la quyen sua moi field cua task.
- Che do nghiem ngat: role OP cua BA/BE/FE/Tester khong co Edit/Change status
  truc tiep; thao tac qua trusted backend. Service token chi nam tren backend
  do nguoi van hanh kiem soat, khong tren may BE/FE hay local MCP wrapper.

## Quy tac trien khai

- Chot contracts voi mau demo truoc; mock mode cung contract voi adapter that.
- Node 22 LTS; SDK MCP on dinh tuong thich client. Khoa dependencies bang lockfile.
- Backend REST va MCP stdio dung chung module nghiep vu. Stdio logs vao stderr.
- Auth actor tu session/token da kiem chung, khong tin actorId/role trong AI body.
  Permissions check action/field/current assignee/workstream/reviewer truoc write.
  Kiem tra lai sau lock conflict; khong cho payload tu reassign de tang quyen.
- Trusted gateway gui OpenProject write bang service token; audit actor that va
  service identity. Local MCP wrapper cua member chi goi gateway da xac thuc.
- SQLite chi luu metadata/snapshots/quy tac diem; A/B chot WAL, busy timeout,
  transactions va quy trinh migration vi REST va MCP co the la hai process.
- Khong hard-code type/status/user IDs cua mot OpenProject instance.
- Doc README muc 5 va packages/contracts/workflow-policy.example.json.
  Epic/Story/Task/Subtask co workflow rieng theo 4 anh; khong copy chung.
  Story dung INSPECT, Task dung REVIEW, Subtask Complete truc tiep DONE.
  Any->CANCELLED va REDO chi PM; khong them DONE->IN PROGRESS truc tiep.
  Moi tool update status phai dung chung policy voi transition tool.
  Subtask completedAt khac acceptedAt: chi tinh diem sau nghiem thu task cha.
- Bao cao chi tinh don vi thuc thi; khong dem parent va child hai lan.
- Thieu du lieu tra incomplete/N/A, khong tu dat diem 0.
- Kiem tra nghiep vu co y nghia: permissions, lock conflict, retries,
  denominator=0, duplicate bugs, reopen, baseline va score version.
- Cap nhat README lenh chay that, docs/contracts va ban giao trong cung thay doi.
- Khong noi app chay duoc neu chi moi co scaffold. Khong xoa volumes khi gap loi.

## Dau ra ban giao

Branch/commit, thay doi, lenh chay, ket qua kiem tra, migration/contract,
han che va viec tiep theo. Review cheo B->A, C->B, A->C theo README.
