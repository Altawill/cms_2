import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Save, Loader2, ArrowRight } from 'lucide-react'
import { Safe, SafeTransaction, TransactionType } from '../../types'

interface TransactionFormProps {
  type: TransactionType
  sourceSafe?: Safe
  safes: Safe[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (transaction: Partial<SafeTransaction>) => Promise<void>
  loading?: boolean
}

export default function TransactionForm({ 
  type, 
  sourceSafe,
  safes,
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false 
}: TransactionFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    counterpartySafeId: ''
  })

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        amount: '',
        note: '',
        counterpartySafeId: ''
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    if (type === 'TRANSFER' && !formData.counterpartySafeId) {
      return
    }

    if (type === 'WITHDRAW' && sourceSafe && amount > sourceSafe.balance) {
      return
    }

    const transaction: Partial<SafeTransaction> = {
      type,
      amount,
      note: formData.note || undefined,
      counterpartySafeId: formData.counterpartySafeId || undefined
    }

    await onSubmit(transaction)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getTitle = () => {
    switch (type) {
      case 'DEPOSIT': return 'Deposit Money'
      case 'WITHDRAW': return 'Withdraw Money'
      case 'TRANSFER': return 'Transfer Money'
    }
  }

  const getSubmitText = () => {
    switch (type) {
      case 'DEPOSIT': return 'Deposit'
      case 'WITHDRAW': return 'Withdraw'
      case 'TRANSFER': return 'Transfer'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const targetSafes = safes.filter(safe => safe.id !== sourceSafe?.id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {getTitle()}
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
          {/* Safe Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">
                  {type === 'TRANSFER' ? 'From: ' : ''}{sourceSafe?.name}
                </div>
                {sourceSafe && (
                  <div className="text-sm text-muted-foreground">
                    Balance: {formatCurrency(sourceSafe.balance)}
                  </div>
                )}
              </div>
              {type === 'TRANSFER' && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Transfer Target */}
          {type === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Transfer To
              </label>
              <select
                name="counterpartySafeId"
                value={formData.counterpartySafeId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                required
              >
                <option value="">Select destination safe</option>
                {targetSafes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({formatCurrency(safe.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount (LYD)
            </label>
            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              max={type === 'WITHDRAW' ? sourceSafe?.balance : undefined}
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              placeholder="0.00"
              required
            />
            {type === 'WITHDRAW' && sourceSafe && formData.amount && parseFloat(formData.amount) > sourceSafe.balance && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Amount exceeds available balance
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Note (Optional)
            </label>
            <textarea
              name="note"
              rows={3}
              value={formData.note}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
              placeholder="Add a note for this transaction..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.amount || (type === 'TRANSFER' && !formData.counterpartySafeId)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
                type === 'DEPOSIT' 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : type === 'WITHDRAW'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{getSubmitText()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
