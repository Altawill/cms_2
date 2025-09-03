import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils'

interface ProgressBarProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showPercentage?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'auto'
  className?: string
  animated?: boolean
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  auto: '' // Will be determined by progress value
}

export default function ProgressBar({ 
  progress, 
  size = 'md',
  showLabel = false,
  showPercentage = false,
  color = 'auto',
  className,
  animated = false
}: ProgressBarProps) {
  const { t } = useTranslation()
  
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))
  
  // Auto color based on progress
  const getAutoColor = (value: number) => {
    if (value === 100) return 'bg-green-500'
    if (value >= 80) return 'bg-blue-500'
    if (value >= 60) return 'bg-yellow-500'
    if (value >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const progressColor = color === 'auto' ? getAutoColor(clampedProgress) : colorClasses[color]
  
  return (
    <div className={cn('w-full', className)}>
      {/* Label and Percentage */}
      {(showLabel || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {showLabel && (
            <span className="text-sm font-medium text-foreground">
              {t('tasks.progress')}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-foreground">
              {clampedProgress}%
            </span>
          )}
        </div>
      )}
      
      {/* Progress Bar */}
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            'rounded-full transition-all duration-300 ease-out',
            progressColor,
            sizeClasses[size],
            animated && 'animate-pulse'
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      {/* Progress Milestones (for larger sizes) */}
      {size === 'lg' && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  )
}
