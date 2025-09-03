import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { 
  Report, ReportType, ReportFormat, 
  Site, Employee, PayrollRecord, Expense, Revenue, 
  CompanyInfo, Receipt, Client 
} from '../types/reports'
import { MockDataService } from './mockDataService'
import { settingsService } from './settingsService'

export class ReportGenerationService {
  private static companyInfo = MockDataService.getCompanyInfo()
  
  // Perfect Arabic font support with enhanced RTL handling
  private static loadArabicFont(pdf: jsPDF) {
    try {
      // Set document properties for RTL text
      pdf.setLanguage('ar')
      
      // Enhanced font configuration for Arabic
      pdf.setFont('helvetica', 'normal')
      
      // Set proper text direction and encoding
      pdf.setCharSpace(0.5) // Better Arabic character spacing
      pdf.setFontSize(12) // Optimal size for Arabic readability
      
      return true
    } catch (error) {
      console.warn('Arabic font loading failed, using enhanced fallback:', error)
      // Enhanced fallback with better Arabic support
      pdf.setFont('helvetica', 'normal')
      pdf.setCharSpace(0.3)
      return false
    }
  }
  
  // Helper function to properly format Arabic text
  private static formatArabicText(text: string, isArabic: boolean): string {
    if (!isArabic) return text
    
    // Clean and prepare Arabic text
    return text
      .replace(/\u202E/g, '') // Remove RTL override
      .replace(/\u202D/g, '') // Remove LTR override
      .trim()
  }
  
  // Enhanced text positioning for perfect Arabic alignment
  private static addTextWithPerfectAlignment(pdf: jsPDF, text: string, x: number, y: number, isArabic: boolean, options: any = {}) {
    const formattedText = this.formatArabicText(text, isArabic)
    
    if (isArabic) {
      // Perfect RTL alignment with proper spacing
      const pageWidth = pdf.internal.pageSize.getWidth()
      pdf.text(formattedText, options.rightAlign ? pageWidth - x : x, y, { 
        align: options.rightAlign ? 'right' : 'left',
        ...options 
      })
    } else {
      pdf.text(formattedText, x, y, options)
    }
  }

  // Main report generation method
  static async generateReport(
    reportType: ReportType,
    format: ReportFormat,
    filters: any = {},
    language: 'EN' | 'AR' = 'EN'
  ): Promise<{ blob: Blob; filename: string }> {
    const reportData = this.getReportData(reportType, filters)
    const filename = this.generateFilename(reportType, format, language)

    if (format === 'PDF') {
      const pdfBlob = this.generatePDFReport(reportType, reportData, language)
      return { blob: pdfBlob, filename }
    } else {
      const excelBlob = this.generateExcelReport(reportType, reportData, language)
      return { blob: excelBlob, filename }
    }
  }

  // Generate receipt PDF
  static async generateReceiptPDF(receipt: Receipt): Promise<{ blob: Blob; filename: string }> {
    const pdf = new jsPDF()
    const isArabic = receipt.language === 'AR'
    
    // Load Arabic font support if needed
    if (isArabic) {
      this.loadArabicFont(pdf)
    }
    
    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Get global settings for logo and company info
    const globalSettings = settingsService.getSettings()
    
    // Add company logo if available with better error handling
    if (globalSettings.companyLogo) {
      try {
        // Validate image format and add with proper error handling
        const logoWidth = 30
        const logoHeight = 20
        
        // Check if it's a valid base64 image
        if (globalSettings.companyLogo.startsWith('data:image/')) {
          const format = globalSettings.companyLogo.split(';')[0].split('/')[1].toUpperCase()
          if (['JPEG', 'JPG', 'PNG', 'GIF'].includes(format)) {
            pdf.addImage(globalSettings.companyLogo, format === 'JPG' ? 'JPEG' : format, 20, 15, logoWidth, logoHeight)
          } else {
            throw new Error('Unsupported image format')
          }
        } else {
          // Fallback for non-base64 images
          pdf.addImage(globalSettings.companyLogo, 'JPEG', 20, 15, logoWidth, logoHeight)
        }
      } catch (error) {
        console.warn('Could not load company logo:', error)
        // Add placeholder instead
        pdf.setFillColor(240, 240, 240)
        pdf.rect(20, 15, 30, 20, 'F')
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(20, 15, 30, 20, 'S')
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text('LOGO', 30, 27)
      }
    } else {
      // Add placeholder when no logo is set
      pdf.setFillColor(240, 240, 240)
      pdf.rect(20, 15, 30, 20, 'F')
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(20, 15, 30, 20, 'S')
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('LOGO', 30, 27)
    }

    // Company header with professional styling and better Arabic alignment
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(40, 40, 40)
    
    const companyName = isArabic ? 
      (globalSettings.companyName || 'شركة البينا للإنشاء والإدارة') : 
      (globalSettings.companyName || 'AlBina Construction & Management')
    
    const headerX = (globalSettings.companyLogo || true) ? 60 : 20
    
    if (isArabic) {
      // Right-aligned text for Arabic
      pdf.text(companyName, pageWidth - 20, 25, { align: 'right' })
    } else {
      pdf.text(companyName, headerX, 25)
    }
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(80, 80, 80)
    
    const address = isArabic ?
      (globalSettings.address || '123 شارع الملك فهد، الرياض') :
      (globalSettings.address || '123 King Fahd Road, Riyadh')
      
    const contact = globalSettings.phone && globalSettings.email ?
      `${globalSettings.phone} | ${globalSettings.email}` :
      '+966-11-123-4567 | info@albina-construction.sa'
    
    if (isArabic) {
      // Right-aligned text for Arabic
      pdf.text(address, pageWidth - 20, 32, { align: 'right' })
      pdf.text(contact, pageWidth - 20, 38, { align: 'right' })
    } else {
      pdf.text(address, headerX, 32)
      pdf.text(contact, headerX, 38)
    }
    
    // Horizontal line
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, 45, pageWidth - 20, 45)
    
