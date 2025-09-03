import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'

export default function Login() {
  const { t } = useTranslation()
  const { user, loading, error, login, clearError } = useAuth()
  const { language, isRTL } = useUI()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clear error when component unmounts or form changes
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await login(formData.email.trim(), formData.password)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (error) clearError()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            {t('auth.welcomeBack')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.pleaseSignIn')}
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Username/Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-foreground mb-1"
              >
                Username or Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange('email')}
                className="block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Username or Email"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="block w-full px-3 py-2 pr-10 border border-input rounded-md shadow-sm placeholder-muted-foreground bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('auth.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
              <div className="text-xs text-blue-700">
                <p><strong>PMO Director:</strong> ahmed.pmo / password123</p>
                <p><strong>Area Manager:</strong> sara.area / password123</p>
                <p><strong>Project Manager:</strong> omar.project / password123</p>
                <p><strong>Zone Manager:</strong> fatima.zone / password123</p>
                <p><strong>Site Engineer:</strong> khalid.engineer / password123</p>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.password}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  {t('common.loading')}
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('auth.signIn')}
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Language Toggle */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {language === 'en' ? 'العربية' : 'English'}
          </p>
        </div>
      </div>
    </div>
  )
}
