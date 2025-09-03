import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  ResourceType, 
  ActionType, 
  DashboardModuleAccess,
  SiteModule,
  SiteAction
} from '../types/user';
import { UserRole } from '../types/index';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

// Define organizational roles from approval workflow
type OrganizationalRole = 'PMO' | 'AREA_MANAGER' | 'PROJECT_MANAGER' | 'ZONE_MANAGER' | 'SITE_ENGINEER';

// Define approval thresholds for roles
export interface ApprovalThresholds {
  expense: number;
  budget: number;
  equipment: number;
  payroll: number;
}

interface RBACContextType {
  currentUser: User | null;
  isLoading: boolean;
  
  // User management
  setCurrentUser: (user: User | null) => void;
  refreshUser: () => void;
  
  // Permission checking
  hasPermission: (resource: ResourceType, action: ActionType) => boolean;
  canAccess: (resource: ResourceType) => boolean;
  canAccessSite: (siteId: string) => boolean;
  canPerformSiteAction: (siteId: string, module: SiteModule, action: SiteAction) => boolean;
  
  // Organizational scope permissions
  canAccessOrganizationalUnit: (orgUnitId: string) => boolean;
  canApproveAmount: (amount: number, type: 'expense' | 'budget' | 'equipment' | 'payroll') => boolean;
  getApprovalThresholds: () => ApprovalThresholds;
  canEscalateApprovals: () => boolean;
  canManageUsers: (targetOrgUnitId?: string) => boolean;
  
  // Dashboard access
  getDashboardAccess: () => DashboardModuleAccess;
  getAccessibleSites: () => string[];
  getAccessibleOrganizationalUnits: () => string[];
  
