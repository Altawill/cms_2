// Mock service for development mode
import { 
  Site, 
  Safe, 
  Employee, 
  Expense, 
  Revenue, 
  User, 
  PayrollPeriod, 
  Payslip,
  Task,
  TaskUpdate,
  TaskApproval,
  TaskInvoiceLink,
  Invoice,
  Client
} from '../types'

// Mock data
export const mockUser: User = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  createdAt: new Date(),
  active: true
}

export const mockSites: Site[] = [
  {
    id: 'site-1',
    name: 'Downtown Office Complex',
    status: 'ACTIVE',
    progress: 75,
    address: '123 Main Street, Tripoli, Libya',
    phone: '+218-21-123456',
    email: 'downtown@construction.ly',
    monthlyBudget: 150000,
    startDate: new Date('2024-01-15'),
    targetDate: new Date('2024-12-15'),
    notes: 'High-priority commercial project',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'site-2',
    name: 'Residential Villa Project',
    status: 'PLANNING',
    progress: 25,
    address: '456 Green Avenue, Benghazi, Libya',
    phone: '+218-61-789012',
    email: 'villa@construction.ly',
    monthlyBudget: 80000,
    startDate: new Date('2024-03-01'),
    targetDate: new Date('2025-01-01'),
    notes: 'Luxury residential development',
    active: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-20')
  },
  {
    id: 'site-3',
    name: 'Shopping Mall Extension',
    status: 'COMPLETED',
    progress: 100,
    address: '789 Commerce Blvd, Misrata, Libya',
    phone: '+218-51-345678',
    email: 'mall@construction.ly',
    monthlyBudget: 200000,
    startDate: new Date('2023-06-01'),
    targetDate: new Date('2024-06-01'),
    notes: 'Successfully completed ahead of schedule',
    active: true,
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: 'site-4',
    name: 'The L Villas',
    status: 'ACTIVE',
    progress: 35,
    address: 'Al-Andalus District, Tripoli, Libya',
    phone: '+218-21-555-1000',
    email: 'info@lvillas.ly',
    monthlyBudget: 120000,
    startDate: new Date('2024-06-01'),
    targetDate: new Date('2025-12-31'),
    notes: 'Premium villa development project showcasing advanced task management',
    active: true,
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-08-30')
  }
]

