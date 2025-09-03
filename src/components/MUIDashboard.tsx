import React, { useState } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedComponent } from '../contexts/RBACContext';
import { useSettings } from './Settings';
import { NotificationBell, NotificationProvider } from './NotificationSystem';
import AdvancedEmployeeManagement from './AdvancedEmployeeManagement';
import AdvancedFinancialManagement from './AdvancedFinancialManagement';
import AdvancedEquipmentManagement from './AdvancedEquipmentManagement';
import AdvancedProjectManagement from './AdvancedProjectManagement';

// Import existing components
import { EmployeeManagement } from './EmployeeManagement';
import { SafesManagement } from './SafesManagement';
import { SiteManagement } from './SiteManagement';
import UserManagement from './UserManagement';
import { ExpensesManagement } from './ExpensesManagement';
import { RevenuesManagement } from './RevenuesManagement';
import { PayrollManagement } from './PayrollManagement';
import { ReportsManagement } from './ReportsManagement';
import { Settings, SettingsProvider } from './Settings';

// Import custom UI components
import { Box } from './ui/Box';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';
import { Avatar } from './ui/Avatar';
import { Container } from './ui/Container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Badge } from './ui/Badge';

// Import icons (using lucide-react for consistency)
import { 
  LayoutDashboard,
  Users,
  HardHat,
  User,
  Banknote,
  TrendingUp,
  CreditCard,
  FileText,
  Settings as SettingsIcon,
  Menu,
  LogOut,
  Plus,
  Building,
  Receipt,
  BarChart3,
  Bell,
  Wrench
} from 'lucide-react';

interface NavItem {
  id: string;
  label: { EN: string; AR: string };
  icon: React.ReactNode;
  resource?: string;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: { EN: 'Dashboard', AR: 'لوحة التحكم' }, icon: <LayoutDashboard size={20} /> },
  { id: 'projects', label: { EN: 'Projects', AR: 'المشاريع' }, icon: <FileText size={20} />, resource: 'sites' },
  { id: 'employees', label: { EN: 'Employees', AR: 'الموظفون' }, icon: <Users size={20} />, resource: 'employees' },
  { id: 'sites', label: { EN: 'Sites', AR: 'المواقع' }, icon: <HardHat size={20} />, resource: 'sites' },
  { id: 'equipment', label: { EN: 'Equipment', AR: 'المعدات' }, icon: <Wrench size={20} />, resource: 'sites' },
  { id: 'users', label: { EN: 'Users', AR: 'المستخدمون' }, icon: <User size={20} />, resource: 'users' },
  { id: 'safes', label: { EN: 'Safes', AR: 'الخزائن' }, icon: <Banknote size={20} />, resource: 'safes' },
  { id: 'expenses', label: { EN: 'Expenses', AR: 'المصروفات' }, icon: <CreditCard size={20} />, resource: 'expenses' },
  { id: 'revenues', label: { EN: 'Revenues', AR: 'الإيرادات' }, icon: <TrendingUp size={20} />, resource: 'revenues' },
  { id: 'payroll', label: { EN: 'Payroll', AR: 'الرواتب' }, icon: <CreditCard size={20} />, resource: 'payroll' },
  { id: 'reports', label: { EN: 'Reports', AR: 'التقارير' }, icon: <FileText size={20} />, resource: 'reports' },
  { id: 'settings', label: { EN: 'Settings', AR: 'الإعدادات' }, icon: <SettingsIcon size={20} />, resource: 'settings' },
];

export function MUIDashboard() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <MUIDashboardContent />
      </NotificationProvider>
    </SettingsProvider>
  );
}

function MUIDashboardContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, legacyUser, logout } = useAuth();
  const { language, theme } = useSettings();

  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      management_system: { EN: 'Management System', AR: 'نظام إدارة البناء' },
      welcome_back: { EN: 'Welcome back', AR: 'مرحباً بعودتك' },
      logout: { EN: 'Logout', AR: 'تسجيل خروج' },
      construction_management: { EN: 'Construction Management', AR: 'إدارة البناء' },
    };
    return translations[key]?.[language] || fallback || key;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Employee':
        setActiveTab('employees');
        break;
      case 'New Site':
        setActiveTab('sites');
        break;
      case 'Record Expense':
        setActiveTab('expenses');
        break;
      case 'Generate Report':
        setActiveTab('reports');
        break;
      default:
        break;
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MUIDashboardOverview onQuickAction={handleQuickAction} />;
      case 'projects':
        return <AdvancedProjectManagement />;
      case 'employees':
        return <AdvancedEmployeeManagement />;
      case 'sites':
        return <SiteManagement />;
      case 'users':
        return <UserManagement />;
      case 'safes':
        return <SafesManagement />;
      case 'expenses':
        return <AdvancedFinancialManagement />;
      case 'revenues':
        return <RevenuesManagement />;
      case 'payroll':
        return <PayrollManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'settings':
        return <Settings />;
      case 'equipment':
        return <AdvancedEquipmentManagement />;
      case 'financial':
        return <AdvancedFinancialManagement />;
      default:
        return <ComingSoonContent tabName={activeTab} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Navigation Bar */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 py-4 min-h-[80px]">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10 bg-white/20">
                <HardHat className="w-6 h-6 text-white" />
              </Avatar>
              <div>
                <Typography variant="h5" className="text-white font-bold">
                  {t('management_system', 'Management System')}
                </Typography>
                <Typography variant="caption" className="text-white/70">
                  {t('construction_management', language === 'AR' ? 'البناء والإدارة' : 'Construction & Management')}
                </Typography>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="flex-1 flex justify-center mx-8">
              <div className="bg-white/10 rounded-lg p-1 backdrop-blur-sm">
                <nav className="flex gap-1 overflow-x-auto">
                  {navigationItems.map((item) => {
                    const TabButton = ({ children }: { children: React.ReactNode }) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-[120px] justify-center whitespace-nowrap ${
                          activeTab === item.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {item.icon}
                        <span className="hidden sm:inline">{item.label[language]}</span>
                      </button>
                    );

                    if (item.resource && item.id !== 'dashboard') {
                      return (
                        <ProtectedComponent key={item.id} resource={item.resource as any} action="read" fallback={null}>
                          <TabButton>{item.label[language]}</TabButton>
                        </ProtectedComponent>
                      );
                    }
                    return <TabButton key={item.id}>{item.label[language]}</TabButton>;
                  })}
                </nav>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center gap-4">
              <NotificationBell />
              
              <div className="flex items-center gap-2">
                <Avatar className="w-9 h-9 bg-white/20">
                  <span className="text-white text-sm font-medium">
                    {legacyUser?.name?.charAt(0) ||
                      (user?.firstName?.charAt(0) || user?.lastName?.charAt(0)) ||
                      'U'}
                  </span>
                </Avatar>
                <div className="hidden md:block">
                  <Typography className="text-white font-medium text-sm">
                    {legacyUser?.name || (user ? `${user.firstName} ${user.lastName}` : '')}
                  </Typography>
                  <Typography className="text-white/70 text-xs">
                    {legacyUser?.role || user?.roles?.[0] || 'User'}
                  </Typography>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout', 'Logout')}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-80px)]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function MUIDashboardOverview({ onQuickAction }: { onQuickAction: (action: string) => void }) {
  const { language } = useSettings();

  // Sample chart data
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 35000, expenses: 28000 },
    { month: 'Feb', revenue: 42000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 38000 },
    { month: 'Apr', revenue: 51000, expenses: 41000 },
    { month: 'May', revenue: 45000, expenses: 39000 },
    { month: 'Jun', revenue: 58000, expenses: 45000 },
  ];

  const siteProgressData = [
    { name: 'Site Alpha', progress: 85 },
    { name: 'Site Beta', progress: 65 },
    { name: 'Site Gamma', progress: 92 },
    { name: 'Site Delta', progress: 43 },
  ];

  const expenseBreakdownData = [
    { name: 'Labor', value: 45, amount: 28000 },
    { name: 'Materials', value: 30, amount: 18500 },
    { name: 'Equipment', value: 15, amount: 9200 },
    { name: 'Other', value: 10, amount: 6300 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      total_employees: { EN: 'Total Employees', AR: 'إجمالي الموظفين' },
      active_sites: { EN: 'Active Sites', AR: 'المواقع النشطة' },
      monthly_revenue: { EN: 'Monthly Revenue', AR: 'الإيرادات الشهرية' },
      outstanding_balance: { EN: 'Outstanding Balance', AR: 'الرصيد المعلق' },
      revenue_vs_expenses: { EN: 'Revenue vs Expenses', AR: 'الإيرادات مقابل المصروفات' },
      site_progress: { EN: 'Site Progress', AR: 'تقدم المواقع' },
      expense_breakdown: { EN: 'Expense Breakdown', AR: 'تفصيل المصروفات' },
      quick_actions: { EN: 'Quick Actions', AR: 'إجراءات سريعة' },
      add_employee: { EN: 'Add Employee', AR: 'إضافة موظف' },
      new_site: { EN: 'New Site', AR: 'موقع جديد' },
      record_expense: { EN: 'Record Expense', AR: 'تسجيل مصروف' },
      generate_report: { EN: 'Generate Report', AR: 'إنشاء تقرير' },
    };
    return translations[key]?.[language] || fallback || key;
  };

  return (
    <Container className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_employees', 'Total Employees')}
          value="24"
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-500"
          currency={false}
        />
        <StatCard
          title={t('active_sites', 'Active Sites')}
          value="5"
          icon={<HardHat className="w-6 h-6" />}
          color="bg-green-500"
          currency={false}
        />
        <StatCard
          title={t('monthly_revenue', 'Monthly Revenue')}
          value="45,230"
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-yellow-500"
          currency={true}
        />
        <StatCard
          title={t('outstanding_balance', 'Outstanding Balance')}
          value="12,500"
          icon={<Banknote className="w-6 h-6" />}
          color="bg-red-500"
          currency={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <Typography variant="h6">{t('revenue_vs_expenses', 'Revenue vs Expenses')}</Typography>
          </div>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Site Progress Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardHat className="w-5 h-5 text-blue-600" />
            <Typography variant="h6">{t('site_progress', 'Site Progress')}</Typography>
          </div>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteProgressData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Progress']}
                />
                <Bar dataKey="progress" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <Typography variant="h6">{t('expense_breakdown', 'Expense Breakdown')}</Typography>
          </div>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-blue-600" />
            <Typography variant="h6">{t('quick_actions', 'Quick Actions')}</Typography>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onQuickAction('Add Employee')}
              className="justify-start w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_employee', 'Add Employee')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onQuickAction('New Site')}
              className="justify-start w-full"
            >
              <HardHat className="w-4 h-4 mr-2" />
              {t('new_site', 'New Site')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onQuickAction('Record Expense')}
              className="justify-start w-full"
            >
              <Receipt className="w-4 h-4 mr-2" />
              {t('record_expense', 'Record Expense')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onQuickAction('Generate Report')}
              className="justify-start w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('generate_report', 'Generate Report')}
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  currency,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  currency: boolean;
}) {
  const { language } = useSettings();

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className={`w-14 h-14 ${color} shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </Avatar>
          <div>
            <Typography variant="h4" className="font-bold mb-1">
              {currency ? (language === 'AR' ? `${value} د.ل` : `$${value}`) : value}
            </Typography>
            <Typography className="text-gray-600 dark:text-gray-400 text-sm">
              {title}
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ComingSoonContent({ tabName }: { tabName: string }) {
  return (
    <Container className="p-8">
      <Card className="text-center p-12">
        <div className="text-6xl mb-4">🚧</div>
        <Typography variant="h5" className="mb-4">
          {tabName.charAt(0).toUpperCase() + tabName.slice(1)} Module
        </Typography>
        <Typography className="text-gray-600 dark:text-gray-400">
          This feature is coming soon. Stay tuned for updates!
        </Typography>
      </Card>
    </Container>
  );
}

export default MUIDashboard;
