import React, { useState, useRef, useEffect } from 'react'

interface PopoverProps {
  children: React.ReactNode
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const PopoverContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLDivElement>
}>({
  isOpen: false,
  setIsOpen: () => {},
  triggerRef: { current: null }
})

export function Popover({ children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  const { setIsOpen, triggerRef } = React.useContext(PopoverContext)

  const handleClick = () => {
    setIsOpen(true)
  }

  if (asChild) {
    return (
      <div ref={triggerRef} onClick={handleClick}>
        {children}
      </div>
    )
  }

  return (
    <button ref={triggerRef} onClick={handleClick} style={{ background: 'none', border: 'none', padding: 0 }}>
      {children}
    </button>
  )
}

export function PopoverContent({ children, className = '', style = {} }: PopoverContentProps) {
  const { isOpen } = React.useContext(PopoverContext)

  if (!isOpen) return null

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '200px',
        ...style
      }}
    >
      {children}
    </div>
  )
}
