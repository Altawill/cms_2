import { 
  Site, Employee, PayrollRecord, Expense, Revenue, Safe, Client, 
  CompanyInfo, Receipt, SafeTransaction, ClientPayment 
} from '../types/reports'

// Company Information
export const companyInfo: CompanyInfo = {
  name: 'AlBina Construction & Management',
  logo: '/assets/company-logo.png',
  address: {
    street: '123 King Fahd Road',
    city: 'Riyadh',
    state: 'Riyadh Province',
    zip: '11564',
    country: 'Saudi Arabia'
  },
  contact: {
    phone: '+966-11-123-4567',
    email: 'info@albina-construction.sa',
    website: 'www.albina-construction.sa'
  },
  taxId: '300123456789',
  registration: 'CR-1234567890'
}

// Mock Sites Data
export const mockSites: Site[] = [
  {
    id: 'site-001',
    name: 'Al-Riyadh Tower Complex',
    location: 'King Fahd District, Riyadh',
    type: 'CONSTRUCTION',
    status: 'ACTIVE',
    startDate: '2024-01-15',
    endDate: '2025-06-30',
    budget: 15000000,
    spent: 8500000,
    progress: 65,
    manager: 'Ahmed Al-Saudi',
    employees: ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005'],
    address: {
      street: 'King Fahd Road',
      city: 'Riyadh',
      state: 'Riyadh Province',
      zip: '11564',
      country: 'Saudi Arabia'
    },
    coordinates: { lat: 24.7136, lng: 46.6753 }
  },
  {
    id: 'site-002',
    name: 'Jeddah Marina Residences',
    location: 'Corniche District, Jeddah',
    type: 'CONSTRUCTION',
    status: 'ACTIVE',
    startDate: '2023-09-01',
    endDate: '2025-03-15',
    budget: 22000000,
    spent: 16800000,
    progress: 78,
    manager: 'Fatima Al-Harbi',
    employees: ['emp-006', 'emp-007', 'emp-008', 'emp-009'],
    address: {
      street: 'Corniche Road',
      city: 'Jeddah',
      state: 'Makkah Province',
      zip: '21589',
      country: 'Saudi Arabia'
    },
    coordinates: { lat: 21.4858, lng: 39.1925 }
  },
  {
    id: 'site-003',
    name: 'Dammam Business Center',
    location: 'Al-Faisaliyah District, Dammam',
    type: 'OFFICE',
    status: 'COMPLETED',
    startDate: '2023-03-01',
    endDate: '2024-08-30',
    budget: 8500000,
    spent: 8200000,
    progress: 100,
    manager: 'Omar Al-Mutairi',
    employees: ['emp-010', 'emp-011', 'emp-012'],
    address: {
      street: 'Al-Faisaliyah Street',
      city: 'Dammam',
      state: 'Eastern Province',
      zip: '31441',
      country: 'Saudi Arabia'
    },
    coordinates: { lat: 26.4282, lng: 50.0889 }
  }
]

