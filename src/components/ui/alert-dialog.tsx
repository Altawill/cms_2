import React, { createContext, useContext, useEffect } from 'react'
import { clsx } from 'clsx'

interface AlertDialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = createContext<AlertDialogContextType | null>(null)

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </AlertDialogContext.Provider>
  )
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

export function AlertDialogContent({ children, className }: AlertDialogContentProps) {
  return (
    <div className={clsx(
      "relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6",
      "animate-in fade-in-0 zoom-in-95 duration-200",
      className
    )}>
      {children}
    </div>
  )
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export function AlertDialogHeader({ children, className }: AlertDialogHeaderProps) {
  return (
    <div className={clsx("flex flex-col space-y-2 text-center sm:text-left", className)}>
      {children}
    </div>
  )
}

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function AlertDialogTitle({ children, className }: AlertDialogTitleProps) {
  return (
    <h2 className={clsx("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function AlertDialogDescription({ children, className }: AlertDialogDescriptionProps) {
  return (
    <p className={clsx("text-sm text-gray-600", className)}>
      {children}
    </p>
  )
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

export function AlertDialogFooter({ children, className }: AlertDialogFooterProps) {
  return (
    <div className={clsx("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
      {children}
    </div>
  )
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function AlertDialogAction({ children, onClick, className }: AlertDialogActionProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface AlertDialogCancelProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function AlertDialogCancel({ children, onClick, className }: AlertDialogCancelProps) {
  const context = useContext(AlertDialogContext)
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (context) {
      context.onOpenChange(false)
    }
  }

  return (
    <button
      className={clsx(
        "mt-2 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-transparent px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
