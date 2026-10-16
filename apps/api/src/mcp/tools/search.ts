import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { search } from "../../openproject/catalog.js";

export function registerSearchTools(server: McpServer) {
  server.registerTool(
    "op_search",
    {
      description: "Tìm kiếm work package trên toàn bộ dự án.",
      inputSchema: z.object({
        query: z.string().min(1),
        projectId: z.union([z.string(), z.number()]).optional(),
        typeId: z.number().int().positive().optional(),
        statusId: z.number().int().positive().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query, ...params }) => {
      const result = await search(query, params);
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
