import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load theme from localStorage or default to 'system'
    const saved = localStorage.getItem('app_theme')
    return (saved as Theme) || 'system'
  })

  const [isDarkMode, setIsDarkMode] = useState(false)

  // Determine if dark mode should be active
  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false

      if (theme === 'dark') {
        shouldBeDark = true
      } else if (theme === 'light') {
        shouldBeDark = false
      } else {
        // System preference
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }

      setIsDarkMode(shouldBeDark)
      
      // Apply theme to document
      if (shouldBeDark) {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }

    updateTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('app_theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme switcher component
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, isDarkMode } = useTheme()

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={() => setTheme('light')}
        style={{
          padding: '6px 8px',
          background: theme === 'light' ? 'var(--accent-primary)' : 'transparent',
          color: theme === 'light' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'var(--transition-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Light Mode"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('system')}
        style={{
          padding: '6px 8px',
          background: theme === 'system' ? 'var(--accent-primary)' : 'transparent',
          color: theme === 'system' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'var(--transition-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="System Preference"
      >
        💻
      </button>
      <button
        onClick={() => setTheme('dark')}
        style={{
          padding: '6px 8px',
          background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent',
          color: theme === 'dark' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'var(--transition-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Dark Mode"
      >
        🌙
      </button>
    </div>
  )
}

export default ThemeProvider
