import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listProjectMembers,
  addProjectMember,
  removeProjectMember,
  listProjectVersions,
  createVersion,
} from "../../openproject/projects.js";

const projectIdSchema = z.union([z.string(), z.number()]);

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    "op_list_projects",
    {
      description: "Liệt kê tất cả dự án trong OpenProject.",
      inputSchema: z.object({
        page: z.number().int().positive().optional(),
        perPage: z.number().int().min(1).max(100).optional(),
        filters: z.string().optional().describe("Chuỗi JSON filter nâng cao"),
        sortBy: z.string().optional().describe('vd: [["name","asc"]]'),
      }),
      annotations: { readOnlyHint: true },
    },
    async (params) => {
      const result = await listProjects(params);
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
    "op_get_project",
    {
      description: "Lấy thông tin chi tiết một dự án theo ID hoặc identifier.",
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const result = await getProject(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "op_create_project",
    {
      description: "Tạo dự án mới trong OpenProject.",
      inputSchema: z.object({
        name: z.string().min(1),
        identifier: z
          .string()
          .min(1)
          .describe("Identifier duy nhất, chữ thường, gạch ngang"),
        description: z.string().optional(),
        parentId: z.number().int().positive().optional(),
        active: z.boolean().default(true),
        public: z.boolean().default(false),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ public: isPublic, ...rest }) => {
      const result = await createProject({ ...rest, public: isPublic });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "op_update_project",
    {
      description: "Cập nhật dự án hiện có.",
      inputSchema: z.object({
        projectId: projectIdSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
        public: z.boolean().optional(),
        status: z.enum(["on_track", "at_risk", "off_track"]).optional(),
      }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ projectId, ...data }) => {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data))
        if (v !== undefined) clean[k] = v;
      const result = await updateProject(projectId, clean);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "op_delete_project",
    {
      description: "Xóa dự án. CẢNH BÁO: Không thể hoàn tác!",
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { destructiveHint: true },
    },
    async ({ projectId }) => {
      await deleteProject(projectId);
      return { content: [{ type: "text", text: "Đã xóa dự án thành công" }] };
    },
  );

  server.registerTool(
    "op_list_project_members",
    {
      description: "Liệt kê thành viên dự án cùng vai trò.",
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const result = await listProjectMembers(projectId);
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
    "op_add_project_member",
    {
      description: "Thêm thành viên vào dự án với vai trò chỉ định.",
      inputSchema: z.object({
        projectId: projectIdSchema,
        userId: z.number().int().positive(),
        roleIds: z.array(z.number().int().positive()).min(1),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ projectId, userId, roleIds }) => {
      const result = await addProjectMember(projectId, userId, roleIds);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "op_remove_project_member",
    {
      description: "Xóa thành viên khỏi dự án.",
      inputSchema: z.object({
        projectId: projectIdSchema,
        membershipId: z.number().int().positive(),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ projectId, membershipId }) => {
      await removeProjectMember(projectId, membershipId);
      return {
        content: [{ type: "text", text: "Đã xóa thành viên thành công" }],
      };
    },
  );

  server.registerTool(
    "op_list_project_versions",
    {
      description: "Liệt kê versions (milestones/releases) trong dự án.",
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const result = await listProjectVersions(projectId);
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
    "op_create_version",
    {
      description: "Tạo version mới trong dự án.",
      inputSchema: z.object({
        projectId: projectIdSchema,
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["open", "locked", "closed"]).optional(),
        startDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ projectId, ...data }) => {
      const result = await createVersion(projectId, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
