import React, { useState, useEffect } from 'react'
import { useSettings } from './Settings'
import { useAuth } from '../contexts/AuthContext'
import { Client, ClientTransaction, ClientSummary, ExportOptions } from '../types/client'
import { clientService } from '../services/clientService'
import { pdfReportGenerator } from '../services/pdfReportGenerator'
import { excelReportGenerator } from '../services/excelReportGenerator'

export function ClientReportsManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<ClientTransaction[]>([])
  const [summary, setSummary] = useState<ClientSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reportType, setReportType] = useState<'invoice' | 'statement' | 'summary'>('statement')
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false)

  const { language, theme } = useSettings()
  const { user, legacyUser } = useAuth()

  const t = (key: string, fallback?: string) => {
    const translations: Record<string, { EN: string, AR: string }> = {
      'client_reports': { EN: 'Client Reports & Invoicing', AR: 'تقارير وفواتير العملاء' },
      'select_client': { EN: 'Select Client', AR: 'اختر العميل' },
      'search_clients': { EN: 'Search clients...', AR: 'البحث عن العملاء...' },
      'add_client': { EN: 'Add New Client', AR: 'إضافة عميل جديد' },
      'add_transaction': { EN: 'Add Transaction', AR: 'إضافة معاملة' },
      'client_name': { EN: 'Client Name', AR: 'اسم العميل' },
      'company_name': { EN: 'Company Name', AR: 'اسم الشركة' },
      'email': { EN: 'Email', AR: 'البريد الإلكتروني' },
      'phone': { EN: 'Phone', AR: 'الهاتف' },
      'total_orders': { EN: 'Total Orders', AR: 'إجمالي الطلبات' },
      'total_amount': { EN: 'Total Amount', AR: 'المبلغ الإجمالي' },
      'total_paid': { EN: 'Total Paid', AR: 'إجمالي المدفوع' },
      'remaining_balance': { EN: 'Remaining Balance', AR: 'الرصيد المتبقي' },
      'overdue_amount': { EN: 'Overdue Amount', AR: 'المبلغ المتأخر' },
      'generate_report': { EN: 'Generate Report', AR: 'إنشاء تقرير' },
      'download_pdf': { EN: 'Download PDF', AR: 'تحميل PDF' },
      'export_excel': { EN: 'Export to Excel', AR: 'تصدير إلى Excel' },
      'report_type': { EN: 'Report Type', AR: 'نوع التقرير' },
      'invoice': { EN: 'Invoice', AR: 'فاتورة' },
      'statement': { EN: 'Financial Statement', AR: 'كشف مالي' },
      'summary': { EN: 'Summary Report', AR: 'تقرير ملخص' },
      'transaction_history': { EN: 'Transaction History', AR: 'سجل المعاملات' },
      'order_number': { EN: 'Order #', AR: 'رقم الطلب' },
      'date': { EN: 'Date', AR: 'التاريخ' },
      'description': { EN: 'Description', AR: 'الوصف' },
      'site': { EN: 'Site', AR: 'الموقع' },
      'paid_amount': { EN: 'Paid', AR: 'مدفوع' },
      'remaining': { EN: 'Remaining', AR: 'متبقي' },
      'status': { EN: 'Status', AR: 'الحالة' },
      'paid': { EN: 'Paid', AR: 'مدفوع' },
      'partial': { EN: 'Partial', AR: 'جزئي' },
      'pending': { EN: 'Pending', AR: 'معلق' },
      'overdue': { EN: 'Overdue', AR: 'متأخر' },
      'no_transactions': { EN: 'No transactions found', AR: 'لا توجد معاملات' },
      'loading': { EN: 'Loading...', AR: 'جاري التحميل...' },
      'quick_actions': { EN: 'Quick Actions', AR: 'إجراءات سريعة' },
      'all_clients_summary': { EN: 'All Clients Summary', AR: 'ملخص جميع العملاء' },
      'financial_summary': { EN: 'Financial Summary', AR: 'الملخص المالي' },
      'cancel': { EN: 'Cancel', AR: 'إلغاء' },
      'save': { EN: 'Save', AR: 'حفظ' }
    }
    return translations[key]?.[language] || fallback || key
  }

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientData(selectedClient.id)
    }
  }, [selectedClient])

  const loadClients = async () => {
    setLoading(true)
    try {
      const clientsData = await clientService.getAllClients()
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId: string) => {
    setLoading(true)
    try {
      const [clientTransactions, clientSummary] = await Promise.all([
        clientService.getClientTransactions(clientId),
        clientService.calculateClientSummary(clientId)
      ])
      setTransactions(clientTransactions)
      setSummary(clientSummary)
    } catch (error) {
      console.error('Error loading client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleGeneratePDF = async () => {
    if (!selectedClient || !summary) return

    setLoading(true)
    try {
      const exportOptions: ExportOptions = {
        format: 'pdf',
        includeCompanyLogo: true,
        includeSignature: true,
        theme,
        language,
        customFooter: undefined
      }

      const reportData = {
        client: selectedClient,
        transactions,
        summary,
        reportNumber: clientService.generateReportNumber(),
        generatedBy: legacyUser?.name || user?.firstName + ' ' + user?.lastName || 'System',
        companyInfo: clientService.getCompanyInfo()
      }

      await pdfReportGenerator.downloadReport(reportData, exportOptions, reportType)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateExcel = async () => {
    if (!selectedClient || !summary) return

    setLoading(true)
    try {
      const exportOptions: ExportOptions = {
        format: 'excel',
        includeCompanyLogo: true,
        includeSignature: true,
        theme,
        language,
        customFooter: undefined
      }

      const reportData = {
        client: selectedClient,
        transactions,
        summary,
        reportNumber: clientService.generateReportNumber(),
        generatedBy: legacyUser?.name || user?.firstName + ' ' + user?.lastName || 'System',
        companyInfo: clientService.getCompanyInfo()
      }

      await excelReportGenerator.downloadReport(reportData, exportOptions, reportType)
    } catch (error) {
      console.error('Error generating Excel:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAllClientsExcel = async () => {
    setLoading(true)
    try {
      const allTransactions = await clientService.getAllTransactions()
      const exportOptions: ExportOptions = {
        format: 'excel',
        includeCompanyLogo: true,
        includeSignature: true,
        theme,
        language
      }

      await excelReportGenerator.generateQuickSummaryExcel(clients, allTransactions, exportOptions)
    } catch (error) {
      console.error('Error generating all clients Excel:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyle = (status: ClientTransaction['status']) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    }

    switch (status) {
      case 'paid':
        return { ...baseStyle, backgroundColor: '#10b98120', color: '#10b981' }
      case 'partial':
        return { ...baseStyle, backgroundColor: '#f59e0b20', color: '#f59e0b' }
      case 'pending':
        return { ...baseStyle, backgroundColor: '#3b82f620', color: '#3b82f6' }
      case 'overdue':
        return { ...baseStyle, backgroundColor: '#ef444420', color: '#ef4444' }
      default:
        return { ...baseStyle, backgroundColor: '#6b728020', color: '#6b7280' }
    }
  }

  return (
    <div style={{ 
      direction: language === 'AR' ? 'rtl' : 'ltr',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          margin: 0, 
          color: 'var(--text-primary)' 
        }}>
          {t('client_reports')}
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNewClientForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {t('add_client')}
          </button>
          
          <button
            onClick={handleGenerateAllClientsExcel}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            {t('all_clients_summary')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', height: 'calc(100vh - 200px)' }}>
        {/* Left Panel - Client Selection */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px', 
            color: 'var(--text-primary)' 
          }}>
            {t('select_client')}
          </h3>

          {/* Search */}
          <input
            type="text"
            placeholder={t('search_clients')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />

          {/* Client List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                {t('loading')}
              </div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: '12px',
                    border: `1px solid ${selectedClient?.id === client.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedClient?.id === client.id ? 'var(--accent-primary)20' : 'var(--bg-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {client.name}
                  </div>
                  {client.companyName && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {client.companyName}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {client.email}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Report Generation */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedClient ? (
            <>
              {/* Client Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    margin: 0, 
                    color: 'var(--text-primary)' 
                  }}>
                    {selectedClient.name}
                  </h3>
                  {selectedClient.companyName && (
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)', 
                      margin: '4px 0 0 0' 
                    }}>
                      {selectedClient.companyName}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => setShowNewTransactionForm(true)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--accent-secondary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {t('add_transaction')}
                </button>
              </div>

              {/* Financial Summary */}
              {summary && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <SummaryCard title={t('total_orders')} value={summary.totalOrders.toString()} />
                  <SummaryCard title={t('total_amount')} value={clientService.formatCurrency(summary.totalAmount, language)} />
                  <SummaryCard title={t('total_paid')} value={clientService.formatCurrency(summary.totalPaid, language)} />
                  <SummaryCard title={t('remaining_balance')} value={clientService.formatCurrency(summary.totalRemaining, language)} />
                  {summary.overdueAmount > 0 && (
                    <SummaryCard 
                      title={t('overdue_amount')} 
                      value={clientService.formatCurrency(summary.overdueAmount, language)}
                      isWarning={true}
                    />
                  )}
                </div>
              )}

              {/* Report Generation Controls */}
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    minWidth: '150px'
                  }}
                >
                  <option value="statement">{t('statement')}</option>
                  <option value="invoice">{t('invoice')}</option>
                  <option value="summary">{t('summary')}</option>
                </select>

                <button
                  onClick={handleGeneratePDF}
                  disabled={loading || !summary}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent-danger)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: loading || !summary ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📄 {t('download_pdf')}
                </button>

                <button
                  onClick={handleGenerateExcel}
                  disabled={loading || !summary}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent-warning)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: loading || !summary ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📊 {t('export_excel')}
                </button>
              </div>

              {/* Transactions Table */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '12px', 
                  color: 'var(--text-primary)' 
                }}>
                  {t('transaction_history')}
                </h4>
                
                {transactions.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: 'var(--text-secondary)' 
                  }}>
                    {t('no_transactions')}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('order_number')}
                          </th>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('date')}
                          </th>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('description')}
                          </th>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('total_amount')}
                          </th>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('paid_amount')}
                          </th>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('remaining')}
                          </th>
                          <th style={{ textAlign: language === 'AR' ? 'right' : 'left', padding: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(transaction => (
                          <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                              {transaction.orderNumber}
                            </td>
                            <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {transaction.date.toLocaleDateString(language === 'AR' ? 'ar-AE' : 'en-US')}
                            </td>
                            <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                              {transaction.description}
                            </td>
                            <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                              {clientService.formatCurrency(transaction.totalAmount, language)}
                            </td>
                            <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                              {clientService.formatCurrency(transaction.paidAmount, language)}
                            </td>
                            <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                              {clientService.formatCurrency(transaction.remainingBalance, language)}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <span style={getStatusStyle(transaction.status)}>
                                {t(transaction.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: 'var(--text-secondary)',
              fontSize: '16px'
            }}>
              {t('select_client')}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--accent-primary)',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: 'var(--text-primary)' }}>{t('loading')}</span>
          </div>
        </div>
      )}
      
      {/* New Client Form Modal */}
      {showNewClientForm && (
        <NewClientForm 
          onClose={() => setShowNewClientForm(false)}
          onSave={async (clientData) => {
            try {
              const newClient = await clientService.createClient(clientData)
              setClients(prev => [newClient, ...prev])
              setShowNewClientForm(false)
              alert(language === 'AR' ? 'تم إنشاء العميل بنجاح' : 'Client created successfully!')
            } catch (error) {
              console.error('Error creating client:', error)
              alert(language === 'AR' ? 'خطأ في إنشاء العميل' : 'Error creating client')
            }
          }}
          language={language}
          t={t}
        />
      )}
      
      {/* New Transaction Form Modal */}
      {showNewTransactionForm && selectedClient && (
        <NewTransactionForm 
          client={selectedClient}
          onClose={() => setShowNewTransactionForm(false)}
          onSave={async (transactionData) => {
            try {
              const newTransaction = await clientService.addTransaction(selectedClient.id, transactionData)
              setTransactions(prev => [newTransaction, ...prev])
              // Reload summary
              const updatedSummary = await clientService.calculateClientSummary(selectedClient.id)
              setSummary(updatedSummary)
              setShowNewTransactionForm(false)
              alert(language === 'AR' ? 'تم إضافة المعاملة بنجاح' : 'Transaction added successfully!')
            } catch (error) {
              console.error('Error adding transaction:', error)
              alert(language === 'AR' ? 'خطأ في إضافة المعاملة' : 'Error adding transaction')
            }
          }}
          language={language}
          t={t}
        />
      )}
    </div>
  )
}

