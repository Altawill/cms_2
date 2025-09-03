import type { User, UserRole } from '../types/user'

// Approval workflow types
export type ApprovalStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending_approval'
  | 'approved' 
  | 'rejected' 
  | 'requires_higher_approval'
  | 'escalated'
  | 'completed'

export type ApprovalType = 
  | 'expense' 
  | 'task_completion' 
  | 'budget_allocation'
  | 'equipment_purchase'
  | 'safe_access'
  | 'payroll_adjustment'
  | 'document_approval'
  | 'milestone_completion'

export interface ApprovalRequest {
  id: string
  type: ApprovalType
  requestorId: string
  requestorName: string
  requestorRole: UserRole
  orgUnitId: string
  amount?: number
  title: string
  description: string
  status: ApprovalStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  submittedAt?: string
  completedAt?: string
  metadata: Record<string, any>
  approvalChain: ApprovalStep[]
  currentApproverIndex: number
  attachments?: string[]
  comments: ApprovalComment[]
}

export interface ApprovalStep {
  stepNumber: number
  approverId: string
  approverName: string
  approverRole: UserRole
  orgUnitId: string
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  approvedAt?: string
  rejectedAt?: string
  comments?: string
  financialThreshold?: number
  canEscalate: boolean
}

export interface ApprovalComment {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  comment: string
  createdAt: string
  type: 'comment' | 'approval' | 'rejection' | 'escalation'
}

export interface ApprovalThreshold {
  role: UserRole
  orgLevelThreshold: number // Maximum amount this role can approve within their org unit
  crossOrgThreshold: number // Maximum amount this role can approve across org units
  escalationThreshold: number // Amount above which must escalate to higher role
}

// Financial approval thresholds in LYD
export const APPROVAL_THRESHOLDS: Record<UserRole, ApprovalThreshold> = {
  SITE_ENGINEER: {
    role: 'SITE_ENGINEER',
    orgLevelThreshold: 5000,
    crossOrgThreshold: 0,
    escalationThreshold: 5000
  },
  ZONE_MANAGER: {
    role: 'ZONE_MANAGER',
    orgLevelThreshold: 25000,
    crossOrgThreshold: 10000,
    escalationThreshold: 25000
  },
  PROJECT_MANAGER: {
    role: 'PROJECT_MANAGER',
    orgLevelThreshold: 100000,
    crossOrgThreshold: 50000,
    escalationThreshold: 100000
  },
  AREA_MANAGER: {
    role: 'AREA_MANAGER',
    orgLevelThreshold: 500000,
    crossOrgThreshold: 250000,
    escalationThreshold: 500000
  },
  PMO: {
    role: 'PMO',
    orgLevelThreshold: Number.MAX_SAFE_INTEGER,
    crossOrgThreshold: Number.MAX_SAFE_INTEGER,
    escalationThreshold: Number.MAX_SAFE_INTEGER
  }
}

// Role hierarchy for escalation (higher index = higher authority)
const ROLE_HIERARCHY: UserRole[] = [
  'SITE_ENGINEER',
  'ZONE_MANAGER', 
  'PROJECT_MANAGER',
  'AREA_MANAGER',
  'PMO'
]

export class ApprovalWorkflowService {
  private static instance: ApprovalWorkflowService
  private approvalRequests: Map<string, ApprovalRequest> = new Map()
  private users: User[] = []
  
  static getInstance(): ApprovalWorkflowService {
    if (!this.instance) {
      this.instance = new ApprovalWorkflowService()
    }
    return this.instance
  }

  setUsers(users: User[]) {
    this.users = users
  }

  /**
   * Create a new approval request
   */
  createApprovalRequest(
    type: ApprovalType,
    requestor: User,
    data: {
      title: string
      description: string
      amount?: number
      priority?: 'low' | 'medium' | 'high' | 'critical'
      metadata?: Record<string, any>
      attachments?: string[]
    }
  ): ApprovalRequest {
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const request: ApprovalRequest = {
      id: requestId,
      type,
      requestorId: requestor.id,
      requestorName: requestor.name,
      requestorRole: requestor.role,
      orgUnitId: requestor.orgUnitId,
      amount: data.amount,
      title: data.title,
      description: data.description,
      status: 'draft',
      priority: data.priority || 'medium',
      createdAt: new Date().toISOString(),
      metadata: data.metadata || {},
      approvalChain: [],
      currentApproverIndex: 0,
      attachments: data.attachments || [],
      comments: []
    }

    this.approvalRequests.set(requestId, request)
    return request
  }

