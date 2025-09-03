import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Smartphone,
  Server,
  Activity,
  Settings,
  Trash2
} from 'lucide-react'
import { useOffline, offlineUtils, type OfflineAction } from '../services/offlineService'
import { toast } from 'sonner'

interface OfflineStatusIndicatorProps {
  showDetails?: boolean
  className?: string
  variant?: 'compact' | 'detailed' | 'banner'
}

export default function OfflineStatusIndicator({
  showDetails = false,
  className = '',
  variant = 'compact'
}: OfflineStatusIndicatorProps) {
  const [showFullDetails, setShowFullDetails] = useState(showDetails)
  
  const {
    isOnline,
    isSyncing,
    lastSyncResult,
    pendingActionsCount,
    syncNow,
    getPendingActions,
    cancelAction,
    getStorageInfo,
    clearOfflineData
  } = useOffline()

  const handleSyncNow = async () => {
    try {
      const result = await syncNow()
      
      if (result.success) {
        toast.success(`✅ Synced ${result.syncedActions} changes successfully!`)
      } else {
        toast.error(`❌ Sync completed with ${result.failedActions} failures`)
      }
    } catch (error) {
      console.error('Manual sync failed:', error)
      toast.error('Sync failed - please try again')
    }
  }

  const handleCancelAction = (actionId: string) => {
    const success = cancelAction(actionId)
    if (success) {
      toast.success('❌ Action cancelled')
    } else {
      toast.error('Failed to cancel action')
    }
  }

  const handleClearOfflineData = () => {
    if (confirm('Are you sure you want to clear all offline data? This will remove all pending changes.')) {
      clearOfflineData()
      toast.success('🗑️ Offline data cleared')
    }
  }

  const status = offlineUtils.formatOfflineStatus(pendingActionsCount, isOnline, isSyncing)
  const storageInfo = getStorageInfo()
  const pendingActions = getPendingActions()

  // Compact variant - just status indicator
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-600" />
          )}
          
          <span className={`text-sm font-medium ${
            status.color === 'green' ? 'text-green-600' :
            status.color === 'orange' ? 'text-orange-600' :
            status.color === 'blue' ? 'text-blue-600' :
            'text-yellow-600'
          }`}>
            {status.text}
          </span>
        </div>
        
        {pendingActionsCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {pendingActionsCount} pending
          </Badge>
        )}
        
        {isSyncing && (
          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
        )}
      </div>
    )
  }

  // Banner variant - horizontal status bar
  if (variant === 'banner') {
    return (
      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{status.icon}</span>
            <div>
              <div className="font-medium text-sm">{status.text}</div>
              <div className="text-xs text-gray-600">{status.description}</div>
            </div>
          </div>
          
          {pendingActionsCount > 0 && (
            <Badge variant="secondary">
              {pendingActionsCount} changes pending
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isOnline && pendingActionsCount > 0 && (
            <Badge className="bg-orange-600 text-white">
              <Database className="h-3 w-3 mr-1" />
              Offline Mode
            </Badge>
          )}
          
          {pendingActionsCount > 0 && isOnline && (
            <Button size="sm" onClick={handleSyncNow} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Detailed variant - full status card
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-600" />
            )}
            Sync Status
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isOnline ? "secondary" : "outline"}
              className={isOnline ? "text-green-600" : "text-orange-600 border-orange-600"}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            {pendingActionsCount > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {pendingActionsCount} Pending
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-2xl">{status.icon}</span>
          <div className="flex-1">
            <div className="font-medium">{status.text}</div>
            <div className="text-sm text-gray-600">{status.description}</div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleSyncNow}
            disabled={isSyncing || !isOnline || pendingActionsCount === 0}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now ({pendingActionsCount})
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowFullDetails(!showFullDetails)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 text-sm">Last Sync Result</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{lastSyncResult.syncedActions} synced</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>{lastSyncResult.failedActions} failed</span>
              </div>
            </div>
            
            {lastSyncResult.totalDataSynced > 0 && (
              <div className="text-xs text-gray-600">
                📊 {(lastSyncResult.totalDataSynced / 1024).toFixed(1)} KB synced
              </div>
            )}
          </div>
        )}

        {/* Storage Information */}
        {showFullDetails && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Storage Usage
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Storage:</span>
                  <span className="font-mono">
                    {(storageInfo.totalSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600">Actions:</span>
                    <div className="font-mono">
                      {(storageInfo.actionsSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache:</span>
                    <div className="font-mono">
                      {(storageInfo.dataSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                
                {storageInfo.usagePercentage && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Quota Usage:</span>
                      <span>{storageInfo.usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={storageInfo.usagePercentage} className="h-1" />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Pending Actions */}
        {showFullDetails && pendingActions.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Actions ({pendingActions.length})
                </h4>
                
                {pendingActions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearOfflineData}
                    className="text-red-600 border-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2">
                {pendingActions.slice(0, 10).map((action) => (
                  <ActionItem
                    key={action.id}
                    action={action}
                    onCancel={() => handleCancelAction(action.id)}
                  />
                ))}
                
                {pendingActions.length > 10 && (
                  <div className="text-center text-sm text-gray-500 p-2">
                    ... and {pendingActions.length - 10} more actions
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Individual action item component
function ActionItem({
  action,
  onCancel
}: {
  action: OfflineAction
  onCancel: () => void
}) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CREATE_TASK':
      case 'UPDATE_TASK':
        return <Activity className="h-3 w-3" />
      case 'UPLOAD_FILE':
        return <Database className="h-3 w-3" />
      case 'CREATE_APPROVAL':
      case 'UPDATE_APPROVAL':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'SYNCING':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatActionTitle = (action: OfflineAction): string => {
    switch (action.type) {
      case 'CREATE_TASK':
        return `Create task: ${action.payload?.title || action.entityId}`
      case 'UPDATE_TASK':
        return `Update task: ${action.entityId}`
      case 'DELETE_TASK':
        return `Delete task: ${action.entityId}`
      case 'UPLOAD_FILE':
        return `Upload file: ${action.payload?.fileName || 'Unknown'}`
      case 'CREATE_APPROVAL':
        return `Create approval: ${action.entityId}`
      case 'UPDATE_APPROVAL':
        return `Update approval: ${action.entityId}`
      case 'CREATE_REPORT':
        return `Create report: ${action.payload?.title || action.entityId}`
      case 'UPDATE_REPORT':
        return `Update report: ${action.entityId}`
      default:
        return `${action.type}: ${action.entityId}`
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        {getActionIcon(action.type)}
        <div className="flex-1">
          <div className="text-sm font-medium">
            {formatActionTitle(action)}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(action.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusColor(action.status)}`}
        >
          {action.status}
        </Badge>
        
        {action.status === 'FAILED' && action.retryCount < action.maxRetries && (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
            Retry {action.retryCount + 1}/{action.maxRetries}
          </Badge>
        )}
        
        {action.metadata?.priority && (
          <Badge 
            variant="outline" 
            className={`text-xs ${
              action.metadata.priority === 'HIGH' ? 'text-red-600 border-red-600' :
              action.metadata.priority === 'MEDIUM' ? 'text-yellow-600 border-yellow-600' :
              'text-gray-600 border-gray-600'
            }`}
          >
            {action.metadata.priority}
          </Badge>
        )}
        
        {action.status === 'PENDING' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-red-600 h-6 w-6 p-0"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Network status component
export function NetworkStatus({ className = '' }: { className?: string }) {
  const { isOnline, isSyncing, pendingActionsCount } = useOffline()
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`} />
      
      <span className="text-sm text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      
      {isSyncing && (
        <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
      )}
      
      {pendingActionsCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {pendingActionsCount}
        </Badge>
      )}
    </div>
  )
}

// Sync progress component
export function SyncProgress({ 
  className = '',
  showDetails = false 
}: { 
  className?: string
  showDetails?: boolean 
}) {
  const { isSyncing, lastSyncResult, pendingActionsCount } = useOffline()
  
  if (!isSyncing && pendingActionsCount === 0) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">All synced</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className={`flex items-center gap-2 text-blue-600 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Syncing changes...</span>
        {showDetails && (
          <div className="ml-2">
            <Progress value={50} className="h-1 w-20" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-orange-600 ${className}`}>
      <Clock className="h-4 w-4" />
      <span className="text-sm">{pendingActionsCount} pending sync</span>
    </div>
  )
}

// Offline actions summary
export function OfflineActionsSummary({ className = '' }: { className?: string }) {
  const { getPendingActions } = useOffline()
  const actions = getPendingActions()
  
  const actionCounts = actions.reduce((counts, action) => {
    counts[action.type] = (counts[action.type] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const statusCounts = actions.reduce((counts, action) => {
    counts[action.status] = (counts[action.status] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  if (actions.length === 0) {
    return (
      <div className={`text-center p-4 text-gray-500 ${className}`}>
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>No pending actions</p>
        <p className="text-sm">All changes are synced</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Type Breakdown */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Actions by Type</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(actionCounts).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{type.replace('_', ' ')}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Status Overview</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-1">
                {status === 'PENDING' && <Clock className="h-3 w-3 text-blue-600" />}
                {status === 'SYNCING' && <RefreshCw className="h-3 w-3 text-purple-600" />}
                {status === 'FAILED' && <XCircle className="h-3 w-3 text-red-600" />}
                {status === 'CANCELLED' && <XCircle className="h-3 w-3 text-gray-600" />}
                <span className="text-sm">{status}</span>
              </div>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Floating offline indicator (minimal)
export function FloatingOfflineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, pendingActionsCount, isSyncing } = useOffline()
  
  // Only show when offline or have pending actions
  if (isOnline && pendingActionsCount === 0) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Offline</span>
            {pendingActionsCount > 0 && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                {pendingActionsCount}
              </Badge>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-600">Syncing</span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">
              {pendingActionsCount} pending
            </span>
          </>
        )}
      </div>
    </div>
  )
}
