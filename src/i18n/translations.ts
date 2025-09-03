// Translation system for construction site management
export type Language = 'en' | 'ar'

export interface Translations {
  // Navigation and General
  dashboard: string
  siteManagement: string
  userManagement: string
  settings: string
  logout: string
  welcome: string
  loading: string
  search: string
  filter: string
  actions: string
  save: string
  cancel: string
  edit: string
  delete: string
  add: string
  view: string
  close: string
  confirm: string
  
  // Site Management
  constructionSites: string
  addNewSite: string
  siteOverview: string
  employees: string
  equipment: string
  expenses: string
  progress: string
  documents: string
  
  // Site Details
  siteName: string
  siteCode: string
  location: string
  description: string
  status: string
  priority: string
  budget: string
  spent: string
  remaining: string
  manager: string
  startDate: string
  endDate: string
  
  // Site Status
  planning: string
  active: string
  paused: string
  completed: string
  cancelled: string
  
  // Priority Levels
  low: string
  medium: string
  high: string
  critical: string
  
  // Overview Dashboard
  projectHealthOverview: string
  projectStatus: string
  budgetStatus: string
  projectProgress: string
  keyMetrics: string
  activeEmployees: string
  operationalEquipment: string
  milestones: string
  totalDocuments: string
  overdue: string
  monthlyCostBreakdown: string
  laborCosts: string
  equipmentRental: string
  materialsOthers: string
  totalMonthly: string
  timelineVsProgress: string
  timeProgress: string
  workProgress: string
  behindSchedule: string
  aheadOfSchedule: string
  onSchedule: string
  recentActivity: string
  upcomingMilestones: string
  detailedStatistics: string
  expenseCategories: string
  equipmentStatus: string
  teamOverview: string
  alertsNotifications: string
  budgetAlert: string
  overdueMilestones: string
  maintenanceDue: string
  progressAlert: string
  allSystemsGood: string
  quickActions: string
  addEmployee: string
  addEquipment: string
  recordExpense: string
  addMilestone: string
  uploadDocument: string
  generateReport: string
  
  // Employee Management
  siteEmployees: string
  employeeId: string
  employeeName: string
  fullName: string
  role: string
  department: string
  hourlyRate: string
  assignedDate: string
  attendance: string
  weeklyHours: string
  weeklyPay: string
  totalEmployees: string
  inactive: string
  roles: string
  totalHourlyCost: string
  recordAttendance: string
  today: string
  present: string
  absent: string
  sick: string
  vacation: string
  hoursWorked: string
  overtimeHours: string
  regularHours: string
  overtime: string
  total: string
  pay: string
  
  // Equipment Management
  siteEquipment: string
  equipmentName: string
  type: string
  serialNumber: string
  dailyRate: string
  lastMaintenance: string
  nextMaintenance: string
  condition: string
  operational: string
  maintenance: string
  repair: string
  retired: string
  excellent: string
  good: string
  fair: string
  poor: string
  maintenanceDueCount: string
  equipmentTypes: string
  dailyCost: string
  monthlyCost: string
  daysSinceLastMaintenance: string
  maintenanceType: string
  routineMaintenance: string
  inspection: string
  upgrade: string
  emergencyFix: string
  cost: string
  maintenanceNotes: string
  maintenanceSummary: string
  nextDue: string
  recordMaintenance: string
  maintenanceDate: string
  
  // Expense Management
  siteExpenses: string
  category: string
  amount: string
  date: string
  submittedBy: string
  approvedBy: string
  approvedDate: string
  attachments: string
  draft: string
  submitted: string
  approved: string
  rejected: string
  paid: string
  materials: string
  labor: string
  subcontractors: string
  permits: string
  utilities: string
  other: string
  budgetOverview: string
  totalExpenses: string
  pending: string
  approve: string
  reject: string
  markPaid: string
  submit: string
  expenseSummary: string
  
