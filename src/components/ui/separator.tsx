import React from 'react'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
  style?: React.CSSProperties
}

export function Separator({ 
  orientation = 'horizontal', 
  className = '',
  style = {}
}: SeparatorProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--border-color)',
    border: 'none',
    ...style
  }

  if (orientation === 'horizontal') {
    return (
      <hr 
        className={className}
        style={{
          ...baseStyle,
          height: '1px',
          width: '100%',
          margin: '8px 0'
        }}
      />
    )
  }

  return (
    <div 
      className={className}
      style={{
        ...baseStyle,
        width: '1px',
        height: '100%',
        margin: '0 8px'
      }}
    />
  )
}
