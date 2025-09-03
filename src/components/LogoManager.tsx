import React, { useState, useEffect } from 'react'

interface LogoManagerProps {
  onLogoChange?: (logoUrl: string | null) => void
  showUpload?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function LogoManager({ onLogoChange, showUpload = false, size = 'medium' }: LogoManagerProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    // Load saved logo from localStorage
    const savedLogo = localStorage.getItem('companyLogo')
    if (savedLogo) {
      setLogoUrl(savedLogo)
      onLogoChange?.(savedLogo)
    }
  }, [onLogoChange])

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        setLogoUrl(url)
        localStorage.setItem('companyLogo', url)
        onLogoChange?.(url)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeLogo = () => {
    setLogoUrl(null)
    localStorage.removeItem('companyLogo')
    onLogoChange?.(null)
  }

  const sizeStyles = {
    small: { width: '40px', height: '40px' },
    medium: { width: '80px', height: '80px' },
    large: { width: '120px', height: '120px' }
  }

  if (!showUpload && logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Company Logo"
        style={{
          ...sizeStyles[size],
          objectFit: 'contain',
          borderRadius: '8px'
        }}
      />
    )
  }

  if (!showUpload && !logoUrl) {
    return (
      <div
        style={{
          ...sizeStyles[size],
          backgroundColor: 'var(--bg-tertiary)',
          border: '2px dashed var(--border-color)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'small' ? '12px' : '14px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}
      >
        No Logo
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      {logoUrl ? (
        <div style={{ position: 'relative' }}>
          <img
            src={logoUrl}
            alt="Company Logo"
            style={{
              ...sizeStyles[size],
              objectFit: 'contain',
              borderRadius: '8px',
              border: '2px solid var(--border-light)'
            }}
          />
          <button
            onClick={removeLogo}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            ...sizeStyles[size],
            backgroundColor: isDragging ? '#84cc1620' : 'var(--bg-tertiary)',
            border: `2px dashed ${isDragging ? '#84cc16' : 'var(--border-color)'}`,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📁</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Drop logo here
          </span>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <label
          style={{
            padding: '8px 16px',
            backgroundColor: '#84cc16',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            border: 'none'
          }}
        >
          {logoUrl ? 'Change Logo' : 'Upload Logo'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  )
}

export function useCompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo')
    if (savedLogo) {
      setLogoUrl(savedLogo)
    }
  }, [])

  return logoUrl
}
