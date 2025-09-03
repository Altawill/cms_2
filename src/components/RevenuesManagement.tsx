import React, { useState } from 'react'

interface Revenue {
  id: string
  invoiceNumber: string
  clientName: string
  projectName: string
  amount: number
  currency: string
  invoiceDate: string
  dueDate: string
  paidDate?: string
  status: 'DRAFT' | 'SENT' | 'OVERDUE' | 'PAID' | 'CANCELLED'
  description: string
  siteId?: string
  siteName?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

const mockRevenues: Revenue[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'Al-Majd Construction Co.',
    projectName: 'Office Building Project',
    amount: 85000,
    currency: 'LYD',
    invoiceDate: '2024-03-01',
    dueDate: '2024-03-31',
    paidDate: '2024-03-15',
    status: 'PAID',
    description: 'Foundation and structural work completion - Phase 1',
    siteId: '1',
    siteName: 'Alpha Construction Site',
    createdBy: 'Ahmed Hassan',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    clientName: 'Green Valley Developers',
    projectName: 'Residential Complex',
    amount: 120000,
    currency: 'LYD',
    invoiceDate: '2024-03-10',
    dueDate: '2024-04-10',
    status: 'SENT',
    description: 'Infrastructure development and utilities installation',
    siteId: '2',
    siteName: 'Beta Development Site',
    createdBy: 'Ahmed Hassan',
    createdAt: '2024-03-10T10:15:00Z',
    updatedAt: '2024-03-10T10:15:00Z'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    clientName: 'Libya National Bank',
    projectName: 'Branch Renovation',
    amount: 45000,
    currency: 'LYD',
    invoiceDate: '2024-02-15',
    dueDate: '2024-03-15',
    status: 'OVERDUE',
    description: 'Interior renovation and security system installation',
    createdBy: 'Ahmed Hassan',
    createdAt: '2024-02-15T11:20:00Z',
    updatedAt: '2024-02-15T11:20:00Z'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    clientName: 'Mediterranean Hotels',
    projectName: 'Hotel Extension',
    amount: 200000,
    currency: 'LYD',
    invoiceDate: '2024-03-20',
    dueDate: '2024-04-20',
    status: 'DRAFT',
    description: 'Hotel extension and swimming pool construction',
    siteId: '3',
    siteName: 'Gamma Infrastructure',
    createdBy: 'Ahmed Hassan',
    createdAt: '2024-03-20T08:45:00Z',
    updatedAt: '2024-03-20T08:45:00Z'
  }
]

