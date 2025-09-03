import { z } from 'zod'

// Audit Event Types
export type AuditEventType = 
  | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED'
  | 'TASK_UPDATE_CREATED' | 'TASK_UPDATE_UPDATED' | 'TASK_UPDATE_DELETED'
  | 'APPROVAL_REQUESTED' | 'APPROVAL_APPROVED' | 'APPROVAL_REJECTED'
  | 'FILE_UPLOADED' | 'FILE_DELETED'
  | 'INVOICE_LINKED' | 'INVOICE_UNLINKED'
  | 'REPORT_GENERATED' | 'REPORT_DOWNLOADED' | 'REPORT_SHARED'
  | 'USER_LOGIN' | 'USER_LOGOUT'
  | 'SETTINGS_CHANGED'

export interface AuditEvent {
  id: string
  eventType: AuditEventType
  entityType: 'TASK' | 'TASK_UPDATE' | 'APPROVAL' | 'FILE' | 'INVOICE_LINK' | 'REPORT' | 'USER' | 'SETTINGS'
  entityId: string
  userId: string
  userName: string
  userNameAr?: string
  siteId?: string
  siteName?: string
  timestamp: string
  action: string
  actionAr?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Validation schema
const auditEventSchema = z.object({
  id: z.string(),
  eventType: z.enum([
    'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED',
    'TASK_UPDATE_CREATED', 'TASK_UPDATE_UPDATED', 'TASK_UPDATE_DELETED',
    'APPROVAL_REQUESTED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED',
    'FILE_UPLOADED', 'FILE_DELETED',
    'INVOICE_LINKED', 'INVOICE_UNLINKED',
    'REPORT_GENERATED', 'REPORT_DOWNLOADED', 'REPORT_SHARED',
    'USER_LOGIN', 'USER_LOGOUT',
    'SETTINGS_CHANGED'
  ]),
  entityType: z.enum(['TASK', 'TASK_UPDATE', 'APPROVAL', 'FILE', 'INVOICE_LINK', 'REPORT', 'USER', 'SETTINGS']),
  entityId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userNameAr: z.string().optional(),
  siteId: z.string().optional(),
  siteName: z.string().optional(),
  timestamp: z.string(),
  action: z.string(),
  actionAr: z.string().optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional()
})

export class AuditTrailService {
  private static readonly STORAGE_KEY = 'audit_trail_events'
  private static readonly MAX_EVENTS = 10000 // Keep last 10,000 events
  
