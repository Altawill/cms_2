import { Task, TaskUpdate, TaskApproval, TaskInvoiceLink } from '../types/tasks'
import { Site, Employee, Client } from '../types/reports'

// Demo site data for 'The L Villas'
export const DEMO_SITE: Site = {
  id: 'site-lvillas-001',
  name: 'The L Villas',
  nameAr: 'فيلات الليبار',
  description: 'Luxury residential villa development project in premium location',
  descriptionAr: 'مشروع تطوير فيلات سكنية فاخرة في موقع متميز',
  location: 'Al-Andalus District, Tripoli',
  locationAr: 'حي الأندلس، طرابلس',
  clientId: 'client-001',
  projectManager: 'Ahmed Hassan',
  startDate: '2024-01-15',
  expectedEndDate: '2024-12-30',
  actualEndDate: '',
  status: 'IN_PROGRESS',
  progress: 65,
  budget: 2500000,
  spent: 1625000,
  currency: 'LYD',
  contractValue: 2500000,
  area: 15000,
  units: 8,
  floors: 2,
  tags: ['luxury', 'residential', 'villas', 'premium'],
  coordinates: {
    lat: 32.8872,
    lng: 13.1913
  }
}

// Demo employees
export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: 'Ahmed Hassan',
    nameAr: 'أحمد حسن',
    role: 'Project Manager',
    roleAr: 'مدير المشروع',
    department: 'Construction',
    email: 'ahmed.hassan@company.com',
    phone: '+218-91-234-5678'
  },
  {
    id: 'emp-002', 
    name: 'Fatima Al-Zahra',
    nameAr: 'فاطمة الزهراء',
    role: 'Site Engineer',
    roleAr: 'مهندس موقع',
    department: 'Engineering',
    email: 'fatima.zahra@company.com',
    phone: '+218-92-345-6789'
  },
  {
    id: 'emp-003',
    name: 'Omar Mahmoud',
    nameAr: 'عمر محمود',
    role: 'Construction Supervisor',
    roleAr: 'مشرف البناء',
    department: 'Construction',
    email: 'omar.mahmoud@company.com',
    phone: '+218-93-456-7890'
  },
  {
    id: 'emp-004',
    name: 'Aisha Ibrahim',
    nameAr: 'عائشة إبراهيم',
    role: 'Quality Inspector',
    roleAr: 'مفتش الجودة',
    department: 'Quality Assurance',
    email: 'aisha.ibrahim@company.com',
    phone: '+218-94-567-8901'
  },
  {
    id: 'emp-005',
    name: 'Khalil Benali',
    nameAr: 'خليل بن علي',
    role: 'Financial Manager',
    roleAr: 'مدير مالي',
    department: 'Finance',
    email: 'khalil.benali@company.com',
    phone: '+218-95-678-9012'
  }
]

// Demo client
export const DEMO_CLIENT: Client = {
  id: 'client-001',
  name: 'Al-Libyan Real Estate Development',
  nameAr: 'شركة التطوير العقاري الليبي',
  contactPerson: 'Dr. Samir Al-Mansouri',
  contactPersonAr: 'د. سمير المنصوري',
  email: 'info@libyan-realestate.ly',
  phone: '+218-21-123-4567',
  address: 'Hay Al-Andalus, Tripoli, Libya',
  addressAr: 'حي الأندلس، طرابلس، ليبيا'
}

