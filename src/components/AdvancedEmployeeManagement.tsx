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
  Avatar,
  Progress,
  Select,
  Badge,
} from '../ui';
import {
  Add,
  Edit,
  Delete,
  Search,
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BarChart,
  TrendingUp,
  Activity,
  Settings,
} from '../ui/icons';
import { useSettings } from './Settings';

// Employee interface
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  profileImage?: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  skills: string[];
  performance: {
    rating: number;
    lastReview: string;
    goals: string[];
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
}

// Sample employee data
const sampleEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    email: 'ahmed.rashid@company.com',
    phone: '+970-599-123456',
    position: 'Site Manager',
    department: 'Construction',
    hireDate: '2022-01-15',
    salary: 5000,
    status: 'active',
    address: 'Gaza City, Palestine',
    emergencyContact: {
      name: 'Fatima Al-Rashid',
      phone: '+970-599-654321',
      relationship: 'Spouse'
    },
    skills: ['Project Management', 'Construction Safety', 'Team Leadership'],
    performance: {
      rating: 4.5,
      lastReview: '2024-01-15',
      goals: ['Complete Safety Certification', 'Reduce Project Timeline by 10%']
    },
    attendance: {
      present: 220,
      absent: 5,
      late: 3
    }
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Mansour',
    email: 'sarah.mansour@company.com',
    phone: '+970-599-789012',
    position: 'Civil Engineer',
    department: 'Engineering',
    hireDate: '2023-03-10',
    salary: 4200,
    status: 'active',
    address: 'Ramallah, Palestine',
    emergencyContact: {
      name: 'Omar Mansour',
      phone: '+970-599-345678',
      relationship: 'Brother'
    },
    skills: ['AutoCAD', 'Structural Analysis', 'Quality Control'],
    performance: {
      rating: 4.8,
      lastReview: '2024-03-10',
      goals: ['Master BIM Software', 'Lead Major Project']
    },
    attendance: {
      present: 180,
      absent: 2,
      late: 1
    }
  },
  {
    id: '3',
    firstName: 'Omar',
    lastName: 'Hassan',
    email: 'omar.hassan@company.com',
    phone: '+970-599-456789',
    position: 'Heavy Equipment Operator',
    department: 'Operations',
    hireDate: '2021-08-20',
    salary: 3500,
    status: 'on-leave',
    address: 'Khan Younis, Palestine',
    emergencyContact: {
      name: 'Layla Hassan',
      phone: '+970-599-987654',
      relationship: 'Wife'
    },
    skills: ['Heavy Machinery Operation', 'Maintenance', 'Safety Protocols'],
    performance: {
      rating: 4.2,
      lastReview: '2023-08-20',
      goals: ['Obtain Advanced Certification', 'Train New Operators']
    },
    attendance: {
      present: 250,
      absent: 8,
      late: 4
    }
  }
];

