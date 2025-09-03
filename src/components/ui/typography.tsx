import React from 'react'
import { clsx } from 'clsx'

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline'
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'text' | 'textSecondary'
  gutterBottom?: boolean
  className?: string
  children: React.ReactNode
}

const variantClasses = {
  h1: 'text-6xl font-light',
  h2: 'text-4xl font-light', 
  h3: 'text-3xl font-normal',
  h4: 'text-2xl font-normal',
  h5: 'text-xl font-normal',
  h6: 'text-lg font-medium',
  subtitle1: 'text-base font-normal',
  subtitle2: 'text-sm font-medium',
  body1: 'text-base font-normal',
  body2: 'text-sm font-normal',
  caption: 'text-xs font-normal',
  overline: 'text-xs font-normal uppercase tracking-wider',
}

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  error: 'text-red-600', 
  warning: 'text-yellow-600',
  info: 'text-blue-500',
  text: 'text-gray-900',
  textSecondary: 'text-gray-500',
}

const componentMap = {
  h1: 'h1',
  h2: 'h2', 
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
}

export function Typography({ 
  variant = 'body1',
  component,
  color = 'text',
  gutterBottom = false,
  className,
  children,
  ...props 
}: TypographyProps) {
  const Component = component || componentMap[variant] || 'p'
  
  return (
    <Component
      className={clsx(
        variantClasses[variant],
        colorClasses[color],
        gutterBottom && 'mb-2',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