  // Progress Management
  siteProgress: string
  milestoneTitle: string
  targetDate: string
  completedDate: string
  dependencies: string
  overallProjectProgress: string
  inProgress: string
  cards: string
  timeline: string
  daysRemaining: string
  
  // Document Management
  siteDocuments: string
  documentName: string
  uploader: string
  uploadedBy: string
  uploadedDate: string
  size: string
  tags: string
  contract: string
  permit: string
  drawing: string
  photo: string
  report: string
  grid: string
  list: string
  totalSize: string
  recentUploads: string
  selectFile: string
  documentType: string
  documentPreview: string
  uploading: string
  
  // Messages and Alerts
  noEmployeesFound: string
  noEquipmentFound: string
  noExpensesFound: string
  noMilestonesFound: string
  noDocumentsFound: string
  confirmDelete: string
  confirmDeleteSite: string
  confirmRemoveEmployee: string
  confirmRemoveEquipment: string
  allGood: string
  projectOnTrack: string
  
  // Form Labels and Placeholders
  required: string
  optional: string
  pleaseSelect: string
  enterValue: string
  selectDate: string
  uploadFile: string
  
  // Time and Dates
  days: string
  hours: string
  minutes: string
  ago: string
  daysLeft: string
  daysOverdue: string
  dueToday: string
  since: string
  until: string
  
  // File Sizes
  bytes: string
  kilobytes: string
  megabytes: string
  gigabytes: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation and General
    dashboard: 'Dashboard',
    siteManagement: 'Site Management',
    userManagement: 'User Management',
    settings: 'Settings',
    logout: 'Logout',
    welcome: 'Welcome',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    view: 'View',
    close: 'Close',
    confirm: 'Confirm',
    
    // Site Management
    constructionSites: 'Construction Sites',
    addNewSite: 'Add New Site',
    siteOverview: 'Overview',
    employees: 'Employees',
    equipment: 'Equipment',
    expenses: 'Expenses',
    progress: 'Progress',
    documents: 'Documents',
    
    // Site Details
    siteName: 'Site Name',
    siteCode: 'Site Code',
    location: 'Location',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    budget: 'Budget',
    spent: 'Spent',
    remaining: 'Remaining',
    manager: 'Manager',
    startDate: 'Start Date',
    endDate: 'End Date',
    
    // Site Status
    planning: 'Planning',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Priority Levels
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    
    // Overview Dashboard
    projectHealthOverview: 'Project Health Overview',
    projectStatus: 'Project Status',
    budgetStatus: 'Budget Status',
    projectProgress: 'Project Progress',
    keyMetrics: 'Key Metrics',
    activeEmployees: 'Active Employees',
    operationalEquipment: 'Operational Equipment',
    milestones: 'Milestones',
    totalDocuments: 'Documents',
    overdue: 'Overdue',
    monthlyCostBreakdown: 'Monthly Cost Breakdown',
    laborCosts: 'Labor Costs',
    equipmentRental: 'Equipment Rental',
    materialsOthers: 'Materials & Others',
    totalMonthly: 'Total Monthly',
    timelineVsProgress: 'Timeline vs Progress',
    timeProgress: 'Time Progress',
    workProgress: 'Work Progress',
    behindSchedule: 'Behind Schedule',
    aheadOfSchedule: 'Ahead of Schedule',
    onSchedule: 'On Schedule',
    recentActivity: 'Recent Activity',
    upcomingMilestones: 'Upcoming Milestones',
    detailedStatistics: 'Detailed Statistics',
    expenseCategories: 'Expense Categories',
    equipmentStatus: 'Equipment Status',
    teamOverview: 'Team Overview',
    alertsNotifications: 'Alerts & Notifications',
    budgetAlert: 'Budget Alert',
    overdueMilestones: 'Overdue Milestones',
    maintenanceDue: 'Maintenance Due',
    progressAlert: 'Progress Alert',
    allSystemsGood: 'All Systems Good',
    quickActions: 'Quick Actions',
    addEmployee: 'Add Employee',
    addEquipment: 'Add Equipment',
    recordExpense: 'Record Expense',
    addMilestone: 'Add Milestone',
    uploadDocument: 'Upload Document',
    generateReport: 'Generate Report',
    
