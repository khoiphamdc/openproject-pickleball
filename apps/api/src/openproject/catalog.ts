import { client } from "./client.js";

// ==================== CATALOG ====================

export const listStatuses = () => client.listStatuses();
export const listTypes = () => client.listTypes();
export const getProjectTypes = (projectId: number | string) =>
  client.getProjectTypes(projectId);
export const listPriorities = () => client.listPriorities();

// ==================== ROLES & GROUPS ====================

export const listRoles = () => client.listRoles();
export const listGroups = () => client.listGroups();

// ==================== SEARCH ====================

export const search = (
  query: string,
  params?: Parameters<typeof client.search>[1],
) => client.search(query, params);
