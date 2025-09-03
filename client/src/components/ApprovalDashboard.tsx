import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  DollarSign,
  User,
  Calendar,
  Building
} from 'lucide-react';
import { 
  approvalService, 
  ApprovalWorkflow, 
  ApprovalMetrics,
  ApprovalScope 
} from '../services/approvalService';

interface ApprovalDashboardProps {
  className?: string;
}

export const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({ 
  className = '' 
}) => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalWorkflow[]>([]);
  const [metrics, setMetrics] = useState<ApprovalMetrics | null>(null);
  const [scope, setScope] = useState<ApprovalScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [pendingData, metricsData, scopeData] = await Promise.all([
        approvalService.getPendingApprovals(),
        approvalService.getApprovalMetrics(),
        approvalService.getApprovalScope()
      ]);

      setPendingApprovals(pendingData);
      setMetrics(metricsData);
      setScope(scopeData);
    } catch (error) {
      console.error('Error loading approval dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (workflowId: string, action: 'APPROVE' | 'REJECT', remark?: string) => {
    try {
      setProcessingId(workflowId);
      await approvalService.processApproval(workflowId, action, remark);
      
      // Reload data after processing
      await loadDashboardData();
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (amount?: number): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  const formatEntityType = (entityType: string): string => {
    switch (entityType) {
      case 'expense': return 'Expense';
      case 'task': return 'Task';
      case 'safeTransaction': return 'Safe Transaction';
      case 'payrollRun': return 'Payroll Run';
      default: return entityType;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-6 space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Dashboard</h1>
          <p className="text-gray-600">
            {scope?.role} • {scope?.scopeOrgUnits?.length} organizational units
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.counts.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved This Period</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.counts.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected This Period</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.counts.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Pending Approvals ({pendingApprovals.length})
          </h2>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-1 text-sm text-gray-500">
              All approvals in your scope have been processed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingApprovals.map((workflow) => (
              <div key={workflow.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatEntityType(workflow.entityType)}
                      </span>
                      <span className={getStatusBadge(workflow.status)}>
                        {workflow.status}
                      </span>
                      {workflow.amount && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatAmount(workflow.amount)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {workflow.orgUnit.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Entity Details */}
                    {workflow.entity && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <h4 className="text-sm font-medium mb-2">Details:</h4>
                        {workflow.entityType === 'expense' && (
                          <div className="text-sm text-gray-600">
                            <p><strong>Item:</strong> {workflow.entity.itemName}</p>
                            <p><strong>Supplier:</strong> {workflow.entity.supplier}</p>
                            <p><strong>Category:</strong> {workflow.entity.category}</p>
                          </div>
                        )}
                        {workflow.entityType === 'task' && (
                          <div className="text-sm text-gray-600">
                            <p><strong>Task:</strong> {workflow.entity.name}</p>
                            <p><strong>Category:</strong> {workflow.entity.category}</p>
                            <p><strong>Site:</strong> {workflow.entity.site?.name}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approval Steps */}
                    <div className="flex items-center space-x-2">
                      {workflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${\n                            step.status === 'APPROVED' ? 'bg-green-100 text-green-800' :\n                            step.status === 'REJECTED' ? 'bg-red-100 text-red-800' :\n                            step.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :\n                            'bg-gray-100 text-gray-800'\n                          }`}>
                            {index + 1}
                          </div>
                          <span className="ml-2 text-xs text-gray-600">
                            {step.role}
                          </span>
                          {index < workflow.steps.length - 1 && (
                            <div className="ml-2 w-4 h-px bg-gray-300"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApproval(workflow.id, 'APPROVE')}
                      disabled={processingId === workflow.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processingId === workflow.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApproval(workflow.id, 'REJECT')}
                      disabled={processingId === workflow.id}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {metrics?.recentActivity && metrics.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {metrics.recentActivity.slice(0, 5).map((step) => (
              <div key={step.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${\n                      step.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'\n                    }`}>
                      {step.status === 'APPROVED' ? 
                        <CheckCircle className="w-5 h-5 text-green-600" /> :
                        <XCircle className="w-5 h-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatEntityType(step.workflow?.entityType || '')} {step.status.toLowerCase()}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>
                          {step.approver ? 
                            `${step.approver.firstName} ${step.approver.lastName}` : 
                            step.role
                          }
                        </span>
                        <Calendar className="w-3 h-3 ml-2" />
                        <span>
                          {step.approvedAt ? 
                            new Date(step.approvedAt).toLocaleDateString() : 
                            'Pending'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {step.workflow?.orgUnit && (
                    <div className="text-xs text-gray-500">
                      {step.workflow.orgUnit.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Scope Info */}
      {scope && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Approval Scope</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Role & Thresholds</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Role:</strong> {scope.role}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Approval Limit:</strong> {formatAmount(scope.approvalThresholds.max)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Organizational Units ({scope.scopeOrgUnits.length})
              </h3>
              <div className="max-h-24 overflow-y-auto">
                {scope.scopeOrgUnits.map(unit => (
                  <div key={unit.id} className="text-sm text-gray-600 py-1">
                    <span className="font-medium">{unit.type}:</span> {unit.name}
                    {unit.code && <span className="text-gray-400"> ({unit.code})</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