// Mock Employees Data
export const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    firstName: 'Ahmed',
    lastName: 'Al-Saudi',
    email: 'ahmed.alsaudi@albina.sa',
    phone: '+966-50-123-4567',
    position: 'Project Manager',
    department: 'Construction',
    siteId: 'site-001',
    salary: 15000,
    hireDate: '2023-01-15',
    status: 'ACTIVE',
    workSchedule: { hoursPerWeek: 48, daysPerWeek: 6 },
    address: {
      street: 'Al-Malaz District',
      city: 'Riyadh',
      state: 'Riyadh Province',
      zip: '11564',
      country: 'Saudi Arabia'
    },
    emergencyContact: {
      name: 'Khalid Al-Saudi',
      phone: '+966-50-987-6543',
      relationship: 'Brother'
    }
  },
  {
    id: 'emp-002',
    firstName: 'Fatima',
    lastName: 'Al-Harbi',
    email: 'fatima.alharbi@albina.sa',
    phone: '+966-55-234-5678',
    position: 'Site Engineer',
    department: 'Engineering',
    siteId: 'site-002',
    salary: 12000,
    hireDate: '2023-03-01',
    status: 'ACTIVE',
    workSchedule: { hoursPerWeek: 45, daysPerWeek: 6 },
    address: {
      street: 'Al-Hamra District',
      city: 'Jeddah',
      state: 'Makkah Province',
      zip: '21589',
      country: 'Saudi Arabia'
    },
    emergencyContact: {
      name: 'Aisha Al-Harbi',
      phone: '+966-55-876-5432',
      relationship: 'Sister'
    }
  },
  {
    id: 'emp-003',
    firstName: 'Omar',
    lastName: 'Al-Mutairi',
    email: 'omar.almutairi@albina.sa',
    phone: '+966-56-345-6789',
    position: 'Safety Officer',
    department: 'Safety',
    siteId: 'site-001',
    salary: 8500,
    hireDate: '2023-06-15',
    status: 'ACTIVE',
    workSchedule: { hoursPerWeek: 40, daysPerWeek: 5 },
    address: {
      street: 'Al-Naseem District',
      city: 'Riyadh',
      state: 'Riyadh Province',
      zip: '11564',
      country: 'Saudi Arabia'
    },
    emergencyContact: {
      name: 'Mohammed Al-Mutairi',
      phone: '+966-56-765-4321',
      relationship: 'Father'
    }
  },
  {
    id: 'emp-004',
    firstName: 'Layla',
    lastName: 'Al-Zahrani',
    email: 'layla.alzahrani@albina.sa',
    phone: '+966-54-456-7890',
    position: 'Architect',
    department: 'Design',
    siteId: 'site-002',
    salary: 13500,
    hireDate: '2022-11-01',
    status: 'ACTIVE',
    workSchedule: { hoursPerWeek: 40, daysPerWeek: 5 },
    address: {
      street: 'Al-Zahra District',
      city: 'Jeddah',
      state: 'Makkah Province',
      zip: '21589',
      country: 'Saudi Arabia'
    },
    emergencyContact: {
      name: 'Norah Al-Zahrani',
      phone: '+966-54-654-3210',
      relationship: 'Mother'
    }
  },
  {
    id: 'emp-005',
    firstName: 'Hassan',
    lastName: 'Al-Qurashi',
    email: 'hassan.alqurashi@albina.sa',
    phone: '+966-53-567-8901',
    position: 'Foreman',
    department: 'Construction',
    siteId: 'site-001',
    salary: 7500,
    hireDate: '2023-08-01',
    status: 'ACTIVE',
    workSchedule: { hoursPerWeek: 48, daysPerWeek: 6 },
    address: {
      street: 'Al-Olaya District',
      city: 'Riyadh',
      state: 'Riyadh Province',
      zip: '11564',
      country: 'Saudi Arabia'
    },
    emergencyContact: {
      name: 'Zaid Al-Qurashi',
      phone: '+966-53-543-2109',
      relationship: 'Son'
    }
  }
]

// Mock Payroll Records
export const mockPayrollRecords: PayrollRecord[] = [
  {
    id: 'pay-001',
    employeeId: 'emp-001',
    payPeriod: { start: '2024-01-01', end: '2024-01-31' },
    hoursWorked: 192,
    overtimeHours: 16,
    baseSalary: 15000,
    overtimePay: 1200,
    bonuses: 2000,
    deductions: 500,
    grossPay: 18200,
    netPay: 15200,
    taxes: { federal: 1800, state: 600, social: 400, medicare: 200 },
    benefits: { health: 300, dental: 150, retirement: 750 },
    payDate: '2024-02-01',
    status: 'PAID'
  },
  {
    id: 'pay-002',
    employeeId: 'emp-002',
    payPeriod: { start: '2024-01-01', end: '2024-01-31' },
    hoursWorked: 180,
    overtimeHours: 8,
    baseSalary: 12000,
    overtimePay: 480,
    bonuses: 1000,
    deductions: 200,
    grossPay: 13280,
    netPay: 11080,
    taxes: { federal: 1320, state: 440, social: 266, medicare: 133 },
    benefits: { health: 250, dental: 100, retirement: 600 },
    payDate: '2024-02-01',
    status: 'PAID'
  }
]

