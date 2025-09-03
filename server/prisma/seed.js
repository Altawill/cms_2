import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  console.log('Creating permissions...');
  const permissions = [
    // Dashboard permissions
    { resource: 'dashboard', action: 'read' },
    { resource: 'dashboard', action: 'analytics' },
    
    // User permissions
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'users', action: 'manage_users' },
    { resource: 'users', action: 'manage_roles' },
    
    // Site permissions
    { resource: 'sites', action: 'read' },
    { resource: 'sites', action: 'create' },
    { resource: 'sites', action: 'update' },
    { resource: 'sites', action: 'delete' },
    { resource: 'sites', action: 'manage_sites' },
    
    // Employee permissions
    { resource: 'employees', action: 'read' },
    { resource: 'employees', action: 'create' },
    { resource: 'employees', action: 'update' },
    { resource: 'employees', action: 'delete' },
    
    // Equipment permissions
    { resource: 'equipment', action: 'read' },
    { resource: 'equipment', action: 'create' },
    { resource: 'equipment', action: 'update' },
    { resource: 'equipment', action: 'delete' },
    
    // Expense permissions
    { resource: 'expenses', action: 'read' },
    { resource: 'expenses', action: 'create' },
    { resource: 'expenses', action: 'update' },
    { resource: 'expenses', action: 'delete' },
    { resource: 'expenses', action: 'approve' },
    
    // Approval permissions
    { resource: 'approvals', action: 'read' },
    { resource: 'approvals', action: 'update' },
    
    // Report permissions
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'export' },
    
    // Settings permissions
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'update' }
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm
    });
    createdPermissions.push(permission);
  }

  // Create roles with permissions
  console.log('Creating roles...');
  
  // Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Administrator' },
    update: {},
    create: {
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      isSystemRole: true
    }
  });

  // Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Administrative access to most system features',
      isSystemRole: true
    }
  });

  // Manager Role
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Management level access to projects and teams',
      isSystemRole: true
    }
  });

  // Site Supervisor Role
  const supervisorRole = await prisma.role.upsert({
    where: { name: 'Site Supervisor' },
    update: {},
    create: {
      name: 'Site Supervisor',
      description: 'Site-specific management and supervision',
      isSystemRole: true
    }
  });

  // Accountant Role
  const accountantRole = await prisma.role.upsert({
    where: { name: 'Accountant' },
    update: {},
    create: {
      name: 'Accountant',
      description: 'Financial management and reporting access',
      isSystemRole: true
    }
  });

  // HR Manager Role
  const hrRole = await prisma.role.upsert({
    where: { name: 'HR Manager' },
    update: {},
    create: {
      name: 'HR Manager',
      description: 'Human resources management access',
      isSystemRole: true
    }
  });

  // Employee Role
  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      description: 'Basic employee access',
      isSystemRole: true
    }
  });

  // Viewer Role
  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access to basic information',
      isSystemRole: true
    }
  });

  // RBAC Organizational Roles for Approval Workflow
  const pmoRole = await prisma.role.upsert({
    where: { name: 'PMO' },
    update: {},
    create: {
      name: 'PMO',
      description: 'Project Management Office role with high-level approval authority',
      isSystemRole: true
    }
  });

  const areaManagerRole = await prisma.role.upsert({
    where: { name: 'Area Manager' },
    update: {},
    create: {
      name: 'Area Manager',
      description: 'Area-level management with regional approval authority',
      isSystemRole: true
    }
  });

  const projectManagerRole = await prisma.role.upsert({
    where: { name: 'Project Manager' },
    update: {},
    create: {
      name: 'Project Manager',
      description: 'Project-level management with site approval authority',
      isSystemRole: true
    }
  });

  const zoneManagerRole = await prisma.role.upsert({
    where: { name: 'Zone Manager' },
    update: {},
    create: {
      name: 'Zone Manager',
      description: 'Zone-level management with localized approval authority',
      isSystemRole: true
    }
  });

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');

  // Super Admin gets all permissions
  const allPermissions = createdPermissions;
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id }
    });
  }

  // Admin permissions
  const adminPermissions = createdPermissions.filter(p => 
    !['settings'].includes(p.resource) || p.action === 'read'
  );
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id }
    });
  }

  // Manager permissions
  const managerPermissions = createdPermissions.filter(p => 
    ['dashboard', 'sites', 'employees', 'equipment', 'expenses', 'reports'].includes(p.resource) &&
    !['delete'].includes(p.action)
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: managerRole.id, permissionId: permission.id }
    });
  }

  // Site Supervisor permissions
  const supervisorPermissions = createdPermissions.filter(p => 
    ['dashboard', 'sites', 'employees', 'equipment', 'expenses', 'reports'].includes(p.resource) &&
    ['read', 'create', 'update'].includes(p.action)
  );
  for (const permission of supervisorPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: supervisorRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: supervisorRole.id, permissionId: permission.id }
    });
  }

  // Accountant permissions
  const accountantPermissions = createdPermissions.filter(p => 
    ['dashboard', 'expenses', 'reports'].includes(p.resource)
  );
  for (const permission of accountantPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: accountantRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: accountantRole.id, permissionId: permission.id }
    });
  }

  // HR Manager permissions
  const hrPermissions = createdPermissions.filter(p => 
    ['dashboard', 'employees', 'reports'].includes(p.resource) &&
    !['delete'].includes(p.action)
  );
  for (const permission of hrPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: hrRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: hrRole.id, permissionId: permission.id }
    });
  }

  // Employee permissions
  const empPermissions = createdPermissions.filter(p => 
    ['dashboard', 'employees', 'sites', 'expenses', 'reports'].includes(p.resource) &&
    ['read', 'create'].includes(p.action)
  );
  for (const permission of empPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: permission.id }
    });
  }

  // Viewer permissions
  const viewerPermissions = createdPermissions.filter(p => p.action === 'read');
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: permission.id }
    });
  }

  // RBAC Organizational Role permissions
  const rbacManagerialPermissions = createdPermissions.filter(p => 
    ['dashboard', 'sites', 'employees', 'expenses', 'reports', 'approvals'].includes(p.resource) &&
    !['delete'].includes(p.action)
  );
  
  // PMO permissions (highest approval authority)
  for (const permission of rbacManagerialPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: pmoRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: pmoRole.id, permissionId: permission.id }
    });
  }

  // Area Manager permissions
  for (const permission of rbacManagerialPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: areaManagerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: areaManagerRole.id, permissionId: permission.id }
    });
  }

  // Project Manager permissions
  for (const permission of rbacManagerialPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: projectManagerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: projectManagerRole.id, permissionId: permission.id }
    });
  }

  // Zone Manager permissions
  for (const permission of rbacManagerialPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: zoneManagerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: zoneManagerRole.id, permissionId: permission.id }
    });
  }

  // Create organizational units for RBAC scoping
  console.log('Creating organizational units...');
  const orgUnits = [
    {
      name: 'Corporate HQ',
      type: 'PMO'
    },
    {
      name: 'North Region',
      type: 'AREA'
    },
    {
      name: 'South Region',
      type: 'AREA'
    },
    {
      name: 'Metro Project',
      type: 'PROJECT'
    },
    {
      name: 'Downtown Zone',
      type: 'ZONE'
    },
    {
      name: 'North District Zone',
      type: 'ZONE'
    }
  ];

  const createdOrgUnits = [];
  for (const orgUnit of orgUnits) {
    let createdOrgUnit = await prisma.orgUnit.findFirst({
      where: { name: orgUnit.name }
    });
    
    if (!createdOrgUnit) {
      createdOrgUnit = await prisma.orgUnit.create({
        data: orgUnit
      });
    }
    createdOrgUnits.push(createdOrgUnit);
  }

  // Set up organizational hierarchy
  await prisma.orgUnit.update({
    where: { id: createdOrgUnits[1].id }, // North Region
    data: { parentId: createdOrgUnits[0].id } // Corporate HQ
  });

  await prisma.orgUnit.update({
    where: { id: createdOrgUnits[2].id }, // South Region
    data: { parentId: createdOrgUnits[0].id } // Corporate HQ
  });

  await prisma.orgUnit.update({
    where: { id: createdOrgUnits[3].id }, // Metro Area
    data: { parentId: createdOrgUnits[1].id } // North Region
  });

  await prisma.orgUnit.update({
    where: { id: createdOrgUnits[4].id }, // Downtown Zone
    data: { parentId: createdOrgUnits[3].id } // Metro Area
  });

  await prisma.orgUnit.update({
    where: { id: createdOrgUnits[5].id }, // North District Zone
    data: { parentId: createdOrgUnits[3].id } // Metro Area
  });

  // Create sites
  console.log('Creating sites...');
  const sites = [
    {
      name: 'Downtown Construction Project',
      location: 'Downtown',
      description: 'Major downtown construction project',
      orgUnitId: createdOrgUnits[4].id // Downtown Zone
    },
    {
      name: 'Residential Complex Phase 1',
      location: 'North District',
      description: 'Residential complex development',
      orgUnitId: createdOrgUnits[5].id // North District Zone
    },
    {
      name: 'Commercial Plaza Development',
      location: 'Business District',
      description: 'Commercial plaza construction',
      orgUnitId: createdOrgUnits[4].id // Downtown Zone
    },
    {
      name: 'Highway Bridge Construction',
      location: 'Highway 101',
      description: 'Bridge construction project',
      orgUnitId: createdOrgUnits[5].id // North District Zone
    }
  ];

  const createdSites = [];
  for (const site of sites) {
    // Check if site already exists
    let createdSite = await prisma.site.findFirst({
      where: { name: site.name }
    });
    
    if (!createdSite) {
      createdSite = await prisma.site.create({
        data: site
      });
    }
    createdSites.push(createdSite);
  }

  // Create demo users
  console.log('Creating demo users...');
  
  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin', 10),
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT',
      position: 'System Administrator',
      role: 'ADMIN',
      orgUnitId: createdOrgUnits[0].id, // Corporate HQ
      isActive: true,
      roles: {
        create: {
          roleId: superAdminRole.id
        }
      }
    }
  });

  // Manager user
  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@example.com',
      passwordHash: await bcrypt.hash('password', 10),
      firstName: 'Project',
      lastName: 'Manager',
      department: 'Management',
      position: 'Project Manager',
      role: 'PROJECT_MANAGER',
      orgUnitId: createdOrgUnits[3].id, // Metro Project
      isActive: true,
      roles: {
        create: {
          roleId: projectManagerRole.id
        }
      }
    }
  });

  // Regular user
  const regularUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('password', 10),
      firstName: 'Regular',
      lastName: 'User',
      department: 'Construction',
      position: 'Construction Worker',
      role: 'SITE_ENGINEER',
      orgUnitId: createdOrgUnits[4].id, // Downtown Zone
      isActive: true,
      roles: {
        create: {
          roleId: employeeRole.id
        }
      }
    }
  });

  // HR user
  const hrUser = await prisma.user.upsert({
    where: { username: 'hr' },
    update: {},
    create: {
      username: 'hr',
      email: 'hr@example.com',
      passwordHash: await bcrypt.hash('password', 10),
      firstName: 'Human',
      lastName: 'Resources',
      department: 'HR',
      position: 'HR Manager',
      role: 'VIEWER',
      orgUnitId: createdOrgUnits[0].id, // Corporate HQ
      isActive: true,
      roles: {
        create: {
          roleId: hrRole.id
        }
      }
    }
  });

  // Create site access for users
  console.log('Creating site access...');
  
  // Manager site access
  let managerSiteAccess = await prisma.userSiteAccess.findFirst({
    where: {
      userId: managerUser.id,
      siteId: createdSites[0].id
    }
  });
  
  if (!managerSiteAccess) {
    managerSiteAccess = await prisma.userSiteAccess.create({
      data: {
        userId: managerUser.id,
        siteId: createdSites[0].id
      }
    });
  }

  // Create permissions for manager site access
  const managerSitePermissions = [
    { module: 'overview', actions: ['view'] },
    { module: 'employees', actions: ['view', 'edit', 'manage_team'] },
    { module: 'expenses', actions: ['view', 'create', 'approve'] },
    { module: 'progress', actions: ['view', 'edit'] },
    { module: 'documents', actions: ['view', 'create'] }
  ];

  for (const perm of managerSitePermissions) {
    await prisma.userSitePermission.upsert({
      where: {
        userSiteAccessId_module: {
          userSiteAccessId: managerSiteAccess.id,
          module: perm.module
        }
      },
      update: {
        actions: JSON.stringify(perm.actions)
      },
      create: {
        userSiteAccessId: managerSiteAccess.id,
        module: perm.module,
        actions: JSON.stringify(perm.actions)
      }
    });
  }

  // Regular user site access
  let userSiteAccess = await prisma.userSiteAccess.findFirst({
    where: {
      userId: regularUser.id,
      siteId: createdSites[0].id
    }
  });
  
  if (!userSiteAccess) {
    userSiteAccess = await prisma.userSiteAccess.create({
      data: {
        userId: regularUser.id,
        siteId: createdSites[0].id
      }
    });
  }

  // Create permissions for regular user site access
  const userSitePermissions = [
    { module: 'overview', actions: ['view'] },
    { module: 'expenses', actions: ['view', 'create'] },
    { module: 'documents', actions: ['view'] }
  ];

  for (const perm of userSitePermissions) {
    await prisma.userSitePermission.upsert({
      where: {
        userSiteAccessId_module: {
          userSiteAccessId: userSiteAccess.id,
          module: perm.module
        }
      },
      update: {
        actions: JSON.stringify(perm.actions)
      },
      create: {
        userSiteAccessId: userSiteAccess.id,
        module: perm.module,
        actions: JSON.stringify(perm.actions)
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('Demo users created:');
  console.log('  - admin@example.com (password: admin)');
  console.log('  - manager@example.com (password: password)');
  console.log('  - user@example.com (password: password)');
  console.log('  - hr@example.com (password: password)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
