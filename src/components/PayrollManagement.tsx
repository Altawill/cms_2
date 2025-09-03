import React, { useState } from 'react'
import { employeeStatementGenerator, EmployeeStatementData, StatementOptions } from '../services/employeeStatementGenerator'

interface Employee {
  id: string
  name: string
  position: string
  department: string
  baseSalary: number
  allowances: number
  deductions: number
  workingDays: number
  overtimeHours: number
  overtimeRate: number
}

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  position: string
  department: string
  period: string
  baseSalary: number
  allowances: number
  overtimePay: number
  grossSalary: number
  deductions: number
  netSalary: number
  status: 'PENDING' | 'PROCESSED' | 'PAID'
  processedDate?: string
  paidDate?: string
  workingDays: number
  overtimeHours: number
  createdBy: string
  createdAt: string
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    position: 'Project Manager',
    department: 'Construction',
    baseSalary: 2500,
    allowances: 300,
    deductions: 200,
    workingDays: 26,
    overtimeHours: 8,
    overtimeRate: 15
  },
  {
    id: '2',
    name: 'Fatima Ali',
    position: 'Site Engineer',
    department: 'Engineering',
    baseSalary: 2000,
    allowances: 250,
    deductions: 150,
    workingDays: 24,
    overtimeHours: 12,
    overtimeRate: 12
  },
  {
    id: '3',
    name: 'Omar Mahmoud',
    position: 'Supervisor',
    department: 'Operations',
    baseSalary: 1800,
    allowances: 200,
    deductions: 120,
    workingDays: 26,
    overtimeHours: 6,
    overtimeRate: 10
  },
  {
    id: '4',
    name: 'Amira Saleh',
    position: 'Accountant',
    department: 'Finance',
    baseSalary: 1600,
    allowances: 180,
    deductions: 100,
    workingDays: 22,
    overtimeHours: 4,
    overtimeRate: 10
  }
]

const mockPayrollRecords: PayrollRecord[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Ahmed Hassan',
    position: 'Project Manager',
    department: 'Construction',
    period: '2024-03',
    baseSalary: 2500,
    allowances: 300,
    overtimePay: 120,
    grossSalary: 2920,
    deductions: 200,
    netSalary: 2720,
    status: 'PAID',
    processedDate: '2024-03-28',
    paidDate: '2024-03-30',
    workingDays: 26,
    overtimeHours: 8,
    createdBy: 'HR System',
    createdAt: '2024-03-28T10:00:00Z'
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Fatima Ali',
    position: 'Site Engineer',
    department: 'Engineering',
    period: '2024-03',
    baseSalary: 2000,
    allowances: 250,
    overtimePay: 144,
    grossSalary: 2394,
    deductions: 150,
    netSalary: 2244,
    status: 'PROCESSED',
    processedDate: '2024-03-28',
    workingDays: 24,
    overtimeHours: 12,
    createdBy: 'HR System',
    createdAt: '2024-03-28T10:00:00Z'
  }
]

