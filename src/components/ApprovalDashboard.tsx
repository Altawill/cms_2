import React, { useState, useEffect } from 'react'
import { useRBAC } from '../contexts/RBACContext'
import { useOrgScope } from '../contexts/OrgScopeContext'
import { useScopedQueryParams } from '../hooks/useOrgScoped'
import { 
  approvalWorkflow,
  type ApprovalRequest,
  type ApprovalType,
  type ApprovalStatus,
  APPROVAL_THRESHOLDS
} from '../services/approvalWorkflow'

export function ApprovalDashboard() {
  const { currentUser, hasPermission } = useRBAC()
  const { orgUnits } = useOrgScope()
  const scopedParams = useScopedQueryParams()
  
  const [activeTab, setActiveTab] = useState('pending')
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [filterType, setFilterType] = useState<ApprovalType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statistics, setStatistics] = useState<any>(null)

  // Load approval requests and statistics
  useEffect(() => {
    loadApprovalData()
    const interval = setInterval(loadApprovalData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [currentUser, scopedParams.currentOrgUnit])

  const loadApprovalData = () => {
    if (!currentUser) return

    // Initialize users for the approval workflow service
    const sampleUsers = [
      currentUser,
      // Add other sample users as needed
      {
        id: 'user2',
        name: 'Area Manager',
        email: 'area@example.com',
        role: 'AREA_MANAGER' as const,
        orgUnitId: 'area-west',
        permissions: [],
        createdAt: new Date().toISOString()
      }
    ]
    approvalWorkflow.setUsers(sampleUsers)

    // Load requests
    const filters: any = {}
    if (scopedParams.currentOrgUnit) {
      filters.orgUnitId = scopedParams.currentOrgUnit
    }
    if (filterType !== 'all') {
      filters.type = filterType
    }
    if (filterStatus !== 'all') {
      filters.status = filterStatus
    }

    const requests = approvalWorkflow.getApprovalRequests(filters)
    setApprovalRequests(requests)

    // Load statistics
    const stats = approvalWorkflow.getApprovalStatistics(
      currentUser.id, 
      scopedParams.currentOrgUnit
    )
    setStatistics(stats)
  }

  const handleApproval = async (requestId: string, comments?: string) => {
    if (!currentUser) return
    
    try {
      const updatedRequest = approvalWorkflow.approveStep(requestId, currentUser.id, comments)
      loadApprovalData()
      
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(updatedRequest)
      }
    } catch (error) {
      alert(`Error approving request: ${error}`)
    }
  }

  const handleRejection = async (requestId: string, reason: string) => {
    if (!currentUser) return
    
    try {
      const updatedRequest = approvalWorkflow.rejectStep(requestId, currentUser.id, reason)
      loadApprovalData()
      
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(updatedRequest)
      }
    } catch (error) {
      alert(`Error rejecting request: ${error}`)
    }
  }

  const handleEscalation = async (requestId: string, reason: string) => {
    if (!currentUser) return
    
    try {
      const updatedRequest = approvalWorkflow.escalateRequest(requestId, currentUser.id, reason)
      loadApprovalData()
      
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(updatedRequest)
      }
    } catch (error) {
      alert(`Error escalating request: ${error}`)
    }
  }

  const filteredRequests = approvalRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestorName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = (() => {
      switch (activeTab) {
        case 'pending':
          return (request.status === 'pending_approval' || request.status === 'escalated') &&
                 request.approvalChain.some(step => 
                   step.approverId === currentUser?.id && step.status === 'pending'
                 )
        case 'my_requests':
          return request.requestorId === currentUser?.id
        case 'all':
          return true
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesTab
  })

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'draft': return 'var(--text-muted)'
      case 'submitted':
      case 'pending_approval': return 'var(--accent-info)'
      case 'approved':
      case 'completed': return 'var(--accent-secondary)'
      case 'rejected': return 'var(--accent-danger)'
      case 'escalated': return 'var(--accent-warning)'
      default: return 'var(--text-muted)'
    }
  }

  const getTypeIcon = (type: ApprovalType) => {
    switch (type) {
      case 'expense': return '💰'
      case 'task_completion': return '✅'
      case 'budget_allocation': return '📊'
      case 'equipment_purchase': return '🚜'
      case 'safe_access': return '🔒'
      case 'payroll_adjustment': return '👥'
      case 'document_approval': return '📄'
      case 'milestone_completion': return '🎯'
      default: return '📋'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'var(--accent-info)'
      case 'medium': return 'var(--accent-warning)'
      case 'high': return 'var(--accent-danger)'
      case 'critical': return '#8b0000'
      default: return 'var(--text-muted)'
    }
  }

  const canCurrentUserApprove = (request: ApprovalRequest) => {
    if (!currentUser) return false
    const currentStep = request.approvalChain[request.currentApproverIndex]
    return currentStep && currentStep.approverId === currentUser.id && currentStep.status === 'pending'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!hasPermission('approvals', 'view')) {
    return (
      <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3>Access Denied</h3>
        <p>You don't have permission to view approval workflows</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Approval Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            Manage approval workflows and requests
          </p>
        </div>
        {hasPermission('approvals', 'create') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            ➕ Create Request
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--accent-info-light)',
            border: '1px solid var(--accent-info)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-info)' }}>
              {statistics.pending}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Pending Approvals
            </div>
          </div>
          
          <div style={{
            background: 'var(--accent-secondary-light)',
            border: '1px solid var(--accent-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
              {statistics.approved}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Approved
            </div>
          </div>
          
          <div style={{
            background: 'var(--accent-danger-light)',
            border: '1px solid var(--accent-danger)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-danger)' }}>
              {statistics.rejected}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Rejected
            </div>
          </div>
          
          <div style={{
            background: 'var(--accent-primary-light)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {statistics.total}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total Requests
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-light)', 
        marginBottom: '24px',
        gap: '2px'
      }}>
        {[
          { id: 'pending', label: 'Pending Approvals', count: statistics?.pending || 0 },
          { id: 'my_requests', label: 'My Requests', count: approvalRequests.filter(r => r.requestorId === currentUser?.id).length },
          { id: 'all', label: 'All Requests', count: statistics?.total || 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id ? 'var(--accent-primary-light)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-normal)'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)'
      }}>
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px'
          }}
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ApprovalType | 'all')}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', minWidth: '140px' }}
        >
          <option value="all">All Types</option>
          <option value="expense">💰 Expense</option>
          <option value="task_completion">✅ Task Completion</option>
          <option value="budget_allocation">📊 Budget Allocation</option>
          <option value="equipment_purchase">🚜 Equipment Purchase</option>
          <option value="safe_access">🔒 Safe Access</option>
          <option value="payroll_adjustment">👥 Payroll Adjustment</option>
          <option value="document_approval">📄 Document Approval</option>
          <option value="milestone_completion">🎯 Milestone Completion</option>
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ApprovalStatus | 'all')}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', minWidth: '120px' }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {/* Approval Requests List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredRequests.map(request => {
          const canApprove = canCurrentUserApprove(request)
          const currentStep = request.approvalChain[request.currentApproverIndex]
          const timeAgo = new Date().getTime() - new Date(request.createdAt).getTime()
          const daysAgo = Math.floor(timeAgo / (1000 * 60 * 60 * 24))
          
          return (
            <div key={request.id} className="card" style={{ 
              padding: '20px',
              border: canApprove ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
              background: canApprove ? 'var(--accent-primary-light)' : 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getTypeIcon(request.type)}</span>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      margin: 0, 
                      color: 'var(--text-primary)' 
                    }}>
                      {request.title}
                    </h3>
                    <span style={{
                      background: getStatusColor(request.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {request.status.replace('_', ' ')}
                    </span>
                    <span style={{
                      background: getPriorityColor(request.priority),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {request.priority}
                    </span>
                  </div>
                  
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)', 
                    margin: '0 0 12px 0',
                    lineHeight: '1.5'
                  }}>
                    {request.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>👤 {request.requestorName}</span>
                    <span>📅 {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}</span>
                    {request.amount && (
                      <span>💰 {request.amount.toLocaleString()} LYD</span>
                    )}
                    <span>🔗 Step {request.currentApproverIndex + 1} of {request.approvalChain.length}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="btn-outline btn-sm"
                  >
                    👁️ View Details
                  </button>
                  
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleApproval(request.id)}
                        style={{
                          background: 'var(--accent-secondary)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✓ Approve
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:')
                          if (reason) {
                            handleRejection(request.id, reason)
                          }
                        }}
                        style={{
                          background: 'var(--accent-danger)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✗ Reject
                      </button>
                      
                      {currentStep?.canEscalate && (
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for escalation:')
                            if (reason) {
                              handleEscalation(request.id, reason)
                            }
                          }}
                          style={{
                            background: 'var(--accent-warning)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ⬆️ Escalate
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Approval Chain Progress */}
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  APPROVAL CHAIN
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {request.approvalChain.map((step, index) => (
                    <React.Fragment key={step.stepNumber}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: step.status === 'approved' ? 'var(--accent-secondary-light)' :
                                   step.status === 'rejected' ? 'var(--accent-danger-light)' :
                                   step.status === 'pending' && index === request.currentApproverIndex ? 'var(--accent-info-light)' :
                                   'var(--bg-secondary)',
                        border: '1px solid ' + (
                          step.status === 'approved' ? 'var(--accent-secondary)' :
                          step.status === 'rejected' ? 'var(--accent-danger)' :
                          step.status === 'pending' && index === request.currentApproverIndex ? 'var(--accent-info)' :
                          'var(--border-light)'
                        ),
                        fontSize: '11px'
                      }}>
                        <span>
                          {step.status === 'approved' ? '✓' :
                           step.status === 'rejected' ? '✗' :
                           step.status === 'pending' && index === request.currentApproverIndex ? '⏳' :
                           step.status === 'skipped' ? '⏩' : '○'}
                        </span>
                        <span style={{ fontWeight: '600' }}>{step.approverName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({step.approverRole.replace('_', ' ')})</span>
                      </div>
                      {index < request.approvalChain.length - 1 && (
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="card" style={{ 
          padding: '60px', 
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3>No requests found</h3>
          <p>
            {activeTab === 'pending' 
              ? "You don't have any pending approvals"
              : "No approval requests match your current filters"
            }
          </p>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <ApprovalDetailsModal
          request={selectedRequest}
          currentUser={currentUser}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApproval}
          onReject={handleRejection}
          onEscalate={handleEscalation}
        />
      )}
      
      {/* Create Request Modal would go here */}
      {showCreateModal && (
        <div>Create Request Modal - To be implemented</div>
      )}
    </div>
  )
}

// Approval Details Modal Component
function ApprovalDetailsModal({
  request,
  currentUser,
  onClose,
  onApprove,
  onReject,
  onEscalate
}: {
  request: ApprovalRequest
  currentUser: any
  onClose: () => void
  onApprove: (requestId: string, comments?: string) => void
  onReject: (requestId: string, reason: string) => void
  onEscalate: (requestId: string, reason: string) => void
}) {
  const [comments, setComments] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'escalate' | null>(null)
  
  const currentStep = request.approvalChain[request.currentApproverIndex]
  const canApprove = currentStep && currentStep.approverId === currentUser?.id && currentStep.status === 'pending'
  
  const handleAction = () => {
    if (!actionType) return
    
    switch (actionType) {
      case 'approve':
        onApprove(request.id, comments)
        break
      case 'reject':
        if (!comments.trim()) {
          alert('Please provide a reason for rejection')
          return
        }
        onReject(request.id, comments)
        break
      case 'escalate':
        if (!comments.trim()) {
          alert('Please provide a reason for escalation')
          return
        }
        onEscalate(request.id, comments)
        break
    }
    
    onClose()
    setActionType(null)
    setComments('')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
            Approval Request Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            ×
          </button>
        </div>

        {/* Request Information */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Type</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{request.type.replace('_', ' ')}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: request.status === 'approved' ? 'var(--accent-secondary)' :
                       request.status === 'rejected' ? 'var(--accent-danger)' :
                       'var(--accent-info)'
              }}>
                {request.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Requestor</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{request.requestorName}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</div>
              <div style={{ fontSize: '16px', fontWeight: '600', textTransform: 'uppercase' }}>
                {request.priority}
              </div>
            </div>
            {request.amount && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Amount</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                  {request.amount.toLocaleString()} LYD
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Created</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</div>
            <div style={{ 
              fontSize: '14px',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)'
            }}>
              {request.description}
            </div>
          </div>
        </div>

        {/* Approval Chain */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Approval Chain</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {request.approvalChain.map((step, index) => (
              <div key={step.stepNumber} style={{
                padding: '16px',
                background: step.status === 'approved' ? 'var(--accent-secondary-light)' :
                           step.status === 'rejected' ? 'var(--accent-danger-light)' :
                           step.status === 'pending' && index === request.currentApproverIndex ? 'var(--accent-info-light)' :
                           'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid ' + (
                  step.status === 'approved' ? 'var(--accent-secondary)' :
                  step.status === 'rejected' ? 'var(--accent-danger)' :
                  step.status === 'pending' && index === request.currentApproverIndex ? 'var(--accent-info)' :
                  'var(--border-light)'
                )
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      Step {step.stepNumber}: {step.approverName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {step.approverRole.replace('_', ' ')} • Threshold: {step.financialThreshold?.toLocaleString()} LYD
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {step.status.toUpperCase().replace('_', ' ')}
                    </div>
                    {step.approvedAt && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Approved: {new Date(step.approvedAt).toLocaleDateString()}
                      </div>
                    )}
                    {step.rejectedAt && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Rejected: {new Date(step.rejectedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                {step.comments && (
                  <div style={{ 
                    marginTop: '12px',
                    padding: '8px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontStyle: 'italic'
                  }}>
                    "{step.comments}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        {request.comments.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Comments</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {request.comments.map(comment => (
                <div key={comment.id} style={{
                  padding: '12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                      {comment.userName} ({comment.userRole.replace('_', ' ')})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px' }}>{comment.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {canApprove && (
          <div style={{ 
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Your Action Required
            </h3>
            
            {!actionType ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setActionType('approve')}
                  style={{
                    background: 'var(--accent-secondary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  ✓ Approve
                </button>
                
                <button
                  onClick={() => setActionType('reject')}
                  style={{
                    background: 'var(--accent-danger)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  ✗ Reject
                </button>
                
                {currentStep?.canEscalate && (
                  <button
                    onClick={() => setActionType('escalate')}
                    style={{
                      background: 'var(--accent-warning)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ⬆️ Escalate
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', textTransform: 'capitalize' }}>
                    {actionType} Request
                  </div>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      actionType === 'approve' ? 'Optional comments...' :
                      actionType === 'reject' ? 'Please provide a reason for rejection...' :
                      'Please provide a reason for escalation...'
                    }
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      resize: 'vertical',
                      fontSize: '14px'
                    }}
                    required={actionType !== 'approve'}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleAction}
                    style={{
                      background: actionType === 'approve' ? 'var(--accent-secondary)' :
                                 actionType === 'reject' ? 'var(--accent-danger)' :
                                 'var(--accent-warning)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                  </button>
                  
                  <button
                    onClick={() => {
                      setActionType(null)
                      setComments('')
                    }}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
