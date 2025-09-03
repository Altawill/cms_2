const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const { v4: uuidv4 } = require('uuid')
const { body, param, query, validationResult } = require('express-validator')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/tasks')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error, null)
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'))
    }
  }
})

// In-memory storage for demo (replace with actual database)
let tasks = []
let taskUpdates = []
let taskApprovals = []
let taskInvoiceLinks = []

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// Task CRUD Routes
router.get('/sites/:siteId/tasks', [
  param('siteId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { siteId } = req.params
    const siteTasks = tasks.filter(task => task.siteId === siteId)
    
    res.json(siteTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.get('/tasks/:taskId', [
  param('taskId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const task = tasks.find(t => t.id === taskId)
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    res.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ error: 'Failed to fetch task' })
  }
})

router.post('/sites/:siteId/tasks', [
  param('siteId').isString().notEmpty(),
  body('title').isString().notEmpty().trim(),
  body('description').isString().notEmpty().trim(),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('assignedTo').isArray().isLength({ min: 1 }),
  body('dueDate').isISO8601(),
  body('estimatedHours').optional().isFloat({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { siteId } = req.params
    const taskData = req.body
    
    const newTask = {
      id: uuidv4(),
      siteId,
      status: 'NOT_STARTED',
      progress: 0,
      actualHours: 0,
      tags: [],
      attachments: [],
      dependencies: [],
      requiresApproval: false,
      category: 'General',
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    tasks.push(newTask)
    
    res.status(201).json(newTask)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.put('/tasks/:taskId', [
  param('taskId').isString().notEmpty(),
  body('title').optional().isString().notEmpty().trim(),
  body('description').optional().isString().notEmpty().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  body('progress').optional().isFloat({ min: 0, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const updates = req.body
    
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    res.json(tasks[taskIndex])
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/tasks/:taskId', [
  param('taskId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // Also delete related updates, approvals, and invoice links
    taskUpdates = taskUpdates.filter(update => update.taskId !== taskId)
    taskApprovals = taskApprovals.filter(approval => approval.taskId !== taskId)
    taskInvoiceLinks = taskInvoiceLinks.filter(link => link.taskId !== taskId)
    
    tasks.splice(taskIndex, 1)
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

router.patch('/tasks/bulk', [
  body('taskIds').isArray().isLength({ min: 1 }),
  body('updates').isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskIds, updates } = req.body
    
    const updatedTasks = []
    for (const taskId of taskIds) {
      const taskIndex = tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        updatedTasks.push(tasks[taskIndex])
      }
    }
    
    res.json(updatedTasks)
  } catch (error) {
    console.error('Error bulk updating tasks:', error)
    res.status(500).json({ error: 'Failed to bulk update tasks' })
  }
})

// Task Updates Routes
router.get('/tasks/:taskId/updates', [
  param('taskId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const updates = taskUpdates.filter(update => update.taskId === taskId)
    
    res.json(updates)
  } catch (error) {
    console.error('Error fetching task updates:', error)
    res.status(500).json({ error: 'Failed to fetch task updates' })
  }
})

router.post('/tasks/:taskId/updates', [
  param('taskId').isString().notEmpty(),
  body('content').isString().notEmpty().trim(),
  body('author').isString().notEmpty().trim(),
  body('hoursWorked').optional().isFloat({ min: 0 }),
  body('progressPercentage').optional().isFloat({ min: 0, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const updateData = req.body
    
    // Check if task exists
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const newUpdate = {
      id: uuidv4(),
      taskId,
      type: 'PROGRESS',
      attachments: [],
      ...updateData,
      timestamp: new Date().toISOString()
    }
    
    taskUpdates.push(newUpdate)
    
    // Update task progress if provided
    if (updateData.progressPercentage !== undefined) {
      const taskIndex = tasks.findIndex(t => t.id === taskId)
      tasks[taskIndex].progress = updateData.progressPercentage
      tasks[taskIndex].updatedAt = new Date().toISOString()
      
      // Auto-update status based on progress
      if (updateData.progressPercentage === 100) {
        tasks[taskIndex].status = 'COMPLETED'
      } else if (updateData.progressPercentage > 0 && tasks[taskIndex].status === 'NOT_STARTED') {
        tasks[taskIndex].status = 'IN_PROGRESS'
      }
    }
    
    res.status(201).json(newUpdate)
  } catch (error) {
    console.error('Error creating task update:', error)
    res.status(500).json({ error: 'Failed to create task update' })
  }
})

// Task Approvals Routes
router.get('/tasks/:taskId/approvals', [
  param('taskId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const approvals = taskApprovals.filter(approval => approval.taskId === taskId)
    
    res.json(approvals)
  } catch (error) {
    console.error('Error fetching task approvals:', error)
    res.status(500).json({ error: 'Failed to fetch task approvals' })
  }
})

router.get('/approvals/pending', [
  query('userId').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.query
    
    let pendingApprovals = taskApprovals.filter(approval => approval.status === 'PENDING')
    
    if (userId) {
      pendingApprovals = pendingApprovals.filter(approval => 
        approval.assignedTo && approval.assignedTo.includes(userId)
      )
    }
    
    res.json(pendingApprovals)
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    res.status(500).json({ error: 'Failed to fetch pending approvals' })
  }
})

router.post('/approvals/:approvalId/submit', [
  param('approvalId').isString().notEmpty(),
  body('decision').isIn(['APPROVED', 'REJECTED']),
  body('comments').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { approvalId } = req.params
    const { decision, comments } = req.body
    
    const approvalIndex = taskApprovals.findIndex(a => a.id === approvalId)
    if (approvalIndex === -1) {
      return res.status(404).json({ error: 'Approval not found' })
    }
    
    taskApprovals[approvalIndex] = {
      ...taskApprovals[approvalIndex],
      status: decision,
      comments,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user?.id || 'current-user' // From auth middleware
    }
    
    res.json(taskApprovals[approvalIndex])
  } catch (error) {
    console.error('Error submitting approval:', error)
    res.status(500).json({ error: 'Failed to submit approval' })
  }
})

router.post('/tasks/:taskId/request-approval', [
  param('taskId').isString().notEmpty(),
  body('type').isIn(['TASK_COMPLETION', 'BUDGET_APPROVAL', 'DESIGN_APPROVAL', 'QUALITY_CHECK']),
  body('approverRole').isString().notEmpty(),
  body('requestedBy').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const approvalData = req.body
    
    // Check if task exists
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const newApproval = {
      id: uuidv4(),
      taskId,
      status: 'PENDING',
      priority: 'MEDIUM',
      ...approvalData,
      requestedAt: new Date().toISOString()
    }
    
    taskApprovals.push(newApproval)
    
    res.status(201).json(newApproval)
  } catch (error) {
    console.error('Error requesting approval:', error)
    res.status(500).json({ error: 'Failed to request approval' })
  }
})

// Task Invoice Links Routes
router.get('/tasks/:taskId/invoice-links', [
  param('taskId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const invoiceLinks = taskInvoiceLinks.filter(link => link.taskId === taskId)
    
    res.json(invoiceLinks)
  } catch (error) {
    console.error('Error fetching invoice links:', error)
    res.status(500).json({ error: 'Failed to fetch invoice links' })
  }
})

router.post('/tasks/:taskId/invoice-links', [
  param('taskId').isString().notEmpty(),
  body('invoiceId').isString().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('description').optional().isString(),
  body('linkType').isIn(['EXPENSE', 'REVENUE', 'DEPOSIT', 'REFUND'])
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const linkData = req.body
    
    // Check if task exists
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const newLink = {
      id: uuidv4(),
      taskId,
      status: 'ACTIVE',
      ...linkData,
      createdAt: new Date().toISOString()
    }
    
    taskInvoiceLinks.push(newLink)
    
    res.status(201).json(newLink)
  } catch (error) {
    console.error('Error creating invoice link:', error)
    res.status(500).json({ error: 'Failed to create invoice link' })
  }
})

// File Upload Routes
router.post('/tasks/:taskId/attachments', upload.array('files', 10), [
  param('taskId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { taskId } = req.params
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }
    
    // Check if task exists
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const fileUrls = files.map(file => `/uploads/tasks/${file.filename}`)
    
    // Add attachments to task
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    tasks[taskIndex].attachments = [...(tasks[taskIndex].attachments || []), ...fileUrls]
    tasks[taskIndex].updatedAt = new Date().toISOString()
    
    res.json({ fileUrls })
  } catch (error) {
    console.error('Error uploading task files:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

router.post('/task-updates/:updateId/attachments', upload.array('files', 10), [
  param('updateId').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { updateId } = req.params
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }
    
    // Check if update exists
    const updateIndex = taskUpdates.findIndex(u => u.id === updateId)
    if (updateIndex === -1) {
      return res.status(404).json({ error: 'Task update not found' })
    }
    
    const fileUrls = files.map(file => `/uploads/tasks/${file.filename}`)
    
    // Add attachments to update
    taskUpdates[updateIndex].attachments = [...(taskUpdates[updateIndex].attachments || []), ...fileUrls]
    
    res.json({ fileUrls })
  } catch (error) {
    console.error('Error uploading update files:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

// Search and Analytics Routes
router.post('/tasks/search', [
  body('query').isString(),
  body('filters').optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const { query, filters = {} } = req.body
    
    let filteredTasks = tasks
    
    // Text search
    if (query.trim()) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    // Apply filters
    if (filters.siteIds?.length) {
      filteredTasks = filteredTasks.filter(task => filters.siteIds.includes(task.siteId))
    }
    
    if (filters.status?.length) {
      filteredTasks = filteredTasks.filter(task => filters.status.includes(task.status))
    }
    
    if (filters.priority?.length) {
      filteredTasks = filteredTasks.filter(task => filters.priority.includes(task.priority))
    }
    
    if (filters.assignedTo?.length) {
      filteredTasks = filteredTasks.filter(task => 
        task.assignedTo.some(assignee => filters.assignedTo.includes(assignee))
      )
    }
    
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt)
        return taskDate >= startDate && taskDate <= endDate
      })
    }
    
    res.json(filteredTasks)
  } catch (error) {
    console.error('Error searching tasks:', error)
    res.status(500).json({ error: 'Failed to search tasks' })
  }
})

router.get('/tasks/analytics', [
  query('siteId').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { siteId } = req.query
    
    let analyticsData = tasks
    if (siteId) {
      analyticsData = tasks.filter(task => task.siteId === siteId)
    }
    
    const analytics = {
      totalTasks: analyticsData.length,
      completedTasks: analyticsData.filter(t => t.status === 'COMPLETED').length,
      overdueTasks: analyticsData.filter(t => 
        new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
      ).length,
      highPriorityTasks: analyticsData.filter(t => 
        ['HIGH', 'URGENT'].includes(t.priority)
      ).length,
      tasksByStatus: analyticsData.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {}),
      tasksByPriority: analyticsData.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1
        return acc
      }, {}),
      completionTrend: generateCompletionTrend(analyticsData)
    }
    
    res.json(analytics)
  } catch (error) {
    console.error('Error fetching task analytics:', error)
    res.status(500).json({ error: 'Failed to fetch task analytics' })
  }
})

// Report Generation Routes
router.post('/sites/:siteId/reports/progress', [
  param('siteId').isString().notEmpty(),
  body('format').isIn(['PDF', 'EXCEL']),
  body('language').isIn(['EN', 'AR']),
  body('dateRange').optional().isObject(),
  body('includeFinancials').optional().isBoolean(),
  body('includePhotos').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { siteId } = req.params
    const options = req.body
    
    // Check if site has tasks
    const siteTasks = tasks.filter(task => task.siteId === siteId)
    if (siteTasks.length === 0) {
      return res.status(404).json({ error: 'No tasks found for this site' })
    }
    
    // For now, return a mock response
    // In production, this would generate actual PDF/Excel files
    const filename = `site-progress-${siteId}-${new Date().toISOString().split('T')[0]}.${options.format.toLowerCase()}`
    
    // Create mock file content
    const mockContent = JSON.stringify({
      message: 'Site Progress Report',
      siteId,
      generatedAt: new Date().toISOString(),
      taskCount: siteTasks.length,
      options
    }, null, 2)
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', options.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(Buffer.from(mockContent))
  } catch (error) {
    console.error('Error generating site progress report:', error)
    res.status(500).json({ error: 'Failed to generate site progress report' })
  }
})

router.post('/sites/:siteId/reports/client-status', [
  param('siteId').isString().notEmpty(),
  body('format').isIn(['PDF', 'EXCEL']),
  body('language').isIn(['EN', 'AR']),
  body('templateStyle').optional().isIn(['professional', 'detailed', 'summary'])
], handleValidationErrors, async (req, res) => {
  try {
    const { siteId } = req.params
    const options = req.body
    
    // Check if site has tasks
    const siteTasks = tasks.filter(task => task.siteId === siteId)
    if (siteTasks.length === 0) {
      return res.status(404).json({ error: 'No tasks found for this site' })
    }
    
    const filename = `client-status-${siteId}-${new Date().toISOString().split('T')[0]}.${options.format.toLowerCase()}`
    
    // Create mock file content
    const mockContent = JSON.stringify({
      message: 'Client Status Report',
      siteId,
      generatedAt: new Date().toISOString(),
      taskCount: siteTasks.length,
      options
    }, null, 2)
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', options.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(Buffer.from(mockContent))
  } catch (error) {
    console.error('Error generating client status report:', error)
    res.status(500).json({ error: 'Failed to generate client status report' })
  }
})

router.post('/sites/:siteId/tasks/export', [
  param('siteId').isString().notEmpty(),
  body('language').isIn(['EN', 'AR']),
  body('filters').optional().isObject(),
  body('includeUpdates').optional().isBoolean(),
  body('includeApprovals').optional().isBoolean(),
  body('includeFinancials').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { siteId } = req.params
    const options = req.body
    
    // Get filtered tasks
    let siteTasks = tasks.filter(task => task.siteId === siteId)
    
    // Apply filters if provided
    if (options.filters) {
      if (options.filters.status?.length) {
        siteTasks = siteTasks.filter(task => options.filters.status.includes(task.status))
      }
      if (options.filters.priority?.length) {
        siteTasks = siteTasks.filter(task => options.filters.priority.includes(task.priority))
      }
      if (options.filters.dateRange) {
        const startDate = new Date(options.filters.dateRange.start)
        const endDate = new Date(options.filters.dateRange.end)
        siteTasks = siteTasks.filter(task => {
          const taskDate = new Date(task.createdAt)
          return taskDate >= startDate && taskDate <= endDate
        })
      }
    }
    
    const filename = `task-export-${siteId}-${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Create mock Excel content
    const mockContent = JSON.stringify({
      message: 'Task Data Export',
      siteId,
      generatedAt: new Date().toISOString(),
      taskCount: siteTasks.length,
      tasks: siteTasks,
      options
    }, null, 2)
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(Buffer.from(mockContent))
  } catch (error) {
    console.error('Error exporting task data:', error)
    res.status(500).json({ error: 'Failed to export task data' })
  }
})

// Delete attachment route
router.delete('/attachments', [
  body('attachmentUrl').isString().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { attachmentUrl } = req.body
    
    // Extract filename from URL
    const filename = path.basename(attachmentUrl)
    const filePath = path.join(__dirname, '../../../uploads/tasks', filename)
    
    // Delete file from filesystem
    try {
      await fs.unlink(filePath)
    } catch (fsError) {
      console.warn('File not found on filesystem:', filename)
    }
    
    // Remove from all tasks and updates
    tasks.forEach(task => {
      if (task.attachments) {
        task.attachments = task.attachments.filter(url => url !== attachmentUrl)
      }
    })
    
    taskUpdates.forEach(update => {
      if (update.attachments) {
        update.attachments = update.attachments.filter(url => url !== attachmentUrl)
      }
    })
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting attachment:', error)
    res.status(500).json({ error: 'Failed to delete attachment' })
  }
})

// Helper function to generate completion trend data
function generateCompletionTrend(tasks) {
  const last30Days = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const completedOnDate = tasks.filter(task => {
      const completedDate = task.updatedAt?.split('T')[0]
      return task.status === 'COMPLETED' && completedDate === dateStr
    }).length
    
    last30Days.push({
      date: dateStr,
      completed: completedOnDate
    })
  }
  
  return last30Days
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Route error:', error)
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' })
    }
  }
  
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = router