export function RevenuesManagement() {
  const [revenues, setRevenues] = useState<Revenue[]>(mockRevenues)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState<string | null>(null)

  const filteredRevenues = revenues.filter(revenue => {
    const matchesSearch = revenue.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || revenue.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalRevenue = revenues.reduce((sum, rev) => 
    rev.status === 'PAID' ? sum + rev.amount : sum, 0
  )
  const pendingRevenue = revenues.reduce((sum, rev) => 
    rev.status === 'SENT' || rev.status === 'OVERDUE' ? sum + rev.amount : sum, 0
  )
  const overdueCount = revenues.filter(r => r.status === 'OVERDUE').length
  const thisMonthRevenue = revenues.filter(r => 
    new Date(r.invoiceDate).getMonth() === new Date().getMonth() && r.status === 'PAID'
  ).reduce((sum, rev) => sum + rev.amount, 0)

  const handleAddRevenue = () => {
    setEditingRevenue(null)
    setShowModal(true)
  }

  const handleEditRevenue = (revenue: Revenue) => {
    setEditingRevenue(revenue)
    setShowModal(true)
  }

  const handleDeleteRevenue = (id: string) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setRevenues(prev => prev.filter(rev => rev.id !== showDeleteConfirm))
      setShowDeleteConfirm(null)
    }
  }

  const handleSaveRevenue = (revenueData: Omit<Revenue, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRevenue) {
      setRevenues(prev => prev.map(rev => 
        rev.id === editingRevenue.id 
          ? { ...revenueData, id: editingRevenue.id, createdAt: editingRevenue.createdAt, updatedAt: new Date().toISOString() }
          : rev
      ))
    } else {
      const newRevenue: Revenue = {
        ...revenueData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setRevenues(prev => [...prev, newRevenue])
    }
    setShowModal(false)
  }

  const handleStatusChange = (revenueId: string, newStatus: Revenue['status']) => {
    setRevenues(prev => prev.map(rev =>
      rev.id === revenueId 
        ? { 
            ...rev, 
            status: newStatus, 
            updatedAt: new Date().toISOString(),
            ...(newStatus === 'PAID' && !rev.paidDate && { paidDate: new Date().toISOString().split('T')[0] })
          }
        : rev
    ))
  }

  const handleMarkPaidClick = (revenueId: string) => {
    setShowMarkPaidConfirm(revenueId)
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
          title="Total Revenue"
          value={`${totalRevenue.toLocaleString()} LYD`}
          icon="💹"
          color="#10b981"
        />
        <SummaryCard
          title="Pending Payments"
          value={`${pendingRevenue.toLocaleString()} LYD`}
          icon="⏳"
          color="#f59e0b"
        />
        <SummaryCard
          title="This Month"
          value={`${thisMonthRevenue.toLocaleString()} LYD`}
          icon="📅"
          color="#3b82f6"
        />
        <SummaryCard
          title="Overdue Invoices"
          value={overdueCount.toString()}
          icon="⚠️"
          color="#ef4444"
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
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Revenue Management</h3>
          <button
            onClick={handleAddRevenue}
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
            + Create Invoice
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by client, project, or invoice number..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '120px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {filteredRevenues.length} of {revenues.length} invoices
          </div>
        </div>
      </div>

      {/* Revenues List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRevenues.map(revenue => (
          <RevenueCard
            key={revenue.id}
            revenue={revenue}
            onEdit={() => handleEditRevenue(revenue)}
            onDelete={() => handleDeleteRevenue(revenue.id)}
            onStatusChange={(status) => handleStatusChange(revenue.id, status)}
            onMarkPaidClick={() => handleMarkPaidClick(revenue.id)}
          />
        ))}
      </div>

      {filteredRevenues.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💹</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            No invoices found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {searchTerm || filterStatus 
              ? 'Try adjusting your search filters'
              : 'Get started by creating your first invoice'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <RevenueModal
          revenue={editingRevenue}
          onSave={handleSaveRevenue}
          onClose={() => setShowModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          invoiceNumber={revenues.find(r => r.id === showDeleteConfirm)?.invoiceNumber || ''}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {showMarkPaidConfirm && (
        <MarkPaidConfirmModal
          revenue={revenues.find(r => r.id === showMarkPaidConfirm)}
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

function RevenueCard({ revenue, onEdit, onDelete, onStatusChange, onMarkPaidClick }: {
  revenue: Revenue
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Revenue['status']) => void
  onMarkPaidClick: () => void
}) {
  const statusColors = {
    DRAFT: '#64748b',
    SENT: '#3b82f6',
    OVERDUE: '#ef4444',
    PAID: '#10b981',
    CANCELLED: '#6b7280'
  }

  const isOverdue = revenue.status === 'SENT' && new Date(revenue.dueDate) < new Date()

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
              {revenue.invoiceNumber}
            </h4>
            <span style={{
              backgroundColor: (isOverdue ? '#ef4444' : statusColors[revenue.status]) + '20',
              color: isOverdue ? '#ef4444' : statusColors[revenue.status],
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {isOverdue ? 'OVERDUE' : revenue.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {revenue.clientName} • {revenue.projectName}
            {revenue.siteName && ` • ${revenue.siteName}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: statusColors[revenue.status] }}>
            {revenue.amount.toLocaleString()} {revenue.currency}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Due: {new Date(revenue.dueDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
        {revenue.description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Invoice Date: {new Date(revenue.invoiceDate).toLocaleDateString()}
          {revenue.paidDate && ` • Paid: ${new Date(revenue.paidDate).toLocaleDateString()}`}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {revenue.status === 'DRAFT' && (
            <button
              onClick={() => onStatusChange('SENT')}
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
              Send Invoice
            </button>
          )}
          {(revenue.status === 'SENT' || revenue.status === 'OVERDUE') && (
            <button
              onClick={onMarkPaidClick}
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
              Mark Paid
            </button>
          )}
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
          >
            Edit
          </button>
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
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function RevenueModal({ revenue, onSave, onClose }: {
  revenue: Revenue | null
  onSave: (revenue: Omit<Revenue, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    invoiceNumber: revenue?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    clientName: revenue?.clientName || '',
    projectName: revenue?.projectName || '',
    amount: revenue?.amount || 0,
    currency: revenue?.currency || 'LYD',
    invoiceDate: revenue?.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: revenue?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidDate: revenue?.paidDate || '',
    status: revenue?.status || 'DRAFT' as const,
    description: revenue?.description || '',
    siteId: revenue?.siteId || '',
    siteName: revenue?.siteName || '',
    createdBy: revenue?.createdBy || 'Current User'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.clientName && formData.projectName && formData.amount > 0) {
      onSave(formData)
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
        maxWidth: '600px',
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
            {revenue ? 'Edit Invoice' : 'Create New Invoice'}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
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
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
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
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
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
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                placeholder="Describe the work or services provided..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Associated Site (Optional)
              </label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="Project site name"
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
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {revenue ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ invoiceNumber, onConfirm, onCancel }: {
  invoiceNumber: string
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
            Delete Invoice
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Are you sure you want to delete invoice <strong>{invoiceNumber}</strong>? This action cannot be undone.
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
            Delete Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

function MarkPaidConfirmModal({ revenue, onConfirm, onCancel }: {
  revenue: Revenue | undefined
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!revenue) return null

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
            Mark Invoice as Paid
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Are you sure you want to mark invoice <strong>{revenue.invoiceNumber}</strong> as paid?
          </p>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            padding: '12px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Invoice Details:</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
              {revenue.clientName} • {revenue.projectName}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
              {revenue.amount.toLocaleString()} {revenue.currency}
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
              backgroundColor: '#10b981',
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
