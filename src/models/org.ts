// Shared organizational model and roles
// This file centralizes types so UI, services, and API mappers stay consistent.

export type OrgUnitType = 'PMO' | 'AREA' | 'PROJECT' | 'ZONE'

export interface OrgUnit {
  id: string
  type: OrgUnitType
  name: string
  parentId?: string | null
}

export type UserRole =
  | 'PMO'
  | 'AREA_MANAGER'
  | 'PROJECT_MANAGER'
  | 'ZONE_MANAGER'
  | 'SITE_ENGINEER'
  | 'CASHIER'
  | 'VIEWER'
  | 'ADMIN'

export interface UserOrgAssignment {
  userId: string
  orgUnitId: string
  role: UserRole
}

export interface ScopedUser {
  id: string
  name: string
  email?: string
  role: UserRole
  orgUnitId: string // primary
  active: boolean
  assignments?: UserOrgAssignment[]
}

// Core entities extend with orgUnitId for scoping
export interface SiteRef { id: string; name: string; orgUnitId: string }
export interface TaskRef { id: string; title: string; orgUnitId: string; siteId?: string }
export interface ExpenseRef { id: string; amount: number; orgUnitId: string; siteId?: string }
export interface RevenueRef { id: string; amount: number; orgUnitId: string; siteId?: string }
export interface SafeRef { id: string; balance: number; orgUnitId: string }
export interface PayrollRef { id: string; period: string; orgUnitId: string }

// Approval workflow
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export interface ApprovalTrailEntry {
  step: number
  role: UserRole
  approverUserId?: string
  decision?: ApprovalStatus
  decidedAt?: string
  remarks?: string
}

export interface ApprovableMeta {
  requestedBy: string
  currentApproverRole: UserRole
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  remarks?: string
  trail: ApprovalTrailEntry[]
}

// Financial thresholds by role
export interface ThresholdPolicy {
  zoneLimit: number
  projectLimit: number
  areaLimit: number
}

export interface OrgScopeState {
  // Current fixed selection (if chosen in switcher). Null means full user scope
  selectedUnitId: string | null
  // Allowed set = user scope ∩ selected subtree
  allowedOrgUnitIds: string[]
  // Breadcrumb path of selected scope
  breadcrumb: OrgUnit[]
}

