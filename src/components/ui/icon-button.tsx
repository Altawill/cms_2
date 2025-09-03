import React from 'react'
import { clsx } from 'clsx'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'small' | 'medium' | 'large'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  variant?: 'default' | 'outlined' | 'ghost'
  className?: string
  children: React.ReactNode
}

const sizeClasses = {
  small: 'h-8 w-8 p-1',
  medium: 'h-10 w-10 p-2',
  large: 'h-12 w-12 p-3',
}

const colorClasses = {
  default: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  primary: 'text-blue-600 hover:bg-blue-100 focus:ring-blue-300',
  secondary: 'text-gray-500 hover:bg-gray-100 focus:ring-gray-300',
  success: 'text-green-600 hover:bg-green-100 focus:ring-green-300',
  error: 'text-red-600 hover:bg-red-100 focus:ring-red-300',
  warning: 'text-yellow-600 hover:bg-yellow-100 focus:ring-yellow-300',
  info: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-300',
}

const outlinedColorClasses = {
  default: 'text-gray-600 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
  primary: 'text-blue-600 border border-blue-300 hover:bg-blue-50 focus:ring-blue-300',
  secondary: 'text-gray-500 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
  success: 'text-green-600 border border-green-300 hover:bg-green-50 focus:ring-green-300',
  error: 'text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-300',
  warning: 'text-yellow-600 border border-yellow-300 hover:bg-yellow-50 focus:ring-yellow-300',
  info: 'text-blue-500 border border-blue-300 hover:bg-blue-50 focus:ring-blue-300',
}

export function IconButton({
  size = 'medium',
  color = 'default',
  variant = 'default',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        variant === 'outlined' ? outlinedColorClasses[color] : colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