  // Log an audit event
  static logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'sessionId'>): void {
    try {
      const auditEvent: AuditEvent = {
        ...event,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      }
      
      // Validate the event
      auditEventSchema.parse(auditEvent)
      
      // Get existing events
      const events = this.getAllEvents()
      
      // Add new event at the beginning
      events.unshift(auditEvent)
      
      // Trim to max events
      if (events.length > this.MAX_EVENTS) {
        events.splice(this.MAX_EVENTS)
      }
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events))
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Audit Event:', {
          type: auditEvent.eventType,
          action: auditEvent.action,
          user: auditEvent.userName,
          entity: `${auditEvent.entityType}:${auditEvent.entityId}`,
          timestamp: auditEvent.timestamp
        })
      }
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }
  
  // Get all audit events
  static getAllEvents(): AuditEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const events = JSON.parse(stored)
      return Array.isArray(events) ? events : []
    } catch (error) {
      console.error('Failed to load audit events:', error)
      return []
    }
  }
  
  // Get events filtered by criteria
  static getEvents(filters: {
    entityType?: string
    entityId?: string
    userId?: string
    siteId?: string
    eventType?: AuditEventType
    startDate?: string
    endDate?: string
    limit?: number
  } = {}): AuditEvent[] {
    const events = this.getAllEvents()
    let filtered = events
    
    if (filters.entityType) {
      filtered = filtered.filter(e => e.entityType === filters.entityType)
    }
    
    if (filters.entityId) {
      filtered = filtered.filter(e => e.entityId === filters.entityId)
    }
    
    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId)
    }
    
    if (filters.siteId) {
      filtered = filtered.filter(e => e.siteId === filters.siteId)
    }
    
    if (filters.eventType) {
      filtered = filtered.filter(e => e.eventType === filters.eventType)
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!)
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!)
    }
    
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }
    
    return filtered
  }
  
  // Get audit trail for a specific entity
  static getEntityAuditTrail(entityType: string, entityId: string): AuditEvent[] {
    return this.getEvents({ entityType, entityId })
  }
  
  // Get recent activity for dashboard
  static getRecentActivity(limit: number = 20): AuditEvent[] {
    return this.getEvents({ limit })
  }
  
  // Get user activity
  static getUserActivity(userId: string, limit?: number): AuditEvent[] {
    return this.getEvents({ userId, limit })
  }
  
  // Get site activity
  static getSiteActivity(siteId: string, limit?: number): AuditEvent[] {
    return this.getEvents({ siteId, limit })
  }
  
  // Export audit trail for compliance
  static exportAuditTrail(filters?: Parameters<typeof this.getEvents>[0]): {
    events: AuditEvent[]
    summary: {
      totalEvents: number
      dateRange: { start: string; end: string }
      uniqueUsers: number
      uniqueSites: number
      eventTypes: Record<string, number>
    }
  } {
    const events = this.getEvents(filters)
    
    const summary = {
      totalEvents: events.length,
      dateRange: {
        start: events.length > 0 ? events[events.length - 1].timestamp : '',
        end: events.length > 0 ? events[0].timestamp : ''
      },
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      uniqueSites: new Set(events.map(e => e.siteId).filter(Boolean)).size,
      eventTypes: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return { events, summary }
  }
  
  // Clear old events (for maintenance)
  static clearOldEvents(daysToKeep: number = 90): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()
    const events = this.getAllEvents()
    const filtered = events.filter(e => e.timestamp >= cutoffDate)
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    
    const removed = events.length - filtered.length
    console.log(`🗑️ Cleared ${removed} old audit events (keeping ${daysToKeep} days)`)
    
    return removed
  }
  
  // Get client IP (simplified for demo)
  private static getClientIP(): string {
    // In a real app, this would be provided by the server
    return '127.0.0.1'
  }
  
  // Get or create session ID
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }
}

