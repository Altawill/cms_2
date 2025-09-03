import React, { useState } from 'react'

interface Safe {
  id: string
  name: string
  type: 'MAIN' | 'SITE' | 'PETTY_CASH'
  balance: number
  currency: string
  location: string
  responsible: string
  lastUpdated: string
}

interface Transaction {
  id: string
  safeId: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  amount: number
  description: string
  reference?: string
  performedBy: string
  createdAt: string
  fromSafe?: string
  toSafe?: string
}

const mockSafes: Safe[] = [
  {
    id: '1',
    name: 'Main Safe',
    type: 'MAIN',
    balance: 125000,
    currency: 'LYD',
    location: 'Central Office',
    responsible: 'Ahmed Hassan',
    lastUpdated: '2024-03-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Alpha Site Safe',
    type: 'SITE',
    balance: 25000,
    currency: 'LYD',
    location: 'Alpha Construction Site',
    responsible: 'John Smith',
    lastUpdated: '2024-03-15T08:45:00Z'
  },
  {
    id: '3',
    name: 'Beta Site Safe',
    type: 'SITE',
    balance: 18500,
    currency: 'LYD',
    location: 'Beta Development Site',
    responsible: 'Sarah Johnson',
    lastUpdated: '2024-03-14T16:20:00Z'
  },
  {
    id: '4',
    name: 'Petty Cash',
    type: 'PETTY_CASH',
    balance: 2500,
    currency: 'LYD',
    location: 'Central Office',
    responsible: 'Lisa Wilson',
    lastUpdated: '2024-03-15T14:15:00Z'
  }
]

const mockTransactions: Transaction[] = [
  {
    id: '1',
    safeId: '1',
    type: 'DEPOSIT',
    amount: 50000,
    description: 'Client payment for Project Alpha',
    reference: 'INV-2024-001',
    performedBy: 'Ahmed Hassan',
    createdAt: '2024-03-15T09:30:00Z'
  },
  {
    id: '2',
    safeId: '2',
    type: 'WITHDRAWAL',
    amount: 5000,
    description: 'Equipment purchase',
    reference: 'PO-2024-015',
    performedBy: 'John Smith',
    createdAt: '2024-03-15T08:45:00Z'
  },
  {
    id: '3',
    safeId: '1',
    type: 'TRANSFER',
    amount: 15000,
    description: 'Fund transfer to Beta site',
    fromSafe: 'Main Safe',
    toSafe: 'Beta Site Safe',
    performedBy: 'Ahmed Hassan',
    createdAt: '2024-03-14T16:20:00Z'
  },
  {
    id: '4',
    safeId: '4',
    type: 'WITHDRAWAL',
    amount: 150,
    description: 'Office supplies',
    performedBy: 'Lisa Wilson',
    createdAt: '2024-03-15T14:15:00Z'
  }
]

