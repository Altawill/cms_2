import React from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useUI } from '../state/useUI'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useUI()

  if (notifications.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
      default: return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border p-4 shadow-lg ${getColors(notification.type)} animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {notification.title}
              </p>
              {notification.message && (
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              )}
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="text-sm text-primary hover:text-primary/80 font-medium mt-2"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
