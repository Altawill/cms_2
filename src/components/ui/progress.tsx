import React from 'react'
import { clsx } from 'clsx'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  variant?: 'determinate' | 'indeterminate'
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const colorClasses = {
  primary: 'bg-blue-500',
  secondary: 'bg-gray-500', 
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-400',
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2', 
  lg: 'h-3',
}

export function Progress({ 
  value = 0,
  variant = 'determinate',
  color = 'primary',
  size = 'md',
  className,
  ...props 
}: ProgressProps) {
  return (
    <div
      className={clsx(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div
        className={clsx(
          'h-full rounded-full transition-all duration-300 ease-in-out',
          colorClasses[color],
          variant === 'indeterminate' && 'animate-pulse'
        )}
        style={{ 
          width: variant === 'determinate' ? `${Math.min(100, Math.max(0, value))}%` : '100%' 
        }}
      />
    </div>
  )
}
