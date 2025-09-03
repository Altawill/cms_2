import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  ArrowRight,
  AlertTriangle,
  Pause,
  RotateCcw
} from 'lucide-react';

export interface ApprovalStep {
  id: string;
  title: string;
  approver: {
    name: string;
    role: string;
    avatar?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  completedAt?: string;
  comments?: string;
  order: number;
}

interface ApprovalStatusIndicatorProps {
  currentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'PAUSED';
  steps: ApprovalStep[];
  currentStepIndex?: number;
  compact?: boolean;
  showComments?: boolean;
}

export const ApprovalStatusIndicator: React.FC<ApprovalStatusIndicatorProps> = ({
  currentStatus,
  steps,
  currentStepIndex = 0,
  compact = false,
  showComments = false
}) => {
  const getStatusIcon = (status: string, isActive: boolean = false) => {
    const baseClasses = compact ? 'h-4 w-4' : 'h-5 w-5';
    
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className={`${baseClasses} text-green-600`} />;
      case 'REJECTED':
        return <XCircle className={`${baseClasses} text-red-600`} />;
      case 'PENDING':
        return (
          <Clock 
            className={`${baseClasses} ${
              isActive ? 'text-blue-600 animate-pulse' : 'text-gray-400'
            }`} 
          />
        );
      case 'SKIPPED':
        return <ArrowRight className={`${baseClasses} text-gray-400`} />;
      case 'PAUSED':
        return <Pause className={`${baseClasses} text-yellow-600`} />;
      case 'WITHDRAWN':
        return <RotateCcw className={`${baseClasses} text-gray-600`} />;
      default:
        return <AlertCircle className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean = false) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 border-red-200';
      case 'PENDING':
        return isActive ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-200';
      case 'SKIPPED':
        return 'bg-gray-50 border-gray-200';
      case 'PAUSED':
        return 'bg-yellow-100 border-yellow-200';
      case 'WITHDRAWN':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'In Progress',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: <Clock className="h-4 w-4" />
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <XCircle className="h-4 w-4" />
        };
      case 'WITHDRAWN':
        return {
          label: 'Withdrawn',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <RotateCcw className="h-4 w-4" />
        };
      case 'PAUSED':
        return {
          label: 'Paused',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: <Pause className="h-4 w-4" />
        };
      default:
        return {
          label: status,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <AlertCircle className="h-4 w-4" />
        };
    }
  };

  const overallStatus = getOverallStatusConfig(currentStatus);
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const completedSteps = sortedSteps.filter(step => step.status === 'APPROVED').length;
  const progressPercentage = (completedSteps / sortedSteps.length) * 100;

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-2">
        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${overallStatus.color}`}>
          {overallStatus.icon}
          <span>{overallStatus.label}</span>
        </span>
        <span className="text-xs text-gray-500">
          {completedSteps} / {sortedSteps.length} steps
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Approval Workflow</h3>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full border ${overallStatus.color}`}>
              {overallStatus.icon}
              <span>{overallStatus.label}</span>
            </span>
            <span className="text-sm text-gray-500">
              {completedSteps} of {sortedSteps.length} steps completed
            </span>
          </div>
        </div>
        
        {/* Progress Circle */}
        <div className="relative">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            <path
              d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray={`${progressPercentage}, 100`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {sortedSteps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = step.status === 'APPROVED';
          const isFailed = step.status === 'REJECTED';
          const isPending = step.status === 'PENDING';
          const isSkipped = step.status === 'SKIPPED';

          return (
            <div key={step.id} className="flex items-start space-x-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center
                  ${getStatusColor(step.status, isActive)}
                  ${isActive && !isCompleted ? 'ring-2 ring-blue-200 ring-offset-2' : ''}
                `}>
                  {getStatusIcon(step.status, isActive)}
                </div>
                
                {/* Connection line */}
                {index < sortedSteps.length - 1 && (
                  <div className={`w-px h-8 mt-2 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${
                    isCompleted ? 'text-green-900' : 
                    isFailed ? 'text-red-900' : 
                    isActive ? 'text-blue-900' : 
                    'text-gray-900'
                  }`}>
                    {step.title}
                  </h4>
                  
                  {step.completedAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(step.completedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Approver info */}
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {step.approver.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      • {step.approver.role}
                    </span>
                  </div>
                </div>

                {/* Status specific info */}
                {isPending && isActive && (
                  <p className="text-sm text-blue-600 font-medium">
                    Waiting for approval...
                  </p>
                )}
                
                {isCompleted && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Approved
                  </p>
                )}
                
                {isFailed && (
                  <p className="text-sm text-red-600 font-medium">
                    ✗ Rejected
                  </p>
                )}
                
                {isSkipped && (
                  <p className="text-sm text-gray-500">
                    → Skipped
                  </p>
                )}

                {/* Comments */}
                {showComments && step.comments && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{step.comments}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next step indicator */}
      {currentStatus === 'PENDING' && currentStepIndex < sortedSteps.length - 1 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">
              Next: Waiting for {sortedSteps[currentStepIndex]?.approver.name} ({sortedSteps[currentStepIndex]?.approver.role})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
