import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
  Chip,
  Progress,
  Select,
} from '../ui';
import {
  Add,
  Edit,
  Delete,
  Search,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart,
  Activity,
  DollarSign,
  CreditCard,
} from '../ui/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useSettings } from './Settings';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  project?: string;
  paymentMethod: string;
  reference: string;
}

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-09-01',
    description: 'Project payment from City Development Corp',
    category: 'Project Revenue',
    type: 'income',
    amount: 500000,
    status: 'completed',
    project: 'Downtown Office Complex',
    paymentMethod: 'Bank Transfer',
    reference: 'PAY-2024-001'
  },
  {
    id: '2',
    date: '2024-09-02',
    description: 'Equipment purchase - Excavator',
    category: 'Equipment',
    type: 'expense',
    amount: 250000,
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    reference: 'EXP-2024-002'
  },
  {
    id: '3',
    date: '2024-09-03',
    description: 'Monthly salaries payment',
    category: 'Payroll',
    type: 'expense',
    amount: 85000,
    status: 'pending',
    paymentMethod: 'Bank Transfer',
    reference: 'SAL-2024-09'
  }
];

export function AdvancedFinancialManagement() {
  const { language } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const t = (key: string, fallback: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      financial_management: { EN: 'Financial Management', AR: 'الإدارة المالية' },
      overview: { EN: 'Overview', AR: 'نظرة عامة' },
      transactions: { EN: 'Transactions', AR: 'المعاملات' },
      reports: { EN: 'Reports', AR: 'التقارير' },
      budgets: { EN: 'Budgets', AR: 'الميزانيات' },
      total_income: { EN: 'Total Income', AR: 'إجمالي الدخل' },
      total_expenses: { EN: 'Total Expenses', AR: 'إجمالي المصروفات' },
      net_profit: { EN: 'Net Profit', AR: 'صافي الربح' },
      pending_transactions: { EN: 'Pending', AR: 'قيد الانتظار' },
      add_transaction: { EN: 'Add Transaction', AR: 'إضافة معاملة' },
      search_transactions: { EN: 'Search transactions...', AR: 'البحث في المعاملات...' },
      description: { EN: 'Description', AR: 'الوصف' },
      category: { EN: 'Category', AR: 'الفئة' },
      amount: { EN: 'Amount', AR: 'المبلغ' },
      type: { EN: 'Type', AR: 'النوع' },
      status: { EN: 'Status', AR: 'الحالة' },
      actions: { EN: 'Actions', AR: 'الإجراءات' },
      income: { EN: 'Income', AR: 'دخل' },
      expense: { EN: 'Expense', AR: 'مصروف' },
      all: { EN: 'All', AR: 'الكل' },
      pending: { EN: 'Pending', AR: 'قيد الانتظار' },
      completed: { EN: 'Completed', AR: 'مكتمل' },
      cancelled: { EN: 'Cancelled', AR: 'ملغي' },
    };
    return translations[key]?.[language] || fallback;
  };

  // Calculate statistics
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netProfit = totalIncome - totalExpenses;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Chart data
  const monthlyData = [
    { month: 'Jan', income: 450000, expenses: 320000 },
    { month: 'Feb', income: 520000, expenses: 380000 },
    { month: 'Mar', income: 480000, expenses: 350000 },
    { month: 'Apr', income: 600000, expenses: 420000 },
    { month: 'May', income: 550000, expenses: 390000 },
    { month: 'Jun', income: 580000, expenses: 410000 },
  ];

  const categoryData = [
    { name: 'Project Revenue', value: totalIncome * 0.8, color: '#10b981' },
    { name: 'Equipment', value: totalExpenses * 0.4, color: '#f59e0b' },
    { name: 'Payroll', value: totalExpenses * 0.4, color: '#ef4444' },
    { name: 'Operations', value: totalExpenses * 0.2, color: '#3b82f6' },
  ];

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth={false} className="py-4 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <Typography variant="h4" className="font-semibold text-gray-900">
              {t('financial_management', 'Financial Management')}
            </Typography>
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            <Add className="w-4 h-4 mr-2" />
            {t('add_transaction', 'Add Transaction')}
          </Button>
        </div>

        {/* Statistics Cards */}
        <Grid container spacing={6} className="mb-6">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-green-50 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-green-600">
                      ${(totalIncome / 1000000).toFixed(1)}M
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('total_income', 'Total Income')}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-red-50 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-red-600">
                      ${(totalExpenses / 1000000).toFixed(1)}M
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('total_expenses', 'Total Expenses')}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className={`${netProfit >= 0 ? 'bg-blue-50 border-l-blue-500' : 'bg-red-50 border-l-red-500'} border-l-4`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`${netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'} p-3 rounded-full`}>
                    <AttachMoney className={`w-8 h-8 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <Typography variant="h4" className={`font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ${(Math.abs(netProfit) / 1000000).toFixed(1)}M
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('net_profit', 'Net Profit')}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-yellow-50 border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Activity className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-yellow-600">
                      {pendingTransactions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('pending_transactions', 'Pending')}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">
              {t('overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="transactions">
              {t('transactions', 'Transactions')}
            </TabsTrigger>
            <TabsTrigger value="reports">
              {t('reports', 'Reports')}
            </TabsTrigger>
            <TabsTrigger value="budgets">
              {t('budgets', 'Budgets')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Grid container spacing={6}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader>
                    <CardTitle>Income vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} />
                          <Bar dataKey="income" fill="#10b981" name="Income" />
                          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap items-center">
              <TextField
                placeholder={t('search_transactions', 'Search transactions...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={<Search className="w-4 h-4 text-gray-400" />}
                className="min-w-80"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <option value="all">{t('all', 'All')}</option>
                <option value="income">{t('income', 'Income')}</option>
                <option value="expense">{t('expense', 'Expense')}</option>
              </Select>
            </div>

            {/* Transactions Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('description', 'Description')}</TableHead>
                    <TableHead>{t('category', 'Category')}</TableHead>
                    <TableHead>{t('type', 'Type')}</TableHead>
                    <TableHead>{t('amount', 'Amount')}</TableHead>
                    <TableHead>{t('status', 'Status')}</TableHead>
                    <TableHead>{t('actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <Typography variant="body2" className="font-medium">
                            {transaction.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.reference}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{transaction.category}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getTypeColor(transaction.type)}
                        >
                          {t(transaction.type, transaction.type)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getStatusColor(transaction.status)}
                        >
                          {t(transaction.status, transaction.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <IconButton size="small">
                            <Edit className="w-4 h-4" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Grid container spacing={6}>
              <Grid item xs={12} md={6}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <BarChart className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <Typography variant="h6" className="font-medium">
                          Financial Performance Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Income, expenses, and profit analysis
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <Typography variant="h6" className="font-medium">
                          Cash Flow Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Monthly cash flow analysis
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <Typography variant="body1" className="font-medium">Project Budget</Typography>
                        <Typography variant="caption" color="textSecondary">Total allocated for projects</Typography>
                      </div>
                      <div className="text-right">
                        <Typography variant="h6" className="font-semibold text-blue-600">
                          $2.5M
                        </Typography>
                        <div className="flex items-center gap-2">
                          <Progress value={75} className="w-24" />
                          <span className="text-sm">75% used</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <Typography variant="body1" className="font-medium">Equipment Budget</Typography>
                        <Typography variant="caption" color="textSecondary">Equipment purchases and maintenance</Typography>
                      </div>
                      <div className="text-right">
                        <Typography variant="h6" className="font-semibold text-yellow-600">
                          $800K
                        </Typography>
                        <div className="flex items-center gap-2">
                          <Progress value={60} className="w-24" />
                          <span className="text-sm">60% used</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <Typography variant="body1" className="font-medium">Operational Budget</Typography>
                        <Typography variant="caption" color="textSecondary">Salaries and operational costs</Typography>
                      </div>
                      <div className="text-right">
                        <Typography variant="h6" className="font-semibold text-purple-600">
                          $1.2M
                        </Typography>
                        <div className="flex items-center gap-2">
                          <Progress value={85} className="w-24" />
                          <span className="text-sm">85% used</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </Box>
  );
}

export default AdvancedFinancialManagement;
