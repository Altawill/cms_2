import React, { useMemo } from 'react'
import { useOrgScope } from '../contexts/OrgScopeContext'
// import { useScopedApi } from '../services/apiScopeInterceptor'
// import { getRolePermissions, hasPermission } from '../services/rbacPolicy'
// import { UserRole } from '../models/org'

// Fallback permissions for development
function getFallbackPermissions(role: string) {
  return {
    canCreate: {
      employees: true,
      sites: true,
      expenses: true,
      reports: true,
      users: role === 'ADMIN',
      safes: true,
      revenues: true,
      payroll: role !== 'EMPLOYEE'
    },
    canUpdate: {
      employees: true,
      sites: true,
      expenses: true,
      reports: true,
      users: role === 'ADMIN',
      safes: true,
      revenues: true,
      payroll: role !== 'EMPLOYEE'
    },
    canDelete: {
      employees: role === 'ADMIN',
      sites: role === 'ADMIN',
      expenses: role !== 'EMPLOYEE',
      reports: true,
      users: role === 'ADMIN',
      safes: role === 'ADMIN',
      revenues: role !== 'EMPLOYEE',
      payroll: role === 'ADMIN'
    },
    canApprove: {
      employees: role !== 'EMPLOYEE',
      sites: role !== 'EMPLOYEE',
      expenses: role !== 'EMPLOYEE',
      reports: role !== 'EMPLOYEE',
      users: role === 'ADMIN',
      safes: role !== 'EMPLOYEE',
      revenues: role !== 'EMPLOYEE',
      payroll: role === 'ADMIN'
    }
  }
}

// Hook to get current user permissions based on role
export function useRolePermissions() {
  const { user } = useOrgScope()
  return useMemo(() => {
    if (!user) return null
    return getFallbackPermissions(user.role)
  }, [user])
}

// Hook to check specific permissions
export function usePermission(resource: string, action: string) {
  const { user } = useOrgScope()
  return useMemo(() => {
    if (!user) return false
    // Fallback permission check
    const permissions = getFallbackPermissions(user.role)
    return permissions.canCreate[resource as keyof typeof permissions.canCreate] || false
  }, [user, resource, action])
}

// Hook for scope-aware query parameters
export function useScopedQueryParams(baseParams?: Record<string, any>) {
  const { allowedOrgUnitIds, selectedUnitId, user } = useOrgScope()
  
  return useMemo(() => ({
    ...baseParams,
    orgUnitIds: allowedOrgUnitIds,
    currentOrgUnit: selectedUnitId || (allowedOrgUnitIds.length > 0 ? allowedOrgUnitIds[0] : null),
    isScoped: !!selectedUnitId,
    userRole: user?.role || null
  }), [allowedOrgUnitIds, selectedUnitId, user, baseParams])
}

// HOC to wrap components with org scope awareness
export function withOrgScope<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireScope?: boolean }
) {
  return function ScopedComponent(props: P) {
    const { allowedOrgUnitIds, user } = useOrgScope()
    
    if (options?.requireScope && allowedOrgUnitIds.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-gray-600">You don't have access to any organizational units.</p>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}

// Hook to get current scope display info
export function useScopeInfo() {
  const { breadcrumb, selectedUnitId, user, allowedOrgUnitIds } = useOrgScope()
  
  return useMemo(() => {
    const scopeName = breadcrumb.length > 0 
      ? breadcrumb.map(u => u.name).join(' › ')
      : user ? `All under ${user.role}` : 'No scope'
    
    const scopeType = breadcrumb.length > 0
      ? breadcrumb[breadcrumb.length - 1].type
      : user?.role || 'UNKNOWN'
    
    return {
      scopeName,
      scopeType,
      isScoped: !!selectedUnitId,
      unitCount: allowedOrgUnitIds.length
    }
  }, [breadcrumb, selectedUnitId, user, allowedOrgUnitIds])
}

// Hook for action buttons with permission checks
export function useActionButtons(resource: string) {
  const permissions = useRolePermissions()
  const { user } = useOrgScope()
  
  return useMemo(() => {
    if (!permissions || !user) return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canApprove: false,
      createTooltip: 'Not authorized',
      updateTooltip: 'Not authorized',
      deleteTooltip: 'Not authorized',
      approveTooltip: 'Not authorized'
    }
    
    const canCreate = permissions.canCreate[resource as keyof typeof permissions.canCreate] || false
    const canUpdate = permissions.canUpdate[resource as keyof typeof permissions.canUpdate] || false
    const canDelete = permissions.canDelete[resource as keyof typeof permissions.canDelete] || false
    const canApprove = permissions.canApprove[resource as keyof typeof permissions.canApprove] || false
    
    return {
      canCreate,
      canUpdate,
      canDelete,
      canApprove,
      createTooltip: canCreate ? `Create ${resource}` : `${user.role} cannot create ${resource}`,
      updateTooltip: canUpdate ? `Update ${resource}` : `${user.role} cannot update ${resource}`,
      deleteTooltip: canDelete ? `Delete ${resource}` : `${user.role} cannot delete ${resource}`,
      approveTooltip: canApprove ? `Approve ${resource}` : `${user.role} cannot approve ${resource}`
    }
  }, [permissions, user, resource])
}
