import { User } from '../types/user';

// Fallback authentication service for testing when API is not available
const DEMO_USERS: Record<string, User> = {
  'admin@example.com': {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'System',
    lastName: 'Administrator',
    phoneNumber: '',
    department: 'IT',
    position: 'System Administrator',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: ['super_admin'],
    permissions: [],
    siteAccess: []
  },
  'manager@example.com': {
    id: 'manager-1',
    username: 'manager',
    email: 'manager@example.com',
    firstName: 'Project',
    lastName: 'Manager',
    phoneNumber: '',
    department: 'Management',
    position: 'Project Manager',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: ['manager'],
    permissions: [],
    siteAccess: []
  },
  'user@example.com': {
    id: 'user-1',
    username: 'user',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    phoneNumber: '',
    department: 'Construction',
    position: 'Construction Worker',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: ['user'],
    permissions: [],
    siteAccess: []
  },
  'hr@example.com': {
    id: 'hr-1',
    username: 'hr',
    email: 'hr@example.com',
    firstName: 'Human',
    lastName: 'Resources',
    phoneNumber: '',
    department: 'HR',
    position: 'HR Manager',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: ['hr'],
    permissions: [],
    siteAccess: []
  }
};

const DEMO_PASSWORDS: Record<string, string> = {
  'admin@example.com': 'admin',
  'manager@example.com': 'password',
  'user@example.com': 'password',
  'hr@example.com': 'password'
};

export class FallbackAuthService {
  private currentUser: User | null = null;

  async login(email: string, password: string): Promise<{
    success: boolean;
    token: string;
    user: User;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Fallback login attempt:', { email: email.toLowerCase(), password, availableEmails: Object.keys(DEMO_PASSWORDS) });
    
    const user = DEMO_USERS[email.toLowerCase()];
    const expectedPassword = DEMO_PASSWORDS[email.toLowerCase()];

    console.log('Found user:', !!user, 'Expected password:', expectedPassword, 'Provided password:', password);

    if (!user || expectedPassword !== password) {
      throw new Error('Invalid credentials');
    }

    this.currentUser = user;
    const token = `fallback_${user.id}_${Date.now()}`;
    
    // Store in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));

    return {
      success: true,
      token,
      user
    };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('current_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  async getAllUsers(): Promise<User[]> {
    // Check if we have custom users in localStorage
    const storedUsers = localStorage.getItem('fallback_users');
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers);
      } catch {
        // If parsing fails, fall back to demo users
      }
    }
    return Object.values(DEMO_USERS);
  }

  async getAllRoles(): Promise<any[]> {
    return [
      { id: 'super_admin', name: 'Super Admin', description: 'Full system access' },
      { id: 'admin', name: 'Admin', description: 'Administrative access' },
      { id: 'manager', name: 'Manager', description: 'Management level access' },
      { id: 'user', name: 'User', description: 'Regular user access' },
      { id: 'hr', name: 'HR Manager', description: 'HR management access' }
    ];
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber || '',
      department: userData.department || '',
      position: userData.position || '',
      isActive: userData.isActive ?? true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: userData.roles,
      permissions: [],
      siteAccess: []
    };

    // Add to in-memory storage (in a real app, this would persist to storage)
    const users = await this.getAllUsers();
    const updatedUsers = [...users, newUser];
    localStorage.setItem('fallback_users', JSON.stringify(updatedUsers));

    return newUser;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = await this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date()
    };

    users[userIndex] = updatedUser;
    localStorage.setItem('fallback_users', JSON.stringify(users));

    return updatedUser;
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = await this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users.splice(userIndex, 1);
    localStorage.setItem('fallback_users', JSON.stringify(users));

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  async updateUserSiteAccess(id: string, siteAccess: any[]): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = await this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex].siteAccess = siteAccess;
    users[userIndex].updatedAt = new Date();
    localStorage.setItem('fallback_users', JSON.stringify(users));

    return {
      success: true,
      message: 'Site access updated successfully'
    };
  }

  async cleanupUserReferences(id: string): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In a real system, this would remove user references from:
    // - Team memberships
    // - Project assignments
    // - Site access logs
    // - Activity logs
    // - Any other related data

    console.log(`Cleaning up references for user ${id}`);

    return {
      success: true,
      message: 'User references cleaned up successfully'
    };
  }
}

export const fallbackAuthService = new FallbackAuthService();
