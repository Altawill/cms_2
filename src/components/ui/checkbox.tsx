import React from 'react'

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function Checkbox({ 
  checked = false, 
  onCheckedChange, 
  disabled = false, 
  className = '', 
  id 
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={`
        w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
        focus:ring-blue-500 focus:ring-2 disabled:opacity-50 
        ${className}
      `.trim()}
      style={{
        width: '16px',
        height: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    />
  )
}
