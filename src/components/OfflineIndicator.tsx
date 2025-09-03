import React from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { useOffline } from '../state/useOffline'

export default function OfflineIndicator() {
  const { isOnline, queue, syncing } = useOffline()

  if (isOnline && queue.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`rounded-lg border p-3 shadow-lg ${
        isOnline ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-blue-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          
          <div className="text-sm">
            {!isOnline && (
              <p className="text-red-700 font-medium">Offline</p>
            )}
            
            {queue.length > 0 && (
              <p className="text-blue-700">
                {syncing ? 'Syncing...' : `${queue.length} pending changes`}
              </p>
            )}
          </div>
          
          {syncing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
      </div>
    </div>
  )
}
