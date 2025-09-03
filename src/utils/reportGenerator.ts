import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { SiteTask } from '../components/sites/tasks/SiteTasks'
import type { Site } from '../components/SiteManagement'
import type { TaskApproval } from '../components/sites/tasks/ApprovalWorkflow'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ReportConfig {
  language: 'en' | 'ar'
  theme: 'light' | 'dark'
  includeLogo: boolean
  includeSignatures: boolean
  includeTimestamp: boolean
  customBranding?: {
    companyName: string
    logo?: string
    address: string
    phone: string
    email: string
  }
}

export interface SiteProgressReportData {
  site: Site
  tasks: SiteTask[]
  approvals: TaskApproval[]
  reportPeriod: {
    startDate: string
    endDate: string
  }
  summary: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
    avgProgressPercentage: number
    totalEstimatedHours: number
    totalActualHours: number
  }
  categoryBreakdown: Record<string, {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }>
  priorityBreakdown: Record<string, number>
  timeline: Array<{
    date: string
    tasksCompleted: number
    totalProgress: number
  }>
}

export interface ClientStatusReportData {
  site: Site
  tasks: SiteTask[]
  clientInfo: {
    name: string
    contactPerson: string
    email: string
    phone: string
  }
  projectMilestones: Array<{
    id: string
    title: string
    dueDate: string
    status: 'pending' | 'in-progress' | 'completed' | 'delayed'
    progress: number
    description: string
    relatedTasks: string[]
  }>
  financialSummary: {
    totalBudget: number
    spentAmount: number
    remainingBudget: number
    invoicedAmount: number
    pendingInvoices: number
  }
  upcomingDeadlines: Array<{
    taskId: string
    title: string
    dueDate: string
    priority: string
    assignedTo: string
  }>
  issues: Array<{
    id: string
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    status: 'open' | 'in-progress' | 'resolved'
    reportedDate: string
  }>
}

export class PDFReportGenerator {
  private doc: jsPDF
  private config: ReportConfig
  private currentY: number = 20
  private pageWidth: number
  private pageHeight: number
  private margin: number = 20

  constructor(config: ReportConfig) {
    this.config = config
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    
    // Set up fonts for Arabic support if needed
    if (config.language === 'ar') {
      // In a real app, you would load Arabic fonts here
      this.doc.setFont('Arial', 'normal')
    }
  }

  // Generate Site Progress Report
  generateSiteProgressReport(data: SiteProgressReportData): string {
    this.addHeader(data.site.name, this.getTranslation('siteProgressReport'))
    this.addSiteInfo(data.site)
    this.addReportSummary(data.summary)
    this.addCategoryBreakdown(data.categoryBreakdown)
    this.addTasksTable(data.tasks)
    this.addTimeline(data.timeline)
    this.addFooter()
    
    return this.doc.output('datauristring')
  }

  // Generate Client Status Report
  generateClientStatusReport(data: ClientStatusReportData): string {
    this.addHeader(data.site.name, this.getTranslation('clientStatusReport'))
    this.addClientInfo(data.clientInfo)
    this.addProjectOverview(data.site, data.tasks)
    this.addMilestones(data.projectMilestones)
    this.addFinancialSummary(data.financialSummary)
    this.addUpcomingDeadlines(data.upcomingDeadlines)
    this.addIssuesSection(data.issues)
    this.addFooter()
    
    return this.doc.output('datauristring')
  }

  private addHeader(siteName: string, reportTitle: string) {
    const isArabic = this.config.language === 'ar'
    
    // Add professional header border
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 60)
    
    // Header background
    this.doc.setFillColor(248, 249, 250)
    this.doc.rect(this.margin + 0.5, this.currentY + 0.5, this.pageWidth - 2 * this.margin - 1, 59, 'F')
    
    this.currentY += 5
    
    // Add logo section with border
    if (this.config.includeLogo) {
      const logoX = isArabic ? this.pageWidth - this.margin - 45 : this.margin + 5
      
      // Logo border
      this.doc.setDrawColor(200, 200, 200)
      this.doc.rect(logoX, this.currentY, 40, 25)
      
      // Logo placeholder with professional styling
      this.doc.setFillColor(255, 255, 255)
      this.doc.rect(logoX + 1, this.currentY + 1, 38, 23, 'F')
      
      this.doc.setFontSize(10)
      this.doc.setFont('Arial', 'bold')
      this.doc.setTextColor(100, 100, 100)
      this.doc.text('COMPANY', logoX + 20, this.currentY + 12, { align: 'center' })
      this.doc.text('LOGO', logoX + 20, this.currentY + 18, { align: 'center' })
    }

    // Company branding with professional layout
    if (this.config.customBranding) {
      const textX = isArabic 
        ? this.pageWidth - this.margin - 10
        : this.margin + (this.config.includeLogo ? 55 : 10)
      
      // Company name
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(16)
      this.doc.setFont('Arial', 'bold')
      this.doc.text(
        this.config.customBranding.companyName,
        textX,
        this.currentY + 8,
        { align: isArabic ? 'right' : 'left' }
      )
      
      // Contact information
      this.doc.setFontSize(9)
      this.doc.setFont('Arial', 'normal')
      this.doc.setTextColor(60, 60, 60)
      
      const contactInfo = [
        this.config.customBranding.address,
        `Tel: ${this.config.customBranding.phone}`,
        `Email: ${this.config.customBranding.email}`
      ]
      
      contactInfo.forEach((info, index) => {
        this.doc.text(
          info,
          textX,
          this.currentY + 18 + (index * 6),
          { align: isArabic ? 'right' : 'left' }
        )
      })
    }

    this.currentY += 65

    // Report title with enhanced styling
    this.doc.setFillColor(52, 73, 94)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F')
    
    this.doc.setFontSize(20)
    this.doc.setFont('Arial', 'bold')
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(
      reportTitle,
      this.pageWidth / 2,
      this.currentY + 13,
      { align: 'center' }
    )

    this.currentY += 25

