/**
 * Lazy-Loaded Components with Performance Optimization
 * Reduces bundle size and improves initial load performance
 */

import React, { Suspense } from 'react';
import { lazyWithRetry, usePerformanceMonitor } from '../utils/performance';
import { ResponsiveCard, ResponsiveText } from './layout/ResponsiveLayout';

// Enhanced Loading Component with Performance Monitoring
interface LoadingFallbackProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  componentName?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  componentName 
}) => {
  // Monitor loading performance
  const { start } = usePerformanceMonitor(`loading-${componentName || 'component'}`);
  
  React.useEffect(() => {
    start();
  }, [start]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '24px', height: '24px', borderWidth: '2px' };
      case 'large':
        return { width: '48px', height: '48px', borderWidth: '4px' };
      default:
        return { width: '32px', height: '32px', borderWidth: '3px' };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: size === 'large' ? '48px' : '24px',
      minHeight: size === 'large' ? '200px' : '100px'
    }}>
      <div
        style={{
          ...sizeStyles,
          border: `${sizeStyles.borderWidth} solid var(--border-light)`,
          borderTop: `${sizeStyles.borderWidth} solid var(--accent-primary)`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}
      />
      <ResponsiveText size="sm" color="var(--text-muted)">
        {message}
      </ResponsiveText>
      {componentName && (
        <ResponsiveText size="xs" color="var(--text-disabled)">
          Loading {componentName}...
        </ResponsiveText>
      )}
    </div>
  );
};

