interface GlobalSettings {
  id: string
  companyName: string
  companyLogo: string | null
  currency: 'LYD' | 'USD' | 'EUR' | 'SAR'
  currencySymbol: string
  taxRate: number
  language: 'EN' | 'AR'
  theme: 'light' | 'dark' | 'system'
  timezone: string
  dateFormat: string
  address: string
  phone: string
  email: string
  website: string
  createdAt: Date
  updatedAt: Date
}

class SettingsService {
  private storageKey = 'management_system_settings'
  private defaultSettings: GlobalSettings = {
    id: '1',
    companyName: 'AlBina Construction & Management',
    companyLogo: null,
    currency: 'LYD',
    currencySymbol: 'د.ل',
    taxRate: 15,
    language: 'EN',
    theme: 'system',
    timezone: 'Africa/Tripoli',
    dateFormat: 'DD/MM/YYYY',
    address: '123 King Faisal Street, Tripoli, Libya',
    phone: '+218-21-123-4567',
    email: 'info@albina-construction.ly',
    website: 'www.albina-construction.ly',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Get current settings
  getSettings(): GlobalSettings {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all fields exist
        return { ...this.defaultSettings, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return this.defaultSettings
  }

  // Update settings
  updateSettings(updates: Partial<GlobalSettings>): GlobalSettings {
    const current = this.getSettings()
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date()
    }
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw new Error('Failed to save settings')
    }
    
    return updated
  }

  // Upload and save company logo
  async uploadLogo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          this.updateSettings({ companyLogo: result })
          resolve(result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  // Get currency formatting function
  formatCurrency(amount: number): string {
    const settings = this.getSettings()
    return `${amount.toFixed(2)} ${settings.currencySymbol}`
  }

  // Get date formatting function
  formatDate(date: Date | string): string {
    const settings = this.getSettings()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (settings.language === 'AR') {
      return dateObj.toLocaleDateString('ar-LY')
    }
    return dateObj.toLocaleDateString('en-LY')
  }

  // Reset to defaults
  resetToDefaults(): GlobalSettings {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
    return this.defaultSettings
  }

  // Export settings
  exportSettings(): string {
    const settings = this.getSettings()
    return JSON.stringify(settings, null, 2)
  }

  // Import settings
  importSettings(settingsJson: string): GlobalSettings {
    try {
      const imported = JSON.parse(settingsJson)
      const merged = { ...this.defaultSettings, ...imported, updatedAt: new Date() }
      localStorage.setItem(this.storageKey, JSON.stringify(merged))
      return merged
    } catch (error) {
      console.error('Failed to import settings:', error)
      throw new Error('Invalid settings format')
    }
  }
}

export const settingsService = new SettingsService()
export type { GlobalSettings }
