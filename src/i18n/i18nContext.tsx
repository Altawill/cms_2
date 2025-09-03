import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, Translations, translations } from './translations'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  isRTL: boolean
  dir: 'ltr' | 'rtl'
  formatNumber: (num: number) => string
  formatCurrency: (amount: number, currency?: string) => string
  formatDate: (date: string | Date) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load language from localStorage or default to 'en'
    const saved = localStorage.getItem('app_language')
    return (saved as Language) || 'en'
  })

  const isRTL = language === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'
  const t = translations[language]

  // Save language preference and update document direction
  useEffect(() => {
    localStorage.setItem('app_language', language)
    document.documentElement.dir = dir
    document.documentElement.lang = language
    
    // Update CSS custom property for RTL support
    document.documentElement.style.setProperty('--direction', dir)
    document.documentElement.style.setProperty('--start', isRTL ? 'right' : 'left')
    document.documentElement.style.setProperty('--end', isRTL ? 'left' : 'right')
  }, [language, dir, isRTL])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  // Format numbers based on locale
  const formatNumber = (num: number): string => {
    if (language === 'ar') {
      // Arabic numerals
      return new Intl.NumberFormat('ar-LY').format(num)
    }
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Format currency with proper locale
  const formatCurrency = (amount: number, currency: string = 'LYD'): string => {
    if (language === 'ar') {
      return `${formatNumber(amount)} ${currency}`
    }
    return `${formatNumber(amount)} ${currency}`
  }

  // Format dates based on locale
  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (language === 'ar') {
      return new Intl.DateTimeFormat('ar-LY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj)
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj)
  }

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    isRTL,
    dir,
    formatNumber,
    formatCurrency,
    formatDate
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Hook for translation function only
export function useTranslation() {
  const { t } = useI18n()
  return t
}

// Language switcher component
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, isRTL } = useI18n()

  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <button
        onClick={() => setLanguage('en')}
        style={{
          padding: '6px 12px',
          background: language === 'en' ? 'var(--accent-primary)' : 'transparent',
          color: language === 'en' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: language === 'en' ? '600' : '400',
          transition: 'var(--transition-normal)'
        }}
      >
        🇺🇸 EN
      </button>
      <button
        onClick={() => setLanguage('ar')}
        style={{
          padding: '6px 12px',
          background: language === 'ar' ? 'var(--accent-primary)' : 'transparent',
          color: language === 'ar' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: language === 'ar' ? '600' : '400',
          transition: 'var(--transition-normal)'
        }}
      >
        🇱🇾 AR
      </button>
    </div>
  )
}

export default I18nProvider
