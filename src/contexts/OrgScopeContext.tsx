import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { OrgScopeState, OrgUnit, ScopedUser } from '../models/org'
// import { getSubtreeIds, getPath } from '../services/orgHierarchy'

// Fallback functions for missing services
function getSubtreeIds(orgUnits: OrgUnit[], rootId: string): string[] {
  const result: string[] = []
  
  function collectIds(unitId: string) {
    result.push(unitId)
    const children = orgUnits.filter(unit => unit.parentId === unitId)
    children.forEach(child => collectIds(child.id))
  }
  
  collectIds(rootId)
  return result
}

function getPath(orgUnits: OrgUnit[], unitId: string): OrgUnit[] {
  const unit = orgUnits.find(u => u.id === unitId)
  if (!unit) return []
  
  const path: OrgUnit[] = [unit]
  let current = unit
  
  while (current.parentId) {
    const parent = orgUnits.find(u => u.id === current.parentId)
    if (!parent) break
    path.unshift(parent)
    current = parent
  }
  
  return path
}

interface OrgScopeContextType extends OrgScopeState {
  setSelectedUnitId: (id: string | null) => void
  // user + orgUnits must be provided by caller (from Auth + API)
  setOrgData: (params: { user: ScopedUser; orgUnits: OrgUnit[] }) => void
  user?: ScopedUser
  orgUnits: OrgUnit[]
}

const OrgScopeContext = createContext<OrgScopeContextType | null>(null)

export function useOrgScope() {
  const ctx = useContext(OrgScopeContext)
  if (!ctx) throw new Error('useOrgScope must be used within OrgScopeProvider')
  return ctx
}

export function OrgScopeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ScopedUser | undefined>(() => {
    // Fallback user for development - Area Manager
    return {
      id: 'user-area-manager-1',
      name: 'Ahmed Al-Mansouri',
      email: 'ahmed.mansouri@company.com',
      role: 'AREA_MANAGER',
      orgUnitId: 'area-west',
      active: true,
      assignments: []
    }
  })
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>(() => {
    // Realistic PMO → Area → Project → Zone hierarchy
    return [
      // PMO Level (Root)
      {
        id: 'pmo-libya',
        name: 'PMO Libya Operations',
        type: 'PMO',
        parentId: null
      },
      
      // Area Level
      {
        id: 'area-west',
        name: 'West Region',
        type: 'AREA',
        parentId: 'pmo-libya'
      },
      {
        id: 'area-east',
        name: 'East Region', 
        type: 'AREA',
        parentId: 'pmo-libya'
      },
      {
        id: 'area-central',
        name: 'Central Region',
        type: 'AREA', 
        parentId: 'pmo-libya'
      },
      
      // Project Level (West Region)
      {
        id: 'project-l-villas',
        name: 'The L Villas',
        type: 'PROJECT',
        parentId: 'area-west'
      },
      {
        id: 'project-marina-towers',
        name: 'Marina Towers Complex',
        type: 'PROJECT',
        parentId: 'area-west'
      },
      
      // Project Level (East Region)
      {
        id: 'project-benghazi-mall',
        name: 'Benghazi Shopping Mall',
        type: 'PROJECT',
        parentId: 'area-east'
      },
      {
        id: 'project-industrial-zone',
        name: 'Industrial Zone Development',
        type: 'PROJECT',
        parentId: 'area-east'
      },
      
      // Project Level (Central Region)
      {
        id: 'project-downtown-office',
        name: 'Downtown Office Complex',
        type: 'PROJECT',
        parentId: 'area-central'
      },
      
      // Zone Level (The L Villas)
      {
        id: 'zone-villas-north',
        name: 'Villas North Zone',
        type: 'ZONE',
        parentId: 'project-l-villas'
      },
      {
        id: 'zone-villas-south',
        name: 'Villas South Zone',
        type: 'ZONE',
        parentId: 'project-l-villas'
      },
      {
        id: 'zone-villas-amenities',
        name: 'Amenities Zone',
        type: 'ZONE',
        parentId: 'project-l-villas'
      },
      
      // Zone Level (Marina Towers)
      {
        id: 'zone-tower-a',
        name: 'Tower A Zone',
        type: 'ZONE',
        parentId: 'project-marina-towers'
      },
      {
        id: 'zone-tower-b',
        name: 'Tower B Zone',
        type: 'ZONE',
        parentId: 'project-marina-towers'
      },
      
      // Zone Level (Benghazi Mall)
      {
        id: 'zone-mall-retail',
        name: 'Retail Zone',
        type: 'ZONE',
        parentId: 'project-benghazi-mall'
      },
      {
        id: 'zone-mall-entertainment',
        name: 'Entertainment Zone',
        type: 'ZONE',
        parentId: 'project-benghazi-mall'
      },
      
      // Zone Level (Industrial Zone)
      {
        id: 'zone-warehouse',
        name: 'Warehouse Zone',
        type: 'ZONE',
        parentId: 'project-industrial-zone'
      },
      {
        id: 'zone-manufacturing',
        name: 'Manufacturing Zone',
        type: 'ZONE',
        parentId: 'project-industrial-zone'
      },
      
      // Zone Level (Downtown Office)
      {
        id: 'zone-office-north',
        name: 'North Office Zone',
        type: 'ZONE',
        parentId: 'project-downtown-office'
      },
      {
        id: 'zone-office-south',
        name: 'South Office Zone',
        type: 'ZONE',
        parentId: 'project-downtown-office'
      }
    ]
  })

  const [selectedUnitId, setSelectedUnitIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('org_selected_unit') || null
    } catch { return null }
  })

  const setSelectedUnitId = useCallback((id: string | null) => {
    setSelectedUnitIdState(id)
    try {
      if (id) localStorage.setItem('org_selected_unit', id)
      else localStorage.removeItem('org_selected_unit')
    } catch {}
  }, [])

  const setOrgData = useCallback(({ user, orgUnits }: { user: ScopedUser; orgUnits: OrgUnit[] }) => {
    setUser(user)
    setOrgUnits(orgUnits)
  }, [])

  // Compute allowed set from user and selection
  const allowedOrgUnitIds = useMemo(() => {
    if (!user) return []
    const baseIds = new Set<string>()
    const primaryIds = getSubtreeIds(orgUnits, user.orgUnitId)
    primaryIds.forEach(id => baseIds.add(id))
    user.assignments?.forEach(a => getSubtreeIds(orgUnits, a.orgUnitId).forEach(id => baseIds.add(id)))

    if (selectedUnitId) {
      const selectedIds = new Set(getSubtreeIds(orgUnits, selectedUnitId))
      return [...baseIds].filter(id => selectedIds.has(id))
    }
    return [...baseIds]
  }, [user, orgUnits, selectedUnitId])

  const breadcrumb = useMemo(() => {
    if (!selectedUnitId) return [] as OrgUnit[]
    return getPath(orgUnits, selectedUnitId)
  }, [orgUnits, selectedUnitId])

  const value: OrgScopeContextType = {
    selectedUnitId,
    allowedOrgUnitIds,
    breadcrumb,
    setSelectedUnitId,
    setOrgData,
    user,
    orgUnits
  }

  return (
    <OrgScopeContext.Provider value={value}>
      {children}
    </OrgScopeContext.Provider>
  )
}

