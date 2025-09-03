import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Clock, 
  Users, 
  MapPin, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Calendar,
  User,
  QrCode,
  Wifi,
  WifiOff,
  MoreVertical
} from 'lucide-react'
import { Task, Employee } from '../../types'
import { format } from 'date-fns'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { QuickShareButton } from '../QRShareDialog'
import { NetworkStatus } from '../OfflineStatusIndicator'
import { useOffline, offlineUtils } from '../../services/offlineService'
import { useAuditTrail } from '../../services/auditTrailService'
import { useNotifications } from '../../services/notificationService'
import { toast } from 'sonner'
import { withMemoization, useEnhancedCallback, shallowEqual } from '../../utils/performance'

interface TaskCardProps {
  task: Task
  executor?: Employee
  supervisor?: Employee
  onClick: (task: Task) => void
  onQuickUpdate?: (task: Task) => void
  compact?: boolean
}

const statusColors = {
  PLANNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_PROGRESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

const priorityColors = {
  LOW: 'border-l-gray-400',
  MEDIUM: 'border-l-blue-400',
  HIGH: 'border-l-orange-400',
  CRITICAL: 'border-l-red-500'
}

const statusIcons = {
  PLANNED: PlayCircle,
  IN_PROGRESS: PlayCircle,
  ON_HOLD: PauseCircle,
  COMPLETED: CheckCircle,
  CANCELLED: AlertTriangle
}

const TaskCard = React.memo<TaskCardProps>(function TaskCard({ 
  task, 
  executor, 
  supervisor, 
  onClick, 
  onQuickUpdate, 
  compact = false 
}) {
  const { t } = useTranslation()
  const [showActions, setShowActions] = useState(false)
  
  // Gold-plating service hooks
  const { isOnline, queueAction } = useOffline()
  const { logEvent } = useAuditTrail()
  const { sendNotification } = useNotifications()
  
  // Memoized computations
  const StatusIcon = useMemo(() => statusIcons[task.status], [task.status])
  const isOverdue = useMemo(() => 
    task.expectedCompletionDate && 
    new Date() > task.expectedCompletionDate && 
    task.status !== 'COMPLETED',
    [task.expectedCompletionDate, task.status]
  )
  
  // Memoized date formatting
  const formattedDate = useMemo(() => 
    task.expectedCompletionDate 
      ? format(task.expectedCompletionDate, 'MMM dd, yyyy')
      : t('common.notSet'),
    [task.expectedCompletionDate, t]
  )
  
  // Memoized currency formatting
  const formattedBudget = useMemo(() => 
    task.billable && task.budgetAmount
      ? new Intl.NumberFormat('en-LY', { 
          style: 'currency', 
          currency: 'LYD',
          minimumFractionDigits: 0
        }).format(task.budgetAmount)
      : null,
    [task.billable, task.budgetAmount]
  )

  // Handle offline task updates with enhanced callback
  const handleOfflineUpdate = useEnhancedCallback(async (updates: Partial<Task>) => {
    try {
      await queueAction({
        type: 'UPDATE_TASK',
        entityId: task.id,
        payload: { ...task, ...updates },
        maxRetries: 3,
        conflictStrategy: 'MERGE',
        metadata: {
          siteId: task.siteId,
          priority: 'MEDIUM'
        }
      })
      
      // Log audit event
      logEvent({
        type: 'TASK_UPDATED',
        entityType: 'task',
        entityId: task.id,
        description: `Task "${task.name}" updated${!isOnline ? ' (offline)' : ''}`,
        metadata: { updates, offline: !isOnline }
      })
      
      // Send notification
      sendNotification({
        type: 'TASK_UPDATE',
        title: 'Task Updated',
        message: `Task "${task.name}" has been updated${!isOnline ? ' and will sync when online' : ''}`,
        priority: 'MEDIUM',
        entityType: 'task',
        entityId: task.id
      })
      
      toast.success(`✅ Task updated${!isOnline ? ' (offline)' : ''}!`)
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    }
  }, [task, isOnline, queueAction, logEvent, sendNotification], 'TaskOfflineUpdate')

  const handleQuickProgressUpdate = useEnhancedCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    const newProgress = Math.min(100, task.progress + 25)
    const newStatus = newProgress === 100 ? 'COMPLETED' : task.status
    
    handleOfflineUpdate({ 
      progress: newProgress,
      status: newStatus
    })
  }, [task.progress, task.status, handleOfflineUpdate], 'QuickProgressUpdate')
  
  // Memoized click handlers
  const handleCardClick = useEnhancedCallback(() => {
    onClick(task)
  }, [onClick, task], 'TaskCardClick')
  
  const handleQuickUpdateClick = useEnhancedCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onQuickUpdate?.(task)
  }, [onQuickUpdate, task], 'QuickUpdateClick')

  return (
    <div 
      onClick={handleCardClick}
      className={`
        bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer
        hover:border-primary/50 ${priorityColors[task.priority]} border-l-4
        ${compact ? 'p-4' : 'p-6'}
        ${isOverdue ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {task.code}
            </span>
            {task.billable && (
              <DollarSign className="h-3 w-3 text-green-600" />
            )}
            {isOverdue && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
            {task.name}
          </h3>
          {!compact && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-1 ml-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[task.status]
          }`}>
            {t(`tasks.status.${task.status.toLowerCase()}`)}
          </span>
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            task.priority === 'CRITICAL' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
            task.priority === 'HIGH' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
            task.priority === 'MEDIUM' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
            'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
          }`}>
            {t(`tasks.priority.${task.priority.toLowerCase()}`)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{t('tasks.progress')}</span>
          <span className="font-semibold">{task.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              task.progress === 100 ? 'bg-green-500' :
              task.progress >= 75 ? 'bg-blue-500' :
              task.progress >= 50 ? 'bg-yellow-500' :
              task.progress >= 25 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs text-muted-foreground">
        {task.location && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{task.location}</span>
          </div>
        )}
        
        {task.manpower > 0 && (
          <div className="flex items-center space-x-2">
            <Users className="h-3 w-3" />
            <span>{task.manpower} {task.manpower === 1 ? 'worker' : 'workers'}</span>
          </div>
        )}
        
        {executor && (
          <div className="flex items-center space-x-2">
            <User className="h-3 w-3" />
            <span className="truncate">{executor.name}</span>
          </div>
        )}
      </div>

      {/* Enhanced Footer with Gold-plating Features */}
      <div className="mt-4 pt-3 border-t border-border space-y-3">
        {/* Date and Budget Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
          
          {formattedBudget && (
            <div className="text-xs font-medium text-green-600">
              {formattedBudget}
            </div>
          )}
        </div>

        {/* Gold-plating Features Row */}
        <div className="flex items-center justify-between">
          {/* Network Status & Share */}
          <div className="flex items-center gap-2">
            <NetworkStatus className="text-xs" />
            
            <QuickShareButton
              entityType="TASK"
              entityId={task.id}
              entityTitle={task.name}
              entityTitleAr={task.nameAr}
              siteId={task.siteId}
              metadata={{
                status: task.status,
                priority: task.priority,
                executor: executor?.name
              }}
              size="sm"
              variant="ghost"
            />
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {task.status === 'IN_PROGRESS' && (
                <DropdownMenuItem onClick={handleQuickProgressUpdate}>
                  📈 Add 25% Progress
                </DropdownMenuItem>
              )}
              
              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOfflineUpdate({ status: 'ON_HOLD' })
                  }}
                >
                  ⏸️ Put on Hold
                </DropdownMenuItem>
              )}
              
              {task.status === 'ON_HOLD' && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOfflineUpdate({ status: 'IN_PROGRESS' })
                  }}
                >
                  ▶️ Resume Task
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onClick(task)
                }}
              >
                👁️ View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Update Button */}
      {onQuickUpdate && task.status === 'IN_PROGRESS' && (
        <button
          onClick={handleQuickUpdateClick}
          className="w-full mt-3 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t('tasks.quickUpdate')}
        </button>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.progress === nextProps.task.progress &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.name === nextProps.task.name &&
    prevProps.task.expectedCompletionDate?.getTime() === nextProps.task.expectedCompletionDate?.getTime() &&
    prevProps.compact === nextProps.compact &&
    prevProps.executor?.id === nextProps.executor?.id &&
    prevProps.supervisor?.id === nextProps.supervisor?.id
  )
})

TaskCard.displayName = 'TaskCard'

export default TaskCard
