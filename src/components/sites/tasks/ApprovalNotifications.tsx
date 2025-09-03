import React, { useState, useEffect } from 'react'
import { useSitePermissions } from '../../../contexts/RBACContext'
import type { TaskApproval } from './ApprovalWorkflow'

interface ApprovalNotification {
  id: string
  approvalId: string
  recipientId: string
  recipientRole: string
  type: 'approval-request' | 'approval-approved' | 'approval-rejected' | 'approval-reminder'
  title: string
  message: string
  read: boolean
  actionRequired: boolean
  createdAt: string
  siteId: string
  taskId: string
  taskTitle: string
}

interface Props {
  siteId: string
  currentUserId?: string
  currentUserRole?: string
  onNotificationAction?: (notificationId: string, action: 'approve' | 'reject' | 'view') => void
}

export function ApprovalNotifications({ 
  siteId, 
  currentUserId = 'current-user', 
  currentUserRole = 'site-manager',
  onNotificationAction 
}: Props) {
  const [notifications, setNotifications] = useState<ApprovalNotification[]>([])
  const [showAll, setShowAll] = useState(false)
  const sitePermissions = useSitePermissions(siteId)

  useEffect(() => {
    loadNotifications()
    
    // Set up polling for new notifications (in a real app, this would be WebSocket/SSE)
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [siteId, currentUserId, currentUserRole])

  const loadNotifications = () => {
    try {
      const savedNotifications = localStorage.getItem(`approval_notifications_${siteId}`)
      if (savedNotifications) {
        const allNotifications = JSON.parse(savedNotifications) as ApprovalNotification[]
        
        // Filter notifications for current user based on role
        const userNotifications = allNotifications.filter(n => 
          n.recipientRole === currentUserRole || n.recipientId === currentUserId
        )
        
        setNotifications(userNotifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    setNotifications(updatedNotifications)
    
    // Update localStorage
    const allSiteNotifications = JSON.parse(localStorage.getItem(`approval_notifications_${siteId}`) || '[]')
    const updatedAllNotifications = allSiteNotifications.map((n: ApprovalNotification) =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    localStorage.setItem(`approval_notifications_${siteId}`, JSON.stringify(updatedAllNotifications))
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updatedNotifications)
    
    // Update localStorage
    const allSiteNotifications = JSON.parse(localStorage.getItem(`approval_notifications_${siteId}`) || '[]')
    const updatedAllNotifications = allSiteNotifications.map((n: ApprovalNotification) =>
      notifications.some(un => un.id === n.id) ? { ...n, read: true } : n
    )
    localStorage.setItem(`approval_notifications_${siteId}`, JSON.stringify(updatedAllNotifications))
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

  const getNotificationIcon = (type: ApprovalNotification['type']) => {
    switch (type) {
      case 'approval-request': return '📤'
      case 'approval-approved': return '✅'
      case 'approval-rejected': return '❌'
      case 'approval-reminder': return '⏰'
      default: return '📋'
    }
  }

  const getNotificationColor = (type: ApprovalNotification['type'], read: boolean) => {
    const opacity = read ? '0.6' : '1'
    switch (type) {
      case 'approval-request': return `rgba(255, 193, 7, ${opacity})`
      case 'approval-approved': return `rgba(40, 167, 69, ${opacity})`
      case 'approval-rejected': return `rgba(220, 53, 69, ${opacity})`
      case 'approval-reminder': return `rgba(108, 117, 125, ${opacity})`
      default: return `rgba(108, 117, 125, ${opacity})`
    }
  }

  if (notifications.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-tertiary)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔕</div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>No notifications</div>
        <div style={{ fontSize: '12px' }}>You'll be notified when approval actions are needed</div>
      </div>
    )
  }

  return (
    <div>
      {/* Notification Summary */}
      <div style={{
        background: unreadCount > 0 ? 'var(--accent-warning-light)' : 'var(--bg-tertiary)',
        border: unreadCount > 0 ? '1px solid var(--accent-warning)' : '1px solid var(--border-color)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            🔔 Approval Notifications
          </h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--accent-danger)',
                color: 'white',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: '600',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Total: {notifications.length}
          </span>
          <span style={{ color: 'var(--accent-warning)' }}>
            Unread: {unreadCount}
          </span>
          {actionRequiredCount > 0 && (
            <span style={{ color: 'var(--accent-danger)', fontWeight: '600' }}>
              Action Required: {actionRequiredCount}
            </span>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {displayNotifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => markAsRead(notification.id)}
            onAction={(action) => {
              markAsRead(notification.id)
              if (onNotificationAction) {
                onNotificationAction(notification.id, action)
              }
            }}
            canTakeAction={sitePermissions.canManage('approvals')}
          />
        ))}
      </div>

      {/* Show More/Less Toggle */}
      {notifications.length > 5 && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setShowAll(!showAll)}
            className="btn-ghost"
            style={{ fontSize: '13px' }}
          >
            {showAll ? '📤 Show Less' : `📥 Show All (${notifications.length - 5} more)`}
          </button>
        </div>
      )}
    </div>
  )
}

// Individual Notification Card
function NotificationCard({
  notification,
  onMarkAsRead,
  onAction,
  canTakeAction
}: {
  notification: ApprovalNotification
  onMarkAsRead: () => void
  onAction: (action: 'approve' | 'reject' | 'view') => void
  canTakeAction: boolean
}) {
  const timeAgo = getTimeAgo(notification.createdAt)
  const isUrgent = notification.actionRequired && !notification.read
  
  const getNotificationIcon = (type: ApprovalNotification['type']) => {
    switch (type) {
      case 'approval-request': return '📤'
      case 'approval-approved': return '✅'
      case 'approval-rejected': return '❌'
      case 'approval-reminder': return '⏰'
      default: return '📋'
    }
  }

  const getNotificationColor = (type: ApprovalNotification['type']) => {
    switch (type) {
      case 'approval-request': return 'var(--accent-warning)'
      case 'approval-approved': return 'var(--accent-secondary)'
      case 'approval-rejected': return 'var(--accent-danger)'
      case 'approval-reminder': return 'var(--accent-info)'
      default: return 'var(--text-muted)'
    }
  }

  return (
    <div
      onClick={() => {
        if (!notification.read) onMarkAsRead()
      }}
      style={{
        background: notification.read ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        border: isUrgent ? '2px solid var(--accent-danger)' : '1px solid var(--border-color)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      {!notification.read && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          background: 'var(--accent-primary)',
          borderRadius: '50%'
        }} />
      )}

      {isUrgent && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: notification.read ? '8px' : '20px',
          background: 'var(--accent-danger)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '9px',
          fontWeight: '600'
        }}>
          ACTION REQUIRED
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: '20px',
          color: getNotificationColor(notification.type),
          marginTop: '2px'
        }}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h5 style={{
              fontSize: '14px',
              fontWeight: notification.read ? '400' : '600',
              margin: 0,
              color: notification.read ? 'var(--text-secondary)' : 'var(--text-primary)'
            }}>
              {notification.title}
            </h5>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              marginLeft: '8px'
            }}>
              {timeAgo}
            </span>
          </div>

          <p style={{
            fontSize: '13px',
            color: notification.read ? 'var(--text-muted)' : 'var(--text-secondary)',
            margin: '0 0 8px 0',
            lineHeight: '1.4'
          }}>
            {notification.message}
          </p>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Task: {notification.taskTitle}
          </div>

          {/* Action Buttons */}
          {notification.actionRequired && canTakeAction && !notification.read && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAction('view')
                }}
                style={{
                  background: 'var(--accent-info)',
                  color: 'white',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                👁️ View Details
              </button>
              
              {notification.type === 'approval-request' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAction('approve')
                    }}
                    style={{
                      background: 'var(--accent-secondary)',
                      color: 'white',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✅ Quick Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAction('reject')
                    }}
                    style={{
                      background: 'var(--accent-danger)',
                      color: 'white',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ❌ Quick Reject
                  </button>
                </>
              )}
            </div>
          )}

          {!notification.actionRequired && !notification.read && (
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead()
                }}
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✓ Mark as Read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Notification Badge Component
export function NotificationBadge({ 
  siteId, 
  currentUserId = 'current-user', 
  currentUserRole = 'site-manager' 
}: {
  siteId: string
  currentUserId?: string
  currentUserRole?: string
}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [actionRequiredCount, setActionRequiredCount] = useState(0)

  useEffect(() => {
    const updateCounts = () => {
      try {
        const savedNotifications = localStorage.getItem(`approval_notifications_${siteId}`)
        if (savedNotifications) {
          const allNotifications = JSON.parse(savedNotifications) as ApprovalNotification[]
          const userNotifications = allNotifications.filter(n => 
            n.recipientRole === currentUserRole || n.recipientId === currentUserId
          )
          
          setUnreadCount(userNotifications.filter(n => !n.read).length)
          setActionRequiredCount(userNotifications.filter(n => n.actionRequired && !n.read).length)
        }
      } catch (error) {
        console.error('Error loading notification counts:', error)
      }
    }

    updateCounts()
    
    // Poll for updates
    const interval = setInterval(updateCounts, 10000)
    return () => clearInterval(interval)
  }, [siteId, currentUserId, currentUserRole])

  if (unreadCount === 0) return null

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        background: actionRequiredCount > 0 ? 'var(--accent-danger)' : 'var(--accent-primary)',
        color: 'white',
        borderRadius: '50%',
        fontSize: '10px',
        fontWeight: '600',
        minWidth: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px'
      }}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </div>
      
      {actionRequiredCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '8px',
          height: '8px',
          background: 'var(--accent-danger)',
          borderRadius: '50%',
          border: '1px solid white'
        }} />
      )}
    </div>
  )
}

