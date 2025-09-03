import React, { useState, useEffect } from 'react'
import { I18nProvider, LanguageSwitcher } from '../i18n/i18nContext'
import { ThemeProvider, ThemeSwitcher } from '../theme/ThemeProvider'
import { useI18n } from '../i18n/i18nContext'
import { LogoManager } from '../components/LogoManager'
import { RBACProvider } from '../contexts/RBACContext'
import { AuthProvider } from '../contexts/AuthContext'
import { ProtectedComponent } from '../contexts/RBACContext'
import { OrgScopeProvider } from '../contexts/OrgScopeContext'
import { OrgSwitcher } from '../components/OrgSwitcher'
// Import optimized lazy components
import { 
  SiteManagement, 
  UserManagement,
  PerformanceStats 
} from '../components/LazyComponents'
// Import Dashboard (updated without MUI dependencies)
import { MUIDashboard } from '../components/MUIDashboard'
import { ReportsManagement } from '../components/ReportsManagement'
import Approvals from '../pages/Approvals'
import { settingsService, GlobalSettings } from '../services/settingsService'
import { ResponsiveLayout, ResponsiveStack, ResponsiveCard, ResponsiveText, ResponsiveButton } from '../components/layout/ResponsiveLayout'
import { useResponsive, flex } from '../utils/responsive'

