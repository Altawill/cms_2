import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock 
} from 'lucide-react'
import { TaskStatus, TaskPriority } from '../../types'
import { cn } from '../../utils'

interface StatusBadgeProps {
  status: TaskStatus
  priority?: TaskPriority
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  PLANNED: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Clock
  },
  IN_PROGRESS: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: PlayCircle
  },
  ON_HOLD: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: PauseCircle
  },
  COMPLETED: {
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    icon: CheckCircle
  },
  CANCELLED: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: AlertTriangle
  }
}

const priorityAccents = {
  LOW: 'ring-1 ring-gray-300',
  MEDIUM: 'ring-1 ring-blue-300',
  HIGH: 'ring-1 ring-orange-300',
  CRITICAL: 'ring-2 ring-red-400'
}

const sizeClasses = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'px-2.5 py-1.5 text-xs',
    icon: 'h-3.5 w-3.5'
  },
  lg: {
    badge: 'px-3 py-2 text-sm',
    icon: 'h-4 w-4'
  }
}

export default function StatusBadge({ 
  status, 
  priority,
  size = 'md',
  showIcon = true,
  className 
}: StatusBadgeProps) {
  const { t } = useTranslation()
  
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon
  
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      statusInfo.color,
      sizeClasses[size].badge,
      priority && priorityAccents[priority],
      className
    )}>
      {showIcon && (
        <StatusIcon className={cn('mr-1', sizeClasses[size].icon)} />
      )}
      {t(`tasks.status.${status.toLowerCase()}`)}
    </span>
  )
}

// Priority Badge Component
interface PriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriorityBadge({ priority, size = 'md', className }: PriorityBadgeProps) {
  const { t } = useTranslation()
  
  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      priorityColors[priority],
      sizeClasses[size].badge,
      className
    )}>
      {t(`tasks.priority.${priority.toLowerCase()}`)}
    </span>
  )
}