    // Site name with background
    this.doc.setFillColor(236, 240, 241)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 'F')
    this.doc.setDrawColor(189, 195, 199)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15)
    
    this.doc.setFontSize(14)
    this.doc.setFont('Arial', 'bold')
    this.doc.setTextColor(44, 62, 80)
    this.doc.text(
      `${this.getTranslation('project')}: ${siteName}`,
      this.pageWidth / 2,
      this.currentY + 10,
      { align: 'center' }
    )

    this.currentY += 20

    // Timestamp and report info
    if (this.config.includeTimestamp) {
      this.doc.setFontSize(10)
      this.doc.setTextColor(128, 128, 128)
      this.doc.setFont('Arial', 'normal')
      
      const timestamp = new Date().toLocaleString(this.config.language === 'ar' ? 'ar-SA' : 'en-US')
      const reportInfo = `${this.getTranslation('generatedOn')}: ${timestamp}`
      
      this.doc.text(
        reportInfo,
        this.pageWidth / 2,
        this.currentY,
        { align: 'center' }
      )
      this.currentY += 8
    }

    // Add professional separator
    this.doc.setDrawColor(52, 73, 94)
    this.doc.setLineWidth(0.8)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15
  }

  private addSiteInfo(site: Site) {
    // Section header
    this.addSectionHeader(this.getTranslation('siteInformation'))
    
    // Site information box with professional styling
    const boxHeight = 35
    const boxY = this.currentY
    
    // Main border
    this.doc.setDrawColor(52, 73, 94)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight)
    
    // Background
    this.doc.setFillColor(250, 251, 252)
    this.doc.rect(this.margin + 0.5, boxY + 0.5, this.pageWidth - 2 * this.margin - 1, boxHeight - 1, 'F')
    
    this.currentY += 5
    
    // Site info in two columns
    const leftColX = this.margin + 10
    const rightColX = this.pageWidth / 2 + 10
    
    this.doc.setFontSize(10)
    this.doc.setFont('Arial', 'normal')
    this.doc.setTextColor(0, 0, 0)
    
    // Left column
    const leftInfo = [
      [`${this.getTranslation('siteName')}:`, site.name],
      [`${this.getTranslation('location')}:`, site.location],
      [`${this.getTranslation('projectType')}:`, site.type]
    ]
    
    // Right column
    const rightInfo = [
      [`${this.getTranslation('startDate')}:`, new Date(site.startDate).toLocaleDateString(this.config.language === 'ar' ? 'ar-SA' : 'en-US')],
      [`${this.getTranslation('status')}:`, this.getTranslation(site.status)]
    ]
    
    leftInfo.forEach(([label, value], index) => {
      this.doc.setFont('Arial', 'bold')
      this.doc.text(label, leftColX, this.currentY + (index * 7))
      this.doc.setFont('Arial', 'normal')
      this.doc.text(value, leftColX + 35, this.currentY + (index * 7))
    })
    
    rightInfo.forEach(([label, value], index) => {
      this.doc.setFont('Arial', 'bold')
      this.doc.text(label, rightColX, this.currentY + (index * 7))
      this.doc.setFont('Arial', 'normal')
      this.doc.text(value, rightColX + 35, this.currentY + (index * 7))
    })
    
    // Vertical divider
    this.doc.setDrawColor(189, 195, 199)
    this.doc.line(this.pageWidth / 2, boxY + 5, this.pageWidth / 2, boxY + boxHeight - 5)
    
    this.currentY = boxY + boxHeight + 15
  }

  private addClientInfo(clientInfo: ClientStatusReportData['clientInfo']) {
    // Section header with border
    this.addSectionHeader(this.getTranslation('clientInformation'))
    
    // Client information box with professional styling
    const boxHeight = 35
    const boxY = this.currentY
    
    // Main border
    this.doc.setDrawColor(52, 73, 94)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight)
    
    // Background
    this.doc.setFillColor(250, 251, 252)
    this.doc.rect(this.margin + 0.5, boxY + 0.5, this.pageWidth - 2 * this.margin - 1, boxHeight - 1, 'F')
    
    this.currentY += 5
    
    // Client info in two columns
    const isArabic = this.config.language === 'ar'
    const leftColX = this.margin + 10
    const rightColX = this.pageWidth / 2 + 10
    
    this.doc.setFontSize(10)
    this.doc.setFont('Arial', 'normal')
    this.doc.setTextColor(0, 0, 0)
    
    // Left column
    const leftInfo = [
      [`${this.getTranslation('clientName')}:`, clientInfo.name],
      [`${this.getTranslation('contactPerson')}:`, clientInfo.contactPerson]
    ]
    
    // Right column
    const rightInfo = [
      [`${this.getTranslation('email')}:`, clientInfo.email],
      [`${this.getTranslation('phone')}:`, clientInfo.phone]
    ]
    
    leftInfo.forEach(([label, value], index) => {
      this.doc.setFont('Arial', 'bold')
      this.doc.text(label, leftColX, this.currentY + (index * 8))
      this.doc.setFont('Arial', 'normal')
      this.doc.text(value, leftColX + 35, this.currentY + (index * 8))
    })
    
    rightInfo.forEach(([label, value], index) => {
      this.doc.setFont('Arial', 'bold')
      this.doc.text(label, rightColX, this.currentY + (index * 8))
      this.doc.setFont('Arial', 'normal')
      this.doc.text(value, rightColX + 25, this.currentY + (index * 8))
    })
    
    // Vertical divider
    this.doc.setDrawColor(189, 195, 199)
    this.doc.line(this.pageWidth / 2, boxY + 5, this.pageWidth / 2, boxY + boxHeight - 5)
    
    this.currentY = boxY + boxHeight + 15
  }

  private addReportSummary(summary: SiteProgressReportData['summary']) {
    this.doc.setFontSize(12)
    this.doc.setFont('Arial', 'bold')
    this.doc.text(this.getTranslation('projectSummary'), this.margin, this.currentY)
    this.currentY += 8

    // Create summary table
    const summaryData = [
      [this.getTranslation('totalTasks'), summary.totalTasks.toString()],
      [this.getTranslation('completedTasks'), summary.completedTasks.toString()],
      [this.getTranslation('inProgressTasks'), summary.inProgressTasks.toString()],
      [this.getTranslation('overdueTasks'), summary.overdueTasks.toString()],
      [this.getTranslation('completionRate'), `${summary.completionRate}%`],
      [this.getTranslation('avgProgress'), `${summary.avgProgressPercentage}%`],
      [this.getTranslation('estimatedHours'), `${summary.totalEstimatedHours}h`],
      [this.getTranslation('actualHours'), `${summary.totalActualHours}h`]
    ]

    this.doc.autoTable({
      startY: this.currentY,
      head: [[this.getTranslation('metric'), this.getTranslation('value')]],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' }
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addProjectOverview(site: Site, tasks: SiteTask[]) {
    // Section header
    this.addSectionHeader(this.getTranslation('projectOverview'))
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Overview text box with styling
    const boxHeight = 25
    this.doc.setFillColor(249, 249, 249)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 'F')
    this.doc.setDrawColor(189, 195, 199)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight)
    
    this.currentY += 5

    this.doc.setFontSize(10)
    this.doc.setFont('Arial', 'normal')
    this.doc.setTextColor(0, 0, 0)
    
    const overviewText = this.config.language === 'ar' 
      ? `المشروع يتقدم بشكل جيد مع معدل إنجاز ${completionRate}%. تم إكمال ${completedTasks} مهمة من أصل ${totalTasks} مهمة، مع ${inProgressTasks} مهمة قيد التنفيذ حالياً.`
      : `The project is progressing well with a ${completionRate}% completion rate. ${completedTasks} out of ${totalTasks} tasks have been completed, with ${inProgressTasks} tasks currently in progress.`

    const lines = this.doc.splitTextToSize(overviewText, this.pageWidth - 4 * this.margin)
    this.doc.text(lines, this.margin + 10, this.currentY)
    
    this.currentY += boxHeight + 10
  }

  private addCategoryBreakdown(breakdown: SiteProgressReportData['categoryBreakdown']) {
    this.doc.setFontSize(12)
    this.doc.setFont('Arial', 'bold')
    this.doc.text(this.getTranslation('categoryBreakdown'), this.margin, this.currentY)
    this.currentY += 8

    const categoryData = Object.entries(breakdown).map(([category, data]) => [
      this.getTranslation(category),
      data.total.toString(),
      data.completed.toString(),
      data.inProgress.toString(),
      data.overdue.toString(),
      `${Math.round((data.completed / data.total) * 100)}%`
    ])

    this.doc.autoTable({
      startY: this.currentY,
      head: [[
        this.getTranslation('category'),
        this.getTranslation('total'),
        this.getTranslation('completed'),
        this.getTranslation('inProgress'),
        this.getTranslation('overdue'),
        this.getTranslation('completion')
      ]],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addTasksTable(tasks: SiteTask[]) {
    this.checkPageBreak(60)
    
    this.doc.setFontSize(12)
    this.doc.setFont('Arial', 'bold')
    this.doc.text(this.getTranslation('taskDetails'), this.margin, this.currentY)
    this.currentY += 8

    const taskData = tasks.slice(0, 20).map(task => [ // Limit to first 20 tasks for PDF
      task.title,
      this.getTranslation(task.category),
      this.getTranslation(task.status),
      this.getTranslation(task.priority),
      task.assignedTo,
      new Date(task.dueDate).toLocaleDateString(this.config.language === 'ar' ? 'ar-SA' : 'en-US'),
      `${task.progress}%`
    ])

    this.doc.autoTable({
      startY: this.currentY,
      head: [[
        this.getTranslation('taskTitle'),
        this.getTranslation('category'),
        this.getTranslation('status'),
        this.getTranslation('priority'),
        this.getTranslation('assignedTo'),
        this.getTranslation('dueDate'),
        this.getTranslation('progress')
      ]],
      body: taskData,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30 },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      styles: { fontSize: 8 }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15

    if (tasks.length > 20) {
      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text(
        this.getTranslation('tableNote').replace('{count}', (tasks.length - 20).toString()),
        this.margin,
        this.currentY
      )
      this.currentY += 8
    }
  }

  private addMilestones(milestones: ClientStatusReportData['projectMilestones']) {
    this.checkPageBreak(40)
    
    // Section header
    this.addSectionHeader(this.getTranslation('projectMilestones'))

    milestones.forEach((milestone, index) => {
      this.checkPageBreak(35)
      
      // Milestone container with border
      const milestoneHeight = 30
      this.doc.setDrawColor(189, 195, 199)
      this.doc.setLineWidth(0.3)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, milestoneHeight)
      
      // Milestone background
      this.doc.setFillColor(252, 252, 252)
      this.doc.rect(this.margin + 0.5, this.currentY + 0.5, this.pageWidth - 2 * this.margin - 1, milestoneHeight - 1, 'F')
      
      this.currentY += 5
      
      // Milestone number circle
      const circleX = this.margin + 10
      this.doc.setFillColor(52, 73, 94)
      this.doc.circle(circleX, this.currentY + 5, 4, 'F')
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(8)
      this.doc.setFont('Arial', 'bold')
      this.doc.text(`${index + 1}`, circleX, this.currentY + 6, { align: 'center' })
      
      // Milestone title
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(11)
      this.doc.setFont('Arial', 'bold')
      this.doc.text(milestone.title, this.margin + 25, this.currentY + 6)
      
      // Status badge with enhanced styling
      const statusColor = this.getStatusColor(milestone.status)
      this.doc.setFillColor(statusColor.r, statusColor.g, statusColor.b)
      this.doc.setDrawColor(statusColor.r - 20, statusColor.g - 20, statusColor.b - 20)
      this.doc.rect(this.pageWidth - this.margin - 35, this.currentY + 1, 30, 8, 'FD')
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(8)
      this.doc.setFont('Arial', 'bold')
      this.doc.text(
        this.getTranslation(milestone.status).toUpperCase(),
        this.pageWidth - this.margin - 20,
        this.currentY + 6,
        { align: 'center' }
      )
      
      this.currentY += 12
      
      // Milestone details row
      this.doc.setTextColor(60, 60, 60)
      this.doc.setFontSize(9)
      this.doc.setFont('Arial', 'normal')
      
      const dueDate = new Date(milestone.dueDate).toLocaleDateString(this.config.language === 'ar' ? 'ar-SA' : 'en-US')
      this.doc.text(`${this.getTranslation('dueDate')}: ${dueDate}`, this.margin + 25, this.currentY)
      
      // Progress percentage
      this.doc.setFont('Arial', 'bold')
      this.doc.setTextColor(milestone.progress >= 100 ? 76 : milestone.progress >= 50 ? 255 : 244, 
                          milestone.progress >= 100 ? 175 : milestone.progress >= 50 ? 193 : 67, 
                          milestone.progress >= 100 ? 80 : milestone.progress >= 50 ? 7 : 54)
      this.doc.text(`${milestone.progress}%`, this.pageWidth - this.margin - 50, this.currentY)
      
      this.currentY += 8

      // Enhanced progress bar
      this.drawEnhancedProgressBar(this.margin + 25, this.currentY, this.pageWidth - 3 * this.margin - 50, 5, milestone.progress)
      
      this.currentY += milestoneHeight - 20
    })
    
    this.currentY += 10
  }

  private addFinancialSummary(financial: ClientStatusReportData['financialSummary']) {
    this.checkPageBreak(60)
    
    // Section header
    this.addSectionHeader(this.getTranslation('financialSummary'))
    
    // Financial cards layout
    const cardWidth = (this.pageWidth - 3 * this.margin) / 2
    const cardHeight = 40
    
    // Budget Overview Card
    this.addFinancialCard(
      this.margin, 
      this.currentY, 
      cardWidth, 
      cardHeight,
      this.getTranslation('budgetOverview'),
      [
        [this.getTranslation('totalBudget'), this.formatCurrency(financial.totalBudget)],
        [this.getTranslation('spentAmount'), this.formatCurrency(financial.spentAmount)],
        [this.getTranslation('remainingBudget'), this.formatCurrency(financial.remainingBudget)]
      ],
      [52, 152, 219]
    )
    
    // Invoicing Status Card
    this.addFinancialCard(
      this.margin + cardWidth + 10, 
      this.currentY, 
      cardWidth, 
      cardHeight,
      this.getTranslation('invoicingStatus'),
      [
        [this.getTranslation('invoicedAmount'), this.formatCurrency(financial.invoicedAmount)],
        [this.getTranslation('pendingInvoices'), `${financial.pendingInvoices} ${this.getTranslation('invoices')}`],
        [this.getTranslation('paymentStatus'), this.getPaymentStatus(financial)]
      ],
      [46, 125, 50]
    )
    
    this.currentY += cardHeight + 20
    
    // Financial summary chart (visual representation)
    this.addFinancialChart(financial)
  }

  private addUpcomingDeadlines(deadlines: ClientStatusReportData['upcomingDeadlines']) {
    this.checkPageBreak(40)
    
    // Section header
    this.addSectionHeader(this.getTranslation('upcomingDeadlines'))

    if (deadlines.length === 0) {
      // Professional "no deadlines" message
      this.doc.setFillColor(240, 248, 255)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F')
      this.doc.setDrawColor(189, 195, 199)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20)
      
      this.doc.setFontSize(10)
      this.doc.setFont('Arial', 'italic')
      this.doc.setTextColor(100, 100, 100)
      this.doc.text(
        `✓ ${this.getTranslation('noUpcomingDeadlines')}`,
        this.pageWidth / 2,
        this.currentY + 12,
        { align: 'center' }
      )
      this.currentY += 30
      return
    }

    // Enhanced deadline table with priority colors
    const deadlineData = deadlines.map(deadline => {
      const daysUntilDue = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const urgencyIndicator = daysUntilDue <= 3 ? '🔴' : daysUntilDue <= 7 ? '🟡' : '🟢'
      
      return [
        `${urgencyIndicator} ${deadline.title}`,
        this.getTranslation(deadline.priority),
        deadline.assignedTo,
        new Date(deadline.dueDate).toLocaleDateString(this.config.language === 'ar' ? 'ar-SA' : 'en-US'),
        `${daysUntilDue} ${this.getTranslation('days')}`
      ]
    })

    this.doc.autoTable({
      startY: this.currentY,
      head: [[
        this.getTranslation('task'),
        this.getTranslation('priority'),
        this.getTranslation('assignedTo'),
        this.getTranslation('dueDate'),
        this.getTranslation('timeRemaining')
      ]],
      body: deadlineData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 152, 0], 
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [254, 254, 254]
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addIssuesSection(issues: ClientStatusReportData['issues']) {
    this.checkPageBreak(40)
    
    // Section header
    this.addSectionHeader(this.getTranslation('issues'))

    if (issues.length === 0) {
      // Professional "no issues" message
      this.doc.setFillColor(240, 248, 255)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F')
      this.doc.setDrawColor(189, 195, 199)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20)
      
      this.doc.setFontSize(10)
      this.doc.setFont('Arial', 'italic')
      this.doc.setTextColor(100, 100, 100)
      this.doc.text(
        `✓ ${this.getTranslation('noActiveIssues')}`,
        this.pageWidth / 2,
        this.currentY + 12,
        { align: 'center' }
      )
      this.currentY += 30
      return
    }

    issues.forEach((issue, index) => {
      this.checkPageBreak(25)
      
      // Issue container with border
      const issueHeight = 22
      this.doc.setDrawColor(189, 195, 199)
      this.doc.setLineWidth(0.3)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, issueHeight)
      
      // Issue background based on severity
      const severityColor = this.getSeverityColor(issue.severity)
      this.doc.setFillColor(255, 255, 255)
      this.doc.rect(this.margin + 0.5, this.currentY + 0.5, this.pageWidth - 2 * this.margin - 1, issueHeight - 1, 'F')
      
      // Severity indicator strip
      this.doc.setFillColor(severityColor.r, severityColor.g, severityColor.b)
      this.doc.rect(this.margin + 0.5, this.currentY + 0.5, 5, issueHeight - 1, 'F')
      
      this.currentY += 5
      
      // Issue title
      this.doc.setFontSize(10)
      this.doc.setFont('Arial', 'bold')
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(issue.title, this.margin + 12, this.currentY)
      
      // Severity badge
      this.doc.setFillColor(severityColor.r, severityColor.g, severityColor.b)
      this.doc.setDrawColor(severityColor.r - 20, severityColor.g - 20, severityColor.b - 20)
      this.doc.rect(this.pageWidth - this.margin - 30, this.currentY - 3, 25, 7, 'FD')
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(7)
      this.doc.setFont('Arial', 'bold')
      this.doc.text(
        this.getTranslation(issue.severity).toUpperCase(),
        this.pageWidth - this.margin - 17.5,
        this.currentY + 1,
        { align: 'center' }
      )
      
      this.currentY += 8
      
      // Issue details
      this.doc.setTextColor(60, 60, 60)
      this.doc.setFontSize(8)
      this.doc.setFont('Arial', 'normal')
      this.doc.text(`${this.getTranslation('status')}: ${this.getTranslation(issue.status)}`, this.margin + 12, this.currentY)
      this.doc.text(`${this.getTranslation('reported')}: ${new Date(issue.reportedDate).toLocaleDateString(this.config.language === 'ar' ? 'ar-SA' : 'en-US')}`, this.pageWidth - this.margin - 60, this.currentY)
      
      this.currentY += issueHeight - 8
    })
    
    this.currentY += 10
  }

  private addTimeline(timeline: SiteProgressReportData['timeline']) {
    this.checkPageBreak(50)
    
    this.doc.setFontSize(12)
    this.doc.setFont('Arial', 'bold')
    this.doc.text(this.getTranslation('progressTimeline'), this.margin, this.currentY)
    this.currentY += 8

    // Simple timeline visualization
    const timelineData = timeline.slice(-10).map(entry => [ // Last 10 entries
      new Date(entry.date).toLocaleDateString(this.config.language === 'ar' ? 'ar-SA' : 'en-US'),
      entry.tasksCompleted.toString(),
      `${entry.totalProgress}%`
    ])

    this.doc.autoTable({
      startY: this.currentY,
      head: [[
        this.getTranslation('date'),
        this.getTranslation('tasksCompleted'),
        this.getTranslation('totalProgress')
      ]],
      body: timelineData,
      theme: 'striped',
      headStyles: { fillColor: [103, 58, 183], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Add page border (decorative)
      this.doc.setDrawColor(52, 73, 94)
      this.doc.setLineWidth(0.8)
      this.doc.rect(5, 5, this.pageWidth - 10, this.pageHeight - 10)
      
      // Footer background
      this.doc.setFillColor(248, 249, 250)
      this.doc.rect(this.margin, this.pageHeight - 30, this.pageWidth - 2 * this.margin, 25, 'F')
      
      // Footer border
      this.doc.setDrawColor(189, 195, 199)
      this.doc.setLineWidth(0.5)
      this.doc.rect(this.margin, this.pageHeight - 30, this.pageWidth - 2 * this.margin, 25)
      
      // Page number with enhanced styling
      this.doc.setFontSize(9)
      this.doc.setFont('Arial', 'bold')
      this.doc.setTextColor(52, 73, 94)
      this.doc.text(
        `${this.getTranslation('page')} ${i} ${this.getTranslation('of')} ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 18,
        { align: 'center' }
      )

      // Company info in footer with better styling
      if (this.config.customBranding) {
        this.doc.setFontSize(8)
        this.doc.setFont('Arial', 'normal')
        this.doc.setTextColor(60, 60, 60)
        
        this.doc.text(
          this.config.customBranding.companyName,
          this.margin + 5,
          this.pageHeight - 12
        )
        this.doc.text(
          this.config.customBranding.email,
          this.pageWidth - this.margin - 5,
          this.pageHeight - 12,
          { align: 'right' }
        )
        
        // Generation timestamp
        this.doc.setFontSize(7)
        this.doc.setTextColor(120, 120, 120)
        const timestamp = new Date().toLocaleString(this.config.language === 'ar' ? 'ar-SA' : 'en-US')
        this.doc.text(
          `${this.getTranslation('generatedOn')}: ${timestamp}`,
          this.pageWidth - this.margin - 5,
          this.pageHeight - 8,
          { align: 'right' }
        )
      }

      // Signatures section on last page
      if (this.config.includeSignatures && i === pageCount) {
        this.currentY = this.pageHeight - 110
        this.addEnhancedSignatures()
      }
    }
  }

  private addSignatures() {
    this.doc.setFontSize(10)
    this.doc.setFont('Arial', 'bold')
    this.doc.text(this.getTranslation('signatures'), this.margin, this.currentY)
    this.currentY += 15

    const signatureBoxes = [
      { label: this.getTranslation('projectManager'), x: this.margin },
      { label: this.getTranslation('siteManager'), x: this.pageWidth / 2 },
      { label: this.getTranslation('clientRepresentative'), x: this.pageWidth - this.margin - 60 }
    ]

    signatureBoxes.forEach(box => {
      // Signature box
      this.doc.setDrawColor(0, 0, 0)
      this.doc.rect(box.x, this.currentY, 60, 20)
      
      // Label
      this.doc.setFontSize(8)
      this.doc.setFont('Arial', 'normal')
      this.doc.text(box.label, box.x, this.currentY + 25)
      this.doc.text(this.getTranslation('signature'), box.x, this.currentY + 30)
      this.doc.text(this.getTranslation('date'), box.x, this.currentY + 35)
    })
  }

  private addEnhancedSignatures() {
    // Signatures section header
    this.addSectionHeader(this.getTranslation('signatures'))
    
    // Signature instruction text
    this.doc.setFontSize(9)
    this.doc.setFont('Arial', 'italic')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text(
      this.getTranslation('signatureInstruction'),
      this.margin,
      this.currentY
    )
    this.currentY += 12

    const signatureBoxWidth = 55
    const signatureBoxHeight = 35
    const spacing = 5
    const totalWidth = 3 * signatureBoxWidth + 2 * spacing
    const startX = (this.pageWidth - totalWidth) / 2

    const signatureBoxes = [
      { 
        label: this.getTranslation('projectManager'), 
        x: startX,
        color: [52, 152, 219]
      },
      { 
        label: this.getTranslation('siteManager'), 
        x: startX + signatureBoxWidth + spacing,
        color: [46, 125, 50]
      },
      { 
        label: this.getTranslation('clientRepresentative'), 
        x: startX + 2 * (signatureBoxWidth + spacing),
        color: [155, 89, 182]
      }
    ]

    signatureBoxes.forEach(box => {
      // Signature box border
      this.doc.setDrawColor(box.color[0], box.color[1], box.color[2])
      this.doc.setLineWidth(0.8)
      this.doc.rect(box.x, this.currentY, signatureBoxWidth, signatureBoxHeight)
      
      // Header strip
      this.doc.setFillColor(box.color[0], box.color[1], box.color[2])
      this.doc.rect(box.x + 0.5, this.currentY + 0.5, signatureBoxWidth - 1, 8, 'F')
      
      // Role title
      this.doc.setFontSize(8)
      this.doc.setFont('Arial', 'bold')
      this.doc.setTextColor(255, 255, 255)
      this.doc.text(
        box.label,
        box.x + signatureBoxWidth / 2,
        this.currentY + 6,
        { align: 'center' }
      )
      
      // Signature area background
      this.doc.setFillColor(252, 252, 252)
      this.doc.rect(box.x + 0.5, this.currentY + 8.5, signatureBoxWidth - 1, signatureBoxHeight - 8, 'F')
      
      // Signature line
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(0.3)
      this.doc.line(box.x + 5, this.currentY + 25, box.x + signatureBoxWidth - 5, this.currentY + 25)
      
      // Labels
      this.doc.setFontSize(7)
      this.doc.setFont('Arial', 'normal')
      this.doc.setTextColor(100, 100, 100)
      this.doc.text(this.getTranslation('signature'), box.x + 5, this.currentY + 28)
      
      // Date line
      this.doc.line(box.x + 5, this.currentY + 32, box.x + signatureBoxWidth - 5, this.currentY + 32)
      this.doc.text(this.getTranslation('date'), box.x + 5, this.currentY + 35)
    })
    
    this.currentY += signatureBoxHeight + 5
  }

  private drawProgressBar(x: number, y: number, width: number, height: number, progress: number) {
    // Background
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(x, y, width, height, 'F')
    
    // Progress
    const progressWidth = (width * progress) / 100
    this.doc.setFillColor(76, 175, 80)
    this.doc.rect(x, y, progressWidth, height, 'F')
    
    // Border
    this.doc.setDrawColor(200, 200, 200)
    this.doc.rect(x, y, width, height)
  }

  private drawEnhancedProgressBar(x: number, y: number, width: number, height: number, progress: number) {
    // Background with gradient effect
    this.doc.setFillColor(236, 240, 241)
    this.doc.rect(x, y, width, height, 'F')
    
    // Progress bar with color based on completion
    const progressWidth = (width * progress) / 100
    
    if (progress >= 100) {
      this.doc.setFillColor(76, 175, 80) // Green
    } else if (progress >= 75) {
      this.doc.setFillColor(139, 195, 74) // Light green
    } else if (progress >= 50) {
      this.doc.setFillColor(255, 193, 7) // Amber
    } else if (progress >= 25) {
      this.doc.setFillColor(255, 152, 0) // Orange
    } else {
      this.doc.setFillColor(244, 67, 54) // Red
    }
    
    this.doc.rect(x, y, progressWidth, height, 'F')
    
    // Progress bar border with shadow effect
    this.doc.setDrawColor(189, 195, 199)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height)
    
    // Add subtle inner shadow
    this.doc.setDrawColor(160, 160, 160)
    this.doc.setLineWidth(0.2)
    this.doc.rect(x + 0.5, y + 0.5, width - 1, height - 1)
    
    // Progress text overlay
    if (progress > 10) {
      this.doc.setFontSize(7)
      this.doc.setFont('Arial', 'bold')
      this.doc.setTextColor(255, 255, 255)
      this.doc.text(
        `${progress}%`,
        x + progressWidth - 8,
        y + height / 2 + 1,
        { align: 'center' }
      )
    }
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - 40) {
      this.doc.addPage()
      this.currentY = 20
    }
  }

  private addSectionHeader(title: string) {
    this.checkPageBreak(20)
    
    // Section header background
    this.doc.setFillColor(44, 62, 80)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F')
    
    // Section header text
    this.doc.setFontSize(12)
    this.doc.setFont('Arial', 'bold')
    this.doc.setTextColor(255, 255, 255)
    
    const isArabic = this.config.language === 'ar'
    this.doc.text(
      title,
      isArabic ? this.pageWidth - this.margin - 10 : this.margin + 10,
      this.currentY + 8,
      { align: isArabic ? 'right' : 'left' }
    )
    
    this.currentY += 15
  }

  private addSectionSeparator() {
    this.doc.setDrawColor(189, 195, 199)
    this.doc.setLineWidth(0.3)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 10
  }

  private addFinancialCard(
    x: number, 
    y: number, 
    width: number, 
    height: number,
    title: string,
    data: [string, string][],
    headerColor: [number, number, number]
  ) {
    // Card border
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height)
    
    // Card header
    this.doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    this.doc.rect(x + 0.5, y + 0.5, width - 1, 12, 'F')
    
    // Header text
    this.doc.setFontSize(10)
    this.doc.setFont('Arial', 'bold')
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(title, x + width / 2, y + 8, { align: 'center' })
    
    // Card content background
    this.doc.setFillColor(253, 253, 253)
    this.doc.rect(x + 0.5, y + 12.5, width - 1, height - 12, 'F')
    
    // Content
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(9)
    
    data.forEach(([label, value], index) => {
      const contentY = y + 20 + (index * 7)
      this.doc.setFont('Arial', 'normal')
      this.doc.text(label + ':', x + 5, contentY)
      this.doc.setFont('Arial', 'bold')
      this.doc.text(value, x + width - 5, contentY, { align: 'right' })
    })
  }

  private addFinancialChart(financial: ClientStatusReportData['financialSummary']) {
    const chartY = this.currentY
    const chartWidth = this.pageWidth - 2 * this.margin
    const chartHeight = 30
    
    // Chart title
    this.doc.setFontSize(11)
    this.doc.setFont('Arial', 'bold')
    this.doc.text(this.getTranslation('budgetUtilization'), this.margin, chartY)
    
    const budgetUsed = (financial.spentAmount / financial.totalBudget) * 100
    
    // Background bar
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, chartY + 10, chartWidth, 8, 'F')
    
    // Used budget bar
    const usedWidth = (chartWidth * budgetUsed) / 100
    const color = budgetUsed > 90 ? [244, 67, 54] : budgetUsed > 75 ? [255, 193, 7] : [76, 175, 80]
    this.doc.setFillColor(color[0], color[1], color[2])
    this.doc.rect(this.margin, chartY + 10, usedWidth, 8, 'F')
    
    // Chart border
    this.doc.setDrawColor(0, 0, 0)
    this.doc.rect(this.margin, chartY + 10, chartWidth, 8)
    
    // Chart labels
    this.doc.setFontSize(8)
    this.doc.setFont('Arial', 'normal')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`${budgetUsed.toFixed(1)}% ${this.getTranslation('utilized')}`, this.margin, chartY + 25)
    this.doc.text(this.formatCurrency(financial.spentAmount), this.margin + 50, chartY + 25)
    this.doc.text(this.formatCurrency(financial.totalBudget), this.pageWidth - this.margin, chartY + 25, { align: 'right' })
    
    this.currentY += 35
  }

  private getPaymentStatus(financial: ClientStatusReportData['financialSummary']): string {
    const paymentRate = (financial.invoicedAmount / financial.spentAmount) * 100
    if (paymentRate >= 95) return this.getTranslation('excellent')
    if (paymentRate >= 80) return this.getTranslation('good')
    if (paymentRate >= 60) return this.getTranslation('fair')
    return this.getTranslation('needsAttention')
  }

  private getStatusColor(status: string): { r: number, g: number, b: number } {
    switch (status) {
      case 'completed': case 'resolved': return { r: 76, g: 175, b: 80 }
      case 'in-progress': return { r: 33, g: 150, b: 243 }
      case 'pending': return { r: 255, g: 193, b: 7 }
      case 'delayed': case 'overdue': return { r: 244, g: 67, b: 54 }
      default: return { r: 158, g: 158, b: 158 }
    }
  }

  private getSeverityColor(severity: string): { r: number, g: number, b: number } {
    switch (severity) {
      case 'low': return { r: 76, g: 175, b: 80 }
      case 'medium': return { r: 255, g: 193, b: 7 }
      case 'high': return { r: 255, g: 87, b: 34 }
      case 'critical': return { r: 244, g: 67, b: 54 }
      default: return { r: 158, g: 158, b: 158 }
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.config.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: this.config.language === 'ar' ? 'SAR' : 'USD'
    }).format(amount)
  }

  private getTranslation(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      en: {
        siteProgressReport: 'Site Progress Report',
        clientStatusReport: 'Client Status Report',
        siteInformation: 'Site Information',
        clientInformation: 'Client Information',
        projectSummary: 'Project Summary',
        projectOverview: 'Project Overview',
        categoryBreakdown: 'Category Breakdown',
        taskDetails: 'Task Details',
        projectMilestones: 'Project Milestones',
        financialSummary: 'Financial Summary',
        upcomingDeadlines: 'Upcoming Deadlines',
        issues: 'Issues & Concerns',
        progressTimeline: 'Progress Timeline',
        signatures: 'Signatures',
        generatedOn: 'Generated on',
        siteName: 'Site Name',
        location: 'Location',
        projectType: 'Project Type',
        startDate: 'Start Date',
        status: 'Status',
        clientName: 'Client Name',
        contactPerson: 'Contact Person',
        email: 'Email',
        phone: 'Phone',
        totalTasks: 'Total Tasks',
        completedTasks: 'Completed Tasks',
        inProgressTasks: 'In Progress Tasks',
        overdueTasks: 'Overdue Tasks',
        completionRate: 'Completion Rate',
        avgProgress: 'Average Progress',
        estimatedHours: 'Estimated Hours',
        actualHours: 'Actual Hours',
        metric: 'Metric',
        value: 'Value',
        category: 'Category',
        total: 'Total',
        completed: 'Completed',
        inProgress: 'In Progress',
        overdue: 'Overdue',
        completion: 'Completion %',
        taskTitle: 'Task Title',
        priority: 'Priority',
        assignedTo: 'Assigned To',
        dueDate: 'Due Date',
        progress: 'Progress',
        date: 'Date',
        tasksCompleted: 'Tasks Completed',
        totalProgress: 'Total Progress',
        totalBudget: 'Total Budget',
        spentAmount: 'Spent Amount',
        remainingBudget: 'Remaining Budget',
        invoicedAmount: 'Invoiced Amount',
        pendingInvoices: 'Pending Invoices',
        task: 'Task',
        reported: 'Reported',
        page: 'Page',
        of: 'of',
        projectManager: 'Project Manager',
        siteManager: 'Site Manager',
        clientRepresentative: 'Client Representative',
        signature: 'Signature',
        project: 'Project',
        budgetOverview: 'Budget Overview',
        invoicingStatus: 'Invoicing Status',
        budgetUtilization: 'Budget Utilization',
        invoices: 'invoices',
        paymentStatus: 'Payment Status',
        utilized: 'utilized',
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        needsAttention: 'Needs Attention',
        noUpcomingDeadlines: 'No upcoming deadlines',
        noActiveIssues: 'No active issues',
        tableNote: 'Note: Only showing first 20 tasks. {count} additional tasks not displayed.',
        timeRemaining: 'Time Remaining',
        days: 'days',
        signatureInstruction: 'Please review and sign below to confirm receipt and approval of this report.',
        // Status translations
        'not-started': 'Not Started',
        'on-hold': 'On Hold',
        cancelled: 'Cancelled',
        pending: 'Pending',
        delayed: 'Delayed',
        resolved: 'Resolved',
        open: 'Open',
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
        // Site status translations
        active: 'Active',
        'site-planning': 'Planning',
        'site-on-hold': 'On Hold',
        'site-completed': 'Completed'
      },
      ar: {
        siteProgressReport: 'تقرير تقدم الموقع',
        clientStatusReport: 'تقرير حالة العميل',
        siteInformation: 'معلومات الموقع',
        clientInformation: 'معلومات العميل',
        projectSummary: 'ملخص المشروع',
        projectOverview: 'نظرة عامة على المشروع',
        categoryBreakdown: 'توزيع الفئات',
        taskDetails: 'تفاصيل المهام',
        projectMilestones: 'معالم المشروع',
        financialSummary: 'الملخص المالي',
        upcomingDeadlines: 'المواعيد النهائية القادمة',
        issues: 'المشاكل والمخاوف',
        progressTimeline: 'الجدول الزمني للتقدم',
        signatures: 'التوقيعات',
        generatedOn: 'تم إنشاؤه في',
        siteName: 'اسم الموقع',
        location: 'الموقع',
        projectType: 'نوع المشروع',
        startDate: 'تاريخ البداية',
        status: 'الحالة',
        clientName: 'اسم العميل',
        contactPerson: 'الشخص المسؤول',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        totalTasks: 'إجمالي المهام',
        completedTasks: 'المهام المكتملة',
        inProgressTasks: 'المهام قيد التنفيذ',
        overdueTasks: 'المهام المتأخرة',
        completionRate: 'معدل الإنجاز',
        avgProgress: 'متوسط التقدم',
        estimatedHours: 'الساعات المقدرة',
        actualHours: 'الساعات الفعلية',
        metric: 'المؤشر',
        value: 'القيمة',
        category: 'الفئة',
        total: 'الإجمالي',
        completed: 'مكتمل',
        inProgress: 'قيد التنفيذ',
        overdue: 'متأخر',
        completion: 'نسبة الإنجاز',
        taskTitle: 'عنوان المهمة',
        priority: 'الأولوية',
        assignedTo: 'مُكلف إلى',
        dueDate: 'تاريخ الاستحقاق',
        progress: 'التقدم',
        date: 'التاريخ',
        tasksCompleted: 'المهام المكتملة',
        totalProgress: 'إجمالي التقدم',
        totalBudget: 'إجمالي الميزانية',
        spentAmount: 'المبلغ المُنفق',
        remainingBudget: 'الميزانية المتبقية',
        invoicedAmount: 'المبلغ المفوتر',
        pendingInvoices: 'الفواتير المعلقة',
        task: 'المهمة',
        reported: 'تم الإبلاغ',
        page: 'صفحة',
        of: 'من',
        projectManager: 'مدير المشروع',
        siteManager: 'مدير الموقع',
        clientRepresentative: 'ممثل العميل',
        signature: 'التوقيع',
        project: 'المشروع',
        budgetOverview: 'نظرة عامة على الميزانية',
        invoicingStatus: 'حالة الفواتير',
        budgetUtilization: 'استخدام الميزانية',
        invoices: 'فواتير',
        paymentStatus: 'حالة الدفع',
        utilized: 'مستخدم',
        excellent: 'ممتاز',
        good: 'جيد',
        fair: 'مقبول',
        needsAttention: 'يحتاج انتباه',
        noUpcomingDeadlines: 'لا توجد مواعيد نهائية قادمة',
        noActiveIssues: 'لا توجد مشاكل نشطة',
        tableNote: 'ملاحظة: يتم عرض أول 20 مهمة فقط. {count} مهمة إضافية غير معروضة.',
        timeRemaining: 'الوقت المتبقي',
        days: 'أيام',
        signatureInstruction: 'يرجى مراجعة التقرير والتوقيع أدناه لتأكيد الاستلام والموافقة.',
        // Status translations
        'not-started': 'لم تبدأ',
        'on-hold': 'متوقفة',
        cancelled: 'ملغية',
        pending: 'معلقة',
        delayed: 'متأخرة',
        resolved: 'محلولة',
        open: 'مفتوحة',
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
        // Site status translations
        active: 'نشط',
        'site-planning': 'تخطيط',
        'site-completed': 'مكتمل'
      }
    }

    return translations[this.config.language]?.[key] || key
  }
}

// Utility functions for report data preparation
export function prepareSiteProgressData(
  site: Site, 
  tasks: SiteTask[], 
  approvals: TaskApproval[],
  startDate: string,
  endDate: string
): SiteProgressReportData {
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt)
    return taskDate >= new Date(startDate) && taskDate <= new Date(endDate)
  })

  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length
  const overdueTasks = filteredTasks.filter(t => 
    t.status !== 'completed' && new Date(t.dueDate) < new Date()
  ).length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const avgProgressPercentage = totalTasks > 0 
    ? Math.round(filteredTasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
    : 0

  const totalEstimatedHours = filteredTasks.reduce((sum, t) => sum + t.estimatedHours, 0)
  const totalActualHours = filteredTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)

  // Category breakdown
  const categoryBreakdown: Record<string, any> = {}
  const categories = ['construction', 'safety', 'inspection', 'maintenance', 'planning', 'other']
  
  categories.forEach(category => {
    const categoryTasks = filteredTasks.filter(t => t.category === category)
    if (categoryTasks.length > 0) {
      categoryBreakdown[category] = {
        total: categoryTasks.length,
        completed: categoryTasks.filter(t => t.status === 'completed').length,
        inProgress: categoryTasks.filter(t => t.status === 'in-progress').length,
        overdue: categoryTasks.filter(t => 
          t.status !== 'completed' && new Date(t.dueDate) < new Date()
        ).length
      }
    }
  })

  // Priority breakdown
  const priorityBreakdown: Record<string, number> = {}
  const priorities = ['low', 'medium', 'high', 'critical']
  priorities.forEach(priority => {
    priorityBreakdown[priority] = filteredTasks.filter(t => t.priority === priority).length
  })

  // Timeline (last 30 days)
  const timeline: Array<{ date: string, tasksCompleted: number, totalProgress: number }> = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayTasks = filteredTasks.filter(t => 
      t.completedDate === dateStr || t.updatedAt.startsWith(dateStr)
    )
    
    timeline.push({
      date: dateStr,
      tasksCompleted: dayTasks.filter(t => t.status === 'completed').length,
      totalProgress: dayTasks.length > 0 
        ? Math.round(dayTasks.reduce((sum, t) => sum + t.progress, 0) / dayTasks.length)
        : 0
    })
  }

  return {
    site,
    tasks: filteredTasks,
    approvals,
    reportPeriod: { startDate, endDate },
    summary: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      avgProgressPercentage,
      totalEstimatedHours,
      totalActualHours
    },
    categoryBreakdown,
    priorityBreakdown,
    timeline
  }
}

export function prepareClientStatusData(
  site: Site,
  tasks: SiteTask[],
  clientInfo: ClientStatusReportData['clientInfo']
): ClientStatusReportData {
  // Mock milestones - in real app, this would come from database
  const projectMilestones = [
    {
      id: '1',
      title: 'Foundation & Structure',
      dueDate: '2024-12-15',
      status: 'completed' as const,
      progress: 100,
      description: 'Foundation work and main structure completion',
      relatedTasks: tasks.filter(t => t.category === 'construction').slice(0, 3).map(t => t.id)
    },
    {
      id: '2',
      title: 'Interior Work',
      dueDate: '2025-02-28',
      status: 'in-progress' as const,
      progress: 65,
      description: 'Interior finishing, electrical, and plumbing work',
      relatedTasks: tasks.filter(t => t.category === 'construction').slice(3, 6).map(t => t.id)
    },
    {
      id: '3',
      title: 'Final Inspection & Handover',
      dueDate: '2025-03-30',
      status: 'pending' as const,
      progress: 0,
      description: 'Final quality checks and project handover',
      relatedTasks: tasks.filter(t => t.category === 'inspection').map(t => t.id)
    }
  ]

  // Mock financial data
  const financialSummary = {
    totalBudget: 850000,
    spentAmount: 520000,
    remainingBudget: 330000,
    invoicedAmount: 480000,
    pendingInvoices: 3
  }

  // Upcoming deadlines (next 30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  const upcomingDeadlines = tasks
    .filter(t => 
      t.status !== 'completed' && 
      new Date(t.dueDate) <= thirtyDaysFromNow &&
      new Date(t.dueDate) >= new Date()
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10)
    .map(t => ({
      taskId: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      assignedTo: t.assignedTo
    }))

  // Mock issues
  const issues = [
    {
      id: '1',
      title: 'Weather delays affecting outdoor work',
      description: 'Heavy rain has delayed concrete pouring and exterior work',
      severity: 'medium' as const,
      status: 'in-progress' as const,
      reportedDate: '2024-08-25'
    },
    {
      id: '2',
      title: 'Material delivery delay',
      description: 'Steel beams delivery postponed by 1 week due to supplier issues',
      severity: 'high' as const,
      status: 'open' as const,
      reportedDate: '2024-08-28'
    }
  ].filter(issue => issue.status !== 'resolved')

  return {
    site,
    tasks,
    clientInfo,
    projectMilestones,
    financialSummary,
    upcomingDeadlines,
    issues
  }
}
