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
} from '../ui';
import {
  Add,
  Edit,
  Delete,
  Search,
  Build,
  Settings,
  Package,
  Wrench,
  Activity,
  Calendar,
  User,
  MapPin,
  BarChart,
  Truck,
  Zap,
} from '../ui/icons';
import { useSettings } from './Settings';

// Interfaces
interface Equipment {
  id: string;
  name: string;
  category: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  location: string;
  assignedTo?: string;
  status: 'available' | 'in-use' | 'maintenance' | 'repair' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  lastMaintenance: string;
  nextMaintenance: string;
  warrantyExpiry: string;
  usageHours: number;
  efficiency: number;
  qrCode?: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'routine' | 'repair' | 'inspection' | 'upgrade';
  description: string;
  cost: number;
  performedBy: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  notes?: string;
}

// Sample data
const sampleEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Excavator CAT 320',
    category: 'Heavy Machinery',
    model: '320GC',
    manufacturer: 'Caterpillar',
    serialNumber: 'CAT320-001',
    purchaseDate: '2022-01-15',
    purchaseCost: 250000,
    currentValue: 220000,
    location: 'Site Alpha',
    assignedTo: 'Ahmed Al-Rashid',
    status: 'in-use',
    condition: 'good',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    warrantyExpiry: '2025-01-15',
    usageHours: 1250,
    efficiency: 92,
    qrCode: 'QR-CAT320-001'
  },
  {
    id: '2',
    name: 'Concrete Mixer Truck',
    category: 'Vehicles',
    model: 'M310',
    manufacturer: 'Mercedes-Benz',
    serialNumber: 'MB-M310-002',
    purchaseDate: '2023-03-10',
    purchaseCost: 180000,
    currentValue: 165000,
    location: 'Site Beta',
    assignedTo: 'Sarah Mansour',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: '2024-02-01',
    nextMaintenance: '2024-05-01',
    warrantyExpiry: '2026-03-10',
    usageHours: 450,
    efficiency: 95,
    qrCode: 'QR-MB-M310-002'
  },
  {
    id: '3',
    name: 'Tower Crane TCR 125',
    category: 'Cranes',
    model: 'TCR 125-6',
    manufacturer: 'Liebherr',
    serialNumber: 'LBH-TCR125-003',
    purchaseDate: '2021-06-20',
    purchaseCost: 450000,
    currentValue: 380000,
    location: 'Site Gamma',
    status: 'maintenance',
    condition: 'fair',
    lastMaintenance: '2024-02-10',
    nextMaintenance: '2024-02-25',
    warrantyExpiry: '2024-06-20',
    usageHours: 3200,
    efficiency: 78,
    qrCode: 'QR-LBH-TCR125-003'
  }
];

