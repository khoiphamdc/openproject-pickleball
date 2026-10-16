import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
  listUsers,
  getUser,
  getCurrentUser,
  listProjectAvailableAssignees,
} from "../../openproject/users.js";

const projectIdSchema = z.union([z.string(), z.number()]);

export function registerUsersTools(server: McpServer) {
  // ---- Users ----
  server.registerTool(
    "op_list_users",
    {
      description: "Liệt kê tất cả người dùng.",
      inputSchema: z.object({
        page: z.number().int().positive().optional(),
        perPage: z.number().int().min(1).max(100).optional(),
        filters: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (params) => {
      const result = await listUsers(params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result._embedded.elements, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "op_get_user",
    {
      description: "Lấy chi tiết người dùng.",
      inputSchema: z.object({ userId: z.number().int().positive() }),
      annotations: { readOnlyHint: true },
    },
    async ({ userId }) => {
      const result = await getUser(userId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "op_get_current_user",
    {
      description: "Lấy người dùng đang xác thực.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await getCurrentUser();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "op_list_project_assignees",
    {
      description:
        "Liệt kê người dùng có thể gán vào work package trong dự án.",
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const result = await listProjectAvailableAssignees(projectId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result._embedded.elements, null, 2),
          },
        ],
      };
    },
  );
}
