import { UserRole } from '../models/org'

export interface RolePermissions {
  // Data scope
  canViewOrgWide: boolean
  canViewAreaWide: boolean
  canViewProjectWide: boolean
  canViewZoneWide: boolean
  canViewSiteOnly: boolean
  
  // CRUD permissions
  canCreate: {
    sites: boolean
    tasks: boolean
    employees: boolean
    expenses: boolean
    revenues: boolean
    safes: boolean
    payroll: boolean
    reports: boolean
  }
  
  canUpdate: {
    sites: boolean
    tasks: boolean
    employees: boolean
    expenses: boolean
    revenues: boolean
    safes: boolean
    payroll: boolean
  }
  
  canDelete: {
    sites: boolean
    tasks: boolean
    employees: boolean
    expenses: boolean
    revenues: boolean
    safes: boolean
    payroll: boolean
  }
  
  // Approval permissions
  canApprove: {
    tasks: boolean
    expenses: boolean
    revenues: boolean
    payroll: boolean
    safes: boolean
  }
  
  // Financial limits (in LYD)
  expenseLimit: number | null // null = unlimited
  safeLimit: number | null
  payrollLimit: number | null
  
  // Reporting
  canGenerateReports: boolean
  canViewAllReports: boolean
  canExportReports: boolean
}

const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  PMO: {
    canViewOrgWide: true,
    canViewAreaWide: true,
    canViewProjectWide: true,
    canViewZoneWide: true,
    canViewSiteOnly: false,
    canCreate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true,
      reports: true
    },
    canUpdate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true
    },
    canDelete: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true
    },
    canApprove: {
      tasks: true,
      expenses: true,
      revenues: true,
      payroll: true,
      safes: true
    },
    expenseLimit: null, // unlimited
    safeLimit: null,
    payrollLimit: null,
    canGenerateReports: true,
    canViewAllReports: true,
    canExportReports: true
  },

  AREA_MANAGER: {
    canViewOrgWide: false,
    canViewAreaWide: true,
    canViewProjectWide: true,
    canViewZoneWide: true,
    canViewSiteOnly: false,
    canCreate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true,
      reports: true
    },
    canUpdate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true
    },
    canDelete: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: false,
      payroll: false
    },
    canApprove: {
      tasks: true,
      expenses: true,
      revenues: true,
      payroll: true,
      safes: true
    },
    expenseLimit: 50000, // 50,000 LYD
    safeLimit: 100000,
    payrollLimit: null,
    canGenerateReports: true,
    canViewAllReports: true,
    canExportReports: true
  },

  PROJECT_MANAGER: {
    canViewOrgWide: false,
    canViewAreaWide: false,
    canViewProjectWide: true,
    canViewZoneWide: true,
    canViewSiteOnly: false,
    canCreate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: false,
      payroll: true,
      reports: true
    },
    canUpdate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: false,
      payroll: true
    },
    canDelete: {
      sites: false,
      tasks: true,
      employees: false,
      expenses: true,
      revenues: true,
      safes: false,
      payroll: false
    },
    canApprove: {
      tasks: true,
      expenses: true,
      revenues: true,
      payroll: false,
      safes: false
    },
    expenseLimit: 25000, // 25,000 LYD
    safeLimit: 10000,
    payrollLimit: 50000,
    canGenerateReports: true,
    canViewAllReports: false,
    canExportReports: true
  },

  ZONE_MANAGER: {
    canViewOrgWide: false,
    canViewAreaWide: false,
    canViewProjectWide: false,
    canViewZoneWide: true,
    canViewSiteOnly: false,
    canCreate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: false,
      payroll: false,
      reports: true
    },
    canUpdate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: false,
      payroll: false
    },
    canDelete: {
      sites: false,
      tasks: true,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false
    },
    canApprove: {
      tasks: true,
      expenses: false,
      revenues: false,
      payroll: false,
      safes: false
    },
    expenseLimit: 10000, // 10,000 LYD
    safeLimit: 5000,
    payrollLimit: null,
    canGenerateReports: true,
    canViewAllReports: false,
    canExportReports: false
  },

  SITE_ENGINEER: {
    canViewOrgWide: false,
    canViewAreaWide: false,
    canViewProjectWide: false,
    canViewZoneWide: false,
    canViewSiteOnly: true,
    canCreate: {
      sites: false,
      tasks: true,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false,
      reports: false
    },
    canUpdate: {
      sites: false,
      tasks: true,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false
    },
    canDelete: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false
    },
    canApprove: {
      tasks: false,
      expenses: false,
      revenues: false,
      payroll: false,
      safes: false
    },
    expenseLimit: 0,
    safeLimit: 0,
    payrollLimit: 0,
    canGenerateReports: false,
    canViewAllReports: false,
    canExportReports: false
  },

  CASHIER: {
    canViewOrgWide: false,
    canViewAreaWide: false,
    canViewProjectWide: false,
    canViewZoneWide: false,
    canViewSiteOnly: true,
    canCreate: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: false,
      reports: false
    },
    canUpdate: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: false
    },
    canDelete: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false
    },
    canApprove: {
      tasks: false,
      expenses: false,
      revenues: false,
      payroll: false,
      safes: false
    },
    expenseLimit: 5000, // 5,000 LYD for receipts
    safeLimit: 20000, // Can handle larger safe transactions
    payrollLimit: 0,
    canGenerateReports: false,
    canViewAllReports: false,
    canExportReports: false
  },

  VIEWER: {
    canViewOrgWide: false,
    canViewAreaWide: false,
    canViewProjectWide: false,
    canViewZoneWide: false,
    canViewSiteOnly: true,
    canCreate: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false,
      reports: false
    },
    canUpdate: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false
    },
    canDelete: {
      sites: false,
      tasks: false,
      employees: false,
      expenses: false,
      revenues: false,
      safes: false,
      payroll: false
    },
    canApprove: {
      tasks: false,
      expenses: false,
      revenues: false,
      payroll: false,
      safes: false
    },
    expenseLimit: 0,
    safeLimit: 0,
    payrollLimit: 0,
    canGenerateReports: false,
    canViewAllReports: false,
    canExportReports: false
  },

  ADMIN: {
    canViewOrgWide: true,
    canViewAreaWide: true,
    canViewProjectWide: true,
    canViewZoneWide: true,
    canViewSiteOnly: true,
    canCreate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true,
      reports: true
    },
    canUpdate: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true
    },
    canDelete: {
      sites: true,
      tasks: true,
      employees: true,
      expenses: true,
      revenues: true,
      safes: true,
      payroll: true
    },
    canApprove: {
      tasks: true,
      expenses: true,
      revenues: true,
      payroll: true,
      safes: true
    },
    expenseLimit: null, // unlimited
    safeLimit: null,
    payrollLimit: null,
    canGenerateReports: true,
    canViewAllReports: true,
    canExportReports: true
  }
}