// Demo tasks for The L Villas project
export const DEMO_TASKS: Task[] = [
  {
    id: 'task-001',
    siteId: 'site-lvillas-001',
    title: 'Foundation and Excavation - Villa A',
    titleAr: 'الأساسات والحفريات - فيلا أ',
    description: 'Complete foundation work and excavation for Villa A including soil testing, reinforcement installation, and concrete pouring',
    descriptionAr: 'إكمال أعمال الأساسات والحفريات للفيلا أ بما في ذلك فحص التربة وتركيب التسليح وصب الخرسانة',
    status: 'COMPLETED',
    priority: 'HIGH',
    category: 'Construction',
    categoryAr: 'البناء',
    assignedTo: ['emp-002', 'emp-003'],
    createdBy: 'emp-001',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-28T17:30:00Z',
    dueDate: '2024-02-28',
    startDate: '2024-02-01',
    completedDate: '2024-02-28',
    estimatedHours: 120,
    actualHours: 115,
    progress: 100,
    tags: ['foundation', 'excavation', 'villa-a', 'priority'],
    dependencies: [],
    attachments: [
      '/uploads/tasks/foundation-plans-villa-a.pdf',
      '/uploads/tasks/soil-test-results.pdf',
      '/uploads/tasks/foundation-progress-1.jpg',
      '/uploads/tasks/foundation-progress-2.jpg'
    ],
    requiresApproval: true,
    approvalStatus: 'APPROVED',
    budget: 85000,
    actualCost: 82500,
    currency: 'LYD'
  },
  {
    id: 'task-002',
    siteId: 'site-lvillas-001',
    title: 'Structural Framework - Villa A',
    titleAr: 'الهيكل الإنشائي - فيلا أ',
    description: 'Install steel and concrete structural framework for Villa A including columns, beams, and floor slabs',
    descriptionAr: 'تركيب الهيكل الإنشائي من الحديد والخرسانة للفيلا أ بما في ذلك الأعمدة والكمرات والبلاطات',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    category: 'Construction',
    categoryAr: 'البناء',
    assignedTo: ['emp-002', 'emp-003'],
    createdBy: 'emp-001',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-25T14:20:00Z',
    dueDate: '2024-04-15',
    startDate: '2024-03-01',
    estimatedHours: 200,
    actualHours: 145,
    progress: 75,
    tags: ['structural', 'framework', 'villa-a', 'steel', 'concrete'],
    dependencies: ['task-001'],
    attachments: [
      '/uploads/tasks/structural-drawings-villa-a.pdf',
      '/uploads/tasks/steel-delivery-receipt.pdf',
      '/uploads/tasks/structural-progress-1.jpg',
      '/uploads/tasks/structural-progress-2.jpg',
      '/uploads/tasks/quality-inspection-report.pdf'
    ],
    requiresApproval: true,
    approvalStatus: 'PENDING',
    budget: 150000,
    actualCost: 112500,
    currency: 'LYD'
  },
  {
    id: 'task-003',
    siteId: 'site-lvillas-001',
    title: 'Electrical Installation - Phase 1',
    titleAr: 'التمديدات الكهربائية - المرحلة الأولى',
    description: 'Install electrical wiring, outlets, and main distribution panels for Villas A, B, and C',
    descriptionAr: 'تركيب الأسلاك الكهربائية والمقابس ولوحات التوزيع الرئيسية للفيلل أ، ب، ج',
    status: 'IN_PROGRESS', 
    priority: 'MEDIUM',
    category: 'Electrical',
    categoryAr: 'الكهرباء',
    assignedTo: ['emp-004'],
    createdBy: 'emp-001',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-28T16:45:00Z',
    dueDate: '2024-04-30',
    startDate: '2024-03-15',
    estimatedHours: 160,
    actualHours: 95,
    progress: 45,
    tags: ['electrical', 'wiring', 'phase-1', 'villas-abc'],
    dependencies: ['task-002'],
    attachments: [
      '/uploads/tasks/electrical-plans-phase1.pdf',
      '/uploads/tasks/electrical-materials-list.xlsx',
      '/uploads/tasks/electrical-progress-1.jpg'
    ],
    requiresApproval: false,
    budget: 95000,
    actualCost: 62500,
    currency: 'LYD'
  },
  {
    id: 'task-004',
    siteId: 'site-lvillas-001',
    title: 'Plumbing and Water Systems',
    titleAr: 'أعمال السباكة وأنظمة المياه',
    description: 'Install complete plumbing systems including water supply, drainage, and sewage connections for all villas',
    descriptionAr: 'تركيب أنظمة السباكة الكاملة بما في ذلك إمدادات المياه والصرف والاتصالات بالمجاري لجميع الفيلل',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    category: 'Plumbing',
    categoryAr: 'السباكة',
    assignedTo: ['emp-003'],
    createdBy: 'emp-001',
    createdAt: '2024-03-20T10:30:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
    dueDate: '2024-05-15',
    startDate: '2024-04-01',
    estimatedHours: 180,
    actualHours: 0,
    progress: 0,
    tags: ['plumbing', 'water-systems', 'all-villas', 'drainage'],
    dependencies: ['task-002'],
    attachments: [
      '/uploads/tasks/plumbing-specifications.pdf',
      '/uploads/tasks/water-system-design.dwg'
    ],
    requiresApproval: true,
    budget: 120000,
    actualCost: 0,
    currency: 'LYD'
  },
  {
    id: 'task-005',
    siteId: 'site-lvillas-001', 
    title: 'Landscaping and Gardens',
    titleAr: 'تنسيق الحدائق والمناظر الطبيعية',
    description: 'Design and implement landscaping for all villa gardens including irrigation systems, plantings, and hardscaping',
    descriptionAr: 'تصميم وتنفيذ تنسيق الحدائق لجميع الفيلل بما في ذلك أنظمة الري والزراعة والأعمال الصلبة',
    status: 'NOT_STARTED',
    priority: 'LOW',
    category: 'Landscaping',
    categoryAr: 'تنسيق الحدائق',
    assignedTo: ['emp-004'],
    createdBy: 'emp-001',
    createdAt: '2024-03-25T11:00:00Z',
    updatedAt: '2024-03-25T11:00:00Z',
    dueDate: '2024-08-30',
    startDate: '2024-07-01',
    estimatedHours: 240,
    actualHours: 0,
    progress: 0,
    tags: ['landscaping', 'gardens', 'irrigation', 'final-phase'],
    dependencies: ['task-001', 'task-002', 'task-004'],
    attachments: [
      '/uploads/tasks/landscape-design-concept.pdf',
      '/uploads/tasks/plant-specifications.xlsx'
    ],
    requiresApproval: true,
    budget: 180000,
    actualCost: 0,
    currency: 'LYD'
  },
  {
    id: 'task-006',
    siteId: 'site-lvillas-001',
    title: 'Interior Finishing - Villa B',
    titleAr: 'التشطيبات الداخلية - فيلا ب',
    description: 'Complete interior finishing work for Villa B including flooring, painting, fixtures, and final touches',
    descriptionAr: 'إكمال أعمال التشطيبات الداخلية للفيلا ب بما في ذلك الأرضيات والدهان والتركيبات واللمسات الأخيرة',
    status: 'ON_HOLD',
    priority: 'URGENT',
    category: 'Interior',
    categoryAr: 'التشطيبات الداخلية',
    assignedTo: ['emp-003', 'emp-004'],
    createdBy: 'emp-001',
    createdAt: '2024-03-15T09:30:00Z',
    updatedAt: '2024-03-30T13:15:00Z',
    dueDate: '2024-05-30',
    startDate: '2024-03-20',
    estimatedHours: 300,
    actualHours: 85,
    progress: 25,
    tags: ['interior', 'finishing', 'villa-b', 'urgent', 'on-hold'],
    dependencies: ['task-002', 'task-003'],
    attachments: [
      '/uploads/tasks/interior-design-villa-b.pdf',
      '/uploads/tasks/material-samples.jpg',
      '/uploads/tasks/progress-photos-interior.zip'
    ],
    requiresApproval: true,
    approvalStatus: 'PENDING',
    budget: 220000,
    actualCost: 67500,
    currency: 'LYD'
  }
]

