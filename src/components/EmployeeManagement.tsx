import React, { useState } from 'react'
import { useActionButtons, useScopedQueryParams } from '../hooks/useOrgScoped'
import { ScopeChip } from './ScopeChip'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  siteId: string
  siteName: string
  salary: number
  hireDate: string
  status: 'Active' | 'On Leave' | 'Terminated'
  avatar?: string
  orgUnitId: string // Added for org scoping
}

interface Site {
  id: string
  name: string
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    position: 'Site Manager',
    department: 'Operations',
    siteId: '1',
    siteName: 'Alpha Construction Site',
    salary: 75000,
    hireDate: '2022-01-15',
    status: 'Active',
    orgUnitId: 'ou-libya-ops'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 234-5678',
    position: 'Civil Engineer',
    department: 'Engineering',
    siteId: '2',
    siteName: 'Beta Development Site',
    salary: 68000,
    hireDate: '2022-03-20',
    status: 'Active',
    orgUnitId: 'ou-tripoli-central'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    phone: '+1 (555) 345-6789',
    position: 'Site Supervisor',
    department: 'Operations',
    siteId: '1',
    siteName: 'Alpha Construction Site',
    salary: 55000,
    hireDate: '2021-11-10',
    status: 'On Leave',
    orgUnitId: 'ou-libya-ops'
  },
  {
    id: '4',
    name: 'Lisa Wilson',
    email: 'lisa.wilson@company.com',
    phone: '+1 (555) 456-7890',
    position: 'Project Accountant',
    department: 'Finance',
    siteId: '3',
    siteName: 'Central Office',
    salary: 62000,
    hireDate: '2022-05-01',
    status: 'Active',
    orgUnitId: 'ou-finance-dept'
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@company.com',
    phone: '+1 (555) 567-8901',
    position: 'Safety Officer',
    department: 'Safety',
    siteId: '1',
    siteName: 'Alpha Construction Site',
    salary: 58000,
    hireDate: '2021-08-15',
    status: 'Active',
    orgUnitId: 'ou-libya-ops'
  }
]

const mockSites: Site[] = [
  { id: '1', name: 'Alpha Construction Site' },
  { id: '2', name: 'Beta Development Site' },
  { id: '3', name: 'Central Office' },
  { id: '4', name: 'Gamma Infrastructure' }
]

