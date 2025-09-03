import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { addUserScope, enforceScope, scopeFilter, applyScopeFilter } from './middleware/rbac.js';
import { getUserScopeOrgUnitIds, can } from './lib/rbac.js';
import approvalRoutes from './routes/approval.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Management System API is running' });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email - accept both formats
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
          // Also try adding @company.com if it's just a username
          { email: username.includes('@') ? username : `${username}@company.com` }
        ],
        isActive: true
      },
      include: {
        primaryOrgUnit: true,
        orgAssignments: {
          include: {
            orgUnit: true
          }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token with role and org unit info
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email,
        role: user.role,
        orgUnitId: user.orgUnitId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Transform user data to match frontend expectations
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      department: user.department,
      position: user.position,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      roles: user.roles.map(ur => ur.role.id),
      permissions: user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action
        }))
      )
    };

    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// User Management Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        },
        siteAccess: {
          include: {
            site: true,
            permissions: true
          }
        }
      }
    });

    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      department: user.department,
      position: user.position,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ur.role.id),
      siteAccess: user.siteAccess.map(sa => ({
        siteId: sa.site.id,
        siteName: sa.site.name,
        permissions: sa.permissions.map(p => ({
          module: p.module,
          actions: JSON.parse(p.actions)
        })),
        restrictions: []
      }))
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      phoneNumber, 
      department, 
      position, 
      roles, 
      isActive = true 
    } = req.body;

    if (!username || !email || !password || !firstName || !lastName || !roles?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username ? 'Username already exists' : 'Email already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
        department,
        position,
        isActive,
        roles: {
          create: roles.map(roleId => ({
            roleId
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: newUser.id,
        action: 'create_user',
        resource: 'users',
        resourceId: newUser.id,
        metadata: JSON.stringify({ createdBy: req.user.userId })
      }
    });

    const transformedUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phoneNumber: newUser.phoneNumber,
      department: newUser.department,
      position: newUser.position,
      isActive: newUser.isActive,
      lastLogin: newUser.lastLogin,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      roles: newUser.roles.map(ur => ur.role.id),
      siteAccess: []
    };

    res.status(201).json(transformedUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      phoneNumber, 
      department, 
      position, 
      roles, 
      isActive 
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for username/email conflicts
    if (username || email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                username ? { username } : {},
                email ? { email } : {}
              ]
            }
          ]
        }
      });

      if (conflictUser) {
        return res.status(400).json({ 
          error: conflictUser.username === username ? 'Username already exists' : 'Email already exists' 
        });
      }
    }

    // Prepare update data
    const updateData = {
      username,
      email,
      firstName,
      lastName,
      phoneNumber,
      department,
      position,
      isActive
    };

    // Only update password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true
          }
        },
        siteAccess: {
          include: {
            site: true,
            permissions: true
          }
        }
      }
    });

    // Update roles if provided
    if (roles) {
      // Delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Add new roles
      await prisma.userRole.createMany({
        data: roles.map(roleId => ({
          userId: id,
          roleId
        }))
      });
    }

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: id,
        action: 'update_user',
        resource: 'users',
        resourceId: id,
        metadata: JSON.stringify({ updatedBy: req.user.userId, changes: updateData })
      }
    });

    const transformedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumber: updatedUser.phoneNumber,
      department: updatedUser.department,
      position: updatedUser.position,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      roles: roles || updatedUser.roles.map(ur => ur.role.id),
      siteAccess: updatedUser.siteAccess.map(sa => ({
        siteId: sa.site.id,
        siteName: sa.site.name,
        permissions: sa.permissions.map(p => ({
          module: p.module,
          actions: JSON.parse(p.actions)
        })),
        restrictions: []
      }))
    };

    res.json(transformedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Role Management Routes
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.isSystemRole,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    }));

    res.json(transformedRoles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Organizational Hierarchy Routes
app.get('/api/org-units', authenticateToken, addUserScope, async (req, res) => {
  try {
    const orgUnits = await prisma.orgUnit.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: true,
        primaryUsers: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });

    res.json(orgUnits);
  } catch (error) {
    console.error('Get org units error:', error);
    res.status(500).json({ error: 'Failed to fetch organizational units' });
  }
});

app.get('/api/org-tree', authenticateToken, addUserScope, async (req, res) => {
  try {
    // Build hierarchical tree structure
    const orgUnits = await prisma.orgUnit.findMany({
      where: { isActive: true },
      include: {
        primaryUsers: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });

    // Convert flat list to tree structure
    const orgMap = new Map();
    const tree = [];

    // First pass: create all nodes
    orgUnits.forEach(unit => {
      orgMap.set(unit.id, {
        ...unit,
        children: []
      });
    });

    // Second pass: build tree structure
    orgUnits.forEach(unit => {
      if (unit.parentId) {
        const parent = orgMap.get(unit.parentId);
        if (parent) {
          parent.children.push(orgMap.get(unit.id));
        }
      } else {
        tree.push(orgMap.get(unit.id));
      }
    });

    res.json(tree);
  } catch (error) {
    console.error('Get org tree error:', error);
    res.status(500).json({ error: 'Failed to fetch organizational tree' });
  }
});

app.get('/api/user-scope', authenticateToken, addUserScope, async (req, res) => {
  try {
    // Return user's scope information
    const scopeInfo = {
      userId: req.user.userId,
      role: req.user.role,
      orgUnitId: req.user.orgUnitId,
      scopeIds: req.userScopeIds
    };

    // Get detailed org unit information for scope
    const orgUnits = await prisma.orgUnit.findMany({
      where: {
        id: { in: req.userScopeIds }
      },
      select: {
        id: true,
        type: true,
        name: true,
        code: true,
        region: true
      }
    });

    res.json({
      ...scopeInfo,
      orgUnits
    });
  } catch (error) {
    console.error('Get user scope error:', error);
    res.status(500).json({ error: 'Failed to fetch user scope' });
  }
});

// Site Management Routes
app.get('/api/sites', authenticateToken, addUserScope, enforceScope('sites', 'read'), async (req, res) => {
  try {
    // Apply scope filtering to the query
    const scopedQuery = applyScopeFilter(
      { where: { isActive: true }, include: { orgUnit: true } },
      req.userScopeIds
    );
    
    const sites = await prisma.site.findMany(scopedQuery);

    res.json(sites);
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Approval Workflow Routes
app.use('/api/approval', addUserScope, approvalRoutes);

// User Site Access Routes
app.put('/api/users/:id/site-access', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { siteAccess } = req.body;

    // Delete existing site access
    await prisma.userSiteAccess.deleteMany({
      where: { userId: id }
    });

    // Create new site access
    for (const access of siteAccess) {
      const userSiteAccess = await prisma.userSiteAccess.create({
        data: {
          userId: id,
          siteId: access.siteId
        }
      });

      // Create permissions for this site access
      for (const permission of access.permissions) {
        await prisma.userSitePermission.create({
          data: {
            userSiteAccessId: userSiteAccess.id,
            module: permission.module,
            actions: JSON.stringify(permission.actions)
          }
        });
      }
    }

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: id,
        action: 'update_site_access',
        resource: 'users',
        resourceId: id,
        metadata: JSON.stringify({ updatedBy: req.user.userId, siteAccess })
      }
    });

    res.json({ success: true, message: 'Site access updated successfully' });
  } catch (error) {
    console.error('Update site access error:', error);
    res.status(500).json({ error: 'Failed to update site access' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Management System API server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
