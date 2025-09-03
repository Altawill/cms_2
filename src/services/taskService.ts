import { where, orderBy } from 'firebase/firestore'
import { 
  Task, 
  TaskUpdate, 
  TaskApproval, 
  TaskInvoiceLink, 
  Invoice,
  TaskFilter,
  Employee,
  Site
} from '../types'
import { 
  tasksRepo, 
  taskUpdatesRepo, 
  taskApprovalsRepo, 
  taskInvoiceLinksRepo,
  invoicesRepo,
  employeesRepo,
  sitesRepo,
  logActivity
} from './repository'
import { 
  validateTask, 
  validateTaskUpdate, 
  validateTaskApproval,
  generateTaskCode,
  validateProgressUpdate
} from '../schemas/taskSchemas'
import { mockRepository } from './mockService'

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

export class TaskService {
  
  // Generate unique task code for a site
  async generateTaskCode(siteId: string): Promise<string> {
    const site = await sitesRepo.getById(siteId)
    if (!site) throw new Error('Site not found')
    
    const existingTasks = await this.getTasksBySite(siteId)
    const sequence = existingTasks.length + 1
    
    // Use site name initials for code
    const siteCode = site.name.split(' ').map(word => word[0]).join('').toUpperCase()
    return generateTaskCode(siteCode, sequence)
  }
  
  // Create a new task
  async createTask(taskData: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    // Generate task code
    const code = await this.generateTaskCode(taskData.siteId)
    
    // Validate task data
    const validation = validateTask({
      ...taskData,
      code,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`)
    }
    
    const newTask = await tasksRepo.create({
      ...taskData,
      code,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Log activity
    await logActivity('TASK', newTask.id, 'CREATE', taskData.createdBy, {
      taskName: taskData.name,
      siteId: taskData.siteId
    })
    
    // Create initial approval records if needed
    if (taskData.billable || taskData.priority === 'HIGH' || taskData.priority === 'CRITICAL') {
      await this.createApprovalWorkflow(newTask.id, taskData.createdBy)
    }
    
    return newTask
  }
  
  // Update task
  async updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<void> {
    const existingTask = await tasksRepo.getById(taskId)
    if (!existingTask) throw new Error('Task not found')
    
    // Check if progress is being set to 100% and add actual completion date
    if (updates.progress === 100 && !updates.actualCompletionDate) {
      updates.actualCompletionDate = new Date()
    }
    
    // Update task
    await tasksRepo.update(taskId, {
      ...updates,
      updatedAt: new Date()
    })
    
    // Log activity
    await logActivity('TASK', taskId, 'UPDATE', userId, {
      changes: updates,
      taskName: existingTask.name
    })
  }
  
  // Add task update/progress entry
  async addTaskUpdate(updateData: Omit<TaskUpdate, 'id' | 'createdAt'>): Promise<TaskUpdate> {
    // Get current task to validate progress
    const task = await tasksRepo.getById(updateData.taskId)
    if (!task) throw new Error('Task not found')
    
    // Validate progress update
    const progressValidation = validateProgressUpdate(task.progress, updateData.progressDelta)
    if (!progressValidation.isValid) {
      throw new Error(progressValidation.error)
    }
    
    // Validate update data
    const validation = validateTaskUpdate({
      ...updateData,
      createdAt: new Date()
    })
    
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`)
    }
    
    // Create update record
    const newUpdate = await taskUpdatesRepo.create({
      ...updateData,
      createdAt: new Date()
    })
    
    // Update task progress and status
    const taskUpdates: Partial<Task> = {
      progress: updateData.progressAfter,
      updatedAt: new Date()
    }
    
    if (updateData.statusChange) {
      taskUpdates.status = updateData.statusChange
    }
    
    if (updateData.progressAfter === 100) {
      taskUpdates.actualCompletionDate = new Date()
      taskUpdates.status = 'COMPLETED'
    }
    
    await tasksRepo.update(updateData.taskId, taskUpdates)
    
    // Log activity
    await logActivity('TASK_UPDATE', newUpdate.id, 'CREATE', updateData.enteredById, {
      taskId: updateData.taskId,
      progressDelta: updateData.progressDelta,
      note: updateData.note
    })
    
    return newUpdate
  }
  
