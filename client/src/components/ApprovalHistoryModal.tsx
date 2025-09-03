import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { approvalService, ApprovalWorkflow } from '../services/approvalService';

interface ApprovalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  entityName?: string;
}

export const ApprovalHistoryModal: React.FC<ApprovalHistoryModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName
}) => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && entityType && entityId) {
      loadApprovalHistory();
    }
  }, [isOpen, entityType, entityId]);

  const loadApprovalHistory = async () => {
    try {
      setLoading(true);
      const history = await approvalService.getApprovalHistory(entityType, entityId);
      setWorkflows(history);
    } catch (error) {
      console.error('Error loading approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEntityType = (type: string): string => {
    switch (type) {
      case 'expense': return 'Expense';
      case 'task': return 'Task';
      case 'safeTransaction': return 'Safe Transaction';
      case 'payrollRun': return 'Payroll Run';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
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
      case 'SKIPPED':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Approval History
            </h2>
            <p className="text-sm text-gray-600">
              {formatEntityType(entityType)} {entityName && `• ${entityName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900">No approval history</h3>
              <p className="mt-1 text-sm text-gray-500">
                This {formatEntityType(entityType).toLowerCase()} has no approval history yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Workflow Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(workflow.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Workflow #{workflow.id.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(workflow.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={getStatusBadge(workflow.status)}>
                      {workflow.status}
                    </span>
                  </div>

                  {/* Workflow Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Organization:</span>
                      <span className="ml-1 font-medium">{workflow.orgUnit.name}</span>
                    </div>
                    {workflow.amount && (
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-1 font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'LYD'
                          }).format(workflow.amount)}
                        </span>
                      </div>
                    )}
                    {workflow.completedAt && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-1 font-medium">
                          {new Date(workflow.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Approval Steps */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Approval Steps</h4>
                    {workflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-3 pl-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            step.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            step.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            step.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {step.role}
                              </p>
                              {step.approver && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                  <User className="w-3 h-3" />
                                  <span>
                                    {step.approver.firstName} {step.approver.lastName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={getStatusBadge(step.status)}>
                                {step.status}
                              </span>
                              {step.approvedAt && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(step.approvedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {step.remark && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              <strong>Remark:</strong> {step.remark}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalHistoryModal;
