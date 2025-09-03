import React, { useState, useEffect } from 'react'
import { useSitePermissions } from '../../../contexts/RBACContext'
import { useFormSubmission } from '../../../hooks/useFormSubmission'
import type { SiteTask } from './SiteTasks'

interface TaskUpdate {
  id: string
  taskId: string
  text: string
  author: string
  date: string
  type: 'comment' | 'progress' | 'status' | 'assignment' | 'attachment'
  metadata?: {
    oldValue?: any
    newValue?: any
    attachmentName?: string
    progressChange?: number
  }
}

interface TaskApproval {
  id: string
  taskId: string
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  status: 'pending' | 'approved' | 'rejected'
  type: 'completion' | 'scope-change' | 'budget-change' | 'deadline-extension'
  reason: string
  comments?: string
}

interface Props {
  task: SiteTask
  onClose: () => void
  onUpdateTask: (updates: Partial<SiteTask>) => void
  onDeleteTask: () => void
}

export function TaskDetailView({ task, onClose, onUpdateTask, onDeleteTask }: Props) {
  const sitePermissions = useSitePermissions(task.siteId)
  const [activeTab, setActiveTab] = useState('overview')
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([])
  const [taskApprovals, setTaskApprovals] = useState<TaskApproval[]>([])
  const [newComment, setNewComment] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 500
  })

  // Load task updates and approvals
  useEffect(() => {
    const savedUpdates = localStorage.getItem(`task_updates_${task.id}`)
    if (savedUpdates) {
      setTaskUpdates(JSON.parse(savedUpdates))
    } else {
      // Sample updates
      const sampleUpdates: TaskUpdate[] = [
        {
          id: '1',
          taskId: task.id,
          text: 'Task created and assigned',
          author: task.assignedBy,
          date: task.createdAt,
          type: 'assignment'
        },
        {
          id: '2',
          taskId: task.id,
          text: 'Started working on foundation inspection',
          author: task.assignedTo,
          date: task.startDate || task.createdAt,
          type: 'status',
          metadata: { oldValue: 'not-started', newValue: 'in-progress' }
        }
      ]
      setTaskUpdates(sampleUpdates)
      localStorage.setItem(`task_updates_${task.id}`, JSON.stringify(sampleUpdates))
    }

    const savedApprovals = localStorage.getItem(`task_approvals_${task.id}`)
    if (savedApprovals) {
      setTaskApprovals(JSON.parse(savedApprovals))
    }
  }, [task.id])

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    await protectedSubmit(async () => {
      const update: TaskUpdate = {
        id: Date.now().toString(),
        taskId: task.id,
        text: newComment,
        author: 'Current User', // In real app, get from auth
        date: new Date().toISOString(),
        type: 'comment'
      }

      const updatedList = [...taskUpdates, update]
      setTaskUpdates(updatedList)
      localStorage.setItem(`task_updates_${task.id}`, JSON.stringify(updatedList))
      setNewComment('')
    })
  }

  const handleProgressUpdate = async (newProgress: number) => {
    if (newProgress === task.progress) return

    await protectedSubmit(async () => {
      const update: TaskUpdate = {
        id: Date.now().toString(),
        taskId: task.id,
        text: `Progress updated from ${task.progress}% to ${newProgress}%`,
        author: 'Current User',
        date: new Date().toISOString(),
        type: 'progress',
        metadata: { 
          oldValue: task.progress, 
          newValue: newProgress,
          progressChange: newProgress - task.progress
        }
      }

      const updatedList = [...taskUpdates, update]
      setTaskUpdates(updatedList)
      localStorage.setItem(`task_updates_${task.id}`, JSON.stringify(updatedList))

      // Update task progress
      let status: SiteTask['status'] = task.status
      let completedDate = task.completedDate
      let startDate = task.startDate

      if (newProgress > 0 && task.status === 'not-started') {
        status = 'in-progress'
        startDate = new Date().toISOString().split('T')[0]
      } else if (newProgress === 100 && task.status !== 'completed') {
        status = 'completed'
        completedDate = new Date().toISOString().split('T')[0]
      } else if (newProgress < 100 && task.status === 'completed') {
        status = 'in-progress'
        completedDate = undefined
      }

      onUpdateTask({ 
        progress: newProgress, 
        status, 
        completedDate, 
        startDate,
        updatedAt: new Date().toISOString()
      })
    })
  }

  const handleStatusChange = async (newStatus: SiteTask['status']) => {
    if (newStatus === task.status) return

    await protectedSubmit(async () => {
      const update: TaskUpdate = {
        id: Date.now().toString(),
        taskId: task.id,
        text: `Status changed from ${task.status} to ${newStatus}`,
        author: 'Current User',
        date: new Date().toISOString(),
        type: 'status',
        metadata: { oldValue: task.status, newValue: newStatus }
      }

      const updatedList = [...taskUpdates, update]
      setTaskUpdates(updatedList)
      localStorage.setItem(`task_updates_${task.id}`, JSON.stringify(updatedList))

      let updates: Partial<SiteTask> = { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      }

      if (newStatus === 'in-progress' && !task.startDate) {
        updates.startDate = new Date().toISOString().split('T')[0]
      } else if (newStatus === 'completed') {
        updates.completedDate = new Date().toISOString().split('T')[0]
        updates.progress = 100
      } else if (newStatus === 'not-started') {
        updates.startDate = undefined
        updates.progress = 0
      }

      onUpdateTask(updates)
    })
  }

  const getStatusColor = (status: SiteTask['status']) => {
    switch (status) {
      case 'not-started': return 'var(--text-muted)'
      case 'in-progress': return 'var(--accent-info)'
      case 'on-hold': return 'var(--accent-warning)'
      case 'completed': return 'var(--accent-secondary)'
      case 'cancelled': return 'var(--accent-danger)'
      default: return 'var(--text-muted)'
    }
  }

  const getPriorityColor = (priority: SiteTask['priority']) => {
    switch (priority) {
      case 'low': return 'var(--accent-info)'
      case 'medium': return 'var(--accent-warning)'
      case 'high': return 'var(--accent-danger)'
      case 'critical': return '#8b0000'
      default: return 'var(--text-muted)'
    }
  }

  const getCategoryIcon = (category: SiteTask['category']) => {
    switch (category) {
      case 'construction': return '🏗️'
      case 'safety': return '🦺'
      case 'inspection': return '🔍'
      case 'maintenance': return '🔧'
      case 'planning': return '📋'
      case 'other': return '📝'
      default: return '📝'
    }
  }

  const getUpdateIcon = (type: TaskUpdate['type']) => {
    switch (type) {
      case 'comment': return '💬'
      case 'progress': return '📊'
      case 'status': return '🔄'
      case 'assignment': return '👤'
      case 'attachment': return '📎'
      default: return '📝'
    }
  }

  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date()
  const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
  const timeSpent = task.actualHours || 0
  const timeRemaining = Math.max(0, task.estimatedHours - timeSpent)

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
        width: '900px',
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
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{getCategoryIcon(task.category)}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                {task.title}
              </h2>
              {isOverdue && (
                <span style={{
                  background: 'var(--accent-danger)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  OVERDUE
                </span>
              )}
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
              {task.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <div style={{
              background: getStatusColor(task.status),
              color: 'white',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginLeft: '8px'
            }}>
              {task.status.replace('-', ' ')}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Priority:</span>
            <div style={{
              background: getPriorityColor(task.priority),
              color: 'white',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginLeft: '8px'
            }}>
              {task.priority}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Assigned:</span>
            <span style={{ marginLeft: '8px', fontWeight: '500' }}>{task.assignedTo}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Due:</span>
            <span style={{ 
              marginLeft: '8px', 
              fontWeight: '500',
              color: isOverdue ? 'var(--accent-danger)' : 'var(--text-primary)'
            }}>
              {new Date(task.dueDate).toLocaleDateString()}
              {daysUntilDue > 0 && !isOverdue && ` (${daysUntilDue} days)`}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Progress:</span>
            <span style={{ marginLeft: '8px', fontWeight: '500', color: 'var(--accent-primary)' }}>
              {task.progress}%
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '0 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '2px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📋' },
            { id: 'updates', label: 'Updates', icon: '💬' },
            { id: 'people', label: 'People', icon: '👥' },
            { id: 'documents', label: 'Documents', icon: '📎' },
            { id: 'financials', label: 'Financials', icon: '💰' },
            { id: 'history', label: 'History', icon: '📜' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Progress Section */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Progress & Time Tracking
                </h4>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Progress: {task.progress}%</span>
                    <span>{timeSpent}h / {task.estimatedHours}h</span>
                  </div>
                  <div className="progress" style={{ marginBottom: '12px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${task.progress}%`,
                        background: task.status === 'completed' ? 'var(--accent-secondary)' : 'var(--accent-primary)'
                      }} 
                    />
                  </div>
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={task.progress}
                        onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress}
                        onChange={(e) => handleProgressUpdate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        style={{ width: '60px', padding: '4px', fontSize: '12px' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
                    </div>
                  )}
                  {timeRemaining > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      ⏱️ Estimated {timeRemaining}h remaining
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Quick Actions
                </h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {task.status !== 'completed' && (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value as SiteTask['status'])}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                  <button 
                    onClick={() => setShowApprovalModal(true)}
                    className="btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    ✅ Request Approval
                  </button>
                  <button className="btn-ghost btn-sm">
                    📤 Share Task
                  </button>
                  <button className="btn-ghost btn-sm">
                    📋 Duplicate
                  </button>
                </div>
              </div>

              {/* Task Details */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Task Details
                </h4>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'grid',
                  gap: '12px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Created
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Last Updated
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {new Date(task.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Assigned By
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {task.assignedBy}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Category
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {getCategoryIcon(task.category)} {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                      </span>
                    </div>
                  </div>
                  {task.tags.length > 0 && (
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Tags
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {task.tags.map(tag => (
                          <span key={tag} style={{
                            background: 'var(--accent-primary-light)',
                            color: 'var(--accent-primary)',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div>
              {/* Add Comment */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Add Update
                </h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or update..."
                    rows={3}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {isSubmitting ? '⏳' : '💬'} Post
                  </button>
                </div>
              </div>

              {/* Updates Timeline */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Updates Timeline
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {taskUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(update => (
                    <div key={update.id} style={{
                      background: 'var(--bg-tertiary)',
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      borderLeft: `4px solid ${update.type === 'progress' ? 'var(--accent-primary)' : 
                                                update.type === 'status' ? 'var(--accent-info)' : 
                                                'var(--accent-secondary)'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{getUpdateIcon(update.type)}</span>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{update.author}</span>
                          <span style={{
                            background: 'var(--accent-primary-light)',
                            color: 'var(--accent-primary)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '10px',
                            textTransform: 'uppercase'
                          }}>
                            {update.type}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(update.date).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-secondary)' }}>
                        {update.text}
                      </p>
                      {update.metadata?.progressChange && (
                        <div style={{ 
                          marginTop: '8px', 
                          fontSize: '12px', 
                          color: update.metadata.progressChange > 0 ? 'var(--accent-secondary)' : 'var(--accent-danger)'
                        }}>
                          {update.metadata.progressChange > 0 ? '↗️' : '↘️'} 
                          {Math.abs(update.metadata.progressChange)}% change
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'people' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Task Team
              </h4>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        👤 Assigned To
                      </h5>
                      <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>
                        {task.assignedTo}
                      </p>
                    </div>
                    <button className="btn-ghost btn-sm">
                      ✏️ Change
                    </button>
                  </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      👨‍💼 Assigned By
                    </h5>
                    <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>
                      {task.assignedBy}
                    </p>
                  </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
                    👥 Collaborators
                  </h5>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No collaborators added yet
                  </p>
                  <button className="btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                    ➕ Add Collaborator
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Documents & Attachments
              </h4>
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Upload Area */}
                <div style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📎</div>
                  <h5 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    Upload Documents
                  </h5>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                    Drag and drop files here or click to browse
                  </p>
                  <button className="btn-primary">
                    📁 Browse Files
                  </button>
                </div>

                {/* Existing Attachments */}
                {task.attachments.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
                      Existing Attachments
                    </h5>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {task.attachments.map((attachment, index) => (
                        <div key={index} style={{
                          background: 'var(--bg-tertiary)',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>📄</span>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{attachment}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-ghost btn-sm">📥 Download</button>
                            <button className="btn-ghost btn-sm">🗑️ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Financial Information
              </h4>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
                    💰 Cost Tracking
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Estimated Cost
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                        ${(task.estimatedHours * 50).toLocaleString()} {/* $50/hour example rate */}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Actual Cost
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                        ${((task.actualHours || 0) * 50).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
                    📊 Budget Status
                  </h5>
                  <div style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '12px', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      No budget assigned to this task
                    </div>
                    <button className="btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                      💰 Set Budget
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Complete Task History
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {taskUpdates
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(update => (
                    <div key={update.id} style={{
                      background: 'var(--bg-tertiary)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '16px' }}>{getUpdateIcon(update.type)}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{update.text}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            by {update.author}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(update.date).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {['documents', 'financials'].includes(activeTab) && activeTab !== 'documents' && activeTab !== 'financials' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab coming soon</h3>
              <p>This feature is under development</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {sitePermissions.canManage('tasks') && (
              <>
                <button
                  onClick={onDeleteTask}
                  style={{
                    background: 'var(--accent-danger-light)',
                    color: 'var(--accent-danger)',
                    border: '1px solid var(--accent-danger)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete Task
                </button>
                <button className="btn-secondary">
                  ✏️ Edit Task
                </button>
              </>
            )}
          </div>
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal
          task={task}
          onClose={() => setShowApprovalModal(false)}
          onSubmit={(approvalData) => {
            // Handle approval submission
            setShowApprovalModal(false)
          }}
        />
      )}
    </div>
  )
}

// Approval Modal Component
function ApprovalModal({ 
  task, 
  onClose, 
  onSubmit 
}: { 
  task: SiteTask
  onClose: () => void
  onSubmit: (data: Partial<TaskApproval>) => void 
}) {
  const [formData, setFormData] = useState({
    type: 'completion' as TaskApproval['type'],
    reason: '',
    comments: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100
    }}>
      <div className="card" style={{
        width: '500px',
        maxWidth: '90vw',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
          Request Approval
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Approval Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as TaskApproval['type']})}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="completion">Task Completion</option>
              <option value="scope-change">Scope Change</option>
              <option value="budget-change">Budget Change</option>
              <option value="deadline-extension">Deadline Extension</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Reason *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Explain why approval is needed..."
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
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Any additional information..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              📤 Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