  // Get tasks by site with optional filtering
  async getTasksBySite(siteId: string, filter?: TaskFilter): Promise<Task[]> {
    let constraints = [where('siteId', '==', siteId), where('archived', '==', false)]
    
    if (filter?.status?.length) {
      constraints.push(where('status', 'in', filter.status))
    }
    
    if (filter?.category?.length) {
      constraints.push(where('category', 'in', filter.category))
    }
    
    if (filter?.priority?.length) {
      constraints.push(where('priority', 'in', filter.priority))
    }
    
    if (filter?.billable !== undefined) {
      constraints.push(where('billable', '==', filter.billable))
    }
    
    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'))
    
    const tasks = await tasksRepo.getAll(constraints)
    
    // Apply additional filters that can't be done in Firestore
    let filteredTasks = tasks
    
    if (filter?.assignee?.length) {
      filteredTasks = filteredTasks.filter(task => 
        filter.assignee!.includes(task.executorId || '') ||
        filter.assignee!.includes(task.supervisorId || '')
      )
    }
    
    if (filter?.overdue) {
      const now = new Date()
      filteredTasks = filteredTasks.filter(task => 
        task.expectedCompletionDate && 
        task.expectedCompletionDate < now && 
        task.status !== 'COMPLETED'
      )
    }
    
    return filteredTasks
  }
  
  // Get task updates
  async getTaskUpdates(taskId: string): Promise<TaskUpdate[]> {
    return await taskUpdatesRepo.getAll([
      where('taskId', '==', taskId),
      orderBy('timestamp', 'desc')
    ])
  }
  
  // Get task approvals
  async getTaskApprovals(taskId: string): Promise<TaskApproval[]> {
    return await taskApprovalsRepo.getAll([
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    ])
  }
  
  // Create approval workflow for a task
  async createApprovalWorkflow(taskId: string, createdBy: string): Promise<void> {
    const approvalLevels = ['ENGINEER', 'SITE_MANAGER', 'PROJECT_MANAGER'] as const
    
    for (const level of approvalLevels) {
      await taskApprovalsRepo.create({
        taskId,
        level,
        status: 'PENDING',
        createdAt: new Date()
      })
    }
    
    await logActivity('TASK_APPROVAL', taskId, 'WORKFLOW_CREATED', createdBy)
  }
  
  // Approve/reject task at specific level
  async approveTask(
    taskId: string, 
    level: 'ENGINEER' | 'SITE_MANAGER' | 'PROJECT_MANAGER',
    status: 'APPROVED' | 'REJECTED',
    approvedById: string,
    remark?: string
  ): Promise<void> {
    // Find the approval record
    const approvals = await taskApprovalsRepo.getAll([
      where('taskId', '==', taskId),
      where('level', '==', level)
    ])
    
    if (approvals.length === 0) {
      throw new Error('Approval record not found')
    }
    
    const approval = approvals[0]
    
    // Update approval
    await taskApprovalsRepo.update(approval.id, {
      status,
      approvedById,
      approvedAt: new Date(),
      remark
    })
    
    // Log activity
    await logActivity('TASK_APPROVAL', approval.id, status, approvedById, {
      taskId,
      level,
      remark
    })
  }
  
  // Get task with related data (employees, updates, approvals)
  async getTaskWithDetails(taskId: string): Promise<{
    task: Task
    updates: TaskUpdate[]
    approvals: TaskApproval[]
    executor?: Employee
    supervisor?: Employee
    approver?: Employee
    invoiceLinks: TaskInvoiceLink[]
  }> {
    const task = await tasksRepo.getById(taskId)
    if (!task) throw new Error('Task not found')
    
    const [updates, approvals, invoiceLinks] = await Promise.all([
      this.getTaskUpdates(taskId),
      this.getTaskApprovals(taskId),
      this.getTaskInvoiceLinks(taskId)
    ])
    
    // Get employee details
    const [executor, supervisor, approver] = await Promise.all([
      task.executorId ? employeesRepo.getById(task.executorId) : Promise.resolve(undefined),
      task.supervisorId ? employeesRepo.getById(task.supervisorId) : Promise.resolve(undefined),
      task.approverId ? employeesRepo.getById(task.approverId) : Promise.resolve(undefined)
    ])
    
    return {
      task,
      updates,
      approvals,
      executor: executor || undefined,
      supervisor: supervisor || undefined,
      approver: approver || undefined,
      invoiceLinks
    }
  }
  
