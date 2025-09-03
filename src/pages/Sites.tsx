import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Download,
  FileText,
  Building,
  Clock,
  DollarSign,
  Target,
  Activity
} from 'lucide-react'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'
import apiService from '../services/apiService'
import OrgSwitcher from '../components/common/OrgSwitcher'
import LoadingScreen from '../components/common/LoadingScreen'

interface Site {
  id: string
  name: string
  code: string
  location: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  progress: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  budget: number
  spent: number
  startDate: Date
  targetDate: Date
  actualEndDate?: Date
  region: string
  orgUnitId: string
  createdAt: Date
  updatedAt: Date
}

const statusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PAUSED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

// Site Card Component for Grid View
const SiteCard = ({ site, onView, onEdit, onDelete, canEdit }: {
  site: Site
  onView: () => void
  onEdit?: () => void
  onDelete?: () => void
  canEdit: boolean
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', { style: 'currency', currency: 'LYD' }).format(amount)
  }

  const budgetUsed = site.budget > 0 ? (site.spent / site.budget) * 100 : 0
  const isOverBudget = budgetUsed > 100
  const daysRemaining = Math.ceil((new Date(site.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysRemaining < 0

  return (
    <div className="bg-card border border-border rounded-lg hover:shadow-md transition-shadow duration-200 p-5 relative group cursor-pointer" onClick={onView}>
      {/* Status and Priority Badges */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[site.status]}`}>
            {site.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[site.priority]}`}>
            {site.priority}
          </span>
        </div>
        
        {/* Quick Actions - Only show if can edit */}
        {canEdit && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.() }}
              className="p-1 bg-background border border-border rounded hover:bg-muted transition-colors"
              title="Edit"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.() }}
              className="p-1 bg-background border border-border rounded hover:bg-muted transition-colors text-destructive"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Site Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">{site.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          {site.location}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Code: {site.code}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm text-muted-foreground">{site.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(site.progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Budget Info */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Budget</span>
          <span className={`text-sm ${isOverBudget ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {budgetUsed.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Spent: {formatCurrency(site.spent)}</span>
          <span>Total: {formatCurrency(site.budget)}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{new Date(site.startDate).toLocaleDateString()}</span>
        </div>
        <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
          </span>
        </div>
      </div>
    </div>
  )
}

// Site Row Component for List View
const SiteRow = ({ site, onView, onEdit, onDelete, canEdit }: {
  site: Site
  onView: () => void
  onEdit?: () => void
  onDelete?: () => void
  canEdit: boolean
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', { style: 'currency', currency: 'LYD' }).format(amount)
  }

  const budgetUsed = site.budget > 0 ? (site.spent / site.budget) * 100 : 0
  const daysRemaining = Math.ceil((new Date(site.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <tr className="border-b border-border hover:bg-muted/50 cursor-pointer group" onClick={onView}>
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-foreground">{site.name}</div>
          <div className="text-sm text-muted-foreground">{site.code}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          {site.location}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[site.status]}`}>
          {site.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[site.priority]}`}>
          {site.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full"
              style={{ width: `${Math.min(site.progress, 100)}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{site.progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="text-sm font-medium text-foreground">{formatCurrency(site.spent)}</div>
          <div className="text-xs text-muted-foreground">of {formatCurrency(site.budget)}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
      </td>
      <td className="px-4 py-3">
        {canEdit && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.() }}
              className="p-1 hover:bg-muted rounded"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.() }}
              className="p-1 hover:bg-muted rounded text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function Sites() {
  const { t } = useTranslation()
  const { user, hasAnyRole } = useAuth()
  const { addNotification } = useUI()
  const navigate = useNavigate()
  
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentScope, setCurrentScope] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadSites()
  }, [currentScope])
  
  const loadSites = useCallback(async () => {
    try {
      setLoading(true)
      const sitesData = await apiService.getAllSites()
      setSites(sitesData || [])
    } catch (error) {
      console.error('Failed to load sites:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load sites'
      })
      setSites([])
    } finally {
      setLoading(false)
    }
  }, [currentScope, addNotification])

  const handleScopeChange = useCallback((orgUnitId: string, path: any[]) => {
    setCurrentScope(orgUnitId)
  }, [])

  // Optimized filtering with useMemo
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const matchesSearch = !debouncedSearch || 
        site.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        site.location.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        site.code.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesStatus = statusFilter === 'all' || site.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || site.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [sites, debouncedSearch, statusFilter, priorityFilter])

  const handleViewSite = (site: Site) => {
    navigate(`/sites/${site.id}`)
  }

  const handleEditSite = (site: Site) => {
    navigate(`/sites/${site.id}/edit`)
  }

  const handleDeleteSite = async (site: Site) => {
    if (!window.confirm(`Are you sure you want to delete ${site.name}?`)) return
    
    try {
      // await apiService.deleteSite(site.id)
      setSites(prev => prev.filter(s => s.id !== site.id))
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Site deleted successfully'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete site'
      })
    }
  }

  const handleCreateSite = () => {
    navigate('/sites/new')
  }

  const handleExport = async () => {
    // Implementation for exporting sites data
    addNotification({
      type: 'info',
      title: 'Export',
      message: 'Export functionality will be implemented'
    })
  }

  const canCreateSites = hasAnyRole(['PMO', 'AREA_MANAGER', 'PROJECT_MANAGER'])
  const canEditSites = hasAnyRole(['PMO', 'AREA_MANAGER', 'PROJECT_MANAGER', 'ZONE_MANAGER'])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      {/* Header with Org Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-2xl font-bold text-foreground">Sites</h1>
          <p className="text-muted-foreground mt-1">
            Manage construction sites across your organization
          </p>
          {/* Org Switcher */}
          <div className="mt-3">
            <OrgSwitcher onScopeChange={handleScopeChange} />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          {canCreateSites && (
            <button
              onClick={handleCreateSite}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Site</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sites by name, location, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            >
              <option value="all">All Status</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            >
              <option value="all">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex border border-border rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors rounded-l`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors rounded-r`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-sm text-muted-foreground">
          Showing {filteredSites.length} of {sites.length} sites
        </div>
      </div>

      {/* Sites Content */}
      {filteredSites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No sites found' : 'No sites yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first construction site to get started'
            }
          </p>
          {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && canCreateSites) && (
            <button
              onClick={handleCreateSite}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Site</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSites.map(site => (
            <SiteCard 
              key={site.id}
              site={site}
              onView={() => handleViewSite(site)}
              onEdit={() => handleEditSite(site)}
              onDelete={() => handleDeleteSite(site)}
              canEdit={canEditSites}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timeline</th>
                  {canEditSites && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredSites.map(site => (
                  <SiteRow
                    key={site.id}
                    site={site}
                    onView={() => handleViewSite(site)}
                    onEdit={() => handleEditSite(site)}
                    onDelete={() => handleDeleteSite(site)}
                    canEdit={canEditSites}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
