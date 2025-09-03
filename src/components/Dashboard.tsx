import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRBAC, ProtectedComponent } from '../contexts/RBACContext'
import { useActionButtons, useScopedQueryParams } from '../hooks/useOrgScoped'
import { ScopeChip } from './ScopeChip'
import { EmployeeManagement } from './EmployeeManagement'
import { SafesManagement } from './SafesManagement'
import { SiteManagement } from './SiteManagement'
import UserManagement from './UserManagement'
import { ExpensesManagement } from './ExpensesManagement'
import { RevenuesManagement } from './RevenuesManagement'
import { PayrollManagement } from './PayrollManagement'
import { ReportsManagement } from './ReportsManagement'
import { Settings, SettingsProvider, useSettings } from './Settings'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts'

interface NavItem {
  id: string
  label: {
    EN: string
    AR: string
  }
  icon: string
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: { EN: 'Dashboard', AR: 'لوحة التحكم' }, icon: '📊' },
  { id: 'employees', label: { EN: 'Employees', AR: 'الموظفون' }, icon: '👥' },
  { id: 'sites', label: { EN: 'Sites', AR: 'المواقع' }, icon: '🏗️' },
  { id: 'users', label: { EN: 'Users', AR: 'المستخدمون' }, icon: '👤' },
  { id: 'safes', label: { EN: 'Safes', AR: 'الخزائن' }, icon: '💰' },
  { id: 'expenses', label: { EN: 'Expenses', AR: 'المصروفات' }, icon: '💸' },
  { id: 'revenues', label: { EN: 'Revenues', AR: 'الإيرادات' }, icon: '💹' },
  { id: 'payroll', label: { EN: 'Payroll', AR: 'الرواتب' }, icon: '💵' },
  { id: 'reports', label: { EN: 'Reports', AR: 'التقارير' }, icon: '📈' },
  { id: 'settings', label: { EN: 'Settings', AR: 'الإعدادات' }, icon: '⚙️' },
]

export function Dashboard() {
  return (
    <SettingsProvider>
      <DashboardContent />
    </SettingsProvider>
  )
}