    // Employee Management
    siteEmployees: 'Site Employees',
    employeeId: 'Employee ID',
    employeeName: 'Employee Name',
    fullName: 'Full Name',
    role: 'Role',
    department: 'Department',
    hourlyRate: 'Hourly Rate',
    assignedDate: 'Assigned Date',
    attendance: 'Attendance',
    weeklyHours: 'Weekly Hours',
    weeklyPay: 'Weekly Pay',
    totalEmployees: 'Total Employees',
    inactive: 'Inactive',
    roles: 'Roles',
    totalHourlyCost: 'Total Hourly Cost',
    recordAttendance: 'Record Attendance',
    today: 'Today',
    present: 'Present',
    absent: 'Absent',
    sick: 'Sick',
    vacation: 'Vacation',
    hoursWorked: 'Hours Worked',
    overtimeHours: 'Overtime Hours',
    regularHours: 'Regular hours',
    overtime: 'Overtime',
    total: 'Total',
    pay: 'Pay',
    
    // Equipment Management
    siteEquipment: 'Site Equipment',
    equipmentName: 'Equipment Name',
    type: 'Type',
    serialNumber: 'Serial Number',
    dailyRate: 'Daily Rate',
    lastMaintenance: 'Last Maintenance',
    nextMaintenance: 'Next Maintenance',
    condition: 'Condition',
    operational: 'Operational',
    maintenance: 'Maintenance',
    repair: 'Repair',
    retired: 'Retired',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    maintenanceDueCount: 'Maintenance Due',
    equipmentTypes: 'Equipment Types',
    dailyCost: 'Daily Cost',
    monthlyCost: 'Monthly Cost',
    daysSinceLastMaintenance: 'days ago',
    maintenanceType: 'Maintenance Type',
    routineMaintenance: 'Routine Maintenance',
    inspection: 'Inspection',
    upgrade: 'Upgrade',
    emergencyFix: 'Emergency Fix',
    cost: 'Cost',
    maintenanceNotes: 'Maintenance Notes',
    maintenanceSummary: 'Maintenance Summary',
    nextDue: 'Next Due',
    recordMaintenance: 'Record Maintenance',
    maintenanceDate: 'Maintenance Date',
    
    // Expense Management
    siteExpenses: 'Site Expenses',
    category: 'Category',
    amount: 'Amount',
    date: 'Date',
    submittedBy: 'Submitted By',
    approvedBy: 'Approved By',
    approvedDate: 'Approved Date',
    attachments: 'Attachments',
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
    materials: 'Materials',
    labor: 'Labor',
    subcontractors: 'Subcontractors',
    permits: 'Permits',
    utilities: 'Utilities',
    other: 'Other',
    budgetOverview: 'Budget Overview',
    totalExpenses: 'Total Expenses',
    pending: 'Pending',
    approve: 'Approve',
    reject: 'Reject',
    markPaid: 'Mark Paid',
    submit: 'Submit',
    expenseSummary: 'Expense Summary',
    
    // Progress Management
    siteProgress: 'Site Progress',
    milestoneTitle: 'Milestone Title',
    targetDate: 'Target Date',
    completedDate: 'Completed Date',
    dependencies: 'Dependencies',
    overallProjectProgress: 'Overall Project Progress',
    inProgress: 'In Progress',
    cards: 'Cards',
    timeline: 'Timeline',
    daysRemaining: 'days remaining',
    
