import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Image,
  Download
} from 'lucide-react'
import { TaskUpdate, Employee, TaskAttachment } from '../../types'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '../../utils'

interface TaskTimelineProps {
  updates: TaskUpdate[]
  employees: Employee[]
  onAttachmentPreview?: (attachment: TaskAttachment) => void
  className?: string
}

export default function TaskTimeline({ 
  updates, 
  employees, 
  onAttachmentPreview,
  className 
}: TaskTimelineProps) {
  const { t } = useTranslation()
  
  const getEmployee = (userId: string) => 
    employees.find(emp => emp.id === userId)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4 text-green-600" />
      case 'ON_HOLD':
        return <PauseCircle className="h-4 w-4 text-yellow-600" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getAttachmentIcon = (attachment: TaskAttachment) => {
    if (attachment.type.startsWith('image/')) {
      return <Image className="h-3 w-3 text-blue-500" />
    }
    return <FileText className="h-3 w-3 text-muted-foreground" />
  }

  const sortedUpdates = [...updates].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  )

  if (updates.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {t('tasks.noUpdates')}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className="text-lg font-semibold text-foreground flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        {t('tasks.timeline')}
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {sortedUpdates.map((update, index) => {
            const author = getEmployee(update.userId)
            const isProgressUpdate = update.newProgress !== undefined
            const isStatusUpdate = update.newStatus !== undefined
            
            return (
              <div key={update.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className="relative flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-background border-2 border-border rounded-full">
                    {isStatusUpdate ? (
                      getStatusIcon(update.newStatus!)
                    ) : (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  
                  {/* Progress indicator */}
                  {isProgressUpdate && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {update.newProgress}%
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {author?.name || t('common.unknown')}
                        </span>
                        {author?.position && (
                          <span className="text-xs text-muted-foreground">
                            ({author.position})
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <span title={format(update.createdAt, 'PPpp')}>
                          {formatDistanceToNow(update.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status/Progress Changes */}
                    {(isStatusUpdate || isProgressUpdate) && (
                      <div className="flex items-center space-x-4 mb-3 p-2 bg-muted rounded-md">
                        {isStatusUpdate && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {t('tasks.statusChanged')}:
                            </span>
                            <span className="text-xs font-medium">
                              {t(`tasks.status.${update.newStatus!.toLowerCase()}`)}
                            </span>
                          </div>
                        )}
                        
                        {isProgressUpdate && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {t('tasks.progressUpdated')}:
                            </span>
                            <span className="text-xs font-medium">
                              {update.newProgress}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Description */}
                    <p className="text-sm text-foreground mb-3">
                      {update.description}
                    </p>
                    
                    {/* Location */}
                    {update.location && (
                      <div className="flex items-center space-x-2 mb-3 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{update.location}</span>
                      </div>
                    )}
                    
                    {/* Additional Notes */}
                    {update.notes && (
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          {update.notes}
                        </p>
                      </div>
                    )}
                    
                    {/* Attachments */}
                    {update.attachments && update.attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-foreground flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {t('tasks.attachments')} ({update.attachments.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {update.attachments.map((attachment, attachIndex) => (
                            <div
                              key={attachIndex}
                              className="flex items-center space-x-2 p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => onAttachmentPreview?.(attachment)}
                            >
                              {getAttachmentIcon(attachment)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ''}
                                </p>
                              </div>
                              <a
                                href={attachment.url}
                                download={attachment.name}
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Timeline Stats Component
interface TimelineStatsProps {
  updates: TaskUpdate[]
  className?: string
}

export function TimelineStats({ updates, className }: TimelineStatsProps) {
  const { t } = useTranslation()
  
  const stats = React.useMemo(() => {
    const totalUpdates = updates.length
    const progressUpdates = updates.filter(u => u.newProgress !== undefined).length
    const statusUpdates = updates.filter(u => u.newStatus !== undefined).length
    const withAttachments = updates.filter(u => u.attachments && u.attachments.length > 0).length
    
    const lastUpdate = updates.length > 0 
      ? updates.reduce((latest, current) => 
          current.createdAt > latest.createdAt ? current : latest
        )
      : null
    
    return {
      totalUpdates,
      progressUpdates,
      statusUpdates,
      withAttachments,
      lastUpdate
    }
  }, [updates])

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <div className="text-center p-3 bg-card border border-border rounded-lg">
        <div className="text-lg font-semibold text-foreground">
          {stats.totalUpdates}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('tasks.totalUpdates')}
        </div>
      </div>
      
      <div className="text-center p-3 bg-card border border-border rounded-lg">
        <div className="text-lg font-semibold text-foreground">
          {stats.progressUpdates}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('tasks.progressUpdates')}
        </div>
      </div>
      
      <div className="text-center p-3 bg-card border border-border rounded-lg">
        <div className="text-lg font-semibold text-foreground">
          {stats.statusUpdates}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('tasks.statusUpdates')}
        </div>
      </div>
      
      <div className="text-center p-3 bg-card border border-border rounded-lg">
        <div className="text-lg font-semibold text-foreground">
          {stats.withAttachments}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('tasks.withAttachments')}
        </div>
      </div>
      
      {stats.lastUpdate && (
        <div className="col-span-2 md:col-span-4 p-3 bg-card border border-border rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">
            {t('tasks.lastUpdate')}
          </div>
          <div className="text-sm text-foreground">
            {formatDistanceToNow(stats.lastUpdate.createdAt, { addSuffix: true })}
          </div>
        </div>
      )}
    </div>
  )
}