export default Dashboard

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, legacyUser, logout } = useAuth()
  const { language, theme } = useSettings()

  // Debug logging
  console.log('Dashboard - user:', user)
  console.log('Dashboard - legacyUser:', legacyUser)

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Employee':
        setActiveTab('employees')
        break
      case 'New Site':
        setActiveTab('sites')
        break
      case 'Record Expense':
        setActiveTab('expenses')
        break
      case 'Generate Report':
        setActiveTab('reports')
        break
      default:
        break
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onQuickAction={handleQuickAction} />
      case 'employees':
        return <EmployeeManagement />
      case 'sites':
        return <SiteManagement />
      case 'users':
        return <UserManagement />
      case 'safes':
        return <SafesManagement />
      case 'expenses':
        return <ExpensesManagement />
      case 'revenues':
        return <RevenuesManagement />
      case 'payroll':
        return <PayrollManagement />
      case 'reports':
        return <ReportsManagement />
      case 'settings':
        return <Settings />
      default:
        return <ComingSoonContent tabName={activeTab} />
    }
  }

  // Apply theme to document root on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('dir', language === 'AR' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', language === 'AR' ? 'ar' : 'en')
  }, [theme, language])

  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string, AR: string }> = {
      'management_system': { EN: 'Management System', AR: 'نظام إدارة البناء' },
      'welcome_back': { EN: 'Welcome back', AR: 'مرحباً بعودتك' },
      'logout': { EN: 'Logout', AR: 'تسجيل خروج' },
      'dashboard': { EN: 'Dashboard', AR: 'لوحة التحكم' },
      'total_employees': { EN: 'Total Employees', AR: 'إجمالي الموظفين' },
      'active_sites': { EN: 'Active Sites', AR: 'المواقع النشطة' },
      'monthly_revenue': { EN: 'Monthly Revenue', AR: 'الإيرادات الشهرية' },
      'outstanding_balance': { EN: 'Outstanding Balance', AR: 'الرصيد المعلق' },
      'recent_activity': { EN: 'Recent Activity', AR: 'النشاط الأخير' },
      'quick_actions': { EN: 'Quick Actions', AR: 'إجراءات سريعة' },
      'new_employee_added': { EN: 'New employee added:', AR: 'تم إضافة موظف جديد:' },
      'site_progress_updated': { EN: 'construction progress updated', AR: 'تم تحديث تقدم البناء' },
      'payroll_processed': { EN: 'Payroll processed for March', AR: 'تم معالجة الرواتب لشهر مارس' },
      'new_expense_recorded': { EN: 'New expense recorded:', AR: 'تم تسجيل مصروف جديد:' },
      'office_supplies': { EN: 'Office supplies', AR: 'لوازم مكتبية' },
      'add_employee': { EN: 'Add Employee', AR: 'إضافة موظف' },
      'new_site': { EN: 'New Site', AR: 'موقع جديد' },
      'record_expense': { EN: 'Record Expense', AR: 'تسجيل مصروف' },
      'generate_report': { EN: 'Generate Report', AR: 'إنشاء تقرير' },
      'hours_ago': { EN: 'hours ago', AR: 'ساعة مضت' },
      'day_ago': { EN: 'day ago', AR: 'يوم مضى' },
      'days_ago': { EN: 'days ago', AR: 'أيام مضت' },
      'john_smith': { EN: 'John Smith', AR: 'جون سميث' },
      'site_alpha': { EN: 'Site Alpha', AR: 'موقع ألفا' }
    }
    return translations[key]?.[language] || fallback || key
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      maxWidth: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-secondary)' 
    }}>
      {/* Sidebar */}
      <div className="sidebar" style={{
        width: sidebarOpen ? '280px' : '80px',
        backgroundColor: theme === 'dark' ? '#0f172a' : '#1e293b',
        color: 'white',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header with Company Branding */}
        <div style={{
          padding: '20px',
          borderBottom: theme === 'dark' ? '1px solid #475569' : '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ☰
          </button>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {/* Company Logo in Sidebar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🏗️
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  margin: 0, 
                  direction: language === 'AR' ? 'rtl' : 'ltr',
                  lineHeight: '1.2'
                }}>
                  {t('management_system', 'Management System')}
                </h1>
                <p style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  margin: 0,
                  fontWeight: '400'
                }}>
                  {language === 'AR' ? 'البناء والإدارة' : 'Construction & Management'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {navigationItems.map((item) => {
            // Define resource mapping for permission checking
            const resourceMap: Record<string, string> = {
              'dashboard': 'dashboard',
              'employees': 'employees',
              'sites': 'sites',
              'users': 'users',
              'safes': 'safes',
              'expenses': 'expenses',
              'revenues': 'revenues',
              'payroll': 'payroll',
              'reports': 'reports',
              'settings': 'settings'
            }

            const resource = resourceMap[item.id]
            if (!resource || resource === 'dashboard') {
              // Dashboard is always visible
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="fade-in"
                  style={{
                    width: '100%',
                    padding: sidebarOpen ? (language === 'AR' ? '12px 20px 12px 12px' : '12px 20px') : '12px',
                    backgroundColor: activeTab === item.id ? 'var(--accent-primary)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    outline: 'none',
                    textAlign: language === 'AR' ? 'right' : 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s ease',
                    fontSize: '14px',
                    direction: language === 'AR' ? 'rtl' : 'ltr',
                    flexDirection: language === 'AR' ? 'row-reverse' : 'row',
                    borderRadius: '8px',
                    margin: '2px 8px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== item.id) {
                      (e.target as HTMLElement).style.backgroundColor = theme === 'dark' ? '#475569' : '#334155'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== item.id) {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span style={{ 
                    fontSize: sidebarOpen ? '24px' : '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minWidth: '32px'
                  }}>{item.icon}</span>
                  {sidebarOpen && <span>{item.label[language]}</span>}
                </button>
              )
            }

            // Protected navigation items
            return (
              <ProtectedComponent key={item.id} resource={resource as any} action="read" fallback={null}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className="fade-in"
                  style={{
                    width: '100%',
                    padding: sidebarOpen ? (language === 'AR' ? '12px 20px 12px 12px' : '12px 20px') : '12px',
                    backgroundColor: activeTab === item.id ? 'var(--accent-primary)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    outline: 'none',
                    textAlign: language === 'AR' ? 'right' : 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s ease',
                    fontSize: '14px',
                    direction: language === 'AR' ? 'rtl' : 'ltr',
                    flexDirection: language === 'AR' ? 'row-reverse' : 'row',
                    borderRadius: '8px',
                    margin: '2px 8px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== item.id) {
                      (e.target as HTMLElement).style.backgroundColor = theme === 'dark' ? '#475569' : '#334155'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== item.id) {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span style={{ 
                    fontSize: sidebarOpen ? '24px' : '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minWidth: '32px'
                  }}>{item.icon}</span>
                  {sidebarOpen && <span>{item.label[language]}</span>}
                </button>
              </ProtectedComponent>
            )
          })}
        </nav>

        {/* Organizational Context Footer */}
        {sidebarOpen && (
          <div style={{
            padding: '16px 20px',
            borderTop: theme === 'dark' ? '1px solid #475569' : '1px solid #334155',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', opacity: 0.7, color: 'rgba(255,255,255,0.7)' }}>
                {language === 'AR' ? 'النطاق التنظيمي' : 'Organizational Scope'}
              </span>
            </div>
            <ScopeChip 
              className="sidebar-scope" 
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
          </div>
        )}

      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          direction: language === 'AR' ? 'rtl' : 'ltr',
          height: '72px', // Fixed height for consistency
          flexShrink: 0
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
            {navigationItems.find(item => item.id === activeTab)?.label[language] || t('dashboard', 'Dashboard')}
          </h2>
          
          {/* User and Logout Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            direction: language === 'AR' ? 'rtl' : 'ltr',
            flexDirection: language === 'AR' ? 'row-reverse' : 'row'
          }}>
            {/* Organizational Scope Indicator */}
            <ScopeChip className="" />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white'
              }}>
                {legacyUser?.name?.charAt(0) || (user?.firstName?.charAt(0) || user?.lastName?.charAt(0)) || 'U'}
              </div>
              <div style={{ textAlign: language === 'AR' ? 'right' : 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {legacyUser?.name || (user ? `${user.firstName} ${user.lastName}` : '')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {legacyUser?.role || (user?.roles?.[0] || 'User')}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-danger)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                direction: language === 'AR' ? 'rtl' : 'ltr'
              }}
            >
              {t('logout', 'Logout')}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          maxWidth: 'calc(100vw - 280px)',
          boxSizing: 'border-box'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

function DashboardOverview({ onQuickAction }: { onQuickAction: (action: string) => void }) {
  const { language } = useSettings()
  
  // Organizational scope integration
  const scopedParams = useScopedQueryParams()
  const { canCreate: canCreateEmployee, canUpdate: canUpdateEmployee } = useActionButtons('employees')
  const { canCreate: canCreateSite, canUpdate: canUpdateSite } = useActionButtons('sites')
  const { canCreate: canCreateExpense } = useActionButtons('expenses')
  const { canCreate: canCreateReport } = useActionButtons('reports')
  
  // Sample data with org unit associations for scoping
  const allEmployeesData = [
    { orgUnitId: 'ou-libya-ops', count: 8 },
    { orgUnitId: 'ou-tripoli-central', count: 6 },
    { orgUnitId: 'ou-finance-dept', count: 4 },
    { orgUnitId: 'ou-benghazi-ops', count: 6 }
  ]
  
  const allSitesData = [
    { orgUnitId: 'ou-libya-ops', count: 2 },
    { orgUnitId: 'ou-tripoli-central', count: 1 },
    { orgUnitId: 'ou-benghazi-ops', count: 2 }
  ]
  
  // Calculate scoped statistics
  const scopedEmployeesCount = allEmployeesData
    .filter(item => !scopedParams.orgUnitIds || scopedParams.orgUnitIds.includes(item.orgUnitId))
    .reduce((sum, item) => sum + item.count, 0)
    
  const scopedSitesCount = allSitesData
    .filter(item => !scopedParams.orgUnitIds || scopedParams.orgUnitIds.includes(item.orgUnitId))
    .reduce((sum, item) => sum + item.count, 0)
  
  // Sample chart data with org unit context (would be filtered in real implementation)
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 35000, expenses: 28000 },
    { month: 'Feb', revenue: 42000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 38000 },
    { month: 'Apr', revenue: 51000, expenses: 41000 },
    { month: 'May', revenue: 45000, expenses: 39000 },
    { month: 'Jun', revenue: 58000, expenses: 45000 },
    { month: 'Jul', revenue: 62000, expenses: 48000 },
    { month: 'Aug', revenue: 67000, expenses: 52000 }
  ]

  const allSiteProgressData = [
    { name: 'Site Alpha', progress: 85, budget: 2500000, spent: 2100000, orgUnitId: 'ou-libya-ops' },
    { name: 'Site Beta', progress: 65, budget: 1800000, spent: 1170000, orgUnitId: 'ou-tripoli-central' },
    { name: 'Site Gamma', progress: 92, budget: 3200000, spent: 2944000, orgUnitId: 'ou-benghazi-ops' },
    { name: 'Site Delta', progress: 43, budget: 1500000, spent: 645000, orgUnitId: 'ou-libya-ops' },
    { name: 'Site Epsilon', progress: 78, budget: 2800000, spent: 2184000, orgUnitId: 'ou-tripoli-central' }
  ]
  
  // Filter site progress data based on org scope
  const siteProgressData = allSiteProgressData.filter(site => 
    !scopedParams.orgUnitIds || scopedParams.orgUnitIds.includes(site.orgUnitId)
  )

  const expenseBreakdownData = [
    { name: 'Labor', value: 45, amount: 28000 },
    { name: 'Materials', value: 30, amount: 18500 },
    { name: 'Equipment', value: 15, amount: 9200 },
    { name: 'Permits', value: 6, amount: 3800 },
    { name: 'Other', value: 4, amount: 2500 }
  ]

  const projectTimelineData = [
    { month: 'Jan', planned: 20, actual: 18 },
    { month: 'Feb', planned: 35, actual: 32 },
    { month: 'Mar', planned: 50, actual: 48 },
    { month: 'Apr', planned: 65, actual: 61 },
    { month: 'May', planned: 75, actual: 73 },
    { month: 'Jun', planned: 85, actual: 82 },
    { month: 'Jul', planned: 92, actual: 89 },
    { month: 'Aug', planned: 100, actual: 95 }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  
  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string, AR: string }> = {
      'total_employees': { EN: 'Total Employees', AR: 'إجمالي الموظفين' },
      'active_sites': { EN: 'Active Sites', AR: 'المواقع النشطة' },
      'monthly_revenue': { EN: 'Monthly Revenue', AR: 'الإيرادات الشهرية' },
      'outstanding_balance': { EN: 'Outstanding Balance', AR: 'الرصيد المعلق' },
      'recent_activity': { EN: 'Recent Activity', AR: 'النشاط الأخير' },
      'quick_actions': { EN: 'Quick Actions', AR: 'إجراءات سريعة' },
      'revenue_vs_expenses': { EN: 'Revenue vs Expenses', AR: 'الإيرادات مقابل المصروفات' },
      'site_progress': { EN: 'Site Progress Overview', AR: 'نظرة عامة على تقدم المواقع' },
      'expense_breakdown': { EN: 'Expense Breakdown', AR: 'تفصيل المصروفات' },
      'project_timeline': { EN: 'Project Timeline', AR: 'الجدول الزمني للمشروع' },
      'add_employee': { EN: 'Add Employee', AR: 'إضافة موظف' },
      'new_site': { EN: 'New Site', AR: 'موقع جديد' },
      'record_expense': { EN: 'Record Expense', AR: 'تسجيل مصروف' },
      'generate_report': { EN: 'Generate Report', AR: 'إنشاء تقرير' },
      'new_employee_added': { EN: 'New employee added: John Smith', AR: 'تم إضافة موظف جديد: جون سميث' },
      'site_progress_updated': { EN: 'Site Alpha construction progress updated', AR: 'تم تحديث تقدم البناء في موقع ألفا' },
      'payroll_processed': { EN: 'Payroll processed for March', AR: 'تم معالجة الرواتب لشهر مارس' },
      'new_expense_recorded': { EN: 'New expense recorded: Office supplies', AR: 'تم تسجيل مصروف جديد: لوازم مكتبية' },
      'hours_ago_2': { EN: '2 hours ago', AR: 'منذ ساعتين' },
      'hours_ago_4': { EN: '4 hours ago', AR: 'منذ 4 ساعات' },
      'day_ago_1': { EN: '1 day ago', AR: 'منذ يوم' },
      'days_ago_2': { EN: '2 days ago', AR: 'منذ يومين' },
      'revenue': { EN: 'Revenue', AR: 'الإيرادات' },
      'expenses': { EN: 'Expenses', AR: 'المصروفات' },
      'planned': { EN: 'Planned', AR: 'المخطط' },
      'actual': { EN: 'Actual', AR: 'الفعلي' }
    }
    return translations[key]?.[language] || fallback || key
  }

  return (
    <div style={{ direction: language === 'AR' ? 'rtl' : 'ltr' }}>
      {/* Dashboard Statistics - Scoped to User's Organizational Context */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard 
          title={t('total_employees', 'Total Employees')} 
          value={scopedEmployeesCount.toString()} 
          icon="👥" 
          color="var(--accent-primary)" 
        />
        <StatCard 
          title={t('active_sites', 'Active Sites')} 
          value={scopedSitesCount.toString()} 
          icon="🏗️" 
          color="var(--accent-secondary)" 
        />
        <StatCard 
          title={t('monthly_revenue', 'Monthly Revenue')} 
          value="45,230" 
          icon="💹" 
          color="var(--accent-warning)" 
          currency={true} 
        />
        <StatCard 
          title={t('outstanding_balance', 'Outstanding Balance')} 
          value="12,500" 
          icon="💰" 
          color="var(--accent-danger)" 
          currency={true} 
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Revenue vs Expenses Chart */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 {t('revenue_vs_expenses', 'Revenue vs Expenses')}
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name={t('revenue', 'Revenue')} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name={t('expenses', 'Expenses')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Site Progress Chart */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏗️ {t('site_progress', 'Site Progress Overview')}
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'progress' ? `${value}%` : `$${value.toLocaleString()}`,
                    name === 'progress' ? 'Progress' : name === 'budget' ? 'Budget' : 'Spent'
                  ]}
                />
                <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Expense Breakdown Pie Chart */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💸 {t('expense_breakdown', 'Expense Breakdown')}
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value}% ($${props.payload.amount.toLocaleString()})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Timeline Chart */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 {t('project_timeline', 'Project Timeline')}
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Line type="monotone" dataKey="planned" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" name={t('planned', 'Planned')} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} name={t('actual', 'Actual')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity and Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🕒 {t('recent_activity', 'Recent Activity')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ActivityItem 
              action={t('new_employee_added', 'New employee added: John Smith')} 
              time={t('hours_ago_2', '2 hours ago')} 
              type="employee" 
              orgUnitId="ou-libya-ops"
              scopedParams={scopedParams}
            />
            <ActivityItem 
              action={t('site_progress_updated', 'Site Alpha construction progress updated')} 
              time={t('hours_ago_4', '4 hours ago')} 
              type="site" 
              orgUnitId="ou-libya-ops"
              scopedParams={scopedParams}
            />
            <ActivityItem 
              action={t('payroll_processed', 'Payroll processed for March')} 
              time={t('day_ago_1', '1 day ago')} 
              type="payroll" 
              orgUnitId="ou-finance-dept"
              scopedParams={scopedParams}
            />
            <ActivityItem 
              action={t('new_expense_recorded', 'New expense recorded: Office supplies')} 
              time={t('days_ago_2', '2 days ago')} 
              type="expense" 
              orgUnitId="ou-tripoli-central"
              scopedParams={scopedParams}
            />
          </div>
        </div>

        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ {t('quick_actions', 'Quick Actions')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <QuickActionButton 
              icon="👤" 
              label={t('add_employee', 'Add Employee')} 
              onClick={() => onQuickAction('Add Employee')} 
              language={language}
              enabled={canCreateEmployee}
              tooltip={canCreateEmployee ? undefined : 'No permission to add employees'}
            />
            <QuickActionButton 
              icon="🏗️" 
              label={t('new_site', 'New Site')} 
              onClick={() => onQuickAction('New Site')} 
              language={language}
              enabled={canCreateSite}
              tooltip={canCreateSite ? undefined : 'No permission to create sites'}
            />
            <QuickActionButton 
              icon="💸" 
              label={t('record_expense', 'Record Expense')} 
              onClick={() => onQuickAction('Record Expense')} 
              language={language}
              enabled={canCreateExpense}
              tooltip={canCreateExpense ? undefined : 'No permission to record expenses'}
            />
            <QuickActionButton 
              icon="📊" 
              label={t('generate_report', 'Generate Report')} 
              onClick={() => onQuickAction('Generate Report')} 
              language={language}
              enabled={canCreateReport}
              tooltip={canCreateReport ? undefined : 'No permission to generate reports'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmployeesContent() {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Employee Management</h3>
        <button style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          + Add Employee
        </button>
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          Manage your employees, track their information, and handle payroll.
        </p>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search employees..."
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Position</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Site</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <EmployeeRow name="John Smith" position="Site Manager" site="Alpha Site" status="Active" />
              <EmployeeRow name="Sarah Johnson" position="Engineer" site="Beta Site" status="Active" />
              <EmployeeRow name="Mike Davis" position="Supervisor" site="Alpha Site" status="On Leave" />
              <EmployeeRow name="Lisa Wilson" position="Accountant" site="Central Office" status="Active" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SitesContent() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <SiteCard 
          name="Alpha Construction Site" 
          manager="John Smith" 
          progress={75} 
          status="Active"
          employees={12}
        />
        <SiteCard 
          name="Beta Development Site" 
          manager="Sarah Johnson" 
          progress={45} 
          status="Active"
          employees={8}
        />
        <SiteCard 
          name="Gamma Infrastructure" 
          manager="Mike Davis" 
          progress={90} 
          status="Completing"
          employees={15}
        />
      </div>
    </div>
  )
}

function ComingSoonContent({ tabName }: { tabName: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-light)',
      padding: '60px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
        {tabName.charAt(0).toUpperCase() + tabName.slice(1)} Module
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        This feature is coming soon. Stay tuned for updates!
      </p>
    </div>
  )
}

function StatCard({ title, value, icon, color, currency }: { title: string, value: string, icon: string, color: string, currency?: boolean }) {
  const { language } = useSettings()
  return (
    <div className="card card-elevated" style={{
      backgroundColor: 'var(--bg-primary)',
      padding: '24px',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'var(--transition-normal)'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: `${color}15`,
        opacity: 0.5
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        right: '-10px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `${color}20`,
        opacity: 0.3
      }} />
      
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-lg)',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        boxShadow: `0 8px 16px ${color}40`,
        position: 'relative',
        zIndex: 1
      }}>
        {icon}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="numbers" style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          marginBottom: '4px'
        }}>
          {currency ? (language === 'AR' ? `${value} د.ل` : `$${value}`) : value}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)',
          fontWeight: '500'
        }}>{title}</div>
      </div>
    </div>
  )
}

