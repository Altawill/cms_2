export interface Client {
  id: string
  name: string
  email: string
  phone: string
  companyName?: string
  address?: string
  taxNumber?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  notes?: string
}

export interface ClientTransaction {
  id: string
  clientId: string
  date: Date
  orderNumber: string
  description: string
  site?: string
  totalAmount: number
  paidAmount: number
  remainingBalance: number
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check'
  dueDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ClientReport {
  id: string
  clientId: string
  reportType: 'invoice' | 'statement' | 'summary'
  generatedAt: Date
  reportData: {
    client: Client
    transactions: ClientTransaction[]
    summary: ClientSummary
    reportNumber: string
    generatedBy: string
  }
  language: 'EN' | 'AR'
}

export interface ClientSummary {
  totalOrders: number
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  overdueAmount: number
  lastTransactionDate?: Date
  averageOrderValue: number
}

export interface ReportTemplate {
  id: string
  name: string
  type: 'invoice' | 'statement' | 'summary'
  template: string
  isDefault: boolean
}

export interface ExportOptions {
  format: 'pdf' | 'excel'
  includeCompanyLogo: boolean
  includeSignature: boolean
  theme: 'light' | 'dark'
  language: 'EN' | 'AR'
  customFooter?: string
}

export interface CompanyInfo {
  name: string
  logo?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  taxNumber?: string
  registrationNumber?: string
}
