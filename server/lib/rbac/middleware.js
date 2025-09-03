import { PrismaClient } from '@prisma/client';
import { getUserScopeOrgUnitIds, can } from '../rbac.js';

const prisma = new PrismaClient();

// Middleware to enforce RBAC with organizational scope
export const enforceRBACWithScope = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's scope (org units they have access to)
      const scopeOrgUnitIds = await getUserScopeOrgUnitIds(user.userId, user.role);
      req.userScopeOrgUnitIds = scopeOrgUnitIds;

      // Check if user has permission for the resource/action
      const hasPermission = await can(user, action, resource);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Access denied. Required permission: ${action} on ${resource}` 
        });
      }

      next();
    } catch (error) {
      console.error('RBAC enforcement error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Middleware to add user scope information to requests
export const addUserScope = async (req, res, next) => {
  try {
    const user = req.user;
    if (user) {
      const scopeOrgUnitIds = await getUserScopeOrgUnitIds(user.userId, user.role);
      req.userScopeOrgUnitIds = scopeOrgUnitIds;
      req.userScopeIds = scopeOrgUnitIds; // Legacy support
    }
    next();
  } catch (error) {
    console.error('User scope middleware error:', error);
    next();
  }
};
