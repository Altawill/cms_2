import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ApprovalCard, ApprovalItem } from '../components/approvals/ApprovalCard';
import { ApprovalMetrics, approvalMetricConfigs } from '../components/approvals/ApprovalMetrics';

interface Approval {
  id: string;
  type: 'EXPENSE' | 'TASK' | 'PURCHASE_ORDER' | 'DOCUMENT';
  title: string;
  description: string;
  amount?: number;
  submittedBy: {
    name: string;
    department: string;
  };
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  currentStep: number;
  totalSteps: number;
  nextApprover: string;
}

const mockApprovals: Approval[] = [
  {
    id: '1',
    type: 'EXPENSE',
    title: 'Equipment Purchase Request',
    description: 'New safety equipment for construction site',
    amount: 2500,
    submittedBy: { name: 'John Smith', department: 'Construction' },
    submittedAt: '2024-01-15T10:30:00Z',
    status: 'PENDING',
    urgency: 'HIGH',
    currentStep: 2,
    totalSteps: 3,
    nextApprover: 'Project Manager'
  },
  {
    id: '2',
    type: 'TASK',
    title: 'Additional Work Authorization',
    description: 'Extension of construction timeline due to weather conditions',
    submittedBy: { name: 'Sarah Johnson', department: 'Project Management' },
    submittedAt: '2024-01-14T14:20:00Z',
    status: 'PENDING',
    urgency: 'URGENT',
    currentStep: 1,
    totalSteps: 2,
    nextApprover: 'Area Manager'
  },
  {
    id: '3',
    type: 'PURCHASE_ORDER',
    title: 'Material Supply Contract',
    description: 'Concrete supply for Q2 projects',
    amount: 45000,
    submittedBy: { name: 'Mike Wilson', department: 'Procurement' },
    submittedAt: '2024-01-13T09:15:00Z',
    status: 'APPROVED',
    urgency: 'MEDIUM',
    currentStep: 3,
    totalSteps: 3,
    nextApprover: 'Completed'
  }
];

const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>(mockApprovals);
  const [filteredApprovals, setFilteredApprovals] = useState<Approval[]>(mockApprovals);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter approvals based on selected filters
  useEffect(() => {
    let filtered = approvals;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(approval => approval.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(approval => approval.type === typeFilter);
    }

    if (urgencyFilter !== 'ALL') {
      filtered = filtered.filter(approval => approval.urgency === urgencyFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(approval => 
        approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        approval.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        approval.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApprovals(filtered);
  }, [approvals, statusFilter, typeFilter, urgencyFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'APPROVED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'WITHDRAWN':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOW':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const handleApprovalAction = async (approvalId: string, action: 'APPROVE' | 'REJECT') => {
    setIsLoading(true);
    // TODO: Implement API call
    setTimeout(() => {
      setApprovals(prev => prev.map(approval => 
        approval.id === approvalId 
          ? { ...approval, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
          : approval
      ));
      setIsLoading(false);
    }, 1000);
  };

  const refreshApprovals = async () => {
    setIsLoading(true);
    // TODO: Implement API call to refresh data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter(a => a.status === 'REJECTED').length;

  // Create metrics for the dashboard
  const metrics = [
    approvalMetricConfigs.pendingApprovals(pendingCount, 15),
    approvalMetricConfigs.approvedToday(approvedCount, 25),
    approvalMetricConfigs.rejectedCount(rejectedCount),
    {
      id: 'total',
      title: 'Total Items',
      value: approvals.length,
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'gray' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage and track approval workflows</p>
        </div>
        <button
          onClick={refreshApprovals}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <ApprovalMetrics 
        metrics={metrics}
        showTrends={true}
        className="mb-6"
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="EXPENSE">Expenses</option>
            <option value="TASK">Tasks</option>
            <option value="PURCHASE_ORDER">Purchase Orders</option>
            <option value="DOCUMENT">Documents</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Urgency</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          filteredApprovals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {getTypeIcon(approval.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {approval.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(approval.urgency)}`}>
                        {approval.urgency}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{approval.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{approval.submittedBy.name} • {approval.submittedBy.department}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(approval.submittedAt).toLocaleDateString()}</span>
                      </div>
                      {approval.amount && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${approval.amount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-600">
                          Step {approval.currentStep} of {approval.totalSteps}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(approval.currentStep / approval.totalSteps) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>Next: {approval.nextApprover}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 ml-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>

                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {approval.status === 'PENDING' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApprovalAction(approval.id, 'REJECT')}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprovalAction(approval.id, 'APPROVE')}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Approvals;
