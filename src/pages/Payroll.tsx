import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Payroll() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('nav.payroll')}</h1>
      <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
        <p>Payroll management will be implemented here</p>
      </div>
    </div>
  )
}