// Mock Expenses Data
export const mockExpenses: Expense[] = [
  {
    id: 'exp-001',
    title: 'Construction Materials - Steel Beams',
    description: 'High-grade steel beams for tower foundation',
    amount: 85000,
    category: 'Materials',
    siteId: 'site-001',
    employeeId: 'emp-001',
    date: '2024-01-15',
    receiptUrl: '/receipts/exp-001.pdf',
    approved: true,
    approvedBy: 'Ahmed Al-Saudi',
    approvedAt: '2024-01-16',
    tags: ['steel', 'foundation', 'materials']
  },
  {
    id: 'exp-002',
    title: 'Heavy Machinery Rental',
    description: 'Crane rental for 3 months',
    amount: 45000,
    category: 'Equipment',
    siteId: 'site-001',
    employeeId: 'emp-003',
    date: '2024-01-20',
    approved: true,
    approvedBy: 'Ahmed Al-Saudi',
    approvedAt: '2024-01-21',
    tags: ['crane', 'rental', 'machinery']
  },
  {
    id: 'exp-003',
    title: 'Safety Equipment Purchase',
    description: 'Hard hats, safety vests, and protective gear',
    amount: 12000,
    category: 'Safety',
    siteId: 'site-002',
    employeeId: 'emp-003',
    date: '2024-01-25',
    approved: true,
    approvedBy: 'Fatima Al-Harbi',
    approvedAt: '2024-01-26',
    tags: ['safety', 'equipment', 'protective-gear']
  }
]

// Mock Revenues Data
export const mockRevenues: Revenue[] = [
  {
    id: 'rev-001',
    title: 'Tower Construction Contract - Phase 1',
    description: 'Payment for foundation and ground floor construction',
    amount: 3500000,
    clientId: 'client-001',
    siteId: 'site-001',
    date: '2024-01-30',
    invoiceNumber: 'INV-2024-001',
    paymentStatus: 'PAID',
    paidDate: '2024-01-30',
    category: 'Construction Contract',
    tags: ['tower', 'phase-1', 'foundation']
  },
  {
    id: 'rev-002',
    title: 'Marina Residences - Milestone Payment',
    description: 'Payment for structural work completion',
    amount: 2200000,
    clientId: 'client-002',
    siteId: 'site-002',
    date: '2024-02-15',
    invoiceNumber: 'INV-2024-002',
    paymentStatus: 'PARTIAL',
    paidDate: '2024-02-15',
    dueDate: '2024-03-15',
    category: 'Milestone Payment',
    tags: ['marina', 'structural', 'milestone']
  },
  {
    id: 'rev-003',
    title: 'Consulting Services - Q1 2024',
    description: 'Project management and consulting services',
    amount: 150000,
    clientId: 'client-003',
    date: '2024-03-31',
    invoiceNumber: 'INV-2024-003',
    paymentStatus: 'UNPAID',
    dueDate: '2024-04-30',
    category: 'Consulting',
    tags: ['consulting', 'q1', 'management']
  }
]

// Mock Clients Data
export const mockClients: Client[] = [
  {
    id: 'client-001',
    name: 'Mohammed Al-Rashid',
    company: 'Al-Rashid Development Company',
    email: 'mohammed@alrashid-dev.sa',
    phone: '+966-11-555-0001',
    address: {
      street: 'Olaya Street',
      city: 'Riyadh',
      state: 'Riyadh Province',
      zip: '11564',
      country: 'Saudi Arabia'
    },
    totalPaid: 3500000,
    totalOwed: 1500000,
    paymentHistory: [
      {
        id: 'payment-001',
        amount: 3500000,
        date: '2024-01-30',
        description: 'Phase 1 Payment',
        method: 'BANK_TRANSFER',
        receiptNumber: 'REC-001',
        status: 'PAID'
      }
    ],
    projects: ['site-001'],
    status: 'ACTIVE',
    createdAt: '2023-12-01'
  },
  {
    id: 'client-002',
    name: 'Norah Al-Mansouri',
    company: 'Al-Mansouri Real Estate',
    email: 'norah@almansouri-re.sa',
    phone: '+966-12-555-0002',
    address: {
      street: 'Prince Sultan Street',
      city: 'Jeddah',
      state: 'Makkah Province',
      zip: '21589',
      country: 'Saudi Arabia'
    },
    totalPaid: 1800000,
    totalOwed: 400000,
    paymentHistory: [
      {
        id: 'payment-002',
        amount: 1800000,
        date: '2024-02-15',
        description: 'Partial Milestone Payment',
        method: 'BANK_TRANSFER',
        receiptNumber: 'REC-002',
        status: 'PAID'
      }
    ],
    projects: ['site-002'],
    status: 'ACTIVE',
    createdAt: '2023-09-01'
  },
  {
    id: 'client-003',
    name: 'Khalid Al-Otaibi',
    company: 'Al-Otaibi Holdings',
    email: 'khalid@alotaibi-holdings.sa',
    phone: '+966-13-555-0003',
    address: {
      street: 'King Fahd Street',
      city: 'Dammam',
      state: 'Eastern Province',
      zip: '31441',
      country: 'Saudi Arabia'
    },
    totalPaid: 0,
    totalOwed: 150000,
    paymentHistory: [],
    projects: ['site-003'],
    status: 'ACTIVE',
    createdAt: '2024-03-01'
  }
]