export function AdvancedEmployeeManagement() {
  const { language } = useSettings();
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const t = (key: string, fallback: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      employee_management: { EN: 'Employee Management', AR: 'إدارة الموظفين' },
      add_employee: { EN: 'Add Employee', AR: 'إضافة موظف' },
      overview: { EN: 'Overview', AR: 'نظرة عامة' },
      employees: { EN: 'Employees', AR: 'الموظفين' },
      performance: { EN: 'Performance', AR: 'الأداء' },
      reports: { EN: 'Reports', AR: 'التقارير' },
      total_employees: { EN: 'Total Employees', AR: 'إجمالي الموظفين' },
      active_employees: { EN: 'Active Employees', AR: 'الموظفين النشطين' },
      on_leave: { EN: 'On Leave', AR: 'في إجازة' },
      avg_performance: { EN: 'Avg Performance', AR: 'متوسط الأداء' },
      search_employees: { EN: 'Search employees...', AR: 'البحث في الموظفين...' },
      name: { EN: 'Name', AR: 'الاسم' },
      position: { EN: 'Position', AR: 'المنصب' },
      department: { EN: 'Department', AR: 'القسم' },
      status: { EN: 'Status', AR: 'الحالة' },
      actions: { EN: 'Actions', AR: 'الإجراءات' },
      active: { EN: 'Active', AR: 'نشط' },
      inactive: { EN: 'Inactive', AR: 'غير نشط' },
      terminated: { EN: 'Terminated', AR: 'مفصول' },
      all: { EN: 'All', AR: 'الكل' },
      view_details: { EN: 'View Details', AR: 'عرض التفاصيل' },
      edit: { EN: 'Edit', AR: 'تعديل' },
      delete: { EN: 'Delete', AR: 'حذف' },
    };
    return translations[key]?.[language] || fallback;
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const onLeaveEmployees = employees.filter(emp => emp.status === 'on-leave').length;
  const avgPerformance = employees.reduce((sum, emp) => sum + emp.performance.rating, 0) / employees.length;

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'on-leave': return 'info';
      case 'terminated': return 'error';
      default: return 'default';
    }
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth={false} className="py-4 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <Typography variant="h4" className="font-semibold text-gray-900">
              {t('employee_management', 'Employee Management')}
            </Typography>
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            <Add className="w-4 h-4 mr-2" />
            {t('add_employee', 'Add Employee')}
          </Button>
        </div>

        {/* Statistics Cards */}
        <Grid container spacing={6} className="mb-6">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-blue-50 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-blue-600">
                      {totalEmployees}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('total_employees', 'Total Employees')}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-green-50 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-green-600">
                      {activeEmployees}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('active_employees', 'Active Employees')}
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
                    <Calendar className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-yellow-600">
                      {onLeaveEmployees}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('on_leave', 'On Leave')}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-purple-50 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-purple-600">
                      {avgPerformance.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('avg_performance', 'Avg Performance')}
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
            <TabsTrigger value="employees">
              {t('employees', 'Employees')}
            </TabsTrigger>
            <TabsTrigger value="performance">
              {t('performance', 'Performance')}
            </TabsTrigger>
            <TabsTrigger value="reports">
              {t('reports', 'Reports')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Grid container spacing={6}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Construction', 'Engineering', 'Operations', 'Administration'].map(dept => (
                        <div key={dept} className="flex justify-between items-center">
                          <span className="text-sm">{dept}</span>
                          <span className="font-medium">
                            {employees.filter(e => e.department === dept).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Active</span>
                        </div>
                        <span className="font-medium">
                          {employees.filter(e => e.status === 'active').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">On Leave</span>
                        </div>
                        <span className="font-medium">
                          {employees.filter(e => e.status === 'on-leave').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Inactive</span>
                        </div>
                        <span className="font-medium">
                          {employees.filter(e => e.status === 'inactive').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap items-center">
              <TextField
                placeholder={t('search_employees', 'Search employees...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={<Search className="w-4 h-4 text-gray-400" />}
                className="min-w-80"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <option value="all">{t('all', 'All')}</option>
                <option value="active">{t('active', 'Active')}</option>
                <option value="inactive">{t('inactive', 'Inactive')}</option>
                <option value="on-leave">{t('on_leave', 'On Leave')}</option>
                <option value="terminated">{t('terminated', 'Terminated')}</option>
              </Select>
            </div>

            {/* Employees Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name', 'Name')}</TableHead>
                    <TableHead>{t('position', 'Position')}</TableHead>
                    <TableHead>{t('department', 'Department')}</TableHead>
                    <TableHead>{t('status', 'Status')}</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>{t('actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="md">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </Avatar>
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {employee.email}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{employee.position}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{employee.department}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getStatusColor(employee.status)}
                        >
                          {t(employee.status, employee.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={employee.performance.rating * 20} className="w-20" />
                          <span className="text-sm font-medium">{employee.performance.rating}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(employee)}
                          >
                            <User className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditEmployee(employee)}
                          >
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

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar size="lg">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </Avatar>
                        <div>
                          <Typography variant="body1" className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {employee.position} • {employee.department}
                          </Typography>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {employee.performance.rating}/5.0
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Last review: {new Date(employee.performance.lastReview).toLocaleDateString()}
                            </Typography>
                          </div>
                          <Progress value={employee.performance.rating * 20} className="w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
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
                          Employee Performance Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Performance ratings and reviews
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
                          Attendance Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Attendance and leave tracking
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>
        </Tabs>

        {/* Employee Details Dialog */}
        <Dialog 
          open={isViewDialogOpen} 
          onOpenChange={setIsViewDialogOpen}
        >
          {selectedEmployee && (
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <Grid container spacing={6}>
                  <Grid item xs={12} md={6}>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="caption" color="textSecondary">Email</Typography>
                        <Typography variant="body2">{selectedEmployee.email}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Phone</Typography>
                        <Typography variant="body2">{selectedEmployee.phone}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Position</Typography>
                        <Typography variant="body2">{selectedEmployee.position}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Department</Typography>
                        <Typography variant="body2">{selectedEmployee.department}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Hire Date</Typography>
                        <Typography variant="body2">
                          {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Address</Typography>
                        <Typography variant="body2">{selectedEmployee.address}</Typography>
                      </div>
                    </div>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="caption" color="textSecondary">Status</Typography>
                        <div>
                          <Chip color={getStatusColor(selectedEmployee.status)}>
                            {t(selectedEmployee.status, selectedEmployee.status)}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Performance Rating</Typography>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedEmployee.performance.rating * 20} className="flex-1" />
                          <span className="text-sm font-medium">{selectedEmployee.performance.rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Skills</Typography>
                        <div className="flex flex-wrap gap-1">
                          {selectedEmployee.skills.map((skill, index) => (
                            <Chip key={index} size="small" variant="outlined">
                              {skill}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Emergency Contact</Typography>
                        <Typography variant="body2">
                          {selectedEmployee.emergencyContact.name} ({selectedEmployee.emergencyContact.relationship})
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {selectedEmployee.emergencyContact.phone}
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Add/Edit Employee Dialog - Simplified */}
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' ? t('add_employee', 'Add Employee') : 'Edit Employee'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    defaultValue={selectedEmployee?.firstName || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    defaultValue={selectedEmployee?.lastName || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    defaultValue={selectedEmployee?.email || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    defaultValue={selectedEmployee?.phone || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Position"
                    fullWidth
                    defaultValue={selectedEmployee?.position || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Department"
                    fullWidth
                    defaultValue={selectedEmployee?.department || ''}
                  />
                </Grid>
              </Grid>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}

export default AdvancedEmployeeManagement;
