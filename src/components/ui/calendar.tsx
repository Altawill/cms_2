import React from 'react'

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
}

export function Calendar({ 
  selected, 
  onSelect, 
  disabled = false, 
  className = '' 
}: CalendarProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined
    onSelect?.(date)
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <div className={`calendar-wrapper ${className}`}>
      <input
        type="date"
        value={selected ? formatDateForInput(selected) : ''}
        onChange={handleDateChange}
        disabled={disabled}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          width: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      />
    </div>
  )
}
