import * as XLSX from 'xlsx'
import type { SiteTask } from '../components/sites/tasks/SiteTasks'
import type { Site } from '../components/SiteManagement'
import type { TaskApproval } from '../components/sites/tasks/ApprovalWorkflow'

export interface ExcelExportConfig {
  language: 'en' | 'ar'
  includeFormulas: boolean
  includeCharts: boolean
  includeFormatting: boolean
  sheetNames: {
    summary?: string
    tasks?: string
    approvals?: string
    timeline?: string
    categories?: string
  }
}

export interface ExportFilter {
  status?: string[]
  category?: string[]
  priority?: string[]
  assignedTo?: string[]
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export class ExcelExporter {
  private config: ExcelExportConfig
  private workbook: XLSX.WorkBook

  constructor(config: ExcelExportConfig) {
    this.config = config
    this.workbook = XLSX.utils.book_new()
  }

  // Export comprehensive site report with multiple sheets
  exportSiteReport(
    site: Site, 
    tasks: SiteTask[], 
    approvals: TaskApproval[], 
    filter?: ExportFilter
  ): string {
    const filteredTasks = this.filterTasks(tasks, filter)
    
    // Create worksheets
    this.addSummarySheet(site, filteredTasks, approvals)
    this.addTasksSheet(filteredTasks)
    this.addApprovalsSheet(approvals)
    this.addCategoryAnalysisSheet(filteredTasks)
    this.addTimelineSheet(filteredTasks)

    // Generate and return blob URL
    const wbout = XLSX.write(this.workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: this.config.includeFormatting
    })
    
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    return URL.createObjectURL(blob)
  }

