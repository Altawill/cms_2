import React, { useState } from 'react'
import { useActionButtons, useScopedQueryParams } from '../hooks/useOrgScoped'
import { ScopeChip } from './ScopeChip'

interface Expense {
  id: string
  title: string
  category: string
  amount: number
  currency: string
  date: string
  description: string
  submittedBy: string
  approvedBy?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  receipt?: string
  siteId?: string
  siteName?: string
  createdAt: string
  updatedAt: string
  orgUnitId: string // Added for org scoping
}

const categories = [
  'Materials & Supplies',
  'Equipment Rental',
  'Labor Costs',
  'Transportation',
  'Utilities',
  'Office Expenses',
  'Marketing',
  'Professional Services',
  'Insurance',
  'Maintenance',
  'Other'
]

const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Construction Materials',
    category: 'Materials & Supplies',
    amount: 15000,
    currency: 'LYD',
    date: '2024-03-15',
    description: 'Cement, steel bars, and concrete for foundation work',
    submittedBy: 'John Smith',
    approvedBy: 'Ahmed Hassan',
    status: 'APPROVED',
    siteId: '1',
    siteName: 'Alpha Construction Site',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2024-03-15T10:30:00Z',
    orgUnitId: 'ou-libya-ops'
  },
  {
    id: '2',
    title: 'Equipment Rental - Excavator',
    category: 'Equipment Rental',
    amount: 2500,
    currency: 'LYD',
    date: '2024-03-14',
    description: 'Weekly rental for CAT excavator model 320D',
    submittedBy: 'Sarah Johnson',
    status: 'PENDING',
    siteId: '2',
    siteName: 'Beta Development Site',
    createdAt: '2024-03-14T14:20:00Z',
    updatedAt: '2024-03-14T14:20:00Z',
    orgUnitId: 'ou-tripoli-central'
  },
  {
    id: '3',
    title: 'Office Supplies',
    category: 'Office Expenses',
    amount: 350,
    currency: 'LYD',
    date: '2024-03-13',
    description: 'Stationery, printer cartridges, and paper',
    submittedBy: 'Lisa Wilson',
    approvedBy: 'Ahmed Hassan',
    status: 'PAID',
    createdAt: '2024-03-13T11:15:00Z',
    updatedAt: '2024-03-13T16:45:00Z',
    orgUnitId: 'ou-finance-dept'
  },
  {
    id: '4',
    title: 'Vehicle Fuel',
    category: 'Transportation',
    amount: 800,
    currency: 'LYD',
    date: '2024-03-12',
    description: 'Fuel for company vehicles and site equipment',
    submittedBy: 'Mike Davis',
    status: 'REJECTED',
    siteId: '1',
    siteName: 'Alpha Construction Site',
    createdAt: '2024-03-12T08:30:00Z',
    updatedAt: '2024-03-12T17:00:00Z',
    orgUnitId: 'ou-libya-ops'
  }
]

