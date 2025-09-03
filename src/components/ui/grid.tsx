import React from 'react'
import { clsx } from 'clsx'

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: boolean
  item?: boolean
  spacing?: number
  xs?: number | boolean
  sm?: number | boolean
  md?: number | boolean
  lg?: number | boolean
  xl?: number | boolean
  className?: string
  children: React.ReactNode
}

export function Grid({ 
  container, 
  item, 
  spacing = 0, 
  xs, 
  sm, 
  md, 
  lg, 
  xl,
  className,
  children,
  ...props 
}: GridProps) {
  const getSpacingClass = (spacing: number) => {
    const spacingMap: Record<number, string> = {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    }
    return spacingMap[spacing] || 'gap-4'
  }

  const getColSpanClass = (size: number | boolean | undefined, breakpoint: string) => {
    if (size === true) return `${breakpoint}:flex-1`
    if (typeof size === 'number') {
      const cols = Math.round(size)
      if (breakpoint === '') return `col-span-${cols}`
      return `${breakpoint}:col-span-${cols}`
    }
    return ''
  }

  const containerClasses = container ? [
    'grid grid-cols-12',
    spacing > 0 && getSpacingClass(spacing)
  ] : []

  const itemClasses = item ? [
    getColSpanClass(xs, ''),
    getColSpanClass(sm, 'sm'),
    getColSpanClass(md, 'md'), 
    getColSpanClass(lg, 'lg'),
    getColSpanClass(xl, 'xl'),
  ] : []

  return (
    <div
      className={clsx(
        ...containerClasses,
        ...itemClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
