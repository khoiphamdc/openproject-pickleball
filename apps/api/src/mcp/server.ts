import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { registerAllTools } from "./tools.js";
import { registerHelloTools } from "./tools/hello-openproject.js";
import { registerCsvTools } from "./tools/JiraCsvToProject.js";
import { registerTypeTools } from "./tools/types.js";

serveStdio(() => {
  const server = new McpServer({
    name: "openproject-ai",
    version: "1.0.0",
  });

  registerAllTools(server);

  // Test McpServer
  registerHelloTools(server);
  // csv tools
  registerCsvTools(server);
  // registerTypeTools(server);

  return server;
});

// stdout là kênh JSON-RPC — TUYỆT ĐỐI không dùng console.log
console.error("OpenProject AI MCP server running on stdio");