  /**
   * Submit approval request - generates approval chain
   */
  submitApprovalRequest(requestId: string): ApprovalRequest {
    const request = this.approvalRequests.get(requestId)
    if (!request) {
      throw new Error('Approval request not found')
    }

    if (request.status !== 'draft') {
      throw new Error('Only draft requests can be submitted')
    }

    // Generate approval chain
    request.approvalChain = this.generateApprovalChain(request)
    request.status = request.approvalChain.length > 0 ? 'pending_approval' : 'approved'
    request.submittedAt = new Date().toISOString()

    // If no approval needed, mark as completed
    if (request.approvalChain.length === 0) {
      request.status = 'completed'
      request.completedAt = new Date().toISOString()
    }

    this.approvalRequests.set(requestId, request)
    return request
  }

  /**
   * Generate approval chain based on request type, amount, and organizational hierarchy
   */
  private generateApprovalChain(request: ApprovalRequest): ApprovalStep[] {
    const steps: ApprovalStep[] = []
    const requestorUser = this.users.find(u => u.id === request.requestorId)
    
    if (!requestorUser) {
      throw new Error('Requestor user not found')
    }

    // Find immediate supervisor
    const supervisor = this.findImmediateSupervisor(requestorUser)
    
    if (!supervisor) {
      // No supervisor found, request is auto-approved
      return steps
    }

    // Determine required approval levels based on amount and type
    const requiredApprovers = this.determineRequiredApprovers(
      request.type,
      request.amount || 0,
      requestorUser,
      supervisor
    )

    // Create approval steps
    requiredApprovers.forEach((approver, index) => {
      const threshold = APPROVAL_THRESHOLDS[approver.role]
      const canApprove = this.canUserApprove(approver, request.amount || 0, requestorUser.orgUnitId)
      
      steps.push({
        stepNumber: index + 1,
        approverId: approver.id,
        approverName: approver.name,
        approverRole: approver.role,
        orgUnitId: approver.orgUnitId,
        status: 'pending',
        financialThreshold: threshold.orgLevelThreshold,
        canEscalate: index < requiredApprovers.length - 1 || approver.role !== 'PMO'
      })
    })

    return steps
  }

  /**
   * Find immediate supervisor for a user
   */
  private findImmediateSupervisor(user: User): User | null {
    const currentRoleIndex = ROLE_HIERARCHY.indexOf(user.role)
    if (currentRoleIndex === -1 || currentRoleIndex === ROLE_HIERARCHY.length - 1) {
      return null // Already at top or invalid role
    }

    const supervisorRole = ROLE_HIERARCHY[currentRoleIndex + 1]
    
    // Find supervisor in same org unit or parent org unit
    return this.users.find(u => 
      u.role === supervisorRole && 
      (u.orgUnitId === user.orgUnitId || this.isParentOrgUnit(u.orgUnitId, user.orgUnitId))
    ) || null
  }

  /**
   * Determine all required approvers for a request
   */
  private determineRequiredApprovers(
    type: ApprovalType,
    amount: number,
    requestor: User,
    supervisor: User
  ): User[] {
    const approvers: User[] = []
    let currentApprover: User | null = supervisor

    // Always start with immediate supervisor
    if (currentApprover) {
      approvers.push(currentApprover)
    }

    // Escalate based on amount and type-specific rules
    while (currentApprover) {
      if (this.canUserApprove(currentApprover, amount, requestor.orgUnitId)) {
        break // This approver can handle the request
      }

      // Need to escalate to higher authority
      const higherApprover = this.findImmediateSupervisor(currentApprover)
      if (higherApprover && !approvers.find(a => a.id === higherApprover.id)) {
        approvers.push(higherApprover)
        currentApprover = higherApprover
      } else {
        break // No higher authority found
      }
    }

    // Special rules for certain types
    if (type === 'safe_access' || type === 'payroll_adjustment') {
      // These always require PMO approval regardless of amount
      const pmoUser = this.users.find(u => u.role === 'PMO')
      if (pmoUser && !approvers.find(a => a.id === pmoUser.id)) {
        approvers.push(pmoUser)
      }
    }

    return approvers
  }

  /**
   * Check if user can approve a specific amount for a given org unit
   */
  private canUserApprove(user: User, amount: number, requestorOrgUnitId: string): boolean {
    const threshold = APPROVAL_THRESHOLDS[user.role]
    
    if (user.orgUnitId === requestorOrgUnitId || this.isParentOrgUnit(user.orgUnitId, requestorOrgUnitId)) {
      return amount <= threshold.orgLevelThreshold
    } else {
      return amount <= threshold.crossOrgThreshold
    }
  }

