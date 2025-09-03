import { Task, TaskUpdate, TaskApproval, TaskInvoiceLink } from '../types/tasks'
import { apiClient } from './client'

// Task CRUD Operations
export const tasksApi = {
  // Get all tasks for a site
  getTasksBySite: async (siteId: string): Promise<Task[]> => {
    try {
      const response = await apiClient.get(`/api/sites/${siteId}/tasks`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      throw new Error('Failed to fetch tasks')
    }
  },

  // Get a specific task by ID
  getTask: async (taskId: string): Promise<Task> => {
    try {
      const response = await apiClient.get(`/api/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch task:', error)
      throw new Error('Failed to fetch task')
    }
  },

  // Create a new task
  createTask: async (siteId: string, taskData: Partial<Task>): Promise<Task> => {
    try {
      const response = await apiClient.post(`/api/sites/${siteId}/tasks`, {
        ...taskData,
        siteId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to create task:', error)
      throw new Error('Failed to create task')
    }
  },

  // Update an existing task
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    try {
      const response = await apiClient.put(`/api/tasks/${taskId}`, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to update task:', error)
      throw new Error('Failed to update task')
    }
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/tasks/${taskId}`)
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw new Error('Failed to delete task')
    }
  },

  // Bulk update task statuses
  bulkUpdateTasks: async (taskIds: string[], updates: Partial<Task>): Promise<Task[]> => {
    try {
      const response = await apiClient.patch('/api/tasks/bulk', {
        taskIds,
        updates: {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      })
      return response.data
    } catch (error) {
      console.error('Failed to bulk update tasks:', error)
      throw new Error('Failed to bulk update tasks')
    }
  }
}

// Task Updates Operations
export const taskUpdatesApi = {
  // Get all updates for a task
  getTaskUpdates: async (taskId: string): Promise<TaskUpdate[]> => {
    try {
      const response = await apiClient.get(`/api/tasks/${taskId}/updates`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch task updates:', error)
      throw new Error('Failed to fetch task updates')
    }
  },

  // Create a new task update
  createTaskUpdate: async (taskId: string, updateData: Partial<TaskUpdate>): Promise<TaskUpdate> => {
    try {
      const response = await apiClient.post(`/api/tasks/${taskId}/updates`, {
        ...updateData,
        taskId,
        timestamp: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to create task update:', error)
      throw new Error('Failed to create task update')
    }
  },

  // Update an existing task update
  updateTaskUpdate: async (updateId: string, updates: Partial<TaskUpdate>): Promise<TaskUpdate> => {
    try {
      const response = await apiClient.put(`/api/task-updates/${updateId}`, updates)
      return response.data
    } catch (error) {
      console.error('Failed to update task update:', error)
      throw new Error('Failed to update task update')
    }
  },

  // Delete a task update
  deleteTaskUpdate: async (updateId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/task-updates/${updateId}`)
    } catch (error) {
      console.error('Failed to delete task update:', error)
      throw new Error('Failed to delete task update')
    }
  }
}

// Task Approvals Operations
export const taskApprovalsApi = {
  // Get all approvals for a task
  getTaskApprovals: async (taskId: string): Promise<TaskApproval[]> => {
    try {
      const response = await apiClient.get(`/api/tasks/${taskId}/approvals`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch task approvals:', error)
      throw new Error('Failed to fetch task approvals')
    }
  },

  // Get pending approvals for user
  getPendingApprovals: async (userId?: string): Promise<TaskApproval[]> => {
    try {
      const endpoint = userId ? `/api/approvals/pending?userId=${userId}` : '/api/approvals/pending'
      const response = await apiClient.get(endpoint)
      return response.data
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error)
      throw new Error('Failed to fetch pending approvals')
    }
  },

  // Submit an approval decision
  submitApproval: async (approvalId: string, decision: 'APPROVED' | 'REJECTED', comments?: string): Promise<TaskApproval> => {
    try {
      const response = await apiClient.post(`/api/approvals/${approvalId}/submit`, {
        decision,
        comments,
        reviewedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to submit approval:', error)
      throw new Error('Failed to submit approval')
    }
  },

  // Request approval for a task
  requestApproval: async (taskId: string, approvalData: Partial<TaskApproval>): Promise<TaskApproval> => {
    try {
      const response = await apiClient.post(`/api/tasks/${taskId}/request-approval`, {
        ...approvalData,
        taskId,
        requestedAt: new Date().toISOString(),
        status: 'PENDING'
      })
      return response.data
    } catch (error) {
      console.error('Failed to request approval:', error)
      throw new Error('Failed to request approval')
    }
  }
}

// Task Invoice Links Operations
export const taskInvoiceLinksApi = {
  // Get all invoice links for a task
  getTaskInvoiceLinks: async (taskId: string): Promise<TaskInvoiceLink[]> => {
    try {
      const response = await apiClient.get(`/api/tasks/${taskId}/invoice-links`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch task invoice links:', error)
      throw new Error('Failed to fetch task invoice links')
    }
  },

  // Create a new invoice link
  createInvoiceLink: async (taskId: string, linkData: Partial<TaskInvoiceLink>): Promise<TaskInvoiceLink> => {
    try {
      const response = await apiClient.post(`/api/tasks/${taskId}/invoice-links`, {
        ...linkData,
        taskId,
        createdAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to create invoice link:', error)
      throw new Error('Failed to create invoice link')
    }
  },

  // Update an invoice link
  updateInvoiceLink: async (linkId: string, updates: Partial<TaskInvoiceLink>): Promise<TaskInvoiceLink> => {
    try {
      const response = await apiClient.put(`/api/invoice-links/${linkId}`, updates)
      return response.data
    } catch (error) {
      console.error('Failed to update invoice link:', error)
      throw new Error('Failed to update invoice link')
    }
  },

  // Delete an invoice link
  deleteInvoiceLink: async (linkId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/invoice-links/${linkId}`)
    } catch (error) {
      console.error('Failed to delete invoice link:', error)
      throw new Error('Failed to delete invoice link')
    }
  }
}

// File Upload Operations
export const taskAttachmentsApi = {
  // Upload files for a task
  uploadTaskFiles: async (taskId: string, files: File[]): Promise<string[]> => {
    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`files`, file)
      })
      formData.append('taskId', taskId)

      const response = await apiClient.post(`/api/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data.fileUrls
    } catch (error) {
      console.error('Failed to upload task files:', error)
      throw new Error('Failed to upload task files')
    }
  },

  // Upload files for a task update
  uploadUpdateFiles: async (updateId: string, files: File[]): Promise<string[]> => {
    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`files`, file)
      })
      formData.append('updateId', updateId)

      const response = await apiClient.post(`/api/task-updates/${updateId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data.fileUrls
    } catch (error) {
      console.error('Failed to upload update files:', error)
      throw new Error('Failed to upload update files')
    }
  },

  // Delete an attachment
  deleteAttachment: async (attachmentUrl: string): Promise<void> => {
    try {
      await apiClient.delete('/api/attachments', {
        data: { attachmentUrl }
      })
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      throw new Error('Failed to delete attachment')
    }
  }
}

// Report Generation Operations
export const taskReportsApi = {
  // Generate Site Progress Report
  generateSiteProgressReport: async (siteId: string, options: {
    format: 'PDF' | 'EXCEL'
    language: 'EN' | 'AR'
    dateRange?: { start: string; end: string }
    includeFinancials?: boolean
    includePhotos?: boolean
  }): Promise<{ blob: Blob; filename: string }> => {
    try {
      const response = await apiClient.post(`/api/sites/${siteId}/reports/progress`, options, {
        responseType: 'blob'
      })
      
      const filename = response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 
        `site-progress-${siteId}-${new Date().toISOString().split('T')[0]}.${options.format.toLowerCase()}`
      
      return {
        blob: response.data,
        filename
      }
    } catch (error) {
      console.error('Failed to generate site progress report:', error)
      throw new Error('Failed to generate site progress report')
    }
  },

  // Generate Client Status Report
  generateClientStatusReport: async (siteId: string, options: {
    format: 'PDF' | 'EXCEL'
    language: 'EN' | 'AR'
    dateRange?: { start: string; end: string }
    includeFinancials?: boolean
    templateStyle?: 'professional' | 'detailed' | 'summary'
  }): Promise<{ blob: Blob; filename: string }> => {
    try {
      const response = await apiClient.post(`/api/sites/${siteId}/reports/client-status`, options, {
        responseType: 'blob'
      })
      
      const filename = response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 
        `client-status-${siteId}-${new Date().toISOString().split('T')[0]}.${options.format.toLowerCase()}`
      
      return {
        blob: response.data,
        filename
      }
    } catch (error) {
      console.error('Failed to generate client status report:', error)
      throw new Error('Failed to generate client status report')
    }
  },

  // Export Task Data to Excel
  exportTaskData: async (siteId: string, options: {
    language: 'EN' | 'AR'
    filters?: {
      status?: string[]
      priority?: string[]
      assignedTo?: string[]
      dateRange?: { start: string; end: string }
      categories?: string[]
    }
    includeUpdates?: boolean
    includeApprovals?: boolean
    includeFinancials?: boolean
  }): Promise<{ blob: Blob; filename: string }> => {
    try {
      const response = await apiClient.post(`/api/sites/${siteId}/tasks/export`, options, {
        responseType: 'blob'
      })
      
      const filename = response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 
        `task-export-${siteId}-${new Date().toISOString().split('T')[0]}.xlsx`
      
      return {
        blob: response.data,
        filename
      }
    } catch (error) {
      console.error('Failed to export task data:', error)
      throw new Error('Failed to export task data')
    }
  }
}

// Search and Filtering Operations
export const taskSearchApi = {
  // Search tasks across all sites
  searchTasks: async (query: string, filters?: {
    siteIds?: string[]
    status?: string[]
    priority?: string[]
    assignedTo?: string[]
    dateRange?: { start: string; end: string }
  }): Promise<Task[]> => {
    try {
      const response = await apiClient.post('/api/tasks/search', {
        query,
        filters
      })
      return response.data
    } catch (error) {
      console.error('Failed to search tasks:', error)
      throw new Error('Failed to search tasks')
    }
  },

  // Get task analytics for dashboard
  getTaskAnalytics: async (siteId?: string): Promise<{
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    highPriorityTasks: number
    tasksByStatus: Record<string, number>
    tasksByPriority: Record<string, number>
    completionTrend: Array<{ date: string; completed: number }>
  }> => {
    try {
      const endpoint = siteId ? `/api/tasks/analytics?siteId=${siteId}` : '/api/tasks/analytics'
      const response = await apiClient.get(endpoint)
      return response.data
    } catch (error) {
      console.error('Failed to fetch task analytics:', error)
      throw new Error('Failed to fetch task analytics')
    }
  }
}

// Validation helpers
export const validateTaskData = (taskData: Partial<Task>): string[] => {
  const errors: string[] = []
  
  if (!taskData.title?.trim()) {
    errors.push('Task title is required')
  }
  
  if (!taskData.description?.trim()) {
    errors.push('Task description is required')
  }
  
  if (!taskData.priority) {
    errors.push('Task priority is required')
  }
  
  if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
    errors.push('At least one assignee is required')
  }
  
  if (!taskData.dueDate) {
    errors.push('Due date is required')
  } else if (new Date(taskData.dueDate) < new Date()) {
    errors.push('Due date cannot be in the past')
  }
  
  if (taskData.estimatedHours && taskData.estimatedHours < 0) {
    errors.push('Estimated hours must be positive')
  }
  
  return errors
}

export const validateTaskUpdateData = (updateData: Partial<TaskUpdate>): string[] => {
  const errors: string[] = []
  
  if (!updateData.content?.trim()) {
    errors.push('Update content is required')
  }
  
  if (!updateData.author?.trim()) {
    errors.push('Update author is required')
  }
  
  if (updateData.hoursWorked && updateData.hoursWorked < 0) {
    errors.push('Hours worked must be positive')
  }
  
  if (updateData.progressPercentage && (updateData.progressPercentage < 0 || updateData.progressPercentage > 100)) {
    errors.push('Progress percentage must be between 0 and 100')
  }
  
  return errors
}

export const validateApprovalData = (approvalData: Partial<TaskApproval>): string[] => {
  const errors: string[] = []
  
  if (!approvalData.type) {
    errors.push('Approval type is required')
  }
  
  if (!approvalData.approverRole) {
    errors.push('Approver role is required')
  }
  
  if (!approvalData.requestedBy?.trim()) {
    errors.push('Requester is required')
  }
  
  return errors
}