// Notification Panel Component
export function NotificationPanel({
  siteId,
  currentUserId = 'current-user',
  currentUserRole = 'site-manager',
  onClose
}: {
  siteId: string
  currentUserId?: string
  currentUserRole?: string
  onClose: () => void
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      width: '400px',
      maxHeight: '500px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
          🔔 Notifications
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ maxHeight: '400px', overflow: 'auto', padding: '16px' }}>
        <ApprovalNotifications
          siteId={siteId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onNotificationAction={(notificationId, action) => {
            console.log('Notification action:', notificationId, action)
            // Handle notification actions
          }}
        />
      </div>
    </div>
  )
}

// Notification Settings Component
export function NotificationSettings({ siteId }: { siteId: string }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    instantNotifications: true,
    dailyDigest: false,
    weeklyDigest: true,
    notifyOnAssignment: true,
    notifyOnApproval: true,
    notifyOnCompletion: false,
    notifyOnOverdue: true,
    reminderFrequency: 24 // hours
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem(`notification_settings_${siteId}`)
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) })
    }
  }, [siteId])

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem(`notification_settings_${siteId}`, JSON.stringify(newSettings))
  }

  return (
    <div style={{
      background: 'var(--bg-tertiary)',
      padding: '20px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)'
    }}>
      <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
        🔔 Notification Preferences
      </h4>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Delivery Methods */}
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Delivery Methods
          </h5>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
              />
              📧 Email notifications
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.instantNotifications}
                onChange={(e) => updateSetting('instantNotifications', e.target.checked)}
              />
              🔔 Instant in-app notifications
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.dailyDigest}
                onChange={(e) => updateSetting('dailyDigest', e.target.checked)}
              />
              📰 Daily digest email
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.weeklyDigest}
                onChange={(e) => updateSetting('weeklyDigest', e.target.checked)}
              />
              📊 Weekly summary report
            </label>
          </div>
        </div>

        {/* Event Types */}
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Notification Types
          </h5>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.notifyOnAssignment}
                onChange={(e) => updateSetting('notifyOnAssignment', e.target.checked)}
              />
              👤 Task assignments
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.notifyOnApproval}
                onChange={(e) => updateSetting('notifyOnApproval', e.target.checked)}
              />
              📤 Approval requests
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.notifyOnCompletion}
                onChange={(e) => updateSetting('notifyOnCompletion', e.target.checked)}
              />
              ✅ Task completions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.notifyOnOverdue}
                onChange={(e) => updateSetting('notifyOnOverdue', e.target.checked)}
              />
              ⏰ Overdue tasks
            </label>
          </div>
        </div>

        {/* Reminder Settings */}
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Reminder Settings
          </h5>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              Reminder frequency for pending approvals
            </label>
            <select
              value={settings.reminderFrequency}
              onChange={(e) => updateSetting('reminderFrequency', parseInt(e.target.value))}
              style={{ width: '100%', padding: '6px 8px', fontSize: '13px' }}
            >
              <option value={1}>Every hour</option>
              <option value={4}>Every 4 hours</option>
              <option value={12}>Twice daily</option>
              <option value={24}>Daily</option>
              <option value={72}>Every 3 days</option>
              <option value={168}>Weekly</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility function to calculate time ago
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

