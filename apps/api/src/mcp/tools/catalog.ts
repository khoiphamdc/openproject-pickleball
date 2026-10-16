import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
  listStatuses,
  listTypes,
  getProjectTypes,
  listPriorities,
} from "../../openproject/catalog.js";

const projectIdSchema = z.union([z.string(), z.number()]);

export function registerCatalogTools(server: McpServer) {
  // ---- Statuses ----
  server.registerTool(
    "op_list_statuses",
    {
      description: "Liệt kê tất cả status.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await listStatuses();
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

  // ---- Types ----
  server.registerTool(
    "op_list_types",
    {
      description: "Liệt kê tất cả type.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await listTypes();
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
    "op_get_project_types",
    {
      description: "Liệt kê type có sẵn trong dự án.",
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const result = await getProjectTypes(projectId);
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

  // ---- Priorities ----
  server.registerTool(
    "op_list_priorities",
    {
      description: "Liệt kê tất cả priority.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await listPriorities();
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
