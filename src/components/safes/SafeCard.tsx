import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Vault, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Building
} from 'lucide-react'
import { Safe } from '../../types'

interface SafeCardProps {
  safe: Safe
  onClick: (safe: Safe) => void
  className?: string
}

export default function SafeCard({ safe, onClick, className = '' }: SafeCardProps) {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 10000) return 'text-green-600 dark:text-green-400'
    if (balance > 5000) return 'text-yellow-600 dark:text-yellow-400'
    if (balance > 0) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const isCentralSafe = !safe.siteId

  return (
    <div 
      onClick={() => onClick(safe)}
      className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${isCentralSafe ? 'bg-primary/10' : 'bg-muted'}`}>
            {isCentralSafe ? (
              <Vault className="h-6 w-6 text-primary" />
            ) : (
              <Building className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {safe.name}
            </h3>
            {isCentralSafe && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Central Safe
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
        <div className={`text-2xl font-bold ${getBalanceColor(safe.balance)}`}>
          {formatCurrency(safe.balance)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button 
          onClick={(e) => {
            e.stopPropagation()
            // Handle deposit action
          }}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm"
        >
          <ArrowDownLeft className="h-4 w-4" />
          <span>Deposit</span>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            // Handle withdraw action
          }}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Withdraw</span>
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Last updated: {safe.updatedAt.toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-1 text-xs text-primary">
          <TrendingUp className="h-3 w-3" />
          <span>View History</span>
        </div>
      </div>
    </div>
  )
}
