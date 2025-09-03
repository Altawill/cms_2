// Organizational Hierarchy Types

export type OrgUnitType = 'PMO' | 'AREA' | 'PROJECT' | 'ZONE';

export type UserRole = 
  | 'PMO' 
  | 'AREA_MANAGER' 
  | 'PROJECT_MANAGER' 
  | 'ZONE_MANAGER' 
  | 'SITE_ENGINEER' 
  | 'CASHIER' 
  | 'VIEWER' 
  | 'ADMIN';

export interface OrgUnit {
  id: string;
  type: OrgUnitType;
  name: string;
  code?: string;
  parentId?: string;
  region?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  parent?: OrgUnit;
  children?: OrgUnit[];
  primaryUsers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }>;
}

export interface OrgTreeNode extends OrgUnit {
  children: OrgTreeNode[];
  level: number;
  path: string[];
}

export interface UserScope {
  userId: string;
  role: UserRole;
  orgUnitId?: string;
  scopeIds: string[];
  orgUnits: Array<{
    id: string;
    type: OrgUnitType;
    name: string;
    code?: string;
    region?: string;
  }>;
}

export interface ScopeContextType {
  userScope: UserScope | null;
  orgTree: OrgTreeNode[];
  currentScope: string | null;
  availableScopes: OrgUnit[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentScope: (orgUnitId: string) => void;
  refreshScope: () => Promise<void>;
  canAccess: (orgUnitId: string) => boolean;
  withinScope: (orgUnitId: string) => boolean;
  getScopeAncestors: (orgUnitId: string) => OrgUnit[];
  getScopeDescendants: (orgUnitId: string) => OrgUnit[];
}

// RBAC Permission Context
export interface RBACContextType {
  user: any; // Current user from auth
  userScope: UserScope | null;
  can: (action: string, subject: string, context?: any) => boolean;
  canApprove: (amount: number, subject?: string) => boolean;
  getApprovalThreshold: (role: UserRole) => number;
  isInScope: (orgUnitId: string) => boolean;
}

// Approval workflow types
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalWorkflow {
  id: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  currentApprover?: string;
  status: ApprovalStatus;
  amount?: number;
  approvalTrail: ApprovalStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  id: string;
  role: UserRole;
  approvedBy?: string;
  approvedAt?: Date;
  status: ApprovalStatus;
  remark?: string;
  order: number;
}

// Org switcher component props
export interface OrgSwitcherProps {
  currentScope?: string;
  onScopeChange: (orgUnitId: string) => void;
  availableScopes: OrgUnit[];
  showBreadcrumb?: boolean;
  compact?: boolean;
}

// Context chip props
export interface ScopeChipProps {
  scope: OrgUnit;
  onRemove?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

// Utility types for filtering and scoping
export interface ScopedQuery {
  orgUnitId?: {
    in: string[];
  };
  [key: string]: any;
}

export interface FilterContext {
  scopeIds: string[];
  userRole: UserRole;
  currentScope?: string;
}

// Constants
export const ORG_UNIT_TYPES: Record<OrgUnitType, { label: string; color: string; icon: string }> = {
  PMO: { label: 'PMO', color: 'purple', icon: '🏢' },
  AREA: { label: 'Area', color: 'blue', icon: '🌐' },
  PROJECT: { label: 'Project', color: 'green', icon: '📋' },
  ZONE: { label: 'Zone', color: 'orange', icon: '📍' }
};

export const USER_ROLES: Record<UserRole, { label: string; description: string; color: string }> = {
  PMO: { 
    label: 'PMO', 
    description: 'Project Management Office - Full organizational access', 
    color: 'purple' 
  },
  AREA_MANAGER: { 
    label: 'Area Manager', 
    description: 'Manages area and all projects within', 
    color: 'blue' 
  },
  PROJECT_MANAGER: { 
    label: 'Project Manager', 
    description: 'Manages project and all zones within', 
    color: 'green' 
  },
  ZONE_MANAGER: { 
    label: 'Zone Manager', 
    description: 'Manages zone and all sites within', 
    color: 'orange' 
  },
  SITE_ENGINEER: { 
    label: 'Site Engineer', 
    description: 'Works on assigned sites only', 
    color: 'cyan' 
  },
  CASHIER: { 
    label: 'Cashier', 
    description: 'Handles financial transactions', 
    color: 'yellow' 
  },
  VIEWER: { 
    label: 'Viewer', 
    description: 'Read-only access within scope', 
    color: 'gray' 
  },
  ADMIN: { 
    label: 'Administrator', 
    description: 'System administrator with full access', 
    color: 'red' 
  }
};

// Approval thresholds (in LYD)
export const APPROVAL_THRESHOLDS: Record<string, number> = {
  ZONE: 1000,
  PROJECT: 5000,
  AREA: 20000,
  PMO: Infinity
};

// Local storage keys
export const STORAGE_KEYS = {
  CURRENT_SCOPE: 'management-system-current-scope',
  SCOPE_PREFERENCES: 'management-system-scope-preferences',
  LAST_VISITED_SCOPE: 'management-system-last-scope'
};
