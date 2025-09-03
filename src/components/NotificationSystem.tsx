import React, { useState, useEffect, createContext, useContext } from 'react';
import { useSettings } from './Settings';

// Import custom UI components
import { Box } from './ui/Box';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Chip } from './ui/Chip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Switch } from './ui/Switch';

// Import icons
import { 
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  Clock,
  User,
  HardHat,
  DollarSign,
  Wrench,
  FileText,
  Settings as SettingsIcon,
  Trash2,
  Mail,
  MailOpen,
  CheckCheck,
  X,
  Smartphone,
  Send
} from 'lucide-react';

// Notification interfaces
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'project' | 'employee' | 'financial' | 'equipment' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

interface NotificationPreferences {
  inApp: {
    system: boolean;
    project: boolean;
    employee: boolean;
    financial: boolean;
    equipment: boolean;
    maintenance: boolean;
  };
  email: {
    system: boolean;
    project: boolean;
    employee: boolean;
    financial: boolean;
    equipment: boolean;
    maintenance: boolean;
  };
  push: {
    system: boolean;
    project: boolean;
    employee: boolean;
    financial: boolean;
    equipment: boolean;
    maintenance: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

// Sample notifications
const sampleNotifications: Notification[] = [
  {
    id: '1',
    title: 'Equipment Maintenance Due',
    message: 'Tower Crane TCR 125 is due for maintenance in 2 days',
    type: 'warning',
    category: 'maintenance',
    priority: 'high',
    timestamp: '2024-02-20T10:30:00Z',
    read: false,
    actionRequired: true,
    relatedEntity: { type: 'equipment', id: '3', name: 'Tower Crane TCR 125' }
  },
  {
    id: '2',
    title: 'New Employee Onboarded',
    message: 'Mohammed Hassan has been successfully added to the system',
    type: 'success',
    category: 'employee',
    priority: 'medium',
    timestamp: '2024-02-20T09:15:00Z',
    read: false,
    relatedEntity: { type: 'employee', id: '5', name: 'Mohammed Hassan' }
  },
  {
    id: '3',
    title: 'Budget Alert',
    message: 'Materials budget for Site Alpha is 90% utilized',
    type: 'warning',
    category: 'financial',
    priority: 'high',
    timestamp: '2024-02-20T08:45:00Z',
    read: true,
    actionRequired: true,
    relatedEntity: { type: 'budget', id: 'MAT-ALPHA', name: 'Materials - Site Alpha' }
  },
  {
    id: '4',
    title: 'Project Milestone Completed',
    message: 'Foundation work completed at Site Beta - 2 days ahead of schedule',
    type: 'success',
    category: 'project',
    priority: 'medium',
    timestamp: '2024-02-19T16:20:00Z',
    read: true,
    relatedEntity: { type: 'project', id: 'BETA-001', name: 'Site Beta Foundation' }
  },
  {
    id: '5',
    title: 'System Backup Completed',
    message: 'Daily system backup completed successfully',
    type: 'info',
    category: 'system',
    priority: 'low',
    timestamp: '2024-02-19T02:00:00Z',
    read: true
  },
  {
    id: '6',
    title: 'Safety Incident Report',
    message: 'Minor safety incident reported at Site Alpha - immediate attention required',
    type: 'error',
    category: 'project',
    priority: 'critical',
    timestamp: '2024-02-18T14:30:00Z',
    read: false,
    actionRequired: true,
    relatedEntity: { type: 'incident', id: 'INC-001', name: 'Safety Incident - Site Alpha' }
  }
];

// Notification Context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  updatePreferences: (preferences: NotificationPreferences) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    inApp: { system: true, project: true, employee: true, financial: true, equipment: true, maintenance: true },
    email: { system: false, project: true, employee: true, financial: true, equipment: false, maintenance: true },
    push: { system: false, project: true, employee: false, financial: true, equipment: true, maintenance: true },
    priority: { low: true, medium: true, high: true, critical: true }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const updatePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification,
      updatePreferences
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Notification Bell Component for Header
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { language } = useSettings();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    
    switch (category) {
      case 'maintenance': return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'employee': return <User className="w-5 h-5 text-blue-500" />;
      case 'financial': return <DollarSign className="w-5 h-5 text-blue-500" />;
      case 'equipment': return <HardHat className="w-5 h-5 text-blue-500" />;
      case 'project': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const recentNotifications = notifications.slice(0, showAll ? notifications.length : 5);

  return (
    <>
      <div className="relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setOpen(true)}
          className="text-white hover:bg-white/10 p-2"
        >
          <Badge content={unreadCount > 0 ? unreadCount : null} className="bg-red-500">
            <Bell className="w-5 h-5" />
          </Badge>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[600px] overflow-hidden">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <Chip variant="destructive" className="text-xs">
                    {unreadCount}
                  </Chip>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto py-2">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 cursor-pointer transition-colors ${
                  notification.read ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-800/50'
                } ${
                  notification.type === 'error' ? 'border-red-500' :
                  notification.type === 'warning' ? 'border-yellow-500' :
                  notification.type === 'success' ? 'border-green-500' : 'border-blue-500'
                } hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type, notification.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Typography 
                      variant="subtitle2" 
                      className={`mb-1 ${notification.read ? 'font-normal' : 'font-semibold'}`}
                    >
                      {notification.title}
                    </Typography>
                    <Typography className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {notification.message}
                    </Typography>
                    <Typography className="text-gray-500 text-xs">
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 5 && (
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `View All (${notifications.length})`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Full Notification Management Component
export function NotificationManagement() {
  const { 
    notifications, 
    unreadCount, 
    preferences, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    updatePreferences 
  } = useNotifications();
  const { language } = useSettings();
  const [currentTab, setCurrentTab] = useState('notifications');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const t = (key: string, fallback: string) => {
    const translations: Record<string, { EN: string; AR: string }> = {
      notifications: { EN: 'Notifications', AR: 'الإشعارات' },
      all_notifications: { EN: 'All Notifications', AR: 'جميع الإشعارات' },
      unread: { EN: 'Unread', AR: 'غير مقروءة' },
      preferences: { EN: 'Preferences', AR: 'التفضيلات' },
      mark_all_read: { EN: 'Mark All as Read', AR: 'تعليم الكل كمقروء' },
      clear_all: { EN: 'Clear All', AR: 'مسح الكل' },
      notification_settings: { EN: 'Notification Settings', AR: 'إعدادات الإشعارات' },
      in_app_notifications: { EN: 'In-App Notifications', AR: 'الإشعارات داخل التطبيق' },
      email_notifications: { EN: 'Email Notifications', AR: 'إشعارات البريد الإلكتروني' },
      push_notifications: { EN: 'Push Notifications', AR: 'الإشعارات المرسلة' },
      priority_settings: { EN: 'Priority Settings', AR: 'إعدادات الأولوية' },
      system: { EN: 'System', AR: 'النظام' },
      project: { EN: 'Project', AR: 'المشروع' },
      employee: { EN: 'Employee', AR: 'الموظف' },
      financial: { EN: 'Financial', AR: 'مالي' },
      equipment: { EN: 'Equipment', AR: 'المعدات' },
      maintenance: { EN: 'Maintenance', AR: 'الصيانة' },
      low: { EN: 'Low', AR: 'منخفض' },
      medium: { EN: 'Medium', AR: 'متوسط' },
      high: { EN: 'High', AR: 'عالي' },
      critical: { EN: 'Critical', AR: 'حرج' },
      save_preferences: { EN: 'Save Preferences', AR: 'حفظ التفضيلات' },
      no_notifications: { EN: 'No notifications to display', AR: 'لا توجد إشعارات للعرض' },
      filter_by_type: { EN: 'Filter by Type', AR: 'تصفية حسب النوع' },
      filter_by_category: { EN: 'Filter by Category', AR: 'تصفية حسب الفئة' },
      info: { EN: 'Info', AR: 'معلومات' },
      warning: { EN: 'Warning', AR: 'تحذير' },
      error: { EN: 'Error', AR: 'خطأ' },
      success: { EN: 'Success', AR: 'نجح' },
    };
    return translations[key]?.[language] || fallback;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const typeMatch = filterType === 'all' || notification.type === filterType;
    const categoryMatch = filterCategory === 'all' || notification.category === filterCategory;
    return typeMatch && categoryMatch;
  });

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'error') return <XCircle className="w-6 h-6" />;
    if (type === 'warning') return <AlertTriangle className="w-6 h-6" />;
    if (type === 'success') return <CheckCircle className="w-6 h-6" />;
    
    switch (category) {
      case 'maintenance': return <Wrench className="w-6 h-6" />;
      case 'employee': return <User className="w-6 h-6" />;
      case 'financial': return <DollarSign className="w-6 h-6" />;
      case 'equipment': return <HardHat className="w-6 h-6" />;
      case 'project': return <FileText className="w-6 h-6" />;
      default: return <Info className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'critical': return <Chip variant="destructive" className="text-xs">{t('critical', 'Critical')}</Chip>;
      case 'high': return <Chip className="text-xs bg-yellow-100 text-yellow-800">{t('high', 'High')}</Chip>;
      case 'medium': return <Chip className="text-xs bg-blue-100 text-blue-800">{t('medium', 'Medium')}</Chip>;
      default: return <Chip className="text-xs bg-gray-100 text-gray-800">{t('low', 'Low')}</Chip>;
    }
  };

  const handleSavePreferences = () => {
    updatePreferences(localPreferences);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <Box className="p-6 space-y-6">
      <Typography variant="h4" className="mb-6">
        {t('notifications', 'Notifications')}
      </Typography>

      <Card>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="w-full">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Badge content={unreadCount > 0 ? unreadCount : null} className="bg-red-500">
                {t('all_notifications', 'All Notifications')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="preferences">{t('preferences', 'Preferences')}</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="p-6">
            {/* Action Bar */}
            <div className="flex gap-4 mb-6 flex-wrap items-center">
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                {t('mark_all_read', 'Mark All as Read')}
              </Button>

              <div className="flex gap-2 ml-auto flex-wrap">
                {['all', 'info', 'warning', 'error', 'success'].map((type) => (
                  <Chip
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`cursor-pointer ${
                      filterType === type 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {t(type, type.charAt(0).toUpperCase() + type.slice(1))}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-2">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      notification.read ? 'border-gray-200 dark:border-gray-700' : 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                    } hover:shadow-md cursor-pointer`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-4">
                      <Avatar className={`w-10 h-10 ${getTypeColor(notification.type)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Typography 
                            variant="subtitle2" 
                            className={notification.read ? 'font-normal' : 'font-semibold'}
                          >
                            {notification.title}
                          </Typography>
                          {getPriorityChip(notification.priority)}
                          {notification.actionRequired && (
                            <Chip variant="destructive" className="text-xs">Action Required</Chip>
                          )}
                        </div>
                        
                        <Typography className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {notification.message}
                        </Typography>
                        
                        <div className="flex items-center justify-between">
                          <Typography className="text-gray-500 text-xs">
                            {formatTimeAgo(notification.timestamp)}
                          </Typography>
                          <Chip className="text-xs bg-gray-100 dark:bg-gray-800">
                            {t(notification.category, notification.category)}
                          </Chip>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="flex-shrink-0 p-2 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <Typography variant="h6" className="text-gray-500">
                    {t('no_notifications', 'No notifications to display')}
                  </Typography>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="p-6">
            <Typography variant="h5" className="mb-6">
              {t('notification_settings', 'Notification Settings')}
            </Typography>

            <div className="space-y-6">
              {/* In-App Notifications */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BellRing className="w-5 h-5 text-blue-500" />
                  <Typography variant="h6">
                    {t('in_app_notifications', 'In-App Notifications')}
                  </Typography>
                </div>
                <div className="space-y-3">
                  {Object.entries(localPreferences.inApp).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Typography className="text-sm">
                        {t(key, key.charAt(0).toUpperCase() + key.slice(1))}
                      </Typography>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setLocalPreferences(prev => ({
                            ...prev,
                            inApp: { ...prev.inApp, [key]: checked }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Email Notifications */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <Typography variant="h6">
                    {t('email_notifications', 'Email Notifications')}
                  </Typography>
                </div>
                <div className="space-y-3">
                  {Object.entries(localPreferences.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Typography className="text-sm">
                        {t(key, key.charAt(0).toUpperCase() + key.slice(1))}
                      </Typography>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setLocalPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, [key]: checked }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Push Notifications */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <Typography variant="h6">
                    {t('push_notifications', 'Push Notifications')}
                  </Typography>
                </div>
                <div className="space-y-3">
                  {Object.entries(localPreferences.push).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Typography className="text-sm">
                        {t(key, key.charAt(0).toUpperCase() + key.slice(1))}
                      </Typography>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setLocalPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, [key]: checked }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Priority Settings */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                  <Typography variant="h6">
                    {t('priority_settings', 'Priority Settings')}
                  </Typography>
                </div>
                <div className="space-y-3">
                  {Object.entries(localPreferences.priority).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Typography className="text-sm">
                        {t(key, key.charAt(0).toUpperCase() + key.slice(1))}
                      </Typography>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setLocalPreferences(prev => ({
                            ...prev,
                            priority: { ...prev.priority, [key]: checked }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Button
                onClick={handleSavePreferences}
                className="flex items-center gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                {t('save_preferences', 'Save Preferences')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </Box>
  );
}

export default NotificationManagement;
