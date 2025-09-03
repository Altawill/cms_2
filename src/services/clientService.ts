import { Client, ClientTransaction, ClientSummary, CompanyInfo } from '../types/client'

class ClientService {
  private clients: Client[] = [
    {
      id: '1',
      name: 'Ahmed Al-Mahmoud',
      email: 'ahmed.mahmoud@email.com',
      phone: '+971-50-123-4567',
      companyName: 'Al-Mahmoud Construction LLC',
      address: '123 Business District, Dubai, UAE',
      taxNumber: 'TAX-AE-001',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-08-20'),
      isActive: true,
      notes: 'High-value client, prompt payments'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1-555-0123',
      companyName: 'TechCorp Industries',
      address: '456 Tech Avenue, New York, NY 10001, USA',
      taxNumber: 'TAX-US-002',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-08-25'),
      isActive: true,
      notes: 'Corporate client, requires detailed invoicing'
    },
    {
      id: '3',
      name: 'Mohammed Al-Rashid',
      email: 'm.rashid@projects.ae',
      phone: '+971-55-987-6543',
      companyName: 'Al-Rashid Development',
      address: '789 Sheikh Zayed Road, Abu Dhabi, UAE',
      taxNumber: 'TAX-AE-003',
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-08-28'),
      isActive: true,
      notes: 'Government contracts, extended payment terms'
    }
  ]

  private transactions: ClientTransaction[] = [
    {
      id: '1',
      clientId: '1',
      date: new Date('2024-08-01'),
      orderNumber: 'ORD-2024-001',
      description: 'Site Alpha Construction Phase 1',
      site: 'Site Alpha',
      totalAmount: 250000,
      paidAmount: 200000,
      remainingBalance: 50000,
      status: 'partial',
      paymentMethod: 'bank_transfer',
      dueDate: new Date('2024-09-15'),
      createdAt: new Date('2024-08-01'),
      updatedAt: new Date('2024-08-25'),
      notes: 'First phase completed successfully'
    },
    {
      id: '2',
      clientId: '1',
      date: new Date('2024-07-15'),
      orderNumber: 'ORD-2024-002',
      description: 'Equipment Rental - July',
      site: 'Site Alpha',
      totalAmount: 45000,
      paidAmount: 45000,
      remainingBalance: 0,
      status: 'paid',
      paymentMethod: 'card',
      dueDate: new Date('2024-08-15'),
      createdAt: new Date('2024-07-15'),
      updatedAt: new Date('2024-08-15'),
      notes: 'Monthly equipment rental'
    },
    {
      id: '3',
      clientId: '2',
      date: new Date('2024-08-10'),
      orderNumber: 'ORD-2024-003',
      description: 'Office Building Foundation Work',
      site: 'Site Beta',
      totalAmount: 180000,
      paidAmount: 90000,
      remainingBalance: 90000,
      status: 'partial',
      paymentMethod: 'bank_transfer',
      dueDate: new Date('2024-09-30'),
      createdAt: new Date('2024-08-10'),
      updatedAt: new Date('2024-08-20'),
      notes: '50% advance payment received'
    },
    {
      id: '4',
      clientId: '3',
      date: new Date('2024-06-20'),
      orderNumber: 'ORD-2024-004',
      description: 'Infrastructure Development Phase 2',
      site: 'Site Gamma',
      totalAmount: 320000,
      paidAmount: 160000,
      remainingBalance: 160000,
      status: 'overdue',
      paymentMethod: 'check',
      dueDate: new Date('2024-08-20'),
      createdAt: new Date('2024-06-20'),
      updatedAt: new Date('2024-08-20'),
      notes: 'Payment overdue - follow up required'
    },
    {
      id: '5',
      clientId: '2',
      date: new Date('2024-08-25'),
      orderNumber: 'ORD-2024-005',
      description: 'Material Supply - Steel & Concrete',
      site: 'Site Beta',
      totalAmount: 75000,
      paidAmount: 0,
      remainingBalance: 75000,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      dueDate: new Date('2024-09-25'),
      createdAt: new Date('2024-08-25'),
      updatedAt: new Date('2024-08-25'),
      notes: 'Materials delivered, awaiting payment'
    }
  ]

  private companyInfo: CompanyInfo = {
    name: 'Construction Management Systems',
    logo: '🏗️',
    address: {
      street: '123 Business Center',
      city: 'Dubai',
      state: 'Dubai',
      zipCode: '12345',
      country: 'UAE'
    },
    contact: {
      phone: '+971-4-123-4567',
      email: 'info@constructionmgmt.com',
      website: 'www.constructionmgmt.com'
    },
    taxNumber: 'TAX123456789',
    registrationNumber: 'REG987654321'
  }

