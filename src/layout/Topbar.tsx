import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Menu, 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Monitor,
  Globe,
  User,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'
import { settingsRepo } from '../services/repository'
import type { Settings } from '../types'

export default function Topbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { 
    theme, 
    language, 
    isRTL,
    sidebarCollapsed, 
    mobileSidebarOpen,
    notifications,
    setTheme,
    setLanguage,
    toggleSidebar,
    setMobileSidebarOpen 
  } = useUI()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  // Load company logo
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsRepo.getAll() as Settings[]
        if (settings.length > 0 && settings[0].logoUrl) {
          setCompanyLogo(settings[0].logoUrl)
        }
      } catch (error) {
        console.error('Failed to load company settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      {/* Left side - Menu and Logo */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-md hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Company Logo - Centered */}
        <div className="flex-1 flex justify-center lg:justify-start">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MS</span>
            </div>
          )}
        </div>
      </div>

      {/* Center - Search (Desktop only) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* Right side - Actions and User Menu */}
      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-md hover:bg-muted transition-colors relative">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="relative group">
          <button className="p-2 rounded-md hover:bg-muted transition-colors">
            {getThemeIcon()}
          </button>
          <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <button
              onClick={() => handleThemeChange('light')}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Language Toggle */}
        <button
          onClick={handleLanguageToggle}
          className="p-2 rounded-md hover:bg-muted transition-colors flex items-center space-x-1"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">
            {language === 'en' ? 'EN' : 'عر'}
          </span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="hidden sm:inline text-sm font-medium">
              {user?.name}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                </div>
                
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{t('common.profile')}</span>
                </button>
                
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>{t('common.settings')}</span>
                </button>
                
                <div className="border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
