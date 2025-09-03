import { z } from 'zod'
import { TaskStatus, TaskPriority, TaskCategory, ApprovalLevel, ApprovalStatus } from '../types'

// Task validation schema
export const taskSchema = z.object({
  id: z.string().optional(),
  siteId: z.string().min(1, 'Site is required'),
  code: z.string().min(1, 'Task code is required').max(20, 'Task code too long'),
  name: z.string().min(2, 'Task name must be at least 2 characters').max(100, 'Task name too long'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000, 'Description too long'),
  category: z.enum(['GYPSUM', 'MEP', 'CIVIL', 'PLUMBING', 'ELECTRICAL', 'FINISHING', 'LANDSCAPING', 'OTHER']),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  progress: z.number().min(0, 'Progress cannot be negative').max(100, 'Progress cannot exceed 100%'),
  startDate: z.date().optional(),
  expectedCompletionDate: z.date().optional(),
  actualCompletionDate: z.date().optional(),
  location: z.string().max(200, 'Location too long').optional(),
  manpower: z.number().min(0, 'Manpower cannot be negative').max(1000, 'Manpower seems too high'),
  executorId: z.string().optional(),
  supervisorId: z.string().optional(),
  approverId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  billable: z.boolean(),
  budgetAmount: z.number().min(0, 'Budget cannot be negative').optional(),
  costToDate: z.number().min(0, 'Cost cannot be negative').default(0),
  archived: z.boolean().default(false),
  createdBy: z.string().min(1, 'Creator is required'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
}).refine((data) => {
  // If progress is 100%, actual completion date should be set
  if (data.progress === 100 && !data.actualCompletionDate) {
    return false
  }
  return true
}, {
  message: 'Actual completion date is required when progress is 100%',
  path: ['actualCompletionDate']
}).refine((data) => {
  // Expected completion date should be after start date
  if (data.startDate && data.expectedCompletionDate && data.expectedCompletionDate <= data.startDate) {
    return false
  }
  return true
}, {
  message: 'Expected completion date must be after start date',
  path: ['expectedCompletionDate']
}).refine((data) => {
  // If billable, budget amount should be set
  if (data.billable && !data.budgetAmount) {
    return false
  }
  return true
}, {
  message: 'Budget amount is required for billable tasks',
  path: ['budgetAmount']
})

// Task update validation schema
export const taskUpdateSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().min(1, 'Task ID is required'),
  timestamp: z.date().default(() => new Date()),
  progressDelta: z.number().min(-100, 'Progress delta too low').max(100, 'Progress delta too high'),
  progressAfter: z.number().min(0, 'Progress cannot be negative').max(100, 'Progress cannot exceed 100%'),
  note: z.string().min(1, 'Update note is required').max(1000, 'Note too long'),
  manpower: z.number().min(0, 'Manpower cannot be negative').max(1000, 'Manpower seems too high').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  executedById: z.string().optional(),
  enteredById: z.string().min(1, 'Entered by user is required'),
  statusChange: z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  issues: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date())
})

// Task approval validation schema
export const taskApprovalSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().min(1, 'Task ID is required'),
  level: z.enum(['ENGINEER', 'SITE_MANAGER', 'PROJECT_MANAGER']),
  approvedById: z.string().optional(),
  approvedAt: z.date().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  remark: z.string().max(500, 'Remark too long').optional(),
  createdAt: z.date().default(() => new Date())
})

// Task attachment validation schema
export const taskAttachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  url: z.string().url('Invalid file URL'),
  type: z.string().min(1, 'File type is required'),
  size: z.number().min(1, 'File size must be positive').max(50 * 1024 * 1024, 'File too large (max 50MB)'),
  uploadedBy: z.string().min(1, 'Uploader is required'),
  uploadedAt: z.date().default(() => new Date()),
  exifData: z.object({
    timestamp: z.date().optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }).optional()
})

// Task invoice link validation schema
export const taskInvoiceLinkSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().min(1, 'Task ID is required'),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amountBilled: z.number().min(0, 'Amount billed cannot be negative'),
  amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
  balance: z.number(),
  createdAt: z.date().default(() => new Date())
}).refine((data) => {
  // Balance should equal billed minus paid
  return Math.abs(data.balance - (data.amountBilled - data.amountPaid)) < 0.01
}, {
  message: 'Balance must equal amount billed minus amount paid',
  path: ['balance']
})

// Invoice validation schema
export const invoiceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  siteId: z.string().min(1, 'Site is required'),
  title: z.string().min(1, 'Invoice title is required').max(200, 'Title too long'),
  lines: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, 'Line description is required'),
    quantity: z.number().min(0.01, 'Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    total: z.number().min(0, 'Total cannot be negative'),
    taskId: z.string().optional()
  })).min(1, 'Invoice must have at least one line item'),
  total: z.number().min(0, 'Total cannot be negative'),
  paid: z.number().min(0, 'Paid amount cannot be negative'),
  balance: z.number(),
  currency: z.string().min(1, 'Currency is required'),
  dueDate: z.date().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  createdBy: z.string().min(1, 'Creator is required'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
}).refine((data) => {
  // Balance should equal total minus paid
  return Math.abs(data.balance - (data.total - data.paid)) < 0.01
}, {
  message: 'Balance must equal total minus paid amount',
  path: ['balance']
}).refine((data) => {
  // Paid amount cannot exceed total
  return data.paid <= data.total
}, {
  message: 'Paid amount cannot exceed total',
  path: ['paid']
})