// Demo task updates
export const DEMO_TASK_UPDATES: TaskUpdate[] = [
  {
    id: 'update-001',
    taskId: 'task-001',
    type: 'PROGRESS',
    content: 'Foundation work completed successfully. All concrete has cured properly and passed quality inspection.',
    contentAr: 'تم إنجاز أعمال الأساسات بنجاح. تمت معالجة جميع الخرسانة بشكل صحيح ونجحت في فحص الجودة.',
    author: 'Omar Mahmoud',
    authorAr: 'عمر محمود',
    timestamp: '2024-02-28T17:30:00Z',
    progressPercentage: 100,
    hoursWorked: 8,
    attachments: [
      '/uploads/tasks/foundation-completion-certificate.pdf',
      '/uploads/tasks/final-inspection-photos.zip'
    ],
    location: {
      lat: 32.8872,
      lng: 13.1913
    }
  },
  {
    id: 'update-002',
    taskId: 'task-002',
    type: 'PROGRESS',
    content: 'Structural framework is 75% complete. All ground floor columns and beams are installed. Starting first floor work next week.',
    contentAr: 'الهيكل الإنشائي مكتمل بنسبة 75%. تم تركيب جميع أعمدة وكمرات الطابق الأرضي. سنبدأ أعمال الطابق الأول الأسبوع القادم.',
    author: 'Fatima Al-Zahra',
    authorAr: 'فاطمة الزهراء',
    timestamp: '2024-03-25T14:20:00Z',
    progressPercentage: 75,
    hoursWorked: 12,
    attachments: [
      '/uploads/tasks/structural-progress-week12.jpg',
      '/uploads/tasks/beam-installation-report.pdf'
    ],
    location: {
      lat: 32.8872,
      lng: 13.1913
    }
  },
  {
    id: 'update-003',
    taskId: 'task-003',
    type: 'PROGRESS',
    content: 'Electrical rough-in work is progressing well. Villa A and B wiring is 80% complete. Waiting for inspection before proceeding to Villa C.',
    contentAr: 'أعمال التمديدات الكهربائية الأولية تسير بشكل جيد. تم إنجاز 80% من أسلاك الفيلا أ و ب. في انتظار التفتيش قبل الانتقال للفيلا ج.',
    author: 'Aisha Ibrahim',
    authorAr: 'عائشة إبراهيم',
    timestamp: '2024-03-28T16:45:00Z',
    progressPercentage: 45,
    hoursWorked: 10,
    attachments: [
      '/uploads/tasks/electrical-inspection-checklist.pdf',
      '/uploads/tasks/wiring-progress-photos.jpg'
    ],
    location: {
      lat: 32.8872,
      lng: 13.1913
    }
  },
  {
    id: 'update-004',
    taskId: 'task-006',
    type: 'ISSUE',
    content: 'Interior work has been temporarily halted due to material delivery delays. Marble flooring shipment is delayed by 2 weeks.',
    contentAr: 'تم إيقاف أعمال التشطيبات الداخلية مؤقتاً بسبب تأخير توصيل المواد. شحنة أرضيات الرخام متأخرة أسبوعين.',
    author: 'Ahmed Hassan',
    authorAr: 'أحمد حسن',
    timestamp: '2024-03-30T13:15:00Z',
    progressPercentage: 25,
    hoursWorked: 0,
    attachments: [
      '/uploads/tasks/material-delay-notice.pdf',
      '/uploads/tasks/supplier-communication.pdf'
    ],
    location: {
      lat: 32.8872,
      lng: 13.1913
    }
  }
]

