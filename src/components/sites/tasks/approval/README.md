# Task Approval Workflow System

A comprehensive approval workflow system for managing task approvals, role-based permissions, and notification tracking in the construction site management application.

## Components Overview

### 1. ApprovalWorkflow
The main approval workflow modal component that handles:
- **Request submission**: Form to create new approval requests
- **Pending approvals**: List of approvals waiting for review
- **Approval history**: Complete history of all approval requests
- **Role-based approval chains**: Sequential approval process based on approval type

#### Features:
- 5 different approval types (completion, scope-change, budget-change, deadline-extension, assignment-change)
- 4 urgency levels (low, medium, high, critical)
- Sequential approval chains with role-based routing
- Comments and reasoning for each approval request
- Real-time status tracking

### 2. ApprovalNotifications
Notification system for approval workflow events:
- **Real-time notifications**: Instant notifications for approval events
- **Role-based filtering**: Notifications filtered by user role and permissions
- **Action buttons**: Quick approve/reject actions directly from notifications
- **Notification settings**: Customizable notification preferences

#### Notification Types:
- `approval-request`: New approval request submitted
- `approval-approved`: Approval request has been approved
- `approval-rejected`: Approval request has been rejected
- `approval-reminder`: Reminder for pending approvals

### 3. ApprovalDashboard
Centralized dashboard for managing all approval workflows:
- **Statistics overview**: Key metrics and approval analytics
- **Advanced filtering**: Filter by status, urgency, type, and more
- **Bulk actions**: Quick approve/reject for multiple items
- **Analytics insights**: Approval rates, processing times, bottlenecks

#### Dashboard Features:
- Real-time approval statistics
- Overdue and critical approval tracking
- Personal approval queue management
- Historical approval analytics

## Workflow Types

### 1. Task Completion (`completion`)
**Approval Chain**: Site Manager → Project Manager (optional)
- Required when marking tasks as completed
- Ensures quality control and task verification

### 2. Scope Change (`scope-change`)
**Approval Chain**: Site Manager → Project Manager → Client Representative
- Required for any changes to task scope or requirements
- Multi-level approval for significant changes

### 3. Budget Change (`budget-change`)
**Approval Chain**: Site Manager → Project Manager → Finance Manager
- Required for budget modifications or cost overruns
- Financial oversight and budget control

### 4. Deadline Extension (`deadline-extension`)
**Approval Chain**: Site Manager → Project Manager
- Required for extending task deadlines
- Project timeline impact assessment

### 5. Assignment Change (`assignment-change`)
**Approval Chain**: Site Manager
- Required for changing task assignments
- Resource allocation oversight

## Data Structure

### TaskApproval Interface
```typescript
interface TaskApproval {
  id: string
  taskId: string
  siteId: string
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  type: 'completion' | 'scope-change' | 'budget-change' | 'deadline-extension' | 'assignment-change'
  title: string
  reason: string
  comments?: string
  approverComments?: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  approvalChain: ApprovalStep[]
  metadata?: ApprovalMetadata
  attachments: string[]
  createdAt: string
  updatedAt: string
}
```

### ApprovalNotification Interface
```typescript
interface ApprovalNotification {
  id: string
  approvalId: string
  recipientId: string
  recipientRole: string
  type: 'approval-request' | 'approval-approved' | 'approval-rejected' | 'approval-reminder'
  title: string
  message: string
  read: boolean
  actionRequired: boolean
  createdAt: string
  siteId: string
  taskId: string
  taskTitle: string
}
```

## Integration

### Usage in SiteTasks Component
```typescript
import { ApprovalWorkflow, ApprovalDashboard, NotificationBadge } from './approval'

// Add approval buttons to task cards
<button onClick={() => openApprovalWorkflow(task)}>
  📋 Request Approval
</button>

// Add dashboard access in header
<button onClick={() => setShowApprovalDashboard(true)}>
  📋 Approvals
  <NotificationBadge siteId={site.id} />
</button>
```

### Permission Requirements
- **View approvals**: Basic site access
- **Submit approval requests**: `canManage('tasks')` or `canEdit('tasks')`
- **Process approvals**: `canManage('approvals')`
- **Dashboard access**: `canView('approvals')`

## Data Storage

The system uses localStorage for demonstration purposes:
- **Approvals**: `task_approvals_{taskId}`
- **Notifications**: `approval_notifications_{siteId}`
- **Settings**: `notification_settings_{siteId}`

In production, this would be replaced with:
- REST API endpoints for approval CRUD operations
- WebSocket/SSE for real-time notifications
- Database storage for persistent approval data
- Email integration for notification delivery

## Features

### ✅ Implemented
- Role-based approval workflows
- Multi-step approval chains
- Real-time notifications
- Approval dashboard with analytics
- Quick approve/reject actions
- Urgency-based prioritization
- Comprehensive approval history
- Notification preferences
- Mobile-responsive design

### 🚧 Future Enhancements
- Email notification integration
- WebSocket real-time updates
- Approval templates and automation
- Advanced analytics and reporting
- Approval delegation
- Bulk approval operations
- Integration with external approval systems
- Audit trail and compliance features

## Usage Examples

### 1. Request Task Completion Approval
```typescript
// From task detail view or task card
<ApprovalWorkflow
  task={selectedTask}
  onClose={() => setShowApprovalWorkflow(false)}
  onApprovalSubmitted={(approval) => {
    // Handle approval submission
    console.log('Approval submitted:', approval)
  }}
/>
```

### 2. Display Approval Dashboard
```typescript
<ApprovalDashboard
  siteId={site.id}
  tasks={siteTasks}
  onApprovalAction={(approvalId, action) => {
    // Handle approval actions
    console.log('Approval action:', approvalId, action)
  }}
/>
```

### 3. Show Notification Badge
```typescript
<NotificationBadge 
  siteId={site.id}
  currentUserId="user-123"
  currentUserRole="site-manager"
/>
```

This approval workflow system provides a complete solution for managing task approvals with proper role-based access control, comprehensive notification tracking, and detailed analytics for process improvement.
