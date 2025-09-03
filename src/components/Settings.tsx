import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { settingsService, GlobalSettings } from '../services/settingsService'

interface SettingsContextType {
  theme: 'light' | 'dark'
  language: 'EN' | 'AR'
  currency: string
  dateFormat: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: 'EN' | 'AR') => void
  setCurrency: (currency: string) => void
  setDateFormat: (format: string) => void
  setTimezone: (timezone: string) => void
  setNotifications: (notifications: any) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [language, setLanguage] = useState<'EN' | 'AR'>('EN')
  const [currency, setCurrency] = useState('LYD')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [timezone, setTimezone] = useState('Africa/Tripoli')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    desktop: false
  })

  // Load persisted settings (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.theme) setTheme(parsed.theme)
        if (parsed.language) setLanguage(parsed.language)
        if (parsed.currency) setCurrency(parsed.currency)
        if (parsed.dateFormat) setDateFormat(parsed.dateFormat)
        if (parsed.timezone) setTimezone(parsed.timezone)
        if (parsed.notifications) setNotifications(parsed.notifications)
        // Apply DOM attributes for theme and language immediately
        document.documentElement.setAttribute('data-theme', parsed.theme || 'light')
        document.documentElement.setAttribute('dir', (parsed.language || 'EN') === 'AR' ? 'rtl' : 'ltr')
        document.documentElement.setAttribute('lang', (parsed.language || 'EN') === 'AR' ? 'ar' : 'en')
      }
    } catch {}
  }, [])

  const value = {
    theme,
    language,
    currency,
    dateFormat,
    timezone,
    notifications,
    setTheme,
    setLanguage,
    setCurrency,
    setDateFormat,
    setTimezone,
    setNotifications
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function Settings() {
  const {
    theme,
    language,
    currency,
    dateFormat,
    timezone,
    notifications,
    setTheme,
    setLanguage,
    setCurrency,
    setDateFormat,
    setTimezone,
    setNotifications
  } = useSettings()

  const [activeSection, setActiveSection] = useState('company')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    id: '1',
    companyName: 'Construction Company',
    companyLogo: null,
    currency: 'LYD',
    currencySymbol: 'د.ل',
    taxRate: 0.0,
    language: 'EN',
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Africa/Tripoli',
    address: '',
    phone: '',
    email: '',
    website: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load global settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await settingsService.getSettings()
      setGlobalSettings(settings)
    }
    loadSettings()
  }, [])

  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string, AR: string }> = {
      settings: { EN: 'Settings', AR: 'الإعدادات' },
      appearance: { EN: 'Appearance', AR: 'المظهر' },
      localization: { EN: 'Language & Region', AR: 'اللغة والمنطقة' },
      notifications_menu: { EN: 'Notifications', AR: 'الإشعارات' },
      security: { EN: 'Security', AR: 'الأمان' },
      backup: { EN: 'Backup & Export', AR: 'النسخ الاحتياطي والتصدير' },
      about: { EN: 'About', AR: 'حول' },
      unsaved_changes: { EN: 'You have unsaved changes', AR: 'لديك تغييرات غير محفوظة' },
      reset_defaults: { EN: 'Reset to Defaults', AR: 'إعادة الإعدادات الافتراضية' },
      cancel: { EN: 'Cancel', AR: 'إلغاء' },
      save_changes: { EN: 'Save Changes', AR: 'حفظ التغييرات' },
      appearance_settings: { EN: 'Appearance Settings', AR: 'إعدادات المظهر' },
      theme: { EN: 'Theme', AR: 'السمة' },
      light_mode: { EN: 'Light Mode', AR: 'الوضع الفاتح' },
      light_mode_desc: { EN: 'Clean and bright interface perfect for daytime use', AR: 'واجهة نظيفة ومشرقة مثالية للاستخدام النهاري' },
      dark_mode: { EN: 'Dark Mode', AR: 'الوضع الداكن' },
      dark_mode_desc: { EN: 'Easy on the eyes with reduced strain for long work sessions', AR: 'مريح للعيون مع تقليل الإجهاد لجلسات العمل الطويلة' },
      display_prefs: { EN: 'Display Preferences', AR: 'تفضيلات العرض' },
      compact_mode: { EN: 'Compact Mode', AR: 'الوضع المضغوط' },
      compact_desc: { EN: 'Reduce spacing and padding for more content', AR: 'تقليل المسافات لعرض محتوى أكثر' },
      sidebar_labels: { EN: 'Show Sidebar Labels', AR: 'إظهار عناوين الشريط الجانبي' },
      sidebar_labels_desc: { EN: 'Display text labels next to sidebar icons', AR: 'عرض عناوين نصية بجوار أيقونات الشريط الجانبي' },
      lang_region_settings: { EN: 'Language & Region Settings', AR: 'إعدادات اللغة والمنطقة' },
      language_label: { EN: 'Language', AR: 'اللغة' },
      language_desc: { EN: 'Choose your preferred language for the interface', AR: 'اختر لغتك المفضلة للواجهة' },
      currency_label: { EN: 'Currency', AR: 'العملة' },
      currency_desc: { EN: 'Default currency for financial displays', AR: 'العملة الافتراضية للعرض المالي' },
      date_format: { EN: 'Date Format', AR: 'تنسيق التاريخ' },
      date_format_desc: { EN: 'How dates are displayed throughout the system', AR: 'كيفية عرض التواريخ في النظام' },
      timezone_label: { EN: 'Timezone', AR: 'المنطقة الزمنية' },
      timezone_desc: { EN: 'Your local timezone for scheduling and reports', AR: 'منطقتك الزمنية للمواعيد والتقارير' },
      notif_settings: { EN: 'Notification Settings', AR: 'إعدادات الإشعارات' },
      email_notifs: { EN: 'Email Notifications', AR: 'إشعارات البريد الإلكتروني' },
      email_notifs_desc: { EN: 'Receive important updates and reports via email', AR: 'تلقي التحديثات والتقارير عبر البريد الإلكتروني' },
      push_notifs: { EN: 'Push Notifications', AR: 'إشعارات الدفع' },
      push_notifs_desc: { EN: 'Get instant notifications on your device', AR: 'احصل على إشعارات فورية على جهازك' },
      desktop_notifs: { EN: 'Desktop Notifications', AR: 'إشعارات سطح المكتب' },
      desktop_notifs_desc: { EN: 'Show notifications on your desktop', AR: 'عرض الإشعارات على سطح المكتب' },
      security_settings: { EN: 'Security Settings', AR: 'إعدادات الأمان' },
      change_password: { EN: 'Change Password', AR: 'تغيير كلمة المرور' },
      change_password_desc: { EN: 'Update your account password', AR: 'تحديث كلمة مرور حسابك' },
      enable_2fa: { EN: 'Enable 2FA', AR: 'تفعيل التحقق الثنائي' },
      enable_2fa_desc: { EN: 'Add an extra layer of security to your account', AR: 'أضف طبقة إضافية من الأمان لحسابك' },
      manage_sessions: { EN: 'Manage Sessions', AR: 'إدارة الجلسات' },
      manage_sessions_desc: { EN: 'View and manage your active sessions', AR: 'عرض وإدارة الجلسات النشطة' },
      backup_export_settings: { EN: 'Backup & Export Settings', AR: 'إعدادات النسخ الاحتياطي والتصدير' },
      export_data: { EN: 'Export Data', AR: 'تصدير البيانات' },
      export_data_desc: { EN: 'Download all your data in various formats', AR: 'تحميل كل بياناتك بصيغ مختلفة' },
      export_json: { EN: 'Export JSON', AR: 'تصدير JSON' },
      export_csv: { EN: 'Export CSV', AR: 'تصدير CSV' },
      auto_backup: { EN: 'Auto Backup', AR: 'نسخ احتياطي تلقائي' },
      auto_backup_desc: { EN: 'Automatically backup your data periodically', AR: 'نسخ بياناتك احتياطياً بشكل دوري' },
      last_backup: { EN: 'Last Backup', AR: 'آخر نسخة احتياطية' },
      backup_now: { EN: 'Backup Now', AR: 'نسخ احتياطي الآن' },
      about_title: { EN: 'About', AR: 'حول' },
      check_updates: { EN: 'Check for Updates', AR: 'التحقق من التحديثات' },
      view_docs: { EN: 'View Documentation', AR: 'عرض التوثيق' },
      settings_saved: { EN: 'Settings saved successfully!', AR: 'تم حفظ الإعدادات بنجاح!' },
      reset_confirm: { EN: 'Are you sure you want to reset all settings to default?', AR: 'هل أنت متأكد أنك تريد إعادة جميع الإعدادات للوضع الافتراضي؟' },
      discard_confirm: { EN: 'Discard unsaved changes?', AR: 'هل تريد تجاهل التغييرات غير المحفوظة؟' },
      // Modal translations
      change_password_modal: { EN: 'Change Password', AR: 'تغيير كلمة المرور' },
      current_password: { EN: 'Current password', AR: 'كلمة المرور الحالية' },
      new_password: { EN: 'New password (min 8 chars)', AR: 'كلمة المرور الجديدة (على الأقل 8 أحرف)' },
      confirm_password: { EN: 'Confirm new password', AR: 'تأكيد كلمة المرور الجديدة' },
      update_password: { EN: 'Update Password', AR: 'تحديث كلمة المرور' },
      password_changed: { EN: 'Password changed successfully.', AR: 'تم تغيير كلمة المرور بنجاح.' },
      two_fa_enabled: { EN: 'Two-Factor Authentication enabled.', AR: 'تم تفعيل التحقق ثنائي العوامل.' },
      scan_qr: { EN: 'Scan this QR with your authenticator app, or use the secret key below.', AR: 'امسح رمز QR هذا بتطبيق المصادقة، أو استخدم المفتاح السري أدناه.' },
      enter_code: { EN: 'Enter 6-digit code', AR: 'أدخل الرمز المكون من 6 أرقام' },
      enable: { EN: 'Enable', AR: 'تفعيل' },
      close: { EN: 'Close', AR: 'إغلاق' },
      terminate: { EN: 'Terminate', AR: 'إنهاء' },
      current_session: { EN: '(Current)', AR: '(الحالية)' },
      no_sessions: { EN: 'No other active sessions.', AR: 'لا توجد جلسات نشطة أخرى.' },
      backup_completed: { EN: 'Backup completed successfully.', AR: 'تم إنجاز النسخ الاحتياطي بنجاح.' },
      up_to_date: { EN: 'You are up to date!', AR: 'نظامك محدث!' },
      // Company settings
      company: { EN: 'Company', AR: 'الشركة' },
      company_settings: { EN: 'Company Settings', AR: 'إعدادات الشركة' },
      company_name: { EN: 'Company Name', AR: 'اسم الشركة' },
      company_name_desc: { EN: 'Your company name displayed on reports and documents', AR: 'اسم شركتك المعروض في التقارير والمستندات' },
      company_logo: { EN: 'Company Logo', AR: 'شعار الشركة' },
      company_logo_desc: { EN: 'Upload your company logo for reports and branding', AR: 'ارفع شعار شركتك للتقارير والعلامة التجارية' },
      upload_logo: { EN: 'Upload Logo', AR: 'رفع الشعار' },
      remove_logo: { EN: 'Remove Logo', AR: 'إزالة الشعار' },
      tax_rate: { EN: 'Tax Rate (%)', AR: 'معدل الضريبة (%)' },
      tax_rate_desc: { EN: 'Default tax rate applied to calculations', AR: 'معدل الضريبة الافتراضي المطبق على العمليات الحسابية' }
    }
    return translations[key]?.[language] || fallback || key
  }

  // Local UI preferences not in global context yet
  const [compactMode, setCompactMode] = useState(false)
  const [showSidebarLabels, setShowSidebarLabels] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)

  // Security modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)

  // Snapshot for Cancel behavior
  const [snapshot, setSnapshot] = useState<any | null>(null)
  useEffect(() => {
    // Take initial snapshot from current settings + local prefs
    setSnapshot({
      theme,
      language,
      currency,
      dateFormat,
      timezone,
      notifications,
      compactMode,
      showSidebarLabels,
      autoBackup
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sections = [
    { id: 'company', label: t('company', 'Company'), icon: '🏢' },
    { id: 'appearance', label: t('appearance', 'Appearance'), icon: '🎨' },
    { id: 'localization', label: t('localization', 'Language & Region'), icon: '🌍' },
    { id: 'notifications', label: t('notifications_menu', 'Notifications'), icon: '🔔' },
    { id: 'security', label: t('security', 'Security'), icon: '🔒' },
    { id: 'backup', label: t('backup', 'Backup & Export'), icon: '💾' },
    { id: 'about', label: t('about', 'About'), icon: 'ℹ️' }
  ]

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    setUnsavedChanges(true)
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleLanguageChange = (newLanguage: 'EN' | 'AR') => {
    setLanguage(newLanguage)
    setUnsavedChanges(true)
    // Apply RTL/LTR immediately
    document.documentElement.setAttribute('dir', newLanguage === 'AR' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', newLanguage === 'AR' ? 'ar' : 'en')
  }

  const persistSettings = () => {
    try {
      const toSave = {
        theme,
        language,
        currency,
        dateFormat,
        timezone,
        notifications,
        compactMode,
        showSidebarLabels,
        autoBackup
      }
      localStorage.setItem('app_settings', JSON.stringify(toSave))
    } catch {}
  }

  const saveSettings = () => {
    persistSettings()
    setSnapshot({
      theme,
      language,
      currency,
      dateFormat,
      timezone,
      notifications,
      compactMode,
      showSidebarLabels,
      autoBackup
    })
    setUnsavedChanges(false)
    alert(t('settings_saved', 'Settings saved successfully!'))
  }

  const cancelChanges = () => {
    if (!snapshot) return
    if (!unsavedChanges || confirm(t('discard_confirm', 'Discard unsaved changes?'))) {
      setTheme(snapshot.theme)
      setLanguage(snapshot.language)
      setCurrency(snapshot.currency)
      setDateFormat(snapshot.dateFormat)
      setTimezone(snapshot.timezone)
      setNotifications(snapshot.notifications)
      setCompactMode(snapshot.compactMode)
      setShowSidebarLabels(snapshot.showSidebarLabels)
      setAutoBackup(snapshot.autoBackup)
      document.documentElement.setAttribute('data-theme', snapshot.theme)
      document.documentElement.setAttribute('dir', snapshot.language === 'AR' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', snapshot.language === 'AR' ? 'ar' : 'en')
      setUnsavedChanges(false)
    }
  }

  const resetSettings = () => {
    if (confirm(t('reset_confirm', 'Are you sure you want to reset all settings to default?'))) {
      setTheme('light')
      setLanguage('EN')
      setCurrency('LYD')
      setDateFormat('DD/MM/YYYY')
      setTimezone('Africa/Tripoli')
      setNotifications({ email: true, push: true, desktop: false })
      setCompactMode(false)
      setShowSidebarLabels(true)
      setAutoBackup(true)
      setUnsavedChanges(true)
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.setAttribute('dir', 'ltr')
      document.documentElement.setAttribute('lang', 'en')
    }
  }

  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      settings: {
        theme,
        language,
        currency,
        dateFormat,
        timezone,
        notifications,
        compactMode,
        showSidebarLabels,
        autoBackup
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settings_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const entries = [
      ['theme', theme],
      ['language', language],
      ['currency', currency],
      ['dateFormat', dateFormat],
      ['timezone', timezone],
      ['notifications.email', String(notifications.email)],
      ['notifications.push', String(notifications.push)],
      ['notifications.desktop', String(notifications.desktop)],
      ['compactMode', String(compactMode)],
      ['showSidebarLabels', String(showSidebarLabels)],
      ['autoBackup', String(autoBackup)]
    ]
    const csv = ['key,value', ...entries.map(([k, v]) => `${k},${v}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settings_export_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const backupNow = () => {
    exportJSON()
    alert(t('backup_completed', 'Backup completed successfully.'))
  }

  const checkForUpdates = async () => {
    // Simulated update check
    await new Promise(r => setTimeout(r, 600))
    alert(t('up_to_date', 'You are up to date!'))
  }

  const openDocs = () => {
    window.open('https://example.com/docs', '_blank')
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '24px', 
      height: '100%', 
      direction: language === 'AR' ? 'rtl' : 'ltr',
      flexDirection: 'row'
    }} className="settings-container">
      {/* Sidebar */}
      <div className="card" style={{
        width: '280px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px var(--shadow-light)',
        padding: '20px',
        height: 'fit-content'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
          {t('settings', 'Settings')}
        </h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: activeSection === section.id ? 'var(--accent-primary)20' : 'transparent',
                color: activeSection === section.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeSection === section.id ? '500' : '400',
                textAlign: language === 'AR' ? 'right' : 'left',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = 'var(--border-light)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
        
        {unsavedChanges && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'var(--accent-warning)20',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--accent-warning)'
          }}>
            {t('unsaved_changes', 'You have unsaved changes')}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px var(--shadow-light)',
          padding: '24px'
        }}>
          {activeSection === 'company' && (
            <CompanySettings 
              settings={globalSettings}
              onSettingsChange={(newSettings) => { setGlobalSettings(newSettings); setUnsavedChanges(true) }}
              fileInputRef={fileInputRef}
              t={t}
            />
          )}

          {activeSection === 'appearance' && (
            <AppearanceSettings
              theme={theme}
              onThemeChange={handleThemeChange}
              setUnsavedChanges={setUnsavedChanges}
              compactMode={compactMode}
              onToggleCompact={() => { setCompactMode(v => !v); setUnsavedChanges(true) }}
              showSidebarLabels={showSidebarLabels}
              onToggleSidebarLabels={() => { setShowSidebarLabels(v => !v); setUnsavedChanges(true) }}
              t={t}
            />
          )}
          
          {activeSection === 'localization' && (
            <LocalizationSettings
              language={language}
              currency={currency}
              dateFormat={dateFormat}
              timezone={timezone}
              onLanguageChange={handleLanguageChange}
              onCurrencyChange={(value) => { setCurrency(value); setUnsavedChanges(true) }}
              onDateFormatChange={(value) => { setDateFormat(value); setUnsavedChanges(true) }}
              onTimezoneChange={(value) => { setTimezone(value); setUnsavedChanges(true) }}
              t={t}
            />
          )}

          {activeSection === 'notifications' && (
            <NotificationSettings
              notifications={notifications}
              onNotificationsChange={(value) => { setNotifications(value); setUnsavedChanges(true) }}
              t={t}
            />
          )}

          {activeSection === 'security' && (
            <SecuritySettings 
              onChangePassword={() => setShowPasswordModal(true)}
              onEnable2FA={() => setShow2FAModal(true)}
              onManageSessions={() => setShowSessionsModal(true)}
              t={t}
            />
          )}
          {activeSection === 'backup' && (
            <BackupSettings 
              autoBackup={autoBackup}
              onToggleAutoBackup={() => { setAutoBackup(v => !v); setUnsavedChanges(true) }}
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onBackupNow={backupNow}
              t={t}
            />
          )}
          {activeSection === 'about' && (
            <AboutSettings 
              onCheckUpdates={checkForUpdates}
              onOpenDocs={openDocs}
              t={t}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          padding: '16px 24px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px var(--shadow-light)'
        }}>
          <button
            onClick={resetSettings}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('reset_defaults', 'Reset to Defaults')}
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={cancelChanges}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              onClick={saveSettings}
              disabled={!unsavedChanges}
              style={{
                padding: '10px 20px',
                backgroundColor: unsavedChanges ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                color: unsavedChanges ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                cursor: unsavedChanges ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {t('save_changes', 'Save Changes')}
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)} 
          onSuccess={() => { setShowPasswordModal(false); alert(t('password_changed', 'Password changed successfully.')) }} 
          t={t}
        />
      )}
      {show2FAModal && (
        <TwoFAModal 
          onClose={() => setShow2FAModal(false)} 
          onEnable={() => { setShow2FAModal(false); alert(t('two_fa_enabled', 'Two-Factor Authentication enabled.')) }} 
          t={t}
        />
      )}
      {showSessionsModal && (
        <SessionsModal onClose={() => setShowSessionsModal(false)} t={t} />
      )}
    </div>
  )
}

function AppearanceSettings({ theme, onThemeChange, setUnsavedChanges, compactMode, onToggleCompact, showSidebarLabels, onToggleSidebarLabels, t }: {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  setUnsavedChanges: (value: boolean) => void
  compactMode: boolean
  onToggleCompact: () => void
  showSidebarLabels: boolean
  onToggleSidebarLabels: () => void
  t: (key: string, fallback?: string) => string
}) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('appearance_settings', 'Appearance Settings')}
      </h2>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px', color: 'var(--text-primary)' }}>
          {t('theme', 'Theme')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px' }}>
          <ThemeCard
            title={t('light_mode', 'Light Mode')}
            description={t('light_mode_desc', 'Clean and bright interface perfect for daytime use')}
            icon="☀️"
            isSelected={theme === 'light'}
            onClick={() => onThemeChange('light')}
          />
          <ThemeCard
            title={t('dark_mode', 'Dark Mode')}
            description={t('dark_mode_desc', 'Easy on the eyes with reduced strain for long work sessions')}
            icon="🌙"
            isSelected={theme === 'dark'}
            onClick={() => onThemeChange('dark')}
          />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px', color: 'var(--text-primary)' }}>
          {t('display_prefs', 'Display Preferences')}
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <SettingRow
            label={t('compact_mode', 'Compact Mode')}
            description={t('compact_desc', 'Reduce spacing and padding for more content')}
            control={
              <Switch checked={compactMode} onChange={() => { onToggleCompact(); setUnsavedChanges(true) }} />
            }
          />
          <SettingRow
            label={t('sidebar_labels', 'Show Sidebar Labels')}
            description={t('sidebar_labels_desc', 'Display text labels next to sidebar icons')}
            control={
              <Switch checked={showSidebarLabels} onChange={() => { onToggleSidebarLabels(); setUnsavedChanges(true) }} />
            }
          />
        </div>
      </div>
    </div>
  )
}

function LocalizationSettings({
  language,
  currency,
  dateFormat,
  timezone,
  onLanguageChange,
  onCurrencyChange,
  onDateFormatChange,
  onTimezoneChange,
  t
}: {
  language: 'EN' | 'AR'
  currency: string
  dateFormat: string
  timezone: string
  onLanguageChange: (language: 'EN' | 'AR') => void
  onCurrencyChange: (currency: string) => void
  onDateFormatChange: (format: string) => void
  onTimezoneChange: (timezone: string) => void
  t: (key: string, fallback?: string) => string
}) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('lang_region_settings', 'Language & Region Settings')}
      </h2>

      <div style={{ display: 'grid', gap: '24px' }}>
        <SettingRow
          label={t('language_label', 'Language')}
          description={t('language_desc', 'Choose your preferred language for the interface')}
          control={
            <div style={{ display: 'flex', gap: '12px' }}>
              <LanguageButton
                label={language === 'AR' ? 'الإنجليزية' : 'English'}
                code="EN"
                flag="🇬🇧"
                isSelected={language === 'EN'}
                onClick={() => onLanguageChange('EN')}
              />
              <LanguageButton
                label={language === 'AR' ? 'العربية' : 'Arabic'}
                code="AR"
                flag="🇱🇾"
                isSelected={language === 'AR'}
                onClick={() => onLanguageChange('AR')}
              />
            </div>
          }
        />

        <SettingRow
          label={t('currency_label', 'Currency')}
          description={t('currency_desc', 'Default currency for financial displays')}
          control={
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '120px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="LYD">LYD - Libyan Dinar</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          }
        />

        <SettingRow
          label={t('date_format', 'Date Format')}
          description={t('date_format_desc', 'How dates are displayed throughout the system')}
          control={
            <select
              value={dateFormat}
              onChange={(e) => onDateFormatChange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '150px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD MMM YYYY">DD MMM YYYY</option>
            </select>
          }
        />

        <SettingRow
          label={t('timezone_label', 'Timezone')}
          description={t('timezone_desc', 'Your local timezone for scheduling and reports')}
          control={
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Africa/Tripoli">Africa/Tripoli (GMT+2)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="Europe/London">Europe/London (GMT+1)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          }
        />
      </div>
    </div>
  )
}

function NotificationSettings({ notifications, onNotificationsChange, t }: {
  notifications: any
  onNotificationsChange: (notifications: any) => void
  t: (key: string, fallback?: string) => string
}) {
  const handleToggle = (key: string) => {
    onNotificationsChange({
      ...notifications,
      [key]: !notifications[key]
    })
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('notif_settings', 'Notification Settings')}
      </h2>

      <div style={{ display: 'grid', gap: '24px' }}>
        <SettingRow
          label={t('email_notifs', 'Email Notifications')}
          description={t('email_notifs_desc', 'Receive important updates and reports via email')}
          control={
            <Switch
              checked={notifications.email}
              onChange={() => handleToggle('email')}
            />
          }
        />

        <SettingRow
          label={t('push_notifs', 'Push Notifications')}
          description={t('push_notifs_desc', 'Get instant notifications on your device')}
          control={
            <Switch
              checked={notifications.push}
              onChange={() => handleToggle('push')}
            />
          }
        />

        <SettingRow
          label={t('desktop_notifs', 'Desktop Notifications')}
          description={t('desktop_notifs_desc', 'Show notifications on your desktop')}
          control={
            <Switch
              checked={notifications.desktop}
              onChange={() => handleToggle('desktop')}
            />
          }
        />
      </div>
    </div>
  )
}

function SecuritySettings({ onChangePassword, onEnable2FA, onManageSessions, t }: {
  onChangePassword: () => void
  onEnable2FA: () => void
  onManageSessions: () => void
  t: (key: string, fallback?: string) => string
}) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('security_settings', 'Security Settings')}
      </h2>

      <div style={{ display: 'grid', gap: '24px' }}>
        <SettingRow
          label={t('change_password', 'Change Password')}
          description={t('change_password_desc', 'Update your account password')}
          control={
            <button onClick={onChangePassword} style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              {t('change_password', 'Change Password')}
            </button>
          }
        />

        <SettingRow
          label={t('enable_2fa', 'Enable 2FA')}
          description={t('enable_2fa_desc', 'Add an extra layer of security to your account')}
          control={
            <button onClick={onEnable2FA} style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              {t('enable_2fa', 'Enable 2FA')}
            </button>
          }
        />

        <SettingRow
          label={t('manage_sessions', 'Manage Sessions')}
          description={t('manage_sessions_desc', 'View and manage your active sessions')}
          control={
            <button onClick={onManageSessions} style={{
              padding: '8px 16px',
              backgroundColor: 'var(--text-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              {t('manage_sessions', 'Manage Sessions')}
            </button>
          }
        />
      </div>
    </div>
  )
}

function BackupSettings({ autoBackup, onToggleAutoBackup, onExportJSON, onExportCSV, onBackupNow, t }: {
  autoBackup: boolean
  onToggleAutoBackup: () => void
  onExportJSON: () => void
  onExportCSV: () => void
  onBackupNow: () => void
  t: (key: string, fallback?: string) => string
}) {
  const { language } = useSettings()
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('backup_export_settings', 'Backup & Export Settings')}
      </h2>

      <div style={{ display: 'grid', gap: '24px' }}>
        <SettingRow
          label={t('export_data', 'Export Data')}
          description={t('export_data_desc', 'Download all your data in various formats')}
          control={
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onExportJSON} style={{
                padding: '8px 12px',
                backgroundColor: 'var(--accent-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                {t('export_json', 'Export JSON')}
              </button>
              <button onClick={onExportCSV} style={{
                padding: '8px 12px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                {t('export_csv', 'Export CSV')}
              </button>
            </div>
          }
        />

        <SettingRow
          label={t('auto_backup', 'Auto Backup')}
          description={t('auto_backup_desc', 'Automatically backup your data periodically')}
          control={
            <Switch checked={autoBackup} onChange={onToggleAutoBackup} />
          }
        />

        <SettingRow
          label={t('last_backup', 'Last Backup')}
          description={new Date().toLocaleString(language === 'AR' ? 'ar-LY' : 'en-GB')}
          control={
            <button onClick={onBackupNow} style={{
              padding: '8px 16px',
              backgroundColor: 'var(--text-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              {t('backup_now', 'Backup Now')}
            </button>
          }
        />
      </div>
    </div>
  )
}

function AboutSettings({ onCheckUpdates, onOpenDocs, t }: { onCheckUpdates: () => void, onOpenDocs: () => void, t: (key: string, fallback?: string) => string }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('about_title', 'About')}
      </h2>

      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Construction Management System
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Version 1.0.0
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          A comprehensive management system for construction companies, featuring employee management,
          financial tracking, project oversight, and detailed reporting capabilities.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent-primary)' }}>6</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Management Modules</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent-secondary)' }}>2</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Languages Supported</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent-warning)' }}>∞</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Scalability</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button onClick={onCheckUpdates} style={{
            padding: '8px 16px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            {t('check_updates', 'Check for Updates')}
          </button>
          <button onClick={onOpenDocs} style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            {t('view_docs', 'View Documentation')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components

function ThemeCard({ title, description, icon, isSelected, onClick }: {
  title: string
  description: string
  icon: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--accent-primary)20' : 'var(--bg-primary)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
        {description}
      </p>
    </div>
  )
}

function LanguageButton({ label, code, flag, isSelected, onClick }: {
  label: string
  code: string
  flag: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={code}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
        color: isSelected ? 'white' : 'var(--text-secondary)',
        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s ease'
      }}
    >
      <span>{flag}</span>
      <span>{label}</span>
    </button>
  )
}

function SettingRow({ label, description, control }: {
  label: string
  description: string
  control: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--text-primary)' }}>
          {label}
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
          {description}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        {control}
      </div>
    </div>
  )
}

function PasswordModal({ onClose, onSuccess, t }: { onClose: () => void, onSuccess: () => void, t: (key: string, fallback?: string) => string }) {
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const canSubmit = newPwd.length >= 8 && newPwd === confirmPwd && oldPwd.length > 0
  return (
    <Modal title={t('change_password_modal', 'Change Password')} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('current_password', 'Current password')}</span>
          <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('new_password', 'New password (min 8 chars)')}</span>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('confirm_password', 'Confirm new password')}</span>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>{t('cancel', 'Cancel')}</button>
          <button disabled={!canSubmit} onClick={onSuccess} style={{ padding: '8px 12px', background: canSubmit ? '#3b82f6' : '#e5e7eb', color: canSubmit ? 'white' : '#9ca3af', border: 'none', borderRadius: 6, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>{t('update_password', 'Update Password')}</button>
        </div>
      </div>
    </Modal>
  )
}

function TwoFAModal({ onClose, onEnable, t }: { onClose: () => void, onEnable: () => void, t: (key: string, fallback?: string) => string }) {
  const secret = 'ABCD-EFGH-IJKL'
  return (
    <Modal title={t('enable_2fa', 'Enable Two-Factor Authentication')} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{t('scan_qr', 'Scan this QR with your authenticator app, or use the secret key below.')}</p>
        <div style={{ alignSelf: 'center', width: 160, height: 160, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          QR CODE
        </div>
        <code style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: 6, display: 'inline-block' }}>{secret}</code>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('enter_code', 'Enter 6-digit code')}</span>
          <input type="text" placeholder="123456" maxLength={6} style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: 140 }} />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>{t('cancel', 'Cancel')}</button>
          <button onClick={onEnable} style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{t('enable', 'Enable')}</button>
        </div>
      </div>
    </Modal>
  )
}

function SessionsModal({ onClose, t }: { onClose: () => void, t: (key: string, fallback?: string) => string }) {
  const [sessions, setSessions] = useState([
    { id: 'sess_1', device: 'Chrome on Windows', ip: '192.168.1.10', lastActive: 'Just now', current: true },
    { id: 'sess_2', device: 'Safari on iPhone', ip: '192.168.1.23', lastActive: '2 hours ago', current: false }
  ])
  const terminate = (id: string) => setSessions(s => s.filter(x => x.id !== id))
  return (
    <Modal title={t('manage_sessions', 'Active Sessions')} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        {sessions.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb', padding: '10px 12px', borderRadius: 6 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.device} {s.current ? t('current_session', '(Current)') : ''}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>IP {s.ip} • {s.lastActive}</div>
            </div>
            {!s.current && (
              <button onClick={() => terminate(s.id)} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{t('terminate', 'Terminate')}</button>
            )}
          </div>
        ))}
        {sessions.length <= 1 && (
          <div style={{ fontSize: 12, color: '#64748b' }}>{t('no_sessions', 'No other active sessions.')}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>{t('close', 'Close')}</button>
        </div>
      </div>
    </Modal>
  )
}

function Switch({ checked, onChange }: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <label style={{ 
      position: 'relative', 
      display: 'inline-block', 
      width: '48px', 
      height: '24px',
      cursor: 'pointer'
    }}>
      <input 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? '#3b82f6' : '#ccc',
        transition: '.4s',
        borderRadius: '24px'
      }}>
        <span style={{
          position: 'absolute',
          content: '""',
          height: '18px',
          width: '18px',
          left: checked ? '26px' : '3px',
          bottom: '3px',
          backgroundColor: 'white',
          transition: '.4s',
          borderRadius: '50%'
        }} />
      </span>
    </label>
  )
}

function CompanySettings({ settings, onSettingsChange, fileInputRef, t }: {
  settings: GlobalSettings
  onSettingsChange: (settings: GlobalSettings) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  t: (key: string, fallback?: string) => string
}) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onSettingsChange({
        ...settings,
        companyLogo: result
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    onSettingsChange({
      ...settings,
      companyLogo: null
    })
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        {t('company_settings', 'Company Settings')}
      </h2>

      <div style={{ display: 'grid', gap: '24px' }}>
        <SettingRow
          label={t('company_name', 'Company Name')}
          description={t('company_name_desc', 'Your company name displayed on reports and documents')}
          control={
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => onSettingsChange({ ...settings, companyName: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          }
        />

        <SettingRow
          label={t('company_logo', 'Company Logo')}
          description={t('company_logo_desc', 'Upload your company logo for reports and branding')}
          control={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
              {settings.companyLogo && (
                <div style={{
                  width: '80px',
                  height: '80px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  <img
                    src={settings.companyLogo}
                    alt="Company Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {t('upload_logo', 'Upload Logo')}
                </button>
                {settings.companyLogo && (
                  <button
                    onClick={handleRemoveLogo}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {t('remove_logo', 'Remove Logo')}
                  </button>
                )}
              </div>
            </div>
          }
        />

        <SettingRow
          label={t('tax_rate', 'Tax Rate (%)')}
          description={t('tax_rate_desc', 'Default tax rate applied to calculations')}
          control={
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.taxRate}
              onChange={(e) => onSettingsChange({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                width: '100px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          }
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}

// Simple modals for Security actions
function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0 as any, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 8, width: 480, maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Settings