function ActivityItem({ 
  action, 
  time, 
  type, 
  orgUnitId, 
  scopedParams 
}: { 
  action: string, 
  time: string, 
  type: string, 
  orgUnitId?: string,
  scopedParams?: any 
}) {
  const icons: Record<string, string> = {
    employee: '👤',
    site: '🏗️',
    payroll: '💵',
    expense: '💸'
  }
  
  // Filter activity items based on org scope
  if (orgUnitId && scopedParams?.orgUnitIds && scopedParams.orgUnitIds.length > 0) {
    if (!scopedParams.orgUnitIds.includes(orgUnitId)) {
      return null // Don't show activities outside user's scope
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-light)'
    }}>
      <span style={{ fontSize: '16px' }}>{icons[type] || '📋'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{action}</div>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{time}</span>
          {orgUnitId && (
            <span style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '500'
            }}>
              {orgUnitId.split('-').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ 
  icon, 
  label, 
  onClick, 
  language, 
  enabled = true, 
  tooltip 
}: { 
  icon: string, 
  label: string, 
  onClick?: () => void, 
  language?: string,
  enabled?: boolean,
  tooltip?: string
}) {
  const buttonContent = (
    <button 
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: enabled ? 'var(--bg-tertiary)' : 'var(--bg-disabled, #f3f4f6)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        cursor: enabled ? 'pointer' : 'not-allowed',
        transition: 'background-color 0.2s ease',
        fontSize: '14px',
        width: '100%',
        textAlign: language === 'AR' ? 'right' : 'left',
        direction: language === 'AR' ? 'rtl' : 'ltr',
        color: enabled ? 'var(--text-primary)' : 'var(--text-disabled, #9ca3af)',
        opacity: enabled ? 1 : 0.6
      }}
      onMouseEnter={(e) => {
        if (enabled) {
          (e.target as HTMLElement).style.backgroundColor = 'var(--border-light)'
        }
      }}
      onMouseLeave={(e) => {
        if (enabled) {
          (e.target as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)'
        }
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {!enabled && (
        <span style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: 'var(--text-disabled)',
          opacity: 0.7
        }}>
          🔒
        </span>
      )}
    </button>
  )
  
  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <div 
        title={tooltip}
        style={{ position: 'relative', display: 'block' }}
      >
        {buttonContent}
      </div>
    )
  }
  
  return buttonContent
}

