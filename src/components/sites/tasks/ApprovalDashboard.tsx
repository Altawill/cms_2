import React, { useState, useEffect } from 'react'
import { useSitePermissions } from '../../../contexts/RBACContext'
import { ApprovalNotifications, NotificationBadge } from './ApprovalNotifications'
import type { TaskApproval } from './ApprovalWorkflow'
import type { SiteTask } from './SiteTasks'

interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  overdue: number
  critical: number
  myApprovals: number
  avgApprovalTime: number // in hours
}

interface Props {
  siteId: string
  tasks: SiteTask[]
  currentUserId?: string
  currentUserRole?: string
  onApprovalAction?: (approvalId: string, action: 'approve' | 'reject' | 'view') => void
}

export function ApprovalDashboard({ 
  siteId, 
  tasks, 
  currentUserId = 'current-user', 
  currentUserRole = 'site-manager',
  onApprovalAction 
}: Props) {
  const [approvals, setApprovals] = useState<TaskApproval[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'urgent' | 'mine'>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [selectedType, setSelectedType] = useState<'all' | TaskApproval['type']>('all')
  const [sortBy, setSortBy] = useState<'date' | 'urgency' | 'type'>('date')
  const [showNotifications, setShowNotifications] = useState(false)
  const sitePermissions = useSitePermissions(siteId)

  useEffect(() => {
    loadAllApprovals()
  }, [tasks])

  const loadAllApprovals = () => {
    const allApprovals: TaskApproval[] = []
    
    tasks.forEach(task => {
      const taskApprovals = localStorage.getItem(`task_approvals_${task.id}`)
      if (taskApprovals) {
        try {
          const parsedApprovals = JSON.parse(taskApprovals) as TaskApproval[]
          allApprovals.push(...parsedApprovals)
        } catch (error) {
          console.error(`Error loading approvals for task ${task.id}:`, error)
        }
      }
    })

    setApprovals(allApprovals)
  }

  const calculateStats = (): ApprovalStats => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const pending = approvals.filter(a => a.status === 'pending')
    const approved = approvals.filter(a => a.status === 'approved')
    const rejected = approvals.filter(a => a.status === 'rejected')
    const overdue = pending.filter(a => new Date(a.requestedAt) < oneDayAgo)
    const critical = pending.filter(a => a.urgency === 'critical')
    const myApprovals = approvals.filter(a => 
      a.approvalChain.some(step => step.role === currentUserRole && step.status === 'pending')
    )

    // Calculate average approval time
    const completedApprovals = approved.concat(rejected)
    let totalApprovalTime = 0
    completedApprovals.forEach(approval => {
      const requestTime = new Date(approval.requestedAt).getTime()
      const completionTime = new Date(approval.approvedAt || approval.rejectedAt || approval.updatedAt).getTime()
      totalApprovalTime += (completionTime - requestTime) / (1000 * 60 * 60) // Convert to hours
    })
    const avgApprovalTime = completedApprovals.length > 0 ? totalApprovalTime / completedApprovals.length : 0

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      overdue: overdue.length,
      critical: critical.length,
      myApprovals: myApprovals.length,
      avgApprovalTime: Math.round(avgApprovalTime * 10) / 10
    }
  }

  const filterApprovals = () => {
    let filtered = [...approvals]

    // Apply primary filter
    switch (selectedFilter) {
      case 'pending':
        filtered = filtered.filter(a => a.status === 'pending')
        break
      case 'urgent':
        filtered = filtered.filter(a => 
          a.status === 'pending' && (a.urgency === 'high' || a.urgency === 'critical')
        )
        break
      case 'mine':
        filtered = filtered.filter(a => 
          a.approvalChain.some(step => step.role === currentUserRole && step.status === 'pending')
        )
        break
    }

    // Apply urgency filter
    if (selectedUrgency !== 'all') {
      filtered = filtered.filter(a => a.urgency === selectedUrgency)
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === selectedType)
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
        break
      case 'urgency':
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        filtered.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
        break
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type))
        break
    }

    return filtered
  }

  const stats = calculateStats()
  const filteredApprovals = filterApprovals()

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    return task?.title || 'Unknown Task'
  }

  const getApprovalTypeIcon = (type: TaskApproval['type']) => {
    switch (type) {
      case 'completion': return '✅'
      case 'scope-change': return '📝'
      case 'budget-change': return '💰'
      case 'deadline-extension': return '📅'
      case 'assignment-change': return '👤'
      default: return '📋'
    }
  }

  const getStatusColor = (status: TaskApproval['status']) => {
    switch (status) {
      case 'pending': return 'var(--accent-warning)'
      case 'approved': return 'var(--accent-secondary)'
      case 'rejected': return 'var(--accent-danger)'
      case 'cancelled': return 'var(--text-muted)'
      default: return 'var(--text-muted)'
    }
  }

  const getUrgencyColor = (urgency: TaskApproval['urgency']) => {
    switch (urgency) {
      case 'low': return 'var(--accent-info)'
      case 'medium': return 'var(--accent-warning)'
      case 'high': return 'var(--accent-danger)'
      case 'critical': return '#8b0000'
      default: return 'var(--text-muted)'
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Stats */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0' }}>
              📋 Approval Dashboard
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Manage approval workflows and track approval requests
            </p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔔 Notifications
              <NotificationBadge 
                siteId={siteId} 
                currentUserId={currentUserId} 
                currentUserRole={currentUserRole} 
              />
            </button>
            
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '400px',
                maxHeight: '500px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
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
                    onClick={() => setShowNotifications(false)}
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
                <div style={{ maxHeight: '400px', overflow: 'auto', padding: '16px' }}>
                  <ApprovalNotifications
                    siteId={siteId}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onNotificationAction={onApprovalAction}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: 'var(--accent-warning)', marginBottom: '4px' }}>
              {stats.pending}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: 'var(--accent-secondary)', marginBottom: '4px' }}>
              {stats.approved}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Approved</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: 'var(--accent-danger)', marginBottom: '4px' }}>
              {stats.rejected}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rejected</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: stats.overdue > 0 ? 'var(--accent-danger)' : 'var(--accent-info)', marginBottom: '4px' }}>
              {stats.overdue}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: stats.critical > 0 ? '#8b0000' : 'var(--accent-info)', marginBottom: '4px' }}>
              {stats.critical}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Critical</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: 'var(--accent-primary)', marginBottom: '4px' }}>
              {stats.myApprovals}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>My Queue</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', color: 'var(--accent-info)', marginBottom: '4px' }}>
              {stats.avgApprovalTime}h
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Time</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Filter
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="all">📋 All Approvals</option>
              <option value="pending">⏳ Pending Only</option>
              <option value="urgent">🚨 Urgent Only</option>
              <option value="mine">👤 My Approvals</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Urgency
            </label>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="all">All Urgencies</option>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
              <option value="critical">🚨 Critical</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="all">All Types</option>
              <option value="completion">✅ Completion</option>
              <option value="scope-change">📝 Scope Change</option>
              <option value="budget-change">💰 Budget Change</option>
              <option value="deadline-extension">📅 Deadline Extension</option>
              <option value="assignment-change">👤 Assignment Change</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="date">📅 Date Requested</option>
              <option value="urgency">🚨 Urgency Level</option>
              <option value="type">📋 Approval Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Approval Requests ({filteredApprovals.length})
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            {selectedFilter === 'all' ? 'All approval requests' :
             selectedFilter === 'pending' ? 'Pending approval requests' :
             selectedFilter === 'urgent' ? 'Urgent approval requests' :
             'Your approval queue'}
          </p>
        </div>

        {filteredApprovals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {selectedFilter === 'pending' ? '⏳' :
               selectedFilter === 'urgent' ? '🚨' :
               selectedFilter === 'mine' ? '👤' : '📋'}
            </div>
            <h3>No approvals found</h3>
            <p>
              {selectedFilter === 'pending' ? 'No pending approvals at this time' :
               selectedFilter === 'urgent' ? 'No urgent approvals require attention' :
               selectedFilter === 'mine' ? 'No approvals assigned to you' :
               'No approval requests match your current filters'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredApprovals.map(approval => (
              <ApprovalDashboardCard
                key={approval.id}
                approval={approval}
                taskTitle={getTaskTitle(approval.taskId)}
                canApprove={sitePermissions.canManage('approvals')}
                currentUserRole={currentUserRole}
                onAction={(action) => {
                  if (onApprovalAction) {
                    onApprovalAction(approval.id, action)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Panel */}
      {stats.myApprovals > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
            ⚡ Quick Actions
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedFilter('mine')}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              👤 Review My Queue ({stats.myApprovals})
            </button>
            
            {stats.critical > 0 && (
              <button
                onClick={() => {
                  setSelectedFilter('urgent')
                  setSelectedUrgency('critical')
                }}
                style={{
                  background: '#8b0000',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🚨 Critical Items ({stats.critical})
              </button>
            )}
            
            {stats.overdue > 0 && (
              <button
                onClick={() => setSelectedFilter('urgent')}
                style={{
                  background: 'var(--accent-danger)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⏰ Overdue ({stats.overdue})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard Approval Card Component
function ApprovalDashboardCard({
  approval,
  taskTitle,
  canApprove,
  currentUserRole,
  onAction
}: {
  approval: TaskApproval
  taskTitle: string
  canApprove: boolean
  currentUserRole: string
  onAction: (action: 'approve' | 'reject' | 'view') => void
}) {
  const [showQuickActions, setShowQuickActions] = useState(false)
  
  const daysSinceRequest = Math.floor((new Date().getTime() - new Date(approval.requestedAt).getTime()) / (1000 * 3600 * 24))
  const isOverdue = daysSinceRequest > 1 && approval.status === 'pending'
  const isUrgent = approval.urgency === 'critical' || (approval.urgency === 'high' && daysSinceRequest > 1)
  const isMyApproval = approval.approvalChain.some(step => 
    step.role === currentUserRole && step.status === 'pending'
  )

  const getApprovalTypeIcon = (type: TaskApproval['type']) => {
    switch (type) {
      case 'completion': return '✅'
      case 'scope-change': return '📝'
      case 'budget-change': return '💰'
      case 'deadline-extension': return '📅'
      case 'assignment-change': return '👤'
      default: return '📋'
    }
  }

  const getStatusColor = (status: TaskApproval['status']) => {
    switch (status) {
      case 'pending': return 'var(--accent-warning)'
      case 'approved': return 'var(--accent-secondary)'
      case 'rejected': return 'var(--accent-danger)'
      case 'cancelled': return 'var(--text-muted)'
      default: return 'var(--text-muted)'
    }
  }

  const getUrgencyColor = (urgency: TaskApproval['urgency']) => {
    switch (urgency) {
      case 'low': return 'var(--accent-info)'
      case 'medium': return 'var(--accent-warning)'
      case 'high': return 'var(--accent-danger)'
      case 'critical': return '#8b0000'
      default: return 'var(--text-muted)'
    }
  }

  return (
    <div style={{
      background: isUrgent ? 'var(--accent-danger-light)' : 'var(--bg-tertiary)',
      border: isUrgent ? '1px solid var(--accent-danger)' : '1px solid var(--border-color)',
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      position: 'relative'
    }}>
      {/* Urgency Indicators */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
        {isOverdue && (
          <span style={{
            background: 'var(--accent-danger)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '9px',
            fontWeight: '600'
          }}>
            OVERDUE
          </span>
        )}
        {isMyApproval && (
          <span style={{
            background: 'var(--accent-primary)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '9px',
            fontWeight: '600'
          }}>
            MY QUEUE
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ marginBottom: '12px', paddingRight: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>{getApprovalTypeIcon(approval.type)}</span>
          <h5 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
            {approval.title}
          </h5>
          <span style={{
            background: getStatusColor(approval.status),
            color: 'white',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {approval.status}
          </span>
          <span style={{
            background: getUrgencyColor(approval.urgency),
            color: 'white',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '9px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {approval.urgency}
          </span>
        </div>
        
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
          {approval.reason}
        </p>
        
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Task: {taskTitle} • Requested by {approval.requestedBy}
          {daysSinceRequest > 0 && ` • ${daysSinceRequest} day(s) ago`}
        </div>
      </div>

      {/* Approval Chain Progress */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Approval Progress
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {approval.approvalChain.map((step, index) => (
            <React.Fragment key={index}>
              <div style={{
                background: step.status === 'approved' ? 'var(--accent-secondary)' :
                           step.status === 'rejected' ? 'var(--accent-danger)' :
                           step.status === 'pending' && index === approval.approvalChain.findIndex(s => s.status === 'pending') ? 'var(--accent-warning)' :
                           'var(--bg-primary)',
                color: step.status === 'pending' ? 'var(--text-primary)' : 'white',
                border: step.status === 'pending' ? '1px solid var(--border-color)' : 'none',
                padding: '3px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '9px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {step.role.split('-')[0].toUpperCase()}
              </div>
              {index < approval.approvalChain.length - 1 && (
                <div style={{ 
                  fontSize: '8px', 
                  color: 'var(--text-muted)',
                  transform: 'translateY(-1px)'
                }}>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onAction('view')}
          className="btn-ghost btn-sm"
          style={{ fontSize: '12px' }}
        >
          👁️ View Details
        </button>
        
        {canApprove && approval.status === 'pending' && isMyApproval && (
          <>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="btn-primary btn-sm"
              style={{ fontSize: '12px' }}
            >
              {showQuickActions ? '✕ Cancel' : '⚖️ Quick Review'}
            </button>
          </>
        )}
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && canApprove && isMyApproval && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginTop: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>
            Quick Decision (no comments required)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                onAction('reject')
                setShowQuickActions(false)
              }}
              style={{
                flex: 1,
                background: 'var(--accent-danger)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              ❌ Quick Reject
            </button>
            <button
              onClick={() => {
                onAction('approve')
                setShowQuickActions(false)
              }}
              style={{
                flex: 1,
                background: 'var(--accent-secondary)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              ✅ Quick Approve
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Approval Analytics Component
export function ApprovalAnalytics({ 
  siteId, 
  approvals, 
  timeRange = '30d' 
}: { 
  siteId: string
  approvals: TaskApproval[]
  timeRange?: '7d' | '30d' | '90d' | '1y'
}) {
  const getTimeRangeDate = () => {
    const now = new Date()
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  const rangeStart = getTimeRangeDate()
  const filteredApprovals = approvals.filter(a => new Date(a.createdAt) >= rangeStart)

  const analytics = {
    totalRequests: filteredApprovals.length,
    approvalRate: filteredApprovals.length > 0 
      ? Math.round((filteredApprovals.filter(a => a.status === 'approved').length / filteredApprovals.length) * 100)
      : 0,
    avgApprovalTime: 0,
    typeBreakdown: {} as Record<string, number>,
    urgencyBreakdown: {} as Record<string, number>,
    bottlenecks: [] as string[]
  }

  // Calculate average approval time
  const completedApprovals = filteredApprovals.filter(a => a.status !== 'pending')
  if (completedApprovals.length > 0) {
    let totalTime = 0
    completedApprovals.forEach(approval => {
      const startTime = new Date(approval.requestedAt).getTime()
      const endTime = new Date(approval.approvedAt || approval.rejectedAt || approval.updatedAt).getTime()
      totalTime += (endTime - startTime) / (1000 * 60 * 60) // Convert to hours
    })
    analytics.avgApprovalTime = Math.round((totalTime / completedApprovals.length) * 10) / 10
  }

  // Type breakdown
  filteredApprovals.forEach(approval => {
    analytics.typeBreakdown[approval.type] = (analytics.typeBreakdown[approval.type] || 0) + 1
  })

  // Urgency breakdown
  filteredApprovals.forEach(approval => {
    analytics.urgencyBreakdown[approval.urgency] = (analytics.urgencyBreakdown[approval.urgency] || 0) + 1
  })

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
        📊 Approval Analytics ({timeRange})
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {/* Key Metrics */}
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>Key Metrics</h5>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px' }}>Total Requests:</span>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{analytics.totalRequests}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px' }}>Approval Rate:</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                {analytics.approvalRate}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px' }}>Avg Processing Time:</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-info)' }}>
                {analytics.avgApprovalTime}h
              </span>
            </div>
          </div>
        </div>

        {/* Type Breakdown */}
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>By Type</h5>
          <div style={{ display: 'grid', gap: '6px' }}>
            {Object.entries(analytics.typeBreakdown).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getApprovalTypeIcon(type as TaskApproval['type'])}
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgency Breakdown */}
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>By Urgency</h5>
          <div style={{ display: 'grid', gap: '6px' }}>
            {Object.entries(analytics.urgencyBreakdown).map(([urgency, count]) => (
              <div key={urgency} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getUrgencyColor(urgency as TaskApproval['urgency'])
                  }} />
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getApprovalTypeIcon(type: TaskApproval['type']) {
  switch (type) {
    case 'completion': return '✅'
    case 'scope-change': return '📝'
    case 'budget-change': return '💰'
    case 'deadline-extension': return '📅'
    case 'assignment-change': return '👤'
    default: return '📋'
  }
}

function getUrgencyColor(urgency: TaskApproval['urgency']) {
  switch (urgency) {
    case 'low': return 'var(--accent-info)'
    case 'medium': return 'var(--accent-warning)'
    case 'high': return 'var(--accent-danger)'
    case 'critical': return '#8b0000'
    default: return 'var(--text-muted)'
  }
}