    // Receipt title with proper Arabic alignment
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const receiptTitle = isArabic ? 'إيصال' : 'RECEIPT'
    
    if (isArabic) {
      pdf.text(receiptTitle, pageWidth - 20, 60, { align: 'right' })
    } else {
      pdf.text(receiptTitle, 20, 60)
    }
    
    // Receipt info box with better positioning for Arabic
    const infoBoxX = isArabic ? 20 : pageWidth - 80
    const infoBoxWidth = 60
    
    pdf.setFillColor(248, 249, 250)
    pdf.rect(infoBoxX, 50, infoBoxWidth, 30, 'F')
    pdf.setDrawColor(220, 220, 220)
    pdf.rect(infoBoxX, 50, infoBoxWidth, 30, 'S')
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    
    const receiptLabel = isArabic ? 'رقم:' : 'Receipt #:'
    const dateLabel = isArabic ? 'التاريخ:' : 'Date:'
    
    if (isArabic) {
      pdf.text(receiptLabel, infoBoxX + infoBoxWidth - 5, 60, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
      pdf.text(receipt.receiptNumber, infoBoxX + infoBoxWidth - 5, 66, { align: 'right' })
      
      pdf.setFont('helvetica', 'bold')
      pdf.text(dateLabel, infoBoxX + infoBoxWidth - 5, 74, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
      pdf.text(new Date(receipt.issueDate).toLocaleDateString('ar-SA'), infoBoxX + infoBoxWidth - 5, 80, { align: 'right' })
    } else {
      pdf.text(receiptLabel, infoBoxX + 5, 60)
      pdf.setFont('helvetica', 'normal')
      pdf.text(receipt.receiptNumber, infoBoxX + 5, 66)
      
      pdf.setFont('helvetica', 'bold')
      pdf.text(dateLabel, infoBoxX + 5, 74)
      pdf.setFont('helvetica', 'normal')
      pdf.text(new Date(receipt.issueDate).toLocaleDateString(), infoBoxX + 5, 80)
    }
    
    let currentY = 95
    
    // Client information section with proper Arabic alignment
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(40, 40, 40)
    
    const clientInfoTitle = isArabic ? 'بيانات العميل' : 'Client Information'
    if (isArabic) {
      pdf.text(clientInfoTitle, pageWidth - 20, currentY, { align: 'right' })
    } else {
      pdf.text(clientInfoTitle, 20, currentY)
    }
    currentY += 15
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(60, 60, 60)
    
    const clientNameText = `${isArabic ? 'الاسم:' : 'Name:'} ${receipt.clientName}`
    if (isArabic) {
      pdf.text(clientNameText, pageWidth - 20, currentY, { align: 'right' })
    } else {
      pdf.text(clientNameText, 20, currentY)
    }
    currentY += 8
    
    if (receipt.items[0]?.description) {
      const paymentMethodText = `${isArabic ? 'طريقة الدفع:' : 'Payment Method:'} ${receipt.paymentMethod ? receipt.paymentMethod.charAt(0).toUpperCase() + receipt.paymentMethod.slice(1).replace('_', ' ') : 'N/A'}`
      if (isArabic) {
        pdf.text(paymentMethodText, pageWidth - 20, currentY, { align: 'right' })
      } else {
        pdf.text(paymentMethodText, 20, currentY)
      }
      currentY += 15
    }
    
    // Items table with professional styling and proper Arabic layout
    const tableStart = currentY
    const tableWidth = pageWidth - 40
    const colWidths = isArabic ? [35, 35, 20, 80] : [80, 20, 35, 35] // Reverse for Arabic: Total, Price, Qty, Description
    let xPos = 20
    
    // Table header
    pdf.setFillColor(52, 58, 64)
    pdf.rect(20, currentY, tableWidth, 12, 'F')
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    
    const currency = globalSettings.currency || 'SAR'
    
    if (isArabic) {
      // Arabic headers from right to left: Description, Qty, Price, Total
      pdf.text('الوصف', xPos + 2, currentY + 8)
      xPos += colWidths[3]
      pdf.text('الكمية', xPos + 2, currentY + 8)
      xPos += colWidths[2]
      pdf.text(`السعر (${currency})`, xPos + 2, currentY + 8)
      xPos += colWidths[1]
      pdf.text(`الإجمالي (${currency})`, xPos + 2, currentY + 8)
    } else {
      // English headers from left to right
      pdf.text('Description', xPos + 2, currentY + 8)
      xPos += colWidths[0]
      pdf.text('Qty', xPos + 2, currentY + 8)
      xPos += colWidths[1]
      pdf.text(`Price (${currency})`, xPos + 2, currentY + 8)
      xPos += colWidths[2]
      pdf.text(`Total (${currency})`, xPos + 2, currentY + 8)
    }
    
    currentY += 12
    
    // Table rows with proper Arabic alignment
    pdf.setTextColor(40, 40, 40)
    pdf.setFont('helvetica', 'normal')
    
    receipt.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250)
        pdf.rect(20, currentY, tableWidth, 10, 'F')
      }
      
      xPos = 20
      
