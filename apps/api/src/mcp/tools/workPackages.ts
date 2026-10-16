import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {
  listWorkPackages,
  getWorkPackage,
  createWorkPackage,
  updateWorkPackage,
  deleteWorkPackage,
  listWorkPackageActivities,
  addWorkPackageComment,
  listWorkPackageRelations,
  createWorkPackageRelation,
  deleteWorkPackageRelation,
  getProjectWorkPackages,
} from '../../openproject/workPackages.js';

const projectIdSchema = z.union([z.string(), z.number()]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function registerWorkPackageTools(server: McpServer) {

  server.registerTool(
    'op_list_work_packages',
    {
      description: 'Liệt kê work packages với bộ lọc tùy chọn.',
      inputSchema: z.object({
        projectId: projectIdSchema.optional(),
        filters: z.string().optional(),
        page: z.number().int().positive().optional(),
        perPage: z.number().int().min(1).max(100).optional(),
        sortBy: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (params) => {
      const result = await listWorkPackages(params);
      return { content: [{ type: 'text', text: JSON.stringify(result._embedded.elements, null, 2) }] };
    }
  );

  server.registerTool(
    'op_get_work_package',
    {
      description: 'Lấy chi tiết work package theo ID.',
      inputSchema: z.object({ workPackageId: z.number().int().positive() }),
      annotations: { readOnlyHint: true },
    },
    async ({ workPackageId }) => {
      const result = await getWorkPackage(workPackageId);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'op_create_work_package',
    {
      description: 'Tạo work package mới (task, bug, feature...).',
      inputSchema: z.object({
        subject: z.string().min(1).max(255),
        projectId: projectIdSchema,
        description: z.string().optional(),
        typeId: z.number().int().positive().optional(),
        statusId: z.number().int().positive().optional(),
        priorityId: z.number().int().positive().optional(),
        assigneeId: z.number().int().positive().optional(),
        startDate: dateSchema.optional(),
        dueDate: dateSchema.optional(),
        estimatedTime: z.string().optional(),
        parentId: z.number().int().positive().optional(),
        versionId: z.number().int().positive().optional(),
      }),
      annotations: { destructiveHint: false },
    },
    async (input) => {
      const result = await createWorkPackage(input);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'op_update_work_package',
    {
      description: 'Cập nhật work package.',
      inputSchema: z.object({
        workPackageId: z.number().int().positive(),
        subject: z.string().optional(),
        description: z.string().optional(),
        statusId: z.number().int().positive().optional(),
        typeId: z.number().int().positive().optional(),
        priorityId: z.number().int().positive().optional(),
        assigneeId: z.number().int().positive().optional(),
        startDate: dateSchema.optional(),
        dueDate: dateSchema.optional(),
        estimatedTime: z.string().optional(),
        percentageDone: z.number().int().min(0).max(100).optional(),
        parentId: z.number().int().positive().optional(),
        versionId: z.number().int().positive().optional(),
        lockVersion: z.number().int().positive().optional(),
      }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ workPackageId, ...data }) => {
      const result = await updateWorkPackage(workPackageId, data);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'op_delete_work_package',
    {
      description: 'Xóa work package. CẢNH BÁO: Không thể hoàn tác!',
      inputSchema: z.object({ workPackageId: z.number().int().positive() }),
      annotations: { destructiveHint: true },
    },
    async ({ workPackageId }) => {
      await deleteWorkPackage(workPackageId);
      return { content: [{ type: 'text', text: 'Đã xóa work package thành công' }] };
    }
  );

  server.registerTool(
    'op_list_work_package_activities',
    {
      description: 'Liệt kê hoạt động trên work package.',
      inputSchema: z.object({ workPackageId: z.number().int().positive() }),
      annotations: { readOnlyHint: true },
    },
    async ({ workPackageId }) => {
      const result = await listWorkPackageActivities(workPackageId);
      return { content: [{ type: 'text', text: JSON.stringify(result._embedded.elements, null, 2) }] };
    }
  );

  server.registerTool(
    'op_add_work_package_comment',
    {
      description: 'Thêm bình luận vào work package.',
      inputSchema: z.object({
        workPackageId: z.number().int().positive(),
        comment: z.string().min(1),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ workPackageId, comment }) => {
      const result = await addWorkPackageComment(workPackageId, comment);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'op_list_work_package_relations',
    {
      description: 'Liệt kê quan hệ của work package.',
      inputSchema: z.object({ workPackageId: z.number().int().positive() }),
      annotations: { readOnlyHint: true },
    },
    async ({ workPackageId }) => {
      const result = await listWorkPackageRelations(workPackageId);
      return { content: [{ type: 'text', text: JSON.stringify(result._embedded.elements, null, 2) }] };
    }
  );

  server.registerTool(
    'op_create_work_package_relation',
    {
      description: 'Tạo quan hệ giữa hai work package.',
      inputSchema: z.object({
        workPackageId: z.number().int().positive(),
        type: z.enum(['relates', 'blocks', 'precedes', 'follows', 'includes', 'requires']),
        workPackageIdTo: z.number().int().positive(),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ workPackageId, type, workPackageIdTo }) => {
      const result = await createWorkPackageRelation(workPackageId, { type, workPackageIdTo });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'op_delete_work_package_relation',
    {
      description: 'Xóa quan hệ giữa các work package.',
      inputSchema: z.object({
        workPackageId: z.number().int().positive(),
        relationId: z.number().int().positive(),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ workPackageId, relationId }) => {
      await deleteWorkPackageRelation(workPackageId, relationId);
      return { content: [{ type: 'text', text: 'Đã xóa quan hệ thành công' }] };
    }
  );

  server.registerTool(
    'op_get_project_work_packages',
    {
      description: 'Lấy tất cả work package trong dự án.',
      inputSchema: z.object({ projectId: projectIdSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => {
      const result = await getProjectWorkPackages(projectId);
      return { content: [{ type: 'text', text: JSON.stringify(result._embedded.elements, null, 2) }] };
    }
  );
}