import React, { useState, useEffect } from 'react'
import { useSitePermissions } from '../../../contexts/RBACContext'
import { useFormSubmission } from '../../../hooks/useFormSubmission'
import type { Site } from '../../SiteManagement'
import { TaskDetailView } from './TaskDetailView'
import { QuickUpdateWidget, FloatingQuickUpdate } from './QuickUpdateWidget'
import { ApprovalWorkflow } from './ApprovalWorkflow'
import { ApprovalDashboard } from './ApprovalDashboard'
import { NotificationBadge } from './ApprovalNotifications'
import { PDFReportGenerator, ExcelExporter } from '../../reports'

// Types for Site Tasks
export interface SiteTask {
  id: string
  siteId: string
  title: string
  description: string
  category: 'construction' | 'safety' | 'inspection' | 'maintenance' | 'planning' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'not-started' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'
  assignedTo: string
  assignedBy: string
  dueDate: string
  startDate?: string
  completedDate?: string
  estimatedHours: number
  actualHours?: number
  progress: number
  dependencies: string[]
  tags: string[]
  comments: {
    id: string
    text: string
    author: string
    date: string
  }[]
  attachments: string[]
  createdAt: string
  updatedAt: string
}

interface Props {
  site: Site
}

export function SiteTasks({ site }: Props) {
  const sitePermissions = useSitePermissions(site.id)
  const [siteTasks, setSiteTasks] = useState<SiteTask[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<SiteTask | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'board'>('cards')
  const [selectedTask, setSelectedTask] = useState<SiteTask | null>(null)
  const [showQuickUpdate, setShowQuickUpdate] = useState(false)
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false)
  const [showApprovalDashboard, setShowApprovalDashboard] = useState(false)
  const [approvalTask, setApprovalTask] = useState<SiteTask | null>(null)
  const [showPDFGenerator, setShowPDFGenerator] = useState(false)
  const [showExcelExporter, setShowExcelExporter] = useState(false)

  // Load site tasks
  useEffect(() => {
    const savedTasks = localStorage.getItem(`site_tasks_${site.id}`)
    if (savedTasks) {
      setSiteTasks(JSON.parse(savedTasks))
    } else {
      // Sample data for demonstration
      const sampleTasks: SiteTask[] = [
        {
          id: '1',
          siteId: site.id,
          title: 'Foundation Inspection',
          description: 'Conduct thorough inspection of foundation work before proceeding to next phase',
          category: 'inspection',
          priority: 'high',
          status: 'completed',
          assignedTo: 'Ahmed Hassan',
          assignedBy: 'Fatima Al-Zahra',
          dueDate: '2024-03-15',
          startDate: '2024-03-10',
          completedDate: '2024-03-12',
          estimatedHours: 4,
          actualHours: 3.5,
          progress: 100,
          dependencies: [],
          tags: ['foundation', 'quality-control'],
          comments: [
            {
              id: '1',
              text: 'Foundation looks solid, no issues found',
              author: 'Ahmed Hassan',
              date: '2024-03-12'
            }
          ],
          attachments: ['foundation_inspection_report.pdf'],
          createdAt: '2024-03-08T00:00:00Z',
          updatedAt: '2024-03-12T00:00:00Z'
        },
        {
          id: '2',
          siteId: site.id,
          title: 'Safety Equipment Check',
          description: 'Weekly safety equipment inspection and maintenance',
          category: 'safety',
          priority: 'critical',
          status: 'in-progress',
          assignedTo: 'Omar Al-Rashid',
          assignedBy: 'Ahmed Hassan',
          dueDate: '2024-08-30',
          startDate: '2024-08-28',
          estimatedHours: 2,
          actualHours: 1.5,
          progress: 75,
          dependencies: [],
          tags: ['safety', 'weekly', 'equipment'],
          comments: [
            {
              id: '2',
              text: 'Found 2 helmets need replacement',
              author: 'Omar Al-Rashid',
              date: '2024-08-28'
            }
          ],
          attachments: [],
          createdAt: '2024-08-25T00:00:00Z',
          updatedAt: '2024-08-28T00:00:00Z'
        },
        {
          id: '3',
          siteId: site.id,
          title: 'Concrete Pouring Schedule',
          description: 'Plan and coordinate concrete pouring for floors 3-5',
          category: 'planning',
          priority: 'medium',
          status: 'not-started',
          assignedTo: 'Fatima Al-Zahra',
          assignedBy: 'Ahmed Hassan',
          dueDate: '2024-09-05',
          estimatedHours: 8,
          progress: 0,
          dependencies: ['1'],
          tags: ['concrete', 'scheduling', 'coordination'],
          comments: [],
          attachments: [],
          createdAt: '2024-08-20T00:00:00Z',
          updatedAt: '2024-08-20T00:00:00Z'
        },
        {
          id: '4',
          siteId: site.id,
          title: 'Equipment Maintenance - Crane',
          description: 'Scheduled maintenance for tower crane TC7032',
          category: 'maintenance',
          priority: 'high',
          status: 'on-hold',
          assignedTo: 'Layla Mansour',
          assignedBy: 'Omar Al-Rashid',
          dueDate: '2024-09-15',
          estimatedHours: 6,
          progress: 25,
          dependencies: [],
          tags: ['crane', 'maintenance', 'scheduled'],
          comments: [
            {
              id: '3',
              text: 'Waiting for replacement parts to arrive',
              author: 'Layla Mansour',
              date: '2024-08-25'
            }
          ],
          attachments: ['crane_maintenance_schedule.pdf'],
          createdAt: '2024-08-15T00:00:00Z',
          updatedAt: '2024-08-25T00:00:00Z'
        }
      ]
      setSiteTasks(sampleTasks)
      localStorage.setItem(`site_tasks_${site.id}`, JSON.stringify(sampleTasks))
    }
  }, [site.id])

  const saveTasks = (tasks: SiteTask[]) => {
    setSiteTasks(tasks)
    localStorage.setItem(`site_tasks_${site.id}`, JSON.stringify(tasks))
  }

  const handleAddTask = (taskData: Partial<SiteTask>) => {
    const newTask: SiteTask = {
      id: Date.now().toString(),
      siteId: site.id,
      title: taskData.title || '',
      description: taskData.description || '',
      category: taskData.category || 'other',
      priority: taskData.priority || 'medium',
      status: 'not-started',
      assignedTo: taskData.assignedTo || '',
      assignedBy: 'Current User', // In real app, get from auth
      dueDate: taskData.dueDate || '',
      estimatedHours: taskData.estimatedHours || 0,
      progress: 0,
      dependencies: taskData.dependencies || [],
      tags: taskData.tags || [],
      comments: [],
      attachments: taskData.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    saveTasks([...siteTasks, newTask])
    setShowTaskModal(false)
  }

  const handleEditTask = (taskData: Partial<SiteTask>) => {
    if (!editingTask) return
    const updatedTask = { 
      ...editingTask, 
      ...taskData,
      updatedAt: new Date().toISOString()
    }
    saveTasks(siteTasks.map(t => t.id === editingTask.id ? updatedTask : t))
    setEditingTask(null)
    setShowTaskModal(false)
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      saveTasks(siteTasks.filter(t => t.id !== taskId))
    }
  }

  const handleUpdateProgress = (taskId: string, progress: number) => {
    const task = siteTasks.find(t => t.id === taskId)
    if (!task) return

    let status: SiteTask['status'] = task.status
    let completedDate = task.completedDate
    let startDate = task.startDate

    if (progress > 0 && task.status === 'not-started') {
      status = 'in-progress'
      startDate = new Date().toISOString().split('T')[0]
    } else if (progress === 100 && task.status !== 'completed') {
      status = 'completed'
      completedDate = new Date().toISOString().split('T')[0]
    } else if (progress < 100 && task.status === 'completed') {
      status = 'in-progress'
      completedDate = undefined
    }

    saveTasks(siteTasks.map(t => 
      t.id === taskId 
        ? { ...t, progress, status, completedDate, startDate, updatedAt: new Date().toISOString() }
        : t
    ))
  }

  const handleUpdateTask = (taskId: string, updates: Partial<SiteTask>) => {
    saveTasks(siteTasks.map(t => 
      t.id === taskId 
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    ))
  }

  const handleTaskClick = (task: SiteTask) => {
    setSelectedTask(task)
  }

  const filteredTasks = siteTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === 'all' || task.assignedTo === assigneeFilter
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority && matchesAssignee
  })

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

  const categories = Array.from(new Set(siteTasks.map(t => t.category)))
  const assignees = Array.from(new Set(siteTasks.map(t => t.assignedTo)))
  const completedCount = siteTasks.filter(t => t.status === 'completed').length
  const inProgressCount = siteTasks.filter(t => t.status === 'in-progress').length
  const overdueCount = siteTasks.filter(t => {
    if (t.status === 'completed') return false
    return new Date(t.dueDate) < new Date()
  }).length
  const avgProgress = siteTasks.length > 0 
    ? Math.round(siteTasks.reduce((sum, t) => sum + t.progress, 0) / siteTasks.length)
    : 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Site Tasks</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            {['cards', 'list', 'board'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                style={{
                  padding: '6px 12px',
                  background: viewMode === mode ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: mode === 'cards' ? 'var(--radius-md) 0 0 var(--radius-md)' : 
                            mode === 'board' ? '0 var(--radius-md) var(--radius-md) 0' : '0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textTransform: 'capitalize'
                }}
              >
                {mode === 'cards' ? '📊' : mode === 'list' ? '📋' : '📋'} {mode}
              </button>
            ))}
          </div>
          
          {/* Approval Workflow & Reports Controls */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowPDFGenerator(true)}
              className="btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📄 PDF Report
            </button>
            <button
              onClick={() => setShowExcelExporter(true)}
              className="btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📊 Excel Export
            </button>
            <button
              onClick={() => setShowApprovalDashboard(true)}
              className="btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📋 Approvals
              <NotificationBadge siteId={site.id} />
            </button>
          </div>
          
          {sitePermissions.canManage('tasks') && (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary btn-sm">
              ✅ Add Task
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--accent-secondary-light)',
          border: '1px solid var(--accent-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
            {completedCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div>
        </div>
        <div style={{
          background: 'var(--accent-info-light)',
          border: '1px solid var(--accent-info)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-info)' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
        </div>
        <div style={{
          background: 'var(--accent-danger-light)',
          border: '1px solid var(--accent-danger)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-danger)' }}>
            {overdueCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div>
        </div>
        <div style={{
          background: 'var(--accent-primary-light)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {avgProgress}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Progress</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Status</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Assignees</option>
          {assignees.map(assignee => (
            <option key={assignee} value={assignee}>{assignee}</option>
          ))}
        </select>
      </div>

      {/* Tasks View */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredTasks.map(task => {
            const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date()
            const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            
            return (
              <div 
                key={task.id} 
                className="card" 
                style={{ 
                  padding: '20px', 
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={() => handleTaskClick(task)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {isOverdue && (
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
                    OVERDUE
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{getCategoryIcon(task.category)}</span>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        margin: 0, 
                        color: 'var(--text-primary)' 
                      }}>
                        {task.title}
                      </h4>
                      <span style={{
                        background: getStatusColor(task.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <span style={{
                        background: getPriorityColor(task.priority),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)', 
                      margin: '0 0 12px 0'
                    }}>
                      {task.description}
                    </p>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>👤 {task.assignedTo}</span>
                      <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span>⏱️ {task.estimatedHours}h estimated</span>
                      {task.actualHours && (
                        <span>✅ {task.actualHours}h actual</span>
                      )}
                      {daysUntilDue > 0 && !isOverdue && (
                        <span>🕒 {daysUntilDue} days left</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {sitePermissions.canManage('tasks') && (
                      <FloatingQuickUpdate
                        task={task}
                        onUpdateTask={(updates) => handleUpdateTask(task.id, updates)}
                        compact
                      />
                    )}
                    {sitePermissions.canManage('approvals') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setApprovalTask(task)
                          setShowApprovalWorkflow(true)
                        }}
                        className="btn-ghost btn-sm"
                        title="Request Approval"
                      >
                        📋
                      </button>
                    )}
                    {sitePermissions.canManage('tasks') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTask(task)
                          setShowTaskModal(true)
                        }}
                        className="btn-ghost btn-sm"
                      >
                        ✏️
                      </button>
                    )}
                    {sitePermissions.canManage('tasks') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTask(task.id)
                        }}
                        style={{
                          background: 'var(--accent-danger-light)',
                          color: 'var(--accent-danger)',
                          border: '1px solid var(--accent-danger)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '6px' 
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                      {task.progress}%
                    </span>
                  </div>
                  <div className="progress" style={{ marginBottom: '8px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${task.progress}%`,
                        background: task.status === 'completed' ? 'var(--accent-secondary)' : 'var(--accent-primary)'
                      }} 
                    />
                  </div>
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={task.progress}
                        onChange={(e) => handleUpdateProgress(task.id, parseInt(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress}
                        onChange={(e) => handleUpdateProgress(task.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        style={{ width: '60px', padding: '2px 6px', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Tags and Comments */}
                {(task.tags.length > 0 || task.comments.length > 0) && (
                  <div style={{
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px'
                  }}>
                    {task.tags.length > 0 && (
                      <div style={{ marginBottom: task.comments.length > 0 ? '8px' : '0' }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Tags:</span>
                        {task.tags.map(tag => (
                          <span key={tag} style={{
                            background: 'var(--accent-primary-light)',
                            color: 'var(--accent-primary)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            marginRight: '4px'
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {task.comments.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          💬 {task.comments.length} comment(s)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* List/Board views would be implemented here */
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
          <h3>{viewMode === 'list' ? 'List' : 'Board'} view coming soon</h3>
          <p>Switch to Cards view to manage tasks</p>
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3>No tasks found</h3>
          <p>Add tasks to track site work or adjust your search criteria</p>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          tasks={siteTasks}
          onSave={editingTask ? handleEditTask : handleAddTask}
          onCancel={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
        />
      )}

      {/* Task Detail View */}
      {selectedTask && (
        <TaskDetailView
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(updates) => {
            handleUpdateTask(selectedTask.id, updates)
            setSelectedTask({ ...selectedTask, ...updates })
          }}
          onDeleteTask={() => {
            handleDeleteTask(selectedTask.id)
            setSelectedTask(null)
          }}
        />
      )}

      {/* Quick Update Widget - Only show for in-progress tasks */}
      {filteredTasks.some(t => t.status === 'in-progress') && !selectedTask && (
        <QuickUpdateWidget
          task={filteredTasks.find(t => t.status === 'in-progress')!}
          onUpdateTask={(updates) => {
            const task = filteredTasks.find(t => t.status === 'in-progress')
            if (task) handleUpdateTask(task.id, updates)
          }}
        />
      )}

      {/* Approval Workflow Modal */}
      {showApprovalWorkflow && approvalTask && (
        <ApprovalWorkflow
          task={approvalTask}
          onClose={() => {
            setShowApprovalWorkflow(false)
            setApprovalTask(null)
          }}
          onApprovalSubmitted={(approval) => {
            console.log('Approval submitted:', approval)
            // In a real app, this would trigger notifications and workflow updates
          }}
        />
      )}

      {/* Approval Dashboard Modal */}
      {showApprovalDashboard && (
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
            width: '95vw',
            maxWidth: '1200px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}>
            {/* Dashboard Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  📋 Approval Dashboard
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  {site.name} - Manage all approval workflows
                </p>
              </div>
              <button
                onClick={() => setShowApprovalDashboard(false)}
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

            {/* Dashboard Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <ApprovalDashboard
                siteId={site.id}
                tasks={siteTasks}
                onApprovalAction={(approvalId, action) => {
                  console.log('Approval action:', approvalId, action)
                  // Handle approval actions here
                  if (action === 'view') {
                    // Find the task and open approval workflow
                    // This could be enhanced to show specific approval details
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Generator Modal */}
      {showPDFGenerator && (
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
            width: '95vw',
            maxWidth: '1200px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}>
            <PDFReportGenerator
              site={site}
              tasks={siteTasks}
              approvals={[]} // In a real app, fetch approvals from API/localStorage
              onClose={() => setShowPDFGenerator(false)}
            />
          </div>
        </div>
      )}

      {/* Excel Exporter Modal */}
      {showExcelExporter && (
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
            width: '95vw',
            maxWidth: '1200px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}>
            <ExcelExporter
              site={site}
              tasks={siteTasks}
              approvals={[]} // In a real app, fetch approvals from API/localStorage
              onClose={() => setShowExcelExporter(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Task Modal Component
function TaskModal({ 
  task, 
  tasks,
  onSave, 
  onCancel 
}: { 
  task: SiteTask | null
  tasks: SiteTask[]
  onSave: (task: Partial<SiteTask>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'construction',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate || '',
    estimatedHours: task?.estimatedHours || 0,
    tags: task?.tags.join(', ') || '',
    dependencies: task?.dependencies || []
  })

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 1000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      try {
        const tags = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)

        await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API call
        onSave({
          ...formData,
          tags
        })
      } catch (error) {
        console.error('Error saving task:', error)
        throw error
      }
    })
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

  const availableDependencies = tasks.filter(t => 
    t.id !== task?.id && t.status === 'completed'
  )

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
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
          {task ? 'Edit Task' : 'Add New Task'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%' }}
              placeholder="e.g. Foundation Inspection, Safety Equipment Check"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Describe what needs to be accomplished..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as SiteTask['category']})}
                style={{ width: '100%' }}
                required
              >
                <option value="construction">{getCategoryIcon('construction')} Construction</option>
                <option value="safety">{getCategoryIcon('safety')} Safety</option>
                <option value="inspection">{getCategoryIcon('inspection')} Inspection</option>
                <option value="maintenance">{getCategoryIcon('maintenance')} Maintenance</option>
                <option value="planning">{getCategoryIcon('planning')} Planning</option>
                <option value="other">{getCategoryIcon('other')} Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as SiteTask['priority']})}
                style={{ width: '100%' }}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Estimated Hours *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({...formData, estimatedHours: Number(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Assigned To *
              </label>
              <input
                type="text"
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                style={{ width: '100%' }}
                placeholder="Employee name"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              style={{ width: '100%' }}
              placeholder="e.g. foundation, quality-control, urgent (separate with commas)"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> {task ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                task ? 'Update Task' : 'Add Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