export const mockSafes: Safe[] = [
  {
    id: 'safe-central',
    name: 'Central Safe',
    balance: 125000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'safe-site1',
    siteId: 'site-1',
    name: 'Downtown Office Safe',
    balance: 25000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'safe-site2',
    siteId: 'site-2',
    name: 'Villa Project Safe',
    balance: 15000,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-08-20')
  }
]

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    firstName: 'Ahmed',
    lastName: 'Al-Mansouri',
    email: 'ahmed.mansouri@construction.ly',
    phone: '+218-91-123456',
    nationalId: '123456789012',
    dateOfBirth: new Date('1985-03-15'),
    address: 'Hay Andalus, Tripoli, Libya',
    employeeNumber: 'EMP001',
    position: 'Site Manager',
    department: 'Construction',
    hireDate: new Date('2023-01-15'),
    status: 'ACTIVE',
    siteId: 'site-1',
    salary: {
      type: 'MONTHLY',
      amount: 2500,
      currency: 'LYD'
    },
    payrollSettings: {
      overtimeRate: 1.5,
      allowances: [
        { name: 'Transportation', amount: 200, type: 'FIXED' },
        { name: 'Housing', amount: 10, type: 'PERCENTAGE' }
      ],
      deductions: [
        { name: 'Tax', amount: 5, type: 'PERCENTAGE', mandatory: true },
        { name: 'Insurance', amount: 100, type: 'FIXED', mandatory: true }
      ]
    },
    // Legacy fields for compatibility
    name: 'Ahmed Al-Mansouri',
    baseSalary: 2500,
    overtimeRate: 1.5,
    deductionRules: [],
    bonusRules: [],
    joinedAt: new Date('2023-01-15'),
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2024-08-22'),
    createdBy: 'user-1',
    active: true
  },
  {
    id: 'emp-2',
    firstName: 'Fatima',
    lastName: 'Ben-Ali',
    email: 'fatima.benali@construction.ly',
    phone: '+218-92-234567',
    nationalId: '234567890123',
    dateOfBirth: new Date('1990-07-22'),
    address: 'Souq al-Juma, Tripoli, Libya',
    employeeNumber: 'EMP002',
    position: 'Architect',
    department: 'Design',
    hireDate: new Date('2023-06-01'),
    status: 'ACTIVE',
    siteId: 'site-2',
    salary: {
      type: 'MONTHLY',
      amount: 2200,
      currency: 'LYD'
    },
    payrollSettings: {
      overtimeRate: 1.5,
      allowances: [
        { name: 'Professional Development', amount: 150, type: 'FIXED' }
      ],
      deductions: [
        { name: 'Tax', amount: 5, type: 'PERCENTAGE', mandatory: true },
        { name: 'Insurance', amount: 80, type: 'FIXED', mandatory: true }
      ]
    },
    // Legacy fields
    name: 'Fatima Ben-Ali',
    baseSalary: 2200,
    overtimeRate: 1.5,
    deductionRules: [],
    bonusRules: [],
    joinedAt: new Date('2023-06-01'),
    createdAt: new Date('2023-05-25'),
    updatedAt: new Date('2024-08-20'),
    createdBy: 'user-1',
    active: true
  },
  {
    id: 'emp-3',
    firstName: 'Omar',
    lastName: 'Khalil',
    email: 'omar.khalil@construction.ly',
    phone: '+218-93-345678',
    nationalId: '345678901234',
    dateOfBirth: new Date('1988-11-10'),
    address: 'Gargaresh, Tripoli, Libya',
    employeeNumber: 'EMP003',
    position: 'Foreman',
    department: 'Construction',
    hireDate: new Date('2024-02-01'),
    status: 'ACTIVE',
    siteId: 'site-1',
    salary: {
      type: 'HOURLY',
      amount: 15,
      currency: 'LYD'
    },
    payrollSettings: {
      overtimeRate: 2.0,
      allowances: [
        { name: 'Safety Equipment', amount: 50, type: 'FIXED' }
      ],
      deductions: [
        { name: 'Tax', amount: 3, type: 'PERCENTAGE', mandatory: true }
      ]
    },
    // Legacy fields
    name: 'Omar Khalil',
    baseSalary: 15,
    overtimeRate: 2.0,
    deductionRules: [],
    bonusRules: [],
    joinedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-08-22'),
    createdBy: 'user-1',
    active: true
  },
  {
    id: 'emp-4',
    firstName: 'Aisha',
    lastName: 'Mohammed',
    email: 'aisha.mohammed@construction.ly',
    phone: '+218-94-456789',
    employeeNumber: 'EMP004',
    position: 'Accountant',
    department: 'Finance',
    hireDate: new Date('2023-09-15'),
    terminationDate: new Date('2024-07-31'),
    status: 'TERMINATED',
    siteId: 'site-3',
    salary: {
      type: 'MONTHLY',
      amount: 1800,
      currency: 'LYD'
    },
    payrollSettings: {
      overtimeRate: 1.25,
      allowances: [],
      deductions: [
        { name: 'Tax', amount: 4, type: 'PERCENTAGE', mandatory: true }
      ]
    },
    // Legacy fields
    name: 'Aisha Mohammed',
    baseSalary: 1800,
    overtimeRate: 1.25,
    deductionRules: [],
    bonusRules: [],
    joinedAt: new Date('2023-09-15'),
    createdAt: new Date('2023-09-10'),
    updatedAt: new Date('2024-07-31'),
    createdBy: 'user-1',
    active: false
  }
]

