import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
  children: React.ReactNode
}

const buttonVariants = {
  default: 'bg-slate-900 text-white hover:bg-slate-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-slate-200 bg-transparent hover:bg-slate-100',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  ghost: 'hover:bg-slate-100',
  link: 'underline-offset-4 hover:underline text-slate-900',
}

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
