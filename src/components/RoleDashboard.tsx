import React, { useState, useEffect } from 'react'
import { useRBAC } from '../contexts/RBACContext'
import { useOrgScope } from '../contexts/OrgScopeContext'
import { useScopedQueryParams } from '../hooks/useOrgScoped'
import { approvalWorkflow } from '../services/approvalWorkflow'
import { ScopeChip } from './ScopeChip'
import OrgSwitcher from './OrgSwitcher'
import type { UserRole } from '../types/user'

export function RoleDashboard() {
  const { currentUser, hasPermission } = useRBAC()
  const { orgUnits } = useOrgScope()
  const scopedParams = useScopedQueryParams()
  
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [currentUser, scopedParams.currentOrgUnit, timeRange])

  const loadDashboardData = async () => {
    if (!currentUser) return
    
    setLoading(true)
    
    // Simulate API call with realistic data based on role
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const data = generateRoleBasedDashboardData(currentUser.role, scopedParams.currentOrgUnit)
    setDashboardData(data)
    setLoading(false)
  }

  const generateRoleBasedDashboardData = (role: UserRole, orgUnitId?: string) => {
    const baseDate = new Date()
    const monthAgo = new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Base data structure
    const data = {
      overview: {
        totalProjects: 0,
        activeProjects: 0,
        totalBudget: 0,
        spentBudget: 0,
        budgetUtilization: 0,
        employeeCount: 0,
        sitesCount: 0,
        pendingApprovals: 0
      },
      charts: {
        budgetTrend: [],
        projectProgress: [],
        approvalMetrics: [],
        performanceKPIs: []
      },
      alerts: [],
      recentActivity: [],
      quickStats: []
    }

    // Role-specific data generation
    switch (role) {
      case 'PMO':
        return generatePMODashboard(data, orgUnitId)
      case 'AREA_MANAGER':
        return generateAreaManagerDashboard(data, orgUnitId)
      case 'PROJECT_MANAGER':
        return generateProjectManagerDashboard(data, orgUnitId)
      case 'ZONE_MANAGER':
        return generateZoneManagerDashboard(data, orgUnitId)
      case 'SITE_ENGINEER':
        return generateSiteEngineerDashboard(data, orgUnitId)
      default:
        return data
    }
  }

  const generatePMODashboard = (data: any, orgUnitId?: string) => {
    // PMO sees high-level organizational metrics
    data.overview = {
      totalProjects: 156,
      activeProjects: 89,
      totalBudget: 485000000,
      spentBudget: 287500000,
      budgetUtilization: 59.3,
      employeeCount: 2847,
      sitesCount: 234,
      pendingApprovals: 23
    }

    data.charts.budgetTrend = [
      { month: 'Jan', planned: 45000000, actual: 42000000 },
      { month: 'Feb', planned: 48000000, actual: 46000000 },
      { month: 'Mar', planned: 52000000, actual: 48000000 },
      { month: 'Apr', planned: 55000000, actual: 53000000 },
      { month: 'May', planned: 58000000, actual: 54000000 },
      { month: 'Jun', planned: 62000000, actual: 59000000 }
    ]

    data.charts.projectProgress = [
      { region: 'West Region', projects: 45, onTime: 78, delayed: 15, ahead: 7 },
      { region: 'East Region', projects: 32, onTime: 65, delayed: 25, ahead: 10 },
      { region: 'Central Region', projects: 12, projects: 12, onTime: 83, delayed: 17, ahead: 0 }
    ]

    data.alerts = [
      {
        id: '1',
        type: 'budget',
        severity: 'high',
        title: 'Marina Towers Budget Alert',
        message: 'Project is 15% over budget with 3 months remaining',
        orgUnit: 'West Region'
      },
      {
        id: '2',
        type: 'schedule',
        severity: 'medium',
        title: 'Industrial Zone Delay',
        message: 'Project delayed by 2 weeks due to permit issues',
        orgUnit: 'East Region'
      }
    ]

    data.quickStats = [
      { label: 'Revenue YTD', value: '₾ 287.5M', change: '+12.5%', trend: 'up' },
      { label: 'Profit Margin', value: '18.3%', change: '+2.1%', trend: 'up' },
      { label: 'Client Satisfaction', value: '94.2%', change: '+0.8%', trend: 'up' },
      { label: 'Safety Score', value: '98.5%', change: '-0.2%', trend: 'down' }
    ]

    return data
  }

  const generateAreaManagerDashboard = (data: any, orgUnitId?: string) => {
    // Area Manager sees regional-level metrics
    data.overview = {
      totalProjects: 45,
      activeProjects: 28,
      totalBudget: 125000000,
      spentBudget: 73000000,
      budgetUtilization: 58.4,
      employeeCount: 847,
      sitesCount: 67,
      pendingApprovals: 8
    }

    data.charts.projectProgress = [
      { project: 'Marina Towers', progress: 65, budget: 85000000, spent: 55250000 },
      { project: 'The L Villas', progress: 42, budget: 25000000, spent: 10500000 },
      { project: 'Business Park Phase 1', progress: 78, budget: 15000000, spent: 11700000 }
    ]

    data.alerts = [
      {
        id: '1',
        type: 'resource',
        severity: 'medium',
        title: 'Equipment Shortage',
        message: 'Tower crane needed for Marina Towers Phase 2',
        orgUnit: 'Marina Towers Project'
      }
    ]

    data.quickStats = [
      { label: 'Projects On Time', value: '78%', change: '+5%', trend: 'up' },
      { label: 'Budget Variance', value: '-2.1%', change: 'improved', trend: 'up' },
      { label: 'Team Productivity', value: '92%', change: '+3%', trend: 'up' },
      { label: 'Quality Score', value: '95.8%', change: '+1.2%', trend: 'up' }
    ]

    return data
  }

  const generateProjectManagerDashboard = (data: any, orgUnitId?: string) => {
    // Project Manager sees project-level metrics
    data.overview = {
      totalProjects: 3,
      activeProjects: 3,
      totalBudget: 85000000,
      spentBudget: 55250000,
      budgetUtilization: 65.0,
      employeeCount: 284,
      sitesCount: 12,
      pendingApprovals: 5
    }

    data.charts.projectProgress = [
      { zone: 'Tower A Zone', progress: 78, milestones: 12, completed: 9 },
      { zone: 'Tower B Zone', progress: 52, milestones: 15, completed: 8 },
      { zone: 'Amenities Zone', progress: 35, milestones: 8, completed: 3 }
    ]

    data.alerts = [
      {
        id: '1',
        type: 'schedule',
        severity: 'high',
        title: 'Foundation Delay',
        message: 'Tower B foundation work delayed by weather conditions',
        orgUnit: 'Tower B Zone'
      }
    ]

    data.quickStats = [
      { label: 'Milestone Progress', value: '67%', change: '+8%', trend: 'up' },
      { label: 'Cost Performance', value: '96.8%', change: '+1.5%', trend: 'up' },
      { label: 'Schedule Performance', value: '94.2%', change: '-2%', trend: 'down' },
      { label: 'Quality Index', value: '97.1%', change: '+0.5%', trend: 'up' }
    ]

    return data
  }

  const generateZoneManagerDashboard = (data: any, orgUnitId?: string) => {
    // Zone Manager sees zone-level operational metrics
    data.overview = {
      totalProjects: 1,
      activeProjects: 1,
      totalBudget: 45000000,
      spentBudget: 29250000,
      budgetUtilization: 65.0,
      employeeCount: 89,
      sitesCount: 4,
      pendingApprovals: 3
    }

    data.charts.projectProgress = [
      { site: 'Foundation & Structure', progress: 85, budget: 15000000, spent: 12750000 },
      { site: 'Mechanical Systems', progress: 45, budget: 12000000, spent: 5400000 },
      { site: 'Interior Finishing', progress: 15, budget: 18000000, spent: 2700000 }
    ]

    data.quickStats = [
      { label: 'Daily Productivity', value: '94%', change: '+2%', trend: 'up' },
      { label: 'Safety Incidents', value: '0', change: '0', trend: 'stable' },
      { label: 'Equipment Uptime', value: '97.5%', change: '+1%', trend: 'up' },
      { label: 'Material Efficiency', value: '91.2%', change: '+3%', trend: 'up' }
    ]

    return data
  }

  const generateSiteEngineerDashboard = (data: any, orgUnitId?: string) => {
    // Site Engineer sees site-level operational details
    data.overview = {
      totalProjects: 1,
      activeProjects: 1,
      totalBudget: 15000000,
      spentBudget: 12750000,
      budgetUtilization: 85.0,
      employeeCount: 23,
      sitesCount: 1,
      pendingApprovals: 2
    }

    data.charts.dailyProgress = [
      { day: 'Mon', planned: 100, actual: 95 },
      { day: 'Tue', planned: 100, actual: 105 },
      { day: 'Wed', planned: 100, actual: 98 },
      { day: 'Thu', planned: 100, actual: 102 },
      { day: 'Fri', planned: 100, actual: 88 }
    ]

    data.quickStats = [
      { label: 'Today\'s Progress', value: '102%', change: '+2%', trend: 'up' },
      { label: 'Crew Attendance', value: '96%', change: '0%', trend: 'stable' },
      { label: 'Material Stock', value: '78%', change: '-5%', trend: 'down' },
      { label: 'Quality Checks', value: '100%', change: '0%', trend: 'stable' }
    ]

    return data
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h3>Loading Dashboard...</h3>
        <p>Preparing your role-based dashboard</p>
      </div>
    )
  }

  if (!currentUser || !dashboardData) {
    return (
      <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3>Access Required</h3>
        <p>Please log in to view your dashboard</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            {getRoleDisplayName(currentUser.role)} Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            Welcome back, {currentUser.name} • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div style={{ marginTop: '8px' }}>
            <OrgSwitcher size="sm" showBreadcrumbs={true} />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          
          {scopedParams.currentOrgUnit && (
            <ScopeChip orgUnitId={scopedParams.currentOrgUnit} />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {dashboardData.quickStats.map((stat: any, index: number) => (
          <div key={index} className="card" style={{
            padding: '20px',
            textAlign: 'center',
            background: index === 0 ? 'var(--accent-primary-light)' :
                       index === 1 ? 'var(--accent-secondary-light)' :
                       index === 2 ? 'var(--accent-info-light)' :
                       'var(--accent-warning-light)',
            border: `1px solid ${index === 0 ? 'var(--accent-primary)' :
                                 index === 1 ? 'var(--accent-secondary)' :
                                 index === 2 ? 'var(--accent-info)' :
                                 'var(--accent-warning)'}`
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: index === 0 ? 'var(--accent-primary)' :
                     index === 1 ? 'var(--accent-secondary)' :
                     index === 2 ? 'var(--accent-info)' :
                     'var(--accent-warning)',
              marginBottom: '4px'
            }}>
              {stat.value}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-muted)', 
              marginBottom: '8px',
              fontWeight: '500' 
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '12px',
              color: stat.trend === 'up' ? 'var(--accent-secondary)' :
                     stat.trend === 'down' ? 'var(--accent-danger)' :
                     'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span>
                {stat.trend === 'up' ? '↗️' :
                 stat.trend === 'down' ? '↘️' : '→'}
              </span>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: currentUser.role === 'PMO' ? '2fr 1fr' : '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Overview Section */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            📊 {getRoleOverviewTitle(currentUser.role)}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {dashboardData.overview.activeProjects}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Active Projects
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                {(dashboardData.overview.spentBudget / 1000000).toFixed(1)}M
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Budget Spent (LYD)
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-info)' }}>
                {dashboardData.overview.employeeCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Team Members
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-warning)' }}>
                {dashboardData.overview.pendingApprovals}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Pending Approvals
              </div>
            </div>
          </div>

          {/* Budget Utilization */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Budget Utilization</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {dashboardData.overview.budgetUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="progress" style={{ height: '10px' }}>
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${Math.min(dashboardData.overview.budgetUtilization, 100)}%`,
                  background: dashboardData.overview.budgetUtilization > 90 ? 'var(--accent-danger)' :
                             dashboardData.overview.budgetUtilization > 75 ? 'var(--accent-warning)' :
                             'var(--accent-primary)'
                }} 
              />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              marginTop: '4px' 
            }}>
              <span>Spent: {(dashboardData.overview.spentBudget / 1000000).toFixed(1)}M LYD</span>
              <span>Budget: {(dashboardData.overview.totalBudget / 1000000).toFixed(1)}M LYD</span>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            🚨 Alerts & Notifications
          </h2>
          
          {dashboardData.alerts.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {dashboardData.alerts.map((alert: any) => (
                <div key={alert.id} style={{
                  padding: '16px',
                  background: alert.severity === 'high' ? 'var(--accent-danger-light)' :
                             alert.severity === 'medium' ? 'var(--accent-warning-light)' :
                             'var(--accent-info-light)',
                  border: `1px solid ${alert.severity === 'high' ? 'var(--accent-danger)' :
                                      alert.severity === 'medium' ? 'var(--accent-warning)' :
                                      'var(--accent-info)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px'
                }}>
                  <div style={{ 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    color: alert.severity === 'high' ? 'var(--accent-danger)' :
                           alert.severity === 'medium' ? 'var(--accent-warning)' :
                           'var(--accent-info)'
                  }}>
                    {alert.title}
                  </div>
                  <div style={{ marginBottom: '8px' }}>{alert.message}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📍 {alert.orgUnit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div>No active alerts</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>All systems operating normally</div>
            </div>
          )}
        </div>
      </div>

      {/* Role-Specific Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: currentUser.role === 'SITE_ENGINEER' ? '1fr' : 
                            currentUser.role === 'PMO' ? 'repeat(3, 1fr)' : 
                            'repeat(2, 1fr)',
        gap: '24px'
      }}>
        {/* Project Progress Chart */}
        {dashboardData.charts.projectProgress && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              📈 {getProgressChartTitle(currentUser.role)}
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {dashboardData.charts.projectProgress.map((item: any, index: number) => (
                <div key={index} style={{
                  padding: '12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>
                      {item.project || item.region || item.zone || item.site}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {item.progress}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '6px', marginBottom: '8px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ width: `${item.progress}%` }} 
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.budget && `Budget: ${(item.budget / 1000000).toFixed(1)}M LYD • `}
                    {item.spent && `Spent: ${(item.spent / 1000000).toFixed(1)}M LYD`}
                    {item.milestones && `${item.completed}/${item.milestones} milestones completed`}
                    {item.onTime && `On time: ${item.onTime}% • Delayed: ${item.delayed}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Trend (PMO/Area Manager) */}
        {dashboardData.charts.budgetTrend && currentUser.role !== 'SITE_ENGINEER' && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              💰 Budget Trend
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {dashboardData.charts.budgetTrend.map((item: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}>
                  <span>{item.month}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>Plan: {(item.planned / 1000000).toFixed(1)}M</span>
                    <span style={{ 
                      color: item.actual >= item.planned ? 'var(--accent-secondary)' : 'var(--accent-danger)',
                      fontWeight: '600'
                    }}>
                      Actual: {(item.actual / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Progress (Site Engineer) */}
        {dashboardData.charts.dailyProgress && currentUser.role === 'SITE_ENGINEER' && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              📅 Daily Progress
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {dashboardData.charts.dailyProgress.map((item: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}>
                  <span style={{ fontWeight: '600' }}>{item.day}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>Target: {item.planned}%</span>
                    <span style={{ 
                      color: item.actual >= item.planned ? 'var(--accent-secondary)' : 'var(--accent-danger)',
                      fontWeight: '600'
                    }}>
                      Actual: {item.actual}%
                    </span>
                    <span>
                      {item.actual >= item.planned ? '✅' : '⚠️'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          ⚡ Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {getQuickActions(currentUser.role).map((action, index) => (
            <button key={index} className="btn-outline btn-sm" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper functions
const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'PMO': return 'PMO Executive'
    case 'AREA_MANAGER': return 'Area Manager'
    case 'PROJECT_MANAGER': return 'Project Manager'
    case 'ZONE_MANAGER': return 'Zone Manager'
    case 'SITE_ENGINEER': return 'Site Engineer'
    default: return role.replace('_', ' ')
  }
}

const getRoleOverviewTitle = (role: UserRole): string => {
  switch (role) {
    case 'PMO': return 'Organizational Overview'
    case 'AREA_MANAGER': return 'Regional Overview'
    case 'PROJECT_MANAGER': return 'Project Overview'
    case 'ZONE_MANAGER': return 'Zone Overview'
    case 'SITE_ENGINEER': return 'Site Overview'
    default: return 'Overview'
  }
}

const getProgressChartTitle = (role: UserRole): string => {
  switch (role) {
    case 'PMO': return 'Regional Performance'
    case 'AREA_MANAGER': return 'Project Progress'
    case 'PROJECT_MANAGER': return 'Zone Progress'
    case 'ZONE_MANAGER': return 'Site Progress'
    case 'SITE_ENGINEER': return 'Task Progress'
    default: return 'Progress'
  }
}

const getQuickActions = (role: UserRole) => {
  const baseActions = [
    { icon: '📊', label: 'View Reports' },
    { icon: '📋', label: 'Review Tasks' }
  ]

  switch (role) {
    case 'PMO':
      return [
        ...baseActions,
        { icon: '🏢', label: 'Org Structure' },
        { icon: '💼', label: 'Strategic Planning' },
        { icon: '📈', label: 'Executive Dashboard' },
        { icon: '👥', label: 'Leadership Team' }
      ]
    case 'AREA_MANAGER':
      return [
        ...baseActions,
        { icon: '🌍', label: 'Regional Overview' },
        { icon: '🏗️', label: 'Project Pipeline' },
        { icon: '💰', label: 'Budget Analysis' },
        { icon: '👥', label: 'Team Management' }
      ]
    case 'PROJECT_MANAGER':
      return [
        ...baseActions,
        { icon: '🎯', label: 'Milestones' },
        { icon: '💰', label: 'Budget Tracking' },
        { icon: '👷', label: 'Resource Planning' },
        { icon: '📅', label: 'Schedule' }
      ]
    case 'ZONE_MANAGER':
      return [
        ...baseActions,
        { icon: '🔧', label: 'Equipment Status' },
        { icon: '👥', label: 'Team Schedule' },
        { icon: '📦', label: 'Material Orders' },
        { icon: '⚠️', label: 'Safety Check' }
      ]
    case 'SITE_ENGINEER':
      return [
        ...baseActions,
        { icon: '📏', label: 'Measurements' },
        { icon: '📋', label: 'Quality Check' },
        { icon: '📷', label: 'Progress Photos' },
        { icon: '⚡', label: 'Daily Report' }
      ]
    default:
      return baseActions
  }
}

export default RoleDashboard