  // Client operations
  async getAllClients(): Promise<Client[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.clients]), 100)
    })
  }

  async getClientById(id: string): Promise<Client | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const client = this.clients.find(c => c.id === id)
        resolve(client || null)
      }, 50)
    })
  }

  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newClient: Client = {
          ...clientData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.clients.push(newClient)
        resolve(newClient)
      }, 200)
    })
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const index = this.clients.findIndex(c => c.id === id)
        if (index === -1) {
          resolve(null)
          return
        }
        
        this.clients[index] = {
          ...this.clients[index],
          ...updates,
          updatedAt: new Date()
        }
        resolve(this.clients[index])
      }, 150)
    })
  }

  // Transaction operations
  async getClientTransactions(clientId: string): Promise<ClientTransaction[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const clientTransactions = this.transactions.filter(t => t.clientId === clientId)
        resolve([...clientTransactions])
      }, 100)
    })
  }

  async getAllTransactions(): Promise<ClientTransaction[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.transactions]), 100)
    })
  }

  async createTransaction(transactionData: Omit<ClientTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientTransaction> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newTransaction: ClientTransaction = {
          ...transactionData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.transactions.push(newTransaction)
        resolve(newTransaction)
      }, 200)
    })
  }

  async updateTransaction(id: string, updates: Partial<ClientTransaction>): Promise<ClientTransaction | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const index = this.transactions.findIndex(t => t.id === id)
        if (index === -1) {
          resolve(null)
          return
        }
        
        this.transactions[index] = {
          ...this.transactions[index],
          ...updates,
          updatedAt: new Date()
        }
        resolve(this.transactions[index])
      }, 150)
    })
  }

  async addTransaction(clientId: string, transactionData: Omit<ClientTransaction, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>): Promise<ClientTransaction> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newTransaction: ClientTransaction = {
          ...transactionData,
          id: Date.now().toString(),
          clientId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.transactions.push(newTransaction)
        resolve(newTransaction)
      }, 200)
    })
  }

  // Report calculations
  async calculateClientSummary(clientId: string): Promise<ClientSummary> {
    const transactions = await this.getClientTransactions(clientId)
    
    const totalOrders = transactions.length
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0)
    const totalRemaining = transactions.reduce((sum, t) => sum + t.remainingBalance, 0)
    
    const overdueTransactions = transactions.filter(t => 
      t.status === 'overdue' || 
      (t.dueDate && new Date(t.dueDate) < new Date() && t.remainingBalance > 0)
    )
    const overdueAmount = overdueTransactions.reduce((sum, t) => sum + t.remainingBalance, 0)
    
    const lastTransactionDate = transactions.length > 0 
      ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
      : undefined
    
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0

    return {
      totalOrders,
      totalAmount,
      totalPaid,
      totalRemaining,
      overdueAmount,
      lastTransactionDate,
      averageOrderValue
    }
  }

  // Company info
  getCompanyInfo(): CompanyInfo {
    return { ...this.companyInfo }
  }

  updateCompanyInfo(updates: Partial<CompanyInfo>): void {
    this.companyInfo = { ...this.companyInfo, ...updates }
  }

  // Utility methods
  generateReportNumber(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getTime()).slice(-4)
    return `RPT-${year}${month}${day}-${time}`
  }

  formatCurrency(amount: number, language: 'EN' | 'AR' = 'EN'): string {
    const formatted = new Intl.NumberFormat('en-US').format(amount)
    return language === 'AR' ? `${formatted} د.إ` : `$${formatted}`
  }

  getStatusColor(status: ClientTransaction['status']): string {
    switch (status) {
      case 'paid': return '#10b981'
      case 'partial': return '#f59e0b'
      case 'pending': return '#3b82f6'
      case 'overdue': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // Search and filter
  async searchClients(query: string): Promise<Client[]> {
    const allClients = await this.getAllClients()
    const lowercaseQuery = query.toLowerCase()
    
    return allClients.filter(client =>
      client.name.toLowerCase().includes(lowercaseQuery) ||
      client.email.toLowerCase().includes(lowercaseQuery) ||
      client.companyName?.toLowerCase().includes(lowercaseQuery) ||
      client.phone.includes(query)
    )
  }

  async getOverdueClients(): Promise<Client[]> {
    const allClients = await this.getAllClients()
    const overdueClientIds = new Set<string>()
    
    for (const transaction of this.transactions) {
      if (transaction.status === 'overdue' || 
          (transaction.dueDate && new Date(transaction.dueDate) < new Date() && transaction.remainingBalance > 0)) {
        overdueClientIds.add(transaction.clientId)
      }
    }
    
    return allClients.filter(client => overdueClientIds.has(client.id))
  }
}

export const clientService = new ClientService()
export default clientService
