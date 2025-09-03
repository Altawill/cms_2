import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFormSubmission } from '../hooks/useFormSubmission'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error } = useAuth()
  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({ 
    debounceMs: 1500,  // Longer debounce for login to prevent accidental double attempts
    showLoading: false  // We'll use the auth context loading state
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await protectedSubmit(async () => {
      if (email && password) {
        await login(email, password)
      }
    })
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', 
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Management System
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '500',
              color: '#374151',
              fontSize: '14px'
            }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.15s ease-in-out',
                outline: 'none'
              }} 
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="admin@example.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '500',
              color: '#374151',
              fontSize: '14px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  paddingRight: '40px',
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }} 
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                placeholder="password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '12px'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              color: '#0c4a6e'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>💡 Demo Credentials:</div>
              <div style={{ marginBottom: '4px' }}>• <strong>admin@example.com</strong> - Full Admin Access</div>
              <div style={{ marginBottom: '4px' }}>• <strong>manager@example.com</strong> - Project Manager</div>
              <div style={{ marginBottom: '4px' }}>• <strong>user@example.com</strong> - Regular Employee</div>
              <div style={{ marginBottom: '4px' }}>• <strong>hr@example.com</strong> - HR Manager</div>
              <div style={{ fontStyle: 'italic', marginTop: '6px' }}>Password: <strong>"password"</strong> for all accounts</div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || isSubmitting || !email || !password}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: loading || isSubmitting || !email || !password ? '#9ca3af' : '#3b82f6',
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading || isSubmitting || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {(loading || isSubmitting) && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {(loading || isSubmitting) ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
