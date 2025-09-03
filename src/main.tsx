import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import './styles/design-system.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RBACProvider } from './contexts/RBACContext'
import { OrgScopeProvider } from './contexts/OrgScopeContext'
import { I18nProvider } from './i18n/i18nContext'
import { ThemeProvider } from './theme/ThemeProvider'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: 'red' }}>Something went wrong</h1>
          <details>
            <summary>Error details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '10px' }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
function Loading() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f8fafc' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading...</p>
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

// Main app component
function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return user ? <Dashboard /> : <Login />
}

const root = document.getElementById('root') || document.getElementById('app')
if (!root) {
  throw new Error('Root element not found')
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <RBACProvider>
              <OrgScopeProvider>
                <App />
              </OrgScopeProvider>
            </RBACProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
