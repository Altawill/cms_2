import React from 'react';
import { useResponsive, getContainerStyle, flex } from '../../utils/responsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: boolean;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth,
  padding = true,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const containerStyle: React.CSSProperties = {
    ...getContainerStyle(maxWidth),
    padding: padding ? (isMobile ? '0 12px' : isTablet ? '0 20px' : '0 24px') : '0',
    transition: 'all 0.3s ease'
  };

  return (
    <div 
      className={`responsive-layout ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = '16px',
  className = ''
}) => {
  const { screenSize, isMobile } = useResponsive();

  // Determine current column count
  const getCurrentColumns = () => {
    if (columns.xl && screenSize === 'xxl') return columns.xl;
    if (columns.xl && screenSize === 'xl') return columns.xl;
    if (columns.lg && (screenSize === 'lg' || screenSize === 'xl' || screenSize === 'xxl')) return columns.lg;
    if (columns.md && (screenSize === 'md' || screenSize === 'lg' || screenSize === 'xl' || screenSize === 'xxl')) return columns.md;
    if (columns.sm && (screenSize === 'sm' || screenSize === 'md' || screenSize === 'lg' || screenSize === 'xl' || screenSize === 'xxl')) return columns.sm;
    return columns.xs || 1;
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${getCurrentColumns()}, 1fr)`,
    gap: isMobile ? '12px' : gap,
    width: '100%',
    transition: 'all 0.3s ease'
  };

  return (
    <div 
      className={`responsive-grid ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  variant?: 'compact' | 'standard' | 'spacious';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  variant = 'standard',
  hover = false,
  className = '',
  onClick
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getPadding = () => {
    if (isMobile) {
      return variant === 'compact' ? '8px 12px' : variant === 'spacious' ? '16px 20px' : '12px 16px';
    }
    if (isTablet) {
      return variant === 'compact' ? '10px 14px' : variant === 'spacious' ? '20px 24px' : '14px 18px';
    }
    return variant === 'compact' ? '12px 16px' : variant === 'spacious' ? '24px 32px' : '16px 20px';
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-light)',
    borderRadius: isMobile ? '8px' : '12px',
    padding: getPadding(),
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    width: '100%',
    boxSizing: 'border-box',
    
    ...(hover && {
      '&:hover': {
        boxShadow: 'var(--shadow-md)',
        transform: 'translateY(-2px)',
        borderColor: 'var(--primary-color)'
      }
    })
  };

  return (
    <div 
      className={`responsive-card ${className}`}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--primary-color)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      } : undefined}
    >
      {children}
    </div>
  );
};

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'responsive';
  spacing?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = 'responsive',
  spacing = '16px',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getDirection = () => {
    if (direction === 'responsive') {
      return isMobile ? 'column' : 'row';
    }
    return direction;
  };

  const getSpacing = () => {
    if (isMobile) {
      return '12px';
    }
    if (isTablet) {
      return '14px';
    }
    return spacing;
  };

  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  };

  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around'
  };

  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: getDirection() as 'row' | 'column',
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    gap: getSpacing(),
    flexWrap: wrap ? 'wrap' : 'nowrap',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  return (
    <div 
      className={`responsive-stack ${className}`}
      style={stackStyle}
    >
      {children}
    </div>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl' | 'xxxl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = 'base',
  weight = 'normal',
  color,
  align = 'left',
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getFontSize = () => {
    const sizes = {
      xs: isMobile ? '11px' : '12px',
      sm: isMobile ? '13px' : '14px',
      base: isMobile ? '14px' : isTablet ? '15px' : '16px',
      lg: isMobile ? '16px' : isTablet ? '17px' : '18px',
      xl: isMobile ? '18px' : isTablet ? '19px' : '20px',
      xxl: isMobile ? '20px' : isTablet ? '22px' : '24px',
      xxxl: isMobile ? '24px' : isTablet ? '28px' : '32px'
    };
    return sizes[size];
  };

  const getLineHeight = () => {
    const lineHeights = {
      xs: '16px',
      sm: '20px',
      base: isMobile ? '20px' : '24px',
      lg: isMobile ? '24px' : '28px',
      xl: isMobile ? '28px' : '32px',
      xxl: isMobile ? '32px' : '36px',
      xxxl: isMobile ? '36px' : '48px'
    };
    return lineHeights[size];
  };

  const weightMap = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  };

  const textStyle: React.CSSProperties = {
    fontSize: getFontSize(),
    lineHeight: getLineHeight(),
    fontWeight: weightMap[weight],
    color: color || 'inherit',
    textAlign: align,
    margin: 0,
    transition: 'all 0.2s ease'
  };

  return (
    <p 
      className={`responsive-text ${className}`}
      style={textStyle}
    >
      {children}
    </p>
  );
};

// Perfect responsive button
interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = '',
  type = 'button'
}) => {
  const { isMobile } = useResponsive();

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: '1px solid var(--primary-color)',
        '&:hover': {
          backgroundColor: 'var(--primary-dark)',
          borderColor: 'var(--primary-dark)'
        }
      },
      secondary: {
        backgroundColor: 'var(--secondary-color)',
        color: 'white',
        border: '1px solid var(--secondary-color)',
        '&:hover': {
          backgroundColor: 'var(--secondary-dark)',
          borderColor: 'var(--secondary-dark)'
        }
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--primary-color)',
        border: '1px solid var(--primary-color)',
        '&:hover': {
          backgroundColor: 'var(--primary-color)',
          color: 'white'
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid transparent',
        '&:hover': {
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-light)'
        }
      }
    };
    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        padding: isMobile ? '10px 16px' : '8px 16px',
        fontSize: '14px',
        minHeight: '36px'
      },
      md: {
        padding: isMobile ? '12px 20px' : '12px 24px',
        fontSize: '16px',
        minHeight: '40px'
      },
      lg: {
        padding: isMobile ? '14px 24px' : '16px 32px',
        fontSize: isMobile ? '16px' : '18px',
        minHeight: '48px'
      }
    };
    return sizes[size];
  };

  const baseStyles: React.CSSProperties = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: '8px',
    fontWeight: '500',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth || (isMobile && size === 'lg') ? '100%' : 'auto',
    boxSizing: 'border-box',
    position: 'relative',
    opacity: disabled || loading ? 0.6 : 1,
    outline: 'none',
    fontFamily: 'inherit'
  };

  return (
    <button
      type={type}
      className={`responsive-button ${className}`}
      style={baseStyles}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
    >
      {loading && (
        <div 
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {!loading && icon && icon}
      {children}
    </button>
  );
};

// Add spinning animation to global styles
const globalStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.responsive-layout {
  transition: padding 0.3s ease;
}

.responsive-grid {
  transition: gap 0.3s ease, grid-template-columns 0.3s ease;
}

.responsive-card:hover {
  transform: translateY(-2px);
}

.responsive-stack {
  transition: gap 0.3s ease, flex-direction 0.3s ease;
}

.responsive-text {
  transition: font-size 0.2s ease;
}

.responsive-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.responsive-button:active:not(:disabled) {
  transform: translateY(0);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}
