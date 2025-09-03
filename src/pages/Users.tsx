import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Users() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('nav.users')}</h1>
      <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
        <p>User management and permissions will be implemented here</p>
      </div>
    </div>
  )
}
