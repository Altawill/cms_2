import { useState, useCallback, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastState: ToastState = { toasts: [] }
let listeners: Array<(toasts: Toast[]) => void> = []

function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: Toast = {
    ...toast,
    id,
    duration: toast.duration ?? 5000,
  }
  
  toastState.toasts = [...toastState.toasts, newToast]
  listeners.forEach(listener => listener(toastState.toasts))

  // Auto remove toast after duration
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
  }
}

function removeToast(id: string) {
  toastState.toasts = toastState.toasts.filter(toast => toast.id !== id)
  listeners.forEach(listener => listener(toastState.toasts))
}

export function useToast() {
  const [toasts, setToasts] = useState(toastState.toasts)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    addToast(props)
  }, [])

  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}
