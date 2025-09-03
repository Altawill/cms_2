import { User, Role, SiteAccessPolicy } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth();
          throw new Error('Unauthorized - Please login again');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication
  async login(usernameOrEmail: string, password: string): Promise<{
    success: boolean;
    token: string;
    user: User;
  }> {
    const result = await this.request<{
      success: boolean;
      token: string;
      user: User;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, password }),
    });

    if (result.success && result.token) {
      this.token = result.token;
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('current_user', JSON.stringify(result.user));
    }

    return result;
  }

  async logout(): Promise<void> {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      await this.request('/api/auth/logout', {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (err) {
      // Don't throw errors for logout - just log them
      console.warn('Server logout failed:', err);
    } finally {
      this.clearAuth();
    }
  }

  private clearAuth(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  // User Management
  async getAllUsers(): Promise<User[]> {
    return await this.request<User[]>('/api/users');
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    department?: string;
    position?: string;
    roles: string[];
    isActive?: boolean;
  }): Promise<User> {
    return await this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    department?: string;
    position?: string;
    roles?: string[];
    isActive?: boolean;
  }): Promise<User> {
    return await this.request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserSiteAccess(id: string, siteAccess: SiteAccessPolicy[]): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(`/api/users/${id}/site-access`, {
      method: 'PUT',
      body: JSON.stringify({ siteAccess }),
    });
  }

  // Role Management
  async getAllRoles(): Promise<Role[]> {
    return await this.request<Role[]>('/api/roles');
  }

  // Site Management
  async getAllSites(): Promise<Array<{
    id: string;
    name: string;
    location?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    return await this.request('/api/sites');
  }

  // Dashboard data
  async getDashboardStats(): Promise<any> {
    try {
      // Get individual data for dashboard calculations
      const [sites, expenses, tasks, approvals] = await Promise.all([
        this.getAllSites().catch(() => []),
        this.getExpenses().catch(() => []),
        this.getTasks().catch(() => []),
        this.getPendingApprovals().catch(() => [])
      ]);

      const activeSites = sites.filter((s: any) => s.status === 'ACTIVE').length;
      const totalBudget = sites.reduce((sum: number, s: any) => sum + (s.budget || 0), 0);
      const totalSpent = sites.reduce((sum: number, s: any) => sum + (s.spent || 0), 0);
      const pendingApprovals = approvals.length;
      const overdueTasks = tasks.filter((t: any) => 
        t.status !== 'COMPLETED' && new Date(t.expectedEndDate) < new Date()
      ).length;
      const avgProgress = sites.length > 0 ? 
        sites.reduce((sum: number, s: any) => sum + (s.progress || 0), 0) / sites.length : 0;

      return {
        totalSites: sites.length,
        activeSites,
        totalBudget,
        totalSpent,
        pendingApprovals,
        overdueTasks,
        avgProgress: Math.round(avgProgress),
        recentActivities: []
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        totalSites: 0,
        activeSites: 0,
        totalBudget: 0,
        totalSpent: 0,
        pendingApprovals: 0,
        overdueTasks: 0,
        avgProgress: 0,
        recentActivities: []
      };
    }
  }

  // Expenses
  async getExpenses(): Promise<any[]> {
    return await this.request('/api/expenses');
  }

  async createExpense(expense: any): Promise<any> {
    return await this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  // Tasks
  async getTasks(): Promise<any[]> {
    return await this.request('/api/tasks');
  }

  async createTask(task: any): Promise<any> {
    return await this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  // Approval workflows
  async getPendingApprovals(): Promise<any[]> {
    return await this.request('/api/approval/pending');
  }

  async getApprovalHistory(entityType?: string, entityId?: string): Promise<any[]> {
    let endpoint = '/api/approval/history';
    if (entityType && entityId) {
      endpoint += `?entityType=${entityType}&entityId=${entityId}`;
    }
    return await this.request(endpoint);
  }

  async processApproval(workflowId: string, action: 'approve' | 'reject', comment?: string): Promise<any> {
    return await this.request('/api/approval/process', {
      method: 'POST',
      body: JSON.stringify({ workflowId, action, comment }),
    });
  }

  async getApprovalMetrics(): Promise<any> {
    return await this.request('/api/approval/metrics');
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    return await this.request('/api/notifications');
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // Organizational data
  async getOrgUnits(): Promise<any[]> {
    return await this.request('/api/org-units');
  }

  async getOrgTree(): Promise<any> {
    return await this.request('/api/org-tree');
  }

  async getUserScope(): Promise<any> {
    return await this.request('/api/user-scope');
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return await this.request<{ status: string; message: string }>('/health');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('current_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }
}

export const apiService = new ApiService();
export default apiService;
