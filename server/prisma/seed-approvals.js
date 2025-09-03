import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables from the project root
const path = process.cwd().includes('server') ? '../.env' : '.env';
dotenv.config({ path });

const prisma = new PrismaClient();

async function seedApprovalWorkflowData() {
  console.log('🌱 Seeding approval workflow test data...');

  try {
    // First, get existing org units
    const pmoUnit = await prisma.orgUnit.findFirst({ where: { type: 'PMO' } });
    const areaUnit = await prisma.orgUnit.findFirst({ where: { type: 'AREA', name: 'North Region' } });
    const projectUnit = await prisma.orgUnit.findFirst({ where: { type: 'PROJECT', name: 'Metro Project' } });
    const zoneUnit = await prisma.orgUnit.findFirst({ where: { type: 'ZONE', name: 'Downtown Zone' } });

    if (!pmoUnit || !areaUnit || !projectUnit || !zoneUnit) {
      throw new Error('Required organizational units not found. Please run main seed first.');
    }

    // Create test users with different roles
    const testUsers = [
      {
        username: 'ahmed.pmo',
        email: 'ahmed.pmo@company.com',
        firstName: 'Ahmed',
        lastName: 'Al-Mansouri',
        role: 'PMO',
        orgUnitId: pmoUnit.id,
        position: 'PMO Director',
        department: 'Project Management Office'
      },
      {
        username: 'sara.area',
        email: 'sara.area@company.com',
        firstName: 'Sara',
        lastName: 'Al-Zahra',
        role: 'AREA_MANAGER',
        orgUnitId: areaUnit.id,
        position: 'North Area Manager',
        department: 'Operations'
      },
      {
        username: 'omar.project',
        email: 'omar.project@company.com',
        firstName: 'Omar',
        lastName: 'Ben-Ali',
        role: 'PROJECT_MANAGER',
        orgUnitId: projectUnit.id,
        position: 'Metro Project Manager',
        department: 'Construction'
      },
      {
        username: 'fatima.zone',
        email: 'fatima.zone@company.com',
        firstName: 'Fatima',
        lastName: 'Al-Kindi',
        role: 'ZONE_MANAGER',
        orgUnitId: zoneUnit.id,
        position: 'Downtown Zone Manager',
        department: 'Field Operations'
      },
      {
        username: 'khalid.engineer',
        email: 'khalid.engineer@company.com',
        firstName: 'Khalid',
        lastName: 'Al-Rashid',
        role: 'SITE_ENGINEER',
        orgUnitId: zoneUnit.id,
        position: 'Senior Site Engineer',
        department: 'Engineering'
      }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);
    
    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            ...userData,
            passwordHash
          }
        });
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      }
    }

    // Get the created users
    const pmoUser = await prisma.user.findUnique({ where: { username: 'ahmed.pmo' } });
    const areaUser = await prisma.user.findUnique({ where: { username: 'sara.area' } });
    const projectUser = await prisma.user.findUnique({ where: { username: 'omar.project' } });
    const zoneUser = await prisma.user.findUnique({ where: { username: 'fatima.zone' } });
    const engineerUser = await prisma.user.findUnique({ where: { username: 'khalid.engineer' } });

    // Get existing site or create one
    let testSite = await prisma.site.findFirst({ where: { orgUnitId: zoneUnit.id } });
    if (!testSite) {
      testSite = await prisma.site.create({
        data: {
          name: 'Test Construction Site',
          code: 'TCS-001',
          location: 'Tripoli North District',
          description: 'Test site for approval workflow demonstrations',
          status: 'ACTIVE',
          progress: 25.5,
          priority: 'HIGH',
          budget: 150000,
          spent: 37500,
          startDate: new Date('2024-01-15'),
          targetDate: new Date('2024-12-15'),
          orgUnitId: zoneUnit.id,
          region: 'West'
        }
      });
      console.log(`✅ Created test site: ${testSite.name}`);
    }

    // Create sample expenses with different amounts to trigger various approval chains
    const sampleExpenses = [
      {
        itemName: 'Office Supplies',
        supplier: 'Office Depot Libya',
        category: 'OFFICE_SUPPLIES',
        qty: 1,
        unitPrice: 250,
        total: 250,
        date: new Date(),
        requestedBy: engineerUser.id,
        orgUnitId: zoneUnit.id,
        siteId: testSite.id
      },
      {
        itemName: 'Construction Materials - Cement',
        supplier: 'Libya Building Materials',
        category: 'MATERIALS',
        qty: 50,
        unitPrice: 45,
        total: 2250,
        date: new Date(),
        requestedBy: engineerUser.id,
        orgUnitId: zoneUnit.id,
        siteId: testSite.id
      },
      {
        itemName: 'Heavy Equipment Rental',
        supplier: 'Al-Mansour Equipment',
        category: 'EQUIPMENT',
        qty: 1,
        unitPrice: 8500,
        total: 8500,
        date: new Date(),
        requestedBy: zoneUser.id,
        orgUnitId: zoneUnit.id,
        siteId: testSite.id
      },
      {
        itemName: 'Specialized Consultancy Services',
        supplier: 'Engineering Consultants Ltd',
        category: 'SERVICES',
        qty: 1,
        unitPrice: 25000,
        total: 25000,
        date: new Date(),
        requestedBy: projectUser.id,
        orgUnitId: projectUnit.id,
        siteId: testSite.id
      }
    ];

    for (const expenseData of sampleExpenses) {
      const expense = await prisma.expense.create({
        data: {
          ...expenseData,
          createdBy: expenseData.requestedBy
        }
      });
      console.log(`✅ Created expense: ${expense.itemName} (${expense.total} LYD)`);

      // Create approval workflow for the expense
      const { approvalWorkflow } = await import('../lib/rbac/approval-workflow.js');
      const workflowResult = await approvalWorkflow.createWorkflow(
        'expense',
        expense.id,
        expenseData.requestedBy,
        expenseData.orgUnitId,
        expense.total,
        { description: expense.itemName }
      );

      if (workflowResult.success && workflowResult.requiresApproval) {
        console.log(`✅ Created approval workflow for expense: ${expense.itemName}`);
        console.log(`   Next approver: ${workflowResult.nextApprover}`);
      }
    }

    // Create sample tasks
    const sampleTasks = [
      {
        code: 'TASK-001',
        name: 'Foundation Inspection',
        description: 'Inspect foundation concrete pouring and curing process',
        category: 'CIVIL',
        status: 'PLANNED',
        progress: 0,
        priority: 'HIGH',
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Block A Foundation',
        manpower: 3,
        budgetAmount: 1200,
        requestedBy: engineerUser.id,
        createdBy: engineerUser.id,
        siteId: testSite.id,
        orgUnitId: zoneUnit.id
      },
      {
        code: 'TASK-002',
        name: 'MEP Installation Planning',
        description: 'Plan mechanical, electrical, and plumbing installations for Phase 1',
        category: 'MEP',
        status: 'PLANNED',
        progress: 0,
        priority: 'MEDIUM',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        expectedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: 'Phase 1 Buildings',
        manpower: 5,
        budgetAmount: 800,
        requestedBy: zoneUser.id,
        createdBy: zoneUser.id,
        siteId: testSite.id,
        orgUnitId: zoneUnit.id
      }
    ];

    for (const taskData of sampleTasks) {
      const task = await prisma.task.create({
        data: taskData
      });
      console.log(`✅ Created task: ${task.name}`);

      // Create approval workflow for the task
      const { approvalWorkflow } = await import('../lib/rbac/approval-workflow.js');
      const workflowResult = await approvalWorkflow.createWorkflow(
        'task',
        task.id,
        taskData.requestedBy,
        taskData.orgUnitId,
        null, // Tasks don't have amounts
        { taskName: task.name, category: task.category }
      );

      if (workflowResult.success && workflowResult.requiresApproval) {
        console.log(`✅ Created approval workflow for task: ${task.name}`);
        console.log(`   Next approver: ${workflowResult.nextApprover}`);
      }
    }

    // Create some sample notifications
    const notifications = [
      {
        userId: zoneUser.id,
        type: 'APPROVAL_REQUIRED',
        title: 'Expense Approval Required',
        message: 'Office Supplies expense (250 LYD) requires your approval',
        entityType: 'expense',
        entityId: (await prisma.expense.findFirst({ where: { itemName: 'Office Supplies' } }))?.id
      },
      {
        userId: projectUser.id,
        type: 'APPROVAL_REQUIRED',
        title: 'Expense Approval Required',
        message: 'Construction Materials expense (2,250 LYD) requires your approval',
        entityType: 'expense',
        entityId: (await prisma.expense.findFirst({ where: { itemName: 'Construction Materials - Cement' } }))?.id
      },
      {
        userId: engineerUser.id,
        type: 'APPROVED',
        title: 'Task Approved',
        message: 'Your task "Foundation Inspection" has been approved',
        entityType: 'task',
        entityId: (await prisma.task.findFirst({ where: { name: 'Foundation Inspection' } }))?.id
      }
    ];

    for (const notifData of notifications) {
      if (notifData.entityId) {
        await prisma.notification.create({
          data: notifData
        });
        console.log(`✅ Created notification: ${notifData.title}`);
      }
    }

    console.log('\n🎉 Approval workflow seed data created successfully!');
    console.log('\nTest Users Created:');
    console.log('  ahmed.pmo / password123 (PMO)');
    console.log('  sara.area / password123 (Area Manager)');
    console.log('  omar.project / password123 (Project Manager)');
    console.log('  fatima.zone / password123 (Zone Manager)');
    console.log('  khalid.engineer / password123 (Site Engineer)');
    console.log('\nYou can now test the approval workflows with these users!');

  } catch (error) {
    console.error('❌ Error seeding approval workflow data:', error);
    throw error;
  }
}

// Run the seed function
seedApprovalWorkflowData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedApprovalWorkflowData };
