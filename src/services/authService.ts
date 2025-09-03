import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    orgUnitId: string;
    position?: string;
    department?: string;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgUnitId: string;
  position?: string;
  department?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('auth_user');
      }
    }

    // Set up axios interceptor for token
    this.setupAxiosInterceptor();
  }

  private setupAxiosInterceptor() {
    axios.interceptors.request.use(
      (config) => {
        if (this.token && config.url?.startsWith(API_URL)) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username: usernameOrEmail,
        password
      });

      const { token, user } = response.data;
      
      this.token = token;
      this.user = user;

      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return this.user ? roles.includes(this.user.role) : false;
  }

  // Get user's accessible features based on role
  getAccessibleFeatures(): string[] {
    if (!this.user) return [];

    const role = this.user.role;
    const features = ['dashboard', 'sites', 'profile'];

    switch (role) {
      case 'PMO':
        return [...features, 'users', 'org-units', 'reports', 'audit', 'system'];
      
      case 'AREA_MANAGER':
        return [...features, 'expenses', 'tasks', 'reports', 'team-management'];
      
      case 'PROJECT_MANAGER':
        return [...features, 'expenses', 'tasks', 'employees', 'reports'];
      
      case 'ZONE_MANAGER':
        return [...features, 'expenses', 'tasks', 'employees'];
      
      case 'SITE_ENGINEER':
        return [...features, 'tasks', 'expenses'];
      
      default:
        return features;
    }
  }

  // Check if user can approve at a certain level
  canApprove(amount?: number): boolean {
    if (!this.user) return false;

    const role = this.user.role;
    
    // Approval thresholds based on role
    switch (role) {
      case 'ZONE_MANAGER':
        return !amount || amount <= 1000;
      case 'PROJECT_MANAGER':
        return !amount || amount <= 5000;
      case 'AREA_MANAGER':
        return !amount || amount <= 15000;
      case 'PMO':
        return true; // Can approve any amount
      default:
        return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