// Demo task approvals
export const DEMO_TASK_APPROVALS: TaskApproval[] = [
  {
    id: 'approval-001',
    taskId: 'task-001',
    type: 'TASK_COMPLETION',
    title: 'Foundation Work Completion Approval',
    titleAr: 'موافقة إنجاز أعمال الأساسات',
    description: 'Requesting approval for completed foundation work for Villa A',
    descriptionAr: 'طلب موافقة على أعمال الأساسات المنجزة للفيلا أ',
    status: 'APPROVED',
    priority: 'HIGH',
    approverRole: 'Site Engineer',
    approverRoleAr: 'مهندس الموقع',
    requestedBy: 'Omar Mahmoud',
    requestedByAr: 'عمر محمود',
    requestedAt: '2024-02-28T16:00:00Z',
    reviewedBy: 'Fatima Al-Zahra',
    reviewedByAr: 'فاطمة الزهراء',
    reviewedAt: '2024-02-28T17:30:00Z',
    comments: 'Foundation work meets all quality standards and specifications. Approved for next phase.',
    commentsAr: 'أعمال الأساسات تلبي جميع معايير الجودة والمواصفات. موافق عليها للمرحلة التالية.',
    assignedTo: ['emp-002'],
    dueDate: '2024-03-01',
    attachments: [
      '/uploads/tasks/foundation-approval-certificate.pdf',
      '/uploads/tasks/quality-test-results.pdf'
    ]
  },
  {
    id: 'approval-002',
    taskId: 'task-002',
    type: 'QUALITY_CHECK',
    title: 'Structural Framework Quality Inspection',
    titleAr: 'فحص جودة الهيكل الإنشائي',
    description: 'Quality inspection required before proceeding to next construction phase',
    descriptionAr: 'فحص الجودة مطلوب قبل الانتقال إلى مرحلة البناء التالية',
    status: 'PENDING',
    priority: 'HIGH',
    approverRole: 'Quality Inspector',
    approverRoleAr: 'مفتش الجودة',
    requestedBy: 'Fatima Al-Zahra',
    requestedByAr: 'فاطمة الزهراء',
    requestedAt: '2024-03-25T15:00:00Z',
    assignedTo: ['emp-004'],
    dueDate: '2024-04-01',
    attachments: [
      '/uploads/tasks/structural-inspection-checklist.pdf'
    ]
  },
  {
    id: 'approval-003',
    taskId: 'task-006',
    type: 'BUDGET_APPROVAL',
    title: 'Additional Budget for Premium Materials',
    titleAr: 'موافقة ميزانية إضافية للمواد المتميزة',
    description: 'Requesting additional budget approval for premium interior materials due to client upgrade request',
    descriptionAr: 'طلب موافقة ميزانية إضافية للمواد الداخلية المتميزة بسبب طلب ترقية من العميل',
    status: 'PENDING',
    priority: 'URGENT',
    approverRole: 'Financial Manager',
    approverRoleAr: 'المدير المالي',
    requestedBy: 'Ahmed Hassan',
    requestedByAr: 'أحمد حسن',
    requestedAt: '2024-03-30T14:00:00Z',
    assignedTo: ['emp-005'],
    dueDate: '2024-04-05',
    attachments: [
      '/uploads/tasks/budget-revision-request.pdf',
      '/uploads/tasks/premium-materials-quote.pdf'
    ]
  }
]