// Create notification utility function
export function createApprovalNotification(
  approval: TaskApproval,
  type: ApprovalNotification['type'],
  recipientRole: string,
  taskTitle: string,
  customMessage?: string
): ApprovalNotification {
  const messages = {
    'approval-request': `${approval.requestedBy} is requesting approval for: ${approval.reason}`,
    'approval-approved': `Your approval request "${approval.title}" has been approved`,
    'approval-rejected': `Your approval request "${approval.title}" has been rejected`,
    'approval-reminder': `Reminder: Approval needed for "${approval.title}"`
  }

  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    approvalId: approval.id,
    recipientId: 'auto-assign',
    recipientRole,
    type,
    title: `${getNotificationTitle(type)}: ${approval.title}`,
    message: customMessage || messages[type],
    read: false,
    actionRequired: type === 'approval-request',
    createdAt: new Date().toISOString(),
    siteId: approval.siteId,
    taskId: approval.taskId,
    taskTitle
  }
}

function getNotificationTitle(type: ApprovalNotification['type']): string {
  switch (type) {
    case 'approval-request': return 'Approval Required'
    case 'approval-approved': return 'Approved'
    case 'approval-rejected': return 'Rejected'
    case 'approval-reminder': return 'Reminder'
    default: return 'Notification'
  }
}
