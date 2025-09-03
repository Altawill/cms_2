import React, { Component, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; errorId: string; retry: () => void }>
}

/**
 * Professional Error Boundary Component
 * Provides graceful error handling with recovery options
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.error('Error Boundary caught an error:', error)
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.logErrorToService(error, errorInfo)
    
    this.setState({
      errorInfo
    })
  }

  logErrorToService = (error: Error, errorInfo: any) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    }
    
    console.error('Error Report:', errorReport)
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error!}
            errorId={this.state.errorId}
            retry={this.retry}
          />
        )
      }

      return (
        <ProfessionalErrorFallback
          error={this.state.error!}
          errorId={this.state.errorId}
          retry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

export function ProfessionalErrorFallback({ 
  error, 
  errorId, 
  retry 
}: { 
  error: Error
  errorId: string
  retry: () => void 
}) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isChunkError = error.message.includes('Loading chunk')
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '40px',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '12px',
      border: '2px solid var(--border-light)',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '24px',
        opacity: 0.8
      }}>
        {isNetworkError ? '🌐' : isChunkError ? '📦' : '⚠️'}
      </div>

      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '12px',
        margin: 0
      }}>
        {isNetworkError 
          ? 'Connection Problem • مشكلة في الاتصال'
          : isChunkError 
          ? 'Update Required • مطلوب تحديث'
          : 'Something went wrong • حدث خطأ ما'
        }
      </h2>

      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        marginBottom: '32px',
        lineHeight: '1.6',
        maxWidth: '400px'
      }}>
        {isNetworkError 
          ? 'Please check your internet connection and try again. • يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.'
          : isChunkError
          ? 'The application has been updated. Please refresh the page. • تم تحديث التطبيق. يرجى إعادة تحديث الصفحة.'
          : 'We encountered an unexpected error. Don\'t worry, your data is safe. • واجهنا خطأ غير متوقع. لا تقلق، بياناتك آمنة.'
        }
      </p>

      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={retry}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          🔄 Try Again • حاول مرة أخرى
        </button>

        {isChunkError && (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Page • إعادة تحديث
          </button>
        )}
      </div>

      <details style={{
        marginTop: '32px',
        width: '100%',
        maxWidth: '500px'
      }}>
        <summary style={{
          cursor: 'pointer',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          🔍 Technical Details • التفاصيل التقنية
        </summary>
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          textAlign: 'left'
        }}>
          <strong>Error ID:</strong> {errorId}<br />
          <strong>Message:</strong> {error.message}<br />
          <strong>Time:</strong> {new Date().toISOString()}
        </div>
      </details>
    </div>
  )
}

export default ErrorBoundary
