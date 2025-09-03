import { PrismaClient } from '@prisma/client';
import { ROLES, APPROVAL_THRESHOLDS, getNextApprover, createAuditLog } from './rbac.js';

const prisma = new PrismaClient();

/**
 * Approval workflow service for managing approval chains
 */
export class ApprovalWorkflow {
  
  /**
   * Create a new approval request
   * @param {Object} params - Approval parameters
   * @returns {Object} Created approval record
   */
  static async createApproval({ 
    entityType, 
    entityId, 
    requestedBy, 
    amount, 
    orgUnitId, 
    metadata = {} 
  }) {
    try {
      // Determine the approval chain based on amount and entity type
      const approvalChain = await this.buildApprovalChain(amount, orgUnitId, entityType);
      
      // Get the first approver in the chain
      const currentApprover = approvalChain.length > 0 ? approvalChain[0].role : null;
      
      // Create the main approval record
      const approval = await prisma.approvalWorkflow.create({
        data: {
          entityType,
          entityId,
          requestedBy,
          currentApprover,
          amount,
          orgUnitId,
          status: 'PENDING',
          approvalChain: JSON.stringify(approvalChain),
          metadata: JSON.stringify(metadata)
        }
      });
      
      // Create approval steps
      for (let i = 0; i < approvalChain.length; i++) {
        await prisma.approvalStep.create({
          data: {
            approvalWorkflowId: approval.id,
            role: approvalChain[i].role,
            order: i + 1,
            status: 'PENDING',
            requiredThreshold: approvalChain[i].threshold
          }
        });
      }
      
      // Create audit log
      await createAuditLog(
        'ApprovalWorkflow',
        approval.id,
        'CREATE',
        requestedBy,
        null,
        approval,
        { entityType, entityId, amount, approvalChain }
      );
      
      // Send notification to first approver
      await this.sendApprovalNotification(approval.id, currentApprover, 'NEW_APPROVAL');
      
      return approval;
      
    } catch (error) {
      console.error('Error creating approval:', error);
      throw new Error('Failed to create approval workflow');
    }
  }
  
