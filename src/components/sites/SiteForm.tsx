import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Save, Loader2 } from 'lucide-react'
import { Site } from '../../types'

interface SiteFormProps {
  site?: Site | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (siteData: Partial<Site>) => Promise<void>
  loading?: boolean
}

export default function SiteForm({ 
  site, 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false 
}: SiteFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    status: 'PLANNING',
    progress: 0,
    address: '',
    phone: '',
    email: '',
    monthlyBudget: undefined,
    startDate: undefined,
    targetDate: undefined,
    notes: '',
    active: true
  })

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        status: site.status,
        progress: site.progress,
        address: site.address || '',
        phone: site.phone || '',
        email: site.email || '',
        monthlyBudget: site.monthlyBudget || undefined,
        startDate: site.startDate || undefined,
        targetDate: site.targetDate || undefined,
        notes: site.notes || '',
        active: site.active
      })
    } else {
      setFormData({
        name: '',
        status: 'PLANNING',
        progress: 0,
        address: '',
        phone: '',
        email: '',
        monthlyBudget: undefined,
        startDate: undefined,
        targetDate: undefined,
        notes: '',
        active: true
      })
    }
  }, [site])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? (value === '' ? undefined : parseFloat(value))
        : type === 'date'
        ? (value === '' ? undefined : new Date(value))
        : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {site ? t('sites.editSite') : t('sites.createSite')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.status')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="PLANNING">{t('sites.status.planning')}</option>
                <option value="ACTIVE">{t('sites.status.active')}</option>
                <option value="PAUSED">{t('sites.status.paused')}</option>
                <option value="COMPLETED">{t('sites.status.completed')}</option>
              </select>
            </div>
          </div>

          {/* Progress and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.progress')} (%)
              </label>
              <input
                type="number"
                name="progress"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.monthlyBudget')} (LYD)
              </label>
              <input
                type="number"
                name="monthlyBudget"
                min="0"
                step="0.01"
                value={formData.monthlyBudget || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('sites.address')}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.startDate')}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('sites.targetDate')}
              </label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate ? formData.targetDate.toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('sites.notes')}
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{site ? t('common.update') : t('common.create')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