export function getRolePermissions(role: UserRole): RolePermissions {
  return rolePermissionsMap[role]
}

export function hasPermission(role: UserRole, resource: keyof RolePermissions['canCreate'], action: 'create' | 'update' | 'delete' | 'approve'): boolean {
  const perms = getRolePermissions(role)
  
  switch (action) {
    case 'create': return perms.canCreate[resource]
    case 'update': return perms.canUpdate[resource]
    case 'delete': return perms.canDelete[resource]
    case 'approve': return perms.canApprove[resource]
    default: return false
  }
}

export function canApproveAmount(role: UserRole, amount: number, type: 'expense' | 'safe' | 'payroll'): boolean {
  const perms = getRolePermissions(role)
  
  switch (type) {
    case 'expense': return perms.expenseLimit === null || amount <= perms.expenseLimit
    case 'safe': return perms.safeLimit === null || amount <= perms.safeLimit
    case 'payroll': return perms.payrollLimit === null || amount <= perms.payrollLimit
    default: return false
  }
}

export function getApprovalChain(currentRole: UserRole): UserRole[] {
  // Returns the approval chain from current role upward
  switch (currentRole) {
    case 'SITE_ENGINEER': return ['ZONE_MANAGER', 'PROJECT_MANAGER', 'AREA_MANAGER', 'PMO']
    case 'ZONE_MANAGER': return ['PROJECT_MANAGER', 'AREA_MANAGER', 'PMO']
    case 'PROJECT_MANAGER': return ['AREA_MANAGER', 'PMO']
    case 'AREA_MANAGER': return ['PMO']
    case 'PMO': return []
    case 'CASHIER': return ['ZONE_MANAGER', 'PROJECT_MANAGER', 'AREA_MANAGER', 'PMO']
    case 'VIEWER': return [] // Cannot initiate approvals
    case 'ADMIN': return [] // Can approve directly
    default: return []
  }
}

export function getNextApprover(currentRole: UserRole, amount?: number, type?: 'expense' | 'safe' | 'payroll'): UserRole | null {
  const chain = getApprovalChain(currentRole)
  
  if (amount && type) {
    // Find the first role in chain that can approve this amount
    for (const role of chain) {
      if (canApproveAmount(role, amount, type)) {
        return role
      }
    }
    return 'PMO' // Fallback to PMO for high amounts
  }
  
  // Return immediate next approver
  return chain[0] || null
}
