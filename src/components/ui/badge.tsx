import React from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children: React.ReactNode
}

const badgeVariants = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-slate-200 text-slate-900 hover:bg-slate-50',
  success: 'bg-green-500 text-white hover:bg-green-600',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
}

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
}

export function Badge({ 
  variant = 'default', 
  size = 'default', 
  className, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full font-medium transition-colors',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