  // Export tasks only (simple export)
  exportTasksOnly(tasks: SiteTask[], filter?: ExportFilter): string {
    const filteredTasks = this.filterTasks(tasks, filter)
    this.addTasksSheet(filteredTasks)

    const wbout = XLSX.write(this.workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: this.config.includeFormatting
    })
    
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    return URL.createObjectURL(blob)
  }

  // Export approvals only
  exportApprovalsOnly(approvals: TaskApproval[]): string {
    this.addApprovalsSheet(approvals)

    const wbout = XLSX.write(this.workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: this.config.includeFormatting
    })
    
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    return URL.createObjectURL(blob)
  }

  private filterTasks(tasks: SiteTask[], filter?: ExportFilter): SiteTask[] {
    if (!filter) return tasks

    return tasks.filter(task => {
      // Status filter
      if (filter.status && filter.status.length > 0 && !filter.status.includes(task.status)) {
        return false
      }

      // Category filter
      if (filter.category && filter.category.length > 0 && !filter.category.includes(task.category)) {
        return false
      }

      // Priority filter
      if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
        return false
      }

      // Assigned to filter
      if (filter.assignedTo && filter.assignedTo.length > 0 && !filter.assignedTo.includes(task.assignedTo)) {
        return false
      }

      // Date range filter
      if (filter.dateRange) {
        const taskDate = new Date(task.createdAt)
        const startDate = new Date(filter.dateRange.startDate)
        const endDate = new Date(filter.dateRange.endDate)
        if (taskDate < startDate || taskDate > endDate) {
          return false
        }
      }

      return true
    })
  }

  private addSummarySheet(site: Site, tasks: SiteTask[], approvals: TaskApproval[]) {
    const sheetName = this.config.sheetNames.summary || this.getTranslation('summary')
    
    // Calculate summary statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const notStartedTasks = tasks.filter(t => t.status === 'not-started').length
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && new Date(t.dueDate) < new Date()
    ).length

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const avgProgress = totalTasks > 0 
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
      : 0

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)

    // Create summary data
    const summaryData = [
      [this.getTranslation('siteInformation'), ''],
      [this.getTranslation('siteName'), site.name],
      [this.getTranslation('location'), site.location],
      [this.getTranslation('projectType'), site.type],
      [this.getTranslation('startDate'), new Date(site.startDate).toLocaleDateString()],
      [this.getTranslation('status'), this.getTranslation(site.status)],
      ['', ''],
      [this.getTranslation('taskStatistics'), ''],
      [this.getTranslation('totalTasks'), totalTasks],
      [this.getTranslation('completedTasks'), completedTasks],
      [this.getTranslation('inProgressTasks'), inProgressTasks],
      [this.getTranslation('notStartedTasks'), notStartedTasks],
      [this.getTranslation('overdueTasks'), overdueTasks],
      [this.getTranslation('completionRate'), `${completionRate}%`],
      [this.getTranslation('avgProgress'), `${avgProgress}%`],
      ['', ''],
      [this.getTranslation('timeTracking'), ''],
      [this.getTranslation('estimatedHours'), totalEstimatedHours],
      [this.getTranslation('actualHours'), totalActualHours],
      [this.getTranslation('variance'), totalActualHours - totalEstimatedHours],
      ['', ''],
      [this.getTranslation('approvalStatistics'), ''],
      [this.getTranslation('totalApprovals'), approvals.length],
      [this.getTranslation('pendingApprovals'), approvals.filter(a => a.status === 'pending').length],
      [this.getTranslation('approvedRequests'), approvals.filter(a => a.status === 'approved').length],
      [this.getTranslation('rejectedRequests'), approvals.filter(a => a.status === 'rejected').length]
    ]

    const ws = XLSX.utils.aoa_to_sheet(summaryData)
    
    // Apply formatting if enabled
    if (this.config.includeFormatting) {
      this.formatSummarySheet(ws)
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, sheetName)
  }

  private addTasksSheet(tasks: SiteTask[]) {
    const sheetName = this.config.sheetNames.tasks || this.getTranslation('tasks')
    
    // Create headers
    const headers = [
      this.getTranslation('id'),
      this.getTranslation('title'),
      this.getTranslation('description'),
      this.getTranslation('category'),
      this.getTranslation('status'),
      this.getTranslation('priority'),
      this.getTranslation('assignedTo'),
      this.getTranslation('progress'),
      this.getTranslation('estimatedHours'),
      this.getTranslation('actualHours'),
      this.getTranslation('createdAt'),
      this.getTranslation('dueDate'),
      this.getTranslation('completedDate'),
      this.getTranslation('lastUpdated')
    ]

    // Create task data
    const taskData = tasks.map(task => [
      task.id,
      task.title,
      task.description,
      this.getTranslation(task.category),
      this.getTranslation(task.status),
      this.getTranslation(task.priority),
      task.assignedTo,
      task.progress,
      task.estimatedHours,
      task.actualHours || 0,
      new Date(task.createdAt).toLocaleDateString(),
      new Date(task.dueDate).toLocaleDateString(),
      task.completedDate ? new Date(task.completedDate).toLocaleDateString() : '',
      new Date(task.updatedAt).toLocaleDateString()
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...taskData])
    
    // Apply formatting if enabled
    if (this.config.includeFormatting) {
      this.formatTasksSheet(ws, tasks.length)
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, sheetName)
  }

  private addApprovalsSheet(approvals: TaskApproval[]) {
    const sheetName = this.config.sheetNames.approvals || this.getTranslation('approvals')
    
    // Create headers
    const headers = [
      this.getTranslation('id'),
      this.getTranslation('taskId'),
      this.getTranslation('taskTitle'),
      this.getTranslation('requestType'),
      this.getTranslation('status'),
      this.getTranslation('requestedBy'),
      this.getTranslation('approvedBy'),
      this.getTranslation('reason'),
      this.getTranslation('oldValue'),
      this.getTranslation('newValue'),
      this.getTranslation('requestDate'),
      this.getTranslation('responseDate'),
      this.getTranslation('comments')
    ]

    // Create approval data
    const approvalData = approvals.map(approval => [
      approval.id,
      approval.taskId,
      approval.taskTitle,
      this.getTranslation(approval.type),
      this.getTranslation(approval.status),
      approval.requestedBy,
      approval.approvedBy || '',
      approval.reason,
      approval.oldValue,
      approval.newValue,
      new Date(approval.requestDate).toLocaleDateString(),
      approval.responseDate ? new Date(approval.responseDate).toLocaleDateString() : '',
      approval.comments || ''
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...approvalData])
    
    // Apply formatting if enabled
    if (this.config.includeFormatting) {
      this.formatApprovalsSheet(ws, approvals.length)
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, sheetName)
  }

  private addCategoryAnalysisSheet(tasks: SiteTask[]) {
    const sheetName = this.config.sheetNames.categories || this.getTranslation('categoryAnalysis')
    
    // Calculate category statistics
    const categories = ['construction', 'safety', 'inspection', 'maintenance', 'planning', 'other']
    const categoryData = categories.map(category => {
      const categoryTasks = tasks.filter(t => t.category === category)
      const completed = categoryTasks.filter(t => t.status === 'completed').length
      const inProgress = categoryTasks.filter(t => t.status === 'in-progress').length
      const notStarted = categoryTasks.filter(t => t.status === 'not-started').length
      const overdue = categoryTasks.filter(t => 
        t.status !== 'completed' && new Date(t.dueDate) < new Date()
      ).length
      const avgProgress = categoryTasks.length > 0 
        ? Math.round(categoryTasks.reduce((sum, t) => sum + t.progress, 0) / categoryTasks.length)
        : 0
      const totalHours = categoryTasks.reduce((sum, t) => sum + t.estimatedHours, 0)

      return [
        this.getTranslation(category),
        categoryTasks.length,
        completed,
        inProgress,
        notStarted,
        overdue,
        `${Math.round((completed / (categoryTasks.length || 1)) * 100)}%`,
        `${avgProgress}%`,
        totalHours
      ]
    }).filter(([_, total]) => (total as number) > 0) // Only include categories with tasks

    const headers = [
      this.getTranslation('category'),
      this.getTranslation('totalTasks'),
      this.getTranslation('completed'),
      this.getTranslation('inProgress'),
      this.getTranslation('notStarted'),
      this.getTranslation('overdue'),
      this.getTranslation('completionRate'),
      this.getTranslation('avgProgress'),
      this.getTranslation('totalHours')
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...categoryData])
    
    // Apply formatting if enabled
    if (this.config.includeFormatting) {
      this.formatCategorySheet(ws, categoryData.length)
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, sheetName)
  }

  private addTimelineSheet(tasks: SiteTask[]) {
    const sheetName = this.config.sheetNames.timeline || this.getTranslation('timeline')
    
    // Generate timeline data (last 30 days)
    const timelineData: Array<[string, number, number, number, number]> = []
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTasks = tasks.filter(t => 
        t.completedDate === dateStr || 
        t.updatedAt.startsWith(dateStr) ||
        t.createdAt.startsWith(dateStr)
      )
      
      const completed = dayTasks.filter(t => t.status === 'completed').length
      const created = dayTasks.filter(t => t.createdAt.startsWith(dateStr)).length
      const updated = dayTasks.filter(t => t.updatedAt.startsWith(dateStr)).length
      const avgProgress = dayTasks.length > 0 
        ? Math.round(dayTasks.reduce((sum, t) => sum + t.progress, 0) / dayTasks.length)
        : 0

      timelineData.push([
        date.toLocaleDateString(),
        created,
        updated,
        completed,
        avgProgress
      ])
    }

    const headers = [
      this.getTranslation('date'),
      this.getTranslation('tasksCreated'),
      this.getTranslation('tasksUpdated'),
      this.getTranslation('tasksCompleted'),
      this.getTranslation('avgProgress')
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...timelineData])
    
    // Apply formatting if enabled
    if (this.config.includeFormatting) {
      this.formatTimelineSheet(ws, timelineData.length)
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, sheetName)
  }

  private formatSummarySheet(ws: XLSX.WorkSheet) {
    // Set column widths
    ws['!cols'] = [
      { width: 25 },
      { width: 30 }
    ]

    // Apply header styling
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let i = 0; i <= range.e.r; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 })
      if (ws[cellRef] && ws[cellRef].v && typeof ws[cellRef].v === 'string') {
        const value = ws[cellRef].v as string
        if (value.includes('Information') || value.includes('Statistics') || value.includes('Tracking')) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
            alignment: { horizontal: 'center' }
          }
        }
      }
    }
  }

  private formatTasksSheet(ws: XLSX.WorkSheet, taskCount: number) {
    // Set column widths
    ws['!cols'] = [
      { width: 10 }, // ID
      { width: 30 }, // Title
      { width: 40 }, // Description
      { width: 15 }, // Category
      { width: 15 }, // Status
      { width: 10 }, // Priority
      { width: 20 }, // Assigned To
      { width: 10 }, // Progress
      { width: 12 }, // Est Hours
      { width: 12 }, // Actual Hours
      { width: 12 }, // Created
      { width: 12 }, // Due Date
      { width: 12 }, // Completed
      { width: 12 }  // Updated
    ]

    // Format header row
    for (let i = 0; i < 14; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2E75B6' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Format status cells with colors
    for (let i = 1; i <= taskCount; i++) {
      const statusCellRef = XLSX.utils.encode_cell({ r: i, c: 4 })
      const progressCellRef = XLSX.utils.encode_cell({ r: i, c: 7 })
      
      if (ws[statusCellRef]) {
        const status = ws[statusCellRef].v as string
        let fillColor = 'FFFFFF'
        
        switch (status) {
          case 'Completed':
          case 'مكتمل':
            fillColor = 'C6EFCE'
            break
          case 'In Progress':
          case 'قيد التنفيذ':
            fillColor = 'BDD7EE'
            break
          case 'Not Started':
          case 'لم تبدأ':
            fillColor = 'F2F2F2'
            break
          case 'On Hold':
          case 'متوقفة':
            fillColor = 'FFE699'
            break
        }
        
        ws[statusCellRef].s = {
          fill: { fgColor: { rgb: fillColor } },
          alignment: { horizontal: 'center' }
        }
      }

      // Format progress cells
      if (ws[progressCellRef]) {
        const progress = ws[progressCellRef].v as number
        let fillColor = 'FFFFFF'
        
        if (progress >= 75) fillColor = 'C6EFCE'
        else if (progress >= 50) fillColor = 'FFEB9C'
        else if (progress >= 25) fillColor = 'FFC7CE'
        else fillColor = 'F2F2F2'
        
        ws[progressCellRef].s = {
          fill: { fgColor: { rgb: fillColor } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Auto-filter
    ws['!autofilter'] = { ref: `A1:N${taskCount + 1}` }
  }

  private formatApprovalsSheet(ws: XLSX.WorkSheet, approvalCount: number) {
    // Set column widths
    ws['!cols'] = [
      { width: 10 }, // ID
      { width: 10 }, // Task ID
      { width: 30 }, // Task Title
      { width: 20 }, // Request Type
      { width: 15 }, // Status
      { width: 20 }, // Requested By
      { width: 20 }, // Approved By
      { width: 30 }, // Reason
      { width: 20 }, // Old Value
      { width: 20 }, // New Value
      { width: 12 }, // Request Date
      { width: 12 }, // Response Date
      { width: 40 }  // Comments
    ]

    // Format header row
    for (let i = 0; i < 13; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '70AD47' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Format status cells
    for (let i = 1; i <= approvalCount; i++) {
      const statusCellRef = XLSX.utils.encode_cell({ r: i, c: 4 })
      
      if (ws[statusCellRef]) {
        const status = ws[statusCellRef].v as string
        let fillColor = 'FFFFFF'
        
        switch (status) {
          case 'Approved':
          case 'موافق عليه':
            fillColor = 'C6EFCE'
            break
          case 'Rejected':
          case 'مرفوض':
            fillColor = 'FFC7CE'
            break
          case 'Pending':
          case 'معلق':
            fillColor = 'FFEB9C'
            break
        }
        
        ws[statusCellRef].s = {
          fill: { fgColor: { rgb: fillColor } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Auto-filter
    ws['!autofilter'] = { ref: `A1:M${approvalCount + 1}` }
  }

  private formatCategorySheet(ws: XLSX.WorkSheet, categoryCount: number) {
    // Set column widths
    ws['!cols'] = [
      { width: 20 }, // Category
      { width: 12 }, // Total
      { width: 12 }, // Completed
      { width: 12 }, // In Progress
      { width: 12 }, // Not Started
      { width: 12 }, // Overdue
      { width: 15 }, // Completion Rate
      { width: 15 }, // Avg Progress
      { width: 12 }  // Total Hours
    ]

    // Format header row
    for (let i = 0; i < 9; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'E7E6E6' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Add formulas if enabled
    if (this.config.includeFormulas && categoryCount > 0) {
      // Add totals row
      const totalRow = categoryCount + 2
      ws[XLSX.utils.encode_cell({ r: totalRow, c: 0 })] = { 
        v: this.getTranslation('total'), 
        s: { font: { bold: true } }
      }
      
      for (let col = 1; col < 9; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: totalRow, c: col })
        const rangeRef = `${XLSX.utils.encode_col(col)}2:${XLSX.utils.encode_col(col)}${categoryCount + 1}`
        
        if (col < 6 || col === 8) { // Sum columns
          ws[cellRef] = { f: `SUM(${rangeRef})`, s: { font: { bold: true } } }
        } else { // Average columns
          ws[cellRef] = { f: `AVERAGE(${rangeRef})`, s: { font: { bold: true } } }
        }
      }
    }
  }

  private formatTimelineSheet(ws: XLSX.WorkSheet, timelineCount: number) {
    // Set column widths
    ws['!cols'] = [
      { width: 12 }, // Date
      { width: 15 }, // Created
      { width: 15 }, // Updated
      { width: 15 }, // Completed
      { width: 15 }  // Avg Progress
    ]

    // Format header row
    for (let i = 0; i < 5; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '9966CC' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Format data cells
    for (let i = 1; i <= timelineCount; i++) {
      for (let j = 1; j < 5; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j })
        if (ws[cellRef]) {
          ws[cellRef].s = {
            alignment: { horizontal: 'center' }
          }
        }
      }
    }
  }

  private getTranslation(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      en: {
        summary: 'Summary',
        tasks: 'Tasks',
        approvals: 'Approvals',
        categoryAnalysis: 'Category Analysis',
        timeline: 'Timeline',
        siteInformation: 'Site Information',
        siteName: 'Site Name',
        location: 'Location',
        projectType: 'Project Type',
        startDate: 'Start Date',
        status: 'Status',
        taskStatistics: 'Task Statistics',
        totalTasks: 'Total Tasks',
        completedTasks: 'Completed Tasks',
        inProgressTasks: 'In Progress Tasks',
        notStartedTasks: 'Not Started Tasks',
        overdueTasks: 'Overdue Tasks',
        completionRate: 'Completion Rate',
        avgProgress: 'Average Progress',
        timeTracking: 'Time Tracking',
        estimatedHours: 'Estimated Hours',
        actualHours: 'Actual Hours',
        variance: 'Variance',
        approvalStatistics: 'Approval Statistics',
        totalApprovals: 'Total Approvals',
        pendingApprovals: 'Pending Approvals',
        approvedRequests: 'Approved Requests',
        rejectedRequests: 'Rejected Requests',
        id: 'ID',
        title: 'Title',
        description: 'Description',
        category: 'Category',
        priority: 'Priority',
        assignedTo: 'Assigned To',
        progress: 'Progress (%)',
        createdAt: 'Created Date',
        dueDate: 'Due Date',
        completedDate: 'Completed Date',
        lastUpdated: 'Last Updated',
        taskId: 'Task ID',
        taskTitle: 'Task Title',
        requestType: 'Request Type',
        requestedBy: 'Requested By',
        approvedBy: 'Approved By',
        reason: 'Reason',
        oldValue: 'Old Value',
        newValue: 'New Value',
        requestDate: 'Request Date',
        responseDate: 'Response Date',
        comments: 'Comments',
        date: 'Date',
        tasksCreated: 'Tasks Created',
        tasksUpdated: 'Tasks Updated',
        tasksCompleted: 'Tasks Completed',
        totalHours: 'Total Hours',
        total: 'Total',
        completed: 'Completed',
        inProgress: 'In Progress',
        notStarted: 'Not Started',
        overdue: 'Overdue',
        // Status translations
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'on-hold': 'On Hold',
        cancelled: 'Cancelled',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        // Category translations
        construction: 'Construction',
        safety: 'Safety',
        inspection: 'Inspection',
        maintenance: 'Maintenance',
        planning: 'Planning',
        other: 'Other',
        // Priority translations
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
        // Approval types
        'task-completion': 'Task Completion',
        'scope-change': 'Scope Change',
        'budget-change': 'Budget Change',
        'deadline-extension': 'Deadline Extension',
        'assignment-change': 'Assignment Change',
        // Site status
        active: 'Active',
        'site-planning': 'Planning',
        'site-completed': 'Completed'
      },
      ar: {
        summary: 'الملخص',
        tasks: 'المهام',
        approvals: 'الموافقات',
        categoryAnalysis: 'تحليل الفئات',
        timeline: 'الجدول الزمني',
        siteInformation: 'معلومات الموقع',
        siteName: 'اسم الموقع',
        location: 'الموقع',
        projectType: 'نوع المشروع',
        startDate: 'تاريخ البداية',
        status: 'الحالة',
        taskStatistics: 'إحصائيات المهام',
        totalTasks: 'إجمالي المهام',
        completedTasks: 'المهام المكتملة',
        inProgressTasks: 'المهام قيد التنفيذ',
        notStartedTasks: 'المهام غير المبدأة',
        overdueTasks: 'المهام المتأخرة',
        completionRate: 'معدل الإنجاز',
        avgProgress: 'متوسط التقدم',
        timeTracking: 'تتبع الوقت',
        estimatedHours: 'الساعات المقدرة',
        actualHours: 'الساعات الفعلية',
        variance: 'التباين',
        approvalStatistics: 'إحصائيات الموافقات',
        totalApprovals: 'إجمالي الموافقات',
        pendingApprovals: 'الموافقات المعلقة',
        approvedRequests: 'الطلبات المعتمدة',
        rejectedRequests: 'الطلبات المرفوضة',
        id: 'المعرف',
        title: 'العنوان',
        description: 'الوصف',
        category: 'الفئة',
        priority: 'الأولوية',
        assignedTo: 'مُكلف إلى',
        progress: 'التقدم (%)',
        createdAt: 'تاريخ الإنشاء',
        dueDate: 'تاريخ الاستحقاق',
        completedDate: 'تاريخ الإكمال',
        lastUpdated: 'آخر تحديث',
        taskId: 'معرف المهمة',
        taskTitle: 'عنوان المهمة',
        requestType: 'نوع الطلب',
        requestedBy: 'طلب من قبل',
        approvedBy: 'معتمد من قبل',
        reason: 'السبب',
        oldValue: 'القيمة القديمة',
        newValue: 'القيمة الجديدة',
        requestDate: 'تاريخ الطلب',
        responseDate: 'تاريخ الرد',
        comments: 'التعليقات',
        date: 'التاريخ',
        tasksCreated: 'المهام المُنشأة',
        tasksUpdated: 'المهام المُحدثة',
        tasksCompleted: 'المهام المكتملة',
        totalHours: 'إجمالي الساعات',
        total: 'الإجمالي',
        completed: 'مكتمل',
        inProgress: 'قيد التنفيذ',
        notStarted: 'لم تبدأ',
        overdue: 'متأخر',
        // Status translations
        'not-started': 'لم تبدأ',
        'in-progress': 'قيد التنفيذ',
        'on-hold': 'متوقفة',
        cancelled: 'ملغية',
        pending: 'معلق',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        // Category translations
        construction: 'إنشاءات',
        safety: 'سلامة',
        inspection: 'تفتيش',
        maintenance: 'صيانة',
        planning: 'تخطيط',
        other: 'أخرى',
        // Priority translations
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        critical: 'حرجة',
        // Approval types
        'task-completion': 'إكمال المهمة',
        'scope-change': 'تغيير النطاق',
        'budget-change': 'تغيير الميزانية',
        'deadline-extension': 'تمديد الموعد النهائي',
        'assignment-change': 'تغيير التكليف',
        // Site status
        active: 'نشط',
        'site-planning': 'تخطيط',
        'site-completed': 'مكتمل'
      }
    }

    return translations[this.config.language]?.[key] || key
  }
}

// Utility functions for easy export
export function downloadTasksAsExcel(
  tasks: SiteTask[], 
  filename: string, 
  config: Partial<ExcelExportConfig> = {},
  filter?: ExportFilter
) {
  const exporter = new ExcelExporter({
    language: 'en',
    includeFormulas: true,
    includeCharts: false,
    includeFormatting: true,
    sheetNames: {},
    ...config
  })

  const url = exporter.exportTasksOnly(tasks, filter)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the blob URL
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function downloadSiteReportAsExcel(
  site: Site,
  tasks: SiteTask[],
  approvals: TaskApproval[],
  filename: string,
  config: Partial<ExcelExportConfig> = {},
  filter?: ExportFilter
) {
  const exporter = new ExcelExporter({
    language: 'en',
    includeFormulas: true,
    includeCharts: false,
    includeFormatting: true,
    sheetNames: {},
    ...config
  })

  const url = exporter.exportSiteReport(site, tasks, approvals, filter)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the blob URL
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