  // Link task to invoice
  async linkTaskToInvoice(
    taskId: string, 
    invoiceId: string, 
    amountBilled: number, 
    userId: string
  ): Promise<TaskInvoiceLink> {
    // Get invoice to calculate balance
    const invoice = await invoicesRepo.getById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    
    const link = await taskInvoiceLinksRepo.create({
      taskId,
      invoiceId,
      amountBilled,
      amountPaid: invoice.paid,
      balance: amountBilled - invoice.paid,
      createdAt: new Date()
    })
    
    // Update task cost
    const task = await tasksRepo.getById(taskId)
    if (task) {
      await tasksRepo.update(taskId, {
        costToDate: task.costToDate + amountBilled,
        updatedAt: new Date()
      })
    }
    
    await logActivity('TASK_INVOICE_LINK', link.id, 'CREATE', userId, {
      taskId,
      invoiceId,
      amountBilled
    })
    
    return link
  }
  
  // Get task invoice links
  async getTaskInvoiceLinks(taskId: string): Promise<TaskInvoiceLink[]> {
    return await taskInvoiceLinksRepo.getAll([
      where('taskId', '==', taskId),
      orderBy('createdAt', 'desc')
    ])
  }
  
  // Get overdue tasks across all sites
  async getOverdueTasks(siteIds?: string[]): Promise<Task[]> {
    const now = new Date()
    let constraints = [
      where('archived', '==', false),
      where('status', '!=', 'COMPLETED'),
      where('status', '!=', 'CANCELLED')
    ]
    
    if (siteIds?.length) {
      constraints.push(where('siteId', 'in', siteIds))
    }
    
    const tasks = await tasksRepo.getAll(constraints)
    
    return tasks.filter(task => 
      task.expectedCompletionDate && 
      task.expectedCompletionDate < now
    )
  }
  
  // Get task statistics for a site
  async getTaskStatistics(siteId: string): Promise<{
    total: number
    completed: number
    inProgress: number
    overdue: number
    averageProgress: number
    totalBudget: number
    totalCost: number
  }> {
    const tasks = await this.getTasksBySite(siteId)
    const now = new Date()
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      overdue: tasks.filter(t => 
        t.expectedCompletionDate && 
        t.expectedCompletionDate < now && 
        t.status !== 'COMPLETED'
      ).length,
      averageProgress: tasks.length > 0 
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0,
      totalBudget: tasks.reduce((sum, t) => sum + (t.budgetAmount || 0), 0),
      totalCost: tasks.reduce((sum, t) => sum + t.costToDate, 0)
    }
    
