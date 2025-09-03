import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';

export interface ApprovalMetric {
  id: string;
  title: string;
  value: number | string;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  description?: string;
}

interface ApprovalMetricsProps {
  metrics?: ApprovalMetric[];
  layout?: 'grid' | 'horizontal';
  showTrends?: boolean;
  compact?: boolean;
  className?: string;
}

const defaultMetrics: ApprovalMetric[] = [
  {
    id: 'pending',
    title: 'Pending Approvals',
    value: 12,
    change: { value: 15, type: 'increase', period: 'vs last week' },
    icon: <Clock className="h-5 w-5" />,
    color: 'yellow',
    description: 'Waiting for approval'
  },
  {
    id: 'approved_today',
    title: 'Approved Today',
    value: 8,
    change: { value: 25, type: 'increase', period: 'vs yesterday' },
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'green',
    description: 'Completed today'
  },
  {
    id: 'avg_time',
    title: 'Avg. Approval Time',
    value: '2.3 days',
    change: { value: 10, type: 'decrease', period: 'vs last month' },
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'blue',
    description: 'Time to complete'
  },
  {
    id: 'success_rate',
    title: 'Approval Rate',
    value: '94%',
    change: { value: 2, type: 'increase', period: 'this month' },
    format: 'percentage',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'green',
    description: 'Success rate'
  }
];

export const ApprovalMetrics: React.FC<ApprovalMetricsProps> = ({
  metrics = defaultMetrics,
  layout = 'grid',
  showTrends = true,
  compact = false,
  className = ''
}) => {
  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'duration':
        return `${value} days`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          ring: 'ring-blue-500/10'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          ring: 'ring-green-500/10'
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          ring: 'ring-red-500/10'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          ring: 'ring-yellow-500/10'
        };
      case 'gray':
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          ring: 'ring-gray-500/10'
        };
    }
  };

  const getTrendIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />;
      case 'neutral':
      default:
        return null;
    }
  };

  const getTrendColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-gray-500';
    }
  };

  if (layout === 'horizontal') {
    return (
      <div className={`flex space-x-6 overflow-x-auto ${className}`}>
        {metrics.map((metric) => {
          const colors = getColorClasses(metric.color || 'gray');
          
          return (
            <div
              key={metric.id}
              className={`flex items-center space-x-3 ${
                compact ? 'py-2 px-3' : 'py-4 px-6'
              } bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow whitespace-nowrap`}
            >
              {/* Icon */}
              <div className={`
                ${compact ? 'w-8 h-8' : 'w-10 h-10'} 
                ${colors.bg} ${colors.ring} 
                rounded-lg flex items-center justify-center ring-1 ring-inset
              `}>
                <div className={colors.text}>
                  {metric.icon}
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center space-x-2">
                  <p className={`${
                    compact ? 'text-xl' : 'text-2xl'
                  } font-bold text-gray-900`}>
                    {formatValue(metric.value, metric.format)}
                  </p>
                  {showTrends && metric.change && (
                    <div className={`
                      flex items-center space-x-1 text-xs font-medium
                      ${getTrendColor(metric.change.type)}
                    `}>
                      {getTrendIcon(metric.change.type)}
                      <span>{metric.change.value}%</span>
                    </div>
                  )}
                </div>
                <p className={`${
                  compact ? 'text-xs' : 'text-sm'
                } text-gray-600 font-medium`}>
                  {metric.title}
                </p>
                {showTrends && metric.change && (
                  <p className="text-xs text-gray-500">
                    {metric.change.period}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`
      grid gap-${compact ? '3' : '6'} 
      ${metrics.length === 1 ? 'grid-cols-1' :
        metrics.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        metrics.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
      }
      ${className}
    `}>
      {metrics.map((metric) => {
        const colors = getColorClasses(metric.color || 'gray');
        
        return (
          <div
            key={metric.id}
            className={`
              bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md 
              transition-all duration-200 ${compact ? 'p-4' : 'p-6'}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`${
                  compact ? 'text-xs' : 'text-sm'
                } font-medium text-gray-600 uppercase tracking-wide`}>
                  {metric.title}
                </p>
                <p className={`${
                  compact ? 'text-xl' : 'text-3xl'
                } font-bold text-gray-900 mt-1`}>
                  {formatValue(metric.value, metric.format)}
                </p>
              </div>
              
              {/* Icon */}
              <div className={`
                ${compact ? 'w-8 h-8' : 'w-12 h-12'} 
                ${colors.bg} ${colors.ring} 
                rounded-lg flex items-center justify-center ring-1 ring-inset
              `}>
                <div className={colors.text}>
                  {metric.icon}
                </div>
              </div>
            </div>

            {/* Description */}
            {metric.description && (
              <p className={`${
                compact ? 'text-xs' : 'text-sm'
              } text-gray-500 mt-2`}>
                {metric.description}
              </p>
            )}

            {/* Trend */}
            {showTrends && metric.change && (
              <div className={`
                flex items-center space-x-2 mt-${compact ? '2' : '4'} 
                ${compact ? 'text-xs' : 'text-sm'}
              `}>
                <div className={`
                  flex items-center space-x-1 font-medium
                  ${getTrendColor(metric.change.type)}
                `}>
                  {getTrendIcon(metric.change.type)}
                  <span>
                    {metric.change.type === 'increase' ? '+' : 
                     metric.change.type === 'decrease' ? '-' : ''}
                    {metric.change.value}%
                  </span>
                </div>
                <span className="text-gray-500">
                  {metric.change.period}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Pre-built metric configurations
export const approvalMetricConfigs = {
  pendingApprovals: (count: number, change?: number): ApprovalMetric => ({
    id: 'pending',
    title: 'Pending Approvals',
    value: count,
    change: change ? { value: Math.abs(change), type: change > 0 ? 'increase' : 'decrease', period: 'vs last week' } : undefined,
    icon: <Clock className="h-5 w-5" />,
    color: 'yellow'
  }),

  approvedToday: (count: number, change?: number): ApprovalMetric => ({
    id: 'approved_today',
    title: 'Approved Today',
    value: count,
    change: change ? { value: Math.abs(change), type: change > 0 ? 'increase' : 'decrease', period: 'vs yesterday' } : undefined,
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'green'
  }),

  rejectedCount: (count: number): ApprovalMetric => ({
    id: 'rejected',
    title: 'Rejected',
    value: count,
    icon: <XCircle className="h-5 w-5" />,
    color: 'red'
  }),

  avgApprovalTime: (days: number): ApprovalMetric => ({
    id: 'avg_time',
    title: 'Avg. Approval Time',
    value: `${days} days`,
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'blue'
  }),

  approvalRate: (percentage: number): ApprovalMetric => ({
    id: 'rate',
    title: 'Approval Rate',
    value: `${percentage}%`,
    format: 'percentage',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'green'
  }),

  totalValue: (amount: number): ApprovalMetric => ({
    id: 'total_value',
    title: 'Total Value',
    value: amount,
    format: 'currency',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'blue'
  }),

  overdueCount: (count: number): ApprovalMetric => ({
    id: 'overdue',
    title: 'Overdue Items',
    value: count,
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'red'
  })
};
