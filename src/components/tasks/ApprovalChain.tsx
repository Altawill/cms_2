import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  ChevronRight,
  MessageSquare,
  Calendar
} from 'lucide-react'
import { Approval, Employee } from '../../types'
import { format } from 'date-fns'
import { cn } from '../../utils'

interface ApprovalChainProps {
  approvals: Approval[]
  approvers: Employee[]
  onApprove?: (approvalId: string, comment?: string) => void
  onReject?: (approvalId: string, comment: string) => void
  currentUserId?: string
  compact?: boolean
}

export default function ApprovalChain({ 
  approvals, 
  approvers,
  onApprove,
  onReject,
  currentUserId,
  compact = false
}: ApprovalChainProps) {
  const { t } = useTranslation()
  
  const getApprover = (approverId: string) => 
    approvers.find(emp => emp.id === approverId)

  const canUserApprove = (approval: Approval) => 
    currentUserId === approval.approverId && approval.status === 'PENDING'

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'REJECTED':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      default:
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {approvals.map((approval, index) => {
          const approver = getApprover(approval.approverId)
          return (
            <React.Fragment key={approval.id}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(approval.status)}
                <span className="text-xs font-medium text-foreground">
                  {approver?.name || t('common.unknown')}
                </span>
              </div>
              {index < approvals.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-foreground flex items-center">
        <User className="h-4 w-4 mr-2" />
        {t('tasks.approvalChain')}
      </h3>
      
      <div className="space-y-3">
        {approvals.map((approval, index) => {
          const approver = getApprover(approval.approverId)
          const isUserApproval = canUserApprove(approval)
          
          return (
            <div
              key={approval.id}
              className={cn(
                'border rounded-lg p-4 transition-all',
                getStatusColor(approval.status),
                isUserApproval && 'ring-2 ring-primary/20'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(approval.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {approver?.name || t('common.unknown')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({approver?.position})
                      </span>
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded">
                        {t(`tasks.approvalLevel.${approval.level.toLowerCase()}`)}
                      </span>
                    </div>
                    
                    {approval.comment && (
                      <div className="flex items-start space-x-2 mt-2">
                        <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          {approval.comment}
                        </p>
                      </div>
                    )}
                    
                    {approval.respondedAt && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(approval.respondedAt, 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {isUserApproval && (
                  <ApprovalActions
                    approval={approval}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Approval Actions Component
interface ApprovalActionsProps {
  approval: Approval
  onApprove?: (approvalId: string, comment?: string) => void
  onReject?: (approvalId: string, comment: string) => void
}

function ApprovalActions({ approval, onApprove, onReject }: ApprovalActionsProps) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('')
  const [showCommentInput, setShowCommentInput] = useState(false)
  
  const handleApprove = () => {
    onApprove?.(approval.id, comment || undefined)
  }
  
  const handleReject = () => {
    if (!comment.trim()) {
      setShowCommentInput(true)
      return
    }
    onReject?.(approval.id, comment)
  }
  
  return (
    <div className="flex flex-col items-end space-y-2">
      {showCommentInput && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('tasks.approvalComment')}
          className="w-48 px-3 py-2 text-xs border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={2}
        />
      )}
      
      <div className="flex space-x-2">
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="px-2 py-1 text-xs text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
        </button>
        <button
          onClick={handleReject}
          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 rounded-md transition-colors"
        >
          {t('common.reject')}
        </button>
        <button
          onClick={handleApprove}
          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 rounded-md transition-colors"
        >
          {t('common.approve')}
        </button>
      </div>
    </div>
  )
}
