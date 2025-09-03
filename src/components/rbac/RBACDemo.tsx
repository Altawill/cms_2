import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  useRBAC, 
  usePermissions, 
  useOrganizationalPermissions, 
  useApprovalPermissions,
  ProtectedComponent 
} from '../../contexts/RBACContext';

export const RBACDemo: React.FC = () => {
  const rbac = useRBAC();
  const permissions = usePermissions();
  const orgPermissions = useOrganizationalPermissions();
  const approvalPermissions = useApprovalPermissions();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', { 
      style: 'currency', 
      currency: 'LYD' 
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">RBAC System Demo</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive Role-Based Access Control with Organizational Hierarchy
        </p>
      </div>

      {/* Current User Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current User Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">User</p>
            <p className="font-medium">{rbac.currentUser?.firstName} {rbac.currentUser?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Legacy Role</p>
            <Badge variant="outline">{rbac.hasRole('admin') ? 'ADMIN' : rbac.hasRole('manager') ? 'MANAGER' : 'USER'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Organizational Role</p>
            <Badge variant="default">{orgPermissions.scope.role || 'N/A'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Hierarchy Level</p>
            <Badge variant="secondary">Level {orgPermissions.scope.hierarchyLevel}</Badge>
          </div>
        </div>
      </Card>

      {/* Basic Permissions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Resource Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { resource: 'dashboard', label: 'Dashboard' },
            { resource: 'employees', label: 'Employees' },
            { resource: 'sites', label: 'Sites' },
            { resource: 'expenses', label: 'Expenses' },
            { resource: 'reports', label: 'Reports' }
          ].map(({ resource, label }) => (
            <div key={resource} className="text-center">
              <p className="text-sm font-medium mb-2">{label}</p>
              <div className="space-y-1">
                {['read', 'create', 'update', 'delete'].map(action => (
                  <div key={action} className="flex justify-between items-center text-xs">
                    <span className="capitalize">{action}:</span>
                    <Badge 
                      variant={permissions.can(resource as any, action as any) ? "default" : "secondary"}
                      className="ml-1"
                    >
                      {permissions.can(resource as any, action as any) ? '✓' : '✗'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Organizational Permissions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Organizational Scope & Permissions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Accessible Organizational Units</h3>
            <div className="flex flex-wrap gap-2">
              {orgPermissions.scope.orgUnits.map(unit => (
                <Badge key={unit} variant="outline">{unit}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Management Capabilities</h3>
            <div className="space-y-2">
              {[
                { key: 'users', label: 'Manage Users', can: orgPermissions.canManage.users() },
                { key: 'subordinates', label: 'Manage Subordinates', can: orgPermissions.canManage.subordinates() },
                { key: 'budget', label: 'Manage Budget', can: orgPermissions.canManage.budget() },
                { key: 'reports', label: 'Manage Reports', can: orgPermissions.canManage.reports() }
              ].map(({ key, label, can }) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{label}</span>
                  <Badge variant={can ? "default" : "secondary"}>
                    {can ? '✓' : '✗'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Permissions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Approval Workflow Permissions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Financial Approval Thresholds</h3>
            <div className="space-y-2">
              {[
                { type: 'expense', label: 'Expenses', threshold: approvalPermissions.thresholds.expense },
                { type: 'budget', label: 'Budget', threshold: approvalPermissions.thresholds.budget },
                { type: 'equipment', label: 'Equipment', threshold: approvalPermissions.thresholds.equipment },
                { type: 'payroll', label: 'Payroll', threshold: approvalPermissions.thresholds.payroll }
              ].map(({ type, label, threshold }) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{label}</span>
                  <Badge variant="outline">
                    {threshold === Number.MAX_SAFE_INTEGER ? 'Unlimited' : formatCurrency(threshold)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Approval Capabilities</h3>
            <div className="space-y-2">
              {[
                { label: 'Can Initiate Approvals', can: approvalPermissions.canInitiateApproval() },
                { label: 'Can View All Approvals', can: approvalPermissions.canViewApprovals() },
                { label: 'Can Escalate Approvals', can: approvalPermissions.canEscalate() }
              ].map(({ label, can }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm">{label}</span>
                  <Badge variant={can ? "default" : "secondary"}>
                    {can ? '✓' : '✗'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Amount Tests */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Approval Amount Testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { amount: 2500, type: 'expense' as const, label: '2,500 LYD Expense' },
            { amount: 15000, type: 'equipment' as const, label: '15,000 LYD Equipment' },
            { amount: 50000, type: 'budget' as const, label: '50,000 LYD Budget' },
            { amount: 100000, type: 'expense' as const, label: '100,000 LYD Expense' },
            { amount: 25000, type: 'payroll' as const, label: '25,000 LYD Payroll' },
            { amount: 500000, type: 'budget' as const, label: '500,000 LYD Budget' }
          ].map(({ amount, type, label }) => {
            const canApprove = orgPermissions.canApprove[type](amount);
            const shouldEscalate = approvalPermissions.shouldEscalate(amount, type);
            const requiredLevel = approvalPermissions.getRequiredApprovalLevel(amount, type);

            return (
              <div key={`${amount}-${type}`} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{label}</span>
                  <Badge variant={canApprove ? "default" : "destructive"}>
                    {canApprove ? 'Can Approve' : 'Cannot Approve'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Required Level: <Badge variant="outline" className="ml-1">{requiredLevel}</Badge></p>
                  {shouldEscalate && (
                    <p className="text-orange-600">⚠ Requires Escalation</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Protected Components Demo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Protected Components Demo</h2>
        <div className="space-y-4">
          
          <ProtectedComponent 
            resource="users" 
            action="create"
            fallback={
              <Alert>
                <AlertDescription>
                  You don't have permission to create users.
                </AlertDescription>
              </Alert>
            }
          >
            <Alert>
              <AlertDescription>
                ✅ You have permission to create users! This content is only visible to authorized users.
              </AlertDescription>
            </Alert>
            <Button className="mt-2">Create New User</Button>
          </ProtectedComponent>

          <ProtectedComponent 
            roles={['PMO', 'AREA_MANAGER']}
            fallback={
              <Alert>
                <AlertDescription>
                  You need PMO or Area Manager role to see this content.
                </AlertDescription>
              </Alert>
            }
          >
            <Alert>
              <AlertDescription>
                ✅ You have PMO or Area Manager role! This is sensitive management information.
              </AlertDescription>
            </Alert>
            <Button className="mt-2" variant="outline">Access Management Dashboard</Button>
          </ProtectedComponent>

          <ProtectedComponent 
            resource="expenses" 
            action="approve"
            fallback={
              <Alert>
                <AlertDescription>
                  You don't have permission to approve expenses.
                </AlertDescription>
              </Alert>
            }
          >
            <Alert>
              <AlertDescription>
                ✅ You can approve expenses within your threshold limits.
              </AlertDescription>
            </Alert>
            <Button className="mt-2" variant="secondary">Approve Expenses</Button>
          </ProtectedComponent>

        </div>
      </Card>

      {/* Dashboard Module Access */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Module Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(rbac.getDashboardAccess()).map(([module, hasAccess]) => (
            <div key={module} className="text-center">
              <p className="text-sm font-medium mb-1 capitalize">
                {module.replace('_', ' ')}
              </p>
              <Badge variant={hasAccess ? "default" : "secondary"}>
                {hasAccess ? '✓' : '✗'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default RBACDemo;
