import React from 'react'
import { clsx } from 'clsx'

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outlined'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  size?: 'small' | 'medium'
  className?: string
  children: React.ReactNode
  onDelete?: () => void
}

const colorClasses = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  primary: 'bg-blue-100 text-blue-800 border-blue-200',
  secondary: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  info: 'bg-blue-50 text-blue-700 border-blue-200',
}

const outlinedColorClasses = {
  default: 'bg-transparent text-gray-600 border-gray-300',
  primary: 'bg-transparent text-blue-600 border-blue-300',
  secondary: 'bg-transparent text-gray-500 border-gray-300',
  success: 'bg-transparent text-green-600 border-green-300',
  error: 'bg-transparent text-red-600 border-red-300',
  warning: 'bg-transparent text-yellow-600 border-yellow-300',
  info: 'bg-transparent text-blue-500 border-blue-300',
}

const sizeClasses = {
  small: 'h-6 px-2 text-xs',
  medium: 'h-8 px-3 text-sm',
}

export function Chip({
  variant = 'default',
  color = 'default', 
  size = 'medium',
  className,
  children,
  onDelete,
  ...props
}: ChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full border font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        variant === 'outlined' ? outlinedColorClasses[color] : colorClasses[color],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {onDelete && (
        <button
          onClick={onDelete}
          className="ml-1 h-4 w-4 rounded-full hover:bg-black/10 flex items-center justify-center"
        >
          ×
        </button>
      )}
    </span>
  )
}
