import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { 
  ScopeContextType, 
  UserScope, 
  OrgTreeNode, 
  OrgUnit,
  OrgUnitType,
  UserRole 
} from '../types/organization';
import { STORAGE_KEYS } from '../types/organization';
import { organizationApi } from '../services/api/organizationApi';

const OrganizationContext = createContext<ScopeContextType | null>(null);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userScope, setUserScope] = useState<UserScope | null>(null);
  const [orgTree, setOrgTree] = useState<OrgTreeNode[]>([]);
  const [currentScope, setCurrentScopeState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate available scopes based on user's access
  const availableScopes = React.useMemo<OrgUnit[]>(() => {
    if (!userScope) return [];
    
    return userScope.orgUnits.map(unit => ({
      id: unit.id,
      type: unit.type,
      name: unit.name,
      code: unit.code,
      region: unit.region,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }, [userScope]);

  // Load user scope and org tree
  const loadUserScope = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch user's scope information
      const scopeData = await organizationApi.getUserScope();
      setUserScope(scopeData);
      
      // Fetch organizational tree
      const treeData = await organizationApi.getOrgTree();
      
      // Transform tree data with levels and paths
      const transformTreeWithLevels = (nodes: any[], level = 0, path: string[] = []): OrgTreeNode[] => {
        return nodes.map(node => ({
          ...node,
          level,
          path: [...path, node.id],
          children: transformTreeWithLevels(node.children || [], level + 1, [...path, node.id])
        }));
      };
      
      setOrgTree(transformTreeWithLevels(treeData));
      
      // Set initial scope from localStorage or user's primary org unit
      const storedScope = localStorage.getItem(STORAGE_KEYS.CURRENT_SCOPE);
      if (storedScope && scopeData.scopeIds.includes(storedScope)) {
        setCurrentScopeState(storedScope);
      } else if (scopeData.orgUnitId) {
        setCurrentScopeState(scopeData.orgUnitId);
      }
      
    } catch (err) {
      console.error('Failed to load user scope:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organizational data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Set current scope with persistence
  const setCurrentScope = useCallback((orgUnitId: string) => {
    if (!userScope?.scopeIds.includes(orgUnitId)) {
      console.warn('Attempted to set scope outside of user access:', orgUnitId);
      return;
    }
    
    setCurrentScopeState(orgUnitId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_SCOPE, orgUnitId);
    
    // Update user preferences
    const preferences = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SCOPE_PREFERENCES) || '{}'
    );
    preferences[user?.id || 'default'] = orgUnitId;
    localStorage.setItem(STORAGE_KEYS.SCOPE_PREFERENCES, JSON.stringify(preferences));
  }, [userScope, user]);

  // Refresh scope data
  const refreshScope = useCallback(async () => {
    await loadUserScope();
  }, [loadUserScope]);

  // Check if user can access a specific org unit
  const canAccess = useCallback((orgUnitId: string): boolean => {
    return userScope?.scopeIds.includes(orgUnitId) || false;
  }, [userScope]);

  // Check if org unit is within current scope
  const withinScope = useCallback((orgUnitId: string): boolean => {
    if (!currentScope || !userScope) return false;
    
    // If checking current scope itself
    if (orgUnitId === currentScope) return true;
    
    // Check if orgUnitId is a descendant of current scope
    const findInTree = (nodes: OrgTreeNode[], targetId: string, ancestorId: string): boolean => {
      for (const node of nodes) {
        if (node.id === ancestorId) {
          // Found the ancestor, now check if target is in its descendants
          const checkDescendants = (descendants: OrgTreeNode[]): boolean => {
            for (const desc of descendants) {
              if (desc.id === targetId) return true;
              if (checkDescendants(desc.children)) return true;
            }
            return false;
          };
          return checkDescendants(node.children);
        }
        if (findInTree(node.children, targetId, ancestorId)) return true;
      }
      return false;
    };
    
    return findInTree(orgTree, orgUnitId, currentScope);
  }, [currentScope, userScope, orgTree]);

  // Get ancestors of an org unit
  const getScopeAncestors = useCallback((orgUnitId: string): OrgUnit[] => {
    if (!userScope) return [];
    
    const ancestors: OrgUnit[] = [];
    const findAncestors = (nodes: OrgTreeNode[], targetId: string, path: OrgTreeNode[] = []): boolean => {
      for (const node of nodes) {
        const currentPath = [...path, node];
        if (node.id === targetId) {
          ancestors.push(...currentPath.slice(0, -1)); // Exclude the target itself
          return true;
        }
        if (findAncestors(node.children, targetId, currentPath)) {
          return true;
        }
      }
      return false;
    };
    
    findAncestors(orgTree, orgUnitId);
    return ancestors;
  }, [userScope, orgTree]);

  // Get descendants of an org unit
  const getScopeDescendants = useCallback((orgUnitId: string): OrgUnit[] => {
    const descendants: OrgUnit[] = [];
    
    const findAndCollectDescendants = (nodes: OrgTreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          const collectAllDescendants = (descendants: OrgTreeNode[]) => {
            for (const desc of descendants) {
              descendants.push(desc);
              collectAllDescendants(desc.children);
            }
          };
          collectAllDescendants(node.children);
          return true;
        }
        if (findAndCollectDescendants(node.children, targetId)) {
          return true;
        }
      }
      return false;
    };
    
    findAndCollectDescendants(orgTree, orgUnitId);
    return descendants;
  }, [orgTree]);

  // Load scope on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserScope();
    } else {
      setUserScope(null);
      setOrgTree([]);
      setCurrentScopeState(null);
    }
  }, [isAuthenticated, user, loadUserScope]);

  // Clean up localStorage on logout
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SCOPE);
    }
  }, [isAuthenticated]);

  const contextValue: ScopeContextType = {
    userScope,
    orgTree,
    currentScope,
    availableScopes,
    isLoading,
    error,
    setCurrentScope,
    refreshScope,
    canAccess,
    withinScope,
    getScopeAncestors,
    getScopeDescendants
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): ScopeContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