    // Document Management
    siteDocuments: 'Site Documents',
    documentName: 'Document Name',
    uploader: 'Uploader',
    uploadedBy: 'Uploaded By',
    uploadedDate: 'Upload Date',
    size: 'Size',
    tags: 'Tags',
    contract: 'Contract',
    permit: 'Permit',
    drawing: 'Drawing',
    photo: 'Photo',
    report: 'Report',
    grid: 'Grid',
    list: 'List',
    totalSize: 'Total Size',
    recentUploads: 'Recent Uploads',
    selectFile: 'Select File',
    documentType: 'Document Type',
    documentPreview: 'Document Preview',
    uploading: 'Uploading...',
    
    // Messages and Alerts
    noEmployeesFound: 'No employees found',
    noEquipmentFound: 'No equipment found',
    noExpensesFound: 'No expenses found',
    noMilestonesFound: 'No milestones found',
    noDocumentsFound: 'No documents found',
    confirmDelete: 'Are you sure you want to delete this item?',
    confirmDeleteSite: 'Are you sure you want to delete this site? This action cannot be undone.',
    confirmRemoveEmployee: 'Are you sure you want to remove this employee from the site?',
    confirmRemoveEquipment: 'Are you sure you want to remove this equipment from the site?',
    allGood: 'All Good',
    projectOnTrack: 'Project is on track with no critical alerts',
    
    // Form Labels and Placeholders
    required: 'Required',
    optional: 'Optional',
    pleaseSelect: 'Please select',
    enterValue: 'Enter value',
    selectDate: 'Select date',
    uploadFile: 'Upload file',
    
    // Time and Dates
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    ago: 'ago',
    daysLeft: 'days left',
    daysOverdue: 'days overdue',
    dueToday: 'Due today',
    since: 'Since',
    until: 'Until',
    
