import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n/init'

type Theme = 'light' | 'dark' | 'system'
type Language = 'en' | 'ar'

interface UIState {
  // Theme
  theme: Theme
  isDark: boolean
  
  // Language and RTL
  language: Language
  isRTL: boolean
  
  // Navigation
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  
  // Global loading states
  globalLoading: boolean
  
  // Notifications
  notifications: Notification[]
  
  // Modals
  modals: Record<string, boolean>
  
  // Actions
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  setGlobalLoading: (loading: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Helper function to detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Helper function to apply theme to document
const applyTheme = (theme: Theme) => {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
  
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  
  return resolvedTheme === 'dark'
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      isDark: false,
      language: 'en',
      isRTL: false,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      globalLoading: false,
      notifications: [],
      modals: {},

      // Theme actions
      setTheme: (theme: Theme) => {
        const isDark = applyTheme(theme)
        set({ theme, isDark })
      },

      // Language actions
      setLanguage: (language: Language) => {
        const isRTL = language === 'ar'
        i18n.changeLanguage(language)
        set({ language, isRTL })
      },

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed })
      },

      setMobileSidebarOpen: (open: boolean) => {
        set({ mobileSidebarOpen: open })
      },

      // Loading actions
      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading })
      },

      // Notification actions
      addNotification: (notification: Omit<Notification, 'id'>) => {
        const id = Date.now().toString()
        const newNotification: Notification = {
          ...notification,
          id,
          duration: notification.duration ?? 5000,
        }

        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))

        // Auto remove notification after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, newNotification.duration)
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      // Modal actions
      openModal: (modalId: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: true }
        }))
      },

      closeModal: (modalId: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: false }
        }))
      },

      toggleModal: (modalId: string) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: !state.modals[modalId] }
        }))
      },
    }),
    {
      name: 'ui-state',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// Initialize theme and language on load
if (typeof window !== 'undefined') {
  const { theme, language, setTheme, setLanguage } = useUI.getState()
  
  // Apply initial theme
  setTheme(theme)
  
  // Apply initial language
  setLanguage(language)
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const currentTheme = useUI.getState().theme
    if (currentTheme === 'system') {
      setTheme('system') // This will re-evaluate the system theme
    }
  })
}
