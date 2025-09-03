import React, { useState } from 'react'

interface Site {
  id: string
  name: string
  location: string
  description: string
  manager: string
  managerEmail: string
  progress: number
  status: 'Planning' | 'Active' | 'Paused' | 'Completed' | 'Cancelled'
  employeeCount: number
  budget: number
  spent: number
  startDate: string
  expectedEnd: string
  actualEnd?: string
  createdAt: string
  updatedAt: string
}

import { DemoDataService, DEMO_SITE } from '../services/demoDataService'

const mockSites: Site[] = [
  // The L Villas - Premium demo site with full task management
  {
    id: 'site-lvillas-001',
    name: 'The L Villas',
    location: 'Al-Andalus District, Tripoli',
    description: 'Luxury residential villa development project in premium location with 8 high-end villas',
    manager: 'Ahmed Hassan',
    managerEmail: 'ahmed.hassan@company.com',
    progress: 65,
    status: 'Active',
    employeeCount: 5,
    budget: 2500000,
    spent: 1625000,
    startDate: '2024-01-15',
    expectedEnd: '2024-12-30',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-03-30T17:30:00Z'
  },
  {
    id: '1',
    name: 'Alpha Construction Site',
    location: 'Downtown Tripoli, Libya',
    description: 'Modern office complex with commercial spaces and underground parking facility',
    manager: 'John Smith',
    managerEmail: 'john.smith@company.com',
    progress: 75,
    status: 'Active',
    employeeCount: 12,
    budget: 2500000,
    spent: 1875000,
    startDate: '2024-01-15',
    expectedEnd: '2024-12-30',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'Beta Development Site',
    location: 'Benghazi Industrial Zone, Libya',
    description: 'Residential complex with 150 apartment units and recreational facilities',
    manager: 'Sarah Johnson',
    managerEmail: 'sarah.johnson@company.com',
    progress: 45,
    status: 'Active',
    employeeCount: 8,
    budget: 3200000,
    spent: 1440000,
    startDate: '2024-02-01',
    expectedEnd: '2025-01-15',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-03-18T16:45:00Z'
  },
  {
    id: '3',
    name: 'Gamma Infrastructure',
    location: 'Misrata Port Area, Libya',
    description: 'Port infrastructure upgrade including new loading docks and warehouse facilities',
    manager: 'Mike Davis',
    managerEmail: 'mike.davis@company.com',
    progress: 90,
    status: 'Active',
    employeeCount: 15,
    budget: 4100000,
    spent: 3690000,
    startDate: '2023-08-20',
    expectedEnd: '2024-04-30',
    createdAt: '2023-08-01T11:15:00Z',
    updatedAt: '2024-03-19T13:20:00Z'
  },
  {
    id: '4',
    name: 'Delta Medical Center',
    location: 'Zawiya Medical District, Libya',
    description: 'State-of-the-art medical facility with emergency services and specialized departments',
    manager: 'Lisa Wilson',
    managerEmail: 'lisa.wilson@company.com',
    progress: 25,
    status: 'Planning',
    employeeCount: 4,
    budget: 5500000,
    spent: 275000,
    startDate: '2024-05-01',
    expectedEnd: '2025-08-30',
    createdAt: '2024-03-01T08:45:00Z',
    updatedAt: '2024-03-15T10:30:00Z'
  }
]

const managers = [
  'Ahmed Hassan', // Added for The L Villas
  'John Smith',
  'Sarah Johnson', 
  'Mike Davis',
  'Lisa Wilson',
  'David Brown',
  'Emma Taylor'
]

