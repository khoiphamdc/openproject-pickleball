import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { listRoles, listGroups } from "../../openproject/catalog.js";

export function registerRoleTools(server: McpServer) {
  server.registerTool(
    "op_list_roles",
    {
      description: "Liệt kê tất cả vai trò.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await listRoles();
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
    "op_list_groups",
    {
      description: "Liệt kê tất cả nhóm.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await listGroups();
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
