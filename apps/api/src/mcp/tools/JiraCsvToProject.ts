import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import fs from "node:fs/promises";
import path from "node:path";
import {
  jiraCsvToProject,
  parseCsv,
} from "../../openproject/jiraCsvToProject.js";

export function registerCsvTools(server: McpServer) {
  // ==========================================
  // TOOL 1: IMPORT (Tạo thật)
  // ==========================================
  server.registerTool(
    "op_import_jira_csv",
    {
      description:
        "Tạo dự án OpenProject từ nội dung file CSV export của Jira. " +
        "Truyền đường dẫn file trên máy chứa MCP server để hệ thống tự đọc.",
      inputSchema: z.object({
        filePath: z
          .string()
          .min(1)
          .describe(
            "Đường dẫn tuyệt đối tới file CSV (vd: C:\\Data\\Jira.csv)",
          ),
        projectName: z
          .string()
          .min(1)
          .describe("Tên project mới trên OpenProject"),
        projectIdentifier: z
          .string()
          .min(1)
          .regex(/^[a-z0-9-]+$/, "Chỉ chữ thường, số, gạch ngang")
          .describe("Identifier duy nhất, chữ thường, gạch ngang"),
        description: z.string().optional(),
        parentId: z.number().int().positive().optional(),
        public: z.boolean().default(false),
      }),
      annotations: { destructiveHint: false },
    },
    async (input) => {
      try {
        // Xử lý xóa dấu ngoặc kép nếu có do copy paste
        const cleanPath = input.filePath.replace(/^"|"$/g, "").trim();
        const absolutePath = path.resolve(cleanPath);

        const csvContent = await fs.readFile(absolutePath, "utf8");

        const report = await jiraCsvToProject({
          ...input,
          csvContent,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      } catch (error: any) {
        // IN CHI TIẾT LỖI 422 RA MÀN HÌNH INSPECTOR
        const detail = error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : error.message;
        return {
          content: [{ type: "text", text: `Lỗi Import: ${detail}` }],
          isError: true,
        };
      }
    },
  );

  // ==========================================
  // TOOL 2: PREVIEW (Chỉ đọc và thống kê)
  // ==========================================
  server.registerTool(
    "op_preview_jira_csv",
    {
      description:
        "Đọc và phân tích file CSV Jira (KHÔNG tạo gì trên OpenProject). Trả về tổng số dòng, danh sách Issue Type, Status, và 3 dòng mẫu đầu tiên để kiểm tra.",
      inputSchema: z.object({
        filePath: z
          .string()
          .min(1)
          .describe("Đường dẫn tuyệt đối tới file CSV"),
      }),
      annotations: { readOnlyHint: true },
    },
    async (input) => {
      try {
        const cleanPath = input.filePath.replace(/^"|"$/g, "").trim();
        const csvContent = await fs.readFile(cleanPath, "utf8");

        const records = parseCsv(csvContent);
        if (records.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "File CSV rỗng hoặc không đúng định dạng.",
              },
            ],
          };
        }

        const types: Record<string, number> = {};
        const statuses: Record<string, number> = {};

        for (const row of records) {
          const type = row["Issue Type"] || "Không rõ";
          const status = row["Status"] || "Không rõ";
          types[type] = (types[type] || 0) + 1;
          statuses[status] = (statuses[status] || 0) + 1;
        }

        const report = {
          totalRows: records.length,
          issueTypes: types,
          statuses: statuses,
          // sampleFirst3Rows: records.slice(0, 3),
          sampleFirst3Rows: records,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Lỗi đọc file: ${error.message}` }],
          isError: true,
        };
      }
    },
  );
}