// Inject mobile animations and responsive styles
const mobileAnimations = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideInRTL {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive breakpoints for better mobile handling */
@media (max-width: 640px) {
  .mobile-hidden {
    display: none !important;
  }
  
  .mobile-full-width {
    width: 100% !important;
  }
  
  .mobile-text-center {
    text-align: center !important;
  }
}

@media (max-width: 768px) {
  .tablet-hidden {
    display: none !important;
  }
  
  .tablet-compact {
    padding: 8px 12px !important;
    font-size: 14px !important;
  }
}

/* Perfect mobile menu overlay */
.mobile-overlay {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Smooth transitions for all interactive elements */
* {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

/* Enhanced focus styles for accessibility */
button:focus-visible, 
input:focus-visible, 
select:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('mobile-responsive-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mobile-responsive-styles';
    styleSheet.textContent = mobileAnimations;
    document.head.appendChild(styleSheet);
  }
}

// Header component with navigation and controls
function AppHeader({ 
  currentView, 
  setCurrentView, 
  selectedSiteId, 
  onBackToSites 
}: { 
  currentView: string; 
  setCurrentView: (view: string) => void;
  selectedSiteId?: string | null;
  onBackToSites?: () => void;
}) {
  const { t, isRTL } = useI18n()
  const { isMobile, isTablet, screenSize } = useResponsive()
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => settingsService.getSettings())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load global settings and listen for updates
  useEffect(() => {
    const loadSettings = () => {
      const settings = settingsService.getSettings()
      setGlobalSettings(settings)
    }
    loadSettings()
    
    // Listen for storage changes to sync settings across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'management_system_settings') {
        loadSettings()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'sites', label: 'Site Management', icon: '🏗️' },
    { id: 'users', label: 'User Management', icon: '👥', permission: 'users' },
    { id: 'employees', label: 'Employee Management', icon: '👷', permission: 'employees' },
    { id: 'approvals', label: 'Approvals', icon: '✅', permission: 'approvals' },
    { id: 'equipment', label: 'Equipment', icon: '⚡', permission: 'sites' },
    { id: 'financial', label: 'Financial', icon: '💰', permission: 'expenses' },
    { id: 'reports', label: 'Reports', icon: '📋', permission: 'reports' },
    { id: 'payroll', label: 'Payroll', icon: '💼', permission: 'payroll' },
    { id: 'safes', label: 'Safes', icon: '🔒', permission: 'safes' },
    { id: 'revenues', label: 'Revenues', icon: '📈', permission: 'revenues' },
    { id: 'settings', label: 'Settings', icon: '⚙️', permission: 'settings' }
  ]

  return (
    <>
      <header style={{
        background: 'var(--gradient-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        direction: isRTL ? 'rtl' : 'ltr',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        {/* Left Section - Company Branding */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '12px' : '16px',
          flex: isMobile ? '1' : 'auto',
          minWidth: 0
        }}>
          {/* Company Logo */}
          {globalSettings.companyLogo ? (
            <img 
              src={globalSettings.companyLogo} 
              alt="Company Logo"
              style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '2px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '20px' : '24px',
              flexShrink: 0
            }}>
              🏗️
            </div>
          )}
          
          {!isMobile && (
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                margin: 0,
                fontSize: isTablet ? '20px' : '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {globalSettings.companyName || (isRTL ? 'نظام إدارة البناء' : 'Construction Management')}
              </h1>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: '400',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {isRTL ? 'نظام إدارة شامل للمواقع الإنشائية' : 'Complete Construction Management System'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
            {navigationItems.map(item => {
              const NavButton = ({ children }: { children: React.ReactNode }) => (
                <button
                  onClick={() => setCurrentView(item.id)}
                  style={{
                    padding: isTablet ? '6px 12px' : '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: currentView === item.id ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: currentView === item.id ? 'white' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (currentView !== item.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentView !== item.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  {!isTablet && item.label}
                </button>
              );

              if (item.permission) {
                return (
                  <ProtectedComponent key={item.id} resource={item.permission as any} action="read">
                    <NavButton>{item.label}</NavButton>
                  </ProtectedComponent>
                )
              }
              return <NavButton key={item.id}>{item.label}</NavButton>
            })}
          </nav>
        )}
        
        {/* Right Section - Controls */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '8px' : '12px',
          flexShrink: 0
        }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <ResponsiveButton
              size="sm"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              icon={<span style={{ fontSize: '18px' }}>{mobileMenuOpen ? '✕' : '☰'}</span>}
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </ResponsiveButton>
          )}

          {/* Settings Controls - Hidden on mobile, shown in mobile menu */}
          <div style={{ 
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            gap: isTablet ? '8px' : '12px'
          }}>
            {/* Logo Upload */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isTablet ? '6px' : '8px',
              padding: isTablet ? '6px 8px' : '8px 12px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {!isTablet && (
                <span style={{ 
                  fontSize: '10px', 
                  color: 'var(--text-muted)', 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {isRTL ? 'الشعار' : 'Logo'}
                </span>
              )}
              <LogoManager size="small" showUpload={true} />
            </div>
            
            {/* Language Switcher */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isTablet ? '6px' : '8px',
              padding: isTablet ? '6px 8px' : '8px 12px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {!isTablet && (
                <span style={{ 
                  fontSize: '10px', 
                  color: 'var(--text-muted)', 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {isRTL ? 'اللغة' : 'Language'}
                </span>
              )}
              <LanguageSwitcher />
            </div>
            
            {/* Theme Switcher */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isTablet ? '6px' : '8px',
              padding: isTablet ? '6px 8px' : '8px 12px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {!isTablet && (
                <span style={{ 
                  fontSize: '10px', 
                  color: 'var(--text-muted)', 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {isRTL ? 'المظهر' : 'Theme'}
                </span>
              )}
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div 
            style={{
              position: 'absolute',
              top: '0',
              right: isRTL ? 'auto' : '0',
              left: isRTL ? '0' : 'auto',
              width: '280px',
              height: '100vh',
              backgroundColor: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-lg)',
              padding: '20px',
              overflowY: 'auto',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {/* Company Info */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {globalSettings.companyName || (isRTL ? 'نظام إدارة البناء' : 'Construction Management')}
              </h2>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                {isRTL ? 'نظام إدارة شامل' : 'Management System'}
              </p>
            </div>

            {/* Navigation Menu */}
            <nav style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {isRTL ? 'التنقل' : 'Navigation'}
              </h3>
              {navigationItems.map(item => {
                const MobileNavButton = () => (
                  <button
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      margin: '4px 0',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: currentView === item.id ? 'var(--accent-primary)' : 'transparent',
                      color: currentView === item.id ? 'white' : 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    {item.label}
                  </button>
                );

                if (item.permission) {
                  return (
                    <ProtectedComponent key={item.id} resource={item.permission as any} action="read">
                      <MobileNavButton />
                    </ProtectedComponent>
                  )
                }
                return <MobileNavButton key={item.id} />
              })}
            </nav>

            {/* Settings Section */}
            <div>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {isRTL ? 'الإعدادات' : 'Settings'}
              </h3>
              
              <ResponsiveStack spacing="12px" direction="column">
                <ResponsiveCard variant="compact">
                  <ResponsiveStack justify="between" align="center">
                    <ResponsiveText size="sm" weight="medium">
                      {isRTL ? 'الشعار' : 'Company Logo'}
                    </ResponsiveText>
                    <LogoManager size="small" showUpload={true} />
                  </ResponsiveStack>
                </ResponsiveCard>
                
                <ResponsiveCard variant="compact">
                  <ResponsiveStack justify="between" align="center">
                    <ResponsiveText size="sm" weight="medium">
                      {isRTL ? 'اللغة' : 'Language'}
                    </ResponsiveText>
                    <LanguageSwitcher />
                  </ResponsiveStack>
                </ResponsiveCard>
                
                <ResponsiveCard variant="compact">
                  <ResponsiveStack justify="between" align="center">
                    <ResponsiveText size="sm" weight="medium">
                      {isRTL ? 'المظهر' : 'Theme'}
                    </ResponsiveText>
                    <ThemeSwitcher />
                  </ResponsiveStack>
                </ResponsiveCard>
              </ResponsiveStack>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Main App Content
function AppContent() {
  const { isRTL, dir } = useI18n()
  const { isMobile, isTablet } = useResponsive()
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <MUIDashboard />
      case 'sites':
        return <SiteManagement onSelectSite={setSelectedSiteId} selectedSiteId={selectedSiteId} />
      case 'users':
        return <UserManagement />
      case 'employees':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Employee Management</h2>
          <p>Employee management features coming soon...</p>
        </div>
      case 'approvals':
        return <Approvals />
      case 'equipment':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Equipment Management</h2>
          <p>Equipment tracking and management features coming soon...</p>
        </div>
      case 'financial':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Financial Management</h2>
          <p>Financial tracking, budgets, and expenses coming soon...</p>
        </div>
      case 'reports':
        return <ReportsManagement />
      case 'payroll':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Payroll Management</h2>
          <p>Employee payroll and salary management coming soon...</p>
        </div>
      case 'safes':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Safe Management</h2>
          <p>Cash and safe management system coming soon...</p>
        </div>
      case 'revenues':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Revenue Management</h2>
          <p>Revenue tracking and management coming soon...</p>
        </div>
      case 'settings':
        return <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>System Settings</h2>
          <p>System configuration and settings coming soon...</p>
        </div>
      default:
        return <MUIDashboard />
    }
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      direction: dir
    }}>
      <AppHeader 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        selectedSiteId={selectedSiteId}
        onBackToSites={() => setSelectedSiteId(null)}
      />
      
      {/* Org Switcher for privileged roles */}
      <div style={{ padding: '8px 16px' }}>
        <OrgSwitcher />
      </div>
      
      {/* Responsive Main Content */}
      <ResponsiveLayout maxWidth={1400} padding={true}>
        <main style={{
          padding: isMobile ? '16px 0' : isTablet ? '24px 0' : '32px 0',
          minHeight: 'calc(100vh - 200px)', // Account for header and footer
          transition: 'padding 0.3s ease'
        }}>
          {renderContent()}
        </main>
      </ResponsiveLayout>
      
      {/* Footer */}
      <footer style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            {isRTL 
              ? '© 2024 نظام إدارة مواقع البناء. جميع الحقوق محفوظة.' 
              : '© 2024 Construction Site Management System. All rights reserved.'
            }
          </p>
          <p style={{ margin: '0', fontSize: '12px', opacity: 0.8 }}>
            {isRTL
              ? 'تم التطوير باستخدام React وTypeScript'
              : 'Built with React & TypeScript'
            }
          </p>
        </div>
      </footer>
      
      {/* Performance Stats - Always visible */}
      <PerformanceStats />
    </div>
  )
}

// Main App Component with Providers
function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <RBACProvider>
            <OrgScopeProvider>
              <AppContent />
            </OrgScopeProvider>
          </RBACProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