  // Role checking
  hasRole: (roleId: string) => boolean;
  hasAnyRole: (roleIds: string[]) => boolean;
  hasOrganizationalRole: (role: OrganizationalRole) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  getOrganizationalRole: () => OrganizationalRole | null;
  getRoleHierarchyLevel: () => number;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user: currentUser, legacyUser, loading: isLoading } = useAuth();

  // Debug logging
  console.log('RBAC - currentUser:', currentUser)
  console.log('RBAC - legacyUser:', legacyUser)

  const setCurrentUser = (user: User | null) => {
    // This is handled by the AuthContext
    console.warn('setCurrentUser should be handled through AuthContext login/logout');
  };

  const refreshUser = async () => {
    // This would typically refresh the user from the API
    // For now, the user is managed by AuthContext
    console.warn('refreshUser should be handled through AuthContext');
  };

  // For now, we'll implement basic permission checking based on roles
  // In a full implementation, this would check against the user's role permissions
  const hasPermission = (resource: ResourceType, action: ActionType): boolean => {
    console.log('hasPermission called:', { resource, action, currentUser: !!currentUser, isActive: currentUser?.isActive, legacyUser })
    
    if (!currentUser || !currentUser.isActive) {
      console.log('Permission denied: no user or inactive user')
      return false;
    }
    
    // Check role using legacyUser which has the simple role format
    const userRole = legacyUser?.role?.toUpperCase();
    console.log('User role check:', { userRole, legacyUserRole: legacyUser?.role })
    
    // Super admin has all permissions
    if (userRole === 'SUPER_ADMIN') {
      console.log('Permission granted: SUPER_ADMIN')
      return true;
    }
    
    // Admin has most permissions
    if (userRole === 'ADMIN') {
      console.log('Permission granted: ADMIN')
      return true; // For now, admin has access to everything
    }
    
    // Manager has limited permissions
    if (userRole === 'MANAGER') {
      const managerPermissions = ['read', 'create', 'update'];
      return managerPermissions.includes(action);
    }
    
    // Cashier has limited permissions
    if (userRole === 'CASHIER') {
      const cashierPermissions = ['read', 'create', 'update'];
      return cashierPermissions.includes(action);
    }
    
    // Viewer has only read permissions
    if (userRole === 'VIEWER') {
      return action === 'read';
    }
    
    return false;
  };

  const canAccess = (resource: ResourceType): boolean => {
    return hasPermission(resource, 'read');
  };

  const canAccessSite = (siteId: string): boolean => {
    if (!currentUser) return false;
    
    const userRole = legacyUser?.role?.toUpperCase();
    
    // Super admin can access all sites
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    
    // Check if user has specific site access (if siteAccess exists)
    return (currentUser as any).siteAccess?.some((access: any) => access.siteId === siteId) || false;
  };

  const canPerformSiteAction = (siteId: string, module: SiteModule, action: SiteAction): boolean => {
    if (!currentUser || !canAccessSite(siteId)) return false;
    
    const userRole = legacyUser?.role?.toUpperCase();
    
    // Super admin can perform all actions
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    
    // Check specific site permissions (if siteAccess exists)
    const siteAccess = (currentUser as any).siteAccess?.find((access: any) => access.siteId === siteId);
    if (!siteAccess) return false;
    
    const modulePermission = siteAccess.permissions.find((perm: any) => perm.module === module);
    return modulePermission?.actions.includes(action) || false;
  };

  const getDashboardAccess = (): DashboardModuleAccess => {
    if (!currentUser) {
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
    
    const userRole = legacyUser?.role?.toUpperCase();
    
    // Super admin gets access to everything
    if (userRole === 'SUPER_ADMIN') {
      return {
        overview: true,
        employees: true,
        sites: true,
        safes: true,
        expenses: true,
        revenues: true,
        payroll: true,
        reports: true,
        settings: true,
        users: true
      };
    }
    
    // Admin gets most access
    if (userRole === 'ADMIN') {
      return {
        overview: true,
        employees: true,
        sites: true,
        safes: true,
        expenses: true,
        revenues: true,
        payroll: true,
        reports: true,
        settings: true, // Admin can access settings
        users: true
      };
    }
    
    // Manager gets limited access
    if (userRole === 'MANAGER') {
      return {
        overview: true,
        employees: true,
        sites: true,
        safes: false,
        expenses: true,
        revenues: true,
        payroll: false,
        reports: true,
        settings: false,
        users: false
      };
    }
    
    // Cashier gets limited access
    if (userRole === 'CASHIER') {
      return {
        overview: true,
        employees: false,
        sites: false,
        safes: true,
        expenses: true,
        revenues: true,
        payroll: false,
        reports: false,
        settings: false,
        users: false
      };
    }
    
    // Viewer gets basic access
    return {
      overview: true,
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
  };

  const getAccessibleSites = (): string[] => {
    if (!currentUser) return [];
    
    const userRole = legacyUser?.role?.toUpperCase();
    
    // Super admin can access all sites (would need to fetch from API)
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      // For now, return mock site IDs
      return ['site-1', 'site-2', 'site-3', 'site-4'];
    }
    
    // Return sites from user's site access (if exists)
    return (currentUser as any).siteAccess?.map((access: any) => access.siteId) || [];
  };

  const hasRole = (roleId: string): boolean => {
    const userRole = legacyUser?.role?.toUpperCase();
    return userRole === roleId.toUpperCase();
  };

  const hasAnyRole = (roleIds: string[]): boolean => {
    const userRole = legacyUser?.role?.toUpperCase();
    return roleIds.some(roleId => userRole === roleId.toUpperCase());
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['super_admin', 'admin']);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  // Organizational role hierarchy (0 = lowest, 4 = highest)
  const ORGANIZATIONAL_HIERARCHY: Record<OrganizationalRole, number> = {
    'SITE_ENGINEER': 0,
    'ZONE_MANAGER': 1,
    'PROJECT_MANAGER': 2,
    'AREA_MANAGER': 3,
    'PMO': 4
  };

  // Financial approval thresholds by role
  const ROLE_THRESHOLDS: Record<OrganizationalRole, ApprovalThresholds> = {
    'SITE_ENGINEER': {
      expense: 5000,
      budget: 0,
      equipment: 3000,
      payroll: 0
    },
    'ZONE_MANAGER': {
      expense: 25000,
      budget: 15000,
      equipment: 15000,
      payroll: 10000
    },
    'PROJECT_MANAGER': {
      expense: 100000,
      budget: 75000,
      equipment: 50000,
      payroll: 50000
    },
    'AREA_MANAGER': {
      expense: 500000,
      budget: 400000,
      equipment: 250000,
      payroll: 200000
    },
    'PMO': {
      expense: Number.MAX_SAFE_INTEGER,
      budget: Number.MAX_SAFE_INTEGER,
      equipment: Number.MAX_SAFE_INTEGER,
      payroll: Number.MAX_SAFE_INTEGER
    }
  };

  const getOrganizationalRole = (): OrganizationalRole | null => {
    if (!currentUser) return null;
    
    // Check if user has organizational role in their profile
    const orgRole = (currentUser as any).organizationalRole as OrganizationalRole;
    if (orgRole && Object.keys(ORGANIZATIONAL_HIERARCHY).includes(orgRole)) {
      return orgRole;
    }
    
    // Fallback mapping from legacy roles
    const userRole = legacyUser?.role?.toUpperCase();
    switch (userRole) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'PMO';
      case 'MANAGER':
        return 'AREA_MANAGER';
      default:
        return 'SITE_ENGINEER';
    }
  };

  const getRoleHierarchyLevel = (): number => {
    const role = getOrganizationalRole();
    return role ? ORGANIZATIONAL_HIERARCHY[role] : 0;
  };

  const hasOrganizationalRole = (role: OrganizationalRole): boolean => {
    return getOrganizationalRole() === role;
  };

  const canAccessOrganizationalUnit = (orgUnitId: string): boolean => {
    if (!currentUser) return false;
    
    // Super admins and PMO can access all org units
    if (isAdmin() || hasOrganizationalRole('PMO')) return true;
    
    // Users can access their own org unit
    const userOrgUnitId = (currentUser as any).orgUnitId;
    if (userOrgUnitId === orgUnitId) return true;
    
    // Higher level roles can access subordinate org units
    const userRole = getOrganizationalRole();
    if (!userRole) return false;
    
    // This would need org hierarchy logic - simplified for now
    return getRoleHierarchyLevel() >= 2; // PROJECT_MANAGER and above can access multiple units
  };

  const canApproveAmount = (amount: number, type: 'expense' | 'budget' | 'equipment' | 'payroll'): boolean => {
    if (!currentUser) return false;
    
    // Super admin can approve anything
    if (isSuperAdmin()) return true;
    
    const role = getOrganizationalRole();
    if (!role) return false;
    
    const thresholds = ROLE_THRESHOLDS[role];
    return amount <= thresholds[type];
  };

  const getApprovalThresholds = (): ApprovalThresholds => {
    const role = getOrganizationalRole();
    if (!role) {
      return {
        expense: 0,
        budget: 0,
        equipment: 0,
        payroll: 0
      };
    }
    return ROLE_THRESHOLDS[role];
  };

  const canEscalateApprovals = (): boolean => {
    if (!currentUser) return false;
    
    // All roles except PMO can escalate
    const role = getOrganizationalRole();
    return role !== 'PMO';
  };

  const canManageUsers = (targetOrgUnitId?: string): boolean => {
    if (!currentUser) return false;
    
    // Super admin can manage all users
    if (isSuperAdmin()) return true;
    
    // PMO and AREA_MANAGER can manage users
    const role = getOrganizationalRole();
    if (role === 'PMO' || role === 'AREA_MANAGER') {
      // If no specific org unit specified, they can manage users in their scope
      if (!targetOrgUnitId) return true;
      // Can manage users in accessible org units
      return canAccessOrganizationalUnit(targetOrgUnitId);
    }
    
    // PROJECT_MANAGER can manage users in their project
    if (role === 'PROJECT_MANAGER' && targetOrgUnitId) {
      return canAccessOrganizationalUnit(targetOrgUnitId);
    }
    
    return false;
  };

  const getAccessibleOrganizationalUnits = (): string[] => {
    if (!currentUser) return [];
    
    // Super admin and PMO can access all units
    if (isAdmin() || hasOrganizationalRole('PMO')) {
      return ['org-1', 'org-2', 'org-3', 'org-4', 'org-5']; // Mock data
    }
    
    const role = getOrganizationalRole();
    const userOrgUnit = (currentUser as any).orgUnitId || 'org-1';
    
    switch (role) {
      case 'AREA_MANAGER':
        return [userOrgUnit, 'org-2', 'org-3']; // Can access area and sub-units
      case 'PROJECT_MANAGER':
        return [userOrgUnit, 'org-2']; // Can access project and related units
      case 'ZONE_MANAGER':
        return [userOrgUnit]; // Can access own zone
      case 'SITE_ENGINEER':
      default:
        return [userOrgUnit]; // Can only access own unit
    }
  };

  const contextValue: RBACContextType = {
    currentUser,
    isLoading,
    setCurrentUser,
    refreshUser,
    hasPermission,
    canAccess,
    canAccessSite,
    canPerformSiteAction,
    canAccessOrganizationalUnit,
    canApproveAmount,
    getApprovalThresholds,
    canEscalateApprovals,
    canManageUsers,
    getDashboardAccess,
    getAccessibleSites,
    getAccessibleOrganizationalUnits,
    hasRole,
    hasAnyRole,
    hasOrganizationalRole,
    isAdmin,
    isSuperAdmin,
    getOrganizationalRole,
    getRoleHierarchyLevel
  };

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// Higher-order component for protecting routes/components
interface ProtectedComponentProps {
  children: ReactNode;
  resource?: ResourceType;
  action?: ActionType;
  roles?: string[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified roles/permissions
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  resource,
  action = 'read',
  roles,
  fallback = null,
  requireAll = false
}) => {
  const { hasPermission, hasRole, currentUser } = useRBAC();

  if (!currentUser || !currentUser.isActive) {
    return <>{fallback}</>;
  }

  let hasAccess = true;

  // Check role-based access
  if (roles && roles.length > 0) {
    if (requireAll) {
      hasAccess = roles.every(role => hasRole(role));
    } else {
      hasAccess = roles.some(role => hasRole(role));
    }
  }

  // Check permission-based access
  if (hasAccess && resource) {
    hasAccess = hasPermission(resource, action);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Hook for conditional rendering based on permissions
export const usePermissions = () => {
  const { hasPermission, hasRole, canAccess, currentUser } = useRBAC();

  const can = (resource: ResourceType, action: ActionType = 'read') => {
    return hasPermission(resource, action);
  };

  const canAny = (checks: Array<{ resource: ResourceType; action?: ActionType }>) => {
    return checks.some(check => hasPermission(check.resource, check.action || 'read'));
  };

  const canAll = (checks: Array<{ resource: ResourceType; action?: ActionType }>) => {
    return checks.every(check => hasPermission(check.resource, check.action || 'read'));
  };

  const isRole = (roleId: string) => {
    return hasRole(roleId);
  };

  const isAnyRole = (roleIds: string[]) => {
    return roleIds.some(roleId => hasRole(roleId));
  };

  const isAllRoles = (roleIds: string[]) => {
    return roleIds.every(roleId => hasRole(roleId));
  };

  return {
    can,
    canAny,
    canAll,
    canAccess,
    isRole,
    isAnyRole,
    isAllRoles,
    user: currentUser
  };
};

// Hook for site-specific permissions
export const useSitePermissions = (siteId: string) => {
  const { canAccessSite, canPerformSiteAction, currentUser } = useRBAC();

  const canAccess = () => {
    return canAccessSite(siteId);
  };

  const canPerform = (module: SiteModule, action: SiteAction) => {
    return canPerformSiteAction(siteId, module, action);
  };

  const canView = (module: SiteModule) => {
    return canPerform(module, 'view');
  };

  const canEdit = (module: SiteModule) => {
    return canPerform(module, 'edit');
  };

  const canCreate = (module: SiteModule) => {
    return canPerform(module, 'create');
  };

  const canDelete = (module: SiteModule) => {
    return canPerform(module, 'delete');
  };

  const canManageTeam = () => {
    return canPerform('employees', 'manage_team');
  };

  const canManageBudget = () => {
    return canPerform('expenses', 'manage_budget');
  };

  const canManage = (module: SiteModule) => {
    return canPerform(module, 'manage') || canPerform(module, 'edit') || canPerform(module, 'create');
  };

  return {
    canAccess,
    canPerform,
    canView,
    canEdit,
    canCreate,
    canDelete,
    canManage,
    canManageTeam,
    canManageBudget,
    user: currentUser
  };
};

// Hook for organizational-level permissions
export const useOrganizationalPermissions = () => {
  const { 
    canAccessOrganizationalUnit, 
    canApproveAmount, 
    getApprovalThresholds,
    canEscalateApprovals,
    canManageUsers,
    getAccessibleOrganizationalUnits,
    getOrganizationalRole,
    getRoleHierarchyLevel,
    hasOrganizationalRole,
    currentUser 
  } = useRBAC();

  const canAccessOrgUnit = (orgUnitId: string) => {
    return canAccessOrganizationalUnit(orgUnitId);
  };

  const canApprove = {
    expense: (amount: number) => canApproveAmount(amount, 'expense'),
    budget: (amount: number) => canApproveAmount(amount, 'budget'),
    equipment: (amount: number) => canApproveAmount(amount, 'equipment'),
    payroll: (amount: number) => canApproveAmount(amount, 'payroll')
  };

  const thresholds = getApprovalThresholds();

  const canEscalate = () => {
    return canEscalateApprovals();
  };

  const canManage = {
    users: (targetOrgUnitId?: string) => canManageUsers(targetOrgUnitId),
    subordinates: () => getRoleHierarchyLevel() > 0,
    budget: () => hasOrganizationalRole('PROJECT_MANAGER') || hasOrganizationalRole('AREA_MANAGER') || hasOrganizationalRole('PMO'),
    reports: () => getRoleHierarchyLevel() >= 1 // ZONE_MANAGER and above
  };

  const scope = {
    orgUnits: getAccessibleOrganizationalUnits(),
    role: getOrganizationalRole(),
    hierarchyLevel: getRoleHierarchyLevel(),
    isManager: getRoleHierarchyLevel() >= 1,
    canCrossOrgBoundaries: getRoleHierarchyLevel() >= 2
  };

  return {
    canAccessOrgUnit,
    canApprove,
    thresholds,
    canEscalate,
    canManage,
    scope,
    user: currentUser
  };
};

// Hook for approval workflow permissions
export const useApprovalPermissions = () => {
  const { 
    canApproveAmount, 
    getApprovalThresholds,
    canEscalateApprovals,
    getOrganizationalRole,
    getRoleHierarchyLevel,
    currentUser 
  } = useRBAC();

  const canApproveRequest = (amount: number, type: 'expense' | 'budget' | 'equipment' | 'payroll', requestorOrgUnit?: string) => {
    // Basic amount check
    if (!canApproveAmount(amount, type)) return false;
    
    // Additional organizational scope checks could be added here
    return true;
  };

  const shouldEscalate = (amount: number, type: 'expense' | 'budget' | 'equipment' | 'payroll') => {
    return !canApproveAmount(amount, type) && canEscalateApprovals();
  };

  const getRequiredApprovalLevel = (amount: number, type: 'expense' | 'budget' | 'equipment' | 'payroll'): OrganizationalRole | null => {
    // Find the minimum role that can approve this amount
    const roles: OrganizationalRole[] = ['SITE_ENGINEER', 'ZONE_MANAGER', 'PROJECT_MANAGER', 'AREA_MANAGER', 'PMO'];
    
    for (const role of roles) {
      const thresholds = {
        'SITE_ENGINEER': { expense: 5000, budget: 0, equipment: 3000, payroll: 0 },
        'ZONE_MANAGER': { expense: 25000, budget: 15000, equipment: 15000, payroll: 10000 },
        'PROJECT_MANAGER': { expense: 100000, budget: 75000, equipment: 50000, payroll: 50000 },
        'AREA_MANAGER': { expense: 500000, budget: 400000, equipment: 250000, payroll: 200000 },
        'PMO': { expense: Number.MAX_SAFE_INTEGER, budget: Number.MAX_SAFE_INTEGER, equipment: Number.MAX_SAFE_INTEGER, payroll: Number.MAX_SAFE_INTEGER }
      };
      
      if (amount <= thresholds[role][type]) {
        return role;
      }
    }
    
    return 'PMO'; // Fallback to PMO
  };

  const canInitiateApproval = () => {
    // All users can initiate approval requests
    return !!currentUser;
  };

  const canViewApprovals = (requestorId?: string, requestorOrgUnit?: string) => {
    if (!currentUser) return false;
    
    // Users can view their own requests
    if (requestorId === currentUser.id) return true;
    
    // Managers can view requests from their org units
    if (getRoleHierarchyLevel() >= 1) return true;
    
    return false;
  };

  const role = getOrganizationalRole();
  const thresholds = getApprovalThresholds();

  return {
    canApproveRequest,
    shouldEscalate,
    getRequiredApprovalLevel,
    canInitiateApproval,
    canViewApprovals,
    canEscalate: canEscalateApprovals,
    role,
    thresholds,
    hierarchyLevel: getRoleHierarchyLevel(),
    user: currentUser
  };
};
