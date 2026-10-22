import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export function registerHelloTools(server: McpServer) {
  server.registerTool(
    "say-hello-openproject",
    {
      description: "Xin chào OpenProject, lời chào, hello",
      inputSchema: z.object({
        name: z.string().optional().describe("Tên người dùng"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ name }) => {
      const greeting = name ? `Xin chào ${name}!` : "Xin chào bạn.";
      return {
        content: [
          {
            type: "text",
            text: `${greeting} MCP server OpenProject đã sẵn sàng.\nTesting...............('-')...............`,
          },
        ],
      };
    },
  );
}
