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
  AvatarGroup,
  Progress,
  Select,
} from '../ui';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Assignment,
  Schedule,
  Group,
  TrendingUp,
  Flag,
  Task,
  Warning,
  CheckCircle,
  AccessTime,
  CalendarToday,
  Person,
  AttachMoney,
  Description,
  ExpandMore,
  FilterList,
  Search,
  GetApp,
  BarChart,
  Dashboard,
  Settings,
} from '../ui/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useSettings } from './Settings';

// Types and Interfaces
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  progress: number;
  manager: string;
  team: string[];
  client: string;
  location: string;
  category: 'residential' | 'commercial' | 'infrastructure' | 'renovation';
  tasks: TaskType[];
  milestones: Milestone[];
  documents: ProjectDocument[];
  risks: Risk[];
  createdAt: string;
  updatedAt: string;
}

interface TaskType {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  startDate: string;
  dueDate: string;
  progress: number;
  dependencies: string[];
  estimatedHours: number;
  actualHours: number;
  tags: string[];
}

interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  completedDate?: string;
  dependencies: string[];
}

interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: 'contract' | 'blueprint' | 'permit' | 'report' | 'other';
  uploadDate: string;
  size: string;
  uploadedBy: string;
}

interface Risk {
  id: string;
  projectId: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigated' | 'resolved';
  owner: string;
}