// Mock Safes Data
export const mockSafes: Safe[] = [
  {
    id: 'safe-001',
    name: 'Main Company Account',
    type: 'BANK',
    balance: 5750000,
    currency: 'SAR',
    location: 'Al-Rajhi Bank - King Fahd Branch',
    lastUpdated: '2024-02-01',
    transactions: [
      {
        id: 'txn-001',
        type: 'DEPOSIT',
        amount: 3500000,
        description: 'Client payment - Tower Project',
        date: '2024-01-30',
        relatedEntityId: 'rev-001',
        relatedEntityType: 'REVENUE'
      },
      {
        id: 'txn-002',
        type: 'WITHDRAWAL',
        amount: 85000,
        description: 'Materials purchase',
        date: '2024-01-15',
        relatedEntityId: 'exp-001',
        relatedEntityType: 'EXPENSE'
      }
    ]
  },
  {
    id: 'safe-002',
    name: 'Petty Cash - Site 001',
    type: 'CASH',
    balance: 25000,
    currency: 'SAR',
    location: 'Al-Riyadh Tower Site Office',
    lastUpdated: '2024-02-01',
    transactions: [
      {
        id: 'txn-003',
        type: 'WITHDRAWAL',
        amount: 5000,
        description: 'Daily expenses',
        date: '2024-01-25'
      }
    ]
  }
]

// Mock Receipts Data
export const mockReceipts: Receipt[] = [
  {
    id: 'receipt-001',
    receiptNumber: 'REC-2024-001',
    clientId: 'client-001',
    clientName: 'Mohammed Al-Rashid',
    items: [
      {
        id: 'item-001',
        description: 'Foundation Construction - Phase 1',
        quantity: 1,
        unitPrice: 3500000,
        total: 3500000,
        category: 'Construction'
      }
    ],
    subtotal: 3500000,
    tax: 525000, // 15% VAT
    discount: 0,
    total: 4025000,
    amountPaid: 4025000,
    balance: 0,
    issueDate: '2024-01-30',
    paymentStatus: 'PAID',
    paymentMethod: 'Bank Transfer',
    notes: 'Thank you for your business',
    language: 'EN'
  },
  {
    id: 'receipt-002',
    receiptNumber: 'REC-2024-002',
    clientId: 'client-002',
    clientName: 'Norah Al-Mansouri',
    items: [
      {
        id: 'item-002',
        description: 'Structural Work - Marina Residences',
        quantity: 1,
        unitPrice: 2200000,
        total: 2200000,
        category: 'Construction'
      }
    ],
    subtotal: 2200000,
    tax: 330000,
    discount: 100000, // Early payment discount
    total: 2430000,
    amountPaid: 1800000,
    balance: 630000,
    issueDate: '2024-02-15',
    dueDate: '2024-03-15',
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Bank Transfer',
    notes: 'Remaining balance due by March 15th',
    language: 'AR'
  }
]

// Data Service Class
export class MockDataService {
  // Company Information
  static getCompanyInfo(): CompanyInfo {
    return companyInfo
  }

  // Sites
  static getSites(): Site[] {
    return mockSites
  }

  static getSiteById(id: string): Site | undefined {
    return mockSites.find(site => site.id === id)
  }

  static getSitesByStatus(status: Site['status']): Site[] {
    return mockSites.filter(site => site.status === status)
  }

  // Employees
  static getEmployees(): Employee[] {
    return mockEmployees
  }

  static getEmployeeById(id: string): Employee | undefined {
    return mockEmployees.find(emp => emp.id === id)
  }

  static getEmployeesBySite(siteId: string): Employee[] {
    return mockEmployees.filter(emp => emp.siteId === siteId)
  }

  static getEmployeesByStatus(status: Employee['status']): Employee[] {
    return mockEmployees.filter(emp => emp.status === status)
  }

  // Payroll
  static getPayrollRecords(): PayrollRecord[] {
    return mockPayrollRecords
  }

