import { useState, useEffect } from 'react'
import { DemoDataService } from '../services/demoDataService'
import { Task, TaskUpdate, TaskApproval, TaskInvoiceLink } from '../types/tasks'
import { Site, Employee, Client } from '../types/reports'

export interface DemoDataState {
  site: Site
  employees: Employee[]
  client: Client
  tasks: Task[]
  taskUpdates: TaskUpdate[]
  taskApprovals: TaskApproval[]
  taskInvoiceLinks: TaskInvoiceLink[]
  statistics: ReturnType<typeof DemoDataService.getSiteStatistics>
  isLoading: boolean
  error: string | null
}

export function useDemoData(siteId: string = 'site-lvillas-001') {
  const [demoData, setDemoData] = useState<DemoDataState>({
    site: {} as Site,
    employees: [],
    client: {} as Client,
    tasks: [],
    taskUpdates: [],
    taskApprovals: [],
    taskInvoiceLinks: [],
    statistics: {} as any,
    isLoading: true,
    error: null
  })

  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)

  useEffect(() => {
    loadDemoData()
  }, [siteId])

  const loadDemoData = () => {
    try {
      setDemoData(prev => ({ ...prev, isLoading: true, error: null }))
      
      const data = DemoDataService.getDemoData()
      const statistics = DemoDataService.getSiteStatistics(siteId)
      
      setDemoData({
        site: data.site,
        employees: data.employees,
        client: data.client,
        tasks: data.tasks.filter((task: Task) => task.siteId === siteId),
        taskUpdates: data.taskUpdates,
        taskApprovals: data.taskApprovals,
        taskInvoiceLinks: data.taskInvoiceLinks,
        statistics,
        isLoading: false,
        error: null
      })
      
      setLastUpdateTime(Date.now())
    } catch (error) {
      console.error('Failed to load demo data:', error)
      setDemoData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load demo data'
      }))
    }
  }

  const refreshData = () => {
    loadDemoData()
  }

  const addSampleTask = (taskData: Partial<Task>) => {
    try {
      const newTask = DemoDataService.addSampleTask(siteId, taskData)
      loadDemoData() // Reload to get updated data
      return newTask
    } catch (error) {
      console.error('Failed to add sample task:', error)
      setDemoData(prev => ({
        ...prev,
        error: 'Failed to add sample task'
      }))
      throw error
    }
  }

  const clearDemoData = () => {
    DemoDataService.clearDemoData()
    loadDemoData()
  }

  const exportForPresentation = () => {
    return DemoDataService.exportDemoDataForPresentation()
  }

  // Get tasks with enhanced filtering
  const getFilteredTasks = (filters: {
    status?: string[]
    priority?: string[]
    category?: string[]
    assignedTo?: string[]
    searchTerm?: string
  } = {}) => {
    let filtered = demoData.tasks

    if (filters.status?.length) {
      filtered = filtered.filter(task => filters.status!.includes(task.status))
    }

    if (filters.priority?.length) {
      filtered = filtered.filter(task => filters.priority!.includes(task.priority))
    }

    if (filters.category?.length) {
      filtered = filtered.filter(task => filters.category!.includes(task.category))
    }

    if (filters.assignedTo?.length) {
      filtered = filtered.filter(task => 
        task.assignedTo.some(assignee => filters.assignedTo!.includes(assignee))
      )
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        (task.titleAr && task.titleAr.includes(searchLower)) ||
        (task.descriptionAr && task.descriptionAr.includes(searchLower))
      )
    }

    return filtered
  }

  // Get recent activity across all tasks
  const getRecentActivity = (limit: number = 10) => {
    return demoData.taskUpdates
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(update => {
        const task = demoData.tasks.find(t => t.id === update.taskId)
        return {
          ...update,
          taskTitle: task?.title || 'Unknown Task',
          taskTitleAr: task?.titleAr || 'مهمة غير معروفة'
        }
      })
  }

  // Get pending approvals with task context
  const getPendingApprovals = () => {
    return demoData.taskApprovals
      .filter(approval => approval.status === 'PENDING')
      .map(approval => {
        const task = demoData.tasks.find(t => t.id === approval.taskId)
        return {
          ...approval,
          taskTitle: task?.title || 'Unknown Task',
          taskTitleAr: task?.titleAr || 'مهمة غير معروفة'
        }
      })
  }

  // Get upcoming deadlines
  const getUpcomingDeadlines = (days: number = 7) => {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    
    return demoData.tasks
      .filter(task => 
        task.status !== 'COMPLETED' && 
        new Date(task.dueDate) <= cutoffDate
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  // Get overdue tasks
  const getOverdueTasks = () => {
    const now = new Date()
    
    return demoData.tasks
      .filter(task => 
        task.status !== 'COMPLETED' && 
        new Date(task.dueDate) < now
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  // Get task completion trend for charts
  const getTaskCompletionTrend = (days: number = 30) => {
    const trend = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const completedOnDate = demoData.tasks.filter(task => 
        task.status === 'COMPLETED' && 
        task.completedDate === dateStr
      ).length
      
      trend.push({
        date: dateStr,
        completed: completedOnDate,
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    
    return trend
  }

  // Get budget utilization data
  const getBudgetUtilization = () => {
    const taskBudgets = demoData.tasks.map(task => ({
      taskId: task.id,
      title: task.title,
      category: task.category,
      budgeted: task.budget || 0,
      spent: task.actualCost || 0,
      utilization: task.budget ? Math.round(((task.actualCost || 0) / task.budget) * 100) : 0
    }))
    
    return {
      tasks: taskBudgets,
      summary: {
        totalBudget: demoData.statistics.totalBudget,
        totalSpent: demoData.statistics.totalSpent,
        remainingBudget: demoData.statistics.totalBudget - demoData.statistics.totalSpent,
        utilizationPercentage: Math.round((demoData.statistics.totalSpent / demoData.statistics.totalBudget) * 100)
      }
    }
  }

  return {
    ...demoData,
    lastUpdateTime,
    refreshData,
    addSampleTask,
    clearDemoData,
    exportForPresentation,
    getFilteredTasks,
    getRecentActivity,
    getPendingApprovals,
    getUpcomingDeadlines,
    getOverdueTasks,
    getTaskCompletionTrend,
    getBudgetUtilization
  }
}

// Hook for managing demo data state across components
export function useDemoDataProvider() {
  const [isInitialized, setIsInitialized] = useState(DemoDataService.isDemoDataInitialized())
  
  const initializeDemo = () => {
    DemoDataService.initializeDemoData()
    setIsInitialized(true)
  }
  
  const clearDemo = () => {
    DemoDataService.clearDemoData()
    setIsInitialized(false)
  }
  
  const resetDemo = () => {
    clearDemo()
    initializeDemo()
  }
  
  return {
    isInitialized,
    initializeDemo,
    clearDemo,
    resetDemo
  }
}