    return stats
  }
  
  // Search tasks across multiple sites
  async searchTasks(searchTerm: string, siteIds?: string[], limit: number = 50): Promise<Task[]> {
    let constraints = [where('archived', '==', false)]
    
    if (siteIds?.length) {
      constraints.push(where('siteId', 'in', siteIds))
    }
    
    const tasks = await tasksRepo.getAll(constraints)
    
    // Client-side search (since Firestore doesn't support full-text search)
    const searchLower = searchTerm.toLowerCase()
    return tasks.filter(task => 
      task.name.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.code.toLowerCase().includes(searchLower) ||
      task.location?.toLowerCase().includes(searchLower)
    ).slice(0, limit)
  }
  
  // Archive/restore tasks
  async archiveTask(taskId: string, userId: string): Promise<void> {
    await tasksRepo.update(taskId, {
      archived: true,
      updatedAt: new Date()
    })
    
    await logActivity('TASK', taskId, 'ARCHIVE', userId)
  }
  
  async restoreTask(taskId: string, userId: string): Promise<void> {
    await tasksRepo.update(taskId, {
      archived: false,
      updatedAt: new Date()
    })
    
    await logActivity('TASK', taskId, 'RESTORE', userId)
  }
  
  // Quick update method (for the follow-up style updates)
  async addQuickUpdate(data: {
    taskId: string
    time: string // HH:MM format
    progressDelta: number
    workDescription: string
    manpower?: number
    executedBy: string
    location?: string
    userId: string
    attachments?: string[]
    issues?: string[]
  }): Promise<TaskUpdate> {
    const task = await tasksRepo.getById(data.taskId)
    if (!task) throw new Error('Task not found')
    
    // Parse time and create timestamp for today
    const [hours, minutes] = data.time.split(':').map(Number)
    const timestamp = new Date()
    timestamp.setHours(hours, minutes, 0, 0)
    
    const updateData: Omit<TaskUpdate, 'id' | 'createdAt'> = {
      taskId: data.taskId,
      timestamp,
      progressDelta: data.progressDelta,
      progressAfter: Math.max(0, Math.min(100, task.progress + data.progressDelta)),
      note: data.workDescription,
      manpower: data.manpower,
      location: data.location,
      executedById: data.executedBy,
      enteredById: data.userId,
      attachments: (data.attachments || []).map(url => ({
        id: Date.now().toString() + Math.random(),
        name: url.split('/').pop() || 'attachment',
        url,
        type: 'image/jpeg', // Default, should be detected from file
        size: 0, // Should be set during upload
        uploadedBy: data.userId,
        uploadedAt: new Date()
      })),
      issues: data.issues || [],
      createdAt: new Date()
    }
    
    return await this.addTaskUpdate(updateData)
  }
  
  // Get tasks requiring approval at specific level
  async getTasksPendingApproval(
    level: 'ENGINEER' | 'SITE_MANAGER' | 'PROJECT_MANAGER',
    siteIds?: string[]
  ): Promise<Task[]> {
    // Get all pending approvals at this level
    const pendingApprovals = await taskApprovalsRepo.getAll([
      where('level', '==', level),
      where('status', '==', 'PENDING')
    ])
    
    const taskIds = pendingApprovals.map(approval => approval.taskId)
    if (taskIds.length === 0) return []
    
    // Get tasks for these approvals
    let constraints = [
      where('archived', '==', false)
    ]
    
    if (siteIds?.length) {
      constraints.push(where('siteId', 'in', siteIds))
    }
    
    const allTasks = await tasksRepo.getAll(constraints)
    return allTasks.filter(task => taskIds.includes(task.id))
  }
  
  // Bulk operations for efficiency
  async bulkUpdateTaskStatus(taskIds: string[], status: Task['status'], userId: string): Promise<void> {
    for (const taskId of taskIds) {
      await this.updateTask(taskId, { status }, userId)
    }
  }
  
  async bulkArchiveTasks(taskIds: string[], userId: string): Promise<void> {
    for (const taskId of taskIds) {
      await this.archiveTask(taskId, userId)
    }
  }
  
  // Get task timeline data for Gantt-like view
  async getTaskTimeline(siteId: string): Promise<{
    task: Task
    startDate: Date
    endDate: Date
    progress: number
    dependencies?: string[]
  }[]> {
    const tasks = await this.getTasksBySite(siteId)
    
    return tasks
      .filter(task => task.startDate && task.expectedCompletionDate)
      .map(task => ({
        task,
        startDate: task.startDate!,
        endDate: task.expectedCompletionDate!,
        progress: task.progress,
        dependencies: [] // TODO: implement task dependencies
      }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }
}

// Create singleton instance
export const taskService = new TaskService()

// Helper functions for task operations
export async function createQuickTaskUpdate(
  taskId: string,
  note: string,
  progressDelta: number,
  userId: string,
  manpower?: number,
  location?: string
): Promise<TaskUpdate> {
  return await taskService.addQuickUpdate({
    taskId,
    time: new Date().toTimeString().slice(0, 5), // Current time in HH:MM
    progressDelta,
    workDescription: note,
    manpower,
    executedBy: userId,
    location,
    userId
  })
}

export async function getTasksForSite(siteId: string, filter?: TaskFilter): Promise<Task[]> {
  return await taskService.getTasksBySite(siteId, filter)
}

export async function getTaskDetails(taskId: string) {
  return await taskService.getTaskWithDetails(taskId)
}

// Mock data integration for development mode
if (isDevMode) {
  // Initialize mock data for tasks
  mockRepository.initializeTasks()
}
