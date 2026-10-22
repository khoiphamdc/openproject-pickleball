import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { client } from "../../openproject/client.js"; // Import client toàn cục

export function registerTypeTools(server: McpServer) {
  // TOOL 1: Liệt kê tất cả các Type có sẵn trên hệ thống
  server.registerTool(
    "op_list_types",
    {
      description:
        "Liệt kê tất cả các Work Package Type có sẵn trên hệ thống OpenProject (Task, Bug, Feature, Milestone...).",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const result = await client.listTypes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result._embedded.elements, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Lỗi: ${error.message}` }],
          isError: true,
        };
      }
    },
  );

  // TOOL 2: Thêm (gán) một Type vào Project
  server.registerTool(
    "op_add_type_to_project",
    {
      description:
        "Gán một Work Package Type có sẵn vào một Project cụ thể để có thể sử dụng Type đó khi tạo Work Package.",
      inputSchema: z.object({
        projectId: z
          .union([z.string(), z.number()])
          .describe("ID hoặc identifier của Project"),
        typeId: z
          .number()
          .int()
          .positive()
          .describe("ID của Type cần thêm (lấy từ tool op_list_types)"),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ projectId, typeId }) => {
      try {
        await client.addTypeToProject(projectId, typeId);
        return {
          content: [
            {
              type: "text",
              text: `Đã thêm Type ID ${typeId} vào Project ${projectId} thành công.`,
            },
          ],
        };
      } catch (error: any) {
        const detail = error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : error.message;
        return {
          content: [{ type: "text", text: `Lỗi: ${detail}` }],
          isError: true,
        };
      }
    },
  );
}