  /**
   * Check if one org unit is parent of another
   */
  private isParentOrgUnit(parentId: string, childId: string): boolean {
    // This would need to be implemented based on your org hierarchy structure
    // For now, simplified logic
    return false
  }

  /**
   * Approve a request step
   */
  approveStep(
    requestId: string, 
    approverId: string, 
    comments?: string
  ): ApprovalRequest {
    const request = this.approvalRequests.get(requestId)
    if (!request) {
      throw new Error('Approval request not found')
    }

    const currentStep = request.approvalChain[request.currentApproverIndex]
    if (!currentStep || currentStep.approverId !== approverId) {
      throw new Error('Not authorized to approve this step')
    }

    if (currentStep.status !== 'pending') {
      throw new Error('Step already processed')
    }

    // Approve the step
    currentStep.status = 'approved'
    currentStep.approvedAt = new Date().toISOString()
    currentStep.comments = comments

    // Add approval comment
    const approver = this.users.find(u => u.id === approverId)
    if (approver) {
      request.comments.push({
        id: `comment_${Date.now()}`,
        userId: approverId,
        userName: approver.name,
        userRole: approver.role,
        comment: comments || `Approved by ${approver.name}`,
        createdAt: new Date().toISOString(),
        type: 'approval'
      })
    }

    // Move to next step or complete
    request.currentApproverIndex++
    
    if (request.currentApproverIndex >= request.approvalChain.length) {
      // All approvals complete
      request.status = 'approved'
      request.completedAt = new Date().toISOString()
    } else {
      request.status = 'pending_approval'
    }

    this.approvalRequests.set(requestId, request)
    return request
  }

  /**
   * Reject a request step
   */
  rejectStep(
    requestId: string, 
    approverId: string, 
    reason: string
  ): ApprovalRequest {
    const request = this.approvalRequests.get(requestId)
    if (!request) {
      throw new Error('Approval request not found')
    }

    const currentStep = request.approvalChain[request.currentApproverIndex]
    if (!currentStep || currentStep.approverId !== approverId) {
      throw new Error('Not authorized to reject this step')
    }

    if (currentStep.status !== 'pending') {
      throw new Error('Step already processed')
    }

    // Reject the step
    currentStep.status = 'rejected'
    currentStep.rejectedAt = new Date().toISOString()
    currentStep.comments = reason

    // Mark entire request as rejected
    request.status = 'rejected'
    request.completedAt = new Date().toISOString()

    // Add rejection comment
    const approver = this.users.find(u => u.id === approverId)
    if (approver) {
      request.comments.push({
        id: `comment_${Date.now()}`,
        userId: approverId,
        userName: approver.name,
        userRole: approver.role,
        comment: reason,
        createdAt: new Date().toISOString(),
        type: 'rejection'
      })
    }

    this.approvalRequests.set(requestId, request)
    return request
  }

  /**
   * Escalate request to higher authority
   */
  escalateRequest(
    requestId: string, 
    approverId: string, 
    reason: string
  ): ApprovalRequest {
    const request = this.approvalRequests.get(requestId)
    if (!request) {
      throw new Error('Approval request not found')
    }

    const currentStep = request.approvalChain[request.currentApproverIndex]
    if (!currentStep || currentStep.approverId !== approverId) {
      throw new Error('Not authorized to escalate this step')
    }

    if (!currentStep.canEscalate) {
      throw new Error('This step cannot be escalated')
    }

    // Find next higher authority
    const currentApprover = this.users.find(u => u.id === approverId)
    if (!currentApprover) {
      throw new Error('Current approver not found')
    }

    const higherApprover = this.findImmediateSupervisor(currentApprover)
    if (!higherApprover) {
      throw new Error('No higher authority found for escalation')
    }

    // Skip current step
    currentStep.status = 'skipped'
    currentStep.comments = `Escalated: ${reason}`

    // Add escalation step
    const escalationStep: ApprovalStep = {
      stepNumber: request.approvalChain.length + 1,
      approverId: higherApprover.id,
      approverName: higherApprover.name,
      approverRole: higherApprover.role,
      orgUnitId: higherApprover.orgUnitId,
      status: 'pending',
      financialThreshold: APPROVAL_THRESHOLDS[higherApprover.role].orgLevelThreshold,
      canEscalate: higherApprover.role !== 'PMO'
    }

    request.approvalChain.push(escalationStep)
    request.currentApproverIndex = request.approvalChain.length - 1
    request.status = 'escalated'

    // Add escalation comment
    request.comments.push({
      id: `comment_${Date.now()}`,
      userId: approverId,
      userName: currentApprover.name,
      userRole: currentApprover.role,
      comment: `Escalated to ${higherApprover.name}: ${reason}`,
      createdAt: new Date().toISOString(),
      type: 'escalation'
    })

    this.approvalRequests.set(requestId, request)
    return request
  }

