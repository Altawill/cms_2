import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'

interface DropdownMenuContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null)

interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  className?: string
  children: React.ReactNode
}

export function DropdownMenuTrigger({ asChild, className, children }: DropdownMenuTriggerProps) {
  const context = useContext(DropdownMenuContext)
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...(children.props as any),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        context.onOpenChange(!context.open)
        ;(children.props as any).onClick?.(e)
      },
    })
  }

  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={() => context.onOpenChange(!context.open)}
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps {
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: React.ReactNode
}

export function DropdownMenuContent({ 
  className, 
  align = 'end', 
  side = 'bottom', 
  children 
}: DropdownMenuContentProps) {
  const context = useContext(DropdownMenuContext)
  const contentRef = useRef<HTMLDivElement>(null)
  
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        context.onOpenChange(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        context.onOpenChange(false)
      }
    }

    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [context])

  if (!context.open) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  }

  const sideClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2 top-0',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2 top-0',
  }

  return (
    <div
      ref={contentRef}
      className={clsx(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        alignmentClasses[align],
        sideClasses[side],
        className
      )}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  className?: string
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export function DropdownMenuItem({ className, disabled, onClick, children }: DropdownMenuItemProps) {
  const context = useContext(DropdownMenuContext)
  if (!context) throw new Error('DropdownMenuItem must be used within DropdownMenu')

  const handleClick = () => {
    if (!disabled) {
      onClick?.()
      context.onOpenChange(false)
    }
  }

  return (
    <button
      type="button"
      className={clsx(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'transition-colors hover:bg-slate-100 focus:bg-slate-100',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

interface DropdownMenuSeparatorProps {
  className?: string
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div
      className={clsx('mx-1 my-1 h-px bg-slate-200', className)}
    />
  )
}

interface DropdownMenuLabelProps {
  className?: string
  children: React.ReactNode
}

export function DropdownMenuLabel({ className, children }: DropdownMenuLabelProps) {
  return (
    <div
      className={clsx('px-2 py-1.5 text-sm font-semibold text-slate-900', className)}
    >
      {children}
    </div>
  )
}
