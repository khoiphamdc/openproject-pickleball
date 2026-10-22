import { client } from "./client.js";

// ==================== CSV parser ====================
export function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        /* skip */
      } else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length === 1 && rows[i][0] === "") continue;
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => (obj[h] = rows[i][idx] ?? ""));
    out.push(obj);
  }
  return out;
}

function parseJiraDate(s: string): string | undefined {
  if (!s) return undefined;
  const datePart = s.split(" ")[0];
  const m1 = datePart.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})$/);
  if (m1) {
    const months: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const mon = months[m1[2]];
    if (mon) return `20${m1[3]}-${mon}-${m1[1].padStart(2, "0")}`;
  }
  const m2 = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) {
    return `${m2[3]}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  }
  return undefined;
}

// ==================== Import Jira CSV ====================

export interface ImportJiraCsvOptions {
  filePath?: string;
  csvContent: string;
  projectName: string;
  projectIdentifier: string;
  description?: string;
  parentId?: number;
  public?: boolean;
}

export interface ImportJiraCsvReport {
  projectId: number;
  projectIdentifier: string;
  createdWorkPackages: number;
  skipped: number;
  errors: { issueKey: string; message: string }[];
  mapping: Record<string, number>;
}

export async function jiraCsvToProject(
  opts: ImportJiraCsvOptions,
): Promise<ImportJiraCsvReport> {
  const records = parseCsv(opts.csvContent);
  if (records.length === 0) throw new Error("CSV rỗng hoặc không đọc được");

  // ==========================================
  // BƯỚC 1: TẠO PROJECT
  // ==========================================
  let project;
  try {
    project = await client.createProject({
      name: opts.projectName,
      identifier: opts.projectIdentifier,
      description: opts.description,
      parentId: opts.parentId,
      public: opts.public ?? false,
    });
  } catch (e: any) {
    const detail = e.response?.data
      ? JSON.stringify(e.response.data, null, 2)
      : e.message;
    throw new Error(`Tạo project thất bại: ${detail}`);
  }
  const projectId = project.id;

  // Đợi 2 giây để OpenProject khởi tạo xong các thiết lập mặc định (Types, Statuses)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ==========================================
  // BƯỚC 2: LẤY DANH SÁCH TYPE VÀ STATUS MẶC ĐỊNH
  // ==========================================
  // Lấy danh sách Type của project
  let types =
    (await client.getProjectTypes(projectId))._embedded?.elements ?? [];
  if (types.length === 0) {
    types = (await client.listTypes())._embedded?.elements ?? [];
  }
  if (types.length === 0) {
    throw new Error("Project không có Type nào khả dụng.");
  }

  // Lấy danh sách Status
  const statuses = (await client.listStatuses())._embedded?.elements ?? [];
  if (statuses.length === 0) {
    throw new Error("Hệ thống không có Status nào khả dụng.");
  }

  // Hàm map Type (Fallback thông minh, không tạo mới)
  const findType = (name: string) => {
    const n = name.toLowerCase().trim();
    const exact = types.find((t) => t.name.toLowerCase() === n);
    if (exact) return exact;

    // Map Epic/Story sang Feature (hoặc Milestone) nếu OpenProject không có
    if (n === "epic" || n === "story") {
      const feature = types.find((t) => /feature|milestone/i.test(t.name));
      if (feature) return feature;
    }
    // Map Subtask sang Task
    if (n === "subtask") {
      const task = types.find((t) => /task/i.test(t.name));
      if (task) return task;
    }
    // Map Bug
    if (n === "bug") {
      const bug = types.find((t) => /bug/i.test(t.name));
      if (bug) return bug;
    }

    // Mặc định trả về Task
    const defaultTask = types.find((t) => /task/i.test(t.name));
    return defaultTask || types[0];
  };

  // Hàm map Status
  const findStatus = (name: string) => {
    const n = name.toLowerCase().trim();
    const exact = statuses.find((s) => s.name.toLowerCase() === n);
    if (exact) return exact;

    // Map "READY" sang "New" hoặc status mở
    if (n === "ready") {
      const newStatus = statuses.find((s) => s.name.toLowerCase() === "new");
      if (newStatus) return newStatus;
    }
    // Map "TO DO"
    if (["to do", "todo"].includes(n)) {
      return statuses.find((s) => !s.isClosed) || statuses[0];
    }
    // Map "Done", "Closed"
    if (["done", "closed", "resolved"].includes(n)) {
      return statuses.find((s) => s.isClosed) || statuses[0];
    }
    return statuses[0];
  };

  // ==========================================
  // BƯỚC 3: TẠO WORK PACKAGES
  // ==========================================
  // Sắp xếp thứ tự để tạo cha trước, con sau
  const rank: Record<string, number> = {
    epic: 0,
    story: 1,
    task: 2,
    bug: 2,
    subtask: 3,
  };
  const sorted = [...records].sort((a, b) => {
    const ra = rank[(a["Issue Type"] ?? "").toLowerCase()] ?? 2;
    const rb = rank[(b["Issue Type"] ?? "").toLowerCase()] ?? 2;
    if (ra !== rb) return ra - rb;
    return (a["Issue id"] ?? "").localeCompare(b["Issue id"] ?? "");
  });

  const mapping: Record<string, number> = {};
  const errors: { issueKey: string; message: string }[] = [];
  const prefixToWpId = new Map<string, number>();
  let created = 0;
  let skipped = 0;

  const extractPrefix = (summary: string) => {
    const m = summary.match(/^(?:Epic|Story|Task|Subtask)\s+([\d.]+)/i);
    return m ? m[1] : null;
  };
  const parentPrefix = (prefix: string) => {
    const parts = prefix.split(".");
    parts.pop();
    return parts.join(".");
  };

  for (const row of sorted) {
    const issueKey = row["Issue key"] ?? "";
    try {
      const summary = row["Summary"] ?? "";
      const issueType = row["Issue Type"] ?? "";
      const statusName = row["Status"] ?? "";

      const type = findType(issueType);
      const status = findStatus(statusName);
      const prefix = extractPrefix(summary);

      let parentId: number | undefined;
      if (prefix) {
        const pp = parentPrefix(prefix);
        if (pp) {
          const pid = prefixToWpId.get(pp);
          if (pid) parentId = pid;
        }
      }

      const assignee = row["Assignee"] ?? "";
      const reporter = row["Reporter"] ?? "";
      const desc =
        assignee || reporter
          ? `Assignee (Jira): ${assignee || "—"}\nReporter (Jira): ${reporter || "—"}`
          : undefined;

      const wp = await client.createWorkPackage({
        subject: summary,
        description: desc,
        projectId,
        typeId: type.id,
        statusId: status.id,
        dueDate: parseJiraDate(row["Due date"] ?? ""),
        parentId,
      });

      mapping[issueKey] = wp.id;
      if (prefix) prefixToWpId.set(prefix, wp.id);
      created++;
    } catch (e: any) {
      const detail = e.response?.data
        ? JSON.stringify(e.response.data)
        : e.message;
      errors.push({ issueKey, message: detail });
      skipped++;
    }
  }

  return {
    projectId,
    projectIdentifier: project.identifier,
    createdWorkPackages: created,
    skipped: skipped,
    errors: errors,
    mapping: mapping,
  };
}