// Demo invoice links
export const DEMO_INVOICE_LINKS: TaskInvoiceLink[] = [
  {
    id: 'link-001',
    taskId: 'task-001',
    invoiceId: 'INV-2024-001',
    amount: 82500,
    currency: 'LYD',
    linkType: 'EXPENSE',
    description: 'Foundation materials and labor costs for Villa A',
    descriptionAr: 'تكاليف مواد وعمالة الأساسات للفيلا أ',
    status: 'ACTIVE',
    createdAt: '2024-02-28T18:00:00Z',
    createdBy: 'Khalil Benali',
    createdByAr: 'خليل بن علي'
  },
  {
    id: 'link-002',
    taskId: 'task-002',
    invoiceId: 'INV-2024-002',
    amount: 112500,
    currency: 'LYD',
    linkType: 'EXPENSE',
    description: 'Structural steel and concrete materials for Villa A framework',
    descriptionAr: 'مواد الحديد الإنشائي والخرسانة لهيكل الفيلا أ',
    status: 'ACTIVE',
    createdAt: '2024-03-25T15:30:00Z',
    createdBy: 'Khalil Benali',
    createdByAr: 'خليل بن علي'
  },
  {
    id: 'link-003',
    taskId: 'task-003',
    invoiceId: 'INV-2024-003',
    amount: 62500,
    currency: 'LYD',
    linkType: 'EXPENSE',
    description: 'Electrical materials and installation costs for Phase 1',
    descriptionAr: 'تكاليف المواد الكهربائية والتركيب للمرحلة الأولى',
    status: 'ACTIVE',
    createdAt: '2024-03-28T17:00:00Z',
    createdBy: 'Khalil Benali',
    createdByAr: 'خليل بن علي'
  }
]

// Demo data service for initializing the system
export class DemoDataService {
  static initializeDemoData() {
    const timestamp = new Date().toISOString()
    
    // Store demo data in localStorage for persistence
    const demoData = {
      site: DEMO_SITE,
      employees: DEMO_EMPLOYEES,
      client: DEMO_CLIENT,
      tasks: DEMO_TASKS,
      taskUpdates: DEMO_TASK_UPDATES,
      taskApprovals: DEMO_TASK_APPROVALS,
      taskInvoiceLinks: DEMO_INVOICE_LINKS,
      initialized: true,
      timestamp
    }
    
    localStorage.setItem('demo_data_lvillas', JSON.stringify(demoData))
    
    console.log('✅ Demo data for The L Villas initialized successfully')
    return demoData
  }
  
  static getDemoData() {
    const stored = localStorage.getItem('demo_data_lvillas')
    if (stored) {
      return JSON.parse(stored)
    }
    return this.initializeDemoData()
  }
  
  static clearDemoData() {
    localStorage.removeItem('demo_data_lvillas')
    console.log('🗑️ Demo data cleared')
  }
  
  static isDemoDataInitialized(): boolean {
    const stored = localStorage.getItem('demo_data_lvillas')
    return stored !== null
  }
  
