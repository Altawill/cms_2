import { getUserScopeOrgUnitIds, can, createAuditLog } from '../lib/rbac.js';

/**
 * Middleware to add user scope to request object
 * This should be used after authentication middleware
 */
export const addUserScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // No user, let auth middleware handle it
    }

    // Get user's scope (all org units they can access)
    req.userScopeIds = await getUserScopeOrgUnitIds(req.user);
    
    next();
  } catch (error) {
    console.error('Error adding user scope:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to enforce scope-based access control
 * @param {string} subject - Resource type (sites, tasks, expenses, etc.)
 * @param {string} action - Action being performed
 * @param {Function} getOrgUnitId - Function to extract orgUnitId from request
 */
export const enforceScope = (subject, action, getOrgUnitId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get orgUnitId from the resource being accessed
      let orgUnitId;
      if (typeof getOrgUnitId === 'function') {
        orgUnitId = await getOrgUnitId(req);
      } else if (typeof getOrgUnitId === 'string') {
        orgUnitId = req.params[getOrgUnitId] || req.body[getOrgUnitId];
      }

      // Check if user can perform this action
      const hasPermission = can(req.user, action, subject, {
        orgUnitId,
        scopeIds: req.userScopeIds
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Access denied',
          details: `Insufficient permissions to ${action} ${subject}${orgUnitId ? ` in scope ${orgUnitId}` : ''}`
        });
      }

      next();
    } catch (error) {
      console.error('Error in scope enforcement:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to filter query results by user scope
 * This should be used for list endpoints to ensure users only see data they have access to
 */
export const scopeFilter = (orgUnitField = 'orgUnitId') => {
  return (req, res, next) => {
    if (!req.user || !req.userScopeIds) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Add scope filter to the request
    req.scopeFilter = {
      [orgUnitField]: {
        in: req.userScopeIds
      }
    };

    next();
  };
};

/**
 * Middleware for approval workflows
 * Checks if user can approve based on amount and role
 */
export const enforceApproval = (getAmount, getSubject = 'expenses') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      let amount;
      if (typeof getAmount === 'function') {
        amount = await getAmount(req);
      } else if (typeof getAmount === 'string') {
        amount = req.body[getAmount] || req.params[getAmount];
      } else {
        amount = req.body.amount || req.body.total;
      }

      const subject = typeof getSubject === 'function' ? await getSubject(req) : getSubject;

      // Check if user can approve this amount
      const hasPermission = can(req.user, 'approve', subject, {
        amount,
        scopeIds: req.userScopeIds
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Approval denied',
          details: `Insufficient approval authority for amount ${amount} LYD`
        });
      }

      next();
    } catch (error) {
      console.error('Error in approval enforcement:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to create audit log for important operations
 */
export const auditLog = (entityType, action, getEntityId, getBeforeData = null, getAfterData = null) => {
  return async (req, res, next) => {
    try {
      // Store original res.json to intercept response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Create audit log after successful operation
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(async () => {
            try {
              let entityId;
              let beforeData = null;
              let afterData = null;

              if (typeof getEntityId === 'function') {
                entityId = await getEntityId(req, data);
              } else if (typeof getEntityId === 'string') {
                entityId = req.params[getEntityId] || data[getEntityId];
              }

              if (getBeforeData && typeof getBeforeData === 'function') {
                beforeData = await getBeforeData(req);
              }

              if (getAfterData && typeof getAfterData === 'function') {
                afterData = await getAfterData(req, data);
              } else if (action === 'create' || action === 'update') {
                afterData = data;
              }

              await createAuditLog(
                entityType,
                entityId,
                action.toUpperCase(),
                req.user.id,
                beforeData,
                afterData,
                {
                  method: req.method,
                  url: req.originalUrl,
                  userAgent: req.get('User-Agent'),
                  ip: req.ip
                }
              );
            } catch (error) {
              console.error('Error creating audit log:', error);
            }
          });
        }

        // Call original res.json
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Error in audit log middleware:', error);
      next();
    }
  };
};

/**
 * Helper to check if user can access a specific site
 */
export const canAccessSite = async (req, siteId) => {
  if (!req.userScopeIds || req.userScopeIds.length === 0) {
    return false;
  }

  // Get site's orgUnitId
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { orgUnitId: true }
    });

    if (!site) {
      return false;
    }

    return req.userScopeIds.includes(site.orgUnitId);
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Utility to apply scope filtering to Prisma queries
 */
export const applyScopeFilter = (query, userScopeIds, orgUnitField = 'orgUnitId') => {
  if (!userScopeIds || userScopeIds.length === 0) {
    // No scope access - return query that matches nothing
    return {
      ...query,
      where: {
        ...query.where,
        [orgUnitField]: 'no-access'
      }
    };
  }

  return {
    ...query,
    where: {
      ...query.where,
      [orgUnitField]: {
        in: userScopeIds
      }
    }
  };
};