export function SitesManagement() {
  const [sites, setSites] = useState<Site[]>(mockSites)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showModal, setShowModal] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.manager.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || site.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalBudget = sites.reduce((sum, site) => sum + site.budget, 0)
  const totalSpent = sites.reduce((sum, site) => sum + site.spent, 0)
  const activeSites = sites.filter(s => s.status === 'Active').length
  const totalEmployees = sites.reduce((sum, site) => sum + site.employeeCount, 0)

  const handleAddSite = () => {
    setEditingSite(null)
    setShowModal(true)
  }

  const handleEditSite = (site: Site) => {
    setEditingSite(site)
    setShowModal(true)
  }

  const handleDeleteSite = (id: string) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setSites(prev => prev.filter(site => site.id !== showDeleteConfirm))
      setShowDeleteConfirm(null)
      if (selectedSite?.id === showDeleteConfirm) {
        setSelectedSite(null)
      }
    }
  }

  const handleSaveSite = (siteData: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSite) {
      setSites(prev => prev.map(site => 
        site.id === editingSite.id 
          ? { ...siteData, id: editingSite.id, createdAt: editingSite.createdAt, updatedAt: new Date().toISOString() }
          : site
      ))
    } else {
      const newSite: Site = {
        ...siteData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setSites(prev => [...prev, newSite])
    }
    setShowModal(false)
  }

  const updateProgress = (siteId: string, newProgress: number) => {
    setSites(prev => prev.map(site =>
      site.id === siteId 
        ? { ...site, progress: newProgress, updatedAt: new Date().toISOString() }
        : site
    ))
    if (selectedSite?.id === siteId) {
      setSelectedSite(prev => prev ? { ...prev, progress: newProgress } : null)
    }
  }

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <SummaryCard
          title="Total Budget"
          value={`${(totalBudget / 1000000).toFixed(1)}M LYD`}
          icon="💰"
          color="#10b981"
        />
        <SummaryCard
          title="Total Spent"
          value={`${(totalSpent / 1000000).toFixed(1)}M LYD`}
          icon="💸"
          color="#ef4444"
        />
        <SummaryCard
          title="Active Sites"
          value={activeSites.toString()}
          icon="🏗️"
          color="#3b82f6"
        />
        <SummaryCard
          title="Total Employees"
          value={totalEmployees.toString()}
          icon="👥"
          color="#f59e0b"
        />
      </div>

      {/* Header and Controls */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Sites Management</h3>
          <button
            onClick={handleAddSite}
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
            + New Site
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search sites by name, location, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="">All Status</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                backgroundColor: viewMode === 'list' ? '#3b82f6' : 'transparent',
                color: viewMode === 'list' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              List
            </button>
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>
            {filteredSites.length} sites
          </div>
        </div>
      </div>

      {/* Sites Display */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredSites.map(site => (
            <SiteCard
              key={site.id}
              site={site}
              onEdit={() => handleEditSite(site)}
              onDelete={() => handleDeleteSite(site.id)}
              onView={() => setSelectedSite(site)}
              onUpdateProgress={(progress) => updateProgress(site.id, progress)}
            />
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '16px', color: '#374151', fontWeight: '600' }}>Site</th>
                  <th style={{ textAlign: 'left', padding: '16px', color: '#374151', fontWeight: '600' }}>Manager</th>
                  <th style={{ textAlign: 'left', padding: '16px', color: '#374151', fontWeight: '600' }}>Progress</th>
                  <th style={{ textAlign: 'left', padding: '16px', color: '#374151', fontWeight: '600' }}>Budget</th>
                  <th style={{ textAlign: 'left', padding: '16px', color: '#374151', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '16px', color: '#374151', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map(site => (
                  <SiteRow
                    key={site.id}
                    site={site}
                    onEdit={() => handleEditSite(site)}
                    onDelete={() => handleDeleteSite(site.id)}
                    onView={() => setSelectedSite(site)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredSites.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
            No sites found
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {searchTerm || filterStatus 
              ? 'Try adjusting your search filters'
              : 'Get started by creating your first site'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <SiteModal
          site={editingSite}
          managers={managers}
          onSave={handleSaveSite}
          onClose={() => setShowModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          siteName={sites.find(s => s.id === showDeleteConfirm)?.name || ''}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {selectedSite && (
        <SiteDetailsModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
          onEdit={() => {
            handleEditSite(selectedSite)
            setSelectedSite(null)
          }}
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
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
        <div style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>{value}</div>
        <div style={{ fontSize: '14px', color: '#64748b' }}>{title}</div>
      </div>
    </div>
  )
}

function SiteCard({ site, onEdit, onDelete, onView, onUpdateProgress }: {
  site: Site
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  onUpdateProgress: (progress: number) => void
}) {
  const statusColors = {
    Planning: '#64748b',
    Active: '#10b981',
    Paused: '#f59e0b',
    Completed: '#3b82f6',
    Cancelled: '#ef4444'
  }
  
  // Check if this is The L Villas demo site
  const isDemoSite = site.id === 'site-lvillas-001'

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      position: 'relative',
      border: isDemoSite ? '2px solid #84cc16' : '1px solid transparent'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
    >
      {/* Demo Site Badge */}
      {isDemoSite && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: '#84cc16',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)'
        }}>
          ⭐ DEMO
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1e293b' }}>{site.name}</h4>
          {isDemoSite && (
            <div style={{ fontSize: '12px', color: '#84cc16', fontWeight: '500', marginTop: '2px' }}>
              📋 Full Task Management Available
            </div>
          )}
        </div>
        <span style={{
          backgroundColor: statusColors[site.status] + '20',
          color: statusColors[site.status],
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {site.status}
        </span>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span>📍</span>
          <span style={{ color: '#64748b' }}>{site.location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span>👤</span>
          <span style={{ color: '#374151' }}>{site.manager}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span>👥</span>
          <span style={{ color: '#374151' }}>{site.employeeCount} employees</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💰</span>
          <span style={{ color: '#374151' }}>
            {(site.spent / 1000000).toFixed(1)}M / {(site.budget / 1000000).toFixed(1)}M LYD
          </span>
        </div>
        {/* Additional info for demo site */}
        {isDemoSite && (
          <div style={{ 
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#84cc1610',
            borderRadius: '6px',
            border: '1px solid #84cc1630',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>📋</span>
              <span style={{ color: '#166534', fontWeight: '500' }}>6 Active Tasks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>⏳</span>
              <span style={{ color: '#166534' }}>2 Pending Approvals</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span>
              <span style={{ color: '#166534' }}>Full Report Generation</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
          <span style={{ color: '#64748b' }}>Progress</span>
          <span style={{ color: '#64748b' }}>{site.progress}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          backgroundColor: '#f1f5f9', 
          borderRadius: '4px', 
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          <div style={{
            width: `${site.progress}%`,
            height: '100%',
            backgroundColor: statusColors[site.status],
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onUpdateProgress(Math.max(0, site.progress - 5))}
            style={{
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            -5%
          </button>
          <button
            onClick={() => onUpdateProgress(Math.min(100, site.progress + 5))}
            style={{
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            +5%
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onView}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: isDemoSite ? '#84cc16' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: isDemoSite ? '600' : '400'
          }}
        >
          {isDemoSite ? '🚀 View Tasks' : 'View'}
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 12px',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function SiteRow({ site, onEdit, onDelete, onView }: {
  site: Site
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}) {
  const statusColors = {
    Planning: '#64748b',
    Active: '#10b981',
    Paused: '#f59e0b',
    Completed: '#3b82f6',
    Cancelled: '#ef4444'
  }

  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '16px' }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{site.name}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{site.location}</div>
        </div>
      </td>
      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
        {site.manager}
      </td>
      <td style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '60px', 
            height: '6px', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${site.progress}%`,
              height: '100%',
              backgroundColor: statusColors[site.status]
            }} />
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{site.progress}%</span>
        </div>
      </td>
      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
        {(site.budget / 1000000).toFixed(1)}M LYD
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{
          backgroundColor: statusColors[site.status] + '20',
          color: statusColors[site.status],
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {site.status}
        </span>
      </td>
      <td style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onView}
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
            View
          </button>
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
      </td>
    </tr>
  )
}

function SiteModal({ site, managers, onSave, onClose }: {
  site: Site | null
  managers: string[]
  onSave: (site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: site?.name || '',
    location: site?.location || '',
    description: site?.description || '',
    manager: site?.manager || '',
    managerEmail: site?.managerEmail || '',
    progress: site?.progress || 0,
    status: site?.status || 'Planning' as const,
    employeeCount: site?.employeeCount || 0,
    budget: site?.budget || 0,
    spent: site?.spent || 0,
    startDate: site?.startDate || new Date().toISOString().split('T')[0],
    expectedEnd: site?.expectedEnd || '',
    actualEnd: site?.actualEnd || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.location && formData.manager) {
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
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            {site ? 'Edit Site' : 'Create New Site'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Site Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Site Manager *
                </label>
                <select
                  required
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Manager</option>
                  {managers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Manager Email
                </label>
                <input
                  type="email"
                  value={formData.managerEmail}
                  onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Employee Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Budget (LYD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Amount Spent (LYD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.spent}
                  onChange={(e) => setFormData({ ...formData, spent: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Expected End
                </label>
                <input
                  type="date"
                  value={formData.expectedEnd}
                  onChange={(e) => setFormData({ ...formData, expectedEnd: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Actual End
                </label>
                <input
                  type="date"
                  value={formData.actualEnd}
                  onChange={(e) => setFormData({ ...formData, actualEnd: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                backgroundColor: '#f8fafc',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
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
              {site ? 'Update Site' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SiteDetailsModal({ site, onClose, onEdit }: {
  site: Site
  onClose: () => void
  onEdit: () => void
}) {
  const statusColors = {
    Planning: '#64748b',
    Active: '#10b981',
    Paused: '#f59e0b',
    Completed: '#3b82f6',
    Cancelled: '#ef4444'
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
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Site Details
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                {site.name}
              </h2>
              <p style={{ color: '#64748b', margin: 0 }}>{site.location}</p>
            </div>
            <span style={{
              backgroundColor: statusColors[site.status] + '20',
              color: statusColors[site.status],
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {site.status}
            </span>
          </div>

          {site.description && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Description</h4>
              <p style={{ color: '#64748b', lineHeight: '1.5', margin: 0 }}>{site.description}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Project Info</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Manager:</span>
                  <span>{site.manager}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Employees:</span>
                  <span>{site.employeeCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Start Date:</span>
                  <span>{new Date(site.startDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Expected End:</span>
                  <span>{new Date(site.expectedEnd).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Budget & Progress</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Budget:</span>
                  <span>{(site.budget / 1000000).toFixed(1)}M LYD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Spent:</span>
                  <span>{(site.spent / 1000000).toFixed(1)}M LYD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Remaining:</span>
                  <span>{((site.budget - site.spent) / 1000000).toFixed(1)}M LYD</span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Progress:</span>
                    <span>{site.progress}%</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '4px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${site.progress}%`,
                      height: '100%',
                      backgroundColor: statusColors[site.status],
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onEdit}
              style={{
                flex: 1,
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
              Edit Site
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f8fafc',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ siteName, onConfirm, onCancel }: {
  siteName: string
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
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        padding: '24px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
            Delete Site
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Are you sure you want to delete <strong>{siteName}</strong>? This action cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
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
            Delete Site
          </button>
        </div>
      </div>
    </div>
  )
}