const departments = ['Operations', 'Engineering', 'Finance', 'Safety', 'Administration', 'HR']
const positions = ['Site Manager', 'Civil Engineer', 'Site Supervisor', 'Project Accountant', 'Safety Officer', 'Administrator', 'HR Specialist']

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Org scope integration
  const { canCreate, canUpdate, canDelete, createTooltip, updateTooltip, deleteTooltip } = useActionButtons('employees')
  const scopedParams = useScopedQueryParams()

  const filteredEmployees = employees.filter(employee => {
    // Apply org scope filtering
    if (scopedParams.orgUnitIds && scopedParams.orgUnitIds.length > 0) {
      if (!scopedParams.orgUnitIds.includes(employee.orgUnitId)) {
        return false
      }
    }
    
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = !filterDepartment || employee.department === filterDepartment
    const matchesStatus = !filterStatus || employee.status === filterStatus
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setShowModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowModal(true)
  }

  const handleDeleteEmployee = (id: string) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setEmployees(prev => prev.filter(emp => emp.id !== showDeleteConfirm))
      setShowDeleteConfirm(null)
    }
  }

  const handleSaveEmployee = (employeeData: Omit<Employee, 'id'>) => {
    if (editingEmployee) {
      // Update existing employee
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...employeeData, id: editingEmployee.id }
          : emp
      ))
    } else {
      // Add new employee with org scope
      const newEmployee: Employee = {
        ...employeeData,
        id: Date.now().toString(),
        orgUnitId: scopedParams.currentOrgUnit || 'ou-libya-ops' // Use current org scope or default
      }
      setEmployees(prev => [...prev, newEmployee])
    }
    setShowModal(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-light)',
        marginBottom: '20px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Employee Management</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Manage employee information and assignments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {scopedParams.currentOrgUnit && <ScopeChip orgUnitId={scopedParams.currentOrgUnit} />}
            {canCreate ? (
              <button
                onClick={handleAddEmployee}
                style={{
                  backgroundColor: 'var(--accent-primary)',
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
                + Add Employee
              </button>
            ) : (
              <button
                style={{
                  backgroundColor: 'var(--accent-primary)',
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
                + Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search employees..."
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
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
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
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
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
              minWidth: '120px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredEmployees.map(employee => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={() => handleEditEmployee(employee)}
            onDelete={() => handleDeleteEmployee(employee.id)}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            No employees found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {searchTerm || filterDepartment || filterStatus 
              ? 'Try adjusting your search filters'
              : 'Get started by adding your first employee'
            }
          </p>
        </div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          sites={mockSites}
          onSave={handleSaveEmployee}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          employeeName={employees.find(e => e.id === showDeleteConfirm)?.name || ''}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function EmployeeCard({ employee, onEdit, onDelete }: {
  employee: Employee
  onEdit: () => void
  onDelete: () => void
}) {
  const { canUpdate, canDelete: canDeleteEmployee, updateTooltip, deleteTooltip } = useActionButtons('employees')
  
  const statusColors = {
    'Active': '#10b981',
    'On Leave': '#f59e0b',
    'Terminated': '#ef4444'
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-light)',
      padding: '20px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
    }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white'
          }}>
            {employee.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
              {employee.name}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              {employee.position}
            </p>
          </div>
        </div>
        <span style={{
          backgroundColor: statusColors[employee.status] + '20',
          color: statusColors[employee.status],
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {employee.status}
        </span>
      </div>

      {/* Details */}
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>📧</span>
          <span style={{ color: 'var(--text-primary)' }}>{employee.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>📱</span>
          <span style={{ color: 'var(--text-primary)' }}>{employee.phone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>🏢</span>
          <span style={{ color: 'var(--text-primary)' }}>{employee.department}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>🏗️</span>
          <span style={{ color: 'var(--text-primary)' }}>{employee.siteName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>💰</span>
          <span style={{ color: 'var(--text-primary)' }}>${employee.salary.toLocaleString()}/year</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>📅</span>
          <span style={{ color: 'var(--text-primary)' }}>
            Hired {new Date(employee.hireDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Org Unit Indicator */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <ScopeChip orgUnitId={employee.orgUnitId} size="sm" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {canUpdate ? (
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            title={updateTooltip}
          >
            Edit
          </button>
        ) : (
          <button
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              opacity: 0.5,
              cursor: 'not-allowed'
            }}
            disabled
            title={updateTooltip}
          >
            Edit
          </button>
        )}
        {canDeleteEmployee ? (
          <button
            onClick={onDelete}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'var(--accent-danger)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            title={deleteTooltip}
          >
            Delete
          </button>
        ) : (
          <button
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'var(--accent-danger)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
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
  )
}

function EmployeeModal({ employee, sites, onSave, onClose }: {
  employee: Employee | null
  sites: Site[]
  onSave: (employee: Omit<Employee, 'id'>) => void
  onClose: () => void
}) {
  const scopedParams = useScopedQueryParams()
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    department: employee?.department || '',
    siteId: employee?.siteId || '',
    siteName: employee?.siteName || '',
    salary: employee?.salary || 50000,
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    status: employee?.status || 'Active' as const,
    orgUnitId: employee?.orgUnitId || scopedParams.currentOrgUnit || 'ou-libya-ops'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedSite = sites.find(s => s.id === formData.siteId)
    onSave({
      ...formData,
      siteName: selectedSite?.name || '',
      orgUnitId: formData.orgUnitId
    })
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
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
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
            {employee ? 'Edit Employee' : 'Add New Employee'}
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
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  Position *
                </label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                  <option value="">Select Position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Department *
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Site Assignment *
              </label>
              <select
                required
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
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
                <option value="">Select Site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Annual Salary
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
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
                  Hire Date
                </label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
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
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ employeeName, onConfirm, onCancel }: {
  employeeName: string
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
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Delete Employee
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Are you sure you want to delete <strong>{employeeName}</strong>? This action cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--accent-danger)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Delete Employee
          </button>
        </div>
      </div>
    </div>
  )
}
