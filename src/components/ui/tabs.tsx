import React, { createContext, useContext, useState } from 'react'
import { clsx } from 'clsx'

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(value || defaultValue)

  const handleTabChange = (newValue: string) => {
    if (value === undefined) {
      setActiveTab(newValue)
    }
    onValueChange?.(newValue)
  }

  const currentTab = value || activeTab

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={clsx('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      className={clsx(
        'inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

export function TabsTrigger({ value, className, disabled, children }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.activeTab === value

  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
        'transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive 
          ? 'bg-white text-slate-950 shadow-sm' 
          : 'hover:bg-white/50 hover:text-slate-950',
        className
      )}
      disabled={disabled}
      onClick={() => context.setActiveTab(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.activeTab !== value) return null

  return (
    <div
      className={clsx(
        'mt-2 ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  )
}
