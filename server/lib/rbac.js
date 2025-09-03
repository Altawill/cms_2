import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Role hierarchy and capabilities
export const ROLES = {
  PMO: 'PMO',
  AREA_MANAGER: 'AREA_MANAGER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  ZONE_MANAGER: 'ZONE_MANAGER',
  SITE_ENGINEER: 'SITE_ENGINEER',
  CASHIER: 'CASHIER',
  VIEWER: 'VIEWER',
  ADMIN: 'ADMIN'
};

// Expense approval thresholds (in LYD)
export const APPROVAL_THRESHOLDS = {
  ZONE: 1000,
  PROJECT: 5000,
  AREA: 20000,
  PMO: Infinity
};

/**
 * Get all organizational units that a user has access to (scope)
 * This includes their primary unit and all descendants
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Array<string>} Array of org unit IDs that user can access
 */
export async function getUserScopeOrgUnitIds(userId, role) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, orgUnitId: true, role: true }
  });
  
  if (!user) {
    return [];
  }
  if (!user.orgUnitId) {
    // If no org unit assigned, return empty scope (no access)
    return [];
  }

  // For ADMIN role, return all org units
  if (user.role === ROLES.ADMIN) {
    const allUnits = await prisma.orgUnit.findMany({
      select: { id: true }
    });
    return allUnits.map(unit => unit.id);
  }

  // Get user's primary org unit and all its descendants
  const userScope = await getOrgUnitWithDescendants(user.orgUnitId);
  
  // Add any additional org assignments
  const additionalAssignments = await prisma.userOrgAssignment.findMany({
    where: { userId: user.id },
    select: { orgUnitId: true }
  });

  const additionalIds = [];
  for (const assignment of additionalAssignments) {
    const descendantIds = await getOrgUnitWithDescendants(assignment.orgUnitId);
    additionalIds.push(...descendantIds);
  }

  // Combine and deduplicate
  return [...new Set([...userScope, ...additionalIds])];
}

/**
 * Get org unit and all its descendants
 * @param {string} orgUnitId 
 * @returns {Array<string>} Array of org unit IDs
 */
async function getOrgUnitWithDescendants(orgUnitId) {
  const descendants = [];
  
  async function collectDescendants(unitId) {
    descendants.push(unitId);
    
    const children = await prisma.orgUnit.findMany({
      where: { parentId: unitId },
      select: { id: true }
    });
    
    for (const child of children) {
      await collectDescendants(child.id);
    }
  }
  
  await collectDescendants(orgUnitId);
  return descendants;
}

/**
 * Central authorization function
 * @param {Object} user - User object
 * @param {string} action - Action to perform (create, read, update, delete, approve)
 * @param {string} subject - Subject/resource (tasks, expenses, sites, etc.)
 * @param {Object} context - Additional context (orgUnitId, amount, etc.)
 * @returns {boolean} Whether user can perform the action
 */
export function can(user, action, subject, context = {}) {
  if (!user || !user.role) {
    return false;
  }

  // ADMIN can do everything
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  // Check basic role permissions
  const hasPermission = checkRolePermission(user.role, action, subject);
  if (!hasPermission) {
    return false;
  }

  // Check scope-based permissions
  if (context.orgUnitId && !context.scopeIds?.includes(context.orgUnitId)) {
    return false;
  }

  // Check approval thresholds for financial operations
  if (action === 'approve' && context.amount) {
    return canApproveAmount(user.role, context.amount);
  }

  return true;
}

/**
 * Check if role has permission for action on subject
 * @param {string} role 
 * @param {string} action 
 * @param {string} subject 
 * @returns {boolean}
 */
function checkRolePermission(role, action, subject) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions || !permissions[subject]) {
    return false;
  }

  return permissions[subject].includes(action);
}

/**
 * Check if user can approve the given amount based on role and thresholds
 * @param {string} role 
 * @param {number} amount 
 * @returns {boolean}
 */
function canApproveAmount(role, amount) {
  switch (role) {
    case ROLES.PMO:
      return true; // PMO can approve any amount
    case ROLES.AREA_MANAGER:
      return amount <= APPROVAL_THRESHOLDS.AREA;
    case ROLES.PROJECT_MANAGER:
      return amount <= APPROVAL_THRESHOLDS.PROJECT;
    case ROLES.ZONE_MANAGER:
      return amount <= APPROVAL_THRESHOLDS.ZONE;
    default:
      return false;
  }
}