export function PayrollManagement() {
  const [activeTab, setActiveTab] = useState<'payroll' | 'employees'>('payroll')
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayrollRecords)
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [selectedPeriod, setSelectedPeriod] = useState('2024-03')
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState<PayrollRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPayroll = payrollRecords.filter(record => 
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalGrossSalary = payrollRecords.reduce((sum, record) => sum + record.grossSalary, 0)
  const totalNetSalary = payrollRecords.reduce((sum, record) => sum + record.netSalary, 0)
  const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.deductions, 0)
  const paidCount = payrollRecords.filter(r => r.status === 'PAID').length

  const processPayroll = () => {
    const newRecords = employees.map(emp => {
      const overtimePay = emp.overtimeHours * emp.overtimeRate
      const grossSalary = emp.baseSalary + emp.allowances + overtimePay
      const netSalary = grossSalary - emp.deductions

      return {
        id: Date.now() + Math.random().toString(),
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        department: emp.department,
        period: selectedPeriod,
        baseSalary: emp.baseSalary,
        allowances: emp.allowances,
        overtimePay,
        grossSalary,
        deductions: emp.deductions,
        netSalary,
        status: 'PROCESSED' as const,
        processedDate: new Date().toISOString().split('T')[0],
        workingDays: emp.workingDays,
        overtimeHours: emp.overtimeHours,
        createdBy: 'Current User',
        createdAt: new Date().toISOString()
      }
    })
    
    setPayrollRecords([...payrollRecords, ...newRecords])
    setShowProcessModal(false)
  }

  const markAsPaid = (recordId: string) => {
    setPayrollRecords(prev => prev.map(record =>
      record.id === recordId 
        ? { ...record, status: 'PAID' as const, paidDate: new Date().toISOString().split('T')[0] }
        : record
    ))
    setShowPayModal(null)
  }

  const [statementLanguage, setStatementLanguage] = useState<'EN' | 'AR'>('EN')
  const [showStatementOptions, setShowStatementOptions] = useState<PayrollRecord | null>(null)

  const generateStatement = async (record: PayrollRecord, customOptions?: Partial<StatementOptions>) => {
    const employee = employees.find(emp => emp.id === record.employeeId)
    if (!employee) {
      alert('Employee not found')
      return
    }

    const statementData: EmployeeStatementData = {
      employee: {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        employeeNumber: `EMP-${employee.id.padStart(4, '0')}`, // Enhanced employee number
        email: `${employee.name.toLowerCase().replace(/\s+/g, '.')}@almahmoud-construction.com`,
        phone: '+218-91-234-5678',
        joinDate: '2023-01-15'
      },
      payrollRecord: {
        id: record.id,
        period: record.period,
        baseSalary: record.baseSalary,
        allowances: record.allowances,
        overtimePay: record.overtimePay,
        grossSalary: record.grossSalary,
        deductions: record.deductions,
        netSalary: record.netSalary,
        status: record.status,
        processedDate: record.processedDate,
        paidDate: record.paidDate,
        workingDays: record.workingDays,
        overtimeHours: record.overtimeHours
      },
      companyInfo: {
        name: 'Al-Mahmoud Construction Company',
        address: 'Tripoli Industrial Zone, Building 15, Tripoli, Libya',
        phone: '+218-21-123-4567',
        email: 'info@almahmoud-construction.com',
        website: 'www.almahmoud-construction.com',
        taxNumber: 'TAX-123456789'
      },
      statementNumber: `ST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`,
      generatedBy: 'HR System'
    }

    const defaultOptions: StatementOptions = {
      language: statementLanguage,
      theme: 'light',
      includeLogo: true,
      includeSignature: true,
      includeTimestamp: true,
      includeQRCode: true,
      includeWatermark: true,
      colorScheme: 'corporate'
    }

    const finalOptions = { ...defaultOptions, ...customOptions }

    try {
      await employeeStatementGenerator.downloadEmployeeStatement(statementData, finalOptions)
      // Success notification
      setTimeout(() => {
        alert(`Statement generated successfully for ${employee.name} (${finalOptions.language === 'AR' ? 'Arabic' : 'English'})`)
      }, 500)
    } catch (error) {
      console.error('Error generating statement:', error)
      alert('Error generating statement. Please try again.')
    }
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'var(--bg-primary)', 
          borderRadius: '8px', 
          padding: '4px',
          boxShadow: 'var(--shadow-md)',
          width: 'fit-content'
        }}>
          {[
            { id: 'payroll', label: 'Payroll Records', icon: '💵' },
            { id: 'employees', label: 'Employee Rates', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'payroll' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <SummaryCard
              title="Total Gross Salary"
              value={`${totalGrossSalary.toLocaleString()} LYD`}
              icon="💰"
              color="#10b981"
            />
            <SummaryCard
              title="Total Net Salary"
              value={`${totalNetSalary.toLocaleString()} LYD`}
              icon="💵"
              color="#3b82f6"
            />
            <SummaryCard
              title="Total Deductions"
              value={`${totalDeductions.toLocaleString()} LYD`}
              icon="📉"
              color="#ef4444"
            />
            <SummaryCard
              title="Employees Paid"
              value={`${paidCount} / ${payrollRecords.length}`}
              icon="✅"
              color="#f59e0b"
            />
          </div>

          {/* Controls */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '20px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Payroll Management</h3>
              <button
                onClick={() => setShowProcessModal(true)}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + Process Payroll
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by employee name, position, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '140px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="2024-03">March 2024</option>
                <option value="2024-02">February 2024</option>
                <option value="2024-01">January 2024</option>
              </select>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {filteredPayroll.length} records
              </div>
            </div>
          </div>

          {/* Payroll Records */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPayroll.map(record => (
              <PayrollCard
                key={record.id}
                record={record}
                onMarkPaid={() => setShowPayModal(record)}
                onGenerateStatement={(customOptions) => generateStatement(record, customOptions)}
              />
            ))}
          </div>

          {filteredPayroll.length === 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              padding: '60px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💵</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                No payroll records found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {searchTerm ? 'Try adjusting your search filters' : 'Process payroll to generate records'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'employees' && (
        <EmployeeRatesTab employees={employees} setEmployees={setEmployees} />
      )}

      {/* Modals */}
      {showProcessModal && (
        <ProcessPayrollModal
          period={selectedPeriod}
          employees={employees}
          onConfirm={processPayroll}
          onClose={() => setShowProcessModal(false)}
        />
      )}

      {showPayModal && (
        <PayConfirmModal
          record={showPayModal}
          onConfirm={() => markAsPaid(showPayModal.id)}
          onClose={() => setShowPayModal(null)}
        />
      )}
    </div>
  )
}

function SummaryCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{title}</div>
      </div>
    </div>
  )
}

