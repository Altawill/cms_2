import { create } from 'zustand'
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval'

interface QueuedOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  collection: string
  documentId?: string
  data?: any
  timestamp: number
  retryCount: number
  maxRetries: number
  error?: string
}

interface OfflineState {
  isOnline: boolean
  queue: QueuedOperation[]
  syncing: boolean
  
  // Actions
  addToQueue: (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>
  removeFromQueue: (operationId: string) => Promise<void>
  syncQueue: () => Promise<void>
  clearQueue: () => Promise<void>
  setOnlineStatus: (online: boolean) => void
}

const QUEUE_STORAGE_KEY = 'offline-queue'

export const useOffline = create<OfflineState>((set, get) => ({
  isOnline: navigator.onLine,
  queue: [],
  syncing: false,

  addToQueue: async (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const queuedOperation: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: operation.maxRetries || 3,
    }

    const currentQueue = get().queue
    const newQueue = [...currentQueue, queuedOperation]
    
    // Save to IndexedDB
    await idbSet(QUEUE_STORAGE_KEY, newQueue)
    
    set({ queue: newQueue })

    // Try to sync immediately if online
    if (get().isOnline) {
      get().syncQueue()
    }
  },

  removeFromQueue: async (operationId: string) => {
    const currentQueue = get().queue
    const newQueue = currentQueue.filter(op => op.id !== operationId)
    
    // Update IndexedDB
    await idbSet(QUEUE_STORAGE_KEY, newQueue)
    
    set({ queue: newQueue })
  },

  syncQueue: async () => {
    const { queue, isOnline, syncing } = get()
    
    if (!isOnline || syncing || queue.length === 0) {
      return
    }

    set({ syncing: true })

    try {
      // Process queue operations
      for (const operation of queue) {
        try {
          await processQueuedOperation(operation)
          await get().removeFromQueue(operation.id)
        } catch (error: any) {
          console.error('Failed to sync operation:', operation, error)
          
          // Update retry count
          const updatedOperation = {
            ...operation,
            retryCount: operation.retryCount + 1,
            error: error.message
          }

          if (updatedOperation.retryCount >= updatedOperation.maxRetries) {
            // Max retries reached, remove from queue
            console.error('Max retries reached for operation:', updatedOperation)
            await get().removeFromQueue(operation.id)
          } else {
            // Update operation with retry count
            const currentQueue = get().queue
            const newQueue = currentQueue.map(op => 
              op.id === operation.id ? updatedOperation : op
            )
            
            await idbSet(QUEUE_STORAGE_KEY, newQueue)
            set({ queue: newQueue })
          }
        }
      }
    } catch (error) {
      console.error('Queue sync error:', error)
    } finally {
      set({ syncing: false })
    }
  },

  clearQueue: async () => {
    await idbDel(QUEUE_STORAGE_KEY)
    set({ queue: [] })
  },

  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online })
    
    // Try to sync when coming back online
    if (online) {
      get().syncQueue()
    }
  },
}))

// Helper function to process queued operations
async function processQueuedOperation(operation: QueuedOperation): Promise<void> {
  // Import repository here to avoid circular dependencies
  const { Repository } = await import('../services/repository')
  const repo = new Repository(operation.collection)

  switch (operation.type) {
    case 'CREATE':
      await repo.create(operation.data)
      break
    case 'UPDATE':
      if (!operation.documentId) {
        throw new Error('Document ID required for UPDATE operation')
      }
      await repo.update(operation.documentId, operation.data)
      break
    case 'DELETE':
      if (!operation.documentId) {
        throw new Error('Document ID required for DELETE operation')
      }
      await repo.delete(operation.documentId)
      break
    default:
      throw new Error(`Unknown operation type: ${operation.type}`)
  }
}

// Initialize offline state
if (typeof window !== 'undefined') {
  // Load queue from IndexedDB
  idbGet(QUEUE_STORAGE_KEY).then((savedQueue) => {
    if (savedQueue && Array.isArray(savedQueue)) {
      useOffline.setState({ queue: savedQueue })
    }
  }).catch(console.error)

  // Listen for online/offline events
  window.addEventListener('online', () => {
    useOffline.getState().setOnlineStatus(true)
  })

  window.addEventListener('offline', () => {
    useOffline.getState().setOnlineStatus(false)
  })

  // Periodic sync attempt
  setInterval(() => {
    if (useOffline.getState().isOnline && useOffline.getState().queue.length > 0) {
      useOffline.getState().syncQueue()
    }
  }, 30000) // Every 30 seconds
}

// Helper hook for adding operations to offline queue
export function useOfflineOperation() {
  const { addToQueue } = useOffline()

  const queueOperation = async (
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    collection: string,
    data?: any,
    documentId?: string
  ) => {
    await addToQueue({
      type,
      collection,
      data,
      documentId,
      maxRetries: 3,
    })
  }

  return { queueOperation }
}