/**
 * Get the next approver role based on amount and current role
 * @param {number} amount 
 * @param {string} currentRole 
 * @returns {string|null} Next approver role or null if no approval needed
 */
export function getNextApprover(amount, currentRole) {
  if (amount <= APPROVAL_THRESHOLDS.ZONE) {
    return currentRole === ROLES.SITE_ENGINEER ? ROLES.ZONE_MANAGER : null;
  } else if (amount <= APPROVAL_THRESHOLDS.PROJECT) {
    return ROLES.PROJECT_MANAGER;
  } else if (amount <= APPROVAL_THRESHOLDS.AREA) {
    return ROLES.AREA_MANAGER;
  } else {
    return ROLES.PMO;
  }
}

/**
 * Role-based permission matrix
 */
export const ROLE_PERMISSIONS = {
  [ROLES.PMO]: {
    sites: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete', 'approve'],
    expenses: ['create', 'read', 'update', 'delete', 'approve'],
    revenues: ['create', 'read', 'update', 'delete'],
    safes: ['create', 'read', 'update', 'delete', 'approve'],
    payroll: ['create', 'read', 'update', 'delete', 'approve'],
    employees: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'export'],
    users: ['create', 'read', 'update', 'delete'],
    approval: ['read', 'update'],
    dashboard: ['read']
  },

  [ROLES.AREA_MANAGER]: {
    sites: ['create', 'read', 'update'],
    tasks: ['create', 'read', 'update', 'approve'],
    expenses: ['create', 'read', 'update', 'approve'],
    revenues: ['create', 'read', 'update'],
    safes: ['read', 'update', 'approve'],
    payroll: ['read', 'approve'],
    employees: ['create', 'read', 'update'],
    reports: ['create', 'read', 'export'],
    approval: ['read', 'update'],
    dashboard: ['read']
  },

  [ROLES.PROJECT_MANAGER]: {
    sites: ['create', 'read', 'update'],
    tasks: ['create', 'read', 'update', 'approve'],
    expenses: ['create', 'read', 'update', 'approve'],
    revenues: ['create', 'read', 'update'],
    safes: ['read', 'update', 'approve'],
    payroll: ['read', 'approve'],
    employees: ['create', 'read', 'update'],
    reports: ['create', 'read', 'export'],
    approval: ['read', 'update'],
    dashboard: ['read']
  },

  [ROLES.ZONE_MANAGER]: {
    sites: ['read', 'update'],
    tasks: ['create', 'read', 'update', 'approve'],
    expenses: ['create', 'read', 'update', 'approve'],
    revenues: ['create', 'read', 'update'],
    safes: ['read', 'update'],
    payroll: ['read'],
    employees: ['read', 'update'],
    reports: ['create', 'read', 'export'],
    approval: ['read', 'update'],
    dashboard: ['read']
  },

  [ROLES.SITE_ENGINEER]: {
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

  [ROLES.CASHIER]: {
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

  [ROLES.VIEWER]: {
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

  [ROLES.ADMIN]: {
    // Admin has all permissions on all resources
    sites: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete', 'approve'],
    expenses: ['create', 'read', 'update', 'delete', 'approve'],
    revenues: ['create', 'read', 'update', 'delete'],
    safes: ['create', 'read', 'update', 'delete', 'approve'],
    payroll: ['create', 'read', 'update', 'delete', 'approve'],
    employees: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'export', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    approval: ['read', 'update'],
    dashboard: ['read'],
    system: ['manage']
  }
};

/**
 * Create audit log entry
 * @param {string} entityType 
 * @param {string} entityId 
 * @param {string} action 
 * @param {string} userId 
 * @param {Object} beforeData 
 * @param {Object} afterData 
 * @param {Object} metadata 
 */
export async function createAuditLog(entityType, entityId, action, userId, beforeData = null, afterData = null, metadata = null) {
  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      userId,
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}

/**
 * Utility to derive orgUnitId from a site
 * @param {string} siteId 
 * @returns {Promise<string>} orgUnitId of the site's zone
 */
export async function deriveOrgUnitFromSite(siteId) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { orgUnitId: true }
  });
  
  if (!site) {
    throw new Error(`Site ${siteId} not found`);
  }
  
  return site.orgUnitId;
}
