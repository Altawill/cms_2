import { ReportType, ReportFormat } from '../types/reports'

interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  dayOfWeek?: number
  dayOfMonth?: number
  time?: string
  timezone?: string
}

interface ScheduledReport {
  id: string
  reportType: ReportType
  schedule: ReportSchedule
  filters: any
  format: ReportFormat
  language: 'EN' | 'AR'
  isActive: boolean
  createdAt: string
  lastGenerated: string | null
  nextGeneration: string
  failures: Array<{
    timestamp: string
    error: string
    retryCount: number
  }>
  successCount: number
}
import { ReportGenerationService } from './reportGenerationService'

export interface SchedulingConfig {
  maxRetries: number
  retryDelay: number
  enableEmail: boolean
  emailRecipients: string[]
}

export class ReportSchedulingService {
  private static scheduledReports: Map<string, ScheduledReport> = new Map()
  private static scheduleIntervals: Map<string, NodeJS.Timeout> = new Map()
  private static config: SchedulingConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    enableEmail: false,
    emailRecipients: []
  }

  // Initialize scheduling service
  static initialize(config?: Partial<SchedulingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    // Load existing scheduled reports from storage
    this.loadScheduledReports()
    
    // Start all active schedules
    this.startAllSchedules()
    
    console.log('Report Scheduling Service initialized')
  }

  // Schedule a new automatic report
  static scheduleReport(
    reportType: ReportType,
    schedule: ReportSchedule,
    filters: any = {},
    format: ReportFormat = 'PDF',
    language: 'EN' | 'AR' = 'EN'
  ): string {
    const scheduleId = this.generateScheduleId(reportType, schedule.frequency)
    
    const scheduledReport: ScheduledReport = {
      id: scheduleId,
      reportType,
      schedule,
      filters,
      format,
      language,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastGenerated: null,
      nextGeneration: this.calculateNextGeneration(schedule),
      failures: [],
      successCount: 0
    }

    this.scheduledReports.set(scheduleId, scheduledReport)
    this.saveScheduledReports()
    
    // Start the schedule
    this.startSchedule(scheduleId)
    
    return scheduleId
  }

  // Update existing scheduled report
  static updateScheduledReport(scheduleId: string, updates: Partial<ScheduledReport>): boolean {
    const existingReport = this.scheduledReports.get(scheduleId)
    if (!existingReport) return false

    const updatedReport = { ...existingReport, ...updates }
    this.scheduledReports.set(scheduleId, updatedReport)
    this.saveScheduledReports()
    
    // Restart schedule if it was updated
    this.stopSchedule(scheduleId)
    if (updatedReport.isActive) {
      this.startSchedule(scheduleId)
    }
    
    return true
  }

  // Remove scheduled report
  static removeScheduledReport(scheduleId: string): boolean {
    const report = this.scheduledReports.get(scheduleId)
    if (!report) return false

    this.stopSchedule(scheduleId)
    this.scheduledReports.delete(scheduleId)
    this.saveScheduledReports()
    
    return true
  }

  // Get all scheduled reports
  static getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values())
  }

  // Get specific scheduled report
  static getScheduledReport(scheduleId: string): ScheduledReport | undefined {
    return this.scheduledReports.get(scheduleId)
  }

  // Manually trigger a scheduled report
  static async triggerReport(scheduleId: string): Promise<{ success: boolean; error?: string }> {
    const scheduledReport = this.scheduledReports.get(scheduleId)
    if (!scheduledReport) {
      return { success: false, error: 'Scheduled report not found' }
    }

    return await this.generateScheduledReport(scheduledReport)
  }

  // Enable/disable scheduled report
  static toggleScheduledReport(scheduleId: string, isActive: boolean): boolean {
    const report = this.scheduledReports.get(scheduleId)
    if (!report) return false

    report.isActive = isActive
    this.scheduledReports.set(scheduleId, report)
    this.saveScheduledReports()
    
    if (isActive) {
      this.startSchedule(scheduleId)
    } else {
      this.stopSchedule(scheduleId)
    }
    
    return true
  }

  // Get default scheduled reports configuration
  static getDefaultScheduledReports(): Array<{
    reportType: ReportType
    schedule: ReportSchedule
    description: string
  }> {
    return [
      {
        reportType: 'FINANCIAL',
        schedule: { 
          frequency: 'MONTHLY', 
          dayOfMonth: 1, 
          time: '08:00',
          timezone: 'Asia/Riyadh'
        },
        description: 'Monthly financial summary report'
      },
      {
        reportType: 'PAYROLL',
        schedule: { 
          frequency: 'MONTHLY', 
          dayOfMonth: 25, 
          time: '09:00',
          timezone: 'Asia/Riyadh'
        },
        description: 'Monthly payroll summary report'
      },
      {
        reportType: 'SITE',
        schedule: { 
          frequency: 'QUARTERLY', 
          dayOfMonth: 15, 
          time: '10:00',
          timezone: 'Asia/Riyadh'
        },
        description: 'Quarterly site progress report'
      }
    ]
  }

  // Setup default scheduled reports
  static setupDefaultSchedules(): string[] {
    const defaultReports = this.getDefaultScheduledReports()
    const scheduleIds: string[] = []
    
    defaultReports.forEach(({ reportType, schedule }) => {
      // Check if similar schedule already exists
      const existing = Array.from(this.scheduledReports.values()).find(
        report => report.reportType === reportType && 
                 report.schedule.frequency === schedule.frequency
      )
      
      if (!existing) {
        const scheduleId = this.scheduleReport(reportType, schedule)
        scheduleIds.push(scheduleId)
      }
    })
    
    return scheduleIds
  }

  // Private methods
  private static startSchedule(scheduleId: string) {
    const scheduledReport = this.scheduledReports.get(scheduleId)
    if (!scheduledReport || !scheduledReport.isActive) return

    // Calculate time until next generation
    const now = new Date()
    const nextGen = new Date(scheduledReport.nextGeneration)
    const timeUntilNext = nextGen.getTime() - now.getTime()
    
    if (timeUntilNext > 0) {
      const timeout = setTimeout(async () => {
        await this.executeScheduledReport(scheduleId)
      }, timeUntilNext)
      
      this.scheduleIntervals.set(scheduleId, timeout)
    } else {
      // If the next generation time has passed, schedule immediately
      setTimeout(async () => {
        await this.executeScheduledReport(scheduleId)
      }, 1000)
    }
  }

  private static stopSchedule(scheduleId: string) {
    const timeout = this.scheduleIntervals.get(scheduleId)
    if (timeout) {
      clearTimeout(timeout)
      this.scheduleIntervals.delete(scheduleId)
    }
  }

  private static startAllSchedules() {
    this.scheduledReports.forEach((_, scheduleId) => {
      this.startSchedule(scheduleId)
    })
  }

  private static async executeScheduledReport(scheduleId: string) {
    const scheduledReport = this.scheduledReports.get(scheduleId)
    if (!scheduledReport || !scheduledReport.isActive) return

    const result = await this.generateScheduledReport(scheduledReport)
    
    // Update the scheduled report
    if (result.success) {
      scheduledReport.lastGenerated = new Date().toISOString()
      scheduledReport.successCount += 1
      scheduledReport.nextGeneration = this.calculateNextGeneration(scheduledReport.schedule)
    } else {
      const failure = {
        timestamp: new Date().toISOString(),
        error: result.error || 'Unknown error',
        retryCount: 0
      }
      scheduledReport.failures.push(failure)
    }
    
    this.scheduledReports.set(scheduleId, scheduledReport)
    this.saveScheduledReports()
    
    // Schedule next execution
    this.startSchedule(scheduleId)
  }

  private static async generateScheduledReport(
    scheduledReport: ScheduledReport,
    retryCount = 0
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Add date range filter for the appropriate period
      const filters = this.addDateRangeFilter(scheduledReport.filters, scheduledReport.schedule)
      
      const result = await ReportGenerationService.generateReport(
        scheduledReport.reportType,
        scheduledReport.format,
        filters,
        scheduledReport.language
      )
      
      // Save the report or send email
      await this.handleGeneratedReport(result, scheduledReport)
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Retry logic
      if (retryCount < this.config.maxRetries) {
        console.warn(`Report generation failed, retrying... (${retryCount + 1}/${this.config.maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        return this.generateScheduledReport(scheduledReport, retryCount + 1)
      }
      
      return { success: false, error: errorMessage }
    }
  }

  private static addDateRangeFilter(filters: any, schedule: ReportSchedule) {
    const now = new Date()
    let startDate: Date
    let endDate: Date
    
    switch (schedule.frequency) {
      case 'DAILY':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
        
      case 'WEEKLY':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
        
      case 'MONTHLY':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
        
      case 'QUARTERLY':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
        const prevQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear()
        
        startDate = new Date(prevQuarterYear, prevQuarter * 3, 1)
        endDate = new Date(prevQuarterYear, (prevQuarter + 1) * 3, 0, 23, 59, 59, 999)
        break
        
      default:
        // Default to last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    }
    
    return {
      ...filters,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    }
  }

  private static async handleGeneratedReport(
    result: { blob: Blob; filename: string },
    scheduledReport: ScheduledReport
  ) {
    // In a real application, you would:
    // 1. Save the file to server storage
    // 2. Send email notification with attachment
    // 3. Store in document management system
    // 4. Send to external systems
    
    console.log(`Generated scheduled report: ${result.filename}`)
    
    if (this.config.enableEmail && this.config.emailRecipients.length > 0) {
      // Simulate email sending
      console.log(`Email sent to: ${this.config.emailRecipients.join(', ')}`)
    }
    
    // For demo purposes, we'll just log the success
    // In production, implement actual file storage and email sending
  }

  private static calculateNextGeneration(schedule: ReportSchedule): string {
    const now = new Date()
    let nextDate: Date
    
    switch (schedule.frequency) {
      case 'DAILY':
        nextDate = new Date(now)
        nextDate.setDate(nextDate.getDate() + 1)
        break
        
      case 'WEEKLY':
        nextDate = new Date(now)
        nextDate.setDate(nextDate.getDate() + 7)
        if (schedule.dayOfWeek !== undefined) {
          // Adjust to specific day of week (0 = Sunday)
          const dayDiff = (schedule.dayOfWeek - nextDate.getDay() + 7) % 7
          nextDate.setDate(nextDate.getDate() + dayDiff)
        }
        break
        
      case 'MONTHLY':
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, schedule.dayOfMonth || 1)
        break
        
      case 'QUARTERLY':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const nextQuarter = (currentQuarter + 1) % 4
        const nextQuarterYear = nextQuarter === 0 ? now.getFullYear() + 1 : now.getFullYear()
        nextDate = new Date(nextQuarterYear, nextQuarter * 3, schedule.dayOfMonth || 15)
        break
        
      default:
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
    
    // Set time
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number)
      nextDate.setHours(hours, minutes, 0, 0)
    } else {
      nextDate.setHours(8, 0, 0, 0) // Default to 8 AM
    }
    
    return nextDate.toISOString()
  }

  private static generateScheduleId(reportType: ReportType, frequency: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${reportType.toLowerCase()}-${frequency.toLowerCase()}-${timestamp}-${random}`
  }

  private static loadScheduledReports() {
    try {
      const stored = localStorage.getItem('scheduledReports')
      if (stored) {
        const reports = JSON.parse(stored) as ScheduledReport[]
        reports.forEach(report => {
          this.scheduledReports.set(report.id, report)
        })
      }
    } catch (error) {
      console.error('Error loading scheduled reports:', error)
    }
  }

  private static saveScheduledReports() {
    try {
      const reports = Array.from(this.scheduledReports.values())
      localStorage.setItem('scheduledReports', JSON.stringify(reports))
    } catch (error) {
      console.error('Error saving scheduled reports:', error)
    }
  }

  // Utility methods for the UI
  static getScheduleDescription(schedule: ReportSchedule): string {
    const timeStr = schedule.time || '08:00'
    
    switch (schedule.frequency) {
      case 'DAILY':
        return `Daily at ${timeStr}`
        
      case 'WEEKLY':
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = schedule.dayOfWeek !== undefined ? dayNames[schedule.dayOfWeek] : 'Monday'
        return `Weekly on ${dayName} at ${timeStr}`
        
      case 'MONTHLY':
        const day = schedule.dayOfMonth || 1
        const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
        return `Monthly on the ${day}${suffix} at ${timeStr}`
        
      case 'QUARTERLY':
        const qDay = schedule.dayOfMonth || 15
        const qSuffix = qDay === 1 ? 'st' : qDay === 2 ? 'nd' : qDay === 3 ? 'rd' : 'th'
        return `Quarterly on the ${qDay}${qSuffix} at ${timeStr}`
        
      default:
        return 'Unknown schedule'
    }
  }

  static getNextExecutionTime(scheduleId: string): string | null {
    const report = this.scheduledReports.get(scheduleId)
    if (!report) return null
    
    return new Date(report.nextGeneration).toLocaleString()
  }

  static getReportHealth(scheduleId: string): 'healthy' | 'warning' | 'error' {
    const report = this.scheduledReports.get(scheduleId)
    if (!report) return 'error'
    
    const recentFailures = report.failures.filter(f => {
      const failureTime = new Date(f.timestamp)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return failureTime > oneDayAgo
    })
    
    if (recentFailures.length >= 3) return 'error'
    if (recentFailures.length > 0) return 'warning'
    return 'healthy'
  }
}
