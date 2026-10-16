// mcp/openproject/workPackages.ts
import { client } from "./client.js";

// ==================== WORK PACKAGES ====================

export const listWorkPackages = (
  params?: Parameters<typeof client.listWorkPackages>[0],
) => client.listWorkPackages(params);

export const getWorkPackage = (id: number) => client.getWorkPackage(id);

export const createWorkPackage = (
  input: Parameters<typeof client.createWorkPackage>[0],
) => client.createWorkPackage(input);

export const updateWorkPackage = (
  id: number,
  input: Parameters<typeof client.updateWorkPackage>[1],
) => client.updateWorkPackage(id, input);

export const deleteWorkPackage = (id: number) => client.deleteWorkPackage(id);

// ==================== ACTIVITIES / COMMENTS ====================

export const listWorkPackageActivities = (id: number) =>
  client.listWorkPackageActivities(id);

export const addWorkPackageComment = (id: number, comment: string) =>
  client.addWorkPackageComment(id, comment);

// ==================== RELATIONS ====================

export const listWorkPackageRelations = (id: number) =>
  client.listWorkPackageRelations(id);

export const createWorkPackageRelation = (
  id: number,
  input: Parameters<typeof client.createWorkPackageRelation>[1],
) => client.createWorkPackageRelation(id, input);

export const deleteWorkPackageRelation = (id: number, relationId: number) =>
  client.deleteWorkPackageRelation(id, relationId);

// ==================== PROJECT → WORK PACKAGES ====================

export const getProjectWorkPackages = (projectId: number | string) =>
  client.getProjectWorkPackages(projectId);

// ==================== SEARCH (liên quan work package) ====================

export const searchWorkPackages = (
  query: string,
  params?: Parameters<typeof client.search>[1],
) => client.search(query, params);