export const mockPayrollPeriods: PayrollPeriod[] = [
  {
    id: 'period-2024-08',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-08-31'),
    status: 'APPROVED',
    siteId: undefined, // Company-wide payroll
    approvedBy: 'user-1',
    approvedAt: new Date('2024-09-01'),
    approvalNotes: 'August 2024 payroll approved',
    createdAt: new Date('2024-08-25'),
    updatedAt: new Date('2024-09-01'),
    createdBy: 'user-1'
  },
  {
    id: 'period-2024-07',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-31'),
    status: 'PAID',
    siteId: undefined,
    approvedBy: 'user-1',
    approvedAt: new Date('2024-08-01'),
    approvalNotes: 'July 2024 payroll - all payments completed',
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-08-05'),
    createdBy: 'user-1'
  }
]

// Mock tasks data - The L Villas showcase
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    siteId: 'site-4', // The L Villas
    code: 'TLV-TASK-0001',
    name: 'Gypsum board works – Villa #3',
    description: 'Gypsum board ceiling installation for villa #3 including all preparatory work and finishing touches',
    category: 'GYPSUM',
    status: 'IN_PROGRESS',
    progress: 10,
    startDate: new Date('2024-08-15'),
    expectedCompletionDate: new Date('2025-06-20'),
    location: 'The villa',
    manpower: 4,
    executorId: 'emp-3', // Omar Khalil (Foreman) - "aaaaa" reference
    supervisorId: 'emp-1', // Ahmed Al-Mansouri (Site Manager)
    approverId: 'emp-2', // Fatima Ben-Ali (Project Manager/Engineer)
    priority: 'MEDIUM',
    billable: true,
    budgetAmount: 25000,
    costToDate: 2500,
    attachments: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-08-10'),
    updatedAt: new Date('2024-08-22'),
    archived: false
  },
  {
    id: 'task-2',
    siteId: 'site-4', // The L Villas
    code: 'TLV-TASK-0002',
    name: 'Electrical wiring - Villa #1',
    description: 'Complete electrical installation including main panel, circuits, and fixtures for Villa #1',
    category: 'ELECTRICAL',
    status: 'PLANNED',
    progress: 0,
    startDate: new Date('2024-09-15'),
    expectedCompletionDate: new Date('2024-10-30'),
    location: 'Villa #1',
    manpower: 6,
    executorId: 'emp-1',
    supervisorId: 'emp-2',
    priority: 'HIGH',
    billable: true,
    budgetAmount: 35000,
    costToDate: 0,
    attachments: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-08-25'),
    updatedAt: new Date('2024-08-25'),
    archived: false
  },
  {
    id: 'task-3',
    siteId: 'site-4', // The L Villas
    code: 'TLV-TASK-0003',
    name: 'Plumbing installation - Villa #2',
    description: 'Water supply and drainage system installation for Villa #2 including fixtures',
    category: 'PLUMBING',
    status: 'IN_PROGRESS',
    progress: 65,
    startDate: new Date('2024-08-01'),
    expectedCompletionDate: new Date('2024-09-30'),
    location: 'Villa #2',
    manpower: 5,
    executorId: 'emp-3',
    supervisorId: 'emp-1',
    approverId: 'emp-2',
    priority: 'MEDIUM',
    billable: true,
    budgetAmount: 28000,
    costToDate: 18200,
    attachments: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-08-30'),
    archived: false
  },
  {
    id: 'task-4',
    siteId: 'site-4', // The L Villas
    code: 'TLV-TASK-0004',
    name: 'Landscaping - Common Areas',
    description: 'Garden design and landscaping implementation for villa common areas and entrance',
    category: 'LANDSCAPING',
    status: 'COMPLETED',
    progress: 100,
    startDate: new Date('2024-07-01'),
    expectedCompletionDate: new Date('2024-08-15'),
    actualCompletionDate: new Date('2024-08-12'),
    location: 'Common areas and entrance',
    manpower: 8,
    executorId: 'emp-2',
    supervisorId: 'emp-1',
    priority: 'LOW',
    billable: true,
    budgetAmount: 15000,
    costToDate: 14800,
    attachments: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-08-12'),
    archived: false
  },
  {
    id: 'task-5',
    siteId: 'site-1', // Other site task for comparison
    code: 'DOC-TASK-0001',
    name: 'MEP rough-in installation',
    description: 'Mechanical, electrical, and plumbing rough-in work for floors 1-3',
    category: 'MEP',
    status: 'PLANNED',
    progress: 0,
    startDate: new Date('2024-09-01'),
    expectedCompletionDate: new Date('2024-11-15'),
    location: 'Floors 1-3',
    manpower: 8,
    executorId: 'emp-1',
    supervisorId: 'emp-2',
    priority: 'HIGH',
    billable: true,
    budgetAmount: 75000,
    costToDate: 0,
    attachments: [],
    createdBy: 'user-1',
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-08-20'),
    archived: false
  }
]