  static getPayrollByEmployee(employeeId: string): PayrollRecord[] {
    return mockPayrollRecords.filter(record => record.employeeId === employeeId)
  }

  static getPayrollByDateRange(start: string, end: string): PayrollRecord[] {
    return mockPayrollRecords.filter(record => {
      const payDate = new Date(record.payDate)
      return payDate >= new Date(start) && payDate <= new Date(end)
    })
  }

  // Expenses
  static getExpenses(): Expense[] {
    return mockExpenses
  }

  static getExpensesBySite(siteId: string): Expense[] {
    return mockExpenses.filter(expense => expense.siteId === siteId)
  }

  static getExpensesByCategory(category: string): Expense[] {
    return mockExpenses.filter(expense => expense.category === category)
  }

  static getExpensesByDateRange(start: string, end: string): Expense[] {
    return mockExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= new Date(start) && expenseDate <= new Date(end)
    })
  }

  // Revenues
  static getRevenues(): Revenue[] {
    return mockRevenues
  }

  static getRevenuesBySite(siteId: string): Revenue[] {
    return mockRevenues.filter(revenue => revenue.siteId === siteId)
  }

  static getRevenuesByClient(clientId: string): Revenue[] {
    return mockRevenues.filter(revenue => revenue.clientId === clientId)
  }

  static getRevenuesByDateRange(start: string, end: string): Revenue[] {
    return mockRevenues.filter(revenue => {
      const revenueDate = new Date(revenue.date)
      return revenueDate >= new Date(start) && revenueDate <= new Date(end)
    })
  }

  static getRevenuesByStatus(status: Revenue['paymentStatus']): Revenue[] {
    return mockRevenues.filter(revenue => revenue.paymentStatus === status)
  }

  // Clients
  static getClients(): Client[] {
    return mockClients
  }

  static getClientById(id: string): Client | undefined {
    return mockClients.find(client => client.id === id)
  }

  static getActiveClients(): Client[] {
    return mockClients.filter(client => client.status === 'ACTIVE')
  }

  // Safes
  static getSafes(): Safe[] {
    return mockSafes
  }

  static getSafeById(id: string): Safe | undefined {
    return mockSafes.find(safe => safe.id === id)
  }

  static getTotalBalance(): number {
    return mockSafes.reduce((total, safe) => total + safe.balance, 0)
  }

  // Receipts
  static getReceipts(): Receipt[] {
    return mockReceipts
  }

  static getReceiptById(id: string): Receipt | undefined {
    return mockReceipts.find(receipt => receipt.id === id)
  }

  static getReceiptsByClient(clientId: string): Receipt[] {
    return mockReceipts.filter(receipt => receipt.clientId === clientId)
  }

  // Financial Calculations
  static getFinancialSummary(dateRange?: { start: string; end: string }) {
    let expenses = mockExpenses
    let revenues = mockRevenues
    let payroll = mockPayrollRecords

    if (dateRange) {
      expenses = this.getExpensesByDateRange(dateRange.start, dateRange.end)
      revenues = this.getRevenuesByDateRange(dateRange.start, dateRange.end)
      payroll = this.getPayrollByDateRange(dateRange.start, dateRange.end)
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalRevenues = revenues.reduce((sum, rev) => sum + rev.amount, 0)
    const totalPayroll = payroll.reduce((sum, pay) => sum + pay.netPay, 0)
    const netProfit = totalRevenues - totalExpenses - totalPayroll

    return {
      totalRevenues,
      totalExpenses,
      totalPayroll,
      netProfit,
      profitMargin: totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0
    }
  }

  static getSiteFinancialSummary(siteId: string) {
    const site = this.getSiteById(siteId)
    const employees = this.getEmployeesBySite(siteId)
    const expenses = this.getExpensesBySite(siteId)
    const revenues = this.getRevenuesBySite(siteId)
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalRevenues = revenues.reduce((sum, rev) => sum + rev.amount, 0)
    const employeeCount = employees.length
    const totalPayroll = employees.reduce((sum, emp) => sum + emp.salary, 0)

    return {
      site,
      employeeCount,
      totalExpenses,
      totalRevenues,
      totalPayroll,
      netProfit: totalRevenues - totalExpenses - totalPayroll,
      progress: site?.progress || 0,
      budget: site?.budget || 0,
      spent: site?.spent || totalExpenses
    }
  }
}
