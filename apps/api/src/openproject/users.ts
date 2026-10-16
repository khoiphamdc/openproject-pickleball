import { client } from "./client.js";

// ==================== USERS ====================

export const listUsers = (params?: Parameters<typeof client.listUsers>[0]) =>
  client.listUsers(params);

export const getUser = (id: number) => client.getUser(id);

export const getCurrentUser = () => client.getCurrentUser();

export const listProjectAvailableAssignees = (projectId: number | string) =>
  client.listProjectAvailableAssignees(projectId);
