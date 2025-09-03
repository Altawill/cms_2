import React from 'react'
import { clsx } from 'clsx'
import { Input } from './input'
import { Label } from './label'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: boolean
  helperText?: string
  fullWidth?: boolean
  variant?: 'outlined' | 'filled' | 'standard'
  multiline?: boolean
  rows?: number
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
  className?: string
}

export function TextField({
  label,
  error = false,
  helperText,
  fullWidth = false,
  variant = 'outlined',
  multiline = false,
  rows = 4,
  startAdornment,
  endAdornment,
  className,
  id,
  ...props
}: TextFieldProps) {
  const inputId = id || `textfield-${Math.random().toString(36).substr(2, 9)}`
  
  const inputClasses = clsx(
    'flex w-full rounded-md border bg-white px-3 py-2 text-sm',
    'placeholder:text-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error ? 'border-red-500' : 'border-gray-200',
    fullWidth ? 'w-full' : '',
    startAdornment && 'pl-10',
    endAdornment && 'pr-10'
  )

  return (
    <div className={clsx('space-y-1', fullWidth && 'w-full', className)}>
      {label && (
        <Label htmlFor={inputId} className={error ? 'text-red-600' : ''}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        {startAdornment && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {startAdornment}
          </div>
        )}
        
        {multiline ? (
          <textarea
            id={inputId}
            rows={rows}
            className={inputClasses}
            {...(props as any)}
          />
        ) : (
          <Input
            id={inputId}
            className={inputClasses}
            {...props}
          />
        )}
        
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {endAdornment}
          </div>
        )}
      </div>
      
      {helperText && (
        <p className={clsx('text-xs', error ? 'text-red-600' : 'text-gray-500')}>
          {helperText}
        </p>
      )}
    </div>
  )
}