// RBAC Context for permission checking
const RBACContext = createContext<any>(null);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { userScope } = useOrganization();

  // Check if user can perform action on subject
  const can = useCallback((action: string, subject: string, context?: any): boolean => {
    if (!user || !userScope) return false;

    // Admin can do everything
    if (userScope.role === 'ADMIN') return true;

    // Define role permissions matrix
    const rolePermissions: Record<UserRole, Record<string, string[]>> = {
      PMO: {
        sites: ['create', 'read', 'update', 'delete'],
        tasks: ['create', 'read', 'update', 'delete', 'approve'],
        expenses: ['create', 'read', 'update', 'delete', 'approve'],
        revenues: ['create', 'read', 'update', 'delete'],
        safes: ['create', 'read', 'update', 'delete', 'approve'],
        payroll: ['create', 'read', 'update', 'delete', 'approve'],
        employees: ['create', 'read', 'update', 'delete'],
        reports: ['create', 'read', 'export'],
        users: ['create', 'read', 'update', 'delete'],
        dashboard: ['read']
      },
      AREA_MANAGER: {
        sites: ['create', 'read', 'update'],
        tasks: ['create', 'read', 'update', 'approve'],
        expenses: ['create', 'read', 'update', 'approve'],
        revenues: ['create', 'read', 'update'],
        safes: ['read', 'update', 'approve'],
        payroll: ['read', 'approve'],
        employees: ['create', 'read', 'update'],
        reports: ['create', 'read', 'export'],
        dashboard: ['read']
      },
      PROJECT_MANAGER: {
        sites: ['create', 'read', 'update'],
        tasks: ['create', 'read', 'update', 'approve'],
        expenses: ['create', 'read', 'update', 'approve'],
        revenues: ['create', 'read', 'update'],
        safes: ['read', 'update', 'approve'],
        payroll: ['read', 'approve'],
        employees: ['create', 'read', 'update'],
        reports: ['create', 'read', 'export'],
        dashboard: ['read']
      },
      ZONE_MANAGER: {
        sites: ['read', 'update'],
        tasks: ['create', 'read', 'update', 'approve'],
        expenses: ['create', 'read', 'update', 'approve'],
        revenues: ['create', 'read', 'update'],
        safes: ['read', 'update'],
        payroll: ['read'],
        employees: ['read', 'update'],
        reports: ['create', 'read', 'export'],
        dashboard: ['read']
      },
      SITE_ENGINEER: {
        sites: ['read'],
        tasks: ['create', 'read', 'update'],
        expenses: ['create', 'read'],
        revenues: ['read'],
        safes: ['read'],
        payroll: ['read'],
        employees: ['read'],
        reports: ['read'],
        dashboard: ['read']
      },
      CASHIER: {
        sites: ['read'],
        tasks: ['read'],
        expenses: ['read'],
        revenues: ['create', 'read', 'update'],
        safes: ['create', 'read', 'update'],
        payroll: ['read'],
        employees: ['read'],
        reports: ['read'],
        dashboard: ['read']
      },
      VIEWER: {
        sites: ['read'],
        tasks: ['read'],
        expenses: ['read'],
        revenues: ['read'],
        safes: ['read'],
        payroll: ['read'],
        employees: ['read'],
        reports: ['read'],
        dashboard: ['read']
      },
      ADMIN: {
        sites: ['create', 'read', 'update', 'delete'],
        tasks: ['create', 'read', 'update', 'delete', 'approve'],
        expenses: ['create', 'read', 'update', 'delete', 'approve'],
        revenues: ['create', 'read', 'update', 'delete'],
        safes: ['create', 'read', 'update', 'delete', 'approve'],
        payroll: ['create', 'read', 'update', 'delete', 'approve'],
        employees: ['create', 'read', 'update', 'delete'],
        reports: ['create', 'read', 'export', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        dashboard: ['read'],
        system: ['manage']
      }
    };

    const permissions = rolePermissions[userScope.role];
    if (!permissions || !permissions[subject]) return false;

    return permissions[subject].includes(action);
  }, [user, userScope]);

  // Check if user can approve specific amount
  const canApprove = useCallback((amount: number, subject = 'expenses'): boolean => {
    if (!can('approve', subject)) return false;

    const thresholds = {
      ZONE_MANAGER: 1000,
      PROJECT_MANAGER: 5000,
      AREA_MANAGER: 20000,
      PMO: Infinity,
      ADMIN: Infinity
    };

    const userThreshold = thresholds[userScope?.role as keyof typeof thresholds];
    return amount <= (userThreshold || 0);
  }, [can, userScope]);

  // Get approval threshold for role
  const getApprovalThreshold = useCallback((role: UserRole): number => {
    const thresholds = {
      ZONE_MANAGER: 1000,
      PROJECT_MANAGER: 5000,
      AREA_MANAGER: 20000,
      PMO: Infinity,
      ADMIN: Infinity
    };
    return thresholds[role] || 0;
  }, []);

  // Check if org unit is in user's scope
  const isInScope = useCallback((orgUnitId: string): boolean => {
    return userScope?.scopeIds.includes(orgUnitId) || false;
  }, [userScope]);

  const rbacValue = {
    user,
    userScope,
    can,
    canApprove,
    getApprovalThreshold,
    isInScope
  };

  return (
    <RBACContext.Provider value={rbacValue}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
