// User Management and RBAC Types

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  roles: string[]; // Role IDs
  siteAccess: SiteAccessPolicy[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  password?: string; // Only for creation/update
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean; // Cannot be deleted if true
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  conditions?: PermissionCondition[];
}

export interface SiteAccessPolicy {
  siteId: string;
  siteName: string;
  permissions: SitePermission[];
  restrictions?: SiteRestriction[];
}

export interface SitePermission {
  module: SiteModule;
  actions: SiteAction[];
}

export interface SiteRestriction {
  type: 'budget_limit' | 'employee_limit' | 'time_access';
  value: any;
  description: string;
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

// Enums and Types
export type ResourceType = 
  | 'dashboard'
  | 'employees'
  | 'sites'
  | 'safes'
  | 'expenses'
  | 'revenues'
  | 'payroll'
  | 'reports'
  | 'settings'
  | 'users'
  | 'system';

export type ActionType = 
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'manage_users'
  | 'manage_roles'
  | 'system_settings';

export type SiteModule = 
  | 'overview'
  | 'employees'
  | 'equipment'
  | 'expenses'
  | 'progress'
  | 'documents';

export type SiteAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'manage_budget'
  | 'manage_team';

// Pre-defined System Roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SITE_SUPERVISOR: 'site_supervisor',
  ACCOUNTANT: 'accountant',
  HR_MANAGER: 'hr_manager',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer'
} as const;

// Permission Templates
export const PERMISSION_TEMPLATES = {
  ALL_PERMISSIONS: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'employees', actions: ['read', 'create', 'update', 'delete', 'export'] },
    { resource: 'sites', actions: ['read', 'create', 'update', 'delete', 'export'] },
    { resource: 'safes', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'expenses', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
    { resource: 'revenues', actions: ['read', 'create', 'update', 'delete', 'export'] },
    { resource: 'payroll', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
    { resource: 'reports', actions: ['read', 'create', 'export'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete', 'manage_users', 'manage_roles'] },
    { resource: 'system', actions: ['system_settings'] }
  ],
  MANAGER_PERMISSIONS: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'employees', actions: ['read', 'create', 'update', 'export'] },
    { resource: 'sites', actions: ['read', 'create', 'update', 'export'] },
    { resource: 'expenses', actions: ['read', 'create', 'update', 'approve'] },
    { resource: 'revenues', actions: ['read', 'create', 'update'] },
    { resource: 'payroll', actions: ['read', 'approve'] },
    { resource: 'reports', actions: ['read', 'create', 'export'] },
    { resource: 'settings', actions: ['read'] }
  ],
  SITE_SUPERVISOR_PERMISSIONS: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'employees', actions: ['read', 'update'] },
    { resource: 'sites', actions: ['read', 'update'] },
    { resource: 'expenses', actions: ['read', 'create', 'update'] },
    { resource: 'reports', actions: ['read', 'create'] }
  ],
  ACCOUNTANT_PERMISSIONS: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'expenses', actions: ['read', 'create', 'update', 'approve', 'export'] },
    { resource: 'revenues', actions: ['read', 'create', 'update', 'export'] },
    { resource: 'payroll', actions: ['read', 'create', 'update', 'export'] },
    { resource: 'safes', actions: ['read', 'create', 'update'] },
    { resource: 'reports', actions: ['read', 'create', 'export'] }
  ],
  HR_PERMISSIONS: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'employees', actions: ['read', 'create', 'update', 'delete', 'export'] },
    { resource: 'payroll', actions: ['read', 'create', 'update', 'export'] },
    { resource: 'reports', actions: ['read', 'create', 'export'] }
  ],
  VIEWER_PERMISSIONS: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'employees', actions: ['read'] },
    { resource: 'sites', actions: ['read'] },
    { resource: 'expenses', actions: ['read'] },
    { resource: 'revenues', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }
  ]
} as const;

// Dashboard Module Access
export interface DashboardModuleAccess {
  overview: boolean;
  employees: boolean;
  sites: boolean;
  safes: boolean;
  expenses: boolean;
  revenues: boolean;
  payroll: boolean;
  reports: boolean;
  settings: boolean;
  users: boolean;
}

// User Activity Log
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// User Session
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}