// Error Boundary for Lazy Components
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  componentName?: string;
}

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName?: string },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; componentName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Lazy component ${this.props.componentName || 'unknown'} failed to load:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Force component remount by changing key
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ResponsiveCard variant="standard">
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <ResponsiveText size="lg" weight="semibold" color="var(--color-error)">
              Failed to Load Component
            </ResponsiveText>
            <ResponsiveText size="sm" color="var(--text-muted)" style={{ margin: '12px 0' }}>
              {this.props.componentName ? `Component "${this.props.componentName}" ` : 'This component '}
              failed to load. Please check your connection and try again.
            </ResponsiveText>
            {this.state.error && (
              <details style={{ margin: '16px 0', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Technical Details
                </summary>
                <pre style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  overflow: 'auto',
                  marginTop: '8px'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '16px'
              }}
            >
              Retry
            </button>
          </div>
        </ResponsiveCard>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for lazy loading with monitoring
interface LazyWrapperProps {
  componentName: string;
  children: React.ReactNode;
  loadingSize?: 'small' | 'medium' | 'large';
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  componentName, 
  children,
  loadingSize = 'medium'
}) => {
  const { end } = usePerformanceMonitor(`loading-${componentName}`);

  React.useEffect(() => {
    // Component has loaded, end performance monitoring
    const timer = setTimeout(() => {
      end();
    }, 100); // Small delay to ensure component is fully rendered

    return () => clearTimeout(timer);
  }, [end]);

  return (
    <LazyErrorBoundary componentName={componentName}>
      <Suspense 
        fallback={
          <LoadingFallback 
            message={`Loading ${componentName}...`}
            size={loadingSize}
            componentName={componentName}
          />
        }
      >
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

// === LAZY-LOADED COMPONENTS === //

// Dashboard Component
export const LazyDashboard = lazyWithRetry(() => import('../components/Dashboard'));

// Site Management Component
export const LazySiteManagement = lazyWithRetry(() => import('../components/SiteManagement'));

// User Management Component
export const LazyUserManagement = lazyWithRetry(() => import('../components/UserManagement'));

// Role Management Component
export const LazyRoleManagement = lazyWithRetry(() => import('../components/RoleManagement'));

// Settings Component
export const LazySettings = lazyWithRetry(() => import('../components/Settings'));

// Reports Management Component
export const LazyReportsManagement = lazyWithRetry(() => import('../components/ReportsManagement'));

// Employee Management Component
export const LazyEmployeeManagement = lazyWithRetry(() => import('../components/EmployeeManagement'));

// Expenses Management Component
export const LazyExpensesManagement = lazyWithRetry(() => import('../components/ExpensesManagement'));

// Revenues Management Component
export const LazyRevenuesManagement = lazyWithRetry(() => import('../components/RevenuesManagement'));

// Payroll Management Component
export const LazyPayrollManagement = lazyWithRetry(() => import('../components/PayrollManagement'));

// Safes Management Component
export const LazySafesManagement = lazyWithRetry(() => import('../components/SafesManagement'));

// Sites Management Component
export const LazySitesManagement = lazyWithRetry(() => import('../components/SitesManagement'));

// === COMPONENT FACTORY === //

/**
 * Creates a lazy component with proper error boundaries and loading states
 * @param componentName Name of the component for monitoring
 * @param LazyComponent The lazy-loaded component
 * @param loadingSize Size of the loading indicator
 * @returns Wrapped lazy component
 */
export function createLazyComponent<T extends Record<string, any>>(
  componentName: string,
  LazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
  loadingSize: 'small' | 'medium' | 'large' = 'medium'
): React.FC<T> {
  return React.memo((props: T) => (
    <LazyWrapper componentName={componentName} loadingSize={loadingSize}>
      <LazyComponent {...props} />
    </LazyWrapper>
  ));
}

// === OPTIMIZED COMPONENT EXPORTS === //

// Export wrapped components with proper names and monitoring
export const Dashboard = createLazyComponent('Dashboard', LazyDashboard, 'large');
export const SiteManagement = createLazyComponent('SiteManagement', LazySiteManagement, 'medium');
export const UserManagement = createLazyComponent('UserManagement', LazyUserManagement, 'medium');
export const RoleManagement = createLazyComponent('RoleManagement', LazyRoleManagement, 'medium');
export const Settings = createLazyComponent('Settings', LazySettings, 'small');
export const ReportsManagement = createLazyComponent('ReportsManagement', LazyReportsManagement, 'medium');
export const EmployeeManagement = createLazyComponent('EmployeeManagement', LazyEmployeeManagement, 'medium');
export const ExpensesManagement = createLazyComponent('ExpensesManagement', LazyExpensesManagement, 'medium');
export const RevenuesManagement = createLazyComponent('RevenuesManagement', LazyRevenuesManagement, 'medium');
export const PayrollManagement = createLazyComponent('PayrollManagement', LazyPayrollManagement, 'medium');
export const SafesManagement = createLazyComponent('SafesManagement', LazySafesManagement, 'medium');
export const SitesManagement = createLazyComponent('SitesManagement', LazySitesManagement, 'medium');

// === PERFORMANCE MONITORING COMPONENT === //

interface PerformanceStatsProps {
  show?: boolean;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ show = false }) => {
  const [stats, setStats] = React.useState<Record<string, any>>({});
  const [visible, setVisible] = React.useState(show);

  React.useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      const monitor = require('../utils/performance').PerformanceMonitor.getInstance();
      setStats(monitor.getAllMetrics());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible && !show) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          padding: '8px 12px',
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        📊 Perf
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        maxWidth: '300px',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-medium)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '12px',
        zIndex: 1000,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <strong>Performance Stats</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-muted)'
          }}
        >
          ✕
        </button>
      </div>
      
      {Object.keys(stats).length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No metrics recorded yet</div>
      ) : (
        Object.entries(stats).map(([name, data]: [string, any]) => (
          <div key={name} style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {name}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Avg: {data.average.toFixed(2)}ms | Count: {data.count}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// === PRELOADER COMPONENT === //

interface PreloaderProps {
  images?: string[];
  components?: string[];
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ 
  images = [], 
  components = [], 
  onComplete 
}) => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  
  React.useEffect(() => {
    const loadAssets = async () => {
      const { preloadImages } = await import('../utils/performance');
      
      // Preload images
      if (images.length > 0) {
        try {
          await preloadImages(images);
          setLoadingStates(prev => ({ ...prev, images: true }));
        } catch (error) {
          console.warn('Some images failed to preload:', error);
          setLoadingStates(prev => ({ ...prev, images: true }));
        }
      }
      
      // Preload components (warm up lazy loading)
      if (components.length > 0) {
        const componentPromises = components.map(async (componentName) => {
          try {
            // Dynamically import based on component name
            const module = await import(`../components/${componentName}`);
            return module.default || module;
          } catch (error) {
            console.warn(`Failed to preload component ${componentName}:`, error);
            return null;
          }
        });
        
        await Promise.allSettled(componentPromises);
        setLoadingStates(prev => ({ ...prev, components: true }));
      }
      
      onComplete?.();
    };

    loadAssets();
  }, [images, components, onComplete]);

  const totalAssets = (images.length > 0 ? 1 : 0) + (components.length > 0 ? 1 : 0);
  const loadedCount = Object.values(loadingStates).filter(Boolean).length;
  const progress = totalAssets > 0 ? (loadedCount / totalAssets) * 100 : 100;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '200px',
          height: '4px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'var(--accent-primary)',
            transition: 'width 0.3s ease',
            borderRadius: '2px'
          }} />
        </div>
        
        <ResponsiveText size="sm" color="var(--text-secondary)">
          Loading assets... {Math.round(progress)}%
        </ResponsiveText>
        
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          {!loadingStates.images && images.length > 0 && 'Loading images...'}
          {!loadingStates.components && components.length > 0 && 'Preparing components...'}
          {loadedCount === totalAssets && 'Ready!'}
        </div>
      </div>
    </div>
  );
};

export default {
  LazyWrapper,
  LoadingFallback,
  LazyErrorBoundary,
  createLazyComponent,
  Dashboard,
  SiteManagement,
  UserManagement,
  RoleManagement,
  Settings,
  ReportsManagement,
  EmployeeManagement,
  ExpensesManagement,
  RevenuesManagement,
  PayrollManagement,
  SafesManagement,
  SitesManagement,
  PerformanceStats,
  Preloader
};