// Mock task updates
export const mockTaskUpdates: TaskUpdate[] = [
  {
    id: 'update-1',
    taskId: 'task-1',
    timestamp: new Date('2024-08-22T10:05:00Z'),
    progressDelta: 10,
    progressAfter: 10,
    note: 'Follow-up @10:05 am; ceiling panels 10% done. Started preparation work.',
    manpower: 4,
    location: 'Villa #3 - Main floor',
    executedById: 'emp-3',
    enteredById: 'user-1',
    attachments: [],
    issues: [],
    createdAt: new Date('2024-08-22T10:10:00Z')
  },
  {
    id: 'update-2',
    taskId: 'task-3',
    timestamp: new Date('2024-07-28T16:30:00Z'),
    progressDelta: 15,
    progressAfter: 100,
    note: 'Final excavation completed. All foundations ready for concrete pour.',
    manpower: 12,
    location: 'Residential compound - Phase 1',
    executedById: 'emp-3',
    enteredById: 'user-1',
    attachments: [],
    statusChange: 'COMPLETED',
    issues: [],
    createdAt: new Date('2024-07-28T16:35:00Z')
  }
]

// Mock task approvals
export const mockTaskApprovals: TaskApproval[] = [
  {
    id: 'approval-1',
    taskId: 'task-1',
    level: 'ENGINEER',
    approvedById: 'emp-2',
    approvedAt: new Date('2024-08-11'),
    status: 'APPROVED',
    remark: 'Technical specifications approved',
    createdAt: new Date('2024-08-10')
  },
  {
    id: 'approval-2',
    taskId: 'task-1',
    level: 'SITE_MANAGER',
    status: 'PENDING',
    createdAt: new Date('2024-08-10')
  },
  {
    id: 'approval-3',
    taskId: 'task-1',
    level: 'PROJECT_MANAGER',
    status: 'PENDING',
    createdAt: new Date('2024-08-10')
  }
]

// Mock clients
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Al-Noor Development Company',
    email: 'contact@alnoor-dev.ly',
    phone: '+218-21-555-0101',
    address: 'Tripoli Business Center, Tripoli, Libya',
    notes: 'Primary client for downtown office complex',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'client-2',
    name: 'Green Valley Homes',
    email: 'info@greenvalley.ly',
    phone: '+218-61-555-0202',
    address: 'Benghazi Commercial District, Benghazi, Libya',
    notes: 'Residential development specialist',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-20')
  }
]

// Mock invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'invoice-1',
    clientId: 'client-1',
    siteId: 'site-1',
    title: 'Gypsum Works - Villa #3 - Progress Payment #1',
    lines: [
      {
        id: 'line-1',
        description: 'Gypsum board ceiling installation - 10% completion',
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
        taskId: 'task-1'
      }
    ],
    total: 2500,
    paid: 1500,
    balance: 1000,
    currency: 'LYD',
    dueDate: new Date('2024-09-15'),
    status: 'SENT',
    createdBy: 'user-1',
    createdAt: new Date('2024-08-22'),
    updatedAt: new Date('2024-08-22')
  }
]

