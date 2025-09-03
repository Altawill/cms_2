import React, { useState, useEffect, useRef } from 'react'
import { useOrgScope } from '../contexts/OrgScopeContext'
import type { OrgUnit } from '../types/user'

interface OrgSwitcherProps {
  size?: 'sm' | 'md' | 'lg'
  showBreadcrumbs?: boolean
  className?: string
}

export function OrgSwitcher({ 
  size = 'md', 
  showBreadcrumbs = true,
  className = '' 
}: OrgSwitcherProps) {
  const {
    orgUnits,
    selectedUnitId,
    setSelectedUnitId,
    breadcrumb,
    currentUser,
    allowedOrgUnitIds
  } = useOrgScope()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentUser || orgUnits.length === 0) return null

  // Only show for higher roles (PMO/Area/Project). Site Engineers typically scoped to sites
  const privileged = ['PMO', 'AREA_MANAGER', 'PROJECT_MANAGER', 'ZONE_MANAGER'].includes(currentUser.role)
  if (!privileged) return null

  const currentOrgUnit = selectedUnitId ? orgUnits.find(ou => ou.id === selectedUnitId) : null
  const userOrgUnit = orgUnits.find(ou => ou.id === currentUser.orgUnitId)

  // Filter available scopes by search term and user permissions
  const availableScopes = orgUnits.filter(ou => 
    allowedOrgUnitIds.includes(ou.id) &&
    (ou.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (ou.code && ou.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
     ou.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Group scopes by type for better organization
  const groupedScopes = availableScopes.reduce((groups, orgUnit) => {
    const type = orgUnit.type
    if (!groups[type]) groups[type] = []
    groups[type].push(orgUnit)
    return groups
  }, {} as Record<string, OrgUnit[]>)

  const handleScopeChange = (scopeId: string | null) => {
    setSelectedUnitId(scopeId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PMO': return '🏢'
      case 'AREA': return '🌍'
      case 'PROJECT': return '🏗️'
      case 'ZONE': return '📍'
      default: return '📋'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PMO': return 'var(--accent-primary)'
      case 'AREA': return 'var(--accent-secondary)'
      case 'PROJECT': return 'var(--accent-info)'
      case 'ZONE': return 'var(--accent-warning)'
      default: return 'var(--text-muted)'
    }
  }

  const sizeClasses = {
    sm: { fontSize: '12px', padding: '6px 12px' },
    md: { fontSize: '14px', padding: '8px 16px' },
    lg: { fontSize: '16px', padding: '12px 20px' }
  }

  return (
    <div className={`org-switcher ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Breadcrumbs (if enabled) */}
      {showBreadcrumbs && breadcrumb.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          {breadcrumb.map((orgUnit, index) => (
            <React.Fragment key={orgUnit.id}>
              <button
                onClick={() => handleScopeChange(orgUnit.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: index === breadcrumb.length - 1 ? '600' : '400',
                  transition: 'var(--transition-normal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (index < breadcrumb.length - 1) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                <span>{getTypeIcon(orgUnit.type)}</span>
                {orgUnit.name}
              </button>
              {index < breadcrumb.length - 1 && (
                <span style={{ color: 'var(--text-muted)' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Current Scope Selector */}
      <div ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-primary)',
            border: `1px solid ${isOpen ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'var(--transition-normal)',
            minWidth: size === 'lg' ? '280px' : size === 'md' ? '240px' : '200px',
            justifyContent: 'space-between',
            ...sizeClasses[size]
          }}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = 'var(--border-color)'
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            {currentOrgUnit ? (
              <>
                <span style={{ fontSize: size === 'lg' ? '18px' : '16px' }}>
                  {getTypeIcon(currentOrgUnit.type)}
                </span>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {currentOrgUnit.name}
                  </div>
                  {size !== 'sm' && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize'
                    }}>
                      {currentOrgUnit.type.replace('_', ' ').toLowerCase()} • {currentUser?.role?.replace('_', ' ').toLowerCase() || 'User'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: size === 'lg' ? '18px' : '16px' }}>🏢</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    All Organizations
                  </div>
                  {size !== 'sm' && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Global View • {currentUser?.role?.replace('_', ' ').toLowerCase() || 'User'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <span style={{ 
            color: 'var(--text-muted)', 
            transition: 'var(--transition-normal)',
            transform: isOpen ? 'rotate(180deg)' : 'none'
          }}>
            ▼
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '400px',
            overflow: 'hidden',
            marginTop: '4px'
          }}>
            {/* Search */}
            <div style={{ padding: '12px' }}>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  background: 'var(--bg-secondary)'
                }}
                autoFocus
              />
            </div>

            {/* Global scope option */}
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <button
                onClick={() => handleScopeChange(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: !selectedUnitId ? 'var(--accent-primary-light)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  if (selectedUnitId) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUnitId) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>🏢</span>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: !selectedUnitId ? 'var(--accent-primary)' : 'var(--text-primary)' 
                  }}>
                    All Organizations
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    View all data across your permitted organizational units
                  </div>
                </div>
                {!selectedUnitId && (
                  <span style={{ color: 'var(--accent-primary)', fontSize: '16px' }}>✓</span>
                )}
              </button>
            </div>

            {/* Organizational units grouped by type */}
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {Object.entries(groupedScopes).map(([type, orgUnitsList]) => (
                <div key={type}>
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-light)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {getTypeIcon(type)} {type.replace('_', ' ')}s ({orgUnitsList.length})
                  </div>
                  {orgUnitsList.map(orgUnit => {
                    const isSelected = selectedUnitId === orgUnit.id
                    const parentUnit = orgUnit.parentId ? orgUnits.find(ou => ou.id === orgUnit.parentId) : null
                    
                    return (
                      <button
                        key={orgUnit.id}
                        onClick={() => handleScopeChange(orgUnit.id)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: isSelected ? 'var(--accent-primary-light)' : 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'var(--transition-normal)',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'var(--bg-tertiary)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: getTypeColor(orgUnit.type) + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}>
                          {getTypeIcon(orgUnit.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {orgUnit.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {orgUnit.code && `${orgUnit.code} • `}
                            {parentUnit ? parentUnit.name : 'Top Level'}
                          </div>
                        </div>
                        {isSelected && (
                          <span style={{ color: 'var(--accent-primary)', fontSize: '16px' }}>✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* No results */}
            {availableScopes.length === 0 && searchTerm && (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                <div>No organizations found</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Try adjusting your search criteria
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              {allowedOrgUnitIds.length} organization{allowedOrgUnitIds.length !== 1 ? 's' : ''} available
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