    // File Sizes
    bytes: 'B',
    kilobytes: 'KB',
    megabytes: 'MB',
    gigabytes: 'GB'
  },
  
  ar: {
    // Navigation and General
    dashboard: 'لوحة التحكم',
    siteManagement: 'إدارة المواقع',
    userManagement: 'إدارة المستخدمين',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً',
    loading: 'جاري التحميل...',
    search: 'بحث',
    filter: 'تصفية',
    actions: 'الإجراءات',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة',
    view: 'عرض',
    close: 'إغلاق',
    confirm: 'تأكيد',
    
    // Site Management
    constructionSites: 'مواقع البناء',
    addNewSite: 'إضافة موقع جديد',
    siteOverview: 'نظرة عامة',
    employees: 'الموظفون',
    equipment: 'المعدات',
    expenses: 'المصروفات',
    progress: 'التقدم',
    documents: 'الوثائق',
    
    // Site Details
    siteName: 'اسم الموقع',
    siteCode: 'رمز الموقع',
    location: 'الموقع',
    description: 'الوصف',
    status: 'الحالة',
    priority: 'الأولوية',
    budget: 'الميزانية',
    spent: 'المنفق',
    remaining: 'المتبقي',
    manager: 'المدير',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ الانتهاء',
    
    // Site Status
    planning: 'تخطيط',
    active: 'نشط',
    paused: 'متوقف',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    
    // Priority Levels
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    critical: 'حرج',
    
    // Overview Dashboard
    projectHealthOverview: 'نظرة عامة على صحة المشروع',
    projectStatus: 'حالة المشروع',
    budgetStatus: 'حالة الميزانية',
    projectProgress: 'تقدم المشروع',
    keyMetrics: 'المقاييس الرئيسية',
    activeEmployees: 'الموظفون النشطون',
    operationalEquipment: 'المعدات التشغيلية',
    milestones: 'المعالم',
    totalDocuments: 'الوثائق',
    overdue: 'متأخر',
    monthlyCostBreakdown: 'تفصيل التكاليف الشهرية',
    laborCosts: 'تكاليف العمالة',
    equipmentRental: 'إيجار المعدات',
    materialsOthers: 'المواد وأخرى',
    totalMonthly: 'المجموع الشهري',
    timelineVsProgress: 'الجدول الزمني مقابل التقدم',
    timeProgress: 'تقدم الوقت',
    workProgress: 'تقدم العمل',
    behindSchedule: 'متأخر عن الجدول',
    aheadOfSchedule: 'متقدم عن الجدول',
    onSchedule: 'وفقاً للجدول',
    recentActivity: 'النشاط الأخير',
    upcomingMilestones: 'المعالم القادمة',
    detailedStatistics: 'الإحصائيات التفصيلية',
    expenseCategories: 'فئات المصروفات',
    equipmentStatus: 'حالة المعدات',
    teamOverview: 'نظرة على الفريق',
    alertsNotifications: 'التنبيهات والإشعارات',
    budgetAlert: 'تنبيه الميزانية',
    overdueMilestones: 'معالم متأخرة',
    maintenanceDue: 'صيانة مطلوبة',
    progressAlert: 'تنبيه التقدم',
    allSystemsGood: 'جميع الأنظمة جيدة',
    quickActions: 'إجراءات سريعة',
    addEmployee: 'إضافة موظف',
    addEquipment: 'إضافة معدات',
    recordExpense: 'تسجيل مصروف',
    addMilestone: 'إضافة معلم',
    uploadDocument: 'رفع وثيقة',
    generateReport: 'إنشاء تقرير',
    
    // Employee Management
    siteEmployees: 'موظفو الموقع',
    employeeId: 'رقم الموظف',
    employeeName: 'اسم الموظف',
    fullName: 'الاسم الكامل',
    role: 'الدور',
    department: 'القسم',
    hourlyRate: 'الأجر بالساعة',
    assignedDate: 'تاريخ التعيين',
    attendance: 'الحضور',
    weeklyHours: 'ساعات أسبوعية',
    weeklyPay: 'راتب أسبوعي',
    totalEmployees: 'إجمالي الموظفين',
    inactive: 'غير نشط',
    roles: 'الأدوار',
    totalHourlyCost: 'إجمالي التكلفة بالساعة',
    recordAttendance: 'تسجيل الحضور',
    today: 'اليوم',
    present: 'حاضر',
    absent: 'غائب',
    sick: 'مريض',
    vacation: 'إجازة',
    hoursWorked: 'ساعات العمل',
    overtimeHours: 'ساعات إضافية',
    regularHours: 'ساعات عادية',
    overtime: 'وقت إضافي',
    total: 'المجموع',
    pay: 'الراتب',
    
    // Equipment Management
    siteEquipment: 'معدات الموقع',
    equipmentName: 'اسم المعدة',
    type: 'النوع',
    serialNumber: 'الرقم التسلسلي',
    dailyRate: 'السعر اليومي',
    lastMaintenance: 'آخر صيانة',
    nextMaintenance: 'الصيانة القادمة',
    condition: 'الحالة',
    operational: 'تشغيلية',
    maintenance: 'صيانة',
    repair: 'إصلاح',
    retired: 'خارج الخدمة',
    excellent: 'ممتازة',
    good: 'جيدة',
    fair: 'مقبولة',
    poor: 'ضعيفة',
    maintenanceDueCount: 'صيانة مطلوبة',
    equipmentTypes: 'أنواع المعدات',
    dailyCost: 'التكلفة اليومية',
    monthlyCost: 'التكلفة الشهرية',
    daysSinceLastMaintenance: 'يوم مضى',
    maintenanceType: 'نوع الصيانة',
    routineMaintenance: 'صيانة دورية',
    inspection: 'فحص',
    upgrade: 'ترقية',
    emergencyFix: 'إصلاح طارئ',
    cost: 'التكلفة',
    maintenanceNotes: 'ملاحظات الصيانة',
    maintenanceSummary: 'ملخص الصيانة',
    nextDue: 'الاستحقاق القادم',
    recordMaintenance: 'تسجيل الصيانة',
    maintenanceDate: 'تاريخ الصيانة',
    
    // Expense Management
    siteExpenses: 'مصروفات الموقع',
    category: 'الفئة',
    amount: 'المبلغ',
    date: 'التاريخ',
    submittedBy: 'مقدم من',
    approvedBy: 'موافق عليه من',
    approvedDate: 'تاريخ الموافقة',
    attachments: 'المرفقات',
    draft: 'مسودة',
    submitted: 'مقدم',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    paid: 'مدفوع',
    materials: 'مواد',
    labor: 'عمالة',
    subcontractors: 'مقاولون فرعيون',
    permits: 'تصاريح',
    utilities: 'مرافق',
    other: 'أخرى',
    budgetOverview: 'نظرة على الميزانية',
    totalExpenses: 'إجمالي المصروفات',
    pending: 'قيد الانتظار',
    approve: 'موافقة',
    reject: 'رفض',
    markPaid: 'تحديد كمدفوع',
    submit: 'إرسال',
    expenseSummary: 'ملخص المصروف',
    
    // Progress Management
    siteProgress: 'تقدم الموقع',
    milestoneTitle: 'عنوان المعلم',
    targetDate: 'التاريخ المستهدف',
    completedDate: 'تاريخ الإنجاز',
    dependencies: 'التبعيات',
    overallProjectProgress: 'التقدم العام للمشروع',
    inProgress: 'قيد التنفيذ',
    cards: 'بطاقات',
    timeline: 'الجدول الزمني',
    daysRemaining: 'يوم متبقي',
    
    // Document Management
    siteDocuments: 'وثائق الموقع',
    documentName: 'اسم الوثيقة',
    uploader: 'الرافع',
    uploadedBy: 'رفعت بواسطة',
    uploadedDate: 'تاريخ الرفع',
    size: 'الحجم',
    tags: 'العلامات',
    contract: 'عقد',
    permit: 'تصريح',
    drawing: 'رسم',
    photo: 'صورة',
    report: 'تقرير',
    grid: 'شبكة',
    list: 'قائمة',
    totalSize: 'الحجم الكلي',
    recentUploads: 'المرفوعات الحديثة',
    selectFile: 'اختر ملف',
    documentType: 'نوع الوثيقة',
    documentPreview: 'معاينة الوثيقة',
    uploading: 'جاري الرفع...',
    
    // Messages and Alerts
    noEmployeesFound: 'لا يوجد موظفون',
    noEquipmentFound: 'لا توجد معدات',
    noExpensesFound: 'لا توجد مصروفات',
    noMilestonesFound: 'لا توجد معالم',
    noDocumentsFound: 'لا توجد وثائق',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    confirmDeleteSite: 'هل أنت متأكد من حذف هذا الموقع؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmRemoveEmployee: 'هل أنت متأكد من إزالة هذا الموظف من الموقع؟',
    confirmRemoveEquipment: 'هل أنت متأكد من إزالة هذه المعدة من الموقع؟',
    allGood: 'كل شيء جيد',
    projectOnTrack: 'المشروع يسير على الطريق الصحيح بدون تنبيهات حرجة',
    
    // Form Labels and Placeholders
    required: 'مطلوب',
    optional: 'اختياري',
    pleaseSelect: 'يرجى الاختيار',
    enterValue: 'أدخل القيمة',
    selectDate: 'اختر التاريخ',
    uploadFile: 'رفع ملف',
    
    // Time and Dates
    days: 'أيام',
    hours: 'ساعات',
    minutes: 'دقائق',
    ago: 'مضت',
    daysLeft: 'يوم متبقي',
    daysOverdue: 'يوم تأخير',
    dueToday: 'مستحق اليوم',
    since: 'منذ',
    until: 'حتى',
    
    // File Sizes
    bytes: 'بايت',
    kilobytes: 'ك.بايت',
    megabytes: 'م.بايت',
    gigabytes: 'ج.بايت'
  }
}

export default translations