  /**
   * Add comment to approval request
   */
  addComment(
    requestId: string,
    userId: string,
    comment: string
  ): ApprovalRequest {
    const request = this.approvalRequests.get(requestId)
    if (!request) {
      throw new Error('Approval request not found')
    }

    const user = this.users.find(u => u.id === userId)
    if (!user) {
      throw new Error('User not found')
    }

    request.comments.push({
      id: `comment_${Date.now()}`,
      userId,
      userName: user.name,
      userRole: user.role,
      comment,
      createdAt: new Date().toISOString(),
      type: 'comment'
    })

    this.approvalRequests.set(requestId, request)
    return request
  }

  /**
   * Get all approval requests for a user (as requestor or approver)
   */
  getUserApprovalRequests(userId: string): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values()).filter(request => 
      request.requestorId === userId || 
      request.approvalChain.some(step => step.approverId === userId)
    )
  }

  /**
   * Get pending approvals for a user
   */
  getPendingApprovalsForUser(userId: string): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values()).filter(request => {
      if (request.status !== 'pending_approval' && request.status !== 'escalated') {
        return false
      }
      
      const currentStep = request.approvalChain[request.currentApproverIndex]
      return currentStep && currentStep.approverId === userId && currentStep.status === 'pending'
    })
  }

  /**
   * Get approval request by ID
   */
  getApprovalRequest(requestId: string): ApprovalRequest | null {
    return this.approvalRequests.get(requestId) || null
  }

  /**
   * Get all approval requests with optional filters
   */
  getApprovalRequests(filters?: {
    type?: ApprovalType
    status?: ApprovalStatus
    orgUnitId?: string
    requestorId?: string
    dateFrom?: string
    dateTo?: string
  }): ApprovalRequest[] {
    let requests = Array.from(this.approvalRequests.values())

    if (filters) {
      if (filters.type) {
        requests = requests.filter(r => r.type === filters.type)
      }
      if (filters.status) {
        requests = requests.filter(r => r.status === filters.status)
      }
      if (filters.orgUnitId) {
        requests = requests.filter(r => r.orgUnitId === filters.orgUnitId)
      }
      if (filters.requestorId) {
        requests = requests.filter(r => r.requestorId === filters.requestorId)
      }
      if (filters.dateFrom) {
        requests = requests.filter(r => r.createdAt >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        requests = requests.filter(r => r.createdAt <= filters.dateTo!)
      }
    }

    return requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Get approval statistics for dashboard
   */
  getApprovalStatistics(userId?: string, orgUnitId?: string): {
    total: number
    pending: number
    approved: number
    rejected: number
    byType: Record<ApprovalType, number>
    byPriority: Record<string, number>
    averageApprovalTime: number
  } {
    let requests = Array.from(this.approvalRequests.values())

    if (userId) {
      requests = requests.filter(r => 
        r.requestorId === userId || 
        r.approvalChain.some(step => step.approverId === userId)
      )
    }

    if (orgUnitId) {
      requests = requests.filter(r => r.orgUnitId === orgUnitId)
    }

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending_approval' || r.status === 'escalated').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      byType: {} as Record<ApprovalType, number>,
      byPriority: {} as Record<string, number>,
      averageApprovalTime: 0
    }

    // Calculate by type
    requests.forEach(r => {
      stats.byType[r.type] = (stats.byType[r.type] || 0) + 1
      stats.byPriority[r.priority] = (stats.byPriority[r.priority] || 0) + 1
    })

    // Calculate average approval time
    const completedRequests = requests.filter(r => r.completedAt && r.submittedAt)
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, r) => {
        const submitted = new Date(r.submittedAt!).getTime()
        const completed = new Date(r.completedAt!).getTime()
        return sum + (completed - submitted)
      }, 0)
      stats.averageApprovalTime = totalTime / completedRequests.length
    }

    return stats
  }
}

// Export singleton instance
export const approvalWorkflow = ApprovalWorkflowService.getInstance()
