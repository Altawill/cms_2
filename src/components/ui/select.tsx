import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { ChevronDownIcon } from 'lucide-react'

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = createContext<SelectContextType | null>(null)

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value = '', onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false)
  
  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, onOpenChange: setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  return (
    <button
      type="button"
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
        'placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context.onOpenChange(!context.open)}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')

  return (
    <span className={clsx('block truncate', className)}>
      {context.value || (
        <span className="text-slate-500">{placeholder}</span>
      )}
    </span>
  )
}

interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export function SelectContent({ className, children }: SelectContentProps) {
  const context = useContext(SelectContext)
  const contentRef = useRef<HTMLDivElement>(null)
  
  if (!context) throw new Error('SelectContent must be used within Select')

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

  return (
    <div
      ref={contentRef}
      className={clsx(
        'absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

interface SelectItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function SelectItem({ value, className, children }: SelectItemProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')

  const isSelected = context.value === value

  return (
    <button
      type="button"
      className={clsx(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'hover:bg-slate-100 focus:bg-slate-100',
        isSelected && 'bg-slate-100',
        className
      )}
      onClick={() => context.onValueChange(value)}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
        </span>
      )}
      {children}
    </button>
  )
}
