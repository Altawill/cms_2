import React, { useState } from 'react'
import { useFormSubmission } from '../../../hooks/useFormSubmission'
import type { SiteTask } from './SiteTasks'

interface Props {
  task: SiteTask
  onUpdateTask: (updates: Partial<SiteTask>) => void
}

export function QuickUpdateWidget({ task, onUpdateTask }: Props) {
  const [showWidget, setShowWidget] = useState(false)
  const [quickComment, setQuickComment] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [progressUpdate, setProgressUpdate] = useState(task.progress.toString())

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 500
  })

  const handleQuickUpdate = async () => {
    await protectedSubmit(async () => {
      const updates: Partial<SiteTask> = {
        updatedAt: new Date().toISOString()
      }

      // Update progress if changed
      const newProgress = parseInt(progressUpdate)
      if (newProgress !== task.progress && !isNaN(newProgress)) {
        updates.progress = Math.min(100, Math.max(0, newProgress))
        
        // Auto-update status based on progress
        if (newProgress > 0 && task.status === 'not-started') {
          updates.status = 'in-progress'
          updates.startDate = new Date().toISOString().split('T')[0]
        } else if (newProgress === 100 && task.status !== 'completed') {
          updates.status = 'completed'
          updates.completedDate = new Date().toISOString().split('T')[0]
        }
      }

      // Update hours worked
      const hours = parseFloat(hoursWorked)
      if (!isNaN(hours) && hours > 0) {
        updates.actualHours = (task.actualHours || 0) + hours
      }

      onUpdateTask(updates)

      // Log update
      if (quickComment || hoursWorked || newProgress !== task.progress.toString()) {
        const updateLog = {
          id: Date.now().toString(),
          taskId: task.id,
          text: quickComment || `Quick update: ${hoursWorked ? `+${hoursWorked}h worked` : ''}${newProgress !== task.progress.toString() ? ` Progress: ${task.progress}% → ${newProgress}%` : ''}`.trim(),
          author: 'Current User',
          date: new Date().toISOString(),
          type: 'comment' as const
        }

        const existingUpdates = JSON.parse(localStorage.getItem(`task_updates_${task.id}`) || '[]')
        const updatedList = [...existingUpdates, updateLog]
        localStorage.setItem(`task_updates_${task.id}`, JSON.stringify(updatedList))
      }

      // Reset form
      setQuickComment('')
      setHoursWorked('')
      setProgressUpdate(updates.progress?.toString() || task.progress.toString())
      setShowWidget(false)
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

  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date()

  if (!showWidget) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 900
      }}>
        <button
          onClick={() => setShowWidget(true)}
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          }}
          title="Quick Update"
        >
          ⚡
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 900
    }}>
      <div className="card" style={{
        width: '320px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            ⚡ Quick Update
          </h4>
          <button
            onClick={() => setShowWidget(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Task Info */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{task.title}</span>
            {isOverdue && (
              <span style={{
                background: 'var(--accent-danger)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10px'
              }}>
                OVERDUE
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Assigned to {task.assignedTo} • Due {new Date(task.dueDate).toLocaleDateString()}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginTop: '8px' 
          }}>
            <div style={{
              background: getStatusColor(task.status),
              color: 'white',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {task.status.replace('-', ' ')}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--accent-primary)' }}>
              {task.progress}%
            </span>
          </div>
        </div>

        {/* Quick Update Form */}
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '12px', 
              fontWeight: '500',
              color: 'var(--text-muted)'
            }}>
              Progress Update
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
                style={{ 
                  width: '50px', 
                  padding: '4px', 
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '12px', 
              fontWeight: '500',
              color: 'var(--text-muted)'
            }}>
              Hours Worked Today
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 2.5"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '6px 8px', 
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '12px', 
              fontWeight: '500',
              color: 'var(--text-muted)'
            }}>
              Quick Comment
            </label>
            <textarea
              rows={2}
              placeholder="What did you work on today?"
              value={quickComment}
              onChange={(e) => setQuickComment(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                fontSize: '14px',
                resize: 'none'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => setShowWidget(false)}
              style={{
                flex: 1,
                padding: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleQuickUpdate}
              disabled={isSubmitting}
              style={{
                flex: 2,
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? (
                <>⏳ Updating...</>
              ) : (
                <>⚡ Quick Update</>
              )}
            </button>
          </div>
        </div>

        {/* Quick Status Buttons */}
        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: 'var(--text-muted)', 
              marginBottom: '8px' 
            }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {task.status === 'not-started' && (
                <button
                  onClick={() => {
                    onUpdateTask({ 
                      status: 'in-progress', 
                      startDate: new Date().toISOString().split('T')[0],
                      progress: Math.max(task.progress, 5),
                      updatedAt: new Date().toISOString()
                    })
                    setShowWidget(false)
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--accent-info)',
                    color: 'white',
                    border: 'none',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  ▶️ Start
                </button>
              )}
              {task.status === 'in-progress' && (
                <>
                  <button
                    onClick={() => {
                      onUpdateTask({ 
                        status: 'on-hold',
                        updatedAt: new Date().toISOString()
                      })
                      setShowWidget(false)
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--accent-warning)',
                      color: 'white',
                      border: 'none',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    onClick={() => {
                      onUpdateTask({ 
                        status: 'completed',
                        progress: 100,
                        completedDate: new Date().toISOString().split('T')[0],
                        updatedAt: new Date().toISOString()
                      })
                      setShowWidget(false)
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--accent-secondary)',
                      color: 'white',
                      border: 'none',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ✅ Complete
                  </button>
                </>
              )}
              {task.status === 'on-hold' && (
                <button
                  onClick={() => {
                    onUpdateTask({ 
                      status: 'in-progress',
                      updatedAt: new Date().toISOString()
                    })
                    setShowWidget(false)
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--accent-info)',
                    color: 'white',
                    border: 'none',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  ▶️ Resume
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Floating Quick Update Button for task cards
export function FloatingQuickUpdate({ 
  task, 
  onUpdateTask,
  compact = false 
}: Props & { compact?: boolean }) {
  const [showDropdown, setShowDropdown] = useState(false)

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

  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Quick Update"
        >
          ⚡
        </button>

        {showDropdown && (
          <>
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '180px',
              zIndex: 1000
            }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Progress: {task.progress}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={task.progress}
                  onChange={(e) => {
                    const newProgress = parseInt(e.target.value)
                    let updates: Partial<SiteTask> = { 
                      progress: newProgress,
                      updatedAt: new Date().toISOString()
                    }

                    if (newProgress > 0 && task.status === 'not-started') {
                      updates.status = 'in-progress'
                      updates.startDate = new Date().toISOString().split('T')[0]
                    } else if (newProgress === 100 && task.status !== 'completed') {
                      updates.status = 'completed'
                      updates.completedDate = new Date().toISOString().split('T')[0]
                    }

                    onUpdateTask(updates)
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gap: '4px' }}>
                {task.status === 'not-started' && (
                  <button
                    onClick={() => {
                      onUpdateTask({ 
                        status: 'in-progress',
                        startDate: new Date().toISOString().split('T')[0],
                        progress: Math.max(task.progress, 5),
                        updatedAt: new Date().toISOString()
                      })
                      setShowDropdown(false)
                    }}
                    style={{
                      background: 'var(--accent-info)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      width: '100%'
                    }}
                  >
                    ▶️ Start Task
                  </button>
                )}
                
                {task.status === 'in-progress' && (
                  <>
                    <button
                      onClick={() => {
                        onUpdateTask({ 
                          status: 'on-hold',
                          updatedAt: new Date().toISOString()
                        })
                        setShowDropdown(false)
                      }}
                      style={{
                        background: 'var(--accent-warning)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        width: '100%'
                      }}
                    >
                      ⏸️ Put On Hold
                    </button>
                    <button
                      onClick={() => {
                        onUpdateTask({ 
                          status: 'completed',
                          progress: 100,
                          completedDate: new Date().toISOString().split('T')[0],
                          updatedAt: new Date().toISOString()
                        })
                        setShowDropdown(false)
                      }}
                      style={{
                        background: 'var(--accent-secondary)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        width: '100%'
                      }}
                    >
                      ✅ Mark Complete
                    </button>
                  </>
                )}

                {task.status === 'on-hold' && (
                  <button
                    onClick={() => {
                      onUpdateTask({ 
                        status: 'in-progress',
                        updatedAt: new Date().toISOString()
                      })
                      setShowDropdown(false)
                    }}
                    style={{
                      background: 'var(--accent-info)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      width: '100%'
                    }}
                  >
                    ▶️ Resume Task
                  </button>
                )}
              </div>

              <div style={{ 
                marginTop: '8px', 
                paddingTop: '8px', 
                borderTop: '1px solid var(--border-color)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                Click outside to close
              </div>
            </div>

            {/* Click outside to close */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1
              }}
              onClick={() => setShowDropdown(false)}
            />
          </>
        )}
      </div>
    )
  }
  
  // Full dropdown view (non-compact)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: getStatusColor(task.status),
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        ⚡ Quick Update ({task.progress}%)
      </button>

      {showDropdown && (
        <>
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
            zIndex: 1000
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '6px' }}>
                Update Progress: {task.progress}%
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={task.progress}
                onChange={(e) => {
                  const newProgress = parseInt(e.target.value)
                  let updates: Partial<SiteTask> = { 
                    progress: newProgress,
                    updatedAt: new Date().toISOString()
                  }

                  if (newProgress > 0 && task.status === 'not-started') {
                    updates.status = 'in-progress'
                    updates.startDate = new Date().toISOString().split('T')[0]
                  } else if (newProgress === 100 && task.status !== 'completed') {
                    updates.status = 'completed'
                    updates.completedDate = new Date().toISOString().split('T')[0]
                  }

                  onUpdateTask(updates)
                }}
                style={{ width: '100%', marginBottom: '8px' }}
              />
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              {task.status === 'not-started' && (
                <button
                  onClick={() => {
                    onUpdateTask({ 
                      status: 'in-progress',
                      startDate: new Date().toISOString().split('T')[0],
                      progress: Math.max(task.progress, 10),
                      updatedAt: new Date().toISOString()
                    })
                    setShowDropdown(false)
                  }}
                  style={{
                    background: 'var(--accent-info)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    width: '100%'
                  }}
                >
                  ▶️ Start Task
                </button>
              )}
              
              {task.status === 'in-progress' && (
                <>
                  <button
                    onClick={() => {
                      onUpdateTask({ 
                        status: 'on-hold',
                        updatedAt: new Date().toISOString()
                      })
                      setShowDropdown(false)
                    }}
                    style={{
                      background: 'var(--accent-warning)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      width: '100%'
                    }}
                  >
                    ⏸️ Put On Hold
                  </button>
                  <button
                    onClick={() => {
                      onUpdateTask({ 
                        status: 'completed',
                        progress: 100,
                        completedDate: new Date().toISOString().split('T')[0],
                        updatedAt: new Date().toISOString()
                      })
                      setShowDropdown(false)
                    }}
                    style={{
                      background: 'var(--accent-secondary)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      width: '100%'
                    }}
                  >
                    ✅ Mark Complete
                  </button>
                </>
              )}

              {task.status === 'on-hold' && (
                <button
                  onClick={() => {
                    onUpdateTask({ 
                      status: 'in-progress',
                      updatedAt: new Date().toISOString()
                    })
                    setShowDropdown(false)
                  }}
                  style={{
                    background: 'var(--accent-info)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    width: '100%'
                  }}
                >
                  ▶️ Resume Task
                </button>
              )}
            </div>

            <div style={{ 
              marginTop: '12px', 
              paddingTop: '8px', 
              borderTop: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              Click outside to close
            </div>
          </div>

          {/* Click outside to close overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: -1
            }}
            onClick={() => setShowDropdown(false)}
          />
        </>
      )}
    </div>
  )
}