function PayrollCard({ record, onMarkPaid, onGenerateStatement }: {
  record: PayrollRecord
  onMarkPaid: () => void
  onGenerateStatement: (customOptions?: Partial<StatementOptions>) => void
}) {
  const statusColors = {
    PENDING: '#f59e0b',
    PROCESSED: '#3b82f6',
    PAID: '#10b981'
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-md)',
      padding: '20px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-1px)'
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
              {record.employeeName}
            </h4>
            <span style={{
              backgroundColor: statusColors[record.status] + '20',
              color: statusColors[record.status],
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {record.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {record.position} • {record.department} • {record.period}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: statusColors[record.status] }}>
            {record.netSalary.toLocaleString()} LYD
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Net Salary
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base Salary</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{record.baseSalary.toLocaleString()} LYD</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allowances</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>+{record.allowances.toLocaleString()} LYD</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overtime</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>+{record.overtimePay.toLocaleString()} LYD</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Deductions</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>-{record.deductions.toLocaleString()} LYD</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Working Days: {record.workingDays} • Overtime: {record.overtimeHours}h
          {record.processedDate && ` • Processed: ${new Date(record.processedDate).toLocaleDateString()}`}
          {record.paidDate && ` • Paid: ${new Date(record.paidDate).toLocaleDateString()}`}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {record.status === 'PROCESSED' && (
            <button
              onClick={onMarkPaid}
              style={{
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Mark as Paid
            </button>
          )}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={onGenerateStatement}
              style={{
                padding: '6px 12px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📄 Generate Statement (EN)
            </button>
            <button
              onClick={() => onGenerateStatement({ language: 'AR' })}
              style={{
                padding: '6px 12px',
                backgroundColor: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📄 Generate (عربي)
            </button>
          </div>
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

function EmployeeRatesTab({ employees, setEmployees }: {
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
}) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  return (
    <div>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '20px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>
          Employee Salary Configuration
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Employee</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Base Salary</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Allowances</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Deductions</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Overtime Rate</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{employee.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{employee.position} • {employee.department}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {employee.baseSalary.toLocaleString()} LYD
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#10b981' }}>
                    {employee.allowances.toLocaleString()} LYD
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#ef4444' }}>
                    {employee.deductions.toLocaleString()} LYD
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {employee.overtimeRate} LYD/hr
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => setEditingEmployee(employee)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingEmployee && (
        <EmployeeEditModal
          employee={editingEmployee}
          onSave={(updatedEmployee) => {
            setEmployees(employees.map(emp => 
              emp.id === updatedEmployee.id ? updatedEmployee : emp
            ))
            setEditingEmployee(null)
          }}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </div>
  )
}

function ProcessPayrollModal({ period, employees, onConfirm, onClose }: {
  period: string
  employees: Employee[]
  onConfirm: () => void
  onClose: () => void
}) {
  const totalCost = employees.reduce((sum, emp) => {
    const overtimePay = emp.overtimeHours * emp.overtimeRate
    const grossSalary = emp.baseSalary + emp.allowances + overtimePay
    return sum + (grossSalary - emp.deductions)
  }, 0)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-lg)',
        padding: '24px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💵</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Process Payroll for {period}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            This will generate payroll records for {employees.length} employees
          </p>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Total Cost: {totalCost.toLocaleString()} LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Net salary payments for all employees
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Process Payroll
          </button>
        </div>
      </div>
    </div>
  )
}

function PayConfirmModal({ record, onConfirm, onClose }: {
  record: PayrollRecord
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-lg)',
        padding: '24px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Confirm Payment
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Mark salary as paid for <strong>{record.employeeName}</strong>
          </p>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
              {record.netSalary.toLocaleString()} LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Net salary for {record.period}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}

function EmployeeEditModal({ employee, onSave, onClose }: {
  employee: Employee
  onSave: (employee: Employee) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState(employee)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
            Edit Employee Salary
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Employee Name
              </label>
              <input
                type="text"
                value={formData.name}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Base Salary (LYD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Allowances (LYD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Deductions (LYD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Overtime Rate (LYD/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.overtimeRate}
                  onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Working Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={formData.workingDays}
                  onChange={(e) => setFormData({ ...formData, workingDays: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Overtime Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
