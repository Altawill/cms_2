import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Sites() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('sites.title')}</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          {t('sites.addSite')}
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Sites management will be implemented here</p>
          <p className="text-sm mt-2">This will include site CRUD, detailed tabs, and management features</p>
        </div>
      </div>
    </div>
  )
}
