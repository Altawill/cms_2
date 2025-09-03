import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Role capability matrix with approval thresholds
const ROLE_CAPABILITIES = {
  PMO: {
    approvalThresholds: { min: 0, max: Infinity },
    canApprove: ['expense', 'task', 'safeTransaction', 'payrollRun'],
    level: 4
  },
  AREA_MANAGER: {
    approvalThresholds: { min: 5000, max: 20000 },
    canApprove: ['expense', 'task', 'safeTransaction', 'payrollRun'],
    level: 3
  },
  PROJECT_MANAGER: {
    approvalThresholds: { min: 1000, max: 5000 },
    canApprove: ['expense', 'task', 'safeTransaction', 'payrollRun'],
    level: 2
  },
  ZONE_MANAGER: {
    approvalThresholds: { min: 0, max: 1000 },
    canApprove: ['expense', 'task', 'safeTransaction'],
    level: 1
  },
  SITE_ENGINEER: {
    approvalThresholds: { min: 0, max: 0 },
    canApprove: [],
    level: 0
  }
};

/**
 * Approval Workflow Service
 */
export const approvalWorkflow = {
  
  /**
   * Get role capabilities
   * @param {string} role 
   * @returns {object} Role capabilities
   */
  getRoleCapabilities(role) {
    return ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES.SITE_ENGINEER;
  },

  /**
   * Create approval workflow for an entity
   * @param {string} entityType - expense, task, safeTransaction, payrollRun
   * @param {string} entityId - ID of entity
   * @param {string} requestedBy - User ID who requested approval
   * @param {string} orgUnitId - Organizational scope
   * @param {number} amount - Amount for approval (if applicable)
   * @param {object} metadata - Additional context
   * @returns {Promise<object>} Created workflow
   */
  async createWorkflow(entityType, entityId, requestedBy, orgUnitId, amount = null, metadata = {}) {
    try {
      // Determine approval chain based on amount and entity type
      const approvalChain = await this.computeApprovalChain(amount, entityType, orgUnitId);
      
      if (approvalChain.length === 0) {
        // No approval needed
        return { success: true, requiresApproval: false };
      }

      // Create workflow
      const workflow = await prisma.approvalWorkflow.create({
        data: {
          entityType,
          entityId,
          requestedBy,
          orgUnitId,
          amount,
          currentApprover: approvalChain[0].role,
          approvalChain: JSON.stringify(approvalChain),
          metadata: JSON.stringify(metadata),
          steps: {
            create: approvalChain.map((step, index) => ({
              role: step.role,
              order: index + 1,
              requiredThreshold: step.threshold,
              status: index === 0 ? 'PENDING' : 'PENDING'
            }))
          }
        },
        include: {
          steps: true,
          orgUnit: true
        }
      });

      return { 
        success: true, 
        requiresApproval: true, 
        workflow,
        nextApprover: approvalChain[0].role
      };

    } catch (error) {
      console.error('Error creating approval workflow:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Process approval (approve/reject)
   * @param {string} workflowId 
   * @param {boolean} approved 
   * @param {string} approverId 
   * @param {string} remark 
   * @returns {Promise<object>} Processing result
   */
  async processApproval(workflowId, approved, approverId, remark = null) {
    try {
      const workflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: { 
          steps: { orderBy: { order: 'asc' } },
          orgUnit: true
        }
      });

      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      if (workflow.status !== 'PENDING') {
        return { success: false, error: 'Workflow already processed' };
      }

      // Find current pending step
      const currentStep = workflow.steps.find(step => step.status === 'PENDING');
      if (!currentStep) {
        return { success: false, error: 'No pending approval step found' };
      }

      // Update current step
      const stepStatus = approved ? 'APPROVED' : 'REJECTED';
      await prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status: stepStatus,
          approvedBy: approverId,
          approvedAt: new Date(),
          remark
        }
      });

      let workflowStatus = 'PENDING';
      let currentApprover = workflow.currentApprover;

      if (!approved) {
        // Rejected - workflow is complete
        workflowStatus = 'REJECTED';
        currentApprover = null;
        
        // Update entity status
        await this.updateEntityStatus(workflow.entityType, workflow.entityId, 'REJECTED');
      } else {
        // Approved - check if there are more steps
        const nextStep = workflow.steps.find(step => 
          step.order > currentStep.order && step.status === 'PENDING'
        );

        if (nextStep) {
          // More approvals needed
          currentApprover = nextStep.role;
        } else {
          // All approvals complete
          workflowStatus = 'APPROVED';
          currentApprover = null;
          
          // Update entity status
          await this.updateEntityStatus(workflow.entityType, workflow.entityId, 'APPROVED');
        }
      }

      // Update workflow
      const updatedWorkflow = await prisma.approvalWorkflow.update({
        where: { id: workflowId },
        data: {
          status: workflowStatus,
          currentApprover,
          completedAt: workflowStatus !== 'PENDING' ? new Date() : null
        },
        include: {
          steps: {
            include: { 
              approver: { 
                select: { firstName: true, lastName: true, role: true } 
              } 
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      // Create notifications for approval events
      await this.createApprovalNotifications(workflowId, stepStatus, approverId);

      return { 
        success: true, 
        workflow: updatedWorkflow,
        finalStatus: workflowStatus,
        nextApprover: currentApprover
      };

    } catch (error) {
      console.error('Error processing approval:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Compute approval chain based on amount and entity type
   * @param {number} amount 
   * @param {string} entityType 
   * @param {string} orgUnitId 
   * @returns {Promise<Array>} Approval chain
   */
  async computeApprovalChain(amount, entityType, orgUnitId) {
    const chain = [];

    // For expense approvals, use amount-based thresholds
    if (entityType === 'expense' && amount > 0) {
      if (amount > 20000) {
        // PMO approval required
        chain.push({ role: 'PMO', threshold: amount });
      } else if (amount > 5000) {
        // Area Manager approval
        chain.push({ role: 'AREA_MANAGER', threshold: amount });
      } else if (amount > 1000) {
        // Project Manager approval
        chain.push({ role: 'PROJECT_MANAGER', threshold: amount });
      } else {
        // Zone Manager approval
        chain.push({ role: 'ZONE_MANAGER', threshold: amount });
      }
    }

    // For task approvals, use hierarchical approval
    else if (entityType === 'task') {
      // Tasks typically need zone manager approval
      chain.push({ role: 'ZONE_MANAGER', threshold: null });
    }

    // For safe transactions, use amount-based thresholds
    else if (entityType === 'safeTransaction' && amount > 0) {
      if (amount > 10000) {
        chain.push({ role: 'PROJECT_MANAGER', threshold: amount });
      } else if (amount > 2000) {
        chain.push({ role: 'ZONE_MANAGER', threshold: amount });
      }
    }

    // For payroll runs, always require project manager approval
    else if (entityType === 'payrollRun') {
      chain.push({ role: 'PROJECT_MANAGER', threshold: null });
    }

    return chain;
  },

  /**
   * Update entity status after approval/rejection
   * @param {string} entityType 
   * @param {string} entityId 
   * @param {string} status 
   */
  async updateEntityStatus(entityType, entityId, status) {
    try {
      const statusField = entityType === 'expense' ? 'status' : 
                         entityType === 'task' ? 'approvalStatus' :
                         entityType === 'safeTransaction' ? 'status' :
                         entityType === 'payrollRun' ? 'status' : 'status';

      switch (entityType) {
        case 'expense':
          await prisma.expense.update({
            where: { id: entityId },
            data: { 
              [statusField]: status,
              approvedAt: status === 'APPROVED' ? new Date() : null
            }
          });
          break;
        
        case 'task':
          await prisma.task.update({
            where: { id: entityId },
            data: { 
              [statusField]: status,
              approvedAt: status === 'APPROVED' ? new Date() : null
            }
          });
          break;
        
        case 'safeTransaction':
          await prisma.safeTransaction.update({
            where: { id: entityId },
            data: { 
              [statusField]: status,
              approvedAt: status === 'APPROVED' ? new Date() : null
            }
          });
          break;
        
        case 'payrollRun':
          await prisma.payrollRun.update({
            where: { id: entityId },
            data: { 
              [statusField]: status === 'APPROVED' ? 'APPROVED' : 
                            status === 'REJECTED' ? 'CANCELLED' : status
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error updating entity status:', error);
    }
  },

  /**
   * Create notifications for approval events
   * @param {string} workflowId 
   * @param {string} action 
   * @param {string} userId 
   */
  async createApprovalNotifications(workflowId, action, userId) {
    try {
      const workflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: { orgUnit: true }
      });

      if (!workflow) return;

      const notificationType = action === 'APPROVED' ? 'APPROVED' : 
                              action === 'REJECTED' ? 'REJECTED' : 'APPROVAL_REQUIRED';

      // Notify the requester
      if (action !== 'PENDING') {
        await prisma.notification.create({
          data: {
            userId: workflow.requestedBy,
            type: notificationType,
            title: `${workflow.entityType} ${action.toLowerCase()}`,
            message: `Your ${workflow.entityType} request has been ${action.toLowerCase()}`,
            entityType: workflow.entityType,
            entityId: workflow.entityId
          }
        });
      }

      // Notify next approver if workflow is still pending
      if (workflow.currentApprover && workflow.status === 'PENDING') {
        // Find users with the approver role in the same org scope
        const approvers = await prisma.user.findMany({
          where: {
            role: workflow.currentApprover,
            orgUnitId: workflow.orgUnitId,
            isActive: true
          },
          select: { id: true }
        });

        for (const approver of approvers) {
          await prisma.notification.create({
            data: {
              userId: approver.id,
              type: 'APPROVAL_REQUIRED',
              title: `Approval Required: ${workflow.entityType}`,
              message: `A ${workflow.entityType} requires your approval`,
              entityType: workflow.entityType,
              entityId: workflow.entityId
            }
          });
        }
      }
    } catch (error) {
      console.error('Error creating approval notifications:', error);
    }
  },

  /**
   * Get pending approvals for a role and org scope
   * @param {string} role 
   * @param {Array<string>} scopeOrgUnitIds 
   * @returns {Promise<Array>} Pending approvals
   */
  async getPendingApprovalsForUser(role, scopeOrgUnitIds) {
    try {
      return await prisma.approvalWorkflow.findMany({
        where: {
          status: 'PENDING',
          currentApprover: role,
          orgUnitId: { in: scopeOrgUnitIds }
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
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  },

  /**
   * Get approval history for an entity
   * @param {string} entityType 
   * @param {string} entityId 
   * @returns {Promise<Array>} Approval history
   */
  async getApprovalHistory(entityType, entityId) {
    try {
      return await prisma.approvalWorkflow.findMany({
        where: { entityType, entityId },
        include: {
          steps: {
            include: {
              approver: {
                select: {
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
    } catch (error) {
      console.error('Error getting approval history:', error);
      return [];
    }
  }
};

export default approvalWorkflow;
