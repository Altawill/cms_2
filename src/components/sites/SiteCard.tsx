import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Target, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { Site } from '../../types'
import { format } from 'date-fns'

interface SiteCardProps {
  site: Site
  onClick: (site: Site) => void
}

const statusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PAUSED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
}

export default function SiteCard({ site, onClick }: SiteCardProps) {
  const { t } = useTranslation()

  return (
    <div 
      onClick={() => onClick(site)}
      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {site.name}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[site.status]
          }`}>
            {t(`sites.status.${site.status.toLowerCase()}`)}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {site.progress}%
          </div>
          <div className="w-16 bg-muted rounded-full h-2 mt-1">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${site.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-muted-foreground">
        {site.address && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{site.address}</span>
          </div>
        )}
        {site.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>{site.phone}</span>
          </div>
        )}
        {site.email && (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span className="truncate">{site.email}</span>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {site.startDate 
              ? format(site.startDate, 'MMM dd, yyyy')
              : t('common.notSet')
            }
          </span>
        </div>
        {site.targetDate && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>{format(site.targetDate, 'MMM dd, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Budget */}
      {site.monthlyBudget && (
        <div className="flex items-center space-x-2 mt-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">
            {new Intl.NumberFormat('en-LY', { 
              style: 'currency', 
              currency: 'LYD' 
            }).format(site.monthlyBudget)}
            <span className="text-muted-foreground ml-1">/{t('common.month')}</span>
          </span>
        </div>
      )}
    </div>
  )
}
