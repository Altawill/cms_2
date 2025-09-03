import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  History,
  Filter,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { Safe, SafeTransaction, TransactionType } from '../types'
import { safesRepo, safeTransactionsRepo, transferBetweenSafes, logActivity } from '../services/repository'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'
import SafeCard from '../components/safes/SafeCard'
import TransactionForm from '../components/safes/TransactionForm'
import LoadingScreen from '../components/common/LoadingScreen'

export default function Safes() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { addNotification } = useUI()
  
  const [safes, setSafes] = useState<Safe[]>([])
  const [transactions, setTransactions] = useState<SafeTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSafe, setSelectedSafe] = useState<Safe | null>(null)
  const [transactionForm, setTransactionForm] = useState<{
    isOpen: boolean
    type: TransactionType
    safe?: Safe
  }>({ isOpen: false, type: 'DEPOSIT' })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      const [safesData, transactionsData] = await Promise.all([
        safesRepo.getAll() as Promise<Safe[]>,
        safeTransactionsRepo.getAll() as Promise<SafeTransaction[]>
      ])
      setSafes(safesData)
      setTransactions(transactionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    } catch (error) {
      console.error('Failed to load safes data:', error)
      addNotification({
        type: 'error',
        title: t('common.error'),
        message: 'Failed to load safes data'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleTransaction = async (transactionData: Partial<SafeTransaction>) => {
    if (!transactionForm.safe) return
    
    try {
      setTransactionLoading(true)
      
      const { type, amount, note, counterpartySafeId } = transactionData
      
      if (type === 'TRANSFER' && counterpartySafeId) {
        // Use atomic transfer function
        await transferBetweenSafes(
          transactionForm.safe.id,
          counterpartySafeId,
          amount!,
          note || 'Transfer between safes',
          user!.id
        )
        
        addNotification({
          type: 'success',
          title: 'Transfer Completed',
          message: `Successfully transferred ${amount} LYD`
        })
      } else {
        // Create individual transaction
        const newTransaction = await safeTransactionsRepo.create({
          ...transactionData,
          safeId: transactionForm.safe.id,
          createdBy: user!.id,
          createdAt: new Date()
        } as Omit<SafeTransaction, 'id'>)
        
        // Update safe balance
        const balanceChange = type === 'DEPOSIT' ? amount! : -amount!
        await safesRepo.update(transactionForm.safe.id, {
          balance: transactionForm.safe.balance + balanceChange,
          updatedAt: new Date()
        } as Partial<Safe>)
        
        await logActivity(
          'SAFE_TRANSACTION',
          newTransaction.id,
          type!,
          user!.id,
          { safeName: transactionForm.safe.name, amount }
        )
        
        addNotification({
          type: 'success',
          title: 'Transaction Completed',
          message: `Successfully ${type!.toLowerCase()}ed ${amount} LYD`
        })
      }
      
      // Refresh data
      await loadData()
      setTransactionForm({ isOpen: false, type: 'DEPOSIT' })
      
    } catch (error) {
      console.error('Transaction failed:', error)
      addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: 'Failed to process transaction'
      })
    } finally {
      setTransactionLoading(false)
    }
  }
  
  const openTransactionForm = (type: TransactionType, safe: Safe) => {
    setTransactionForm({
      isOpen: true,
      type,
      safe
    })
  }
  
  const filteredSafes = safes.filter(safe => 
    safe.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const centralSafe = safes.find(safe => !safe.siteId)
  const siteSafes = safes.filter(safe => safe.siteId)
  
  const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0)
  const recentTransactions = transactions.slice(0, 5)
  
  if (loading) {
    return <LoadingScreen />
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Safes & Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage cash flow across all locations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {}}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </button>
          
          <button
            onClick={() => {}}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Safe</span>
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('en-LY', { style: 'currency', currency: 'LYD' }).format(totalBalance)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Safes</p>
              <p className="text-2xl font-bold text-foreground">{safes.length}</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <span className="text-xl">🏦</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Today's Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {transactions.filter(t => 
                  new Date(t.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Low Balance Alert</p>
              <p className="text-2xl font-bold text-orange-600">
                {safes.filter(s => s.balance < 1000).length}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search safes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          />
        </div>
      </div>
      
      {/* Central Safe */}
      {centralSafe && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Central Safe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SafeCard 
              safe={centralSafe}
              onClick={() => setSelectedSafe(centralSafe)}
              className="border-primary/20"
            />
            
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-medium text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => openTransactionForm('DEPOSIT', centralSafe)}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <ArrowDownLeft className="h-5 w-5" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={() => openTransactionForm('WITHDRAW', centralSafe)}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span>Withdraw</span>
                </button>
                <button
                  onClick={() => openTransactionForm('TRANSFER', centralSafe)}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <ArrowLeftRight className="h-5 w-5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Site Safes */}
      {siteSafes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Site Safes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {siteSafes.map(safe => (
              <SafeCard 
                key={safe.id}
                safe={safe}
                onClick={() => setSelectedSafe(safe)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {filteredSafes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏦</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No safes found
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first safe to start managing cash flow
          </p>
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Safe</span>
          </button>
        </div>
      )}
      
      {/* Transaction Form Modal */}
      <TransactionForm
        type={transactionForm.type}
        sourceSafe={transactionForm.safe}
        safes={safes}
        isOpen={transactionForm.isOpen}
        onClose={() => setTransactionForm({ isOpen: false, type: 'DEPOSIT' })}
        onSubmit={handleTransaction}
        loading={transactionLoading}
      />
    </div>
  )
}
