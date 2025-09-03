// Approval System Components Export
export { ApprovalWorkflow } from '../ApprovalWorkflow'
export type { TaskApproval } from '../ApprovalWorkflow'

export { 
  ApprovalNotifications, 
  NotificationBadge, 
  NotificationPanel, 
  NotificationSettings,
  createApprovalNotification 
} from '../ApprovalNotifications'

export { 
  ApprovalDashboard, 
  ApprovalAnalytics 
} from '../ApprovalDashboard'

// Re-export types for convenience
export type { ApprovalNotification } from '../ApprovalNotifications'
