// User roles and permissions
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  lastLoginAt?: Date
  active: boolean
}

export interface UserSiteRole {
  id: string
  userId: string
  siteId: string
  permissions: {
    sites: CRUDPermissions
    employees: CRUDPermissions
    safes: CRUDPermissions
    expenses: CRUDPermissions
    revenues: CRUDPermissions
    payroll: CRUDPermissions
    reports: CRUDPermissions
  }
}

export interface CRUDPermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

// Company settings
export interface Settings {
  id: string
  companyName: string
  companyEmail: string
  currency: string
  logoUrl?: string
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'ar'
  createdAt: Date
  updatedAt: Date
}

// Sites
export interface Site {
  id: string
  name: string
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  progress: number
  managerId?: string
  address?: string
  phone?: string
  email?: string
  monthlyBudget?: number
  startDate?: Date
  targetDate?: Date
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Safes and transactions
export interface Safe {
  id: string
  siteId?: string // null for central safe
  name: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'

export interface SafeTransaction {
  id: string
  safeId: string
  type: TransactionType
  amount: number
  note?: string
  counterpartySafeId?: string // for transfers
  createdBy: string
  createdAt: Date
}

// Employees
export interface Employee {
  id: string
  // Personal Information
  firstName: string
  lastName: string
  email?: string
  phone?: string
  nationalId?: string
  dateOfBirth?: Date
  address?: string
  
  // Employment Information
  employeeNumber: string
  position: string
  department?: string
  hireDate: Date
  terminationDate?: Date
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE'
  
  // Site Assignment
  siteId: string
  
  // Payroll Information
  salary: {
    type: 'HOURLY' | 'MONTHLY' | 'FIXED'
    amount: number // Base salary/hourly rate
    currency: 'LYD'
  }
  
  // Payroll Settings
  payrollSettings: {
    overtimeRate?: number // Multiplier for overtime (e.g., 1.5)
    allowances?: {
      name: string
      amount: number
      type: 'FIXED' | 'PERCENTAGE'
    }[]
    deductions?: {
      name: string
      amount: number
      type: 'FIXED' | 'PERCENTAGE'
      mandatory: boolean // Tax, insurance, etc.
    }[]
  }
  
