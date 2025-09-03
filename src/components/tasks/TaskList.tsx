import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Filter, 
  SortAsc, 
  Grid3X3, 
  List, 
  Plus,
  Download,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react'
import { Task, Employee, TaskStatus, TaskPriority, TaskCategory } from '../../types'
import TaskCard from './TaskCard'
import VirtualizedList from '../common/VirtualizedList'
import { cn } from '../../utils'
import { 
  useEnhancedMemo, 
  useDebouncedCallback, 
  usePerformanceMonitor,
  useOptimizedList,
  usePagination,
  OptimizedCard
} from '../../utils/performance'

interface TaskListProps {
  tasks: Task[]
  employees: Employee[]
  loading?: boolean
  onTaskClick: (task: Task) => void
  onQuickUpdate?: (task: Task) => void
  onCreateTask?: () => void
  onExportTasks?: (tasks: Task[]) => void
  onRefresh?: () => void
  siteId?: string
  showFilters?: boolean
  className?: string
}

type SortOption = 'priority' | 'status' | 'progress' | 'dueDate' | 'name' | 'created'
type ViewMode = 'grid' | 'list'

interface FilterState {
  search: string
  status: TaskStatus | 'ALL'
  priority: TaskPriority | 'ALL'
  category: TaskCategory | 'ALL'
  executorId: string
  overdue: boolean
}

