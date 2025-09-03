import React, { createContext, useContext, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

interface AccordionContextType {
  openItems: string[]
  toggleItem: (value: string) => void
  multiple?: boolean
}

const AccordionContext = createContext<AccordionContextType | null>(null)

interface AccordionProps {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
  children: React.ReactNode
}

export function Accordion({ 
  type = 'single', 
  defaultValue, 
  className, 
  children 
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    }
    return []
  })

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value]
      } else {
        return prev.includes(value) 
          ? prev.filter(item => item !== value)
          : [...prev, value]
      }
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, multiple: type === 'multiple' }}>
      <div className={clsx('divide-y divide-gray-200', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  return (
    <div className={clsx('border-b border-gray-200 last:border-b-0', className)}>
      {children}
    </div>
  )
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: React.ReactNode
}

export function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  const context = useContext(AccordionContext)
  if (!context) throw new Error('AccordionTrigger must be used within Accordion')

  return (
    <button
      type="button"
      className={clsx(
        'flex w-full items-center justify-between py-4 px-1 text-left font-medium transition-all',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
    </button>
  )
}

interface AccordionContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function AccordionContent({ value, className, children }: AccordionContentProps) {
  const context = useContext(AccordionContext)
  if (!context) throw new Error('AccordionContent must be used within Accordion')

  const isOpen = context.openItems.includes(value)

  return (
    <div
      className={clsx(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        className
      )}
    >
      <div className="pb-4 pt-0 px-1">
        {children}
      </div>
    </div>
  )
}