// Convenience functions for common audit events
export const auditLog = {
  // Task events
  taskCreated: (taskId: string, taskTitle: string, siteId: string, siteName: string, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: taskId,
      userId,
      userName,
      siteId,
      siteName,
      action: `Created task "${taskTitle}"`,
      actionAr: `تم إنشاء المهمة "${taskTitle}"`
    })
  },
  
  taskUpdated: (taskId: string, taskTitle: string, siteId: string, siteName: string, userId: string, userName: string, oldValues: any, newValues: any) => {
    AuditTrailService.logEvent({
      eventType: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      userId,
      userName,
      siteId,
      siteName,
      action: `Updated task "${taskTitle}"`,
      actionAr: `تم تحديث المهمة "${taskTitle}"`,
      oldValues,
      newValues
    })
  },
  
  taskDeleted: (taskId: string, taskTitle: string, siteId: string, siteName: string, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: taskId,
      userId,
      userName,
      siteId,
      siteName,
      action: `Deleted task "${taskTitle}"`,
      actionAr: `تم حذف المهمة "${taskTitle}"`
    })
  },
  
  // Task update events
  taskUpdateCreated: (updateId: string, taskId: string, taskTitle: string, siteId: string, userId: string, userName: string, content: string) => {
    AuditTrailService.logEvent({
      eventType: 'TASK_UPDATE_CREATED',
      entityType: 'TASK_UPDATE',
      entityId: updateId,
      userId,
      userName,
      siteId,
      action: `Added update to task "${taskTitle}"`,
      actionAr: `تمت إضافة تحديث للمهمة "${taskTitle}"`,
      metadata: { taskId, content: content.substring(0, 100) + (content.length > 100 ? '...' : '') }
    })
  },
  
  // Approval events
  approvalRequested: (approvalId: string, taskId: string, taskTitle: string, siteId: string, userId: string, userName: string, approvalType: string) => {
    AuditTrailService.logEvent({
      eventType: 'APPROVAL_REQUESTED',
      entityType: 'APPROVAL',
      entityId: approvalId,
      userId,
      userName,
      siteId,
      action: `Requested ${approvalType} approval for task "${taskTitle}"`,
      actionAr: `تم طلب موافقة ${approvalType} للمهمة "${taskTitle}"`,
      metadata: { taskId, approvalType }
    })
  },
  
  approvalSubmitted: (approvalId: string, taskId: string, taskTitle: string, siteId: string, userId: string, userName: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => {
    AuditTrailService.logEvent({
      eventType: decision === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      entityType: 'APPROVAL',
      entityId: approvalId,
      userId,
      userName,
      siteId,
      action: `${decision} approval for task "${taskTitle}"`,
      actionAr: `تم ${decision === 'APPROVED' ? 'الموافقة على' : 'رفض'} المهمة "${taskTitle}"`,
      metadata: { taskId, decision, comments }
    })
  },
  
  // File events
  fileUploaded: (fileUrl: string, fileName: string, entityType: string, entityId: string, siteId: string, userId: string, userName: string, fileSize: number) => {
    AuditTrailService.logEvent({
      eventType: 'FILE_UPLOADED',
      entityType: 'FILE',
      entityId: fileUrl,
      userId,
      userName,
      siteId,
      action: `Uploaded file "${fileName}" to ${entityType}`,
      actionAr: `تم رفع الملف "${fileName}" إلى ${entityType}`,
      metadata: { fileName, entityType, entityId, fileSize }
    })
  },
  
  fileDeleted: (fileUrl: string, fileName: string, entityType: string, entityId: string, siteId: string, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'FILE_DELETED',
      entityType: 'FILE',
      entityId: fileUrl,
      userId,
      userName,
      siteId,
      action: `Deleted file "${fileName}" from ${entityType}`,
      actionAr: `تم حذف الملف "${fileName}" من ${entityType}`,
      metadata: { fileName, entityType, entityId }
    })
  },
  
  // Report events
  reportGenerated: (reportId: string, reportTitle: string, reportType: string, format: string, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'REPORT_GENERATED',
      entityType: 'REPORT',
      entityId: reportId,
      userId,
      userName,
      action: `Generated ${reportType} report "${reportTitle}" in ${format} format`,
      actionAr: `تم إنشاء تقرير ${reportType} "${reportTitle}" بصيغة ${format}`,
      metadata: { reportType, format }
    })
  },
  
  reportDownloaded: (reportId: string, reportTitle: string, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'REPORT_DOWNLOADED',
      entityType: 'REPORT',
      entityId: reportId,
      userId,
      userName,
      action: `Downloaded report "${reportTitle}"`,
      actionAr: `تم تحميل التقرير "${reportTitle}"`,
      metadata: { downloadedAt: new Date().toISOString() }
    })
  },
  
  reportShared: (reportId: string, reportTitle: string, sharedWith: string, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'REPORT_SHARED',
      entityType: 'REPORT',
      entityId: reportId,
      userId,
      userName,
      action: `Shared report "${reportTitle}" with ${sharedWith}`,
      actionAr: `تم مشاركة التقرير "${reportTitle}" مع ${sharedWith}`,
      metadata: { sharedWith }
    })
  },
  
  // User events
  userLogin: (userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'USER_LOGIN',
      entityType: 'USER',
      entityId: userId,
      userId,
      userName,
      action: `User logged in`,
      actionAr: `قام المستخدم بتسجيل الدخول`
    })
  },
  
  userLogout: (userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'USER_LOGOUT',
      entityType: 'USER',
      entityId: userId,
      userId,
      userName,
      action: `User logged out`,
      actionAr: `قام المستخدم بتسجيل الخروج`
    })
  },
  
  // Settings events
  settingsChanged: (settingName: string, oldValue: any, newValue: any, userId: string, userName: string) => {
    AuditTrailService.logEvent({
      eventType: 'SETTINGS_CHANGED',
      entityType: 'SETTINGS',
      entityId: settingName,
      userId,
      userName,
      action: `Changed setting "${settingName}" from "${oldValue}" to "${newValue}"`,
      actionAr: `تم تغيير الإعداد "${settingName}" من "${oldValue}" إلى "${newValue}"`,
      oldValues: { [settingName]: oldValue },
      newValues: { [settingName]: newValue }
    })
  }
}

