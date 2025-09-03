import React, { useState, useEffect } from 'react'
import { saveAs } from 'file-saver'
import { ReportGenerationService } from '../services/reportGenerationService'
import { MockDataService } from '../services/mockDataService'
import { ReportSchedulingService } from '../services/reportSchedulingService'
import { Report, ReportType, ReportFormat, Site, Employee, Client, Receipt } from '../types/reports'
import { settingsService, GlobalSettings } from '../services/settingsService'
import { ClientReportsManagement } from './ClientReportsManagement'

// Initialize scheduling service
if (typeof window !== 'undefined' && !ReportSchedulingService.getScheduledReports().length) {
  ReportSchedulingService.initialize()
  ReportSchedulingService.setupDefaultSchedules()
}

interface GeneratedReport extends Report {
  id: string
  title: string
  type: ReportType
  description: string
  dateRange: {
    start: string
    end: string
  }
  generatedBy: string
  generatedAt: string
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'
  format: ReportFormat
  fileSize?: string
  language: 'EN' | 'AR'
  blob?: Blob
  filename?: string
}

// Mock initial reports for demo
const getInitialReports = (): GeneratedReport[] => {
  return [
    {
      id: '1',
      title: 'Monthly Financial Report - March 2024',
      type: 'FINANCIAL',
      description: 'Complete financial overview including revenues, expenses, and profit analysis',
      dateRange: {
        start: '2024-03-01',
        end: '2024-03-31'
      },
      generatedBy: 'Ahmed Hassan',
      generatedAt: '2024-04-01T09:00:00Z',
      status: 'COMPLETED',
      format: 'PDF',
      fileSize: '2.4 MB',
      language: 'EN'
    } as GeneratedReport,
    {
      id: '2', 
      title: 'Employee Payroll Summary - Q1 2024',
      type: 'PAYROLL',
      description: 'Quarterly payroll summary with salary breakdowns and tax information',
      dateRange: {
        start: '2024-01-01',
        end: '2024-03-31'
      },
      generatedBy: 'Fatima Ali',
      generatedAt: '2024-04-02T14:30:00Z',
      status: 'COMPLETED',
      format: 'EXCEL',
      fileSize: '1.8 MB',
      language: 'AR'
    } as GeneratedReport
  ]
}

const reportTypes = [
  { id: 'FINANCIAL', label: 'Financial Reports', icon: '💰', description: 'Revenue, expenses, and profit analysis', color: '#10b981' },
  { id: 'PAYROLL', label: 'Payroll Reports', icon: '💵', description: 'Employee salary and benefits reports', color: '#3b82f6' },
  { id: 'EMPLOYEE', label: 'Employee Reports', icon: '👥', description: 'Staff management and performance reports', color: '#8b5cf6' },
  { id: 'SITE', label: 'Site Reports', icon: '🏗️', description: 'Construction site progress and management', color: '#f59e0b' },
  { id: 'SITE_PROGRESS', label: 'Site Progress Reports', icon: '📊', description: 'Detailed site task progress with timeline and analytics', color: '#2563eb' },
  { id: 'CLIENT_STATUS', label: 'Client Status Reports', icon: '👤', description: 'Professional client-facing project status reports', color: '#7c3aed' },
  { id: 'TASK_EXPORT', label: 'Task Data Export', icon: '📋', description: 'Export site tasks to Excel with advanced filtering', color: '#059669' },
  { id: 'EXPENSE', label: 'Expense Reports', icon: '💸', description: 'Cost analysis and expense tracking', color: '#ef4444' },
  { id: 'REVENUE', label: 'Revenue Reports', icon: '💹', description: 'Income analysis and client reports', color: '#06b6d4' },
  { id: 'CUSTOM', label: 'Custom Reports', icon: '📋', description: 'Create custom reports with specific criteria', color: '#64748b' },
  { id: 'RECEIPT', label: 'Receipt Generator', icon: '🧾', description: 'Generate professional receipts and invoices', color: '#84cc16' }
]