const AdvancedProjectManagement: React.FC = () => {
  const { language } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProjectDetails, setOpenProjectDetails] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Sample data
  const sampleProjects: Project[] = [
    {
      id: '1',
      name: 'Downtown Office Complex',
      description: 'Modern 20-story office building with retail space',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-15',
      endDate: '2024-12-15',
      budget: 15000000,
      actualCost: 8500000,
      progress: 65,
      manager: 'Ahmed Hassan',
      team: ['Sarah Ahmed', 'Mohamed Ali', 'Fatima Omar', 'Hassan Mahmoud'],
      client: 'City Development Corp',
      location: 'Downtown District',
      category: 'commercial',
      tasks: [
        {
          id: 't1',
          projectId: '1',
          name: 'Foundation Work',
          description: 'Excavation and foundation laying',
          status: 'completed',
          priority: 'high',
          assignee: 'Mohamed Ali',
          startDate: '2024-01-15',
          dueDate: '2024-03-15',
          progress: 100,
          dependencies: [],
          estimatedHours: 800,
          actualHours: 780,
          tags: ['structural', 'critical']
        },
        {
          id: 't2',
          projectId: '1',
          name: 'Steel Framework',
          description: 'Steel structure assembly',
          status: 'in-progress',
          priority: 'high',
          assignee: 'Hassan Mahmoud',
          startDate: '2024-03-01',
          dueDate: '2024-08-30',
          progress: 75,
          dependencies: ['t1'],
          estimatedHours: 1200,
          actualHours: 950,
          tags: ['structural', 'steel']
        }
      ],
      milestones: [
        {
          id: 'm1',
          projectId: '1',
          name: 'Foundation Complete',
          description: 'All foundation work finished',
          dueDate: '2024-03-15',
          status: 'completed',
          completedDate: '2024-03-12',
          dependencies: ['t1']
        },
        {
          id: 'm2',
          projectId: '1',
          name: 'Structure Complete',
          description: 'Building structure finished',
          dueDate: '2024-09-01',
          status: 'pending',
          dependencies: ['t2']
        }
      ],
      documents: [
        {
          id: 'd1',
          projectId: '1',
          name: 'Building Permit',
          type: 'permit',
          uploadDate: '2024-01-10',
          size: '2.3 MB',
          uploadedBy: 'Ahmed Hassan'
        }
      ],
      risks: [
        {
          id: 'r1',
          projectId: '1',
          description: 'Weather delays during concrete work',
          impact: 'medium',
          probability: 'high',
          mitigation: 'Schedule buffer time and weather monitoring',
          status: 'identified',
          owner: 'Ahmed Hassan'
        }
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-09-02'
    },
    {
      id: '2',
      name: 'Luxury Villa Complex',
      description: '12 luxury villas with shared amenities',
      status: 'planning',
      priority: 'medium',
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      budget: 8000000,
      actualCost: 1200000,
      progress: 15,
      manager: 'Layla Khalil',
      team: ['Omar Youssef', 'Nadia Farid', 'Karim Sayed'],
      client: 'Elite Properties',
      location: 'Suburban Heights',
      category: 'residential',
      tasks: [],
      milestones: [],
      documents: [],
      risks: [],
      createdAt: '2024-02-15',
      updatedAt: '2024-09-01'
    },
    {
      id: '3',
      name: 'Highway Bridge Renovation',
      description: 'Major renovation of 5km highway bridge',
      status: 'completed',
      priority: 'critical',
      startDate: '2023-08-01',
      endDate: '2024-05-30',
      budget: 25000000,
      actualCost: 23500000,
      progress: 100,
      manager: 'Tariq Rahman',
      team: ['Zeinab Ali', 'Youssef Omar', 'Amina Hassan', 'Khalid Nasser'],
      client: 'Ministry of Transportation',
      location: 'Highway 50',
      category: 'infrastructure',
      tasks: [],
      milestones: [],
      documents: [],
      risks: [],
      createdAt: '2023-07-01',
      updatedAt: '2024-05-30'
    }
  ];

  useEffect(() => {
    setProjects(sampleProjects);
  }, []);

  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      project_management: { EN: 'Project Management', AR: 'إدارة المشاريع' },
      projects: { EN: 'Projects', AR: 'المشاريع' },
      overview: { EN: 'Overview', AR: 'نظرة عامة' },
      timeline: { EN: 'Timeline', AR: 'الجدول الزمني' },
      tasks: { EN: 'Tasks', AR: 'المهام' },
      team: { EN: 'Team', AR: 'الفريق' },
      documents: { EN: 'Documents', AR: 'المستندات' },
      risks: { EN: 'Risks', AR: 'المخاطر' },
      add_project: { EN: 'Add Project', AR: 'إضافة مشروع' },
      project_name: { EN: 'Project Name', AR: 'اسم المشروع' },
      description: { EN: 'Description', AR: 'الوصف' },
      status: { EN: 'Status', AR: 'الحالة' },
      priority: { EN: 'Priority', AR: 'الأولوية' },
      progress: { EN: 'Progress', AR: 'التقدم' },
      budget: { EN: 'Budget', AR: 'الميزانية' },
      manager: { EN: 'Manager', AR: 'المدير' },
      client: { EN: 'Client', AR: 'العميل' },
      location: { EN: 'Location', AR: 'الموقع' },
      start_date: { EN: 'Start Date', AR: 'تاريخ البداية' },
      end_date: { EN: 'End Date', AR: 'تاريخ الانتهاء' },
      save: { EN: 'Save', AR: 'حفظ' },
      cancel: { EN: 'Cancel', AR: 'إلغاء' },
      search: { EN: 'Search projects...', AR: 'البحث في المشاريع...' },
      filter_status: { EN: 'Filter by Status', AR: 'تصفية حسب الحالة' },
      filter_priority: { EN: 'Filter by Priority', AR: 'تصفية حسب الأولوية' },
      all: { EN: 'All', AR: 'الكل' },
      planning: { EN: 'Planning', AR: 'التخطيط' },
      active: { EN: 'Active', AR: 'نشط' },
      on_hold: { EN: 'On Hold', AR: 'متوقف' },
      completed: { EN: 'Completed', AR: 'مكتمل' },
      cancelled: { EN: 'Cancelled', AR: 'ملغي' },
      low: { EN: 'Low', AR: 'منخفض' },
      medium: { EN: 'Medium', AR: 'متوسط' },
      high: { EN: 'High', AR: 'عالي' },
      critical: { EN: 'Critical', AR: 'حرج' },
      actions: { EN: 'Actions', AR: 'الإجراءات' },
      view_details: { EN: 'View Details', AR: 'عرض التفاصيل' },
      edit: { EN: 'Edit', AR: 'تعديل' },
      delete: { EN: 'Delete', AR: 'حذف' },
    };
    return translations[key]?.[language] || fallback || key;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'info',
      active: 'success',
      'on-hold': 'warning',
      completed: 'primary',
      cancelled: 'error',
    } as const;
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    } as const;
    return colors[priority as keyof typeof colors] || 'default';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleOpenDialog = (mode: 'add' | 'edit', project?: Project) => {
    setDialogMode(mode);
    if (mode === 'edit' && project) {
      setSelectedProject(project);
    } else {
      setSelectedProject(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setOpenProjectDetails(true);
  };

  // Overview Stats
  const overviewStats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    totalCost: projects.reduce((sum, p) => sum + p.actualCost, 0),
    averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length,
  };

  // Chart data with Tailwind colors
  const statusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: '#3b82f6' },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#10b981' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, color: '#f59e0b' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#6366f1' },
    { name: 'Cancelled', value: projects.filter(p => p.status === 'cancelled').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const budgetData = projects.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    budget: project.budget / 1000000,
    actual: project.actualCost / 1000000,
  }));

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth={false} className="py-4 px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Assignment className="w-8 h-8 text-blue-600" />
            <Typography variant="h4" className="font-semibold text-gray-900">
              {t('project_management', 'Project Management')}
            </Typography>
          </div>
          <Button
            variant="default"
            onClick={() => handleOpenDialog('add')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Add className="w-4 h-4 mr-2" />
            {t('add_project', 'Add Project')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Dashboard className="w-4 h-4" />
              {t('overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Assignment className="w-4 h-4" />
              {t('projects', 'Projects')}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Schedule className="w-4 h-4" />
              {t('timeline', 'Timeline')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Tab */}
            <Grid container spacing={6} className="mb-6">
              <Grid item xs={12} sm={6} md={3}>
                <Card className="bg-blue-50 border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="h4" className="font-semibold text-blue-600 mb-1">
                          {overviewStats.totalProjects}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Projects
                        </Typography>
                      </div>
                      <Assignment className="w-12 h-12 text-blue-600 opacity-30" />
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card className="bg-green-50 border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="h4" className="font-semibold text-green-600 mb-1">
                          {overviewStats.activeProjects}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Active Projects
                        </Typography>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-600 opacity-30" />
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card className="bg-purple-50 border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="h4" className="font-semibold text-purple-600 mb-1">
                          ${(overviewStats.totalBudget / 1000000).toFixed(1)}M
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Budget
                        </Typography>
                      </div>
                      <AttachMoney className="w-12 h-12 text-purple-600 opacity-30" />
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card className="bg-yellow-50 border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="h4" className="font-semibold text-yellow-600 mb-1">
                          {overviewStats.averageProgress.toFixed(0)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Avg Progress
                        </Typography>
                      </div>
                      <AccessTime className="w-12 h-12 text-yellow-600 opacity-30" />
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={6}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Project Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Budget vs Actual Cost (Millions)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={budgetData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => `$${value}M`} />
                          <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                          <Bar dataKey="actual" fill="#6366f1" name="Actual" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {/* Projects List Tab */}
            <div className="flex gap-4 flex-wrap items-center mb-6">
              <TextField
                placeholder={t('search', 'Search projects...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={<Search className="w-4 h-4 text-gray-400" />}
                className="min-w-80"
              />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <option value="all">{t('all', 'All')}</option>
                <option value="planning">{t('planning', 'Planning')}</option>
                <option value="active">{t('active', 'Active')}</option>
                <option value="on-hold">{t('on_hold', 'On Hold')}</option>
                <option value="completed">{t('completed', 'Completed')}</option>
                <option value="cancelled">{t('cancelled', 'Cancelled')}</option>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <option value="all">{t('all', 'All')}</option>
                <option value="low">{t('low', 'Low')}</option>
                <option value="medium">{t('medium', 'Medium')}</option>
                <option value="high">{t('high', 'High')}</option>
                <option value="critical">{t('critical', 'Critical')}</option>
              </Select>
            </div>

            <Grid container spacing={6}>
              {filteredProjects.map((project) => (
                <Grid item xs={12} md={6} lg={4} key={project.id}>
                  <Card className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="flex-grow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Typography variant="h6" className="font-semibold">
                          {project.name}
                        </Typography>
                        <div className="flex gap-1">
                          <Chip
                            size="small"
                            color={getStatusColor(project.status)}
                            className="font-medium"
                          >
                            {t(project.status, project.status)}
                          </Chip>
                          <Chip
                            size="small"
                            color={getPriorityColor(project.priority)}
                            className="font-medium"
                          >
                            {t(project.priority, project.priority)}
                          </Chip>
                        </div>
                      </div>

                      <Typography variant="body2" color="textSecondary" className="mb-4">
                        {project.description.length > 100 ? project.description.substring(0, 100) + '...' : project.description}
                      </Typography>

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <Typography variant="body2" color="textSecondary">
                            {t('progress', 'Progress')}
                          </Typography>
                          <Typography variant="body2" className="font-medium">
                            {project.progress}%
                          </Typography>
                        </div>
                        <Progress 
                          value={project.progress} 
                          className="h-2"
                        />
                      </div>

                      <Grid container spacing={2} className="mb-4">
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            {t('manager', 'Manager')}
                          </Typography>
                          <Typography variant="body2" className="font-medium">
                            {project.manager}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            {t('client', 'Client')}
                          </Typography>
                          <Typography variant="body2" className="font-medium">
                            {project.client}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            {t('budget', 'Budget')}
                          </Typography>
                          <Typography variant="body2" className="font-medium">
                            ${(project.budget / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            {t('location', 'Location')}
                          </Typography>
                          <Typography variant="body2" className="font-medium">
                            {project.location}
                          </Typography>
                        </Grid>
                      </Grid>

                      <div className="flex items-center gap-2 mb-4">
                        <Group className="w-4 h-4 text-gray-400" />
                        <AvatarGroup max={4}>
                          {project.team.map((member, index) => (
                            <Avatar key={index} size="sm">
                              {member.charAt(0)}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <CalendarToday className="w-4 h-4 text-gray-400" />
                          <Typography variant="caption" color="textSecondary">
                            {new Date(project.startDate).toLocaleDateString()}
                          </Typography>
                        </div>
                        <Typography variant="caption" color="textSecondary">
                          → {new Date(project.endDate).toLocaleDateString()}
                        </Typography>
                      </div>
                    </CardContent>

                    <div className="p-6 pt-0 flex justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(project)}
                        className="flex items-center gap-2"
                      >
                        <Visibility className="w-4 h-4" />
                        {t('view_details', 'View Details')}
                      </Button>
                      <div className="flex gap-1">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', project)}
                          color="primary"
                        >
                          <Edit className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                        >
                          <Delete className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            {/* Timeline Tab */}
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects
                    .filter(p => p.status !== 'cancelled')
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((project, index) => (
                      <div key={project.id} className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              project.status === 'completed' ? 'bg-green-500' : 
                              project.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}>
                              <Assignment className="w-6 h-6 text-white p-0.5" />
                            </div>
                            {index < projects.length - 1 && (
                              <div className="w-px h-16 bg-gray-200 mt-2" />
                            )}
                          </div>
                          <div className="flex-1">
                            <Card className={`p-4 ${
                              project.status === 'completed' ? 'bg-green-50' : 
                              project.status === 'active' ? 'bg-blue-50' : 'bg-gray-50'
                            }`}>
                              <Typography variant="h6" className="font-semibold mb-2">
                                {project.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" className="mb-2">
                                {project.client} • {project.location}
                              </Typography>
                              <div className="flex items-center gap-2 mb-2">
                                <Chip
                                  size="small"
                                  color={getStatusColor(project.status)}
                                >
                                  {t(project.status, project.status)}
                                </Chip>
                                <Progress value={project.progress} className="flex-1 h-1.5" />
                                <Typography variant="body2">{project.progress}%</Typography>
                              </div>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                              </Typography>
                            </Card>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Tab */}
            <Grid container spacing={6}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Project Starts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { month: 'Jan', projects: 2 },
                          { month: 'Feb', projects: 1 },
                          { month: 'Mar', projects: 3 },
                          { month: 'Apr', projects: 0 },
                          { month: 'May', projects: 1 },
                          { month: 'Jun', projects: 2 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="projects" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Cost vs Budget Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projects.map(p => ({
                          name: p.name.substring(0, 10) + '...',
                          budgetUtilization: (p.actualCost / p.budget) * 100,
                          progress: p.progress,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                          <Line 
                            type="monotone" 
                            dataKey="budgetUtilization" 
                            stroke="#ef4444" 
                            name="Budget Used %"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="progress" 
                            stroke="#10b981" 
                            name="Progress %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Project Dialog */}
        <Dialog 
          open={openDialog} 
          onOpenChange={setOpenDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' ? t('add_project', 'Add Project') : t('edit', 'Edit') + ' ' + t('project', 'Project')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t('project_name', 'Project Name')}
                    fullWidth
                    defaultValue={selectedProject?.name || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t('client', 'Client')}
                    fullWidth
                    defaultValue={selectedProject?.client || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('description', 'Description')}
                    fullWidth
                    multiline
                    rows={3}
                    defaultValue={selectedProject?.description || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('status', 'Status')}</label>
                    <Select defaultValue={selectedProject?.status || 'planning'}>
                      <option value="planning">{t('planning', 'Planning')}</option>
                      <option value="active">{t('active', 'Active')}</option>
                      <option value="on-hold">{t('on_hold', 'On Hold')}</option>
                      <option value="completed">{t('completed', 'Completed')}</option>
                      <option value="cancelled">{t('cancelled', 'Cancelled')}</option>
                    </Select>
                  </div>
                </Grid>
                <Grid item xs={12} md={6}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('priority', 'Priority')}</label>
                    <Select defaultValue={selectedProject?.priority || 'medium'}>
                      <option value="low">{t('low', 'Low')}</option>
                      <option value="medium">{t('medium', 'Medium')}</option>
                      <option value="high">{t('high', 'High')}</option>
                      <option value="critical">{t('critical', 'Critical')}</option>
                    </Select>
                  </div>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t('start_date', 'Start Date')}
                    type="date"
                    fullWidth
                    defaultValue={selectedProject?.startDate || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t('end_date', 'End Date')}
                    type="date"
                    fullWidth
                    defaultValue={selectedProject?.endDate || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t('budget', 'Budget')}
                    type="number"
                    fullWidth
                    defaultValue={selectedProject?.budget || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t('manager', 'Manager')}
                    fullWidth
                    defaultValue={selectedProject?.manager || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('location', 'Location')}
                    fullWidth
                    defaultValue={selectedProject?.location || ''}
                  />
                </Grid>
              </Grid>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCloseDialog} className="bg-blue-600 text-white hover:bg-blue-700">
                {t('save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Project Details Dialog */}
        <Dialog 
          open={openProjectDetails} 
          onOpenChange={setOpenProjectDetails}
        >
          {selectedProject && (
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-semibold">
                    {selectedProject.name}
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Chip
                      color={getStatusColor(selectedProject.status)}
                    >
                      {t(selectedProject.status, selectedProject.status)}
                    </Chip>
                    <Chip
                      color={getPriorityColor(selectedProject.priority)}
                    >
                      {t(selectedProject.priority, selectedProject.priority)}
                    </Chip>
                  </div>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                  <Grid container spacing={6}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="body1" className="mb-6">
                        {selectedProject.description}
                      </Typography>
                      
                      <div className="mb-6">
                        <Typography variant="h6" gutterBottom>Progress</Typography>
                        <Progress 
                          value={selectedProject.progress} 
                          size="lg"
                          className="mb-2"
                        />
                        <Typography variant="body2" color="textSecondary">
                          {selectedProject.progress}% Complete
                        </Typography>
                      </div>

                      {selectedProject.tasks.length > 0 && (
                        <div className="mb-6">
                          <Typography variant="h6" gutterBottom>Recent Tasks</Typography>
                          {selectedProject.tasks.slice(0, 3).map((task) => (
                            <Card key={task.id} className="mb-2">
                              <CardContent className="py-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Typography variant="subtitle2" className="font-medium">
                                      {task.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Assigned to: {task.assignee}
                                    </Typography>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Chip
                                      size="small"
                                      color={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'primary' : 'default'}
                                    >
                                      {task.status}
                                    </Chip>
                                    <Typography variant="caption">{task.progress}%</Typography>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Typography variant="caption" color="textSecondary">Client</Typography>
                            <Typography variant="body2">{selectedProject.client}</Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="textSecondary">Manager</Typography>
                            <Typography variant="body2">{selectedProject.manager}</Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="textSecondary">Location</Typography>
                            <Typography variant="body2">{selectedProject.location}</Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="textSecondary">Budget</Typography>
                            <Typography variant="body2">${selectedProject.budget.toLocaleString()}</Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="textSecondary">Actual Cost</Typography>
                            <Typography variant="body2">${selectedProject.actualCost.toLocaleString()}</Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="textSecondary">Duration</Typography>
                            <Typography variant="body2">
                              {new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.endDate).toLocaleDateString()}
                            </Typography>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {selectedProject.team.map((member, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <Avatar size="md">
                                {member.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{member}</Typography>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenProjectDetails(false)}>
                  Close
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdvancedProjectManagement;
