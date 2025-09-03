import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  MessageSquare,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export interface ApprovalItem {
  id: string;
  type: 'EXPENSE' | 'TASK' | 'PURCHASE_ORDER' | 'DOCUMENT';
  title: string;
  description: string;
  amount?: number;
  submittedBy: {
    name: string;
    department: string;
    avatar?: string;
  };
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  currentStep: number;
  totalSteps: number;
  nextApprover: string;
  comments?: number;
  dueDate?: string;
}

interface ApprovalCardProps {
  approval: ApprovalItem;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  onComment?: (id: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onApprove,
  onReject,
  onView,
  onComment,
  isLoading = false,
  compact = false
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: <Clock className="h-3 w-3" />,
          label: 'Pending'
        };
      case 'APPROVED':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Approved'
        };
      case 'REJECTED':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <XCircle className="h-3 w-3" />,
          label: 'Rejected'
        };
      case 'WITHDRAWN':
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Withdrawn'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <AlertCircle className="h-3 w-3" />,
          label: status
        };
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'Urgent'
        };
      case 'HIGH':
        return {
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'High'
        };
      case 'MEDIUM':
        return {
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: <Clock className="h-3 w-3" />,
          label: 'Medium'
        };
      case 'LOW':
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <Clock className="h-3 w-3" />,
          label: 'Low'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <Clock className="h-3 w-3" />,
          label: urgency
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXPENSE':
        return <DollarSign className="h-5 w-5" />;
      case 'TASK':
        return <CheckCircle className="h-5 w-5" />;
      case 'PURCHASE_ORDER':
        return <FileText className="h-5 w-5" />;
      case 'DOCUMENT':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const statusConfig = getStatusConfig(approval.status);
  const urgencyConfig = getUrgencyConfig(approval.urgency);

  const isOverdue = approval.dueDate && new Date(approval.dueDate) < new Date();
  const progressPercentage = (approval.currentStep / approval.totalSteps) * 100;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
      isOverdue ? 'border-l-4 border-l-red-500' : ''
    } ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Type Icon */}
          <div className="flex-shrink-0">
            <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-100 rounded-lg flex items-center justify-center text-blue-600`}>
              {getTypeIcon(approval.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`}>
                {approval.title}
              </h3>
              {isOverdue && (
                <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Overdue</span>
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center space-x-2 mb-3">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${urgencyConfig.color}`}>
                {urgencyConfig.icon}
                <span>{urgencyConfig.label}</span>
              </span>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </span>
              <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                {approval.type.replace('_', ' ')}
              </span>
            </div>

            {!compact && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{approval.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 mb-4 text-sm text-gray-500`}>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{approval.submittedBy.name}</p>
            <p className="text-xs truncate">{approval.submittedBy.department}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">
              {new Date(approval.submittedAt).toLocaleDateString()}
            </p>
            <p className="text-xs">Submitted</p>
          </div>
        </div>

        {approval.amount && (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">${approval.amount.toLocaleString()}</p>
              <p className="text-xs">Amount</p>
            </div>
          </div>
        )}

        {approval.dueDate && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(approval.dueDate).toLocaleDateString()}
              </p>
              <p className="text-xs">Due Date</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!compact && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Progress</span>
            <span className="text-gray-600">
              Step {approval.currentStep} of {approval.totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Next: {approval.nextApprover}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {onView && (
            <button
              onClick={() => onView(approval.id)}
              className="inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>View</span>
            </button>
          )}
          
          {onComment && approval.comments !== undefined && (
            <button
              onClick={() => onComment(approval.id)}
              className="inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{approval.comments || 'Comment'}</span>
            </button>
          )}
        </div>

        {approval.status === 'PENDING' && (onApprove || onReject) && (
          <div className="flex items-center space-x-2">
            {onReject && (
              <button
                onClick={() => onReject(approval.id)}
                disabled={isLoading}
                className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            )}
            
            {onApprove && (
              <button
                onClick={() => onApprove(approval.id)}
                disabled={isLoading}
                className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </button>
            )}
          </div>
        )}

        {approval.status !== 'PENDING' && (
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <ArrowRight className="h-4 w-4" />
            <span>
              {approval.status === 'APPROVED' ? 'Approved' : 
               approval.status === 'REJECTED' ? 'Rejected' : 
               'Withdrawn'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
