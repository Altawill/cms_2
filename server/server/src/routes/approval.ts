import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { enforceRBACWithScope } from '../lib/rbac/middleware';
import { approvalWorkflow } from '../lib/rbac/approval-workflow';

const router = Router();
const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
  userScopeOrgUnitIds?: string[];
}

// Get pending approvals for the current user
router.get('/pending', 
  authenticateToken, 
  enforceRBACWithScope('approval', 'read'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const userRole = req.user.role;
      const userScopeIds = req.userScopeOrgUnitIds || [];
      
      // Find workflows where current user can approve
      const pendingWorkflows = await prisma.approvalWorkflow.findMany({
        where: {
          status: 'PENDING',
          currentApprover: userRole,
          orgUnitId: { in: userScopeIds }
        },
        include: {
          steps: {
            where: { status: 'PENDING' },
            orderBy: { order: 'asc' }
          },
          orgUnit: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Enrich with entity details
      const enrichedWorkflows = await Promise.all(
        pendingWorkflows.map(async (workflow) => {
          let entity = null;
          
          try {
            switch (workflow.entityType) {
              case 'expense':
                entity = await prisma.expense.findUnique({
                  where: { id: workflow.entityId },
                  include: { site: true }
                });
                break;
              case 'task':
                entity = await prisma.task.findUnique({
                  where: { id: workflow.entityId },
                  include: { site: true }
                });
                break;
              case 'safeTransaction':
                entity = await prisma.safeTransaction.findUnique({
                  where: { id: workflow.entityId },
                  include: { safe: true }
                });
                break;
              case 'payrollRun':
                entity = await prisma.payrollRun.findUnique({
                  where: { id: workflow.entityId },
                  include: { site: true }
                });
                break;
            }
          } catch (error) {
            console.error(`Error fetching entity ${workflow.entityType}:${workflow.entityId}:`, error);
          }

          return {
            ...workflow,
            entity
          };
        })
      );

      res.json(enrichedWorkflows);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
  }
);

// Get approval history for an entity
router.get('/history/:entityType/:entityId',
  authenticateToken,
  enforceRBACWithScope('approval', 'read'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const userScopeIds = req.userScopeOrgUnitIds || [];

      const workflows = await prisma.approvalWorkflow.findMany({
        where: {
          entityType,
          entityId,
          orgUnitId: { in: userScopeIds }
        },
        include: {
          steps: {
            include: {
              approver: {
                select: { 
                  id: true, 
                  firstName: true, 
                  lastName: true, 
                  role: true 
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          orgUnit: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(workflows);
    } catch (error) {
      console.error('Error fetching approval history:', error);
      res.status(500).json({ error: 'Failed to fetch approval history' });
    }
  }
);

// Process an approval (approve/reject)
router.post('/process/:workflowId',
  authenticateToken,
  enforceRBACWithScope('approval', 'update'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const { workflowId } = req.params;
      const { action, remark } = req.body; // action: 'APPROVE' | 'REJECT'
      const userId = req.user.id;
      const userRole = req.user.role;
      const userScopeIds = req.userScopeOrgUnitIds || [];

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be APPROVE or REJECT' });
      }

      // Verify workflow exists and user has permission
      const workflow = await prisma.approvalWorkflow.findFirst({
        where: {
          id: workflowId,
          status: 'PENDING',
          currentApprover: userRole,
          orgUnitId: { in: userScopeIds }
        },
        include: {
          steps: {
            where: { status: 'PENDING' },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found or not authorized' });
      }

      // Process the approval using the workflow service
      const result = await approvalWorkflow.processApproval(
        workflowId,
        action === 'APPROVE',
        userId,
        remark
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Error processing approval:', error);
      res.status(500).json({ error: 'Failed to process approval' });
    }
  }
);

// Get approval metrics/dashboard data
router.get('/metrics',
  authenticateToken,
  enforceRBACWithScope('approval', 'read'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const userScopeIds = req.userScopeOrgUnitIds || [];
      const userRole = req.user.role;

      // Get counts for different statuses
      const [pending, approved, rejected] = await Promise.all([
        prisma.approvalWorkflow.count({
          where: {
            status: 'PENDING',
            currentApprover: userRole,
            orgUnitId: { in: userScopeIds }
          }
        }),
        prisma.approvalWorkflow.count({
          where: {
            status: 'APPROVED',
            orgUnitId: { in: userScopeIds }
          }
        }),
        prisma.approvalWorkflow.count({
          where: {
            status: 'REJECTED',
            orgUnitId: { in: userScopeIds }
          }
        })
      ]);

      // Get recent activity
      const recentActivity = await prisma.approvalStep.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          workflow: {
            orgUnitId: { in: userScopeIds }
          }
        },
        include: {
          workflow: {
            include: {
              orgUnit: true
            }
          },
          approver: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { approvedAt: 'desc' },
        take: 10
      });

      // Get amount-based metrics
      const amountMetrics = await prisma.approvalWorkflow.groupBy({
        by: ['status'],
        where: {
          orgUnitId: { in: userScopeIds },
          amount: { not: null }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      res.json({
        counts: { pending, approved, rejected },
        recentActivity,
        amountMetrics
      });
    } catch (error) {
      console.error('Error fetching approval metrics:', error);
      res.status(500).json({ error: 'Failed to fetch approval metrics' });
    }
  }
);

// Get user's approval scope and permissions
router.get('/scope',
  authenticateToken,
  async (req: RequestWithUser, res: Response) => {
    try {
      const userRole = req.user.role;
      const userScopeIds = req.userScopeOrgUnitIds || [];
      
      // Get role capabilities
      const { approvalThresholds } = approvalWorkflow.getRoleCapabilities(userRole);

      // Get organizational units in user's scope
      const orgUnits = await prisma.orgUnit.findMany({
        where: { id: { in: userScopeIds } },
        select: {
          id: true,
          type: true,
          name: true,
          code: true
        }
      });

      res.json({
        role: userRole,
        approvalThresholds,
        scopeOrgUnits: orgUnits
      });
    } catch (error) {
      console.error('Error fetching approval scope:', error);
      res.status(500).json({ error: 'Failed to fetch approval scope' });
    }
  }
);

export default router;