function NewClientForm({ onClose, onSave, language, t }: {
  onClose: () => void
  onSave: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  language: 'EN' | 'AR'
  t: (key: string) => string
}) {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    notes: '',
    isActive: true
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      alert(language === 'AR' ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        direction: language === 'AR' ? 'rtl' : 'ltr'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
            👤 {t('add_client')}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('client_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'AR' ? 'أدخل اسم العميل' : 'Enter client name'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('company_name')}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder={language === 'AR' ? 'أدخل اسم الشركة' : 'Enter company name'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('email')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={language === 'AR' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={language === 'AR' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Address • العنوان
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={language === 'AR' ? 'أدخل العنوان' : 'Enter address'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Tax Number • الرقم الضريبي
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder={language === 'AR' ? 'أدخل الرقم الضريبي' : 'Enter tax number'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Notes • ملاحظات
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'AR' ? 'ملاحظات إضافية' : 'Additional notes'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: 'var(--text-primary)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {t('cancel')}
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (isSubmitting || !formData.name || !formData.email) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: (isSubmitting || !formData.name || !formData.email) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  {language === 'AR' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  💾 {t('save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewTransactionForm({ client, onClose, onSave, language, t }: {
  client: Client
  onClose: () => void
  onSave: (transactionData: Omit<ClientTransaction, 'id' | 'clientId'>) => Promise<void>
  language: 'EN' | 'AR'
  t: (key: string) => string
}) {
  const [formData, setFormData] = useState({
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    description: '',
    site: '',
    totalAmount: '',
    paidAmount: '',
    paymentMethod: 'cash' as ClientTransaction['paymentMethod'],
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const calculateRemainingBalance = () => {
    const total = parseFloat(formData.totalAmount) || 0
    const paid = parseFloat(formData.paidAmount) || 0
    return Math.max(0, total - paid)
  }
  
  const getPaymentStatus = (): ClientTransaction['status'] => {
    const total = parseFloat(formData.totalAmount) || 0
    const paid = parseFloat(formData.paidAmount) || 0
    
    if (paid >= total) return 'paid'
    if (paid > 0) return 'partial'
    if (formData.dueDate < new Date()) return 'overdue'
    return 'pending'
  }
  
  const getStatusStyle = (status: ClientTransaction['status']) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    }

    switch (status) {
      case 'paid':
        return { ...baseStyle, backgroundColor: '#10b98120', color: '#10b981' }
      case 'partial':
        return { ...baseStyle, backgroundColor: '#f59e0b20', color: '#f59e0b' }
      case 'pending':
        return { ...baseStyle, backgroundColor: '#3b82f620', color: '#3b82f6' }
      case 'overdue':
        return { ...baseStyle, backgroundColor: '#ef444420', color: '#ef4444' }
      default:
        return { ...baseStyle, backgroundColor: '#6b728020', color: '#6b7280' }
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.totalAmount) {
      alert(language === 'AR' ? 'الوصف والمبلغ الإجمالي مطلوبان' : 'Description and total amount are required')
      return
    }
    
    setIsSubmitting(true)
    try {
      const transactionData = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: parseFloat(formData.paidAmount) || 0,
        remainingBalance: calculateRemainingBalance(),
        status: getPaymentStatus(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await onSave(transactionData)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        direction: language === 'AR' ? 'rtl' : 'ltr'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
            💰 {t('add_transaction')} - {client.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('order_number')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('site')}
                </label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  placeholder={language === 'AR' ? 'اختياري' : 'Optional'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {t('description')} *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'AR' ? 'وصف المعاملة أو الخدمة' : 'Transaction or service description'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('total_amount')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('paid_amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Payment Method • طريقة الدفع
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="cash">💵 {language === 'AR' ? 'نقدي' : 'Cash'}</option>
                  <option value="card">💳 {language === 'AR' ? 'بطاقة' : 'Card'}</option>
                  <option value="bank_transfer">🏦 {language === 'AR' ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                  <option value="check">📄 {language === 'AR' ? 'شيك' : 'Check'}</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {t('date')} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date.toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Due Date • تاريخ الاستحقاق
                </label>
                <input
                  type="date"
                  value={formData.dueDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
            
            {/* Calculation Summary */}
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--accent-primary)10',
              border: '2px solid var(--accent-primary)30',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                💰 {language === 'AR' ? 'ملخص الحساب' : 'Payment Summary'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {clientService.formatCurrency(parseFloat(formData.totalAmount) || 0, language)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {language === 'AR' ? 'المجموع' : 'Total'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                    {clientService.formatCurrency(parseFloat(formData.paidAmount) || 0, language)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {language === 'AR' ? 'مدفوع' : 'Paid'}
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: calculateRemainingBalance() > 0 ? '#f59e0b' : '#10b981' 
                  }}>
                    {clientService.formatCurrency(calculateRemainingBalance(), language)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {language === 'AR' ? 'متبقي' : 'Remaining'}
                  </div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '12px', 
                textAlign: 'center', 
                padding: '8px', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: '6px' 
              }}>
                <span style={{
                  ...getStatusStyle(getPaymentStatus())
                }}>
                  {language === 'AR' ? 
                    { paid: 'مدفوع', partial: 'جزئي', pending: 'معلق', overdue: 'متأخر' }[getPaymentStatus()] :
                    { paid: 'Paid', partial: 'Partial', pending: 'Pending', overdue: 'Overdue' }[getPaymentStatus()]
                  }
                </span>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Notes • ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === 'AR' ? 'ملاحظات إضافية حول المعاملة' : 'Additional notes about the transaction'}
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: 'var(--text-primary)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {t('cancel')}
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !formData.description || !formData.totalAmount}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (isSubmitting || !formData.description || !formData.totalAmount) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: (isSubmitting || !formData.description || !formData.totalAmount) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  {language === 'AR' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  💾 {t('save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, isWarning = false }: { title: string, value: string, isWarning?: boolean }) {
  return (
    <div style={{
      padding: '12px',
      backgroundColor: isWarning ? 'var(--accent-danger)10' : 'var(--bg-secondary)',
      border: `1px solid ${isWarning ? 'var(--accent-danger)' : 'var(--border-color)'}`,
      borderRadius: '6px',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        color: isWarning ? 'var(--accent-danger)' : 'var(--text-primary)' 
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: 'var(--text-secondary)', 
        marginTop: '4px' 
      }}>
        {title}
      </div>
    </div>
  )
}
