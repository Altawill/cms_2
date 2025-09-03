import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-slate-900">{t('common.loading')}</p>
      </div>
    </div>
  )
}
