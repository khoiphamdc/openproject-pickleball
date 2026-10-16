import { McpServer } from "@modelcontextprotocol/server";
import { registerProjectTools } from "./tools/projects.js";
import { registerWorkPackageTools } from "./tools/workPackages.js";
import { registerCatalogTools } from "./tools/catalog.js";
import { registerRoleTools } from "./tools/roles.js";
import { registerSearchTools } from "./tools/search.js";
import { registerUsersTools } from "./tools/users.js";

export function registerAllTools(server: McpServer) {
  registerProjectTools(server);
  registerWorkPackageTools(server);
  registerCatalogTools(server);
  registerRoleTools(server);
  registerSearchTools(server);
  registerUsersTools(server);
}
