import { client } from "./client.js";

// ==================== PROJECTS ====================

export const listProjects = (
  params?: Parameters<typeof client.listProjects>[0],
) => client.listProjects(params);

export const getProject = (id: number | string) => client.getProject(id);

export const createProject = (
  input: Parameters<typeof client.createProject>[0],
) => client.createProject(input);

export const updateProject = (
  id: number | string,
  input: Parameters<typeof client.updateProject>[1],
) => client.updateProject(id, input);

export const deleteProject = (id: number | string) => client.deleteProject(id);

// ==================== PROJECT MEMBERS ====================

export const listProjectMembers = (projectId: number | string) =>
  client.listProjectMembers(projectId);

export const addProjectMember = (
  projectId: number | string,
  userId: number,
  roleIds: number[],
) => client.addProjectMember(projectId, userId, roleIds);

export const removeProjectMember = (
  projectId: number | string,
  membershipId: number,
) => client.removeProjectMember(projectId, membershipId);

// ==================== PROJECT VERSIONS ====================

export const listProjectVersions = (projectId: number | string) =>
  client.listProjectVersions(projectId);

export const createVersion = (
  projectId: number | string,
  input: Parameters<typeof client.createVersion>[1],
) => client.createVersion(projectId, input);
