import { apiClient } from './apiClient';
import type { OrgUnit, UserScope, OrgTreeNode } from '../../types/organization';

export const organizationApi = {
  // Get all organizational units
  async getOrgUnits(): Promise<OrgUnit[]> {
    const response = await apiClient.get('/api/org-units');
    return response.data;
  },

  // Get organizational tree structure
  async getOrgTree(): Promise<OrgTreeNode[]> {
    const response = await apiClient.get('/api/org-tree');
    return response.data;
  },

  // Get user's scope information
  async getUserScope(): Promise<UserScope> {
    const response = await apiClient.get('/api/user-scope');
    return response.data;
  },

  // Create new organizational unit
  async createOrgUnit(data: Partial<OrgUnit>): Promise<OrgUnit> {
    const response = await apiClient.post('/api/org-units', data);
    return response.data;
  },

  // Update organizational unit
  async updateOrgUnit(id: string, data: Partial<OrgUnit>): Promise<OrgUnit> {
    const response = await apiClient.put(`/api/org-units/${id}`, data);
    return response.data;
  },

  // Delete organizational unit
  async deleteOrgUnit(id: string): Promise<void> {
    await apiClient.delete(`/api/org-units/${id}`);
  },

  // Assign user to org unit
  async assignUserToOrgUnit(userId: string, orgUnitId: string, role: string): Promise<void> {
    const response = await apiClient.post('/api/org-assignments', {
      userId,
      orgUnitId,
      role
    });
    return response.data;
  },

  // Remove user from org unit
  async removeUserFromOrgUnit(userId: string, orgUnitId: string): Promise<void> {
    await apiClient.delete(`/api/org-assignments/${userId}/${orgUnitId}`);
  },

  // Get users in org unit
  async getOrgUnitUsers(orgUnitId: string): Promise<any[]> {
    const response = await apiClient.get(`/api/org-units/${orgUnitId}/users`);
    return response.data;
  }
};