// Hook for accessing audit trail in components
export function useAuditTrail() {
  const [events, setEvents] = React.useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  React.useEffect(() => {
    loadEvents()
  }, [])
  
  const loadEvents = () => {
    setIsLoading(true)
    try {
      const allEvents = AuditTrailService.getAllEvents()
      setEvents(allEvents)
    } catch (error) {
      console.error('Failed to load audit events:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getFilteredEvents = (filters: Parameters<typeof AuditTrailService.getEvents>[0]) => {
    return AuditTrailService.getEvents(filters)
  }
  
  const exportAuditTrail = (filters?: Parameters<typeof AuditTrailService.getEvents>[0]) => {
    return AuditTrailService.exportAuditTrail(filters)
  }
  
  const clearOldEvents = (daysToKeep: number = 90) => {
    const removed = AuditTrailService.clearOldEvents(daysToKeep)
    loadEvents() // Reload after clearing
    return removed
  }
  
  return {
    events,
    isLoading,
    loadEvents,
    getFilteredEvents,
    exportAuditTrail,
    clearOldEvents
  }
}

// Utility to format audit events for display
export const auditFormatter = {
  formatEventForDisplay: (event: AuditEvent, language: 'EN' | 'AR' = 'EN') => {
    const action = language === 'AR' && event.actionAr ? event.actionAr : event.action
    const userName = language === 'AR' && event.userNameAr ? event.userNameAr : event.userName
    
    return {
      ...event,
      displayAction: action,
      displayUserName: userName,
      relativeTime: auditFormatter.getRelativeTime(event.timestamp, language),
      formattedTimestamp: new Date(event.timestamp).toLocaleString(
        language === 'AR' ? 'ar-LY' : 'en-US'
      )
    }
  },
  
  getRelativeTime: (timestamp: string, language: 'EN' | 'AR' = 'EN') => {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diffMs = now.getTime() - eventTime.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (language === 'AR') {
      if (diffMinutes < 1) return 'الآن'
      if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`
      if (diffHours < 24) return `منذ ${diffHours} ساعة`
      if (diffDays < 7) return `منذ ${diffDays} يوم`
      return eventTime.toLocaleDateString('ar-LY')
    } else {
      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      return eventTime.toLocaleDateString('en-US')
    }
  },
  
  getEventIcon: (eventType: AuditEventType): string => {
    const icons: Record<AuditEventType, string> = {
      TASK_CREATED: '✅',
      TASK_UPDATED: '📝',
      TASK_DELETED: '🗑️',
      TASK_UPDATE_CREATED: '📝',
      TASK_UPDATE_UPDATED: '✏️',
      TASK_UPDATE_DELETED: '🗑️',
      APPROVAL_REQUESTED: '🙋',
      APPROVAL_APPROVED: '✅',
      APPROVAL_REJECTED: '❌',
      FILE_UPLOADED: '📁',
      FILE_DELETED: '🗑️',
      INVOICE_LINKED: '🔗',
      INVOICE_UNLINKED: '🔓',
      REPORT_GENERATED: '📊',
      REPORT_DOWNLOADED: '⬇️',
      REPORT_SHARED: '🔗',
      USER_LOGIN: '🔑',
      USER_LOGOUT: '🚪',
      SETTINGS_CHANGED: '⚙️'
    }
    
    return icons[eventType] || '📝'
  }
}

// Initialize audit trail on app start
if (typeof window !== 'undefined') {
  // Clean old events on startup (keep 90 days)
  setTimeout(() => {
    AuditTrailService.clearOldEvents(90)
  }, 5000)
}