export default function TaskList({
  tasks,
  employees,
  loading = false,
  onTaskClick,
  onQuickUpdate,
  onCreateTask,
  onExportTasks,
  onRefresh,
  siteId,
  showFilters = true,
  className
}: TaskListProps) {
  const { t } = useTranslation()
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [sortDesc, setSortDesc] = useState(true)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    executorId: '',
    overdue: false
  })
  
  // Performance settings
  const [useVirtualization, setUseVirtualization] = useState(tasks.length > 100)
  const [usePagination, setUsePagination] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Performance monitoring
  const { start: startFilter, end: endFilter } = usePerformanceMonitor('task-list-filter')

  // Optimized filter function with performance monitoring
  const filterFunction = useCallback((task: Task) => {
    startFilter()
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = task.name.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.code.toLowerCase().includes(searchLower)
      if (!matchesSearch) {
        endFilter()
        return false
      }
    }

    // Status filter
    if (filters.status !== 'ALL' && task.status !== filters.status) {
      endFilter()
      return false
    }

    // Priority filter
    if (filters.priority !== 'ALL' && task.priority !== filters.priority) {
      endFilter()
      return false
    }

    // Category filter
    if (filters.category !== 'ALL' && task.category !== filters.category) {
      endFilter()
      return false
    }

    // Executor filter
    if (filters.executorId && task.executorId !== filters.executorId) {
      endFilter()
      return false
    }

    // Overdue filter
    if (filters.overdue) {
      const now = new Date()
      const isOverdue = task.expectedCompletionDate && 
        task.expectedCompletionDate < now &&
        task.status !== 'COMPLETED'
      if (!isOverdue) {
        endFilter()
        return false
      }
    }

    endFilter()
    return true
  }, [filters, startFilter, endFilter])

  // Optimized sort function
  const sortFunction = useCallback((a: Task, b: Task) => {
    let aVal: any, bVal: any

    switch (sortBy) {
      case 'priority':
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        aVal = priorityOrder[a.priority]
        bVal = priorityOrder[b.priority]
        break
      case 'status':
        const statusOrder = { IN_PROGRESS: 4, PLANNED: 3, ON_HOLD: 2, COMPLETED: 1, CANCELLED: 0 }
        aVal = statusOrder[a.status]
        bVal = statusOrder[b.status]
        break
      case 'progress':
        aVal = a.progress
        bVal = b.progress
        break
      case 'dueDate':
        aVal = a.expectedCompletionDate?.getTime() || 0
        bVal = b.expectedCompletionDate?.getTime() || 0
        break
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'created':
        aVal = a.createdAt.getTime()
        bVal = b.createdAt.getTime()
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDesc ? 1 : -1
    if (aVal > bVal) return sortDesc ? -1 : 1
    return 0
  }, [sortBy, sortDesc])

  // Optimized filtering and sorting with performance monitoring
  const filteredAndSortedTasks = useOptimizedList(
    tasks, 
    filterFunction, 
    sortFunction, 
    [filters, sortBy, sortDesc]
  )

  // Memoized employee lookup for performance
  const getEmployeeById = useEnhancedMemo(() => {
    const employeeMap = new Map(employees.map(emp => [emp.id, emp]))
    return (id: string) => employeeMap.get(id)
  }, [employees], 'EmployeeLookup')
  
  // Debounced search to prevent excessive filtering
  const debouncedSearchUpdate = useDebouncedCallback(
    (searchValue: string) => {
      setFilters(prev => ({ ...prev, search: searchValue }))
    },
    300,
    []
  )
  
  // Pagination for large datasets
  const paginationData = usePagination(filteredAndSortedTasks, 50)
  const displayTasks = usePagination ? paginationData.items : filteredAndSortedTasks

  const taskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const overdue = tasks.filter(t => 
      t.expectedCompletionDate && 
      t.expectedCompletionDate < new Date() &&
      t.status !== 'COMPLETED'
    ).length

    return { total, completed, inProgress, overdue }
  }, [tasks])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {t('tasks.taskList')}
          </h2>
          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
            <span>{t('tasks.total')}: {taskStats.total}</span>
            <span>{t('tasks.inProgress')}: {taskStats.inProgress}</span>
            <span>{t('tasks.completed')}: {taskStats.completed}</span>
            {taskStats.overdue > 0 && (
              <span className="text-red-600">{t('tasks.overdue')}: {taskStats.overdue}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title={t('common.refresh')}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
          )}
          
          {onExportTasks && (
            <button
              onClick={() => onExportTasks(filteredAndSortedTasks)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title={t('tasks.exportTasks')}
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('tasks.createTask')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      {showFilters && (
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
          {/* Search and Filter */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('tasks.searchTasks')}
                defaultValue={filters.search}
                onChange={(e) => debouncedSearchUpdate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 border border-border rounded-md transition-colors',
                showFilterPanel 
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              )}
            >
              <Filter className="h-4 w-4" />
              <span>{t('common.filters')}</span>
            </button>
          </div>

          {/* View and Sort Controls */}
          <div className="flex items-center space-x-3">
            {/* Performance Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseVirtualization(!useVirtualization)}
                className={cn(
                  'p-2 rounded-md transition-colors text-xs',
                  useVirtualization 
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                )}
                title={useVirtualization ? 'Virtualization ON' : 'Virtualization OFF'}
              >
                <Zap className="h-3 w-3" />
              </button>
              
              <button
                onClick={() => setUsePagination(!usePagination)}
                className={cn(
                  'p-2 rounded-md transition-colors text-xs',
                  usePagination 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                )}
                title={usePagination ? 'Pagination ON' : 'Pagination OFF'}
              >
                <Settings className="h-3 w-3" />
              </button>
            </div>
            
            <div className="flex items-center border border-border rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-l-md transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-r-md transition-colors',
                  viewMode === 'list' 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="priority">{t('tasks.sortBy.priority')}</option>
              <option value="status">{t('tasks.sortBy.status')}</option>
              <option value="progress">{t('tasks.sortBy.progress')}</option>
              <option value="dueDate">{t('tasks.sortBy.dueDate')}</option>
              <option value="name">{t('tasks.sortBy.name')}</option>
              <option value="created">{t('tasks.sortBy.created')}</option>
            </select>
            
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title={sortDesc ? t('common.sortDesc') : t('common.sortAsc')}
            >
              <SortAsc className={cn('h-4 w-4 transition-transform', sortDesc && 'rotate-180')} />
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted rounded-lg border border-border">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('tasks.status')}</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as TaskStatus | 'ALL' }))}
              className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="PLANNED">{t('tasks.status.planned')}</option>
              <option value="IN_PROGRESS">{t('tasks.status.in_progress')}</option>
              <option value="ON_HOLD">{t('tasks.status.on_hold')}</option>
              <option value="COMPLETED">{t('tasks.status.completed')}</option>
              <option value="CANCELLED">{t('tasks.status.cancelled')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('tasks.priority')}</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as TaskPriority | 'ALL' }))}
              className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="CRITICAL">{t('tasks.priority.critical')}</option>
              <option value="HIGH">{t('tasks.priority.high')}</option>
              <option value="MEDIUM">{t('tasks.priority.medium')}</option>
              <option value="LOW">{t('tasks.priority.low')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('tasks.category')}</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as TaskCategory | 'ALL' }))}
              className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="FOUNDATION">{t('tasks.category.foundation')}</option>
              <option value="STRUCTURAL">{t('tasks.category.structural')}</option>
              <option value="ELECTRICAL">{t('tasks.category.electrical')}</option>
              <option value="PLUMBING">{t('tasks.category.plumbing')}</option>
              <option value="HVAC">{t('tasks.category.hvac')}</option>
              <option value="FINISHING">{t('tasks.category.finishing')}</option>
              <option value="LANDSCAPING">{t('tasks.category.landscaping')}</option>
              <option value="OTHER">{t('tasks.category.other')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('tasks.executor')}</label>
            <select
              value={filters.executorId}
              onChange={(e) => setFilters(prev => ({ ...prev, executorId: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
            >
              <option value="">{t('common.all')}</option>
              {employees
                .filter(emp => emp.role === 'WORKER' || emp.role === 'FOREMAN')
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('tasks.filters')}</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters(prev => ({ ...prev, overdue: e.target.checked }))}
                className="h-3 w-3 text-primary focus:ring-primary border-border rounded"
              />
              <span className="text-xs text-foreground">{t('tasks.overdue')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance Info */}
      {(useVirtualization || usePagination) && displayTasks.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <div className="flex items-center space-x-4">
            {useVirtualization && (
              <span className="flex items-center space-x-1">
                <Zap className="h-3 w-3 text-green-600" />
                <span>Virtualized ({displayTasks.length} items)</span>
              </span>
            )}
            {usePagination && (
              <span className="flex items-center space-x-1">
                <Settings className="h-3 w-3 text-blue-600" />
                <span>Page {paginationData.currentPage + 1} of {paginationData.totalPages}</span>
              </span>
            )}
          </div>
          <span>Rendering optimized for {displayTasks.length} tasks</span>
        </div>
      )}
      
      {/* Task Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t('common.loading')}</span>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {filters.search || filters.status !== 'ALL' || filters.priority !== 'ALL' ? (
              <div>
                <p className="text-sm">{t('tasks.noTasksMatchFilters')}</p>
                <button
                  onClick={() => setFilters({
                    search: '',
                    status: 'ALL',
                    priority: 'ALL',
                    category: 'ALL',
                    executorId: '',
                    overdue: false
                  })}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  {t('common.clearFilters')}
                </button>
              </div>
            ) : (
              <p className="text-sm">{t('tasks.noTasks')}</p>
            )}
          </div>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>{t('tasks.createFirstTask')}</span>
            </button>
          )}
        </div>
      ) : useVirtualization && displayTasks.length > 50 ? (
        // Virtualized rendering for large lists
        <div ref={containerRef}>
          <VirtualizedList
            items={displayTasks}
            itemHeight={viewMode === 'grid' ? 280 : 120}
            containerHeight={600}
            renderItem={(task, index, isVisible) => (
              <OptimizedCard
                key={task.id}
                isVisible={isVisible}
                className={cn(
                  viewMode === 'grid' ? 'p-3' : 'mb-4'
                )}
              >
                <TaskCard
                  task={task}
                  executor={getEmployeeById(task.executorId)}
                  supervisor={getEmployeeById(task.supervisorId)}
                  onClick={onTaskClick}
                  onQuickUpdate={onQuickUpdate}
                  compact={viewMode === 'list'}
                />
              </OptimizedCard>
            )}
            getItemId={(task) => task.id}
            className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}
            loading={loading}
            emptyComponent={
              <div className="text-center text-muted-foreground">
                <p>No tasks found</p>
              </div>
            }
          />
        </div>
      ) : (
        // Standard rendering for smaller lists
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}>
            {displayTasks.map((task) => (
              <OptimizedCard key={task.id}>
                <TaskCard
                  task={task}
                  executor={getEmployeeById(task.executorId)}
                  supervisor={getEmployeeById(task.supervisorId)}
                  onClick={onTaskClick}
                  onQuickUpdate={onQuickUpdate}
                  compact={viewMode === 'list'}
                />
              </OptimizedCard>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {usePagination && paginationData.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <button
                onClick={paginationData.prevPage}
                disabled={!paginationData.hasPrevPage}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Previous
              </button>
              
              <span className="text-sm text-muted-foreground">
                Page {paginationData.currentPage + 1} of {paginationData.totalPages}
              </span>
              
              <button
                onClick={paginationData.nextPage}
                disabled={!paginationData.hasNextPage}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Results Info */}
      {!loading && (usePagination ? paginationData.totalItems : filteredAndSortedTasks.length) > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>
              {usePagination ? (
                t('tasks.showingResults', { 
                  count: `${paginationData.currentPage * 50 + 1}-${Math.min((paginationData.currentPage + 1) * 50, paginationData.totalItems)}`, 
                  total: paginationData.totalItems 
                })
              ) : (
                t('tasks.showingResults', { 
                  count: filteredAndSortedTasks.length, 
                  total: tasks.length 
                })
              )}
            </span>
            
            {useVirtualization && (
              <span className="text-xs text-green-600">⚡ Virtualized</span>
            )}
            
            {usePagination && (
              <span className="text-xs text-blue-600">📄 Paginated</span>
            )}
          </div>
          
          {(usePagination ? paginationData.totalItems : filteredAndSortedTasks.length) !== tasks.length && (
            <button
              onClick={() => setFilters({
                search: '',
                status: 'ALL',
                priority: 'ALL',
                category: 'ALL',
                executorId: '',
                overdue: false
              })}
              className="text-primary hover:underline"
            >
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
