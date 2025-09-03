import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Wallet,
  AlertTriangle,
  Calendar,
  DollarSign,
  Target,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Bell,
  BarChart3
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'
import apiService from '../services/apiService'
import LoadingScreen from '../components/common/LoadingScreen'

// Sample data for charts
const monthlyRevenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Feb', revenue: 52000, expenses: 38000, profit: 14000 },
  { month: 'Mar', revenue: 48000, expenses: 35000, profit: 13000 },
  { month: 'Apr', revenue: 61000, expenses: 42000, profit: 19000 },
  { month: 'May', revenue: 55000, expenses: 40000, profit: 15000 },
  { month: 'Jun', revenue: 67000, expenses: 45000, profit: 22000 }
]

const siteProgressData = [
  { name: 'Site A', progress: 85, target: 90 },
  { name: 'Site B', progress: 72, target: 75 },
  { name: 'Site C', progress: 95, target: 100 },
  { name: 'Site D', progress: 60, target: 80 }
]

const expenseCategories = [
  { name: 'Materials', value: 45000, color: '#8884d8' },
  { name: 'Labor', value: 32000, color: '#82ca9d' },
  { name: 'Equipment', value: 18000, color: '#ffc658' },
  { name: 'Transport', value: 12000, color: '#ff7300' }
]

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { addNotification } = useUI()
  
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  
  useEffect(() => {
    loadDashboardData()
  }, [user])
  
  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Load dashboard data based on user role
      const [stats, approvals, notifs] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getPendingApprovals().catch(() => []),
        apiService.getNotifications().catch(() => [])
      ])
      
      setDashboardStats(stats)
      setPendingApprovals(approvals)
      setNotifications(notifs)
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data'
      })
    } finally {
      setLoading(false)
    }
  }
  
  if (loading || !user || !dashboardStats) {
    return <LoadingScreen />
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', { style: 'currency', currency: 'LYD' }).format(amount)
  }
  
  const handleApproveAction = async (workflowId: string) => {
    try {
      await apiService.processApproval(workflowId, 'approve')
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Approval processed successfully'
      })
      loadDashboardData() // Refresh data
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to process approval'
      })
    }
  }
  
  // Role-based dashboard title and description
  const getDashboardTitle = () => {
    switch (user.role) {
      case 'PMO':
        return { title: 'PMO Executive Dashboard', desc: 'Organization-wide overview and strategic metrics' }
      case 'AREA_MANAGER':
        return { title: 'Area Management Dashboard', desc: 'Regional operations and performance monitoring' }
      case 'PROJECT_MANAGER':
        return { title: 'Project Management Dashboard', desc: 'Project progress and resource management' }
      case 'ZONE_MANAGER':
        return { title: 'Zone Operations Dashboard', desc: 'Zone-level activities and task management' }
      case 'SITE_ENGINEER':
        return { title: 'Engineering Dashboard', desc: 'Site progress and technical oversight' }
      default:
        return { title: 'Dashboard', desc: 'Overview of your activities' }
    }
  }
  
  const { title, desc } = getDashboardTitle()
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{desc}</p>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-muted-foreground">Welcome back, </span>
            <span className="font-medium text-foreground ml-1">
              {user.firstName} {user.lastName} ({user.role})
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-LY', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>
      
      {/* Role-based KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboardStats.totalBudget || 0)}</p>
              <p className="text-blue-200 text-xs mt-1">Allocated funds</p>
            </div>
            <Wallet className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Active Sites</p>
              <p className="text-2xl font-bold text-foreground">{dashboardStats.activeSites || 0}</p>
              <p className="text-muted-foreground text-xs mt-1">of {dashboardStats.totalSites || 0} total</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Pending Approvals</p>
              <p className="text-2xl font-bold text-foreground">{dashboardStats.pendingApprovals || 0}</p>
              <p className="text-muted-foreground text-xs mt-1">Requiring action</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Average Progress</p>
              <p className="text-2xl font-bold text-foreground">{dashboardStats.avgProgress || 0}%</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardStats.avgProgress || 0}%` }}
                />
              </div>
            </div>
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {/* Pending Approvals Section - Show for managers */}
      {['PMO', 'AREA_MANAGER', 'PROJECT_MANAGER', 'ZONE_MANAGER'].includes(user.role) && pendingApprovals.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Pending Approvals ({pendingApprovals.length})
              </h3>
            </div>
          </div>
          <div className="space-y-3">
            {pendingApprovals.slice(0, 5).map((approval: any) => (
              <div key={approval.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {approval.entityType} - {approval.metadata?.description || 'Approval Required'}
                  </p>
                  {approval.totalAmount && (
                    <p className="text-sm text-muted-foreground">
                      Amount: {formatCurrency(approval.totalAmount)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveAction(approval.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue vs Expenses */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Site Progress */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Site Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={siteProgressData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
              <Legend />
              <Bar dataKey="progress" fill="#3b82f6" name="Current Progress" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Categories Pie Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Payment received from Client ABC</p>
                <p className="text-xs text-muted-foreground">2 hours ago • {formatCurrency(15000)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New employee added to Site B</p>
                <p className="text-xs text-muted-foreground">5 hours ago • John Smith, Site Engineer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Material expense requires approval</p>
                <p className="text-xs text-muted-foreground">1 day ago • {formatCurrency(8500)} pending</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Site A progress updated</p>
                <p className="text-xs text-muted-foreground">2 days ago • 85% complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