  // Legacy fields for compatibility
  name: string // computed from firstName + lastName
  baseSalary: number // mapped to salary.amount
  overtimeRate: number // mapped to payrollSettings.overtimeRate
  deductionRules: DeductionRule[]
  bonusRules: BonusRule[]
  joinedAt: Date // mapped to hireDate
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  active: boolean
}

export interface DeductionRule {
  id: string
  name: string
  type: 'FIXED' | 'PERCENTAGE'
  value: number
  conditions?: string
}

export interface BonusRule {
  id: string
  name: string
  type: 'FIXED' | 'PERCENTAGE'
  value: number
  conditions?: string
}

// Payroll
export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID'

export interface PayrollRun {
  id: string
  siteId: string
  month: number
  year: number
  status: PayrollStatus
  totals: {
    baseTotal: number
    overtimeTotal: number
    bonusTotal: number
    deductionTotal: number
    netTotal: number
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface PayrollItem {
  id: string
  payrollRunId: string
  employeeId: string
  base: number
  overtimeHours: number
  overtimePay: number
  bonuses: PayrollBonus[]
  deductions: PayrollDeduction[]
  net: number
}

export interface PayrollBonus {
  name: string
  amount: number
}

export interface PayrollDeduction {
  name: string
  amount: number
}

// New comprehensive payroll system types
export interface PayrollPeriod {
  id: string
  startDate: Date
  endDate: Date
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED'
  siteId?: string // null for company-wide payroll
  
  // Approval workflow
  approvedBy?: string
  approvedAt?: Date
  approvalNotes?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Payslip {
  id: string
  employeeId: string
  payrollPeriodId: string
  
  // Period Information
  startDate: Date
  endDate: Date
  payDate?: Date
  
  // Calculations
  workingDays: number
  actualDaysWorked: number
  overtimeHours?: number
  
  // Earnings
  basicSalary: number
  overtimePay: number
  allowances: {
    name: string
    amount: number
  }[]
  totalEarnings: number
  
  // Deductions
  deductions: {
    name: string
    amount: number
    mandatory: boolean
  }[]
  totalDeductions: number
  
  // Final calculation
  netSalary: number
  
  // Status
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID'
  
  // Approval
  approvedBy?: string
  approvedAt?: Date
  
  // Payment
  paidBy?: string
  paidAt?: Date
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CHECK'
  paymentReference?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Expenses
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Expense {
  id: string
  siteId: string
  category: string
  itemName: string
  supplier: string
  qty: number
  unitPrice: number
  total: number
  status: ExpenseStatus
  date: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  varianceAlert?: PriceVariance
}

export interface PriceVariance {
  previousPrice: number
  variance: number
  percentageChange: number
}

export interface PriceHistory {
  id: string
  siteId: string
  itemName: string
  supplier: string
  unitPrice: number
  date: Date
}

// Revenues and clients
export type RevenueStatus = 'OPEN' | 'PARTIAL' | 'PAID'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Revenue {
  id: string
  siteId: string
  clientId: string
  itemName: string
  qty: number
  unitPrice: number
  total: number
  paidAmount: number
  dueDate?: Date
  status: RevenueStatus
  date: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type ReceiptKind = 'MANUAL' | 'AUTO'

export interface Receipt {
  id: string
  clientId: string
  siteId?: string
  total: number
  paid: number
  remaining: number
  dueDate?: Date
  kind: ReceiptKind
  pdfUrl?: string
  receiptNumber: string
  createdBy: string
  createdAt: Date
}

// Activity logging
export interface ActivityLog {
  id: string
  entityType: string
  entityId: string
  action: string
  byUser: string
  at: Date
  payload?: Record<string, any>
}

// Dashboard and analytics
export interface KPI {
  label: string
  value: number
  change?: number
  trend?: 'up' | 'down' | 'stable'
}

export interface ChartData {
  name: string
  value: number
  [key: string]: any
}

// Task and Progress Management
export type TaskStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TaskCategory = 'GYPSUM' | 'MEP' | 'CIVIL' | 'PLUMBING' | 'ELECTRICAL' | 'FINISHING' | 'LANDSCAPING' | 'OTHER'
export type ApprovalLevel = 'ENGINEER' | 'SITE_MANAGER' | 'PROJECT_MANAGER'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Task {
  id: string
  siteId: string
  code: string // Human-readable like "TASK-0001"
  name: string
  description: string
  category: TaskCategory
  status: TaskStatus
  progress: number // 0-100
  startDate?: Date
  expectedCompletionDate?: Date
  actualCompletionDate?: Date
  location?: string
  manpower: number
  executorId?: string // FK to employees
  supervisorId?: string // FK to employees
  approverId?: string // FK to employees
  priority: TaskPriority
  billable: boolean
  budgetAmount?: number
  costToDate: number
  attachments: TaskAttachment[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  archived: boolean
}

export interface TaskUpdate {
  id: string
  taskId: string
  timestamp: Date
  progressDelta: number // e.g., +10
  progressAfter: number // 0-100
  note: string
  manpower?: number // override for that day
  location?: string // override
  executedById?: string // FK to employees
  enteredById: string // FK to user
  attachments: TaskAttachment[]
  statusChange?: TaskStatus
  issues: string[] // array of issue tags
  createdAt: Date
}

export interface TaskApproval {
  id: string
  taskId: string
  level: ApprovalLevel
  approvedById?: string
  approvedAt?: Date
  status: ApprovalStatus
  remark?: string
  createdAt: Date
}

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string // MIME type
  size: number
  uploadedBy: string
  uploadedAt: Date
  exifData?: {
    timestamp?: Date
    location?: {
      latitude: number
      longitude: number
    }
  }
}

export interface TaskInvoiceLink {
  id: string
  taskId: string
  invoiceId: string
  amountBilled: number
  amountPaid: number
  balance: number
  createdAt: Date
}

// Invoice entity (basic implementation)
export interface Invoice {
  id: string
  clientId: string
  siteId: string
  title: string
  lines: InvoiceLine[]
  total: number
  paid: number
  balance: number
  currency: string
  dueDate?: Date
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  taskId?: string // Optional link to task
}

// Task filters and search
export interface TaskFilter {
  status?: TaskStatus[]
  category?: TaskCategory[]
  priority?: TaskPriority[]
  assignee?: string[]
  billable?: boolean
  overdue?: boolean
}

// Filters and search
export interface DateFilter {
  from?: Date
  to?: Date
}

export interface SiteFilter {
  siteIds: string[]
}

export interface CategoryFilter {
  categories: string[]
}

export interface GlobalFilter {
  date?: DateFilter
  sites?: SiteFilter
  categories?: CategoryFilter
}
