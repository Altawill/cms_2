import React, { useState, useEffect } from 'react'
import { useRBAC, ProtectedComponent, useSitePermissions } from '../contexts/RBACContext'
import { userService } from '../services/userService'
import type { SiteModule } from '../types/user'
import { useFormSubmission } from '../hooks/useFormSubmission'
import { SiteTasks } from './sites/tasks/SiteTasks'
import { useActionButtons, useScopedQueryParams } from '../hooks/useOrgScoped'
import { ScopeChip } from './ScopeChip'

// Types for Site Management
export interface Site {
  id: string
  name: string
  code: string
  location: string
  description: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budget: number
  spent: number
  progress: number
  manager: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  updatedAt: string
  orgUnitId: string // Added for org scoping
}

export interface SiteEmployee {
  id: string
  siteId: string
  employeeId: string
  employeeName: string
  role: string
  department: string
  hourlyRate: number
  assignedDate: string
  status: 'active' | 'inactive' | 'transferred'
  attendance: {
    date: string
    hoursWorked: number
    overtime: number
    status: 'present' | 'absent' | 'sick' | 'vacation'
  }[]
}

export interface SiteEquipment {
  id: string
  siteId: string
  name: string
  type: string
  serialNumber: string
  status: 'operational' | 'maintenance' | 'repair' | 'retired'
  assignedDate: string
  dailyRate: number
  lastMaintenance: string
  nextMaintenance: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface SiteExpense {
  id: string
  siteId: string
  category: 'labor' | 'materials' | 'equipment' | 'subcontractors' | 'permits' | 'utilities' | 'other'
  description: string
  amount: number
  date: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  submittedBy: string
  approvedBy?: string
  approvedDate?: string
  attachments: string[]
}

export interface SiteMilestone {
  id: string
  siteId: string
  title: string
  description: string
  targetDate: string
  completedDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  progress: number
  dependencies: string[]
}

export interface SiteDocument {
  id: string
  siteId: string
  name: string
  type: 'contract' | 'permit' | 'drawing' | 'photo' | 'report' | 'other'
  url: string
  uploadedBy: string
  uploadedDate: string
  size: number
  tags: string[]
}

export function SiteManagement({
  onSelectSite,
  selectedSiteId
}: {
  onSelectSite?: (siteId: string | null) => void
  selectedSiteId?: string | null
}) {
  const { hasPermission, canAccessSite } = useRBAC()
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  
  // Get site-specific permissions for the selected site
  const sitePermissions = useSitePermissions(selectedSite?.id || '')
  
  // Org scope integration
  const { canCreate, canUpdate, canDelete, createTooltip, updateTooltip, deleteTooltip } = useActionButtons('sites')
  const scopedParams = useScopedQueryParams()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [showSiteModal, setShowSiteModal] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Synchronize external selectedSiteId prop with internal selectedSite state
  useEffect(() => {
    if (selectedSiteId && sites.length > 0) {
      const site = sites.find(s => s.id === selectedSiteId)
      if (site) {
        setSelectedSite(site)
      }
    } else if (selectedSiteId === null) {
      setSelectedSite(null)
    }
  }, [selectedSiteId, sites])

  // Load initial data with org scope filtering
  useEffect(() => {
    const savedSites = localStorage.getItem('construction_sites')
    if (savedSites) {
      setSites(JSON.parse(savedSites))
    } else {
      // Initialize with realistic hierarchical site data matching PMO→Area→Project→Zone structure
      const sampleSites: Site[] = [
        // Sites under West Region > The L Villas Project
        {
          id: 'site-villa-1',
          name: 'Villa #1 - Type A',
          code: 'LV-001',
          location: 'Plot 1, North Zone, The L Villas',
          description: '3-bedroom villa with garden and private parking',
          status: 'active',
          startDate: '2024-01-15',
          endDate: '2024-08-30',
          budget: 850000,
          spent: 425000,
          progress: 65,
          manager: 'Hassan Al-Omari',
          priority: 'high',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-08-25T00:00:00Z',
          orgUnitId: 'zone-villas-north'
        },
        {
          id: 'site-villa-3',
          name: 'Villa #3 - Type B',
          code: 'LV-003',
          location: 'Plot 3, North Zone, The L Villas',
          description: '4-bedroom villa with swimming pool and landscaping',
          status: 'active',
          startDate: '2024-02-01',
          endDate: '2024-09-15',
          budget: 1200000,
          spent: 720000,
          progress: 75,
          manager: 'Layla Mansour',
          priority: 'high',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-08-30T00:00:00Z',
          orgUnitId: 'zone-villas-north'
        },
        {
          id: 'site-villa-8',
          name: 'Villa #8 - Type A',
          code: 'LV-008',
          location: 'Plot 8, South Zone, The L Villas',
          description: '3-bedroom villa with modern finishes',
          status: 'planning',
          startDate: '2024-09-01',
          endDate: '2025-02-28',
          budget: 900000,
          spent: 45000,
          progress: 5,
          manager: 'Omar Benali',
          priority: 'medium',
          createdAt: '2024-07-01T00:00:00Z',
          updatedAt: '2024-08-20T00:00:00Z',
          orgUnitId: 'zone-villas-south'
        },
        {
          id: 'site-amenities-center',
          name: 'Community Center & Amenities',
          code: 'LV-AMN-001',
          location: 'Central Area, The L Villas',
          description: 'Community center with gym, pool, and recreational facilities',
          status: 'active',
          startDate: '2024-03-01',
          endDate: '2024-12-15',
          budget: 2500000,
          spent: 875000,
          progress: 35,
          manager: 'Sara Al-Rashid',
          priority: 'high',
          createdAt: '2024-02-15T00:00:00Z',
          updatedAt: '2024-08-28T00:00:00Z',
          orgUnitId: 'zone-villas-amenities'
        },
        
        // Sites under West Region > Marina Towers Project
        {
          id: 'site-tower-a-foundation',
          name: 'Tower A - Foundation & Structure',
          code: 'MT-A-001',
          location: 'Tower A Site, Marina Towers Complex',
          description: '25-story residential tower foundation and structural work',
          status: 'active',
          startDate: '2024-01-10',
          endDate: '2024-10-30',
          budget: 8500000,
          spent: 4250000,
          progress: 50,
          manager: 'Ahmed Al-Mansouri',
          priority: 'critical',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-08-30T00:00:00Z',
          orgUnitId: 'zone-tower-a'
        },
        {
          id: 'site-tower-b-structure',
          name: 'Tower B - Structural Framework',
          code: 'MT-B-001',
          location: 'Tower B Site, Marina Towers Complex',
          description: '30-story residential tower structural framework',
          status: 'planning',
          startDate: '2024-11-01',
          endDate: '2025-08-30',
          budget: 10200000,
          spent: 255000,
          progress: 2,
          manager: 'Fatima Al-Zahra',
          priority: 'high',
          createdAt: '2024-08-01T00:00:00Z',
          updatedAt: '2024-08-25T00:00:00Z',
          orgUnitId: 'zone-tower-b'
        },
        
        // Sites under East Region > Benghazi Mall Project
        {
          id: 'site-mall-retail-shell',
          name: 'Retail Zone - Shell & Core',
          code: 'BM-RT-001',
          location: 'Retail Area, Benghazi Shopping Mall',
          description: 'Main retail area shell and core construction',
          status: 'active',
          startDate: '2024-02-01',
          endDate: '2024-11-30',
          budget: 12000000,
          spent: 6000000,
          progress: 50,
          manager: 'Omar Al-Shareef',
          priority: 'high',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-08-28T00:00:00Z',
          orgUnitId: 'zone-mall-retail'
        },
        {
          id: 'site-mall-entertainment',
          name: 'Entertainment Zone - Cinema & Gaming',
          code: 'BM-ENT-001',
          location: 'Entertainment Wing, Benghazi Shopping Mall',
          description: 'Cinema complex and gaming area with specialized systems',
          status: 'planning',
          startDate: '2024-12-01',
          endDate: '2025-06-30',
          budget: 6500000,
          spent: 195000,
          progress: 3,
          manager: 'Amina Khalil',
          priority: 'medium',
          createdAt: '2024-09-01T00:00:00Z',
          updatedAt: '2024-08-30T00:00:00Z',
          orgUnitId: 'zone-mall-entertainment'
        },
        
        // Sites under East Region > Industrial Zone Project
        {
          id: 'site-warehouse-complex',
          name: 'Main Warehouse Complex',
          code: 'IZ-WH-001',
          location: 'Warehouse Zone, Industrial Development',
          description: 'Large-scale warehouse and distribution center with loading docks',
          status: 'active',
          startDate: '2024-03-01',
          endDate: '2025-01-30',
          budget: 5500000,
          spent: 1375000,
          progress: 25,
          manager: 'Khalil Benghazi',
          priority: 'medium',
          createdAt: '2024-02-15T00:00:00Z',
          updatedAt: '2024-08-25T00:00:00Z',
          orgUnitId: 'zone-warehouse'
        },
        
        // Sites under Central Region > Downtown Office Project
        {
          id: 'site-office-north-tower',
          name: 'North Office Tower',
          code: 'DOC-N-001',
          location: 'North Zone, Downtown Office Complex',
          description: 'Modern 15-story office building with underground parking',
          status: 'active',
          startDate: '2024-01-15',
          endDate: '2025-06-30',
          budget: 18000000,
          spent: 6300000,
          progress: 35,
          manager: 'Ahmed Hassan',
          priority: 'high',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-08-25T00:00:00Z',
          orgUnitId: 'zone-office-north'
        },
        {
          id: 'site-office-south-plaza',
          name: 'South Office Plaza',
          code: 'DOC-S-001',
          location: 'South Zone, Downtown Office Complex',
          description: '8-story office plaza with retail ground floor',
          status: 'planning',
          startDate: '2024-10-01',
          endDate: '2025-04-30',
          budget: 8800000,
          spent: 440000,
          progress: 5,
          manager: 'Layla Benali',
          priority: 'medium',
          createdAt: '2024-08-01T00:00:00Z',
          updatedAt: '2024-08-28T00:00:00Z',
          orgUnitId: 'zone-office-south'
        }
      ]
      setSites(sampleSites)
      localStorage.setItem('construction_sites', JSON.stringify(sampleSites))
    }
  }, [scopedParams])

  const saveSites = (updatedSites: Site[]) => {
    setSites(updatedSites)
    localStorage.setItem('construction_sites', JSON.stringify(updatedSites))
  }

  const handleCreateSite = (siteData: Partial<Site>) => {
    const newSite: Site = {
      id: Date.now().toString(),
      name: siteData.name || '',
      code: siteData.code || '',
      location: siteData.location || '',
      description: siteData.description || '',
      status: siteData.status || 'planning',
      startDate: siteData.startDate || '',
      endDate: siteData.endDate || '',
      budget: siteData.budget || 0,
      spent: 0,
      progress: 0,
      manager: siteData.manager || '',
      priority: siteData.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orgUnitId: scopedParams.currentOrgUnit || 'ou-libya-ops' // Use current org scope or default
    }
    saveSites([...sites, newSite])
    setShowSiteModal(false)
  }

  const handleEditSite = (siteData: Partial<Site>) => {
    if (!editingSite) return
    const updatedSite = {
      ...editingSite,
      ...siteData,
      updatedAt: new Date().toISOString()
    }
    saveSites(sites.map(s => s.id === editingSite.id ? updatedSite : s))
    setEditingSite(null)
    setShowSiteModal(false)
    if (selectedSite?.id === editingSite.id) {
      setSelectedSite(updatedSite)
    }
  }

  const handleDeleteSite = (siteId: string) => {
    if (confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      saveSites(sites.filter(s => s.id !== siteId))
      if (selectedSite?.id === siteId) {
        setSelectedSite(null)
      }
    }
  }

  // Filter sites based on user access, org scope, and search criteria
  const filteredSites = sites.filter(site => {
    // Check site access permissions first
    if (!canAccessSite(site.id)) {
      return false
    }
    
    // Apply org scope filtering using URL params
    if (scopedParams.orgUnitIds && scopedParams.orgUnitIds.length > 0) {
      if (!scopedParams.orgUnitIds.includes(site.orgUnitId)) {
        return false
      }
    }
    
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || site.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: Site['status']) => {
    switch (status) {
      case 'planning': return 'var(--accent-info)'
      case 'active': return 'var(--accent-secondary)'
      case 'paused': return 'var(--accent-warning)'
      case 'completed': return 'var(--accent-primary)'
      case 'cancelled': return 'var(--accent-danger)'
      default: return 'var(--text-muted)'
    }
  }

  const getPriorityColor = (priority: Site['priority']) => {
    switch (priority) {
      case 'low': return 'var(--accent-info)'
      case 'medium': return 'var(--accent-warning)'
      case 'high': return 'var(--accent-danger)'
      case 'critical': return '#8b0000'
      default: return 'var(--text-muted)'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'equipment', label: 'Equipment', icon: '🚜' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'documents', label: 'Documents', icon: '📁' }
  ]

  if (selectedSite) {
    return (
      <div style={{ padding: '24px', height: '100vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          padding: '20px 24px',
          background: 'var(--gradient-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => {
                setSelectedSite(null)
                onSelectSite?.(null)
              }}
              className="btn-ghost btn-icon"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              ←
            </button>
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                margin: 0, 
                color: 'var(--text-primary)' 
              }}>
                {selectedSite.name}
              </h1>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: '14px' 
              }}>
                {selectedSite.code} • {selectedSite.location}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ScopeChip orgUnitId={selectedSite.orgUnitId} />
            {canUpdate ? (
              <button 
                onClick={() => {
                  setEditingSite(selectedSite)
                  setShowSiteModal(true)
                }}
                className="btn-outline btn-sm"
                title={updateTooltip}
              >
                ✏️ Edit
              </button>
            ) : (
              <button 
                className="btn-outline btn-sm"
                disabled
                title={updateTooltip}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                ✏️ Edit
              </button>
            )}
            {canDelete ? (
              <button 
                onClick={() => handleDeleteSite(selectedSite.id)}
                style={{
                  background: 'var(--accent-danger)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                title={deleteTooltip}
              >
                🗑️ Delete
              </button>
            ) : (
              <button 
                style={{
                  background: 'var(--accent-danger)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  fontSize: '14px'
                }}
                disabled
                title={deleteTooltip}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: getStatusColor(selectedSite.status) }}>
              {selectedSite.status.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Status</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
              {selectedSite.progress}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Progress</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {(selectedSite.spent / 1000000).toFixed(1)}M LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              of {(selectedSite.budget / 1000000).toFixed(1)}M Budget
            </div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: getPriorityColor(selectedSite.priority) }}>
              {selectedSite.priority.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Priority</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-light)', 
          marginBottom: '24px',
          gap: '2px'
        }}>
          {tabs.map(tab => {
            // Check site-specific permissions for each tab
            const hasTabPermission = (() => {
              switch (tab.id) {
                case 'overview':
                  return sitePermissions.canView('overview')
                case 'tasks':
                  return sitePermissions.canView('tasks')
                case 'employees':
                  return sitePermissions.canView('employees')
                case 'equipment':
                  return sitePermissions.canView('equipment')
                case 'expenses':
                  return sitePermissions.canView('expenses')
                case 'progress':
                  return sitePermissions.canView('progress')
                case 'documents':
                  return sitePermissions.canView('documents')
                default:
                  return true
              }
            })()

            if (!hasTabPermission) {
              return null
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id ? 'var(--accent-primary-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'var(--transition-normal)'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="card" style={{ padding: '24px', minHeight: '400px' }}>
          {activeTab === 'overview' && <SiteOverview site={selectedSite} />}
          {activeTab === 'tasks' && <SiteTasks site={selectedSite} />}
          {activeTab === 'employees' && <SiteEmployees site={selectedSite} />}
          {activeTab === 'equipment' && <SiteEquipment site={selectedSite} />}
          {activeTab === 'expenses' && <SiteExpenses site={selectedSite} />}
          {activeTab === 'progress' && <SiteProgress site={selectedSite} />}
          {activeTab === 'documents' && <SiteDocuments site={selectedSite} />}
        </div>

        {/* Site Modal */}
        {showSiteModal && (
          <SiteModal
            site={editingSite}
            onSave={editingSite ? handleEditSite : handleCreateSite}
            onCancel={() => {
              setShowSiteModal(false)
              setEditingSite(null)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Construction Sites
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            Manage all your construction projects in one place
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {scopedParams.currentOrgUnit && <ScopeChip orgUnitId={scopedParams.currentOrgUnit} />}
          {canCreate ? (
            <button 
              onClick={() => setShowSiteModal(true)}
              className="btn-primary"
              title={createTooltip}
            >
              ➕ Add New Site
            </button>
          ) : (
            <button 
              className="btn-primary"
              disabled
              title={createTooltip}
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              ➕ Add New Site
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ 
        padding: '20px', 
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search sites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Sites Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {filteredSites.map(site => (
          <div 
            key={site.id} 
            className="card card-elevated"
            style={{
              padding: '24px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => {
              setSelectedSite(site)
              onSelectSite?.(site.id)
            }}
          >
            {/* Priority indicator */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '4px',
              height: '100%',
              background: getPriorityColor(site.priority)
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  margin: '0 0 4px 0', 
                  color: 'var(--text-primary)' 
                }}>
                  {site.name}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)', 
                  margin: '0 0 8px 0' 
                }}>
                  {site.code}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge badge-primary">
                    {site.status}
                  </span>
                  <span style={{
                    background: getPriorityColor(site.priority),
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {site.priority}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '12px', 
                color: 'var(--text-muted)', 
                marginBottom: '4px' 
              }}>
                <span>Progress</span>
                <span>{site.progress}%</span>
              </div>
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${site.progress}%` }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Budget</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {(site.budget / 1000000).toFixed(1)}M LYD
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spent</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--accent-warning)' }}>
                  {(site.spent / 1000000).toFixed(1)}M LYD
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manager</div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{site.manager}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>End Date</div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {new Date(site.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <ScopeChip orgUnitId={site.orgUnitId} size="sm" />
            </div>
          </div>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="card" style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
          <h3>No sites found</h3>
          <p>Try adjusting your search criteria or add a new site</p>
        </div>
      )}

      {/* Site Modal */}
      {showSiteModal && (
        <SiteModal
          site={editingSite}
          onSave={editingSite ? handleEditSite : handleCreateSite}
          onCancel={() => {
            setShowSiteModal(false)
            setEditingSite(null)
          }}
        />
      )}
    </div>
  )
}

// Site Modal Component
function SiteModal({ 
  site, 
  onSave, 
  onCancel 
}: { 
  site: Site | null
  onSave: (site: Partial<Site>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: site?.name || '',
    code: site?.code || '',
    location: site?.location || '',
    description: site?.description || '',
    status: site?.status || 'planning',
    startDate: site?.startDate || '',
    endDate: site?.endDate || '',
    budget: site?.budget || 0,
    manager: site?.manager || '',
    priority: site?.priority || 'medium'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 1000
  })

  // Validation rules
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Site name must be at least 2 characters'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Site code is required'
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Site code must contain only letters, numbers, and hyphens'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (!formData.manager.trim()) {
      newErrors.manager = 'Manager name is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (formData.budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      if (!validateForm()) {
        return
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
        onSave(formData)
      } catch (error) {
        console.error('Error saving site:', error)
        throw error // Re-throw to be handled by the form submission hook
      }
    })
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData({...formData, [field]: value})
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''})
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600' }}>
          {site ? 'Edit Site' : 'Create New Site'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Site Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                style={{ 
                  width: '100%',
                  borderColor: errors.name ? 'var(--accent-danger)' : 'var(--border-color)'
                }}
              />
              {errors.name && (
                <div style={{ 
                  color: 'var(--accent-danger)', 
                  fontSize: '12px', 
                  marginTop: '4px' 
                }}>
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Site Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                style={{ 
                  width: '100%',
                  borderColor: errors.code ? 'var(--accent-danger)' : 'var(--border-color)'
                }}
              />
              {errors.code && (
                <div style={{ 
                  color: 'var(--accent-danger)', 
                  fontSize: '12px', 
                  marginTop: '4px' 
                }}>
                  {errors.code}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              style={{ 
                width: '100%',
                borderColor: errors.location ? 'var(--accent-danger)' : 'var(--border-color)'
              }}
            />
            {errors.location && (
              <div style={{ 
                color: 'var(--accent-danger)', 
                fontSize: '12px', 
                marginTop: '4px' 
              }}>
                {errors.location}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              style={{ 
                width: '100%', 
                resize: 'vertical',
                borderColor: errors.description ? 'var(--accent-danger)' : 'var(--border-color)'
              }}
            />
            {errors.description && (
              <div style={{ 
                color: 'var(--accent-danger)', 
                fontSize: '12px', 
                marginTop: '4px' 
              }}>
                {errors.description}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as Site['status']})}
                style={{ width: '100%' }}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as Site['priority']})}
                style={{ width: '100%' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Budget (LYD)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Project Manager *
              </label>
              <input
                type="text"
                required
                value={formData.manager}
                onChange={(e) => handleFieldChange('manager', e.target.value)}
                style={{ 
                  width: '100%',
                  borderColor: errors.manager ? 'var(--accent-danger)' : 'var(--border-color)'
                }}
              />
              {errors.manager && (
                <div style={{ 
                  color: 'var(--accent-danger)', 
                  fontSize: '12px', 
                  marginTop: '4px' 
                }}>
                  {errors.manager}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {site ? 'Update Site' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Site Overview Dashboard Component
function SiteOverview({ site }: { site: Site }) {
  const [siteEmployees, setSiteEmployees] = useState<SiteEmployee[]>([])
  const [siteEquipment, setSiteEquipment] = useState<SiteEquipment[]>([])
  const [siteExpenses, setSiteExpenses] = useState<SiteExpense[]>([])
  const [siteMilestones, setSiteMilestones] = useState<SiteMilestone[]>([])
  const [siteDocuments, setSiteDocuments] = useState<SiteDocument[]>([])

  // Load all site data for overview
  useEffect(() => {
    const employees = localStorage.getItem(`site_employees_${site.id}`)
    const equipment = localStorage.getItem(`site_equipment_${site.id}`)
    const expenses = localStorage.getItem(`site_expenses_${site.id}`)
    const milestones = localStorage.getItem(`site_milestones_${site.id}`)
    const documents = localStorage.getItem(`site_documents_${site.id}`)

    if (employees) setSiteEmployees(JSON.parse(employees))
    if (equipment) setSiteEquipment(JSON.parse(equipment))
    if (expenses) setSiteExpenses(JSON.parse(expenses))
    if (milestones) setSiteMilestones(JSON.parse(milestones))
    if (documents) setSiteDocuments(JSON.parse(documents))
  }, [site.id])

  // Calculate key metrics
  const totalEmployees = siteEmployees.length
  const activeEmployees = siteEmployees.filter(e => e.status === 'active').length
  const totalEquipment = siteEquipment.length
  const operationalEquipment = siteEquipment.filter(e => e.status === 'operational').length
  const totalExpenses = siteExpenses.reduce((sum, e) => sum + e.amount, 0)
  const approvedExpenses = siteExpenses.filter(e => e.status === 'approved' || e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)
  const budgetUsed = site.budget > 0 ? (approvedExpenses / site.budget) * 100 : 0
  const remainingBudget = site.budget - approvedExpenses
  const completedMilestones = siteMilestones.filter(m => m.status === 'completed').length
  const overdueMilestones = siteMilestones.filter(m => m.status === 'overdue').length
  const totalDocuments = siteDocuments.length
  const dailyEquipmentCost = siteEquipment.filter(e => e.status === 'operational').reduce((sum, e) => sum + e.dailyRate, 0)
  const monthlyEquipmentCost = dailyEquipmentCost * 30
  const avgHourlyRate = siteEmployees.length > 0 ? siteEmployees.reduce((sum, e) => sum + e.hourlyRate, 0) / siteEmployees.length : 0
  const dailyLaborCost = activeEmployees * avgHourlyRate * 8 // Assuming 8 hour workday
  const monthlyLaborCost = dailyLaborCost * 30

  // Recent activity data
  const recentExpenses = siteExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
  
  const recentDocuments = siteDocuments
    .sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime())
    .slice(0, 5)

  const upcomingMilestones = siteMilestones
    .filter(m => m.status !== 'completed')
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 3)

  // Project timeline data
  const projectStartDate = new Date(site.startDate)
  const projectEndDate = new Date(site.endDate)
  const today = new Date()
  const totalDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24))
  const daysPassed = Math.ceil((today.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24))
  const daysRemaining = Math.max(0, Math.ceil((projectEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24)))
  const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, (daysPassed / totalDays) * 100)) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'var(--accent-info)'
      case 'active': return 'var(--accent-secondary)'
      case 'paused': return 'var(--accent-warning)'
      case 'completed': return 'var(--accent-primary)'
      case 'cancelled': return 'var(--accent-danger)'
      default: return 'var(--text-muted)'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'var(--accent-info)'
      case 'medium': return 'var(--accent-warning)'
      case 'high': return 'var(--accent-danger)'
      case 'critical': return '#8b0000'
      default: return 'var(--text-muted)'
    }
  }

  return (
    <div>
      {/* Project Health Overview */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
          📊 Project Health Overview
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Project Status Card */}
          <div className="card" style={{ 
            padding: '20px', 
            background: `linear-gradient(135deg, ${getStatusColor(site.status)}15, ${getStatusColor(site.status)}05)`,
            border: `1px solid ${getStatusColor(site.status)}40`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>Project Status</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: getStatusColor(site.status),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {site.status}
                  </span>
                  <span style={{
                    background: getPriorityColor(site.priority),
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {site.priority} Priority
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '32px', opacity: 0.6 }}>🏗️</div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Manager: <span style={{ fontWeight: '600' }}>{site.manager}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Started: {new Date(site.startDate).toLocaleDateString()} • 
              Ends: {new Date(site.endDate).toLocaleDateString()}
            </div>
          </div>

          {/* Budget Status Card */}
          <div className="card" style={{ 
            padding: '20px',
            background: budgetUsed > 90 ? 'var(--accent-danger-light)' : budgetUsed > 75 ? 'var(--accent-warning-light)' : 'var(--accent-primary-light)',
            border: `1px solid ${budgetUsed > 90 ? 'var(--accent-danger)' : budgetUsed > 75 ? 'var(--accent-warning)' : 'var(--accent-primary)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>Budget Status</h4>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                  {budgetUsed.toFixed(1)}% Used
                </div>
              </div>
              <div style={{ fontSize: '32px', opacity: 0.6 }}>💰</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div className="progress" style={{ height: '8px', marginBottom: '8px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${Math.min(budgetUsed, 100)}%`,
                    background: budgetUsed > 90 ? 'var(--accent-danger)' : budgetUsed > 75 ? 'var(--accent-warning)' : 'var(--accent-primary)'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spent: {(approvedExpenses / 1000000).toFixed(2)}M LYD</span>
                <span style={{ color: 'var(--text-secondary)' }}>Budget: {(site.budget / 1000000).toFixed(2)}M LYD</span>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Remaining: <span style={{ fontWeight: '600', color: remainingBudget > 0 ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                {(remainingBudget / 1000000).toFixed(2)}M LYD
              </span>
            </div>
          </div>

          {/* Progress Timeline Card */}
          <div className="card" style={{ 
            padding: '20px',
            background: 'var(--accent-secondary-light)',
            border: '1px solid var(--accent-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>Project Progress</h4>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                  {site.progress}%
                </div>
              </div>
              <div style={{ fontSize: '32px', opacity: 0.6 }}>📈</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div className="progress" style={{ height: '8px', marginBottom: '8px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${site.progress}%`,
                    background: 'var(--accent-secondary)'
                  }} 
                />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Milestones: {completedMilestones}/{siteMilestones.length} completed
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Days passed: {daysPassed}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Days remaining: {daysRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          🎯 Key Metrics
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'var(--accent-secondary-light)',
            border: '1px solid var(--accent-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
              {activeEmployees}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Employees</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>of {totalEmployees} total</div>
          </div>
          
          <div style={{
            background: 'var(--accent-primary-light)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {operationalEquipment}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Operational Equipment</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>of {totalEquipment} total</div>
          </div>
          
          <div style={{
            background: 'var(--accent-info-light)',
            border: '1px solid var(--accent-info)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-info)' }}>
              {completedMilestones}/{siteMilestones.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Milestones</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>completed</div>
          </div>
          
          <div style={{
            background: 'var(--accent-warning-light)',
            border: '1px solid var(--accent-warning)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-warning)' }}>
              {totalDocuments}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Documents</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>uploaded</div>
          </div>

          {overdueMilestones > 0 && (
            <div style={{
              background: 'var(--accent-danger-light)',
              border: '1px solid var(--accent-danger)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-danger)' }}>
                {overdueMilestones}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Overdue</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>milestones</div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout for Charts and Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Cost Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💸 Monthly Cost Breakdown
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👷</span>
                <span style={{ fontSize: '14px' }}>Labor Costs</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                {monthlyLaborCost.toFixed(0)} LYD
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚜</span>
                <span style={{ fontSize: '14px' }}>Equipment Rental</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                {monthlyEquipmentCost.toFixed(0)} LYD
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🧱</span>
                <span style={{ fontSize: '14px' }}>Materials & Others</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-info)' }}>
                {(totalExpenses - (monthlyLaborCost + monthlyEquipmentCost)).toFixed(0)} LYD
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>Total Monthly</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {(monthlyLaborCost + monthlyEquipmentCost + (totalExpenses - (monthlyLaborCost + monthlyEquipmentCost))).toFixed(0)} LYD
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Comparison */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⏱️ Timeline vs Progress
          </h4>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Time Progress</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{timeProgress.toFixed(1)}%</span>
            </div>
            <div className="progress" style={{ height: '8px', marginBottom: '12px' }}>
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${timeProgress}%`,
                  background: 'var(--accent-info)'
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Work Progress</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{site.progress}%</span>
            </div>
            <div className="progress" style={{ height: '8px', marginBottom: '12px' }}>
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${site.progress}%`,
                  background: 'var(--accent-secondary)'
                }} 
              />
            </div>
          </div>
          <div style={{ 
            padding: '12px',
            background: timeProgress > site.progress ? 'var(--accent-warning-light)' : 'var(--accent-secondary-light)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${timeProgress > site.progress ? 'var(--accent-warning)' : 'var(--accent-secondary)'}`,
            fontSize: '13px'
          }}>
            {timeProgress > site.progress ? (
              <div style={{ color: 'var(--accent-warning)' }}>
                ⚠️ <strong>Behind Schedule:</strong> Work progress is {(timeProgress - site.progress).toFixed(1)}% behind timeline
              </div>
            ) : timeProgress < site.progress ? (
              <div style={{ color: 'var(--accent-secondary)' }}>
                ✅ <strong>Ahead of Schedule:</strong> Work progress is {(site.progress - timeProgress).toFixed(1)}% ahead of timeline
              </div>
            ) : (
              <div style={{ color: 'var(--accent-info)' }}>
                📊 <strong>On Schedule:</strong> Work progress aligns with timeline
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity and Updates */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Recent Activity */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🕒 Recent Activity
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {recentExpenses.slice(0, 3).map(expense => (
              <div key={expense.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    💰 {expense.description.slice(0, 30)}...
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {new Date(expense.date).toLocaleDateString()} • {expense.category}
                  </div>
                </div>
                <div style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                  {expense.amount.toLocaleString()} LYD
                </div>
              </div>
            ))}
            {recentDocuments.slice(0, 2).map(document => (
              <div key={document.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    📄 {document.name.slice(0, 30)}...
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {new Date(document.uploadedDate).toLocaleDateString()} • {document.type}
                  </div>
                </div>
                <div style={{ color: 'var(--accent-info)', fontWeight: '600' }}>
                  {document.uploadedBy.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Upcoming Milestones
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {upcomingMilestones.map(milestone => {
              const daysUntilTarget = Math.ceil((new Date(milestone.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
              const isOverdue = milestone.status === 'overdue'
              const isUrgent = daysUntilTarget <= 7 && daysUntilTarget > 0
              
              return (
                <div key={milestone.id} style={{ 
                  padding: '12px',
                  background: isOverdue ? 'var(--accent-danger-light)' : isUrgent ? 'var(--accent-warning-light)' : 'var(--bg-tertiary)',
                  border: `1px solid ${isOverdue ? 'var(--accent-danger)' : isUrgent ? 'var(--accent-warning)' : 'var(--border-light)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {milestone.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        Target: {new Date(milestone.targetDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ 
                      color: isOverdue ? 'var(--accent-danger)' : isUrgent ? 'var(--accent-warning)' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {isOverdue ? `${Math.abs(daysUntilTarget)} days overdue` : 
                       daysUntilTarget <= 0 ? 'Due today' :
                       `${daysUntilTarget} days left`}
                    </div>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${milestone.progress}%`,
                        background: isOverdue ? 'var(--accent-danger)' : isUrgent ? 'var(--accent-warning)' : 'var(--accent-secondary)'
                      }} 
                    />
                  </div>
                </div>
              )
            })}
            {upcomingMilestones.length === 0 && (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontStyle: 'italic'
              }}>
                No upcoming milestones
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          📈 Detailed Statistics
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Expense Breakdown */}
          <div className="card" style={{ padding: '20px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              💰 Expense Categories
            </h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {['materials', 'labor', 'equipment', 'permits'].map(category => {
                const categoryExpenses = siteExpenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
                const percentage = totalExpenses > 0 ? (categoryExpenses / totalExpenses) * 100 : 0
                
                return (
                  <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%',
                      background: {
                        materials: 'var(--accent-primary)',
                        labor: 'var(--accent-secondary)',
                        equipment: 'var(--accent-info)',
                        permits: 'var(--accent-warning)'
                      }[category]
                    }} />
                    <span style={{ flex: 1, fontSize: '13px', textTransform: 'capitalize' }}>{category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{percentage.toFixed(1)}%</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '80px', textAlign: 'right' }}>
                      {categoryExpenses.toLocaleString()} LYD
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Equipment Status */}
          <div className="card" style={{ padding: '20px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              🚜 Equipment Status
            </h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {['operational', 'maintenance', 'repair'].map(status => {
                const count = siteEquipment.filter(e => e.status === status).length
                const percentage = totalEquipment > 0 ? (count / totalEquipment) * 100 : 0
                
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%',
                      background: {
                        operational: 'var(--accent-secondary)',
                        maintenance: 'var(--accent-warning)',
                        repair: 'var(--accent-danger)'
                      }[status]
                    }} />
                    <span style={{ flex: 1, fontSize: '13px', textTransform: 'capitalize' }}>{status}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{percentage.toFixed(1)}%</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '30px', textAlign: 'right' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Team Performance */}
          <div className="card" style={{ padding: '20px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              👥 Team Overview
            </h5>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px' }}>Total Employees</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{totalEmployees}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px' }}>Active</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-secondary)' }}>{activeEmployees}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px' }}>Avg. Hourly Rate</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{avgHourlyRate.toFixed(1)} LYD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px' }}>Daily Labor Cost</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)' }}>{dailyLaborCost.toFixed(0)} LYD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents & Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        {/* Recent Documents */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📁 Recent Documents
            </h4>
            <button className="btn-ghost btn-sm" style={{ fontSize: '12px' }}>
              View All
            </button>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {recentDocuments.map(document => {
              const getTypeIcon = (type: SiteDocument['type']) => {
                switch (type) {
                  case 'contract': return '📋'
                  case 'permit': return '📜'
                  case 'drawing': return '📐'
                  case 'photo': return '📷'
                  case 'report': return '📊'
                  case 'other': return '📄'
                  default: return '📄'
                }
              }
              
              const formatFileSize = (bytes: number) => {
                if (bytes === 0) return '0 B'
                const k = 1024
                const sizes = ['B', 'KB', 'MB', 'GB']
                const i = Math.floor(Math.log(bytes) / Math.log(k))
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
              }
              
              return (
                <div key={document.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  transition: 'var(--transition-normal)',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '16px' }}>{getTypeIcon(document.type)}</span>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {document.name.slice(0, 35)}...
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {new Date(document.uploadedDate).toLocaleDateString()} • {formatFileSize(document.size)}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {document.uploadedBy.split(' ')[0]}
                  </div>
                </div>
              )
            })}
            {recentDocuments.length === 0 && (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontStyle: 'italic'
              }}>
                No documents uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 Alerts & Notifications
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {/* Budget alerts */}
            {budgetUsed > 90 && (
              <div style={{
                padding: '12px',
                background: 'var(--accent-danger-light)',
                border: '1px solid var(--accent-danger)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-danger)', marginBottom: '4px' }}>
                  🚨 Budget Alert
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {budgetUsed.toFixed(1)}% of budget used. Consider reviewing upcoming expenses.
                </div>
              </div>
            )}

            {/* Overdue milestones */}
            {overdueMilestones > 0 && (
              <div style={{
                padding: '12px',
                background: 'var(--accent-danger-light)',
                border: '1px solid var(--accent-danger)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-danger)', marginBottom: '4px' }}>
                  ⏰ Overdue Milestones
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {overdueMilestones} milestone(s) are overdue. Review project timeline.
                </div>
              </div>
            )}

            {/* Equipment maintenance */}
            {siteEquipment.filter(e => {
              const nextMaintenance = new Date(e.nextMaintenance)
              const today = new Date()
              const diffDays = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 3600 * 24))
              return diffDays <= 7 && diffDays >= 0
            }).length > 0 && (
              <div style={{
                padding: '12px',
                background: 'var(--accent-warning-light)',
                border: '1px solid var(--accent-warning)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-warning)', marginBottom: '4px' }}>
                  🔧 Maintenance Due
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {siteEquipment.filter(e => {
                    const nextMaintenance = new Date(e.nextMaintenance)
                    const today = new Date()
                    const diffDays = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 3600 * 24))
                    return diffDays <= 7 && diffDays >= 0
                  }).length} equipment item(s) need maintenance this week.
                </div>
              </div>
            )}

            {/* Progress behind schedule */}
            {timeProgress > site.progress + 10 && (
              <div style={{
                padding: '12px',
                background: 'var(--accent-warning-light)',
                border: '1px solid var(--accent-warning)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-warning)', marginBottom: '4px' }}>
                  📉 Progress Alert
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Project is {(timeProgress - site.progress).toFixed(1)}% behind schedule. Consider reviewing milestones.
                </div>
              </div>
            )}

            {/* All good state */}
            {budgetUsed <= 90 && overdueMilestones === 0 && timeProgress <= site.progress + 10 && (
              <div style={{
                padding: '16px',
                background: 'var(--accent-secondary-light)',
                border: '1px solid var(--accent-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontWeight: '600', color: 'var(--accent-secondary)', marginBottom: '4px' }}>
                  All Systems Good
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Project is on track with no critical alerts
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          ⚡ Quick Actions
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            👥 Add Employee
          </button>
          <button className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            🚜 Add Equipment
          </button>
          <button className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            💰 Record Expense
          </button>
          <button className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            📈 Add Milestone
          </button>
          <button className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            📁 Upload Document
          </button>
          <button className="btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            📊 Generate Report
          </button>
        </div>
      </div>
    </div>
  )
}

function SiteEmployees({ site }: { site: Site }) {
  const sitePermissions = useSitePermissions(site.id)
  const [siteEmployees, setSiteEmployees] = useState<SiteEmployee[]>([])
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<SiteEmployee | null>(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<SiteEmployee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Load site employees
  useEffect(() => {
    const savedEmployees = localStorage.getItem(`site_employees_${site.id}`)
    if (savedEmployees) {
      setSiteEmployees(JSON.parse(savedEmployees))
    } else {
      // Sample data for demonstration
      const sampleEmployees: SiteEmployee[] = [
        {
          id: '1',
          siteId: site.id,
          employeeId: 'EMP001',
          employeeName: 'Ahmed Hassan',
          role: 'Site Supervisor',
          department: 'Construction',
          hourlyRate: 25,
          assignedDate: '2024-01-15',
          status: 'active',
          attendance: [
            {
              date: '2024-08-25',
              hoursWorked: 8,
              overtime: 0,
              status: 'present'
            },
            {
              date: '2024-08-24',
              hoursWorked: 9,
              overtime: 1,
              status: 'present'
            }
          ]
        },
        {
          id: '2',
          siteId: site.id,
          employeeId: 'EMP002',
          employeeName: 'Fatima Al-Zahra',
          role: 'Engineer',
          department: 'Engineering',
          hourlyRate: 30,
          assignedDate: '2024-02-01',
          status: 'active',
          attendance: [
            {
              date: '2024-08-25',
              hoursWorked: 8,
              overtime: 0,
              status: 'present'
            },
            {
              date: '2024-08-24',
              hoursWorked: 0,
              overtime: 0,
              status: 'sick'
            }
          ]
        }
      ]
      setSiteEmployees(sampleEmployees)
      localStorage.setItem(`site_employees_${site.id}`, JSON.stringify(sampleEmployees))
    }
  }, [site.id])

  const saveEmployees = (employees: SiteEmployee[]) => {
    setSiteEmployees(employees)
    localStorage.setItem(`site_employees_${site.id}`, JSON.stringify(employees))
  }

  const handleAddEmployee = (employeeData: Partial<SiteEmployee>) => {
    const newEmployee: SiteEmployee = {
      id: Date.now().toString(),
      siteId: site.id,
      employeeId: employeeData.employeeId || '',
      employeeName: employeeData.employeeName || '',
      role: employeeData.role || '',
      department: employeeData.department || '',
      hourlyRate: employeeData.hourlyRate || 0,
      assignedDate: employeeData.assignedDate || new Date().toISOString().split('T')[0],
      status: 'active',
      attendance: []
    }
    saveEmployees([...siteEmployees, newEmployee])
    setShowEmployeeModal(false)
  }

  const handleEditEmployee = (employeeData: Partial<SiteEmployee>) => {
    if (!editingEmployee) return
    const updatedEmployee = { ...editingEmployee, ...employeeData }
    saveEmployees(siteEmployees.map(e => e.id === editingEmployee.id ? updatedEmployee : e))
    setEditingEmployee(null)
    setShowEmployeeModal(false)
  }

  const handleRemoveEmployee = (employeeId: string) => {
    if (confirm('Are you sure you want to remove this employee from the site?')) {
      saveEmployees(siteEmployees.filter(e => e.id !== employeeId))
    }
  }

  const handleUpdateStatus = (employeeId: string, status: SiteEmployee['status']) => {
    saveEmployees(siteEmployees.map(e => e.id === employeeId ? { ...e, status } : e))
  }

  const addAttendance = (employeeId: string, attendance: SiteEmployee['attendance'][0]) => {
    saveEmployees(siteEmployees.map(e => 
      e.id === employeeId 
        ? { ...e, attendance: [attendance, ...e.attendance.filter(a => a.date !== attendance.date)] }
        : e
    ))
  }

  const filteredEmployees = siteEmployees.filter(employee => {
    const matchesSearch = employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusColor = (status: SiteEmployee['status']) => {
    switch (status) {
      case 'active': return 'var(--accent-secondary)'
      case 'inactive': return 'var(--accent-warning)'
      case 'transferred': return 'var(--accent-info)'
      default: return 'var(--text-muted)'
    }
  }

  const getAttendanceColor = (status: 'present' | 'absent' | 'sick' | 'vacation') => {
    switch (status) {
      case 'present': return 'var(--accent-secondary)'
      case 'absent': return 'var(--accent-danger)'
      case 'sick': return 'var(--accent-warning)'
      case 'vacation': return 'var(--accent-info)'
      default: return 'var(--text-muted)'
    }
  }

  const roles = Array.from(new Set(siteEmployees.map(e => e.role)))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Site Employees</h3>
        {sitePermissions.canManageTeam() && (
          <button onClick={() => setShowEmployeeModal(true)} className="btn-primary btn-sm">
            👥 Add Employee
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--accent-secondary-light)',
          border: '1px solid var(--accent-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
            {siteEmployees.filter(e => e.status === 'active').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active</div>
        </div>
        <div style={{
          background: 'var(--accent-warning-light)',
          border: '1px solid var(--accent-warning)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-warning)' }}>
            {siteEmployees.filter(e => e.status === 'inactive').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inactive</div>
        </div>
        <div style={{
          background: 'var(--accent-info-light)',
          border: '1px solid var(--accent-info)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-info)' }}>
            {roles.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Roles</div>
        </div>
        <div style={{
          background: 'var(--accent-primary-light)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {siteEmployees.reduce((sum, e) => sum + e.hourlyRate, 0).toFixed(0)} LYD
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Hourly Cost</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      {/* Employees List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredEmployees.map(employee => {
          const todayAttendance = employee.attendance.find(a => a.date === new Date().toISOString().split('T')[0])
          const weeklyHours = employee.attendance
            .filter(a => {
              const date = new Date(a.date)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return date >= weekAgo
            })
            .reduce((sum, a) => sum + a.hoursWorked, 0)

          return (
            <div key={employee.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      margin: 0, 
                      color: 'var(--text-primary)' 
                    }}>
                      {employee.employeeName}
                    </h4>
                    <span className="badge badge-primary">
                      {employee.employeeId}
                    </span>
                    <span style={{
                      background: getStatusColor(employee.status),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {employee.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <span>👷 {employee.role}</span>
                    <span>🏢 {employee.department}</span>
                    <span>💰 {employee.hourlyRate} LYD/hour</span>
                    <span>📅 Since {new Date(employee.assignedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {sitePermissions.canView('employees') && (
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee)
                        setShowAttendanceModal(true)
                      }}
                      className="btn-outline btn-sm"
                    >
                      📊 Attendance
                    </button>
                  )}
                  {sitePermissions.canManageTeam() && (
                    <button
                      onClick={() => {
                        setEditingEmployee(employee)
                        setShowEmployeeModal(true)
                      }}
                      className="btn-ghost btn-sm"
                    >
                      ✏️
                    </button>
                  )}
                  {sitePermissions.canManageTeam() && (
                    <button
                      onClick={() => handleRemoveEmployee(employee.id)}
                      style={{
                        background: 'var(--accent-danger-light)',
                        color: 'var(--accent-danger)',
                        border: '1px solid var(--accent-danger)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Daily Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Today</div>
                  <div style={{ 
                    color: todayAttendance ? getAttendanceColor(todayAttendance.status) : 'var(--text-muted)',
                    fontWeight: '600'
                  }}>
                    {todayAttendance ? (
                      `${todayAttendance.hoursWorked}h (${todayAttendance.status})`
                    ) : (
                      'No data'
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Weekly Hours</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {weeklyHours}h
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Weekly Pay</div>
                  <div style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>
                    {(weeklyHours * employee.hourlyRate).toFixed(0)} LYD
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</div>
                  <select
                    value={employee.status}
                    onChange={(e) => handleUpdateStatus(employee.id, e.target.value as SiteEmployee['status'])}
                    style={{
                      padding: '2px 6px',
                      fontSize: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-primary)'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3>No employees found</h3>
          <p>Add employees to this site or adjust your search criteria</p>
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={editingEmployee ? handleEditEmployee : handleAddEmployee}
          onCancel={() => {
            setShowEmployeeModal(false)
            setEditingEmployee(null)
          }}
        />
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedEmployee && (
        <AttendanceModal
          employee={selectedEmployee}
          onSave={(attendance) => {
            addAttendance(selectedEmployee.id, attendance)
            setShowAttendanceModal(false)
          }}
          onCancel={() => {
            setShowAttendanceModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}
    </div>
  )
}

function SiteEquipment({ site }: { site: Site }) {
  const [siteEquipment, setSiteEquipment] = useState<SiteEquipment[]>([])
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<SiteEquipment | null>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<SiteEquipment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')

  // Load site equipment
  useEffect(() => {
    const savedEquipment = localStorage.getItem(`site_equipment_${site.id}`)
    if (savedEquipment) {
      setSiteEquipment(JSON.parse(savedEquipment))
    } else {
      // Sample data for demonstration
      const sampleEquipment: SiteEquipment[] = [
        {
          id: '1',
          siteId: site.id,
          name: 'Excavator CAT 320',
          type: 'Heavy Machinery',
          serialNumber: 'CAT320-2024-001',
          status: 'operational',
          assignedDate: '2024-01-15',
          dailyRate: 850,
          lastMaintenance: '2024-08-15',
          nextMaintenance: '2024-11-15',
          condition: 'excellent'
        },
        {
          id: '2',
          siteId: site.id,
          name: 'Concrete Mixer Truck',
          type: 'Vehicle',
          serialNumber: 'CMT-2024-007',
          status: 'operational',
          assignedDate: '2024-02-01',
          dailyRate: 450,
          lastMaintenance: '2024-07-20',
          nextMaintenance: '2024-10-20',
          condition: 'good'
        },
        {
          id: '3',
          siteId: site.id,
          name: 'Tower Crane TC7032',
          type: 'Crane',
          serialNumber: 'TC7032-2023-045',
          status: 'maintenance',
          assignedDate: '2024-01-10',
          dailyRate: 1200,
          lastMaintenance: '2024-08-20',
          nextMaintenance: '2024-09-20',
          condition: 'fair'
        },
        {
          id: '4',
          siteId: site.id,
          name: 'Welding Equipment Set',
          type: 'Tools',
          serialNumber: 'WES-2024-012',
          status: 'operational',
          assignedDate: '2024-03-01',
          dailyRate: 120,
          lastMaintenance: '2024-08-01',
          nextMaintenance: '2024-11-01',
          condition: 'good'
        }
      ]
      setSiteEquipment(sampleEquipment)
      localStorage.setItem(`site_equipment_${site.id}`, JSON.stringify(sampleEquipment))
    }
  }, [site.id])

  const saveEquipment = (equipment: SiteEquipment[]) => {
    setSiteEquipment(equipment)
    localStorage.setItem(`site_equipment_${site.id}`, JSON.stringify(equipment))
  }

  const handleAddEquipment = (equipmentData: Partial<SiteEquipment>) => {
    const newEquipment: SiteEquipment = {
      id: Date.now().toString(),
      siteId: site.id,
      name: equipmentData.name || '',
      type: equipmentData.type || '',
      serialNumber: equipmentData.serialNumber || '',
      status: 'operational',
      assignedDate: equipmentData.assignedDate || new Date().toISOString().split('T')[0],
      dailyRate: equipmentData.dailyRate || 0,
      lastMaintenance: equipmentData.lastMaintenance || '',
      nextMaintenance: equipmentData.nextMaintenance || '',
      condition: equipmentData.condition || 'good'
    }
    saveEquipment([...siteEquipment, newEquipment])
    setShowEquipmentModal(false)
  }

  const handleEditEquipment = (equipmentData: Partial<SiteEquipment>) => {
    if (!editingEquipment) return
    const updatedEquipment = { ...editingEquipment, ...equipmentData }
    saveEquipment(siteEquipment.map(e => e.id === editingEquipment.id ? updatedEquipment : e))
    setEditingEquipment(null)
    setShowEquipmentModal(false)
  }

  const handleRemoveEquipment = (equipmentId: string) => {
    if (confirm('Are you sure you want to remove this equipment from the site?')) {
      saveEquipment(siteEquipment.filter(e => e.id !== equipmentId))
    }
  }

  const handleUpdateStatus = (equipmentId: string, status: SiteEquipment['status']) => {
    saveEquipment(siteEquipment.map(e => e.id === equipmentId ? { ...e, status } : e))
  }

  const handleMaintenanceUpdate = (equipmentId: string, lastMaintenance: string, nextMaintenance: string) => {
    saveEquipment(siteEquipment.map(e => 
      e.id === equipmentId 
        ? { ...e, lastMaintenance, nextMaintenance, status: 'operational' }
        : e
    ))
  }

  const filteredEquipment = siteEquipment.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || equipment.type === typeFilter
    const matchesStatus = statusFilter === 'all' || equipment.status === statusFilter
    const matchesCondition = conditionFilter === 'all' || equipment.condition === conditionFilter
    return matchesSearch && matchesType && matchesStatus && matchesCondition
  })

  const getStatusColor = (status: SiteEquipment['status']) => {
    switch (status) {
      case 'operational': return 'var(--accent-secondary)'
      case 'maintenance': return 'var(--accent-warning)'
      case 'repair': return 'var(--accent-danger)'
      case 'retired': return 'var(--text-muted)'
      default: return 'var(--text-muted)'
    }
  }

  const getConditionColor = (condition: SiteEquipment['condition']) => {
    switch (condition) {
      case 'excellent': return 'var(--accent-secondary)'
      case 'good': return 'var(--accent-info)'
      case 'fair': return 'var(--accent-warning)'
      case 'poor': return 'var(--accent-danger)'
      default: return 'var(--text-muted)'
    }
  }

  const isMaintenanceDue = (nextMaintenance: string) => {
    const today = new Date()
    const maintenanceDate = new Date(nextMaintenance)
    const diffDays = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diffDays <= 7
  }

  const types = Array.from(new Set(siteEquipment.map(e => e.type)))
  const totalDailyCost = siteEquipment.filter(e => e.status === 'operational').reduce((sum, e) => sum + e.dailyRate, 0)
  const maintenanceDueCount = siteEquipment.filter(e => isMaintenanceDue(e.nextMaintenance)).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Site Equipment</h3>
        <button onClick={() => setShowEquipmentModal(true)} className="btn-primary btn-sm">
          🚜 Add Equipment
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--accent-secondary-light)',
          border: '1px solid var(--accent-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
            {siteEquipment.filter(e => e.status === 'operational').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Operational</div>
        </div>
        <div style={{
          background: 'var(--accent-warning-light)',
          border: '1px solid var(--accent-warning)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-warning)' }}>
            {maintenanceDueCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Maintenance Due</div>
        </div>
        <div style={{
          background: 'var(--accent-info-light)',
          border: '1px solid var(--accent-info)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-info)' }}>
            {types.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Equipment Types</div>
        </div>
        <div style={{
          background: 'var(--accent-primary-light)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {totalDailyCost.toFixed(0)} LYD
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Cost</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Status</option>
          <option value="operational">Operational</option>
          <option value="maintenance">Maintenance</option>
          <option value="repair">Repair</option>
          <option value="retired">Retired</option>
        </select>
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Conditions</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
      </div>

      {/* Equipment List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredEquipment.map(equipment => {
          const maintenanceDue = isMaintenanceDue(equipment.nextMaintenance)
          const daysSinceLastMaintenance = Math.ceil((new Date().getTime() - new Date(equipment.lastMaintenance).getTime()) / (1000 * 3600 * 24))

          return (
            <div key={equipment.id} className="card" style={{ padding: '20px', position: 'relative' }}>
              {maintenanceDue && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--accent-warning)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  MAINTENANCE DUE
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      margin: 0, 
                      color: 'var(--text-primary)' 
                    }}>
                      {equipment.name}
                    </h4>
                    <span className="badge badge-primary">
                      {equipment.serialNumber}
                    </span>
                    <span style={{
                      background: getStatusColor(equipment.status),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {equipment.status}
                    </span>
                    <span style={{
                      background: getConditionColor(equipment.condition),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {equipment.condition}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <span>🏷️ {equipment.type}</span>
                    <span>💰 {equipment.dailyRate} LYD/day</span>
                    <span>📅 Assigned {new Date(equipment.assignedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setSelectedEquipment(equipment)
                      setShowMaintenanceModal(true)
                    }}
                    className="btn-outline btn-sm"
                  >
                    🔧 Maintenance
                  </button>
                  <button
                    onClick={() => {
                      setEditingEquipment(equipment)
                      setShowEquipmentModal(true)
                    }}
                    className="btn-ghost btn-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRemoveEquipment(equipment.id)}
                    style={{
                      background: 'var(--accent-danger-light)',
                      color: 'var(--accent-danger)',
                      border: '1px solid var(--accent-danger)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Maintenance Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                padding: '16px',
                background: maintenanceDue ? 'var(--accent-warning-light)' : 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Last Maintenance</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {equipment.lastMaintenance ? new Date(equipment.lastMaintenance).toLocaleDateString() : 'N/A'}
                  </div>
                  {equipment.lastMaintenance && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {daysSinceLastMaintenance} days ago
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Next Maintenance</div>
                  <div style={{ 
                    color: maintenanceDue ? 'var(--accent-warning)' : 'var(--text-primary)', 
                    fontWeight: '600' 
                  }}>
                    {equipment.nextMaintenance ? new Date(equipment.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</div>
                  <select
                    value={equipment.status}
                    onChange={(e) => handleUpdateStatus(equipment.id, e.target.value as SiteEquipment['status'])}
                    style={{
                      padding: '2px 6px',
                      fontSize: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-primary)'
                    }}
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Monthly Cost</div>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                    {(equipment.dailyRate * 30).toFixed(0)} LYD
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚜</div>
          <h3>No equipment found</h3>
          <p>Add equipment to this site or adjust your search criteria</p>
        </div>
      )}

      {/* Equipment Modal */}
      {showEquipmentModal && (
        <EquipmentModal
          equipment={editingEquipment}
          onSave={editingEquipment ? handleEditEquipment : handleAddEquipment}
          onCancel={() => {
            setShowEquipmentModal(false)
            setEditingEquipment(null)
          }}
        />
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && selectedEquipment && (
        <MaintenanceModal
          equipment={selectedEquipment}
          onSave={(lastMaintenance, nextMaintenance) => {
            handleMaintenanceUpdate(selectedEquipment.id, lastMaintenance, nextMaintenance)
            setShowMaintenanceModal(false)
          }}
          onCancel={() => {
            setShowMaintenanceModal(false)
            setSelectedEquipment(null)
          }}
        />
      )}
    </div>
  )
}

// Equipment Modal Component
function EquipmentModal({ 
  equipment, 
  onSave, 
  onCancel 
}: { 
  equipment: SiteEquipment | null
  onSave: (equipment: Partial<SiteEquipment>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: equipment?.name || '',
    type: equipment?.type || '',
    serialNumber: equipment?.serialNumber || '',
    dailyRate: equipment?.dailyRate || 0,
    assignedDate: equipment?.assignedDate || new Date().toISOString().split('T')[0],
    lastMaintenance: equipment?.lastMaintenance || '',
    nextMaintenance: equipment?.nextMaintenance || '',
    condition: equipment?.condition || 'good'
  })

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 1000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API call
        onSave(formData)
      } catch (error) {
        console.error('Error saving equipment:', error)
        throw error
      }
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
          {equipment ? 'Edit Equipment' : 'Add Equipment'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Equipment Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%' }}
                placeholder="e.g. Excavator CAT 320"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Type *
              </label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                style={{ width: '100%' }}
                placeholder="e.g. Heavy Machinery, Vehicle, Tools"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                style={{ width: '100%' }}
                placeholder="e.g. CAT320-2024-001"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Daily Rate (LYD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="10"
                value={formData.dailyRate}
                onChange={(e) => setFormData({...formData, dailyRate: Number(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Assigned Date *
              </label>
              <input
                type="date"
                required
                value={formData.assignedDate}
                onChange={(e) => setFormData({...formData, assignedDate: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Last Maintenance
              </label>
              <input
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({...formData, lastMaintenance: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Next Maintenance
              </label>
              <input
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value as SiteEquipment['condition']})}
              style={{ width: '100%' }}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> {equipment ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                equipment ? 'Update Equipment' : 'Add Equipment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Maintenance Modal Component
function MaintenanceModal({ 
  equipment, 
  onSave, 
  onCancel 
}: { 
  equipment: SiteEquipment
  onSave: (lastMaintenance: string, nextMaintenance: string) => void
  onCancel: () => void 
}) {
  const today = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    lastMaintenance: today,
    nextMaintenance: '',
    maintenanceType: 'routine',
    notes: '',
    cost: 0
  })

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 1000
  })

  // Auto-calculate next maintenance date (3 months from last)
  useEffect(() => {
    if (formData.lastMaintenance) {
      const lastDate = new Date(formData.lastMaintenance)
      const nextDate = new Date(lastDate)
      nextDate.setMonth(nextDate.getMonth() + 3)
      setFormData(prev => ({...prev, nextMaintenance: nextDate.toISOString().split('T')[0]}))
    }
  }, [formData.lastMaintenance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API call
        onSave(formData.lastMaintenance, formData.nextMaintenance)
      } catch (error) {
        console.error('Error recording maintenance:', error)
        throw error
      }
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Record Maintenance
          </h2>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {equipment.name}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Maintenance Date *
              </label>
              <input
                type="date"
                required
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({...formData, lastMaintenance: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Next Maintenance *
              </label>
              <input
                type="date"
                required
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Maintenance Type
              </label>
              <select
                value={formData.maintenanceType}
                onChange={(e) => setFormData({...formData, maintenanceType: e.target.value})}
                style={{ width: '100%' }}
              >
                <option value="routine">Routine Maintenance</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="upgrade">Upgrade</option>
                <option value="emergency">Emergency Fix</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Cost (LYD)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Maintenance Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Describe the maintenance work performed..."
            />
          </div>

          {/* Summary */}
          <div style={{
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Maintenance Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Equipment</div>
                <div>{equipment.name}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Type</div>
                <div style={{ textTransform: 'capitalize' }}>{formData.maintenanceType}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Cost</div>
                <div style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                  {formData.cost.toFixed(0)} LYD
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Next Due</div>
                <div>{formData.nextMaintenance ? new Date(formData.nextMaintenance).toLocaleDateString() : 'Not set'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> Recording...
                </span>
              ) : (
                'Record Maintenance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SiteExpenses({ site }: { site: Site }) {
  const [siteExpenses, setSiteExpenses] = useState<SiteExpense[]>([])
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<SiteExpense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  // Load site expenses
  useEffect(() => {
    const savedExpenses = localStorage.getItem(`site_expenses_${site.id}`)
    if (savedExpenses) {
      setSiteExpenses(JSON.parse(savedExpenses))
    } else {
      // Sample data for demonstration
      const sampleExpenses: SiteExpense[] = [
        {
          id: '1',
          siteId: site.id,
          category: 'materials',
          description: 'Concrete delivery - Foundation phase',
          amount: 45000,
          date: '2024-08-20',
          status: 'approved',
          submittedBy: 'Ahmed Hassan',
          approvedBy: 'Fatima Al-Zahra',
          approvedDate: '2024-08-21',
          attachments: ['receipt_concrete.pdf']
        },
        {
          id: '2',
          siteId: site.id,
          category: 'labor',
          description: 'Weekly wages for construction crew',
          amount: 28000,
          date: '2024-08-18',
          status: 'paid',
          submittedBy: 'Ahmed Hassan',
          approvedBy: 'Fatima Al-Zahra',
          approvedDate: '2024-08-19',
          attachments: []
        },
        {
          id: '3',
          siteId: site.id,
          category: 'equipment',
          description: 'Crane rental - Daily rate',
          amount: 1200,
          date: '2024-08-22',
          status: 'submitted',
          submittedBy: 'Omar Al-Rashid',
          attachments: ['crane_invoice.pdf']
        },
        {
          id: '4',
          siteId: site.id,
          category: 'permits',
          description: 'Building permit renewal',
          amount: 2500,
          date: '2024-08-15',
          status: 'approved',
          submittedBy: 'Fatima Al-Zahra',
          approvedBy: 'Ahmad Mansour',
          approvedDate: '2024-08-16',
          attachments: ['permit_receipt.pdf']
        },
        {
          id: '5',
          siteId: site.id,
          category: 'utilities',
          description: 'Electricity connection fee',
          amount: 3200,
          date: '2024-08-10',
          status: 'rejected',
          submittedBy: 'Omar Al-Rashid',
          attachments: []
        }
      ]
      setSiteExpenses(sampleExpenses)
      localStorage.setItem(`site_expenses_${site.id}`, JSON.stringify(sampleExpenses))
    }
  }, [site.id])

  const saveExpenses = (expenses: SiteExpense[]) => {
    setSiteExpenses(expenses)
    localStorage.setItem(`site_expenses_${site.id}`, JSON.stringify(expenses))
  }

  const handleAddExpense = (expenseData: Partial<SiteExpense>) => {
    const newExpense: SiteExpense = {
      id: Date.now().toString(),
      siteId: site.id,
      category: expenseData.category || 'other',
      description: expenseData.description || '',
      amount: expenseData.amount || 0,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      status: 'draft',
      submittedBy: 'Current User', // In real app, get from auth
      attachments: expenseData.attachments || []
    }
    saveExpenses([...siteExpenses, newExpense])
    setShowExpenseModal(false)
  }

  const handleEditExpense = (expenseData: Partial<SiteExpense>) => {
    if (!editingExpense) return
    const updatedExpense = { ...editingExpense, ...expenseData }
    saveExpenses(siteExpenses.map(e => e.id === editingExpense.id ? updatedExpense : e))
    setEditingExpense(null)
    setShowExpenseModal(false)
  }

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      saveExpenses(siteExpenses.filter(e => e.id !== expenseId))
    }
  }

  const handleUpdateStatus = (expenseId: string, status: SiteExpense['status']) => {
    const currentUser = 'Current User' // In real app, get from auth
    const updateData: Partial<SiteExpense> = { status }
    
    if (status === 'approved') {
      updateData.approvedBy = currentUser
      updateData.approvedDate = new Date().toISOString().split('T')[0]
    } else if (status === 'submitted') {
      updateData.approvedBy = undefined
      updateData.approvedDate = undefined
    }

    saveExpenses(siteExpenses.map(e => 
      e.id === expenseId ? { ...e, ...updateData } : e
    ))
  }

  const filteredExpenses = siteExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
    
    let matchesDate = true
    if (dateRange === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(expense.date) >= weekAgo
    } else if (dateRange === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(expense.date) >= monthAgo
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesDate
  })

  const getStatusColor = (status: SiteExpense['status']) => {
    switch (status) {
      case 'draft': return 'var(--text-muted)'
      case 'submitted': return 'var(--accent-info)'
      case 'approved': return 'var(--accent-secondary)'
      case 'rejected': return 'var(--accent-danger)'
      case 'paid': return 'var(--accent-primary)'
      default: return 'var(--text-muted)'
    }
  }

  const getCategoryIcon = (category: SiteExpense['category']) => {
    switch (category) {
      case 'labor': return '👷'
      case 'materials': return '🧱'
      case 'equipment': return '🚜'
      case 'subcontractors': return '🏗️'
      case 'permits': return '📋'
      case 'utilities': return '⚡'
      case 'other': return '📦'
      default: return '📦'
    }
  }

  const totalExpenses = siteExpenses.reduce((sum, e) => sum + e.amount, 0)
  const approvedExpenses = siteExpenses.filter(e => e.status === 'approved' || e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = siteExpenses.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.amount, 0)
  const budgetUsed = (approvedExpenses / site.budget) * 100
  const categories = Array.from(new Set(siteExpenses.map(e => e.category)))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Site Expenses</h3>
        <button onClick={() => setShowExpenseModal(true)} className="btn-primary btn-sm">
          💰 Add Expense
        </button>
      </div>

      {/* Budget Overview */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Budget Overview</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {approvedExpenses.toLocaleString()} LYD of {site.budget.toLocaleString()} LYD
            </span>
          </div>
          <div className="progress" style={{ height: '12px' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(budgetUsed, 100)}%`,
                background: budgetUsed > 90 ? 'var(--accent-danger)' : budgetUsed > 75 ? 'var(--accent-warning)' : 'var(--accent-primary)'
              }} 
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {budgetUsed.toFixed(1)}% of budget used
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {totalExpenses.toLocaleString()} LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Expenses</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
              {approvedExpenses.toLocaleString()} LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Approved</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-info)' }}>
              {pendingExpenses.toLocaleString()} LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-warning)' }}>
              {(site.budget - approvedExpenses).toLocaleString()} LYD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Remaining</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Expenses List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredExpenses.map(expense => {
          const isEditable = expense.status === 'draft' || expense.status === 'rejected'
          const canApprove = expense.status === 'submitted'
          const isPaid = expense.status === 'paid'
          
          return (
            <div key={expense.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getCategoryIcon(expense.category)}</span>
                    <h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      margin: 0, 
                      color: 'var(--text-primary)' 
                    }}>
                      {expense.description}
                    </h4>
                    <span style={{
                      background: getStatusColor(expense.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {expense.status}
                    </span>
                    {isPaid && (
                      <span style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        PAID
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <span>💰 {expense.amount.toLocaleString()} LYD</span>
                    <span>📅 {new Date(expense.date).toLocaleDateString()}</span>
                    <span>👤 {expense.submittedBy}</span>
                    <span>🏷️ {expense.category}</span>
                    {expense.attachments.length > 0 && (
                      <span>📎 {expense.attachments.length} file(s)</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(expense.id, 'approved')}
                        className="btn-success btn-sm"
                        style={{
                          background: 'var(--accent-secondary)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(expense.id, 'rejected')}
                        style={{
                          background: 'var(--accent-danger)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {expense.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(expense.id, 'paid')}
                      className="btn-primary btn-sm"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      💳 Mark Paid
                    </button>
                  )}
                  {expense.status === 'draft' && (
                    <button
                      onClick={() => handleUpdateStatus(expense.id, 'submitted')}
                      className="btn-info btn-sm"
                      style={{
                        background: 'var(--accent-info)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      📤 Submit
                    </button>
                  )}
                  {isEditable && (
                    <button
                      onClick={() => {
                        setEditingExpense(expense)
                        setShowExpenseModal(true)
                      }}
                      className="btn-ghost btn-sm"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    style={{
                      background: 'var(--accent-danger-light)',
                      color: 'var(--accent-danger)',
                      border: '1px solid var(--accent-danger)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Approval Info */}
              {(expense.status === 'approved' || expense.status === 'paid' || expense.status === 'rejected') && (
                <div style={{
                  padding: '12px 16px',
                  background: expense.status === 'rejected' ? 'var(--accent-danger-light)' : 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  border: expense.status === 'rejected' ? '1px solid var(--accent-danger)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {expense.status === 'rejected' ? (
                        <span style={{ color: 'var(--accent-danger)', fontWeight: '600' }}>Rejected by {expense.approvedBy || 'Unknown'}</span>
                      ) : (
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>Approved by {expense.approvedBy}</span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {expense.approvedDate && new Date(expense.approvedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {expense.attachments.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Attachments:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {expense.attachments.map((attachment, index) => (
                      <span key={index} style={{
                        background: 'var(--accent-info-light)',
                        color: 'var(--accent-info)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        📎 {attachment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredExpenses.length === 0 && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
          <h3>No expenses found</h3>
          <p>Add expenses to track project costs or adjust your search criteria</p>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          expense={editingExpense}
          onSave={editingExpense ? handleEditExpense : handleAddExpense}
          onCancel={() => {
            setShowExpenseModal(false)
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}

// Expense Modal Component
function ExpenseModal({ 
  expense, 
  onSave, 
  onCancel 
}: { 
  expense: SiteExpense | null
  onSave: (expense: Partial<SiteExpense>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    category: expense?.category || 'materials',
    description: expense?.description || '',
    amount: expense?.amount || 0,
    date: expense?.date || new Date().toISOString().split('T')[0],
    attachments: expense?.attachments || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const getCategoryIcon = (category: SiteExpense['category']) => {
    switch (category) {
      case 'labor': return '👷'
      case 'materials': return '🧱'
      case 'equipment': return '🚜'
      case 'subcontractors': return '🏗️'
      case 'permits': return '📋'
      case 'utilities': return '⚡'
      case 'other': return '📦'
      default: return '📦'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '550px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as SiteExpense['category']})}
                style={{ width: '100%', padding: '8px 12px' }}
                required
              >
                <option value="materials">{getCategoryIcon('materials')} Materials</option>
                <option value="labor">{getCategoryIcon('labor')} Labor</option>
                <option value="equipment">{getCategoryIcon('equipment')} Equipment</option>
                <option value="subcontractors">{getCategoryIcon('subcontractors')} Subcontractors</option>
                <option value="permits">{getCategoryIcon('permits')} Permits</option>
                <option value="utilities">{getCategoryIcon('utilities')} Utilities</option>
                <option value="other">{getCategoryIcon('other')} Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Amount (LYD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="10"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Describe the expense item and purpose..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          {/* Category-specific guidance */}
          <div style={{
            padding: '12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>{getCategoryIcon(formData.category)}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {formData.category?.charAt(0)?.toUpperCase() + (formData.category?.slice(1) || '') || 'Unknown'} Expense
              </span>
            </div>
            {formData.category === 'materials' && (
              <p style={{ margin: 0 }}>Include material type, quantity, supplier information, and delivery details.</p>
            )}
            {formData.category === 'labor' && (
              <p style={{ margin: 0 }}>Specify the work performed, number of workers, hours/days, and hourly rates.</p>
            )}
            {formData.category === 'equipment' && (
              <p style={{ margin: 0 }}>List equipment rented/purchased, duration, daily/monthly rates, and operational costs.</p>
            )}
            {formData.category === 'subcontractors' && (
              <p style={{ margin: 0 }}>Detail subcontractor name, scope of work, contract value, and payment terms.</p>
            )}
            {formData.category === 'permits' && (
              <p style={{ margin: 0 }}>Include permit type, issuing authority, validity period, and renewal requirements.</p>
            )}
            {formData.category === 'utilities' && (
              <p style={{ margin: 0 }}>Specify utility type (electricity, water, gas), consumption period, and meter readings.</p>
            )}
            {formData.category === 'other' && (
              <p style={{ margin: 0 }}>Provide detailed explanation of the expense and its relationship to the project.</p>
            )}
          </div>

          {/* Expense Summary */}
          <div style={{
            padding: '16px',
            background: 'var(--accent-primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--accent-primary)' }}>
              Expense Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Category</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{getCategoryIcon(formData.category)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{formData.category}</span>
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Amount</div>
                <div style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>
                  {formData.amount.toLocaleString()} LYD
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Date</div>
                <div>{formData.date ? new Date(formData.date).toLocaleDateString() : 'Not set'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</div>
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {expense ? 'Will remain ' + expense.status : 'Will be saved as draft'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {expense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SiteProgress({ site }: { site: Site }) {
  const [siteMilestones, setSiteMilestones] = useState<SiteMilestone[]>([])
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<SiteMilestone | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards')

  // Load site milestones
  useEffect(() => {
    const savedMilestones = localStorage.getItem(`site_milestones_${site.id}`)
    if (savedMilestones) {
      setSiteMilestones(JSON.parse(savedMilestones))
    } else {
      // Sample data for demonstration
      const sampleMilestones: SiteMilestone[] = [
        {
          id: '1',
          siteId: site.id,
          title: 'Foundation Complete',
          description: 'Complete excavation and concrete foundation work',
          targetDate: '2024-03-15',
          completedDate: '2024-03-12',
          status: 'completed',
          progress: 100,
          dependencies: []
        },
        {
          id: '2',
          siteId: site.id,
          title: 'Structural Framework',
          description: 'Erect main building structure and framework',
          targetDate: '2024-05-20',
          completedDate: '2024-05-18',
          status: 'completed',
          progress: 100,
          dependencies: ['1']
        },
        {
          id: '3',
          siteId: site.id,
          title: 'Roofing and Exterior',
          description: 'Install roofing system and exterior cladding',
          targetDate: '2024-07-10',
          status: 'in-progress',
          progress: 75,
          dependencies: ['2']
        },
        {
          id: '4',
          siteId: site.id,
          title: 'Interior Systems',
          description: 'Install plumbing, electrical, and HVAC systems',
          targetDate: '2024-09-15',
          status: 'pending',
          progress: 0,
          dependencies: ['3']
        },
        {
          id: '5',
          siteId: site.id,
          title: 'Finishing Work',
          description: 'Interior finishing, painting, and final touches',
          targetDate: '2024-11-30',
          status: 'pending',
          progress: 0,
          dependencies: ['4']
        },
        {
          id: '6',
          siteId: site.id,
          title: 'Final Inspection',
          description: 'Building inspection and occupancy permit',
          targetDate: '2024-12-20',
          status: 'pending',
          progress: 0,
          dependencies: ['5']
        }
      ]
      setSiteMilestones(sampleMilestones)
      localStorage.setItem(`site_milestones_${site.id}`, JSON.stringify(sampleMilestones))
    }
  }, [site.id])

  const saveMilestones = (milestones: SiteMilestone[]) => {
    setSiteMilestones(milestones)
    localStorage.setItem(`site_milestones_${site.id}`, JSON.stringify(milestones))
  }

  const handleAddMilestone = (milestoneData: Partial<SiteMilestone>) => {
    const newMilestone: SiteMilestone = {
      id: Date.now().toString(),
      siteId: site.id,
      title: milestoneData.title || '',
      description: milestoneData.description || '',
      targetDate: milestoneData.targetDate || '',
      status: 'pending',
      progress: 0,
      dependencies: milestoneData.dependencies || []
    }
    saveMilestones([...siteMilestones, newMilestone])
    setShowMilestoneModal(false)
  }

  const handleEditMilestone = (milestoneData: Partial<SiteMilestone>) => {
    if (!editingMilestone) return
    const updatedMilestone = { ...editingMilestone, ...milestoneData }
    saveMilestones(siteMilestones.map(m => m.id === editingMilestone.id ? updatedMilestone : m))
    setEditingMilestone(null)
    setShowMilestoneModal(false)
  }

  const handleDeleteMilestone = (milestoneId: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      saveMilestones(siteMilestones.filter(m => m.id !== milestoneId))
    }
  }

  const handleUpdateProgress = (milestoneId: string, progress: number) => {
    const updatedMilestone = siteMilestones.find(m => m.id === milestoneId)
    if (!updatedMilestone) return

    let status: SiteMilestone['status'] = 'pending'
    if (progress > 0 && progress < 100) {
      status = 'in-progress'
    } else if (progress === 100) {
      status = 'completed'
      updatedMilestone.completedDate = new Date().toISOString().split('T')[0]
    }

    saveMilestones(siteMilestones.map(m => 
      m.id === milestoneId 
        ? { ...m, progress, status, completedDate: status === 'completed' ? updatedMilestone.completedDate : m.completedDate }
        : m
    ))
  }

  const filteredMilestones = siteMilestones.filter(milestone => {
    const matchesSearch = milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || milestone.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: SiteMilestone['status']) => {
    switch (status) {
      case 'pending': return 'var(--text-muted)'
      case 'in-progress': return 'var(--accent-info)'
      case 'completed': return 'var(--accent-secondary)'
      case 'overdue': return 'var(--accent-danger)'
      default: return 'var(--text-muted)'
    }
  }

  const isOverdue = (targetDate: string, status: SiteMilestone['status']) => {
    if (status === 'completed') return false
    const today = new Date()
    const target = new Date(targetDate)
    return target < today
  }

  // Update overdue status
  useEffect(() => {
    const updated = siteMilestones.map(milestone => ({
      ...milestone,
      status: isOverdue(milestone.targetDate, milestone.status) && milestone.status !== 'completed' 
        ? 'overdue' as SiteMilestone['status']
        : milestone.status
    }))
    
    const hasChanges = updated.some((milestone, index) => milestone.status !== siteMilestones[index].status)
    if (hasChanges) {
      saveMilestones(updated)
    }
  }, [siteMilestones])

  const completedCount = siteMilestones.filter(m => m.status === 'completed').length
  const inProgressCount = siteMilestones.filter(m => m.status === 'in-progress').length
  const overdueCount = siteMilestones.filter(m => m.status === 'overdue').length
  const overallProgress = siteMilestones.length > 0 
    ? Math.round(siteMilestones.reduce((sum, m) => sum + m.progress, 0) / siteMilestones.length)
    : 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Site Progress</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'cards' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'cards' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📊 Cards
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'timeline' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'timeline' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📅 Timeline
            </button>
          </div>
          <button onClick={() => setShowMilestoneModal(true)} className="btn-primary btn-sm">
            📈 Add Milestone
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Overall Project Progress</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {overallProgress}%
            </span>
          </div>
          <div className="progress" style={{ height: '12px' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${overallProgress}%`,
                background: overallProgress === 100 ? 'var(--accent-secondary)' : 'var(--accent-primary)'
              }} 
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {completedCount} of {siteMilestones.length} milestones completed
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
              {completedCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-info)' }}>
              {inProgressCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-danger)' }}>
              {overdueCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-muted)' }}>
              {siteMilestones.filter(m => m.status === 'pending').length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search milestones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Milestones View */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredMilestones.map((milestone, index) => {
            const isLast = index === filteredMilestones.length - 1
            const daysUntilTarget = Math.ceil((new Date(milestone.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            
            return (
              <div key={milestone.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                {milestone.status === 'overdue' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'var(--accent-danger)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    OVERDUE
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {index + 1}
                      </span>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        margin: 0, 
                        color: 'var(--text-primary)' 
                      }}>
                        {milestone.title}
                      </h4>
                      <span style={{
                        background: getStatusColor(milestone.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {milestone.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)', 
                      margin: '0 0 12px 0'
                    }}>
                      {milestone.description}
                    </p>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>🎯 Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                      {milestone.completedDate && (
                        <span>✅ Completed: {new Date(milestone.completedDate).toLocaleDateString()}</span>
                      )}
                      {!milestone.completedDate && daysUntilTarget > 0 && (
                        <span>⏳ {daysUntilTarget} days remaining</span>
                      )}
                      {milestone.dependencies.length > 0 && (
                        <span>🔗 {milestone.dependencies.length} dependencies</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingMilestone(milestone)
                        setShowMilestoneModal(true)
                      }}
                      className="btn-ghost btn-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      style={{
                        background: 'var(--accent-danger-light)',
                        color: 'var(--accent-danger)',
                        border: '1px solid var(--accent-danger)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '6px' 
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                      {milestone.progress}%
                    </span>
                  </div>
                  <div className="progress" style={{ marginBottom: '8px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${milestone.progress}%`,
                        background: milestone.status === 'completed' ? 'var(--accent-secondary)' : 'var(--accent-primary)'
                      }} 
                    />
                  </div>
                  {milestone.status !== 'completed' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={milestone.progress}
                        onChange={(e) => handleUpdateProgress(milestone.id, parseInt(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={milestone.progress}
                        onChange={(e) => handleUpdateProgress(milestone.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        style={{ width: '60px', padding: '2px 6px', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Timeline View */
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ position: 'relative' }}>
            {filteredMilestones.map((milestone, index) => {
              const isLast = index === filteredMilestones.length - 1
              
              return (
                <div key={milestone.id} style={{ display: 'flex', marginBottom: isLast ? '0' : '32px' }}>
                  {/* Timeline Line */}
                  <div style={{ 
                    width: '24px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    marginRight: '20px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: getStatusColor(milestone.status),
                      border: '3px solid white',
                      boxShadow: '0 0 0 2px ' + getStatusColor(milestone.status),
                      zIndex: 1
                    }} />
                    {!isLast && (
                      <div style={{
                        width: '2px',
                        height: '60px',
                        background: 'var(--border-light)',
                        marginTop: '4px'
                      }} />
                    )}
                  </div>
                  
                  {/* Milestone Content */}
                  <div style={{ flex: 1, paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          margin: '0 0 4px 0', 
                          color: 'var(--text-primary)' 
                        }}>
                          {milestone.title}
                        </h4>
                        <p style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-secondary)', 
                          margin: '0 0 8px 0'
                        }}>
                          {milestone.description}
                        </p>
                      </div>
                      <span style={{
                        background: getStatusColor(milestone.status),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}>
                        {milestone.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>🎯 {new Date(milestone.targetDate).toLocaleDateString()}</span>
                      {milestone.completedDate && (
                        <span>✅ {new Date(milestone.completedDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${milestone.progress}%`,
                              background: milestone.status === 'completed' ? 'var(--accent-secondary)' : 'var(--accent-primary)'
                            }} 
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)', minWidth: '35px' }}>
                        {milestone.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {filteredMilestones.length === 0 && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <h3>No milestones found</h3>
          <p>Add project milestones to track progress or adjust your search criteria</p>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <MilestoneModal
          milestone={editingMilestone}
          milestones={siteMilestones}
          onSave={editingMilestone ? handleEditMilestone : handleAddMilestone}
          onCancel={() => {
            setShowMilestoneModal(false)
            setEditingMilestone(null)
          }}
        />
      )}
    </div>
  )
}

function SiteDocuments({ site }: { site: Site }) {
  const [siteDocuments, setSiteDocuments] = useState<SiteDocument[]>([])
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<SiteDocument | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load site documents
  useEffect(() => {
    const savedDocuments = localStorage.getItem(`site_documents_${site.id}`)
    if (savedDocuments) {
      setSiteDocuments(JSON.parse(savedDocuments))
    } else {
      // Sample data for demonstration
      const sampleDocuments: SiteDocument[] = [
        {
          id: '1',
          siteId: site.id,
          name: 'Building Contract Agreement.pdf',
          type: 'contract',
          url: '#document-placeholder',
          uploadedBy: 'Ahmed Hassan',
          uploadedDate: '2024-01-15',
          size: 2048576, // 2MB
          tags: ['legal', 'main-contract', 'signed']
        },
        {
          id: '2',
          siteId: site.id,
          name: 'Building Permit - City Council.pdf',
          type: 'permit',
          url: '#document-placeholder',
          uploadedBy: 'Fatima Al-Zahra',
          uploadedDate: '2024-01-20',
          size: 1536000, // 1.5MB
          tags: ['permit', 'city-council', 'approved']
        },
        {
          id: '3',
          siteId: site.id,
          name: 'Architectural Plans - Floor 1-5.dwg',
          type: 'drawing',
          url: '#document-placeholder',
          uploadedBy: 'Omar Al-Rashid',
          uploadedDate: '2024-02-01',
          size: 5242880, // 5MB
          tags: ['blueprints', 'architectural', 'floors']
        },
        {
          id: '4',
          siteId: site.id,
          name: 'Foundation Progress Photos.zip',
          type: 'photo',
          url: '#document-placeholder',
          uploadedBy: 'Ahmed Hassan',
          uploadedDate: '2024-03-15',
          size: 15728640, // 15MB
          tags: ['progress', 'foundation', 'photos']
        },
        {
          id: '5',
          siteId: site.id,
          name: 'Safety Inspection Report - March.pdf',
          type: 'report',
          url: '#document-placeholder',
          uploadedBy: 'Layla Mansour',
          uploadedDate: '2024-03-30',
          size: 1024000, // 1MB
          tags: ['safety', 'inspection', 'march']
        },
        {
          id: '6',
          siteId: site.id,
          name: 'Environmental Impact Study.pdf',
          type: 'other',
          url: '#document-placeholder',
          uploadedBy: 'Fatima Al-Zahra',
          uploadedDate: '2024-01-10',
          size: 3145728, // 3MB
          tags: ['environmental', 'study', 'compliance']
        }
      ]
      setSiteDocuments(sampleDocuments)
      localStorage.setItem(`site_documents_${site.id}`, JSON.stringify(sampleDocuments))
    }
  }, [site.id])

  const saveDocuments = (documents: SiteDocument[]) => {
    setSiteDocuments(documents)
    localStorage.setItem(`site_documents_${site.id}`, JSON.stringify(documents))
  }

  const handleAddDocument = (documentData: Partial<SiteDocument>) => {
    const newDocument: SiteDocument = {
      id: Date.now().toString(),
      siteId: site.id,
      name: documentData.name || '',
      type: documentData.type || 'other',
      url: documentData.url || '#',
      uploadedBy: 'Current User', // In real app, get from auth
      uploadedDate: new Date().toISOString().split('T')[0],
      size: documentData.size || 0,
      tags: documentData.tags || []
    }
    saveDocuments([...siteDocuments, newDocument])
    setShowDocumentModal(false)
  }

  const handleEditDocument = (documentData: Partial<SiteDocument>) => {
    if (!editingDocument) return
    const updatedDocument = { ...editingDocument, ...documentData }
    saveDocuments(siteDocuments.map(d => d.id === editingDocument.id ? updatedDocument : d))
    setEditingDocument(null)
    setShowDocumentModal(false)
  }

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      saveDocuments(siteDocuments.filter(d => d.id !== documentId))
    }
  }

  const filteredDocuments = siteDocuments.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         document.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || document.type === typeFilter
    const matchesTag = tagFilter === 'all' || document.tags.includes(tagFilter)
    return matchesSearch && matchesType && matchesTag
  })

  const getTypeIcon = (type: SiteDocument['type']) => {
    switch (type) {
      case 'contract': return '📋'
      case 'permit': return '📜'
      case 'drawing': return '📐'
      case 'photo': return '📷'
      case 'report': return '📊'
      case 'other': return '📄'
      default: return '📄'
    }
  }

  const getTypeColor = (type: SiteDocument['type']) => {
    switch (type) {
      case 'contract': return 'var(--accent-primary)'
      case 'permit': return 'var(--accent-secondary)'
      case 'drawing': return 'var(--accent-info)'
      case 'photo': return 'var(--accent-warning)'
      case 'report': return 'var(--accent-danger)'
      case 'other': return 'var(--text-muted)'
      default: return 'var(--text-muted)'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const types = Array.from(new Set(siteDocuments.map(d => d.type)))
  const allTags = Array.from(new Set(siteDocuments.flatMap(d => d.tags)))
  const totalSize = siteDocuments.reduce((sum, d) => sum + d.size, 0)
  const recentDocuments = siteDocuments
    .sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime())
    .slice(0, 3)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Site Documents</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📋 List
            </button>
          </div>
          <button onClick={() => setShowDocumentModal(true)} className="btn-primary btn-sm">
            📁 Upload Document
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--accent-primary-light)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {siteDocuments.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Documents</div>
        </div>
        <div style={{
          background: 'var(--accent-secondary-light)',
          border: '1px solid var(--accent-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
            {types.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Document Types</div>
        </div>
        <div style={{
          background: 'var(--accent-info-light)',
          border: '1px solid var(--accent-info)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-info)' }}>
            {formatFileSize(totalSize)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Size</div>
        </div>
        <div style={{
          background: 'var(--accent-warning-light)',
          border: '1px solid var(--accent-warning)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-warning)' }}>
            {recentDocuments.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recent Uploads</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search documents, tags, or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>
              {getTypeIcon(type)} {type?.charAt(0)?.toUpperCase() + (type?.slice(1) || '') || 'Unknown'}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
        >
          <option value="all">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* Documents View */}
      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredDocuments.map(document => (
            <div key={document.id} className="card" style={{ 
              padding: '20px', 
              position: 'relative',
              transition: 'var(--transition-normal)',
              cursor: 'pointer'
            }}>
              {/* Document Type Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: getTypeColor(document.type),
                color: 'white',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {document.type}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px', opacity: 0.8 }}>
                    {getTypeIcon(document.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: 'var(--text-primary)',
                      lineHeight: '1.3',
                      wordBreak: 'break-word'
                    }}>
                      {document.name}
                    </h4>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatFileSize(document.size)} • {new Date(document.uploadedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Tags:</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {document.tags.map(tag => (
                      <span key={tag} style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        border: '1px solid var(--border-light)'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Uploaded by {document.uploadedBy}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (document.url === '#document-placeholder') {
                      alert('This is a demo document. In a real application, this would open the actual document.')
                    } else {
                      window.open(document.url, '_blank')
                    }
                  }}
                  className="btn-outline btn-sm"
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  👁️ View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingDocument(document)
                    setShowDocumentModal(true)
                  }}
                  className="btn-ghost btn-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteDocument(document.id)
                  }}
                  style={{
                    background: 'var(--accent-danger-light)',
                    color: 'var(--accent-danger)',
                    border: '1px solid var(--accent-danger)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 100px 120px 100px',
            gap: '16px',
            padding: '16px 20px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-light)',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            <div>Type</div>
            <div>Name</div>
            <div>Size</div>
            <div>Uploader</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          {filteredDocuments.map(document => (
            <div 
              key={document.id} 
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 120px 100px 120px 100px',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-light)',
                alignItems: 'center',
                transition: 'var(--transition-normal)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ 
                fontSize: '20px',
                color: getTypeColor(document.type)
              }}>
                {getTypeIcon(document.type)}
              </div>
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                  wordBreak: 'break-word'
                }}>
                  {document.name}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {document.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)',
                      padding: '1px 4px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px'
                    }}>
                      #{tag}
                    </span>
                  ))}
                  {document.tags.length > 2 && (
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '10px'
                    }}>
                      +{document.tags.length - 2} more
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {formatFileSize(document.size)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {document.uploadedBy.split(' ')[0]}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {new Date(document.uploadedDate).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => window.open(document.url, '_blank')}
                  className="btn-ghost btn-sm"
                  style={{ padding: '4px 6px', fontSize: '11px' }}
                >
                  👁️
                </button>
                <button
                  onClick={() => {
                    setEditingDocument(document)
                    setShowDocumentModal(true)
                  }}
                  className="btn-ghost btn-sm"
                  style={{ padding: '4px 6px', fontSize: '11px' }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteDocument(document.id)}
                  style={{
                    background: 'transparent',
                    color: 'var(--accent-danger)',
                    border: 'none',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <h3>No documents found</h3>
          <p>Upload documents for this site or adjust your search criteria</p>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <DocumentModal
          document={editingDocument}
          onSave={editingDocument ? handleEditDocument : handleAddDocument}
          onCancel={() => {
            setShowDocumentModal(false)
            setEditingDocument(null)
          }}
        />
      )}
    </div>
  )
}

// Employee Modal Component
function EmployeeModal({ 
  employee, 
  onSave, 
  onCancel 
}: { 
  employee: SiteEmployee | null
  onSave: (employee: Partial<SiteEmployee>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    employeeId: employee?.employeeId || '',
    employeeName: employee?.employeeName || '',
    role: employee?.role || '',
    department: employee?.department || '',
    hourlyRate: employee?.hourlyRate || 0,
    assignedDate: employee?.assignedDate || new Date().toISOString().split('T')[0]
  })

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 1000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API call
        onSave(formData)
      } catch (error) {
        console.error('Error saving employee:', error)
        throw error
      }
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.employeeName}
                onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Role *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={{ width: '100%' }}
                placeholder="e.g. Engineer, Supervisor, Worker"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                style={{ width: '100%' }}
                placeholder="e.g. Construction, Engineering"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Hourly Rate (LYD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Assigned Date *
              </label>
              <input
                type="date"
                required
                value={formData.assignedDate}
                onChange={(e) => setFormData({...formData, assignedDate: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> {employee ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                employee ? 'Update Employee' : 'Add Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Milestone Modal Component
function MilestoneModal({ 
  milestone, 
  milestones,
  onSave, 
  onCancel 
}: { 
  milestone: SiteMilestone | null
  milestones: SiteMilestone[]
  onSave: (milestone: Partial<SiteMilestone>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    targetDate: milestone?.targetDate || '',
    dependencies: milestone?.dependencies || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleDependencyToggle = (milestoneId: string) => {
    if (formData.dependencies.includes(milestoneId)) {
      setFormData({
        ...formData,
        dependencies: formData.dependencies.filter(id => id !== milestoneId)
      })
    } else {
      setFormData({
        ...formData,
        dependencies: [...formData.dependencies, milestoneId]
      })
    }
  }

  // Available dependencies (exclude current milestone if editing)
  const availableDependencies = milestones.filter(m => 
    m.id !== milestone?.id && 
    (!milestone || m.status === 'completed')
  )

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
          {milestone ? 'Edit Milestone' : 'Add New Milestone'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Milestone Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%' }}
              placeholder="e.g. Foundation Complete, Structural Framework"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Describe what needs to be accomplished for this milestone..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Target Date *
            </label>
            <input
              type="date"
              required
              value={formData.targetDate}
              onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          {availableDependencies.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Dependencies
              </label>
              <div style={{
                padding: '12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Select milestones that must be completed before this one can begin:
                </div>
                {availableDependencies.map(dep => (
                  <div key={dep.id} style={{ marginBottom: '8px' }}>
                    <label 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.dependencies.includes(dep.id)}
                        onChange={() => handleDependencyToggle(dep.id)}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '14px' }}>{dep.title}</span>
                      {dep.status === 'completed' && (
                        <span style={{
                          background: 'var(--accent-secondary)',
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '10px'
                        }}>
                          ✓
                        </span>
                      )}
                    </label>
                  </div>
                ))}
                {formData.dependencies.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No dependencies selected - this milestone can start immediately
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Milestone Summary */}
          <div style={{
            padding: '16px',
            background: 'var(--accent-primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--accent-primary)' }}>
              Milestone Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Title</div>
                <div style={{ fontWeight: '600' }}>
                  {formData.title || 'Untitled Milestone'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Target Date</div>
                <div>
                  {formData.targetDate ? new Date(formData.targetDate).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Dependencies</div>
                <div>
                  {formData.dependencies.length} milestone(s)
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</div>
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {milestone ? 'Will remain ' + milestone.status : 'Will start as pending'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {milestone ? 'Update Milestone' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Document Modal Component
function DocumentModal({ 
  document, 
  onSave, 
  onCancel 
}: { 
  document: SiteDocument | null
  onSave: (document: Partial<SiteDocument>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: document?.name || '',
    type: document?.type || 'other',
    tags: document?.tags.join(', ') || '',
    size: document?.size || 0,
    url: document?.url || ''
  })
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    onSave({
      name: formData.name,
      type: formData.type,
      tags,
      size: formData.size,
      url: formData.url || '#'
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file) // In real app, this would be uploaded to server
      })
    }
  }

  const getTypeIcon = (type: SiteDocument['type']) => {
    switch (type) {
      case 'contract': return '📋'
      case 'permit': return '📜'
      case 'drawing': return '📐'
      case 'photo': return '📷'
      case 'report': return '📊'
      case 'other': return '📄'
      default: return '📄'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
          {document ? 'Edit Document' : 'Upload New Document'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          {/* File Upload */}
          {!document && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Select File
              </label>
              <div 
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.jpg,.jpeg,.png,.zip,.rar"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    Click to select file or drag and drop
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Supported formats: PDF, DOC, XLS, PPT, DWG, Images, Archives
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Maximum file size: 50MB
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Document Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Document Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%' }}
                placeholder="e.g. Building Contract Agreement.pdf"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as SiteDocument['type']})}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', minWidth: '140px' }}
                required
              >
                <option value="contract">{getTypeIcon('contract')} Contract</option>
                <option value="permit">{getTypeIcon('permit')} Permit</option>
                <option value="drawing">{getTypeIcon('drawing')} Drawing</option>
                <option value="photo">{getTypeIcon('photo')} Photo</option>
                <option value="report">{getTypeIcon('report')} Report</option>
                <option value="other">{getTypeIcon('other')} Other</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              style={{ width: '100%' }}
              placeholder="e.g. legal, main-contract, signed (separate with commas)"
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Add tags to help organize and find documents later
            </div>
          </div>

          {/* Type-specific guidance */}
          <div style={{
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>{getTypeIcon(formData.type)}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {formData.type?.charAt(0)?.toUpperCase() + (formData.type?.slice(1) || '') || 'Unknown'} Document
              </span>
            </div>
            {formData.type === 'contract' && (
              <p style={{ margin: 0 }}>Legal agreements, subcontractor contracts, supplier agreements, and client contracts.</p>
            )}
            {formData.type === 'permit' && (
              <p style={{ margin: 0 }}>Building permits, environmental approvals, safety certificates, and regulatory documents.</p>
            )}
            {formData.type === 'drawing' && (
              <p style={{ margin: 0 }}>Architectural plans, engineering drawings, blueprints, technical specifications, and CAD files.</p>
            )}
            {formData.type === 'photo' && (
              <p style={{ margin: 0 }}>Progress photos, before/after images, inspection photos, and site documentation.</p>
            )}
            {formData.type === 'report' && (
              <p style={{ margin: 0 }}>Progress reports, inspection results, quality assessments, and status updates.</p>
            )}
            {formData.type === 'other' && (
              <p style={{ margin: 0 }}>Any other project-related documents that don't fit the above categories.</p>
            )}
          </div>

          {/* Document Preview */}
          {(formData.name || formData.size > 0) && (
            <div style={{
              padding: '16px',
              background: 'var(--accent-primary-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-primary)'
            }}>
              <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                Document Preview
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Name</div>
                  <div style={{ wordBreak: 'break-word' }}>
                    {formData.name || 'Untitled Document'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Type</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{getTypeIcon(formData.type)}</span>
                    <span style={{ textTransform: 'capitalize' }}>{formData.type}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Size</div>
                  <div>
                    {formData.size > 0 ? formatFileSize(formData.size) : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Tags</div>
                  <div>
                    {formData.tags ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {formData.tags.split(',').map((tag, index) => (
                          <span key={index} style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            padding: '1px 4px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '10px'
                          }}>
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress (mock) */}
          {isUploading && (
            <div style={{
              padding: '16px',
              background: 'var(--accent-info-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-info)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div>📤</div>
                <div style={{ fontWeight: '600', color: 'var(--accent-info)' }}>Uploading document...</div>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: '100%', 
                    background: 'var(--accent-info)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} 
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Please wait while we process your document...
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn-ghost"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isUploading || !formData.name}
            >
              {isUploading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> Uploading...
                </span>
              ) : (
                <span>{document ? 'Update Document' : 'Upload Document'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Attendance Modal Component
function AttendanceModal({ 
  employee, 
  onSave, 
  onCancel 
}: { 
  employee: SiteEmployee
  onSave: (attendance: SiteEmployee['attendance'][0]) => void
  onCancel: () => void 
}) {
  const today = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    date: today,
    hoursWorked: 8,
    overtime: 0,
    status: 'present' as 'present' | 'absent' | 'sick' | 'vacation'
  })

  // Find if there's already an attendance record for today
  useEffect(() => {
    const existingRecord = employee.attendance.find(a => a.date === today)
    if (existingRecord) {
      setFormData({
        date: existingRecord.date,
        hoursWorked: existingRecord.hoursWorked,
        overtime: existingRecord.overtime,
        status: existingRecord.status
      })
    }
  }, [employee, today])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleStatusChange = (status: 'present' | 'absent' | 'sick' | 'vacation') => {
    const newData = { ...formData, status }
    if (status === 'absent' || status === 'sick' || status === 'vacation') {
      newData.hoursWorked = 0
      newData.overtime = 0
    }
    setFormData(newData)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '450px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Record Attendance
          </h2>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {employee.employeeName} ({employee.employeeId})
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Status
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => handleStatusChange('present')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid',
                  borderColor: formData.status === 'present' ? 'var(--accent-secondary)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: formData.status === 'present' ? 'var(--accent-secondary-light)' : 'transparent',
                  color: formData.status === 'present' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: formData.status === 'present' ? '600' : '400'
                }}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('absent')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid',
                  borderColor: formData.status === 'absent' ? 'var(--accent-danger)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: formData.status === 'absent' ? 'var(--accent-danger-light)' : 'transparent',
                  color: formData.status === 'absent' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: formData.status === 'absent' ? '600' : '400'
                }}
              >
                Absent
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('sick')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid',
                  borderColor: formData.status === 'sick' ? 'var(--accent-warning)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: formData.status === 'sick' ? 'var(--accent-warning-light)' : 'transparent',
                  color: formData.status === 'sick' ? 'var(--accent-warning)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: formData.status === 'sick' ? '600' : '400'
                }}
              >
                Sick
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('vacation')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid',
                  borderColor: formData.status === 'vacation' ? 'var(--accent-info)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: formData.status === 'vacation' ? 'var(--accent-info-light)' : 'transparent',
                  color: formData.status === 'vacation' ? 'var(--accent-info)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: formData.status === 'vacation' ? '600' : '400'
                }}
              >
                Vacation
              </button>
            </div>
          </div>

          {formData.status === 'present' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Hours Worked
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({...formData, hoursWorked: Number(e.target.value)})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Overtime Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.overtime}
                  onChange={(e) => setFormData({...formData, overtime: Number(e.target.value)})}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '8px' }}>
            <div style={{ 
              padding: '16px', 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '500' }}>
                Summary
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status:</span>
                <span style={{ fontWeight: '600' }}>{formData.status}</span>
              </div>
              {formData.status === 'present' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Regular hours:</span>
                    <span>{formData.hoursWorked} h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Overtime:</span>
                    <span>{formData.overtime} h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: '600' }}>
                    <span>Total:</span>
                    <span>{formData.hoursWorked + formData.overtime} h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--accent-primary)' }}>
                    <span>Pay:</span>
                    <span>{(formData.hoursWorked * employee.hourlyRate + formData.overtime * employee.hourlyRate * 1.5).toFixed(1)} LYD</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
