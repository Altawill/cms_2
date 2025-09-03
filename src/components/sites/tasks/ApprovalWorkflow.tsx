import React, { useState, useEffect } from 'react'
import { useSitePermissions } from '../../../contexts/RBACContext'
import { useFormSubmission } from '../../../hooks/useFormSubmission'
import type { SiteTask } from './SiteTasks'

export interface TaskApproval {
  id: string
  taskId: string
  siteId: string
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  type: 'completion' | 'scope-change' | 'budget-change' | 'deadline-extension' | 'assignment-change'
  title: string
  reason: string
  comments?: string
  approverComments?: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  autoApprove?: boolean
  approvalChain: {
    role: string
    userId?: string
    status: 'pending' | 'approved' | 'rejected' | 'skipped'
    approvedAt?: string
    comments?: string
  }[]
  metadata?: {
    oldValue?: any
    newValue?: any
    budgetImpact?: number
    timeImpact?: number
  }
  attachments: string[]
  createdAt: string
  updatedAt: string
}

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
}

interface Props {
  task: SiteTask
  onClose: () => void
  onApprovalSubmitted?: (approval: TaskApproval) => void
}

export function ApprovalWorkflow({ task, onClose, onApprovalSubmitted }: Props) {
  const sitePermissions = useSitePermissions(task.siteId)
  const [approvals, setApprovals] = useState<TaskApproval[]>([])
  const [notifications, setNotifications] = useState<ApprovalNotification[]>([])
  const [activeTab, setActiveTab] = useState<'request' | 'pending' | 'history'>('request')
  const [showRequestForm, setShowRequestForm] = useState(false)

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 500
  })

  // Load approvals and notifications
  useEffect(() => {
    const savedApprovals = localStorage.getItem(`task_approvals_${task.id}`)
    if (savedApprovals) {
      setApprovals(JSON.parse(savedApprovals))
    }

    const savedNotifications = localStorage.getItem(`approval_notifications_${task.siteId}`)
    if (savedNotifications) {
      const allNotifications = JSON.parse(savedNotifications)
      setNotifications(allNotifications.filter((n: ApprovalNotification) => 
        approvals.some(a => a.id === n.approvalId)
      ))
    }
  }, [task.id, task.siteId])

  const saveApprovals = (newApprovals: TaskApproval[]) => {
    setApprovals(newApprovals)
    localStorage.setItem(`task_approvals_${task.id}`, JSON.stringify(newApprovals))
  }

  const saveNotifications = (newNotifications: ApprovalNotification[]) => {
    setNotifications(newNotifications)
    const allSiteNotifications = JSON.parse(localStorage.getItem(`approval_notifications_${task.siteId}`) || '[]')
    const otherNotifications = allSiteNotifications.filter((n: ApprovalNotification) => 
      !newNotifications.some(nn => nn.id === n.id)
    )
    localStorage.setItem(`approval_notifications_${task.siteId}`, JSON.stringify([...otherNotifications, ...newNotifications]))
  }

  const getApprovalWorkflow = (type: TaskApproval['type']) => {
    const workflows = {
      'completion': [
        { role: 'site-manager', required: true },
        { role: 'project-manager', required: false }
      ],
      'scope-change': [
        { role: 'site-manager', required: true },
        { role: 'project-manager', required: true },
        { role: 'client-rep', required: true }
      ],
      'budget-change': [
        { role: 'site-manager', required: true },
        { role: 'project-manager', required: true },
        { role: 'finance-manager', required: true }
      ],
      'deadline-extension': [
        { role: 'site-manager', required: true },
        { role: 'project-manager', required: true }
      ],
      'assignment-change': [
        { role: 'site-manager', required: true }
      ]
    }
    return workflows[type] || workflows['completion']
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending')
  const completedApprovals = approvals.filter(a => a.status !== 'pending')

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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '800px',
        maxWidth: '95vw',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
              Approval Workflow
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              {task.title} - Manage approvals and workflow
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '0 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '2px'
        }}>
          {[
            { id: 'request', label: 'Request Approval', icon: '📤', count: 0 },
            { id: 'pending', label: 'Pending', icon: '⏳', count: pendingApprovals.length },
            { id: 'history', label: 'History', icon: '📜', count: completedApprovals.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 16px',
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: 'var(--accent-primary)',
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
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'request' && (
            <RequestApprovalForm 
              task={task}
              onSubmit={(approvalData) => {
                const newApproval: TaskApproval = {
                  id: Date.now().toString(),
                  taskId: task.id,
                  siteId: task.siteId,
                  requestedBy: 'Current User', // In real app, get from auth
                  requestedAt: new Date().toISOString(),
                  status: 'pending',
                  approvalChain: getApprovalWorkflow(approvalData.type).map(step => ({
                    role: step.role,
                    status: 'pending' as const
                  })),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  attachments: [],
                  ...approvalData
                }

                // Create notifications for approvers
                const newNotifications: ApprovalNotification[] = newApproval.approvalChain.map((step, index) => ({
                  id: `${Date.now()}_${index}`,
                  approvalId: newApproval.id,
                  recipientId: step.userId || 'auto-assign',
                  recipientRole: step.role,
                  type: 'approval-request' as const,
                  title: `Approval Required: ${newApproval.title}`,
                  message: `${newApproval.requestedBy} is requesting approval for: ${newApproval.reason}`,
                  read: false,
                  actionRequired: index === 0, // Only first in chain needs immediate action
                  createdAt: new Date().toISOString()
                }))

                saveApprovals([...approvals, newApproval])
                saveNotifications([...notifications, ...newNotifications])
                
                if (onApprovalSubmitted) {
                  onApprovalSubmitted(newApproval)
                }
                
                setActiveTab('pending')
              }}
            />
          )}

          {activeTab === 'pending' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  Pending Approvals ({pendingApprovals.length})
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Approvals waiting for review and decision
                </p>
              </div>

              {pendingApprovals.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <h3>No pending approvals</h3>
                  <p>All approvals for this task have been processed</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {pendingApprovals.map(approval => (
                    <ApprovalCard
                      key={approval.id}
                      approval={approval}
                      task={task}
                      canApprove={sitePermissions.canManage('approvals')}
                      onApprove={(comments) => {
                        const updatedApproval = {
                          ...approval,
                          status: 'approved' as const,
                          approvedBy: 'Current User',
                          approvedAt: new Date().toISOString(),
                          approverComments: comments,
                          updatedAt: new Date().toISOString()
                        }
                        saveApprovals(approvals.map(a => a.id === approval.id ? updatedApproval : a))
                      }}
                      onReject={(comments) => {
                        const updatedApproval = {
                          ...approval,
                          status: 'rejected' as const,
                          rejectedBy: 'Current User',
                          rejectedAt: new Date().toISOString(),
                          approverComments: comments,
                          updatedAt: new Date().toISOString()
                        }
                        saveApprovals(approvals.map(a => a.id === approval.id ? updatedApproval : a))
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  Approval History ({completedApprovals.length})
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Complete history of all approval requests for this task
                </p>
              </div>

              {completedApprovals.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
                  <h3>No approval history</h3>
                  <p>No approvals have been completed for this task yet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {completedApprovals
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map(approval => (
                      <div key={approval.id} style={{
                        background: 'var(--bg-tertiary)',
                        padding: '16px',
                        borderRadius: 'var(--radius-lg)',
                        borderLeft: `4px solid ${getStatusColor(approval.status)}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '16px' }}>{getApprovalTypeIcon(approval.type)}</span>
                              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                {approval.title}
                              </span>
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
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                              {approval.reason}
                            </p>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(approval.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        
                        {approval.approverComments && (
                          <div style={{
                            background: 'var(--bg-primary)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '8px',
                            fontSize: '13px'
                          }}>
                            <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>
                              Approver Comments:
                            </span>
                            <div style={{ marginTop: '4px' }}>{approval.approverComments}</div>
                          </div>
                        )}

                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Requested by {approval.requestedBy} • 
                          {approval.status === 'approved' && approval.approvedBy && ` Approved by ${approval.approvedBy}`}
                          {approval.status === 'rejected' && approval.rejectedBy && ` Rejected by ${approval.rejectedBy}`}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {pendingApprovals.length > 0 && `${pendingApprovals.length} pending approval(s)`}
            {completedApprovals.length > 0 && ` • ${completedApprovals.length} completed`}
          </div>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Request Approval Form Component
function RequestApprovalForm({ 
  task, 
  onSubmit 
}: { 
  task: SiteTask
  onSubmit: (data: Partial<TaskApproval>) => void 
}) {
  const [formData, setFormData] = useState({
    type: 'completion' as TaskApproval['type'],
    title: '',
    reason: '',
    comments: '',
    urgency: 'medium' as TaskApproval['urgency']
  })

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 500
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      onSubmit(formData)
    })
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

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
          Request New Approval
        </h4>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
          Submit a request for approval of task changes or completion
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Approval Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => {
                const type = e.target.value as TaskApproval['type']
                setFormData({
                  ...formData, 
                  type,
                  title: type === 'completion' ? `Complete Task: ${task.title}` :
                         type === 'scope-change' ? `Scope Change: ${task.title}` :
                         type === 'budget-change' ? `Budget Change: ${task.title}` :
                         type === 'deadline-extension' ? `Deadline Extension: ${task.title}` :
                         type === 'assignment-change' ? `Assignment Change: ${task.title}` :
                         ''
                })
              }}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="completion">{getApprovalTypeIcon('completion')} Task Completion</option>
              <option value="scope-change">{getApprovalTypeIcon('scope-change')} Scope Change</option>
              <option value="budget-change">{getApprovalTypeIcon('budget-change')} Budget Change</option>
              <option value="deadline-extension">{getApprovalTypeIcon('deadline-extension')} Deadline Extension</option>
              <option value="assignment-change">{getApprovalTypeIcon('assignment-change')} Assignment Change</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Urgency *
            </label>
            <select
              required
              value={formData.urgency}
              onChange={(e) => setFormData({...formData, urgency: e.target.value as TaskApproval['urgency']})}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="low">🟢 Low - No rush</option>
              <option value="medium">🟡 Medium - Normal priority</option>
              <option value="high">🔴 High - Urgent</option>
              <option value="critical">🚨 Critical - Immediate</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
            Request Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            style={{ width: '100%', padding: '8px 12px' }}
            placeholder="Brief description of what needs approval"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
            Reason for Approval *
          </label>
          <textarea
            required
            rows={4}
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            style={{ width: '100%', resize: 'vertical', padding: '8px 12px' }}
            placeholder="Explain why approval is needed and provide relevant details..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
            Additional Comments
          </label>
          <textarea
            rows={2}
            value={formData.comments}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            style={{ width: '100%', resize: 'vertical', padding: '8px 12px' }}
            placeholder="Any additional context or information..."
          />
        </div>

        {/* Approval Chain Preview */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '16px',
          borderRadius: 'var(--radius-lg)'
        }}>
          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
            Approval Chain Preview
          </h5>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {formData.type && getApprovalWorkflow(formData.type).map((step, index) => (
              <React.Fragment key={step.role}>
                <div style={{
                  background: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: '600' }}>
                    {step.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>
                    {step.required ? 'Required' : 'Optional'}
                  </div>
                </div>
                {index < getApprovalWorkflow(formData.type).length - 1 && (
                  <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Approvals will be processed in sequence from left to right
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={() => {}} className="btn-ghost">
            Save Draft
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⏳</span> Submitting...
              </span>
            ) : (
              <>📤 Submit Request</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Approval Card Component
function ApprovalCard({ 
  approval, 
  task, 
  canApprove, 
  onApprove, 
  onReject 
}: {
  approval: TaskApproval
  task: SiteTask
  canApprove: boolean
  onApprove: (comments: string) => void
  onReject: (comments: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const [approverComments, setApproverComments] = useState('')

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

  const daysSinceRequest = Math.floor((new Date().getTime() - new Date(approval.requestedAt).getTime()) / (1000 * 3600 * 24))
  const isUrgent = approval.urgency === 'critical' || (approval.urgency === 'high' && daysSinceRequest > 1)

  return (
    <div style={{
      background: isUrgent ? 'var(--accent-danger-light)' : 'var(--bg-tertiary)',
      border: isUrgent ? '1px solid var(--accent-danger)' : '1px solid var(--border-color)',
      padding: '20px',
      borderRadius: 'var(--radius-lg)',
      position: 'relative'
    }}>
      {isUrgent && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'var(--accent-danger)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '10px',
          fontWeight: '600'
        }}>
          URGENT
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px' }}>{getApprovalTypeIcon(approval.type)}</span>
          <h5 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            {approval.title}
          </h5>
          <span style={{
            background: getStatusColor(approval.status),
            color: 'white',
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {approval.status}
          </span>
          <span style={{
            background: getUrgencyColor(approval.urgency),
            color: 'white',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {approval.urgency}
          </span>
        </div>
        
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
          {approval.reason}
        </p>
        
        {approval.comments && (
          <div style={{
            background: 'var(--bg-primary)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '8px'
          }}>
            <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Additional Comments:</span>
            <div style={{ marginTop: '4px' }}>{approval.comments}</div>
          </div>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Requested by {approval.requestedBy} • {new Date(approval.requestedAt).toLocaleString()}
          {daysSinceRequest > 0 && ` • ${daysSinceRequest} day(s) ago`}
        </div>
      </div>

      {/* Approval Chain */}
      <div style={{ marginBottom: '16px' }}>
        <h6 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
          Approval Chain
        </h6>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {approval.approvalChain.map((step, index) => (
            <React.Fragment key={index}>
              <div style={{
                background: step.status === 'approved' ? 'var(--accent-secondary-light)' :
                           step.status === 'rejected' ? 'var(--accent-danger-light)' :
                           'var(--bg-primary)',
                border: step.status === 'approved' ? '1px solid var(--accent-secondary)' :
                       step.status === 'rejected' ? '1px solid var(--accent-danger)' :
                       '1px solid var(--border-color)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '11px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: '600' }}>
                  {step.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  color: step.status === 'approved' ? 'var(--accent-secondary)' :
                         step.status === 'rejected' ? 'var(--accent-danger)' :
                         'var(--text-muted)'
                }}>
                  {step.status === 'pending' ? 'Pending' : 
                   step.status === 'approved' ? 'Approved' :
                   step.status === 'rejected' ? 'Rejected' : 'Skipped'}
                </div>
              </div>
              {index < approval.approvalChain.length - 1 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {canApprove && approval.status === 'pending' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button
              onClick={() => setShowActions(!showActions)}
              className="btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              {showActions ? '✕ Cancel' : '⚖️ Review Approval'}
            </button>
          </div>

          {showActions && (
            <div style={{
              background: 'var(--bg-primary)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>
                  Approver Comments
                </label>
                <textarea
                  rows={2}
                  value={approverComments}
                  onChange={(e) => setApproverComments(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', fontSize: '13px' }}
                  placeholder="Add comments about your decision..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    onReject(approverComments)
                    setShowActions(false)
                    setApproverComments('')
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--accent-danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => {
                    onApprove(approverComments)
                    setShowActions(false)
                    setApproverComments('')
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--accent-secondary)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  ✅ Approve
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