export function SafesManagement() {
  const [safes, setSafes] = useState<Safe[]>(mockSafes)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [selectedSafe, setSelectedSafe] = useState<string>('1')
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'>('DEPOSIT')

  const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0)
  const selectedSafeData = safes.find(s => s.id === selectedSafe)
  const safeTransactions = transactions
    .filter(t => t.safeId === selectedSafe)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleTransaction = (transactionData: {
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
    amount: number
    description: string
    reference?: string
    toSafeId?: string
  }) => {
    const timestamp = new Date().toISOString()
    const transactionId = Date.now().toString()
    
    // For regular deposits and withdrawals, create single transaction
    if (transactionData.type !== 'TRANSFER') {
      const newTransaction: Transaction = {
        id: transactionId,
        safeId: selectedSafe,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        reference: transactionData.reference,
        performedBy: 'Current User',
        createdAt: timestamp
      }

      // Update safe balance
      setSafes(prev => prev.map(safe => {
        if (safe.id === selectedSafe) {
          const newBalance = transactionData.type === 'DEPOSIT' 
            ? safe.balance + transactionData.amount
            : safe.balance - transactionData.amount
          return { ...safe, balance: newBalance, lastUpdated: timestamp }
        }
        return safe
      }))

      // Add single transaction
      setTransactions(prev => [newTransaction, ...prev])
    } else {
      // For transfers, create TWO transactions - one for sender, one for receiver
      if (!transactionData.toSafeId) {
        console.error('Transfer requires destination safe')
        return
      }

      const fromSafeName = selectedSafeData?.name || 'Unknown Safe'
      const toSafeName = safes.find(s => s.id === transactionData.toSafeId)?.name || 'Unknown Safe'
      
      // Create withdrawal transaction for sender safe
      const senderTransaction: Transaction = {
        id: transactionId + '_sender',
        safeId: selectedSafe,
        type: 'TRANSFER',
        amount: transactionData.amount,
        description: `${transactionData.description} (Transfer to ${toSafeName})`,
        reference: transactionData.reference,
        performedBy: 'Current User',
        createdAt: timestamp,
        fromSafe: fromSafeName,
        toSafe: toSafeName
      }

      // Create deposit transaction for receiver safe
      const receiverTransaction: Transaction = {
        id: transactionId + '_receiver',
        safeId: transactionData.toSafeId,
        type: 'TRANSFER',
        amount: transactionData.amount,
        description: `${transactionData.description} (Transfer from ${fromSafeName})`,
        reference: transactionData.reference,
        performedBy: 'Current User',
        createdAt: timestamp,
        fromSafe: fromSafeName,
        toSafe: toSafeName
      }

      // Update both safe balances
      setSafes(prev => prev.map(safe => {
        if (safe.id === selectedSafe) {
          // Deduct from sender
          return { ...safe, balance: safe.balance - transactionData.amount, lastUpdated: timestamp }
        }
        if (safe.id === transactionData.toSafeId) {
          // Add to receiver
          return { ...safe, balance: safe.balance + transactionData.amount, lastUpdated: timestamp }
        }
        return safe
      }))

      // Add BOTH transactions to the history
      setTransactions(prev => [receiverTransaction, senderTransaction, ...prev])
    }
    
    setShowTransactionModal(false)
  }

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <SummaryCard
          title="Total Balance"
          value={`${totalBalance.toLocaleString()} LYD`}
          icon="💰"
          color="#10b981"
        />
        <SummaryCard
          title="Active Safes"
          value={safes.length.toString()}
          icon="🏦"
          color="#3b82f6"
        />
        <SummaryCard
          title="Today's Transactions"
          value={transactions.filter(t => 
            new Date(t.createdAt).toDateString() === new Date().toDateString()
          ).length.toString()}
          icon="📊"
          color="#f59e0b"
        />
        <SummaryCard
          title="Last Transaction"
          value={transactions.length > 0 ? new Date(transactions[0].createdAt).toLocaleDateString() : 'None'}
          icon="⏰"
          color="#8b5cf6"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Safes List */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Safes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {safes.map(safe => (
              <SafeCard
                key={safe.id}
                safe={safe}
                isSelected={selectedSafe === safe.id}
                onClick={() => setSelectedSafe(safe.id)}
              />
            ))}
          </div>
        </div>

        {/* Safe Details and Transactions */}
        <div>
          {selectedSafeData && (
            <>
              {/* Safe Details */}
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
                    {selectedSafeData.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setTransactionType('DEPOSIT'); setShowTransactionModal(true) }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      + Deposit
                    </button>
                    <button
                      onClick={() => { setTransactionType('WITHDRAWAL'); setShowTransactionModal(true) }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      - Withdraw
                    </button>
                    <button
                      onClick={() => { setTransactionType('TRANSFER'); setShowTransactionModal(true) }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ⇄ Transfer
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <DetailItem label="Balance" value={`${selectedSafeData.balance.toLocaleString()} ${selectedSafeData.currency}`} />
                  <DetailItem label="Type" value={selectedSafeData.type.replace('_', ' ')} />
                  <DetailItem label="Location" value={selectedSafeData.location} />
                  <DetailItem label="Responsible" value={selectedSafeData.responsible} />
                  <DetailItem label="Last Updated" value={new Date(selectedSafeData.lastUpdated).toLocaleString()} />
                </div>
              </div>

              {/* Transactions History */}
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
                  Transaction History
                </h3>
                
                {safeTransactions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {safeTransactions.map(transaction => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <p>No transactions found for this safe</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          type={transactionType}
          safes={safes}
          currentSafe={selectedSafeData}
          onSave={handleTransaction}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  )
}

function SummaryCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{title}</div>
      </div>
    </div>
  )
}

function SafeCard({ safe, isSelected, onClick }: {
  safe: Safe
  isSelected: boolean
  onClick: () => void
}) {
  const typeColors = {
    MAIN: '#10b981',
    SITE: '#3b82f6',
    PETTY_CASH: '#f59e0b'
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>{safe.name}</h4>
        <span style={{
          backgroundColor: typeColors[safe.type] + '20',
          color: typeColors[safe.type],
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          {safe.type.replace('_', ' ')}
        </span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: typeColors[safe.type], marginBottom: '4px' }}>
        {safe.balance.toLocaleString()} {safe.currency}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {safe.location} • {safe.responsible}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function TransactionItem({ transaction, currentSafeId }: { transaction: Transaction, currentSafeId?: string }) {
  const typeColors = {
    DEPOSIT: '#10b981',
    WITHDRAWAL: '#ef4444',
    TRANSFER: '#3b82f6'
  }

  const typeIcons = {
    DEPOSIT: '+',
    WITHDRAWAL: '-',
    TRANSFER: '⇄'
  }

  // For transfers, determine if this is incoming or outgoing money
  const isIncomingTransfer = transaction.type === 'TRANSFER' && 
    transaction.description.includes('Transfer from')
  
  const isOutgoingTransfer = transaction.type === 'TRANSFER' && 
    transaction.description.includes('Transfer to')

  // Determine the display sign and color for transfers
  let displaySign = '+'
  let displayColor = typeColors[transaction.type]
  let displayIcon = typeIcons[transaction.type]
  
  if (transaction.type === 'WITHDRAWAL' || isOutgoingTransfer) {
    displaySign = '-'
    displayColor = '#ef4444'
    displayIcon = transaction.type === 'WITHDRAWAL' ? '-' : '↗'
  } else if (transaction.type === 'DEPOSIT' || isIncomingTransfer) {
    displaySign = '+'
    displayColor = '#10b981'
    displayIcon = transaction.type === 'DEPOSIT' ? '+' : '↙'
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      border: '1px solid var(--border-light)',
      borderRadius: '8px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: displayColor + '20',
        color: displayColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        {displayIcon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
          {transaction.description}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {new Date(transaction.createdAt).toLocaleString()} • {transaction.performedBy}
          {transaction.reference && ` • Ref: ${transaction.reference}`}
          {transaction.type === 'TRANSFER' && transaction.fromSafe && transaction.toSafe && 
            ` • ${transaction.fromSafe} → ${transaction.toSafe}`
          }
        </div>
      </div>
      
      <div style={{
        fontSize: '16px',
        fontWeight: '600',
        color: displayColor
      }}>
        {displaySign}{transaction.amount.toLocaleString()} LYD
      </div>
    </div>
  )
}

function TransactionModal({ type, safes, currentSafe, onSave, onClose }: {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  safes: Safe[]
  currentSafe: Safe | undefined
  onSave: (data: any) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    reference: '',
    toSafeId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.amount > 0 && formData.description) {
      onSave({
        type,
        ...formData
      })
    }
  }

  const otherSafes = safes.filter(s => s.id !== currentSafe?.id)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
            {type === 'DEPOSIT' ? 'Deposit Money' : type === 'WITHDRAWAL' ? 'Withdraw Money' : 'Transfer Money'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                From Safe
              </label>
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}>
                {currentSafe?.name}
              </div>
            </div>

            {type === 'TRANSFER' && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  To Safe *
                </label>
                <select
                  required
                  value={formData.toSafeId}
                  onChange={(e) => setFormData({ ...formData, toSafeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Select destination safe</option>
                  {otherSafes.map(safe => (
                    <option key={safe.id} value={safe.id}>{safe.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Amount (LYD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter transaction description..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Reference (Optional)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Invoice, PO number, etc."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: type === 'DEPOSIT' ? '#10b981' : type === 'WITHDRAWAL' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {type === 'DEPOSIT' ? 'Deposit' : type === 'WITHDRAWAL' ? 'Withdraw' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