// Task filter validation schema
export const taskFilterSchema = z.object({
  status: z.array(z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])).optional(),
  category: z.array(z.enum(['GYPSUM', 'MEP', 'CIVIL', 'PLUMBING', 'ELECTRICAL', 'FINISHING', 'LANDSCAPING', 'OTHER'])).optional(),
  priority: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional(),
  assignee: z.array(z.string()).optional(),
  billable: z.boolean().optional(),
  overdue: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional()
}).refine((data) => {
  // Date range validation
  if (data.dateFrom && data.dateTo && data.dateTo <= data.dateFrom) {
    return false
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['dateTo']
})

// Report generation schemas
export const siteProgressReportSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  language: z.enum(['en', 'ar']).default('en'),
  format: z.enum(['pdf', 'xlsx']).default('pdf'),
  audience: z.enum(['internal', 'client']).default('internal'),
  include: z.object({
    manpower: z.boolean().default(true),
    attachmentsList: z.boolean().default(true),
    issues: z.boolean().default(true),
    approvals: z.boolean().default(true),
    financials: z.boolean().default(true)
  }).default({}),
  branding: z.object({
    logo: z.boolean().default(true),
    watermark: z.boolean().default(false)
  }).default({})
})

export const clientStatusReportSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  siteIds: z.array(z.string()).optional(),
  includeInvoices: z.boolean().default(true),
  language: z.enum(['en', 'ar']).default('en'),
  format: z.enum(['pdf', 'xlsx']).default('pdf'),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional()
}).refine((data) => {
  // Either clientId or clientName must be provided
  return data.clientId || data.clientName
}, {
  message: 'Either client ID or client name is required',
  path: ['clientId']
})

// Quick update schema (for the follow-up style updates)
export const quickUpdateSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  progressDelta: z.number().min(-100).max(100, 'Progress change too large'),
  expectedCompletion: z.date().optional(),
  workDescription: z.string().min(5, 'Work description must be at least 5 characters').max(500, 'Description too long'),
  manpower: z.number().min(0, 'Manpower cannot be negative').max(1000, 'Manpower seems too high'),
  executedBy: z.string().min(1, 'Executed by is required'),
  location: z.string().max(200, 'Location too long').optional(),
  supervision: z.object({
    engineer: z.string().optional(),
    siteManager: z.string().optional(),
    projectManager: z.string().optional()
  }).optional(),
  attachments: z.array(z.string()).default([]), // File URLs
  issues: z.array(z.string()).default([])
})

// Helper function to validate task data
export function validateTask(data: unknown) {
  return taskSchema.safeParse(data)
}

// Helper function to validate task update
export function validateTaskUpdate(data: unknown) {
  return taskUpdateSchema.safeParse(data)
}

// Helper function to validate quick update
export function validateQuickUpdate(data: unknown) {
  return quickUpdateSchema.safeParse(data)
}

// Helper function to validate task approval
export function validateTaskApproval(data: unknown) {
  return taskApprovalSchema.safeParse(data)
}

// Helper function to validate report parameters
export function validateSiteProgressReport(data: unknown) {
  return siteProgressReportSchema.safeParse(data)
}

export function validateClientStatusReport(data: unknown) {
  return clientStatusReportSchema.safeParse(data)
}

// Validation error formatting
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  
  errors.errors.forEach(error => {
    const path = error.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(error.message)
  })
  
  return formatted
}

// Common validation patterns
export const validationPatterns = {
  taskCode: /^TASK-\d{4}$/,
  phoneNumber: /^[\+]?[1-9][\d]{0,15}$/,
  nationalId: /^\d{10,15}$/,
  coordinates: {
    latitude: /^[-]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/,
    longitude: /^[-]?((1[0-7]\d)|([1-9]?\d))(\.\d+)?$/
  }
}

// File validation helpers
export function validateAttachment(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // File size validation (max 50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push('File size cannot exceed 50MB')
  }
  
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported. Allowed: JPEG, PNG, GIF, PDF, DOC, DOCX')
  }
  
  // File name validation
  if (file.name.length > 255) {
    errors.push('File name too long')
  }
  
  if (!/^[\w\-. ]+$/.test(file.name)) {
    errors.push('File name contains invalid characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generate task code
export function generateTaskCode(siteCode: string, sequence: number): string {
  return `${siteCode}-TASK-${sequence.toString().padStart(4, '0')}`
}

// Validate progress update logic
export function validateProgressUpdate(currentProgress: number, delta: number): { isValid: boolean; error?: string } {
  const newProgress = currentProgress + delta
  
  if (newProgress < 0) {
    return { isValid: false, error: 'Progress cannot go below 0%' }
  }
  
  if (newProgress > 100) {
    return { isValid: false, error: 'Progress cannot exceed 100%' }
  }
  
  return { isValid: true }
}

export type TaskFormData = z.infer<typeof taskSchema>
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>
export type QuickUpdateFormData = z.infer<typeof quickUpdateSchema>
export type TaskApprovalFormData = z.infer<typeof taskApprovalSchema>
export type SiteProgressReportData = z.infer<typeof siteProgressReportSchema>
export type ClientStatusReportData = z.infer<typeof clientStatusReportSchema>
