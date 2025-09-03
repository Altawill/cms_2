import { 
  User, 
  Role, 
  Permission, 
  SiteAccessPolicy,
  ResourceType, 
  ActionType,
  SYSTEM_ROLES,
  PERMISSION_TEMPLATES,
  DashboardModuleAccess,
  UserActivity,
  SiteModule,
  SiteAction
} from '../types/user';

class UserService {
  private readonly STORAGE_KEYS = {
    USERS: 'users',
    ROLES: 'roles',
    CURRENT_USER: 'currentUser',
    USER_ACTIVITIES: 'userActivities'
  };

  constructor() {
    this.initializeSystemRoles();
    this.initializeDefaultUsers();
  }

  // Method to reset all data (for demo purposes)
  resetDemoData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.USERS);
    localStorage.removeItem(this.STORAGE_KEYS.ROLES);
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(this.STORAGE_KEYS.USER_ACTIVITIES);
    
    // Reinitialize
    this.initializeSystemRoles();
    this.initializeDefaultUsers();
  }

  // Initialize default system roles
  private initializeSystemRoles(): void {
    const existingRoles = this.getAllRoles();
    if (existingRoles.length === 0) {
      const systemRoles: Role[] = [
        {
          id: SYSTEM_ROLES.SUPER_ADMIN,
          name: 'Super Administrator',
          description: 'Full system access with all permissions',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.ALL_PERMISSIONS),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.ADMIN,
          name: 'Administrator',
          description: 'Administrative access to most system features',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.MANAGER_PERMISSIONS.concat([
            { resource: 'users', actions: ['read', 'create', 'update', 'manage_users'] },
            { resource: 'settings', actions: ['read', 'update'] }
          ])),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.MANAGER,
          name: 'Manager',
          description: 'Management level access to projects and teams',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.MANAGER_PERMISSIONS),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.SITE_SUPERVISOR,
          name: 'Site Supervisor',
          description: 'Site-specific management and supervision',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.SITE_SUPERVISOR_PERMISSIONS),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.ACCOUNTANT,
          name: 'Accountant',
          description: 'Financial management and reporting access',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.ACCOUNTANT_PERMISSIONS),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.HR_MANAGER,
          name: 'HR Manager',
          description: 'Human resources management access',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.HR_PERMISSIONS),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.EMPLOYEE,
          name: 'Employee',
          description: 'Basic employee access',
          permissions: this.createPermissionsFromTemplate([
            { resource: 'dashboard', actions: ['read'] },
            { resource: 'employees', actions: ['read'] },
            { resource: 'sites', actions: ['read'] },
            { resource: 'expenses', actions: ['read', 'create'] },
            { resource: 'reports', actions: ['read'] }
          ]),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: SYSTEM_ROLES.VIEWER,
          name: 'Viewer',
          description: 'Read-only access to basic information',
          permissions: this.createPermissionsFromTemplate(PERMISSION_TEMPLATES.VIEWER_PERMISSIONS),
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      localStorage.setItem(this.STORAGE_KEYS.ROLES, JSON.stringify(systemRoles));
    }
  }

  // Initialize default demo users
  private initializeDefaultUsers(): void {
    const existingUsers = this.getAllUsers();
    if (existingUsers.length === 0) {
      const demoUsers: User[] = [
        {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@example.com',
          firstName: 'System',
          lastName: 'Administrator',
          roles: [SYSTEM_ROLES.SUPER_ADMIN],
          siteAccess: [], // Super admin has access to all sites
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          department: 'IT',
          position: 'System Administrator'
        },
        {
          id: 'manager-001',
          username: 'manager',
          email: 'manager@example.com',
          firstName: 'Project',
          lastName: 'Manager',
          roles: [SYSTEM_ROLES.MANAGER],
          siteAccess: [
            {
              siteId: 'site-1',
              siteName: 'Downtown Project',
              permissions: [
                { module: 'overview', actions: ['view'] },
                { module: 'employees', actions: ['view', 'edit', 'manage_team'] },
                { module: 'expenses', actions: ['view', 'create', 'approve'] },
                { module: 'progress', actions: ['view', 'edit'] },
                { module: 'documents', actions: ['view', 'create'] }
              ],
              restrictions: []
            }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          department: 'Management',
          position: 'Project Manager'
        },
        {
          id: 'user-001',
          username: 'user',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          roles: [SYSTEM_ROLES.EMPLOYEE],
          siteAccess: [
            {
              siteId: 'site-1',
              siteName: 'Downtown Project',
              permissions: [
                { module: 'overview', actions: ['view'] },
                { module: 'expenses', actions: ['view', 'create'] },
                { module: 'documents', actions: ['view'] }
              ],
              restrictions: []
            }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          department: 'Construction',
          position: 'Construction Worker'
        },
        {
          id: 'hr-001',
          username: 'hr',
          email: 'hr@example.com',
          firstName: 'Human',
          lastName: 'Resources',
          roles: [SYSTEM_ROLES.HR_MANAGER],
          siteAccess: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          department: 'HR',
          position: 'HR Manager'
        }
      ];

      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
    }
  }

  // Helper method to create permissions from template
  private createPermissionsFromTemplate(template: any[]): Permission[] {
    return template.flatMap(item => 
      item.actions.map((action: string) => ({
        id: `${item.resource}-${action}`,
        resource: item.resource as ResourceType,
        action: action as ActionType
      }))
    );
  }

  // User CRUD Operations
  getAllUsers(): User[] {
    const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
    return users ? JSON.parse(users).map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    })) : [];
  }

  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  getUserByUsername(username: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.username === username) || null;
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getAllUsers();
    
    // Check for duplicate username or email
    if (users.some(user => user.username === userData.username)) {
      throw new Error('Username already exists');
    }
    if (users.some(user => user.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    
    this.logActivity(newUser.id, 'create_user', 'users', newUser.id, { userData });
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Check for duplicate username or email (excluding current user)
    if (updates.username && users.some(user => user.id !== id && user.username === updates.username)) {
      throw new Error('Username already exists');
    }
    if (updates.email && users.some(user => user.id !== id && user.email === updates.email)) {
      throw new Error('Email already exists');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    
    this.logActivity(id, 'update_user', 'users', id, { updates });
    return users[userIndex];
  }

  deleteUser(id: string): boolean {
    const users = this.getAllUsers();
    const initialLength = users.length;
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === initialLength) {
      return false; // User not found
    }

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
    this.logActivity(id, 'delete_user', 'users', id);
    return true;
  }

  // Role Management
  getAllRoles(): Role[] {
    const roles = localStorage.getItem(this.STORAGE_KEYS.ROLES);
    return roles ? JSON.parse(roles).map((role: any) => ({
      ...role,
      createdAt: new Date(role.createdAt),
      updatedAt: new Date(role.updatedAt)
    })) : [];
  }

  getRoleById(id: string): Role | null {
    const roles = this.getAllRoles();
    return roles.find(role => role.id === id) || null;
  }

  createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystemRole'>): Role {
    const roles = this.getAllRoles();
    
    if (roles.some(role => role.name === roleData.name)) {
      throw new Error('Role name already exists');
    }

    const newRole: Role = {
      ...roleData,
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isSystemRole: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    roles.push(newRole);
    localStorage.setItem(this.STORAGE_KEYS.ROLES, JSON.stringify(roles));
    
    this.logActivity('system', 'create_role', 'roles', newRole.id, { roleData });
    return newRole;
  }

  updateRole(id: string, updates: Partial<Role>): Role {
    const roles = this.getAllRoles();
    const roleIndex = roles.findIndex(role => role.id === id);
    
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    if (roles[roleIndex].isSystemRole) {
      throw new Error('Cannot modify system roles');
    }

    roles[roleIndex] = {
      ...roles[roleIndex],
      ...updates,
      id, // Ensure ID doesn't change
      isSystemRole: roles[roleIndex].isSystemRole, // Prevent changing system role flag
      updatedAt: new Date()
    };

    localStorage.setItem(this.STORAGE_KEYS.ROLES, JSON.stringify(roles));
    this.logActivity('system', 'update_role', 'roles', id, { updates });
    return roles[roleIndex];
  }

  deleteRole(id: string): boolean {
    const roles = this.getAllRoles();
    const role = roles.find(r => r.id === id);
    
    if (!role) return false;
    if (role.isSystemRole) {
      throw new Error('Cannot delete system roles');
    }

    // Check if any users have this role
    const users = this.getAllUsers();
    const usersWithRole = users.filter(user => user.roles.includes(id));
    if (usersWithRole.length > 0) {
      throw new Error(`Cannot delete role: ${usersWithRole.length} user(s) still have this role`);
    }

    const filteredRoles = roles.filter(role => role.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.ROLES, JSON.stringify(filteredRoles));
    this.logActivity('system', 'delete_role', 'roles', id);
    return true;
  }

  // Permission Checking
  hasPermission(userId: string, resource: ResourceType, action: ActionType): boolean {
    const user = this.getUserById(userId);
    if (!user || !user.isActive) return false;

    const userRoles = user.roles.map(roleId => this.getRoleById(roleId)).filter(Boolean) as Role[];
    
    return userRoles.some(role => 
      role.permissions.some(permission => 
        permission.resource === resource && permission.action === action
      )
    );
  }

  canAccessSite(userId: string, siteId: string): boolean {
    const user = this.getUserById(userId);
    if (!user || !user.isActive) return false;

    // Super admin can access all sites
    if (user.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;

    // Check specific site access
    return user.siteAccess.some(access => access.siteId === siteId);
  }

  canPerformSiteAction(userId: string, siteId: string, module: SiteModule, action: SiteAction): boolean {
    const user = this.getUserById(userId);
    if (!user || !user.isActive) return false;

    // Super admin can perform all actions
    if (user.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;

    const siteAccess = user.siteAccess.find(access => access.siteId === siteId);
    if (!siteAccess) return false;

    const modulePermissions = siteAccess.permissions.find(perm => perm.module === module);
    return modulePermissions?.actions.includes(action) || false;
  }

  // Get user's dashboard module access
  getDashboardAccess(userId: string): DashboardModuleAccess {
    const user = this.getUserById(userId);
    if (!user || !user.isActive) {
      return {
        overview: false,
        employees: false,
        sites: false,
        safes: false,
        expenses: false,
        revenues: false,
        payroll: false,
        reports: false,
        settings: false,
        users: false
      };
    }

    return {
      overview: this.hasPermission(userId, 'dashboard', 'read'),
      employees: this.hasPermission(userId, 'employees', 'read'),
      sites: this.hasPermission(userId, 'sites', 'read'),
      safes: this.hasPermission(userId, 'safes', 'read'),
      expenses: this.hasPermission(userId, 'expenses', 'read'),
      revenues: this.hasPermission(userId, 'revenues', 'read'),
      payroll: this.hasPermission(userId, 'payroll', 'read'),
      reports: this.hasPermission(userId, 'reports', 'read'),
      settings: this.hasPermission(userId, 'settings', 'read'),
      users: this.hasPermission(userId, 'users', 'read')
    };
  }

  // Get sites accessible by user
  getAccessibleSites(userId: string): string[] {
    const user = this.getUserById(userId);
    if (!user || !user.isActive) return [];

    // Super admin can access all sites
    if (user.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) {
      // Return all site IDs (would need to be fetched from site service)
      return ['all'];
    }

    return user.siteAccess.map(access => access.siteId);
  }

  // Update user's site access
  updateUserSiteAccess(userId: string, siteAccess: SiteAccessPolicy[]): User {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.updateUser(userId, { siteAccess });
  }

  // Activity Logging
  logActivity(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any
  ): void {
    const activities = this.getUserActivities();
    const activity: UserActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date()
    };

    activities.push(activity);
    
    // Keep only last 1000 activities
    const limitedActivities = activities.slice(-1000);
    localStorage.setItem(this.STORAGE_KEYS.USER_ACTIVITIES, JSON.stringify(limitedActivities));
  }

  getUserActivities(userId?: string, limit?: number): UserActivity[] {
    const activities = localStorage.getItem(this.STORAGE_KEYS.USER_ACTIVITIES);
    let parsedActivities: UserActivity[] = activities ? JSON.parse(activities) : [];
    
    // Convert timestamp strings back to Date objects
    parsedActivities = parsedActivities.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    }));

    if (userId) {
      parsedActivities = parsedActivities.filter(activity => activity.userId === userId);
    }

    if (limit) {
      parsedActivities = parsedActivities.slice(-limit);
    }

    return parsedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Current User Management
  setCurrentUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
    if (!user) return null;
    
    const parsedUser = JSON.parse(user);
    return {
      ...parsedUser,
      createdAt: new Date(parsedUser.createdAt),
      updatedAt: new Date(parsedUser.updatedAt),
      lastLogin: parsedUser.lastLogin ? new Date(parsedUser.lastLogin) : undefined
    };
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
  }

  // Search and Filter Users
  searchUsers(query: string, filters?: {
    roles?: string[];
    departments?: string[];
    isActive?: boolean;
  }): User[] {
    let users = this.getAllUsers();

    if (query) {
      const searchTerm = query.toLowerCase();
      users = users.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.department && user.department.toLowerCase().includes(searchTerm)) ||
        (user.position && user.position.toLowerCase().includes(searchTerm))
      );
    }

    if (filters) {
      if (filters.roles && filters.roles.length > 0) {
        users = users.filter(user =>
          user.roles.some(roleId => filters.roles!.includes(roleId))
        );
      }

      if (filters.departments && filters.departments.length > 0) {
        users = users.filter(user =>
          user.department && filters.departments!.includes(user.department)
        );
      }

      if (filters.isActive !== undefined) {
        users = users.filter(user => user.isActive === filters.isActive);
      }
    }

    return users;
  }
}

export const userService = new UserService();