export function AdvancedEquipmentManagement() {
  const { language } = useSettings();
  const [equipment, setEquipment] = useState<Equipment[]>(sampleEquipment);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const t = (key: string, fallback: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      equipment_management: { EN: 'Equipment Management', AR: 'إدارة المعدات' },
      overview: { EN: 'Overview', AR: 'نظرة عامة' },
      inventory: { EN: 'Inventory', AR: 'المخزون' },
      maintenance: { EN: 'Maintenance', AR: 'الصيانة' },
      reports: { EN: 'Reports', AR: 'التقارير' },
      total_equipment: { EN: 'Total Equipment', AR: 'إجمالي المعدات' },
      in_use: { EN: 'In Use', AR: 'قيد الاستخدام' },
      maintenance_due: { EN: 'Maintenance Due', AR: 'صيانة مستحقة' },
      total_value: { EN: 'Total Value', AR: 'القيمة الإجمالية' },
      add_equipment: { EN: 'Add Equipment', AR: 'إضافة معدة' },
      search_equipment: { EN: 'Search equipment...', AR: 'البحث في المعدات...' },
      name: { EN: 'Name', AR: 'الاسم' },
      category: { EN: 'Category', AR: 'الفئة' },
      location: { EN: 'Location', AR: 'الموقع' },
      status: { EN: 'Status', AR: 'الحالة' },
      condition: { EN: 'Condition', AR: 'الحالة' },
      actions: { EN: 'Actions', AR: 'الإجراءات' },
      available: { EN: 'Available', AR: 'متوفر' },
      'in-use': { EN: 'In Use', AR: 'قيد الاستخدام' },
      maintenance: { EN: 'Maintenance', AR: 'صيانة' },
      repair: { EN: 'Repair', AR: 'إصلاح' },
      retired: { EN: 'Retired', AR: 'متقاعد' },
      excellent: { EN: 'Excellent', AR: 'ممتاز' },
      good: { EN: 'Good', AR: 'جيد' },
      fair: { EN: 'Fair', AR: 'مقبول' },
      poor: { EN: 'Poor', AR: 'ضعيف' },
      all: { EN: 'All', AR: 'الكل' },
    };
    return translations[key]?.[language] || fallback;
  };

  // Calculate statistics
  const totalEquipment = equipment.length;
  const inUseEquipment = equipment.filter(eq => eq.status === 'in-use').length;
  const maintenanceDue = equipment.filter(eq => new Date(eq.nextMaintenance) <= new Date()).length;
  const totalValue = equipment.reduce((sum, eq) => sum + eq.currentValue, 0);

  // Filter equipment
  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || eq.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'in-use': return 'info';
      case 'maintenance': return 'warning';
      case 'repair': return 'error';
      case 'retired': return 'default';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const handleViewDetails = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setIsDialogOpen(true);
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth={false} className="py-4 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <Typography variant="h4" className="font-semibold text-gray-900">
              {t('equipment_management', 'Equipment Management')}
            </Typography>
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            <Add className="w-4 h-4 mr-2" />
            {t('add_equipment', 'Add Equipment')}
          </Button>
        </div>

        {/* Statistics Cards */}
        <Grid container spacing={6} className="mb-6">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="bg-blue-50 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-blue-600">
                      {totalEquipment}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('total_equipment', 'Total Equipment')}
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
                      {inUseEquipment}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('in_use', 'In Use')}
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
                    <Wrench className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-yellow-600">
                      {maintenanceDue}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('maintenance_due', 'Maintenance Due')}
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
                    <BarChart className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-purple-600">
                      ${(totalValue / 1000000).toFixed(1)}M
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('total_value', 'Total Value')}
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
            <TabsTrigger value="inventory">
              {t('inventory', 'Inventory')}
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              {t('maintenance', 'Maintenance')}
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
                    <CardTitle>Equipment Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Available</span>
                        </div>
                        <span className="font-medium">
                          {equipment.filter(e => e.status === 'available').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">In Use</span>
                        </div>
                        <span className="font-medium">
                          {equipment.filter(e => e.status === 'in-use').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Maintenance</span>
                        </div>
                        <span className="font-medium">
                          {equipment.filter(e => e.status === 'maintenance').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Repair</span>
                        </div>
                        <span className="font-medium">
                          {equipment.filter(e => e.status === 'repair').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Heavy Machinery', 'Vehicles', 'Cranes', 'Tools'].map(category => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm">{category}</span>
                          <span className="font-medium">
                            {equipment.filter(e => e.category === category).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap items-center">
              <TextField
                placeholder={t('search_equipment', 'Search equipment...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={<Search className="w-4 h-4 text-gray-400" />}
                className="min-w-80"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <option value="all">{t('all', 'All')}</option>
                <option value="available">{t('available', 'Available')}</option>
                <option value="in-use">{t('in-use', 'In Use')}</option>
                <option value="maintenance">{t('maintenance', 'Maintenance')}</option>
                <option value="repair">{t('repair', 'Repair')}</option>
                <option value="retired">{t('retired', 'Retired')}</option>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <option value="all">{t('all', 'All')}</option>
                <option value="Heavy Machinery">Heavy Machinery</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Cranes">Cranes</option>
                <option value="Tools">Tools</option>
              </Select>
            </div>

            {/* Equipment Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name', 'Name')}</TableHead>
                    <TableHead>{t('category', 'Category')}</TableHead>
                    <TableHead>{t('location', 'Location')}</TableHead>
                    <TableHead>{t('status', 'Status')}</TableHead>
                    <TableHead>{t('condition', 'Condition')}</TableHead>
                    <TableHead>{t('actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            {eq.category === 'Heavy Machinery' && <Build className="w-4 h-4" />}
                            {eq.category === 'Vehicles' && <Truck className="w-4 h-4" />}
                            {eq.category === 'Cranes' && <Settings className="w-4 h-4" />}
                          </Avatar>
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {eq.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {eq.serialNumber}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{eq.category}</Typography>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <Typography variant="body2">{eq.location}</Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getStatusColor(eq.status)}
                        >
                          {t(eq.status, eq.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getConditionColor(eq.condition)}
                        >
                          {t(eq.condition, eq.condition)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(eq)}
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

          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipment
                    .filter(eq => new Date(eq.nextMaintenance) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    .map((eq) => (
                      <div key={eq.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar size="md">
                            <Wrench className="w-5 h-5" />
                          </Avatar>
                          <div>
                            <Typography variant="body1" className="font-medium">
                              {eq.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Due: {new Date(eq.nextMaintenance).toLocaleDateString()}
                            </Typography>
                          </div>
                        </div>
                        <div className="text-right">
                          <Typography variant="body2" color="textSecondary">
                            {eq.location}
                          </Typography>
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
                          Equipment Utilization Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Usage statistics and efficiency metrics
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
                          Maintenance Schedule Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Upcoming and overdue maintenance
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabsContent>
        </Tabs>

        {/* Equipment Details Dialog */}
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
        >
          {selectedEquipment && (
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedEquipment.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <Grid container spacing={6}>
                  <Grid item xs={12} md={6}>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="caption" color="textSecondary">Manufacturer</Typography>
                        <Typography variant="body2">{selectedEquipment.manufacturer}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Model</Typography>
                        <Typography variant="body2">{selectedEquipment.model}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Serial Number</Typography>
                        <Typography variant="body2">{selectedEquipment.serialNumber}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Purchase Date</Typography>
                        <Typography variant="body2">
                          {new Date(selectedEquipment.purchaseDate).toLocaleDateString()}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Current Value</Typography>
                        <Typography variant="body2">
                          ${selectedEquipment.currentValue.toLocaleString()}
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="caption" color="textSecondary">Status</Typography>
                        <div>
                          <Chip color={getStatusColor(selectedEquipment.status)}>
                            {t(selectedEquipment.status, selectedEquipment.status)}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Condition</Typography>
                        <div>
                          <Chip color={getConditionColor(selectedEquipment.condition)}>
                            {t(selectedEquipment.condition, selectedEquipment.condition)}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Location</Typography>
                        <Typography variant="body2">{selectedEquipment.location}</Typography>
                      </div>
                      {selectedEquipment.assignedTo && (
                        <div>
                          <Typography variant="caption" color="textSecondary">Assigned To</Typography>
                          <Typography variant="body2">{selectedEquipment.assignedTo}</Typography>
                        </div>
                      )}
                      <div>
                        <Typography variant="caption" color="textSecondary">Usage Hours</Typography>
                        <Typography variant="body2">{selectedEquipment.usageHours}</Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="textSecondary">Efficiency</Typography>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedEquipment.efficiency} className="flex-1" />
                          <span className="text-sm font-medium">{selectedEquipment.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Equipment
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}

export default AdvancedEquipmentManagement;
