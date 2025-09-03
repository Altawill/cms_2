import React from 'react'
import { useOrgScope } from '../contexts/OrgScopeContext'

interface ScopeChipProps {
  className?: string
  style?: React.CSSProperties
  orgUnitId?: string // Optional specific org unit to display
  size?: 'sm' | 'md' | 'lg'
}

export function ScopeChip({ className, style, orgUnitId, size = 'md' }: ScopeChipProps) {
  const { allowedOrgUnitIds, user, selectedUnitId, breadcrumb, orgUnits } = useOrgScope()
  
  // Helper function to get org unit by ID
  const getOrgUnitById = (id: string) => {
    return orgUnits.find(unit => unit.id === id)
  }
  
  // If orgUnitId is provided, show info for that specific unit
  if (orgUnitId) {
    const orgUnit = getOrgUnitById(orgUnitId)
    if (!orgUnit) {
      return (
        <span 
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className || ''}`}
          style={style}
        >
          Unknown Unit
        </span>
      )
    }
    
    // Build full path for the specific org unit
    const unitPath = []
    let currentUnit = orgUnit
    while (currentUnit) {
      unitPath.unshift(currentUnit.name)
      currentUnit = currentUnit.parentId ? getOrgUnitById(currentUnit.parentId) : null
    }
    
    const pathString = unitPath.join(' › ')
    const sizeClasses = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm'
    }
    
    return (
      <span 
        className={`inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 ${sizeClasses[size]} ${className || ''}`}
        title={`Organization: ${pathString}`}
        style={style}
      >
        🏢 {orgUnit.name}
      </span>
    )
  }
  
  // Default behavior for current scope
  const unitCount = allowedOrgUnitIds.length
  const scopeName = breadcrumb.length > 0 
    ? breadcrumb.map(u => u.name).join(' › ')
    : user ? `All under ${user.role}` : 'No scope'
  const isScoped = !!selectedUnitId
  
  if (unitCount === 0) {
    return (
      <span 
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className || ''}`}
        style={style}
      >
        No Access
      </span>
    )
  }
  
  const colorClass = isScoped ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs', 
    lg: 'px-3 py-1.5 text-sm'
  }
  
  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClasses[size]} ${className || ''}`}
      title={`Viewing: ${scopeName}`}
      style={style}
    >
      {isScoped ? scopeName : `All (${unitCount} units)`}
    </span>
  )
}