function EmployeeRow({ name, position, site, status }: { name: string, position: string, site: string, status: string }) {
  const statusColor = status === 'Active' ? '#10b981' : status === 'On Leave' ? '#f59e0b' : '#ef4444'
  
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '12px', fontSize: '14px' }}>{name}</td>
      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{position}</td>
      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{site}</td>
      <td style={{ padding: '12px' }}>
        <span style={{
          backgroundColor: statusColor + '20',
          color: statusColor,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {status}
        </span>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '4px 8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            Edit
          </button>
          <button style={{
            padding: '4px 8px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function SiteCard({ name, manager, progress, status, employees }: { 
  name: string, 
  manager: string, 
  progress: number, 
  status: string,
  employees: number 
}) {
  return (
    <div className="card fade-in" style={{
      backgroundColor: 'var(--bg-primary)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px var(--shadow-light)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>{name}</h4>
        <span style={{
          backgroundColor: status === 'Active' ? '#10b981' : '#f59e0b',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          {status}
        </span>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Manager: {manager}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Employees: {employees}</div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Progress</span>
          <span className="numbers" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{progress}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--border-light)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'var(--accent-primary)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <button style={{
        width: '100%',
        padding: '8px',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px'
      }}>
        View Details
      </button>
    </div>
  )
}