  // Get tasks with related data
  static getTasksWithRelatedData(siteId: string = 'site-lvillas-001') {
    const demoData = this.getDemoData()
    
    return demoData.tasks
      .filter((task: Task) => task.siteId === siteId)
      .map((task: Task) => ({
        ...task,
        updates: demoData.taskUpdates.filter((update: TaskUpdate) => update.taskId === task.id),
        approvals: demoData.taskApprovals.filter((approval: TaskApproval) => approval.taskId === task.id),
        invoiceLinks: demoData.taskInvoiceLinks.filter((link: TaskInvoiceLink) => link.taskId === task.id)
      }))
  }
  
  // Get site statistics
  static getSiteStatistics(siteId: string = 'site-lvillas-001') {
    const demoData = this.getDemoData()
    const siteTasks = demoData.tasks.filter((task: Task) => task.siteId === siteId)
    
    const stats = {
      totalTasks: siteTasks.length,
      completedTasks: siteTasks.filter((t: Task) => t.status === 'COMPLETED').length,
      inProgressTasks: siteTasks.filter((t: Task) => t.status === 'IN_PROGRESS').length,
      onHoldTasks: siteTasks.filter((t: Task) => t.status === 'ON_HOLD').length,
      notStartedTasks: siteTasks.filter((t: Task) => t.status === 'NOT_STARTED').length,
      overdueTasks: siteTasks.filter((t: Task) => 
        new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
      ).length,
      averageProgress: siteTasks.length > 0 
        ? Math.round(siteTasks.reduce((sum: number, task: Task) => sum + task.progress, 0) / siteTasks.length)
        : 0,
      totalBudget: siteTasks.reduce((sum: number, task: Task) => sum + (task.budget || 0), 0),
      totalSpent: siteTasks.reduce((sum: number, task: Task) => sum + (task.actualCost || 0), 0),
      totalEstimatedHours: siteTasks.reduce((sum: number, task: Task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: siteTasks.reduce((sum: number, task: Task) => sum + (task.actualHours || 0), 0),
      pendingApprovals: demoData.taskApprovals.filter((approval: TaskApproval) => 
        approval.status === 'PENDING' && 
        siteTasks.some((task: Task) => task.id === approval.taskId)
      ).length
    }
    
    return stats
  }
  
  // Generate additional sample data
  static addSampleTask(siteId: string, taskData: Partial<Task>): Task {
    const demoData = this.getDemoData()
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      siteId,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      category: 'General',
      categoryAr: 'عام',
      assignedTo: ['emp-001'],
      createdBy: 'emp-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      actualHours: 0,
      tags: [],
      dependencies: [],
      attachments: [],
      requiresApproval: false,
      currency: 'LYD',
      ...taskData,
      title: taskData.title || 'New Sample Task',
      titleAr: taskData.titleAr || 'مهمة عينة جديدة',
      description: taskData.description || 'Sample task description',
      descriptionAr: taskData.descriptionAr || 'وصف مهمة عينة',
      dueDate: taskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHours: taskData.estimatedHours || 40
    }
    
    demoData.tasks.push(newTask)
    localStorage.setItem('demo_data_lvillas', JSON.stringify(demoData))
    
    return newTask
  }
  
  // Export demo data for screenshots and presentations
  static exportDemoDataForPresentation() {
    const demoData = this.getDemoData()
    const stats = this.getSiteStatistics()
    
    return {
      siteName: 'The L Villas - فيلات الليبار',
      projectOverview: {
        totalBudget: `${stats.totalBudget.toLocaleString()} LYD`,
        totalSpent: `${stats.totalSpent.toLocaleString()} LYD`,
        overallProgress: `${stats.averageProgress}%`,
        tasksCompleted: `${stats.completedTasks}/${stats.totalTasks}`,
        timelineStatus: stats.overdueTasks > 0 ? 'Behind Schedule' : 'On Track'
      },
      recentActivity: demoData.taskUpdates
        .sort((a: TaskUpdate, b: TaskUpdate) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5),
      pendingApprovals: demoData.taskApprovals.filter((a: TaskApproval) => a.status === 'PENDING'),
      upcomingDeadlines: demoData.tasks
        .filter((t: Task) => t.status !== 'COMPLETED')
        .sort((a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3),
      stats,
      lastUpdated: timestamp
    }
  }
}

// Auto-initialize demo data on first load
if (typeof window !== 'undefined' && !DemoDataService.isDemoDataInitialized()) {
  DemoDataService.initializeDemoData()
}