export function ExpensesManagement() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState<string | null>(null)

  // Org scope integration
  const { canCreate, canUpdate, canDelete, createTooltip, updateTooltip, deleteTooltip } = useActionButtons('expenses')
  const scopedParams = useScopedQueryParams()

  const filteredExpenses = expenses.filter(expense => {
    // Apply org scope filtering
    if (scopedParams.orgUnitIds && scopedParams.orgUnitIds.length > 0) {
      if (!scopedParams.orgUnitIds.includes(expense.orgUnitId)) {
        return false
      }
    }
    
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || expense.category === filterCategory
    const matchesStatus = !filterStatus || expense.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalExpenses = expenses.reduce((sum, expense) => 
    expense.status !== 'REJECTED' ? sum + expense.amount : sum, 0
  )
  const pendingApproval = expenses.filter(e => e.status === 'PENDING').length
  const thisMonthExpenses = expenses.filter(e => 
    new Date(e.date).getMonth() === new Date().getMonth()
  ).reduce((sum, expense) => sum + expense.amount, 0)

  const handleAddExpense = () => {
    setEditingExpense(null)
    setShowModal(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowModal(true)
  }

  const handleDeleteExpense = (id: string) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setExpenses(prev => prev.filter(exp => exp.id !== showDeleteConfirm))
      setShowDeleteConfirm(null)
    }
  }

  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(exp => 
        exp.id === editingExpense.id 
          ? { ...expenseData, id: editingExpense.id, createdAt: editingExpense.createdAt, updatedAt: new Date().toISOString() }
          : exp
      ))
    } else {
      const newExpense: Expense = {
        ...expenseData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orgUnitId: scopedParams.currentOrgUnit || 'ou-libya-ops' // Use current org scope or default
      }
      setExpenses(prev => [...prev, newExpense])
    }
    setShowModal(false)
  }

  const handleStatusChange = (expenseId: string, newStatus: Expense['status']) => {
    setExpenses(prev => prev.map(exp =>
      exp.id === expenseId 
        ? { ...exp, status: newStatus, updatedAt: new Date().toISOString() }
        : exp
    ))
  }

  const handleMarkPaidClick = (expenseId: string) => {
    setShowMarkPaidConfirm(expenseId)
  }

  const confirmMarkPaid = () => {
    if (showMarkPaidConfirm) {
      handleStatusChange(showMarkPaidConfirm, 'PAID')
      setShowMarkPaidConfirm(null)
    }
  }

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <SummaryCard
          title="Total Expenses"
          value={`${totalExpenses.toLocaleString()} LYD`}
          icon="💸"
          color="#ef4444"
        />
        <SummaryCard
          title="Pending Approval"
          value={pendingApproval.toString()}
          icon="⏳"
          color="#f59e0b"
        />
        <SummaryCard
          title="This Month"
          value={`${thisMonthExpenses.toLocaleString()} LYD`}
          icon="📅"
          color="#3b82f6"
        />
        <SummaryCard
          title="Categories"
          value={new Set(expenses.map(e => e.category)).size.toString()}
          icon="📁"
          color="#8b5cf6"
        />
      </div>

      {/* Header and Filters */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '20px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Expense Management</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Track and manage all project expenses
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {scopedParams.currentOrgUnit && <ScopeChip orgUnitId={scopedParams.currentOrgUnit} />}
            {canCreate ? (
              <button
                onClick={handleAddExpense}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                title={createTooltip}
              >
                + Add Expense
              </button>
            ) : (
              <button
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
                disabled
                title={createTooltip}
              >
                + Add Expense
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search expenses..."
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '130px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAID">Paid</option>
          </select>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {filteredExpenses.length} of {expenses.length} expenses
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredExpenses.map(expense => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={() => handleEditExpense(expense)}
            onDelete={() => handleDeleteExpense(expense.id)}
            onStatusChange={(status) => handleStatusChange(expense.id, status)}
            onMarkPaidClick={() => handleMarkPaidClick(expense.id)}
          />
        ))}
      </div>

      {filteredExpenses.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💸</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            No expenses found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {searchTerm || filterCategory || filterStatus 
              ? 'Try adjusting your search filters'
              : 'Get started by adding your first expense'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ExpenseModal
          expense={editingExpense}
          onSave={handleSaveExpense}
          onClose={() => setShowModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          expenseTitle={expenses.find(e => e.id === showDeleteConfirm)?.title || ''}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {showMarkPaidConfirm && (
        <MarkPaidConfirmModal
          expense={expenses.find(e => e.id === showMarkPaidConfirm)}
          onConfirm={confirmMarkPaid}
          onCancel={() => setShowMarkPaidConfirm(null)}
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

function ExpenseCard({ expense, onEdit, onDelete, onStatusChange, onMarkPaidClick }: {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Expense['status']) => void
  onMarkPaidClick: () => void
}) {
  const { canUpdate, canDelete: canDeleteExpense, updateTooltip, deleteTooltip } = useActionButtons('expenses')
  
  const statusColors = {
    PENDING: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
    PAID: '#3b82f6'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
              {expense.title}
            </h4>
            <span style={{
              backgroundColor: statusColors[expense.status] + '20',
              color: statusColors[expense.status],
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {expense.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {expense.category} • {new Date(expense.date).toLocaleDateString()}
            {expense.siteName && ` • ${expense.siteName}`}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: statusColors[expense.status] }}>
          {expense.amount.toLocaleString()} {expense.currency}
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
        {expense.description}
      </p>

      {/* Org Unit Indicator */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <ScopeChip orgUnitId={expense.orgUnitId} size="sm" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Submitted by {expense.submittedBy}
          {expense.approvedBy && ` • Approved by ${expense.approvedBy}`}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {expense.status === 'PENDING' && canUpdate && (
            <>
              <button
                onClick={() => onStatusChange('APPROVED')}
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
                Approve
              </button>
              <button
                onClick={() => onStatusChange('REJECTED')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Reject
              </button>
            </>
          )}
          {expense.status === 'APPROVED' && canUpdate && (
            <button
              onClick={onMarkPaidClick}
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
              Mark Paid
            </button>
          )}
          {canUpdate ? (
            <button
              onClick={onEdit}
              style={{
                padding: '6px 12px',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title={updateTooltip}
            >
              Edit
            </button>
          ) : (
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                opacity: 0.5,
                cursor: 'not-allowed'
              }}
              disabled
              title={updateTooltip}
            >
              Edit
            </button>
          )}
          {canDeleteExpense ? (
            <button
              onClick={onDelete}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title={deleteTooltip}
            >
              Delete
            </button>
          ) : (
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                opacity: 0.5,
                cursor: 'not-allowed'
              }}
              disabled
              title={deleteTooltip}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ExpenseModal({ expense, onSave, onClose }: {
  expense: Expense | null
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}) {
  const scopedParams = useScopedQueryParams()
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    category: expense?.category || '',
    amount: expense?.amount || 0,
    currency: expense?.currency || 'LYD',
    date: expense?.date || new Date().toISOString().split('T')[0],
    description: expense?.description || '',
    submittedBy: expense?.submittedBy || 'Current User',
    status: expense?.status || 'PENDING' as const,
    siteId: expense?.siteId || '',
    siteName: expense?.siteName || '',
    orgUnitId: expense?.orgUnitId || scopedParams.currentOrgUnit || 'ou-libya-ops'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.category && formData.amount > 0) {
      onSave({
        ...formData,
        orgUnitId: formData.orgUnitId
      })
    }
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
            {expense ? 'Edit Expense' : 'Add New Expense'}
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
                Expense Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
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

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Describe the expense..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Site (Optional)
              </label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="Associated site name"
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
              {expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ expenseTitle, onConfirm, onCancel }: {
  expenseTitle: string
  onConfirm: () => void
  onCancel: () => void
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Delete Expense
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Are you sure you want to delete "<strong>{expenseTitle}</strong>"? This action cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
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
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Delete Expense
          </button>
        </div>
      </div>
    </div>
  )
}

function MarkPaidConfirmModal({ expense, onConfirm, onCancel }: {
  expense: Expense | undefined
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!expense) return null

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
        maxWidth: '450px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Mark Expense as Paid
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Are you sure you want to mark "<strong>{expense.title}</strong>" as paid?
          </p>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            padding: '12px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Expense Details:</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
              {expense.category} • {new Date(expense.date).toLocaleDateString()}
              {expense.siteName && ` • ${expense.siteName}`}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
              {expense.amount.toLocaleString()} {expense.currency}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
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
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Mark as Paid
          </button>
        </div>
      </div>
    </div>
  )
}
