import React from 'react'
import { clsx } from 'clsx'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | false
  children: React.ReactNode
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md', 
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
}

export function Container({ className, maxWidth = 'lg', children, ...props }: ContainerProps) {
  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8',
        maxWidth !== false && maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
