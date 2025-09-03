import React from 'react'
import { clsx } from 'clsx'

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  component?: keyof JSX.IntrinsicElements
  className?: string
  children?: React.ReactNode
}

export function Box({ 
  component: Component = 'div',
  className,
  children,
  ...props 
}: BoxProps) {
  return (
    <Component
      className={clsx(className)}
      {...props}
    >
      {children}
    </Component>
  )
}
