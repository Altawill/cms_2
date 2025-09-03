/**
 * Perfect Responsive Design System
 * Provides comprehensive breakpoint management and responsive utilities
 */

export const breakpoints = {
  xs: 320,
  sm: 640, 
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
} as const

export type Breakpoint = keyof typeof breakpoints

// Media query utilities
export const media = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  xxl: `(min-width: ${breakpoints.xxl}px)`,
  
  // Max width queries
  maxXs: `(max-width: ${breakpoints.xs - 1}px)`,
  maxSm: `(max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `(max-width: ${breakpoints.md - 1}px)`,
  maxLg: `(max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `(max-width: ${breakpoints.xl - 1}px)`,
  
  // Between queries
  smToMd: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  mdToLg: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lgToXl: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
} as const

// Responsive grid utilities
export const getResponsiveGrid = (
  columns: Partial<Record<Breakpoint, number>> = { xs: 1, sm: 2, md: 3, lg: 4 }
): React.CSSProperties => {
  const baseColumns = columns.xs || 1
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${baseColumns}, 1fr)`,
    gap: '16px',
    width: '100%',
    
    // Apply responsive columns via CSS custom properties
    [`@media ${media.sm}`]: {
      gridTemplateColumns: `repeat(${columns.sm || baseColumns}, 1fr)`
    },
    [`@media ${media.md}`]: {
      gridTemplateColumns: `repeat(${columns.md || columns.sm || baseColumns}, 1fr)`
    },
    [`@media ${media.lg}`]: {
      gridTemplateColumns: `repeat(${columns.lg || columns.md || columns.sm || baseColumns}, 1fr)`
    },
    [`@media ${media.xl}`]: {
      gridTemplateColumns: `repeat(${columns.xl || columns.lg || columns.md || columns.sm || baseColumns}, 1fr)`
    }
  } as React.CSSProperties
}

// Responsive spacing system
export const spacing = {
  xs: '4px',
  sm: '8px', 
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px'
} as const

// Responsive typography
export const typography = {
  xs: { fontSize: '12px', lineHeight: '16px' },
  sm: { fontSize: '14px', lineHeight: '20px' },
  base: { fontSize: '16px', lineHeight: '24px' },
  lg: { fontSize: '18px', lineHeight: '28px' },
  xl: { fontSize: '20px', lineHeight: '32px' },
  xxl: { fontSize: '24px', lineHeight: '36px' },
  xxxl: { fontSize: '32px', lineHeight: '48px' }
} as const

// Perfect container styles with responsive padding
export const getContainerStyle = (maxWidth?: number): React.CSSProperties => ({
  width: '100%',
  maxWidth: maxWidth ? `${maxWidth}px` : '1200px',
  margin: '0 auto',
  padding: '0 16px',
  boxSizing: 'border-box',
  
  [`@media ${media.sm}`]: {
    padding: '0 24px'
  },
  [`@media ${media.lg}`]: {
    padding: '0 32px'
  }
} as React.CSSProperties)

// Responsive card layout
export const getCardStyle = (
  variant: 'compact' | 'standard' | 'spacious' = 'standard'
): React.CSSProperties => {
  const variants = {
    compact: { padding: '12px', borderRadius: '8px' },
    standard: { padding: '16px 20px', borderRadius: '12px' },
    spacious: { padding: '24px 32px', borderRadius: '16px' }
  }
  
  const base = variants[variant]
  
  return {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
    ...base,
    
    [`@media ${media.maxSm}`]: {
      padding: variant === 'spacious' ? '16px 20px' : base.padding,
      borderRadius: '8px'
    }
  } as React.CSSProperties
}

// Responsive button styles
export const getButtonStyle = (
  size: 'sm' | 'md' | 'lg' = 'md',
  fullWidth = false
): React.CSSProperties => {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 24px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' }
  }
  
  return {
    ...sizes[size],
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    boxSizing: 'border-box',
    
    [`@media ${media.maxSm}`]: {
      width: fullWidth || size === 'lg' ? '100%' : 'auto',
      padding: '12px 20px',
      fontSize: '16px'
    }
  } as React.CSSProperties
}

// React hook for responsive behavior
export function useResponsive() {
  const [screenSize, setScreenSize] = React.useState<Breakpoint>('md')
  const [windowSize, setWindowSize] = React.useState({ width: 1024, height: 768 })
  
  React.useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })
      
      if (width >= breakpoints.xxl) setScreenSize('xxl')
      else if (width >= breakpoints.xl) setScreenSize('xl')
      else if (width >= breakpoints.lg) setScreenSize('lg')
      else if (width >= breakpoints.md) setScreenSize('md')
      else if (width >= breakpoints.sm) setScreenSize('sm')
      else setScreenSize('xs')
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  
  const isMobile = screenSize === 'xs' || screenSize === 'sm'
  const isTablet = screenSize === 'md'
  const isDesktop = screenSize === 'lg' || screenSize === 'xl' || screenSize === 'xxl'
  
  return {
    screenSize,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    // Utility functions
    isAtLeast: (breakpoint: Breakpoint) => windowSize.width >= breakpoints[breakpoint],
    isAtMost: (breakpoint: Breakpoint) => windowSize.width <= breakpoints[breakpoint],
    isBetween: (min: Breakpoint, max: Breakpoint) => 
      windowSize.width >= breakpoints[min] && windowSize.width <= breakpoints[max]
  }
}

// Perfect flex utilities
export const flex = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerY: {
    display: 'flex',
    alignItems: 'center'
  },
  centerX: {
    display: 'flex',
    justifyContent: 'center'
  },
  between: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  column: {
    display: 'flex',
    flexDirection: 'column'
  },
  wrap: {
    display: 'flex',
    flexWrap: 'wrap'
  }
} as const

// Responsive helper functions
export const responsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint,
  fallback: T
): T => {
  // Try current breakpoint first
  if (values[currentBreakpoint] !== undefined) {
    return values[currentBreakpoint]!
  }
  
  // Fallback to smaller breakpoints
  const breakpointOrder: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs']
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]!
    }
  }
  
  return fallback
}

// Grid system for perfect layouts
export const gridSystem = {
  container: getContainerStyle(),
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 -8px'
  } as React.CSSProperties,
  col: (span: number, total = 12) => ({
    flex: `0 0 ${(span / total) * 100}%`,
    maxWidth: `${(span / total) * 100}%`,
    padding: '0 8px',
    boxSizing: 'border-box'
  } as React.CSSProperties)
}

import React from 'react'