// Add CSS for spinning animation
const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// Inject styles if not already present
if (!document.querySelector('#report-animations')) {
  const style = document.createElement('style')
  style.id = 'report-animations'
  style.textContent = spinAnimation
  document.head.appendChild(style)
}

export function ReportsManagement() {
  const [reports, setReports] = useState<GeneratedReport[]>(getInitialReports())
  const [activeView, setActiveView] = useState<'reports' | 'generate' | 'clients'>('reports')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLanguage, setFilterLanguage] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState('')
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => settingsService.getSettings())
  
  // Load data for dropdowns
  const [sites] = useState<Site[]>(MockDataService.getSites())
  const [employees] = useState<Employee[]>(MockDataService.getEmployees())
  const [clients] = useState<Client[]>(MockDataService.getClients())

  // Load global settings and listen for updates
  useEffect(() => {
    const loadSettings = () => {
      const settings = settingsService.getSettings()
      setGlobalSettings(settings)
    }
    loadSettings()
    
    // Listen for storage changes to sync settings across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'management_system_settings') {
        loadSettings()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || report.type === filterType
    const matchesStatus = !filterStatus || report.status === filterStatus
    const matchesLanguage = !filterLanguage || report.language === filterLanguage
    return matchesSearch && matchesType && matchesStatus && matchesLanguage
  })

  const completedReports = reports.filter(r => r.status === 'COMPLETED').length
  const generatingReports = reports.filter(r => r.status === 'GENERATING').length
  const failedReports = reports.filter(r => r.status === 'FAILED').length
  const thisMonthReports = reports.filter(r => 
    new Date(r.generatedAt).getMonth() === new Date().getMonth()
  ).length

  const downloadReport = async (report: GeneratedReport) => {
    if (report.status !== 'COMPLETED') {
      setError('Report is not ready for download yet.')
      return
    }

    setDownloadingReport(report.id)
    setError(null)
    
    try {
      let blob: Blob
      let filename: string
      
      if (report.blob && report.filename) {
        // Use cached report if available
        blob = report.blob
        filename = report.filename
      } else {
        // Generate report on demand
        const filters = {
          dateRange: report.dateRange,
          // Add more filters based on report type
        }
        
        const result = await ReportGenerationService.generateReport(
          report.type,
          report.format,
          filters,
          report.language
        )
        
        blob = result.blob
        filename = result.filename
        
        // Cache the result
        const updatedReport = { ...report, blob, filename }
        setReports(prev => prev.map(r => r.id === report.id ? updatedReport : r))
      }
      
      // Download the file
      saveAs(blob, filename)
      
      setError(null)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download report. Please try again.')
    } finally {
      setDownloadingReport(null)
    }
  }

  const shareReport = (report: GeneratedReport) => {
    if (report.status !== 'COMPLETED') {
      setError('Report is not ready for sharing yet.')
      return
    }
    
    // Copy shareable link to clipboard
    const shareableLink = `${window.location.origin}/reports/shared/${report.id}`
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableLink).then(() => {
        setError(null)
        alert('Shareable link copied to clipboard!\n\n' + shareableLink)
      })
    } else {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareableLink
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        alert('Shareable link copied to clipboard!\n\n' + shareableLink)
      } catch (err) {
        alert('Failed to copy link. Please copy manually:\n\n' + shareableLink)
      }
      document.body.removeChild(textArea)
    }
  }

  const regenerateReport = async (report: GeneratedReport) => {
    setError(null)
    // Set report to generating status
    setReports(prev => prev.map(r => 
      r.id === report.id 
        ? { ...r, status: 'GENERATING' as const, generatedAt: new Date().toISOString(), blob: undefined, filename: undefined }
        : r
    ))
    
    try {
      // Generate the actual report
      const filters = {
        dateRange: report.dateRange,
        // Add more filters based on report type
      }
      
      const result = await ReportGenerationService.generateReport(
        report.type,
        report.format,
        filters,
        report.language
      )
      
      // Update report status to completed
      setReports(prev => prev.map(r =>
        r.id === report.id 
          ? { 
              ...r, 
              status: 'COMPLETED' as const,
              fileSize: `${(result.blob.size / 1024 / 1024).toFixed(1)} MB`,
              generatedAt: new Date().toISOString(),
              blob: result.blob,
              filename: result.filename
            }
          : r
      ))
      
      alert(`Report "${report.title}" regenerated successfully!`)
    } catch (error) {
      console.error('Regeneration failed:', error)
      setError(`Failed to regenerate report "${report.title}". Please try again.`)
      
      setReports(prev => prev.map(r =>
        r.id === report.id 
          ? { ...r, status: 'FAILED' as const }
          : r
      ))
    }
  }

  const deleteReport = (report: GeneratedReport) => {
    if (confirm(`Are you sure you want to delete "${report.title}"? This action cannot be undone.`)) {
      setReports(prev => prev.filter(r => r.id !== report.id))
      setError(null)
      alert(`Report "${report.title}" deleted successfully.`)
    }
  }

  const generateReport = async (reportData: any) => {
    setError(null)
    setIsLoading(true)
    
    const newReport: GeneratedReport = {
      id: Date.now().toString(),
      ...reportData,
      generatedBy: 'Current User',
      generatedAt: new Date().toISOString(),
      status: 'GENERATING' as const
    }
    
    setReports(prev => [newReport, ...prev])
    setShowGenerateModal(false)
    
    try {
      // Generate the actual report
      const result = await ReportGenerationService.generateReport(
        reportData.type,
        reportData.format,
        reportData.filters || {},
        reportData.language
      )
      
      // Update report status to completed
      setReports(prev => prev.map(report =>
        report.id === newReport.id 
          ? { 
              ...report, 
              status: 'COMPLETED' as const,
              fileSize: `${(result.blob.size / 1024 / 1024).toFixed(1)} MB`,
              blob: result.blob,
              filename: result.filename
            }
          : report
      ))
      
      alert(`Report "${newReport.title}" generated successfully!`)
    } catch (error) {
      console.error('Generation failed:', error)
      setError(`Failed to generate report "${newReport.title}". Please try regenerating.`)
      
      setReports(prev => prev.map(report =>
        report.id === newReport.id 
          ? { ...report, status: 'FAILED' as const }
          : report
      ))
    } finally {
      setIsLoading(false)
    }
  }

  // Generate receipt function
  const generateReceipt = async (receiptData: any) => {
    setError(null)
    setIsLoading(true)
    
    try {
      // Create a mock receipt object
      const receipt: Receipt = {
        id: Date.now().toString(),
        receiptNumber: `REC-${Date.now().toString().substring(8)}`,
        clientId: receiptData.clientId || 'manual-client',
        clientName: receiptData.clientName,
        items: receiptData.items || [{
          id: '1',
          description: receiptData.description || 'Service',
          quantity: receiptData.quantity || 1,
          unitPrice: receiptData.amount || 0,
          total: receiptData.amount || 0,
          category: 'Service'
        }],
        subtotal: receiptData.amount || 0,
        tax: (receiptData.amount || 0) * 0.15, // 15% VAT
        discount: receiptData.discount || 0,
        total: (receiptData.amount || 0) * 1.15 - (receiptData.discount || 0),
        amountPaid: receiptData.amountPaid || 0,
        balance: ((receiptData.amount || 0) * 1.15 - (receiptData.discount || 0)) - (receiptData.amountPaid || 0),
        issueDate: receiptData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: receiptData.dueDate,
        paymentStatus: receiptData.amountPaid >= ((receiptData.amount || 0) * 1.15 - (receiptData.discount || 0)) ? 'PAID' : 'PARTIAL',
        paymentMethod: receiptData.paymentMethod || 'Cash',
        notes: receiptData.notes || 'Thank you for your business',
        language: receiptData.language || 'EN'
      }
      
      const result = await ReportGenerationService.generateReceiptPDF(receipt)
      saveAs(result.blob, result.filename)
      
      alert('Receipt generated and downloaded successfully!')
    } catch (error) {
      console.error('Receipt generation failed:', error)
      setError('Failed to generate receipt. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div>
      {/* View Toggle */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'var(--bg-primary)', 
          borderRadius: '8px', 
          padding: '4px',
          boxShadow: 'var(--shadow-sm)',
          width: 'fit-content'
        }}>
          {[
            { id: 'reports', label: 'Reports Library', icon: '📊' },
            { id: 'generate', label: 'Generate Report', icon: '➕' },
            { id: 'clients', label: 'Client Reports', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: activeView === tab.id ? '#3b82f6' : 'transparent',
                color: activeView === tab.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeView === 'reports' && (
        <div>
          {/* Error Display */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              color: '#dc2626'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <SummaryCard
              title="Completed Reports"
              value={completedReports.toString()}
              icon="✅"
              color="#10b981"
            />
            <SummaryCard
              title="Generating"
              value={generatingReports.toString()}
              icon="⏳"
              color="#f59e0b"
            />
            <SummaryCard
              title="This Month"
              value={thisMonthReports.toString()}
              icon="📅"
              color="#3b82f6"
            />
            <SummaryCard
              title="Failed Reports"
              value={failedReports.toString()}
              icon="❌"
              color="#ef4444"
            />
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '20px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Reports Library</h3>
              <button
                onClick={() => setShowGenerateModal(true)}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + Generate New Report
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search reports by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '120px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">All Types</option>
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '120px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="GENERATING">Generating</option>
                <option value="FAILED">Failed</option>
              </select>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '100px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">All Languages</option>
                <option value="EN">English</option>
                <option value="AR">العربية</option>
              </select>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {filteredReports.length} reports
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReports.map(report => (
            <ReportCard 
              key={report.id} 
              report={report}
              onDownload={() => downloadReport(report)}
              onShare={() => shareReport(report)}
              onRegenerate={() => regenerateReport(report)}
              onDelete={() => deleteReport(report)}
              isDownloading={downloadingReport === report.id}
            />
          ))}
          </div>

          {filteredReports.length === 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-sm)',
              padding: '60px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                No reports found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {searchTerm || filterType || filterStatus || filterLanguage 
                  ? 'Try adjusting your search filters'
                  : 'Generate your first report to get started'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {activeView === 'clients' && (
        <ClientReportsManagement />
      )}

      {activeView === 'generate' && (
        <div>
          {/* Quick Report Templates */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '20px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Quick Report Templates
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
              Choose from our pre-designed report templates or create a custom report with specific criteria.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {reportTypes.map(type => (
                <ReportTemplateCard
                  key={type.id}
                  type={type}
                  onGenerate={() => {
                    if (type.id === 'RECEIPT') {
                      // Handle receipt generator differently
                      return
                    }
                    generateReport({
                      type: type.id,
                      title: `${type.label} - ${new Date().toLocaleDateString()}`,
                      description: type.description,
                      dateRange: {
                        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                      },
                      format: 'PDF',
                      language: 'EN'
                    })
                  }}
                />
              ))}
            </div>
          </div>

          {/* Receipt Generator Special Section */}
          <ReceiptGeneratorSection globalSettings={globalSettings} />

          {/* Custom Report Builder */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Custom Report Builder
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Create a customized report with your specific requirements and data filters.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🎨 Build Custom Report
            </button>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <GenerateReportModal
          reportTypes={reportTypes}
          onGenerate={generateReport}
          onClose={() => setShowGenerateModal(false)}
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
      boxShadow: 'var(--shadow-sm)',
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

function ReportCard({ report, onDownload, onShare, onRegenerate, onDelete, isDownloading }: { 
  report: Report
  onDownload: () => void
  onShare: () => void
  onRegenerate: () => void
  onDelete: () => void
  isDownloading: boolean
}) {
  const statusColors: Record<string, string> = {
    COMPLETED: '#10b981',
    GENERATING: '#f59e0b',
    FAILED: '#ef4444'
  }

  const typeIcons: Record<ReportType | string, string> = {
    FINANCIAL: '💰',
    PAYROLL: '💵',
    EMPLOYEE: '👥',
    SITE: '🏗️',
    SITE_PROGRESS: '📊',
    CLIENT_STATUS: '👤',
    TASK_EXPORT: '📋',
    EXPENSE: '💸',
    REVENUE: '💹',
    CUSTOM: '📋',
    RECEIPT: '🧾',
    INVOICE: '📎'
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-sm)',
      padding: '20px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-1px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px' }}>{typeIcons[report.type]}</span>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
              {report.title}
            </h4>
            <span style={{
              backgroundColor: statusColors[report.status] + '20',
              color: statusColors[report.status],
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {report.status}
            </span>
            <span style={{
              backgroundColor: report.language === 'AR' ? '#8b5cf6' : '#3b82f6',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {report.language === 'AR' ? 'العربية' : 'English'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {report.format}
          </div>
          {report.fileSize && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {report.fileSize}
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
        {report.description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Generated by {report.generatedBy} • {new Date(report.generatedAt).toLocaleDateString()}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {report.status === 'COMPLETED' && (
            <>
              <button
                onClick={onDownload}
                disabled={isDownloading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: isDownloading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isDownloading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Downloading...
                  </>
                ) : (
                  <>📥 Download</>
                )}
              </button>
              <button
                onClick={onShare}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔗 Share
              </button>
              <button
                onClick={onDelete}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️ Delete
              </button>
            </>
          )}
          {report.status === 'FAILED' && (
            <>
              <button
                onClick={onRegenerate}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔄 Regenerate
              </button>
              <button
                onClick={onDelete}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️ Delete
              </button>
            </>
          )}
          {report.status === 'GENERATING' && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#f59e0b20',
              color: '#f59e0b',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Generating...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GenerateReportView({ reportTypes, onGenerate, selectedType, onTypeSelect }: {
  reportTypes: any[]
  onGenerate: (data: any) => void
  selectedType: string
  onTypeSelect: (type: string) => void
}) {
  return (
    <div>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, marginBottom: '20px' }}>
          Generate New Report
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Select a report type to generate comprehensive analytics and insights for your business.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {reportTypes.map(type => (
            <ReportTypeCard
              key={type.id}
              type={type}
              isSelected={selectedType === type.id}
              onSelect={() => onTypeSelect(type.id)}
              onGenerate={() => {
                // Open generation modal with pre-selected type
                onGenerate({
                  type: type.id,
                  title: `${type.label} - ${new Date().toLocaleDateString()}`,
                  description: type.description,
                  dateRange: {
                    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  },
                  format: 'PDF',
                  language: 'EN'
                })
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReportTypeCard({ type, isSelected, onSelect, onGenerate }: {
  type: any
  isSelected: boolean
  onSelect: () => void
  onGenerate: () => void
}) {
  return (
    <div
      style={{
        backgroundColor: isSelected ? '#3b82f620' : 'white',
        border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>{type.icon}</span>
        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1e293b' }}>
          {type.label}
        </h4>
      </div>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
        {type.description}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onGenerate()
          }}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Quick Generate
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Open detailed configuration modal
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Configure
        </button>
      </div>
    </div>
  )
}

function ReportTemplateCard({ type, onGenerate }: {
  type: any
  onGenerate: () => void
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: `2px solid ${type.color}30`,
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 25px ${type.color}20`
        e.currentTarget.style.borderColor = type.color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `${type.color}30`
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '80px',
        height: '80px',
        background: `linear-gradient(45deg, ${type.color}15, transparent)`,
        borderRadius: '0 12px 0 100%'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: type.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: `0 4px 12px ${type.color}30`
          }}>
            {type.icon}
          </div>
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
              {type.label}
            </h4>
            <div style={{ fontSize: '12px', color: type.color, fontWeight: '500', marginTop: '2px' }}>
              Quick Generate
            </div>
          </div>
        </div>
        
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
          {type.description}
        </p>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onGenerate()
          }}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: type.color,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${type.color}40`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ⚡ Generate Now
        </button>
      </div>
    </div>
  )
}

function ReceiptGeneratorSection({ globalSettings }: { globalSettings: GlobalSettings }) {
  
  const [receiptData, setReceiptData] = useState({
    clientName: '',
    clientEmail: '',
    amount: '',
    taxRate: globalSettings.taxRate.toString(),
    taxAmount: '',
    discount: '0',
    subtotal: '',
    totalAmount: '',
    amountPaid: '',
    balance: '',
    description: '',
    paymentMethod: 'cash',
    language: 'EN',
    currency: globalSettings.currency,
    date: new Date().toISOString().split('T')[0]
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Update receipt data when global settings change
  React.useEffect(() => {
    const currentSettings = settingsService.getSettings()
    setReceiptData(prev => ({
      ...prev,
      taxRate: currentSettings.taxRate.toString(),
      currency: currentSettings.currency
    }))
  }, [])

  // Auto-calculate tax, totals, and balance
  React.useEffect(() => {
    const amount = parseFloat(receiptData.amount) || 0
    const taxRate = parseFloat(receiptData.taxRate) / 100 || 0
    const discount = parseFloat(receiptData.discount) || 0
    const amountPaid = parseFloat(receiptData.amountPaid) || 0
    
    const subtotal = amount - discount
    const tax = subtotal * taxRate
    const total = subtotal + tax
    const balance = total - amountPaid
    
    setReceiptData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      taxAmount: tax.toFixed(2),
      totalAmount: total.toFixed(2),
      balance: balance.toFixed(2)
    }))
  }, [receiptData.amount, receiptData.taxRate, receiptData.discount, receiptData.amountPaid])

  // Enhanced success/error notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create beautiful notification popup
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
      transition: all 0.3s ease;
      ${type === 'success' ? `
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: 1px solid #10b98150;
      ` : type === 'error' ? `
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: 1px solid #ef444450;
      ` : `
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: 1px solid #3b82f650;
      `}
    `
    
    // Add CSS animation if not exists
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style')
      style.id = 'notification-styles'
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 20px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Auto remove after 4 seconds with animation
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease'
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 4000)
  }

  const generateReceipt = async () => {
    // Enhanced form validation
    const requiredFields = [
      { field: 'clientName', message: 'Client name is required • اسم العميل مطلوب' },
      { field: 'amount', message: 'Amount is required • المبلغ مطلوب' },
      { field: 'description', message: 'Service description is required • وصف الخدمة مطلوب' }
    ]
    
    for (const { field, message } of requiredFields) {
      if (!receiptData[field as keyof typeof receiptData]) {
        showNotification(message, 'error')
        return
      }
    }
    
    // Validate amount is positive
    if (parseFloat(receiptData.amount) <= 0) {
      showNotification('Amount must be greater than zero • يجب أن يكون المبلغ أكبر من الصفر', 'error')
      return
    }

    setIsGenerating(true)
    showNotification('Generating professional receipt... • جارٍ إنشاء إيصال احترافي...', 'info')
    
    try {
      // Create receipt object for PDF generation
      const receipt: Receipt = {
        id: Date.now().toString(),
        receiptNumber: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        clientId: 'walk-in',
        clientName: receiptData.clientName,
        items: [{
          id: '1',
          description: receiptData.description,
          quantity: 1,
          unitPrice: parseFloat(receiptData.amount) || 0,
          total: parseFloat(receiptData.amount) || 0,
          category: 'Service'
        }],
        subtotal: parseFloat(receiptData.amount) || 0,
        tax: parseFloat(receiptData.taxAmount) || 0,
        discount: 0,
        total: parseFloat(receiptData.totalAmount) || 0,
        amountPaid: parseFloat(receiptData.totalAmount) || 0,
        balance: 0,
        issueDate: receiptData.date,
        paymentStatus: 'PAID',
        paymentMethod: receiptData.paymentMethod,
        notes: `Generated via Management System - ${receiptData.paymentMethod.toUpperCase()} payment`,
        language: receiptData.language as 'EN' | 'AR'
      }
      
      const result = await ReportGenerationService.generateReceiptPDF(receipt)
      
      // Download the PDF with smooth animation
      const url = window.URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showNotification(
        `✨ Professional receipt generated successfully! • تم إنشاء الإيصال الإحترافي بنجاح!\n📄 File: ${result.filename}`,
        'success'
      )
      
      // Reset form with animation
      setTimeout(() => {
        setReceiptData({
          clientName: '',
          clientEmail: '',
          amount: '',
          taxRate: globalSettings.taxRate.toString(),
          taxAmount: '',
          discount: '0',
          subtotal: '',
          totalAmount: '',
          amountPaid: '',
          balance: '',
          description: '',
          paymentMethod: 'cash',
          language: 'EN',
          currency: globalSettings.currency,
          date: new Date().toISOString().split('T')[0]
        })
      }, 1000)
      
    } catch (error) {
      console.error('Receipt generation failed:', error)
      showNotification(
        'Failed to generate receipt. Please try again. • فشل في إنشاء الإيصال. يرجى المحاولة مرة أخرى.',
        'error'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(132, 204, 22, 0.15)',
      marginBottom: '24px',
      padding: '24px',
      border: '2px solid #84cc1630',
      position: 'relative',
      overflow: 'hidden',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '120px',
        height: '120px',
        background: 'linear-gradient(45deg, #84cc1620, transparent)',
        borderRadius: '50%'
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #84cc16, #65a30d)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 8px 20px rgba(132, 204, 22, 0.3)'
        }}>
          🧾
        </div>
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            إنشاء إيصال / Receipt Generator
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: '4px 0 0 0', lineHeight: '1.5' }}>
            Generate professional receipts instantly • إنشاء إيصالات احترافية فورية
          </p>
        </div>
      </div>

      {/* Responsive Form Layout */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Row 1: Client & Payment Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Client Information */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            👤 Client Information
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Client Name • اسم العميل *
              </label>
              <input
                type="text"
                value={receiptData.clientName}
                onChange={(e) => setReceiptData({ ...receiptData, clientName: e.target.value })}
                placeholder="Enter client name / أدخل اسم العميل"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Email • البريد الإلكتروني
              </label>
              <input
                type="email"
                value={receiptData.clientEmail}
                onChange={(e) => setReceiptData({ ...receiptData, clientEmail: e.target.value })}
                placeholder="client@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>
        </div>

          {/* Payment Details */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            💰 Payment Details • تفاصيل الدفع
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Amount ({globalSettings.currency}) • المبلغ *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receiptData.amount}
                onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Discount ({globalSettings.currency}) • خصم
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={receiptData.discount}
                  onChange={(e) => setReceiptData({ ...receiptData, discount: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Tax Rate (%) • معدل الضريبة
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={receiptData.taxRate}
                  onChange={(e) => setReceiptData({ ...receiptData, taxRate: e.target.value })}
                  placeholder="15"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>
            
            {/* Calculation Summary Box */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '2px solid #84cc1650',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '8px'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--text-primary)', textAlign: 'center' }}>
                💰 Calculation Summary • ملخص الحسابات
              </h5>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Subtotal • المجموع الفرعي
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {receiptData.subtotal || '0.00'} {globalSettings.currency}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Tax ({receiptData.taxRate}%) • الضريبة
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {receiptData.taxAmount || '0.00'} {globalSettings.currency}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: '12px',
                  backgroundColor: 'linear-gradient(135deg, #84cc1620, #65a30d20)',
                  borderRadius: '8px',
                  border: '2px solid #84cc16',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Total Amount • إجمالي المبلغ
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534' }}>
                    {receiptData.totalAmount || '0.00'} {globalSettings.currency}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Payment Method • طريقة الدفع
              </label>
              <select
                value={receiptData.paymentMethod}
                onChange={(e) => setReceiptData({ ...receiptData, paymentMethod: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="cash">💵 Cash • نقدي</option>
                <option value="card">💳 Card • بطاقة</option>
                <option value="bank_transfer">🏦 Bank Transfer • حوالة بنكية</option>
                <option value="check">📄 Check • شيك</option>
              </select>
            </div>
          </div>
        </div>
        </div>
        
        {/* Row 2: Service Details & Payment Tracking */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Service Details */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              📝 Service Details • تفاصيل الخدمة
            </h4>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Description • الوصف *
                </label>
                <textarea
                  value={receiptData.description}
                  onChange={(e) => setReceiptData({ ...receiptData, description: e.target.value })}
                  placeholder="Service description / وصف الخدمة"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Date • التاريخ
                  </label>
                  <input
                    type="date"
                    value={receiptData.date}
                    onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Language • اللغة
                  </label>
                  <select
                    value={receiptData.language}
                    onChange={(e) => setReceiptData({ ...receiptData, language: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="EN">🇺🇸 English</option>
                    <option value="AR">🇱🇾 العربية</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Tracking */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            💳 Payment Tracking • تتبع الدفعات
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Amount Paid ({globalSettings.currency}) • المبلغ المدفوع
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receiptData.amountPaid}
                onChange={(e) => setReceiptData({ ...receiptData, amountPaid: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#84cc16'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            {/* Balance Display */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: parseFloat(receiptData.balance) > 0 ? '#fef3c7' : '#dcfce7',
              border: `2px solid ${parseFloat(receiptData.balance) > 0 ? '#f59e0b' : '#84cc16'}`,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Remaining Balance • الرصيد المتبقي
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: parseFloat(receiptData.balance) > 0 ? '#f59e0b' : '#22c55e'
              }}>
                {receiptData.balance || '0.00'} {globalSettings.currency}
              </div>
              {parseFloat(receiptData.balance) > 0 && (
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                  ⚠️ Payment Incomplete
                </div>
              )}
              {parseFloat(receiptData.balance) === 0 && parseFloat(receiptData.totalAmount) > 0 && (
                <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>
                  ✅ Fully Paid
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Generate Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={generateReceipt}
          disabled={isGenerating || !receiptData.clientName || !receiptData.amount || !receiptData.description}
          style={{
            padding: '16px 32px',
            background: isGenerating ? 'var(--text-muted)' : 'linear-gradient(135deg, #84cc16, #65a30d)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 20px rgba(132, 204, 22, 0.3)',
            minWidth: '200px',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(132, 204, 22, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(132, 204, 22, 0.3)'
          }}
        >
          {isGenerating ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              إنشاء الإيصال...
            </>
          ) : (
            <>
              🧾 إنشاء إيصال / Generate Receipt
            </>
          )}
        </button>
      </div>
      
      {/* Info Footer */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #84cc1650',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#166534',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <strong>Professional Receipt Generation</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>✅ Automatic tax calculation (15% VAT) • حساب الضرائب التلقائي</li>
          <li>✅ Professional PDF format with company branding • تنسيق PDF احترافي</li>
          <li>✅ Bilingual support (English/Arabic) • دعم ثنائي اللغة</li>
          <li>✅ Sequential receipt numbering • ترقيم متسلسل للإيصالات</li>
        </ul>
      </div>
    </div>
  )
}

function GenerateReportModal({ reportTypes, onGenerate, onClose }: {
  reportTypes: any[]
  onGenerate: (data: any) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    type: 'FINANCIAL',
    title: '',
    description: '',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    format: 'PDF',
    language: 'EN'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.description) {
      onGenerate(formData)
    }
  }

  const selectedType = reportTypes.find(t => t.id === formData.type)

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
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Generate New Report
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Report Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              {selectedType && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {selectedType.description}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Report Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter report title"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what this report will contain"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateRange.start}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dateRange: { ...formData.dateRange, start: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateRange.end}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dateRange: { ...formData.dateRange, end: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Format *
                </label>
                <select
                  required
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="PDF">PDF Document</option>
                  <option value="EXCEL">Excel Spreadsheet</option>
                  <option value="CSV">CSV File</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Language *
                </label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="EN">English</option>
                  <option value="AR">العربية (Arabic)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f8fafc',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
