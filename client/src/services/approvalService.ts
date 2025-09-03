import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
export interface ApprovalWorkflow {
  id: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  currentApprover?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount?: number;
  orgUnitId: string;
  approvalChain?: string;
  metadata?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  steps: ApprovalStep[];
  orgUnit: {
    id: string;
    name: string;
    type: string;
    code?: string;
  };
  entity?: any; // The actual entity being approved
}

export interface ApprovalStep {
  id: string;
  approvalWorkflowId: string;
  role: string;
  order: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedBy?: string;
  approvedAt?: string;
  remark?: string;
  requiredThreshold?: number;
  createdAt: string;
  approver?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ApprovalMetrics {
  counts: {
    pending: number;
    approved: number;
    rejected: number;
  };
  recentActivity: ApprovalStep[];
  amountMetrics: Array<{
    status: string;
    _sum: { amount: number | null };
    _count: { id: number };
  }>;
}

export interface ApprovalScope {
  role: string;
  approvalThresholds: {
    min: number;
    max: number;
  };
  scopeOrgUnits: Array<{
    id: string;
    type: string;
    name: string;
    code?: string;
  }>;
}

class ApprovalService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get pending approvals for current user
  async getPendingApprovals(): Promise<ApprovalWorkflow[]> {
    try {
      const response = await axios.get(`${API_URL}/api/approval/pending`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  // Get approval history for an entity
  async getApprovalHistory(entityType: string, entityId: string): Promise<ApprovalWorkflow[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/approval/history/${entityType}/${entityId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching approval history:', error);
      throw error;
    }
  }

  // Process an approval (approve/reject)
  async processApproval(
    workflowId: string, 
    action: 'APPROVE' | 'REJECT', 
    remark?: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/api/approval/process/${workflowId}`,
        { action, remark },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }

  // Get approval metrics/dashboard data
  async getApprovalMetrics(): Promise<ApprovalMetrics> {
    try {
      const response = await axios.get(`${API_URL}/api/approval/metrics`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approval metrics:', error);
      throw error;
    }
  }

  // Get user's approval scope and permissions
  async getApprovalScope(): Promise<ApprovalScope> {
    try {
      const response = await axios.get(`${API_URL}/api/approval/scope`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approval scope:', error);
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();