  /**
   * Process approval action (approve/reject)
   * @param {string} approvalId - Approval workflow ID
   * @param {string} userId - User performing the action
   * @param {string} action - 'APPROVE' or 'REJECT'
   * @param {string} remark - Optional remark
   * @returns {Object} Updated approval record
   */
  static async processApproval(approvalId, userId, action, remark = null) {
    try {
      // Get the current approval with steps
      const approval = await prisma.approvalWorkflow.findUnique({
        where: { id: approvalId },
        include: { 
          steps: { orderBy: { order: 'asc' } },
          entity: true // This would need to be implemented based on entity type
        }
      });
      
      if (!approval) {
        throw new Error('Approval workflow not found');
      }
      
      if (approval.status !== 'PENDING') {
        throw new Error('Approval workflow is not in pending state');
      }
      
      // Get user details to verify they can perform this approval
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, orgUnitId: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify user has permission to approve this request
      if (user.role !== approval.currentApprover) {
        throw new Error('User does not have permission to approve this request');
      }
      
      // Verify approval threshold if it's an approval action
      if (action === 'APPROVE' && approval.amount) {
        const canApprove = this.canUserApprove(user.role, approval.amount);
        if (!canApprove) {
          throw new Error(`User cannot approve amounts above ${APPROVAL_THRESHOLDS[this.getRoleLevel(user.role)]} LYD`);
        }
      }
      
      // Find current step
      const currentStep = approval.steps.find(step => 
        step.role === approval.currentApprover && step.status === 'PENDING'
      );
      
      if (!currentStep) {
        throw new Error('Current approval step not found');
      }
      
      // Update the current step
      await prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          approvedBy: userId,
          approvedAt: new Date(),
          remark
        }
      });
      
      let finalStatus = 'PENDING';
      let nextApprover = null;
      
      if (action === 'REJECT') {
        // If rejected, workflow ends
        finalStatus = 'REJECTED';
      } else {
        // Check if there are more steps needed
        const nextStep = approval.steps.find(step => 
          step.order > currentStep.order && step.status === 'PENDING'
        );
        
        if (nextStep) {
          // Move to next approver
          nextApprover = nextStep.role;
          finalStatus = 'PENDING';
        } else {
          // No more steps, workflow is approved
          finalStatus = 'APPROVED';
        }
      }
      
      // Update the main approval record
      const updatedApproval = await prisma.approvalWorkflow.update({
        where: { id: approvalId },
        data: {
          status: finalStatus,
          currentApprover: nextApprover,
          completedAt: finalStatus !== 'PENDING' ? new Date() : null
        },
        include: { steps: { orderBy: { order: 'asc' } } }
      });
      
      // Create audit log
      await createAuditLog(
        'ApprovalWorkflow',
        approvalId,
        action,
        userId,
        approval,
        updatedApproval,
        { step: currentStep.order, remark }
      );
      
      // Update the original entity based on final status
      if (finalStatus === 'APPROVED') {
        await this.updateEntityApprovalStatus(approval.entityType, approval.entityId, 'APPROVED', userId);
      } else if (finalStatus === 'REJECTED') {
        await this.updateEntityApprovalStatus(approval.entityType, approval.entityId, 'REJECTED', userId);
      }
      
      // Send notifications
      if (finalStatus === 'PENDING' && nextApprover) {
        await this.sendApprovalNotification(approvalId, nextApprover, 'APPROVAL_REQUIRED');
      } else if (finalStatus === 'APPROVED') {
        await this.sendApprovalNotification(approvalId, approval.requestedBy, 'APPROVED');
      } else if (finalStatus === 'REJECTED') {
        await this.sendApprovalNotification(approvalId, approval.requestedBy, 'REJECTED');
      }
      
      return updatedApproval;
      
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }
  
  /**
   * Build approval chain based on amount and organizational context
   * @param {number} amount - Amount to be approved
   * @param {string} orgUnitId - Organizational unit context
   * @param {string} entityType - Type of entity being approved
   * @returns {Array} Array of approval steps
   */
  static async buildApprovalChain(amount, orgUnitId, entityType) {
    const chain = [];
    
    // Get organizational context
    const orgUnit = await prisma.orgUnit.findUnique({
      where: { id: orgUnitId },
      include: { parent: true }
    });
    
    if (!orgUnit) {
      throw new Error('Organizational unit not found');
    }
    
    // Determine required approval levels based on amount
    if (amount <= APPROVAL_THRESHOLDS.ZONE) {
      // Zone manager can approve
      if (orgUnit.type === 'ZONE' || this.hasParentOfType(orgUnit, 'ZONE')) {
        chain.push({ role: ROLES.ZONE_MANAGER, threshold: APPROVAL_THRESHOLDS.ZONE });
      }
    } else if (amount <= APPROVAL_THRESHOLDS.PROJECT) {
      // Requires project manager approval
      chain.push({ role: ROLES.PROJECT_MANAGER, threshold: APPROVAL_THRESHOLDS.PROJECT });
    } else if (amount <= APPROVAL_THRESHOLDS.AREA) {
      // Requires area manager approval
      chain.push({ role: ROLES.AREA_MANAGER, threshold: APPROVAL_THRESHOLDS.AREA });
    } else {
      // Requires PMO approval
      chain.push({ role: ROLES.PMO, threshold: APPROVAL_THRESHOLDS.PMO });
    }
    
    // For certain entity types, add additional approvers regardless of amount
    if (entityType === 'payroll' && chain.length === 1) {
      // Payroll always needs at least project manager approval
      if (chain[0].role === ROLES.ZONE_MANAGER) {
        chain.push({ role: ROLES.PROJECT_MANAGER, threshold: APPROVAL_THRESHOLDS.PROJECT });
      }
    }
    
    return chain;
  }
  
  /**
   * Check if org unit has parent of specific type
   * @param {Object} orgUnit - Organizational unit
   * @param {string} parentType - Type to check for
   * @returns {boolean}
   */
  static hasParentOfType(orgUnit, parentType) {
    if (orgUnit.parent && orgUnit.parent.type === parentType) {
      return true;
    }
    // Could traverse up the hierarchy if needed
    return false;
  }
  
  /**
   * Check if user can approve given amount
   * @param {string} role - User role
   * @param {number} amount - Amount to approve
   * @returns {boolean}
   */
  static canUserApprove(role, amount) {
    const roleThresholds = {
      [ROLES.ZONE_MANAGER]: APPROVAL_THRESHOLDS.ZONE,
      [ROLES.PROJECT_MANAGER]: APPROVAL_THRESHOLDS.PROJECT,
      [ROLES.AREA_MANAGER]: APPROVAL_THRESHOLDS.AREA,
      [ROLES.PMO]: APPROVAL_THRESHOLDS.PMO,
      [ROLES.ADMIN]: APPROVAL_THRESHOLDS.PMO
    };
    
    const threshold = roleThresholds[role];
    return threshold && amount <= threshold;
  }
  
  /**
   * Get role level for threshold comparison
   * @param {string} role - User role
   * @returns {string}
   */
  static getRoleLevel(role) {
    const roleLevels = {
      [ROLES.ZONE_MANAGER]: 'ZONE',
      [ROLES.PROJECT_MANAGER]: 'PROJECT',
      [ROLES.AREA_MANAGER]: 'AREA',
      [ROLES.PMO]: 'PMO',
      [ROLES.ADMIN]: 'PMO'
    };
    return roleLevels[role] || 'ZONE';
  }
  
  /**
   * Update entity approval status
   * @param {string} entityType - Type of entity
   * @param {string} entityId - Entity ID
   * @param {string} status - Approval status
   * @param {string} approvedBy - User who approved
   */
  static async updateEntityApprovalStatus(entityType, entityId, status, approvedBy) {
    const updateData = {
      status,
      approvedBy: status === 'APPROVED' ? approvedBy : null,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      rejectedBy: status === 'REJECTED' ? approvedBy : null,
      rejectedAt: status === 'REJECTED' ? new Date() : null
    };
    
    switch (entityType) {
      case 'expense':
        await prisma.expense.update({
          where: { id: entityId },
          data: updateData
        });
        break;
      case 'safeTransaction':
        await prisma.safeTransaction.update({
          where: { id: entityId },
          data: updateData
        });
        break;
      case 'payrollRun':
        await prisma.payrollRun.update({
          where: { id: entityId },
          data: updateData
        });
        break;
      case 'task':
        await prisma.task.update({
          where: { id: entityId },
          data: { approvalStatus: status }
        });
        break;
    }
  }
  
  /**
   * Send approval notification
   * @param {string} approvalId - Approval workflow ID
   * @param {string} recipientRole - Role of recipient
   * @param {string} notificationType - Type of notification
   */
  static async sendApprovalNotification(approvalId, recipientRole, notificationType) {
    // This would integrate with a notification system
    // For now, just log the notification
    console.log(`Notification: ${notificationType} for approval ${approvalId} to role ${recipientRole}`);
    
    // In a real implementation, this would:
    // 1. Find users with the recipient role in the relevant org units
    // 2. Send email notifications
    // 3. Create in-app notifications
    // 4. Send push notifications if applicable
  }
  
  /**
   * Get pending approvals for user
   * @param {string} userId - User ID
   * @returns {Array} Array of pending approvals
   */
  static async getPendingApprovals(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, orgUnitId: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user's scope
      const userScopeIds = await getUserScopeOrgUnitIds(user);
      
      const pendingApprovals = await prisma.approvalWorkflow.findMany({
        where: {
          status: 'PENDING',
          currentApprover: user.role,
          orgUnitId: { in: userScopeIds }
        },
        include: {
          steps: { orderBy: { order: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return pendingApprovals;
      
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  }
  
  /**
   * Get approval history for entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of approvals for this entity
   */
  static async getApprovalHistory(entityType, entityId) {
    try {
      const approvals = await prisma.approvalWorkflow.findMany({
        where: {
          entityType,
          entityId
        },
        include: {
          steps: { 
            orderBy: { order: 'asc' },
            include: {
              approver: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return approvals;
      
    } catch (error) {
      console.error('Error getting approval history:', error);
      throw error;
    }
  }
}

// Helper function to get user scope (imported from rbac.js)
async function getUserScopeOrgUnitIds(user) {
  // This should be imported from rbac.js, but including here to avoid circular imports
  if (!user.orgUnitId) return [];
  
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
  
  await collectDescendants(user.orgUnitId);
  return descendants;
}