// Mock task invoice links
export const mockTaskInvoiceLinks: TaskInvoiceLink[] = [
  {
    id: 'link-1',
    taskId: 'task-1',
    invoiceId: 'invoice-1',
    amountBilled: 2500,
    amountPaid: 1500,
    balance: 1000,
    createdAt: new Date('2024-08-22')
  }
]

// Mock repository functions
export const mockRepository = {
  getAll: async (collection: string) => {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    
    switch (collection) {
      case 'sites': return mockSites
      case 'safes': return mockSafes
      case 'employees': return mockEmployees
      case 'payrollPeriods': return mockPayrollPeriods
      case 'payslips': return []
      case 'expenses': return []
      case 'revenues': return []
      case 'settings': return []
      case 'tasks': return mockTasks
      case 'taskUpdates': return mockTaskUpdates
      case 'taskApprovals': return mockTaskApprovals
      case 'taskInvoiceLinks': return mockTaskInvoiceLinks
      case 'invoices': return mockInvoices
      case 'clients': return mockClients
      default: return []
    }
  },

  getById: async (collection: string, id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const items = await mockRepository.getAll(collection)
    return items.find((item: any) => item.id === id) || null
  },

  create: async (collection: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newItem = {
      ...data,
      id: `${collection}-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log(`Mock created in ${collection}:`, newItem)
    return newItem
  },

  update: async (collection: string, id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log(`Mock updated in ${collection} (${id}):`, data)
    return true
  },

  delete: async (collection: string, id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log(`Mock deleted from ${collection}:`, id)
    return true
  },

  // Mock transfer between safes
  transferBetweenSafes: async (
    fromSafeId: string,
    toSafeId: string,
    amount: number,
    note: string,
    userId: string
  ) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Find safes by ID
    const fromSafe = mockSafes.find(s => s.id === fromSafeId)
    const toSafe = mockSafes.find(s => s.id === toSafeId)
    
    if (!fromSafe || !toSafe) {
      throw new Error('One or both safes not found')
    }
    
    if (fromSafe.balance < amount) {
      throw new Error('Insufficient funds')
    }
    
    // Update balances
    fromSafe.balance -= amount
    toSafe.balance += amount
    fromSafe.updatedAt = new Date()
    toSafe.updatedAt = new Date()
    
    // Create transaction records (mock - in real app would be stored)
    const timestamp = new Date()
    const transactionId = `transfer-${Date.now()}`
    
    console.log('Mock transfer completed:', {
      from: fromSafe.name,
      to: toSafe.name,
      amount,
      note,
      transactionId
    })
    
    return {
      transactionId,
      fromBalance: fromSafe.balance,
      toBalance: toSafe.balance
    }
  },

  // Initialize task mock data
  initializeTasks: () => {
    console.log('Mock task data initialized for development mode')
    console.log('Available tasks:', mockTasks.length)
    console.log('Available task updates:', mockTaskUpdates.length)
    console.log('Available task approvals:', mockTaskApprovals.length)
  },

  // Get tasks by site (filtered)
  getTasksBySite: async (siteId: string, filter?: any) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    let tasks = mockTasks.filter(task => task.siteId === siteId && !task.archived)
    
    if (filter?.status?.length) {
      tasks = tasks.filter(task => filter.status.includes(task.status))
    }
    
    if (filter?.category?.length) {
      tasks = tasks.filter(task => filter.category.includes(task.category))
    }
    
    return tasks
  },

  // Get task updates by task
  getTaskUpdates: async (taskId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockTaskUpdates.filter(update => update.taskId === taskId)
  },

  // Get task approvals by task
  getTaskApprovals: async (taskId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockTaskApprovals.filter(approval => approval.taskId === taskId)
  }
}

// Mock auth functions
export const mockAuth = {
  signInWithEmailAndPassword: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (email === 'admin@demo.com' && password === 'demo123') {
      return { user: { uid: mockUser.id } }
    }
    throw new Error('Invalid credentials. Use: admin@demo.com / demo123')
  },

  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('Mock user signed out')
  }
}

export const isDevMode = true