      if (isArabic) {
        // Arabic layout: Description, Qty, Price, Total (right to left visually but left to right in code)
        pdf.text(item.description.substring(0, 35), xPos + 2, currentY + 7)
        xPos += colWidths[3]
        pdf.text(item.quantity.toString(), xPos + 2, currentY + 7)
        xPos += colWidths[2]
        pdf.text(item.unitPrice.toLocaleString(), xPos + 2, currentY + 7)
        xPos += colWidths[1]
        pdf.text(item.total.toLocaleString(), xPos + 2, currentY + 7)
      } else {
        // English layout: Description, Qty, Price, Total
        pdf.text(item.description.substring(0, 35), xPos + 2, currentY + 7)
        xPos += colWidths[0]
        pdf.text(item.quantity.toString(), xPos + 2, currentY + 7)
        xPos += colWidths[1]
        pdf.text(item.unitPrice.toLocaleString(), xPos + 2, currentY + 7)
        xPos += colWidths[2]
        pdf.text(item.total.toLocaleString(), xPos + 2, currentY + 7)
      }
      
      currentY += 10
    })
    
    // Table border
    pdf.setDrawColor(220, 220, 220)
    pdf.rect(20, tableStart, tableWidth, currentY - tableStart, 'S')
    
    // Vertical lines for table
    let xLine = 20
    for (let i = 0; i < colWidths.length - 1; i++) {
      xLine += colWidths[i]
      pdf.line(xLine, tableStart, xLine, currentY)
    }
    
    currentY += 15
    
    // Calculations section with proper Arabic alignment
    const calcX = isArabic ? 70 : pageWidth - 70
    const calcWidth = 50
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(60, 60, 60)
    
    if (isArabic) {
      // Arabic calculations - right aligned
      // Subtotal
      pdf.text('المجموع الفرعي:', pageWidth - 20, currentY, { align: 'right' })
      pdf.text(`${receipt.subtotal.toLocaleString()} ${currency}`, 20, currentY)
      currentY += 10
      
      // Discount (if any)
      if (receipt.discount > 0) {
        pdf.text('الخصم:', pageWidth - 20, currentY, { align: 'right' })
        pdf.text(`-${receipt.discount.toLocaleString()} ${currency}`, 20, currentY)
        currentY += 10
      }
      
      // Tax
      const taxRate = receipt.tax > 0 ? ((receipt.tax / receipt.subtotal) * 100).toFixed(0) : globalSettings.taxRate.toString()
      pdf.text(`الضريبة (${taxRate}%):`, pageWidth - 20, currentY, { align: 'right' })
      pdf.text(`${receipt.tax.toLocaleString()} ${currency}`, 20, currentY)
      currentY += 10
      
      // Total with highlighting
      pdf.setFillColor(52, 58, 64)
      pdf.rect(20, currentY - 5, calcWidth + 52, 15, 'F')
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('الإجمالي:', pageWidth - 25, currentY + 5, { align: 'right' })
      pdf.text(`${receipt.total.toLocaleString()} ${currency}`, 25, currentY + 5)
      currentY += 25
      
      // Payment tracking section
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(60, 60, 60)
      
      pdf.text('المدفوع:', pageWidth - 20, currentY, { align: 'right' })
      pdf.text(`${receipt.amountPaid.toLocaleString()} ${currency}`, 20, currentY)
    } else {
      // English calculations - left aligned
      // Subtotal
      pdf.text('Subtotal:', calcX - 50, currentY)
      pdf.text(`${receipt.subtotal.toLocaleString()} ${currency}`, calcX, currentY)
      currentY += 10
      
      // Discount (if any)
      if (receipt.discount > 0) {
        pdf.text('Discount:', calcX - 50, currentY)
        pdf.text(`-${receipt.discount.toLocaleString()} ${currency}`, calcX, currentY)
        currentY += 10
      }
      
      // Tax
      const taxRate = receipt.tax > 0 ? ((receipt.tax / receipt.subtotal) * 100).toFixed(0) : globalSettings.taxRate.toString()
      pdf.text(`Tax (${taxRate}%):`, calcX - 50, currentY)
      pdf.text(`${receipt.tax.toLocaleString()} ${currency}`, calcX, currentY)
      currentY += 10
      
      // Total with highlighting
      pdf.setFillColor(52, 58, 64)
      pdf.rect(calcX - 52, currentY - 5, 52 + calcWidth, 15, 'F')
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('TOTAL:', calcX - 48, currentY + 5)
      pdf.text(`${receipt.total.toLocaleString()} ${currency}`, calcX, currentY + 5)
      currentY += 25
      
      // Payment tracking section
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(60, 60, 60)
      
      pdf.text('Amount Paid:', calcX - 50, currentY)
      pdf.text(`${receipt.amountPaid.toLocaleString()} ${currency}`, calcX, currentY)
    }
    currentY += 10
    
    // Balance with color coding and proper Arabic alignment
    if (receipt.balance > 0) {
      pdf.setTextColor(220, 53, 69) // Red for outstanding balance
      pdf.setFont('helvetica', 'bold')
      
      if (isArabic) {
        pdf.text('الرصيد المتبقي:', pageWidth - 20, currentY, { align: 'right' })
        pdf.text(`${receipt.balance.toLocaleString()} ${currency}`, 20, currentY)
      } else {
        pdf.text('Balance Due:', calcX - 50, currentY)
        pdf.text(`${receipt.balance.toLocaleString()} ${currency}`, calcX, currentY)
      }
    } else if (receipt.amountPaid >= receipt.total) {
      pdf.setTextColor(25, 135, 84) // Green for fully paid
      pdf.setFont('helvetica', 'bold')
      
      if (isArabic) {
        pdf.text('مدفوع بالكامل', pageWidth - 50, currentY, { align: 'right' })
      } else {
        pdf.text('FULLY PAID', calcX - 30, currentY)
      }
    }
    
    currentY += 20
    
    // Payment status badge
    const statusX = 20
    const statusWidth = 50
    const statusHeight = 8
    
    if (receipt.balance > 0) {
      pdf.setFillColor(255, 243, 205) // Light orange for partial
      pdf.setDrawColor(255, 193, 7)
    } else {
      pdf.setFillColor(212, 237, 218) // Light green for paid
      pdf.setDrawColor(25, 135, 84)
    }
    
    pdf.rect(statusX, currentY, statusWidth, statusHeight, 'FD')
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    if (receipt.balance > 0) {
      pdf.setTextColor(133, 77, 14) // Orange for partial payment
    } else {
      pdf.setTextColor(25, 135, 84) // Green for paid
    }
    const statusText = receipt.balance > 0 ? 
      (isArabic ? 'جزئي الدفع' : 'PARTIAL PAYMENT') : 
      (isArabic ? 'مدفوع' : 'PAID')
    pdf.text(statusText, statusX + 2, currentY + 6)
    
    currentY += 20
    
    // Notes section
    if (receipt.notes) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${isArabic ? 'ملاحظات:' : 'Notes:'} ${receipt.notes}`, 20, currentY)
      currentY += 15
    }
    
    // Footer
    const footerY = pageHeight - 30
    pdf.setLineWidth(0.3)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, footerY - 10, pageWidth - 20, footerY - 10)
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(120, 120, 120)
    
    const thankYou = isArabic ? 'شكراً لكم على تعاملكم معنا' : 'Thank you for your business!'
    pdf.text(thankYou, 20, footerY)
    
    const generated = isArabic ? `تم إنشاء هذا الإيصال بواسطة الحاسوب في ${new Date().toLocaleString()}` : 
                           `Computer generated receipt on ${new Date().toLocaleString()}`
    pdf.text(generated, pageWidth - 80, footerY, { align: 'right' })

    const pdfBlob = pdf.output('blob')
    const filename = `receipt-${receipt.receiptNumber}-${new Date().toISOString().split('T')[0]}.pdf`
    
    return { blob: pdfBlob, filename }
  }

  // Get report data based on type and filters
  private static getReportData(reportType: ReportType, filters: any) {
    switch (reportType) {
      case 'FINANCIAL':
        return this.getFinancialReportData(filters)
      case 'PAYROLL':
        return this.getPayrollReportData(filters)
      case 'EMPLOYEE':
        return this.getEmployeeReportData(filters)
      case 'SITE':
        return this.getSiteReportData(filters)
      case 'EXPENSE':
        return this.getExpenseReportData(filters)
      case 'REVENUE':
        return this.getRevenueReportData(filters)
      case 'CUSTOM':
        return this.getCustomReportData(filters)
      default:
        return {}
    }
  }

  // Financial report data
  private static getFinancialReportData(filters: any) {
    const summary = MockDataService.getFinancialSummary(filters.dateRange)
    const revenues = MockDataService.getRevenues()
    const expenses = MockDataService.getExpenses()
    const sites = MockDataService.getSites()

    return {
      summary,
      revenues: filters.dateRange ? 
        MockDataService.getRevenuesByDateRange(filters.dateRange.start, filters.dateRange.end) : 
        revenues,
      expenses: filters.dateRange ? 
        MockDataService.getExpensesByDateRange(filters.dateRange.start, filters.dateRange.end) : 
        expenses,
      sites: filters.siteId ? 
        sites.filter(s => s.id === filters.siteId) : 
        sites
    }
  }

  // Payroll report data
  private static getPayrollReportData(filters: any) {
    const payrollRecords = MockDataService.getPayrollRecords()
    const employees = MockDataService.getEmployees()
    
    let filteredRecords = payrollRecords
    if (filters.dateRange) {
      filteredRecords = MockDataService.getPayrollByDateRange(filters.dateRange.start, filters.dateRange.end)
    }
    if (filters.employeeId) {
      filteredRecords = filteredRecords.filter(r => r.employeeId === filters.employeeId)
    }

    return {
      payrollRecords: filteredRecords,
      employees,
      summary: {
        totalGrossPay: filteredRecords.reduce((sum, r) => sum + r.grossPay, 0),
        totalNetPay: filteredRecords.reduce((sum, r) => sum + r.netPay, 0),
        totalTaxes: filteredRecords.reduce((sum, r) => sum + Object.values(r.taxes).reduce((t, v) => t + v, 0), 0),
        totalDeductions: filteredRecords.reduce((sum, r) => sum + r.deductions, 0)
      }
    }
  }

  // Employee report data
  private static getEmployeeReportData(filters: any) {
    let employees = MockDataService.getEmployees()
    
    if (filters.siteId) {
      employees = MockDataService.getEmployeesBySite(filters.siteId)
    }
    if (filters.status) {
      employees = employees.filter(e => e.status === filters.status)
    }
    if (filters.department) {
      employees = employees.filter(e => e.department === filters.department)
    }

    const sites = MockDataService.getSites()
    const departments = [...new Set(employees.map(e => e.department))]

    return {
      employees,
      sites,
      departments,
      summary: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'ACTIVE').length,
        totalSalaries: employees.reduce((sum, e) => sum + e.salary, 0),
        averageSalary: employees.length > 0 ? employees.reduce((sum, e) => sum + e.salary, 0) / employees.length : 0
      }
    }
  }

  // Site report data
  private static getSiteReportData(filters: any) {
    let sites = MockDataService.getSites()
    
    if (filters.status) {
      sites = MockDataService.getSitesByStatus(filters.status)
    }
    if (filters.siteId) {
      sites = sites.filter(s => s.id === filters.siteId)
    }

    return {
      sites,
      siteSummaries: sites.map(site => MockDataService.getSiteFinancialSummary(site.id)),
      overallSummary: {
        totalSites: sites.length,
        activeSites: sites.filter(s => s.status === 'ACTIVE').length,
        totalBudget: sites.reduce((sum, s) => sum + s.budget, 0),
        totalSpent: sites.reduce((sum, s) => sum + s.spent, 0),
        averageProgress: sites.length > 0 ? sites.reduce((sum, s) => sum + s.progress, 0) / sites.length : 0
      }
    }
  }

  // Expense report data
  private static getExpenseReportData(filters: any) {
    let expenses = MockDataService.getExpenses()
    
    if (filters.siteId) {
      expenses = MockDataService.getExpensesBySite(filters.siteId)
    }
    if (filters.category) {
      expenses = MockDataService.getExpensesByCategory(filters.category)
    }
    if (filters.dateRange) {
      expenses = MockDataService.getExpensesByDateRange(filters.dateRange.start, filters.dateRange.end)
    }

    const categories = [...new Set(expenses.map(e => e.category))]
    
    return {
      expenses,
      categories,
      summary: {
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        approvedExpenses: expenses.filter(e => e.approved).length,
        pendingExpenses: expenses.filter(e => !e.approved).length,
        categoryBreakdown: categories.map(cat => ({
          category: cat,
          total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
          count: expenses.filter(e => e.category === cat).length
        }))
      }
    }
  }

  // Revenue report data
  private static getRevenueReportData(filters: any) {
    let revenues = MockDataService.getRevenues()
    
    if (filters.siteId) {
      revenues = MockDataService.getRevenuesBySite(filters.siteId)
    }
    if (filters.clientId) {
      revenues = MockDataService.getRevenuesByClient(filters.clientId)
    }
    if (filters.dateRange) {
      revenues = MockDataService.getRevenuesByDateRange(filters.dateRange.start, filters.dateRange.end)
    }
    if (filters.paymentStatus) {
      revenues = MockDataService.getRevenuesByStatus(filters.paymentStatus)
    }

    const clients = MockDataService.getClients()
    
    return {
      revenues,
      clients,
      summary: {
        totalRevenue: revenues.reduce((sum, r) => sum + r.amount, 0),
        paidRevenue: revenues.filter(r => r.paymentStatus === 'PAID').reduce((sum, r) => sum + r.amount, 0),
        unpaidRevenue: revenues.filter(r => r.paymentStatus === 'UNPAID').reduce((sum, r) => sum + r.amount, 0),
        partialRevenue: revenues.filter(r => r.paymentStatus === 'PARTIAL').reduce((sum, r) => sum + r.amount, 0),
        clientBreakdown: clients.map(client => ({
          client: client.name,
          total: revenues.filter(r => r.clientId === client.id).reduce((sum, r) => sum + r.amount, 0),
          count: revenues.filter(r => r.clientId === client.id).length
        }))
      }
    }
  }

  // Custom report data
  private static getCustomReportData(filters: any) {
    return {
      sites: filters.includeSites ? MockDataService.getSites() : [],
      employees: filters.includeEmployees ? MockDataService.getEmployees() : [],
      expenses: filters.includeExpenses ? MockDataService.getExpenses() : [],
      revenues: filters.includeRevenues ? MockDataService.getRevenues() : [],
      payroll: filters.includePayroll ? MockDataService.getPayrollRecords() : [],
      safes: filters.includeSafes ? MockDataService.getSafes() : []
    }
  }

  // Generate PDF report
  private static generatePDFReport(reportType: ReportType, data: any, language: 'EN' | 'AR'): Blob {
    const pdf = new jsPDF()
    const isArabic = language === 'AR'
    
    // Add header
    this.addPDFHeader(pdf, isArabic)
    
    // Add title
    const title = this.getReportTitle(reportType, isArabic)
    pdf.setFontSize(18)
    pdf.text(title, 20, 60)
    
    // Add generation date
    pdf.setFontSize(10)
    const dateLabel = isArabic ? 'تاريخ الإنشاء:' : 'Generated on:'
    pdf.text(`${dateLabel} ${new Date().toLocaleDateString()}`, 20, 70)
    
    let yPosition = 90
    
    // Add content based on report type
    switch (reportType) {
      case 'FINANCIAL':
        yPosition = this.addFinancialReportContent(pdf, data, yPosition, isArabic)
        break
      case 'PAYROLL':
        yPosition = this.addPayrollReportContent(pdf, data, yPosition, isArabic)
        break
      case 'EMPLOYEE':
        yPosition = this.addEmployeeReportContent(pdf, data, yPosition, isArabic)
        break
      case 'SITE':
        yPosition = this.addSiteReportContent(pdf, data, yPosition, isArabic)
        break
      case 'EXPENSE':
        yPosition = this.addExpenseReportContent(pdf, data, yPosition, isArabic)
        break
      case 'REVENUE':
        yPosition = this.addRevenueReportContent(pdf, data, yPosition, isArabic)
        break
    }
    
    // Add footer
    this.addPDFFooter(pdf, isArabic)
    
    return pdf.output('blob')
  }

  // Generate Excel report
  private static generateExcelReport(reportType: ReportType, data: any, language: 'EN' | 'AR'): Blob {
    const workbook = XLSX.utils.book_new()
    const isArabic = language === 'AR'
    
    // Create summary sheet
    const summaryData = this.createSummarySheet(reportType, data, isArabic)
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, isArabic ? 'الملخص' : 'Summary')
    
    // Add detailed sheets based on report type
    switch (reportType) {
      case 'FINANCIAL':
        if (data.revenues?.length > 0) {
          const revenueSheet = this.createRevenueSheet(data.revenues, isArabic)
          XLSX.utils.book_append_sheet(workbook, revenueSheet, isArabic ? 'الإيرادات' : 'Revenues')
        }
        if (data.expenses?.length > 0) {
          const expenseSheet = this.createExpenseSheet(data.expenses, isArabic)
          XLSX.utils.book_append_sheet(workbook, expenseSheet, isArabic ? 'المصروفات' : 'Expenses')
        }
        break
      case 'PAYROLL':
        if (data.payrollRecords?.length > 0) {
          const payrollSheet = this.createPayrollSheet(data.payrollRecords, data.employees, isArabic)
          XLSX.utils.book_append_sheet(workbook, payrollSheet, isArabic ? 'كشوف المرتبات' : 'Payroll')
        }
        break
      case 'EMPLOYEE':
        if (data.employees?.length > 0) {
          const employeeSheet = this.createEmployeeSheet(data.employees, isArabic)
          XLSX.utils.book_append_sheet(workbook, employeeSheet, isArabic ? 'الموظفين' : 'Employees')
        }
        break
      case 'SITE':
        if (data.sites?.length > 0) {
          const siteSheet = this.createSiteSheet(data.sites, isArabic)
          XLSX.utils.book_append_sheet(workbook, siteSheet, isArabic ? 'المواقع' : 'Sites')
        }
        break
    }
    
    // Generate Excel blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Helper methods for PDF content
  private static addPDFHeader(pdf: jsPDF, isArabic: boolean) {
    const company = this.companyInfo
    const globalSettings = settingsService.getSettings()
    
    // Load Arabic font if needed
    if (isArabic) {
      this.loadArabicFont(pdf)
    }
    
    // Add company logo with enhanced error handling
    if (globalSettings.companyLogo) {
      try {
        const logoWidth = 30
        const logoHeight = 20
        
        // Enhanced image format detection and handling
        if (globalSettings.companyLogo.startsWith('data:image/')) {
          const mimeType = globalSettings.companyLogo.split(';')[0].split(':')[1]
          let format = 'JPEG'
          
          if (mimeType.includes('png')) format = 'PNG'
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) format = 'JPEG'
          else if (mimeType.includes('gif')) format = 'GIF'
          
          pdf.addImage(globalSettings.companyLogo, format, 20, 15, logoWidth, logoHeight)
        } else {
          // Fallback for non-data URLs
          pdf.addImage(globalSettings.companyLogo, 'JPEG', 20, 15, logoWidth, logoHeight)
        }
      } catch (error) {
        console.warn('Could not load company logo in report header:', error)
        // Enhanced placeholder
        pdf.setFillColor(245, 245, 245)
        pdf.rect(20, 15, 30, 20, 'F')
        pdf.setDrawColor(220, 220, 220)
        pdf.rect(20, 15, 30, 20, 'S')
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text('LOGO', 30, 27)
      }
    } else {
      // Enhanced logo placeholder
      pdf.setFillColor(245, 245, 245)
      pdf.rect(20, 15, 30, 20, 'F')
      pdf.setDrawColor(220, 220, 220)
      pdf.rect(20, 15, 30, 20, 'S')
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('LOGO', 30, 27)
    }
    
    // Company information
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(40, 40, 40)
    const companyName = globalSettings.companyName || company.name
    pdf.text(companyName, 60, 25)
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(80, 80, 80)
    const address = globalSettings.address || `${company.address.street}, ${company.address.city}`
    const contact = globalSettings.phone && globalSettings.email ?
      `${globalSettings.phone} | ${globalSettings.email}` :
      `${company.contact.phone} | ${company.contact.email}`
    pdf.text(address, 60, 32)
    pdf.text(contact, 60, 38)
    
    // Add line separator
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, 45, 190, 45)
  }
  
  private static addPDFFooter(pdf: jsPDF, isArabic: boolean) {
    const pageHeight = pdf.internal.pageSize.height
    
    // Add line separator
    pdf.line(20, pageHeight - 25, 190, pageHeight - 25)
    
    pdf.setFontSize(8)
    const footerText = isArabic ? 
      'تم إنشاء هذا التقرير بواسطة نظام إدارة البناء والإنشاءات' : 
      'This report was generated by AlBina Construction Management System'
    
    pdf.text(footerText, 20, pageHeight - 15)
    pdf.text(`Page 1`, 170, pageHeight - 15)
  }

  // Financial report PDF content
  private static addFinancialReportContent(pdf: jsPDF, data: any, yPosition: number, isArabic: boolean): number {
    const { summary } = data
    
    pdf.setFontSize(14)
    pdf.text(isArabic ? 'الملخص المالي' : 'Financial Summary', 20, yPosition)
    yPosition += 20
    
    pdf.setFontSize(12)
    pdf.text(`${isArabic ? 'إجمالي الإيرادات:' : 'Total Revenues:'} ${summary.totalRevenues.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي المصروفات:' : 'Total Expenses:'} ${summary.totalExpenses.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي المرتبات:' : 'Total Payroll:'} ${summary.totalPayroll.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    
    const profitColor = summary.netProfit >= 0 ? [0, 128, 0] : [255, 0, 0]
    pdf.setTextColor(profitColor[0], profitColor[1], profitColor[2])
    pdf.text(`${isArabic ? 'صافي الربح:' : 'Net Profit:'} ${summary.netProfit.toLocaleString()} SAR`, 20, yPosition)
    pdf.setTextColor(0, 0, 0)
    
    return yPosition + 30
  }

  // Payroll report PDF content
  private static addPayrollReportContent(pdf: jsPDF, data: any, yPosition: number, isArabic: boolean): number {
    const { summary, payrollRecords } = data
    
    pdf.setFontSize(14)
    pdf.text(isArabic ? 'ملخص كشوف المرتبات' : 'Payroll Summary', 20, yPosition)
    yPosition += 20
    
    pdf.setFontSize(12)
    pdf.text(`${isArabic ? 'إجمالي الراتب الإجمالي:' : 'Total Gross Pay:'} ${summary.totalGrossPay.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي الراتب الصافي:' : 'Total Net Pay:'} ${summary.totalNetPay.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي الضرائب:' : 'Total Taxes:'} ${summary.totalTaxes.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي الخصومات:' : 'Total Deductions:'} ${summary.totalDeductions.toLocaleString()} SAR`, 20, yPosition)
    
    return yPosition + 30
  }

  // Employee report PDF content
  private static addEmployeeReportContent(pdf: jsPDF, data: any, yPosition: number, isArabic: boolean): number {
    const { summary } = data
    
    pdf.setFontSize(14)
    pdf.text(isArabic ? 'ملخص الموظفين' : 'Employee Summary', 20, yPosition)
    yPosition += 20
    
    pdf.setFontSize(12)
    pdf.text(`${isArabic ? 'إجمالي الموظفين:' : 'Total Employees:'} ${summary.totalEmployees}`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'الموظفين النشطين:' : 'Active Employees:'} ${summary.activeEmployees}`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي الرواتب:' : 'Total Salaries:'} ${summary.totalSalaries.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'متوسط الراتب:' : 'Average Salary:'} ${summary.averageSalary.toLocaleString()} SAR`, 20, yPosition)
    
    return yPosition + 30
  }

  // Site report PDF content
  private static addSiteReportContent(pdf: jsPDF, data: any, yPosition: number, isArabic: boolean): number {
    const { overallSummary } = data
    
    pdf.setFontSize(14)
    pdf.text(isArabic ? 'ملخص المواقع' : 'Sites Summary', 20, yPosition)
    yPosition += 20
    
    pdf.setFontSize(12)
    pdf.text(`${isArabic ? 'إجمالي المواقع:' : 'Total Sites:'} ${overallSummary.totalSites}`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'المواقع النشطة:' : 'Active Sites:'} ${overallSummary.activeSites}`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي الميزانية:' : 'Total Budget:'} ${overallSummary.totalBudget.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'إجمالي المنفق:' : 'Total Spent:'} ${overallSummary.totalSpent.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'متوسط التقدم:' : 'Average Progress:'} ${overallSummary.averageProgress.toFixed(1)}%`, 20, yPosition)
    
    return yPosition + 30
  }

  // Expense report PDF content
  private static addExpenseReportContent(pdf: jsPDF, data: any, yPosition: number, isArabic: boolean): number {
    const { summary } = data
    
    pdf.setFontSize(14)
    pdf.text(isArabic ? 'ملخص المصروفات' : 'Expenses Summary', 20, yPosition)
    yPosition += 20
    
    pdf.setFontSize(12)
    pdf.text(`${isArabic ? 'إجمالي المصروفات:' : 'Total Expenses:'} ${summary.totalExpenses.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'المصروفات المعتمدة:' : 'Approved Expenses:'} ${summary.approvedExpenses}`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'المصروفات المعلقة:' : 'Pending Expenses:'} ${summary.pendingExpenses}`, 20, yPosition)
    
    return yPosition + 30
  }

  // Revenue report PDF content
  private static addRevenueReportContent(pdf: jsPDF, data: any, yPosition: number, isArabic: boolean): number {
    const { summary } = data
    
    pdf.setFontSize(14)
    pdf.text(isArabic ? 'ملخص الإيرادات' : 'Revenue Summary', 20, yPosition)
    yPosition += 20
    
    pdf.setFontSize(12)
    pdf.text(`${isArabic ? 'إجمالي الإيرادات:' : 'Total Revenue:'} ${summary.totalRevenue.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'الإيرادات المدفوعة:' : 'Paid Revenue:'} ${summary.paidRevenue.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'الإيرادات غير المدفوعة:' : 'Unpaid Revenue:'} ${summary.unpaidRevenue.toLocaleString()} SAR`, 20, yPosition)
    yPosition += 10
    pdf.text(`${isArabic ? 'الإيرادات المدفوعة جزئياً:' : 'Partial Revenue:'} ${summary.partialRevenue.toLocaleString()} SAR`, 20, yPosition)
    
    return yPosition + 30
  }

  // Helper methods for Excel sheets
  private static createSummarySheet(reportType: ReportType, data: any, isArabic: boolean): any[][] {
    const headers = [
      [isArabic ? 'ملخص التقرير' : 'Report Summary'],
      [],
      [isArabic ? 'النوع:' : 'Type:', this.getReportTitle(reportType, isArabic)],
      [isArabic ? 'تاريخ الإنشاء:' : 'Generated:', new Date().toLocaleDateString()],
      []
    ]
    
    // Add specific summary data based on report type
    switch (reportType) {
      case 'FINANCIAL':
        headers.push(
          [isArabic ? 'إجمالي الإيرادات:' : 'Total Revenues:', data.summary.totalRevenues],
          [isArabic ? 'إجمالي المصروفات:' : 'Total Expenses:', data.summary.totalExpenses],
          [isArabic ? 'إجمالي المرتبات:' : 'Total Payroll:', data.summary.totalPayroll],
          [isArabic ? 'صافي الربح:' : 'Net Profit:', data.summary.netProfit]
        )
        break
      case 'PAYROLL':
        headers.push(
          [isArabic ? 'إجمالي الراتب الإجمالي:' : 'Total Gross Pay:', data.summary.totalGrossPay],
          [isArabic ? 'إجمالي الراتب الصافي:' : 'Total Net Pay:', data.summary.totalNetPay],
          [isArabic ? 'إجمالي الضرائب:' : 'Total Taxes:', data.summary.totalTaxes]
        )
        break
    }
    
    return headers
  }

  private static createRevenueSheet(revenues: Revenue[], isArabic: boolean): any {
    const headers = isArabic ? 
      ['المعرف', 'العنوان', 'المبلغ', 'العميل', 'التاريخ', 'حالة الدفع'] :
      ['ID', 'Title', 'Amount', 'Client', 'Date', 'Payment Status']
    
    const rows = revenues.map(revenue => [
      revenue.id,
      revenue.title,
      revenue.amount,
      revenue.clientId,
      revenue.date,
      revenue.paymentStatus
    ])
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows])
  }

  private static createExpenseSheet(expenses: Expense[], isArabic: boolean): any {
    const headers = isArabic ? 
      ['المعرف', 'العنوان', 'المبلغ', 'الفئة', 'التاريخ', 'معتمد'] :
      ['ID', 'Title', 'Amount', 'Category', 'Date', 'Approved']
    
    const rows = expenses.map(expense => [
      expense.id,
      expense.title,
      expense.amount,
      expense.category,
      expense.date,
      expense.approved ? 'Yes' : 'No'
    ])
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows])
  }

  private static createPayrollSheet(payrollRecords: PayrollRecord[], employees: Employee[], isArabic: boolean): any {
    const headers = isArabic ? 
      ['المعرف', 'الموظف', 'فترة الدفع', 'الراتب الإجمالي', 'الراتب الصافي', 'الحالة'] :
      ['ID', 'Employee', 'Pay Period', 'Gross Pay', 'Net Pay', 'Status']
    
    const rows = payrollRecords.map(record => {
      const employee = employees.find(e => e.id === record.employeeId)
      return [
        record.id,
        employee ? `${employee.firstName} ${employee.lastName}` : record.employeeId,
        `${record.payPeriod.start} - ${record.payPeriod.end}`,
        record.grossPay,
        record.netPay,
        record.status
      ]
    })
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows])
  }

  private static createEmployeeSheet(employees: Employee[], isArabic: boolean): any {
    const headers = isArabic ? 
      ['المعرف', 'الاسم', 'المنصب', 'القسم', 'الراتب', 'تاريخ التوظيف', 'الحالة'] :
      ['ID', 'Name', 'Position', 'Department', 'Salary', 'Hire Date', 'Status']
    
    const rows = employees.map(employee => [
      employee.id,
      `${employee.firstName} ${employee.lastName}`,
      employee.position,
      employee.department,
      employee.salary,
      employee.hireDate,
      employee.status
    ])
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows])
  }

  private static createSiteSheet(sites: Site[], isArabic: boolean): any {
    const headers = isArabic ? 
      ['المعرف', 'الاسم', 'الموقع', 'النوع', 'الحالة', 'الميزانية', 'المنفق', 'التقدم'] :
      ['ID', 'Name', 'Location', 'Type', 'Status', 'Budget', 'Spent', 'Progress']
    
    const rows = sites.map(site => [
      site.id,
      site.name,
      site.location,
      site.type,
      site.status,
      site.budget,
      site.spent,
      `${site.progress}%`
    ])
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows])
  }

  // Helper methods
  private static getReportTitle(reportType: ReportType, isArabic: boolean): string {
    const titles: Record<ReportType, string> = {
      FINANCIAL: isArabic ? 'التقرير المالي' : 'Financial Report',
      PAYROLL: isArabic ? 'تقرير كشوف المرتبات' : 'Payroll Report',
      EMPLOYEE: isArabic ? 'تقرير الموظفين' : 'Employee Report',
      SITE: isArabic ? 'تقرير المواقع' : 'Sites Report',
      EXPENSE: isArabic ? 'تقرير المصروفات' : 'Expenses Report',
      REVENUE: isArabic ? 'تقرير الإيرادات' : 'Revenue Report',
      CUSTOM: isArabic ? 'تقرير مخصص' : 'Custom Report',
      RECEIPT: isArabic ? 'إيصال' : 'Receipt',
      INVOICE: isArabic ? 'فاتورة' : 'Invoice'
    }
    return titles[reportType] || reportType
  }

  private static generateFilename(reportType: ReportType, format: ReportFormat, language: 'EN' | 'AR'): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const typeLabel = reportType.toLowerCase()
    const langLabel = language.toLowerCase()
    const formatExt = format.toLowerCase()
    
    return `${typeLabel}-report-${langLabel}-${timestamp}.${formatExt}`
  }
}
