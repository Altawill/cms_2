import { useState, useCallback, useRef } from 'react';
import { useFormSubmission } from './useFormSubmission';
import { useAuditLogger } from './useAuditLogger';

export interface ReceiptData {
  id: string;
  type: 'EXPENSE' | 'PAYMENT' | 'TRANSFER' | 'REFUND' | 'INVOICE';
  number: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  
  // Parties involved
  payer: {
    name: string;
    id?: string;
    contact?: string;
    address?: string;
  };
  
  payee: {
    name: string;
    id?: string;
    contact?: string;
    address?: string;
  };

  // Transaction details
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHECK' | 'OTHER';
  reference?: string;
  notes?: string;
  
  // Approval and processing
  approvedBy?: string;
  processedBy?: string;
  status: 'DRAFT' | 'GENERATED' | 'SENT' | 'ACKNOWLEDGED';
  
  // Metadata
  companyInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logo?: string;
  };
  
  taxInfo?: {
    rate: number;
    amount: number;
    taxId?: string;
  };
  
  attachments?: string[];
  generatedAt?: string;
  generatedBy?: string;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  type: ReceiptData['type'];
  layout: 'STANDARD' | 'COMPACT' | 'DETAILED' | 'CUSTOM';
  styles: {
    fontSize: number;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    showLogo: boolean;
    showQRCode: boolean;
    showSignature: boolean;
  };
  fields: {
    required: string[];
    optional: string[];
    hidden: string[];
  };
}

interface GenerateReceiptOptions {
  template?: ReceiptTemplate;
  format?: 'HTML' | 'PDF' | 'IMAGE' | 'PRINT';
  includeQR?: boolean;
  includeBarcode?: boolean;
  watermark?: string;
  copies?: number;
}

interface UseReceiptGeneratorOptions {
  defaultTemplate?: ReceiptTemplate;
  autoSave?: boolean;
  enablePrintPreview?: boolean;
  validateData?: boolean;
  maxReceiptSize?: number; // bytes
}

export function useReceiptGenerator(options: UseReceiptGeneratorOptions = {}) {
  const {
    autoSave = true,
    enablePrintPreview = true,
    validateData = true,
    maxReceiptSize = 5 * 1024 * 1024 // 5MB
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReceipts, setGeneratedReceipts] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string | null>(null);

  const { handleSubmit: protectedSubmit } = useFormSubmission({ debounceMs: 300 });
  const auditLogger = useAuditLogger();
  const printWindowRef = useRef<Window | null>(null);

  // Default template
  const defaultTemplate: ReceiptTemplate = {
    id: 'default',
    name: 'Standard Receipt',
    type: 'EXPENSE',
    layout: 'STANDARD',
    styles: {
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#2c3e50',
      secondaryColor: '#34495e',
      showLogo: true,
      showQRCode: false,
      showSignature: true
    },
    fields: {
      required: ['number', 'date', 'amount', 'description', 'payer', 'payee'],
      optional: ['reference', 'notes', 'category', 'taxInfo'],
      hidden: ['attachments']
    }
  };

  // Load templates from localStorage
  const loadTemplates = useCallback(() => {
    try {
      const saved = localStorage.getItem('receipt_templates');
      if (saved) {
        const loadedTemplates = JSON.parse(saved);
        setTemplates([defaultTemplate, ...loadedTemplates]);
      } else {
        setTemplates([defaultTemplate]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([defaultTemplate]);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: ReceiptTemplate[]) => {
    try {
      const customTemplates = newTemplates.filter(t => t.id !== 'default');
      localStorage.setItem('receipt_templates', JSON.stringify(customTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  }, []);

  // Validate receipt data
  const validateReceiptData = useCallback((data: ReceiptData): string[] => {
    const errors: string[] = [];

    if (!data.id || !data.id.trim()) {
      errors.push('Receipt ID is required');
    }

    if (!data.number || !data.number.trim()) {
      errors.push('Receipt number is required');
    }

    if (!data.date) {
      errors.push('Receipt date is required');
    } else {
      const receiptDate = new Date(data.date);
      if (isNaN(receiptDate.getTime())) {
        errors.push('Invalid receipt date');
      }
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.currency || data.currency.length !== 3) {
      errors.push('Valid 3-letter currency code is required');
    }

    if (!data.description || !data.description.trim()) {
      errors.push('Description is required');
    }

    if (!data.payer || !data.payer.name || !data.payer.name.trim()) {
      errors.push('Payer name is required');
    }

    if (!data.payee || !data.payee.name || !data.payee.name.trim()) {
      errors.push('Payee name is required');
    }

    if (!data.companyInfo || !data.companyInfo.name) {
      errors.push('Company information is required');
    }

    // Validate tax information if provided
    if (data.taxInfo) {
      if (data.taxInfo.rate < 0 || data.taxInfo.rate > 100) {
        errors.push('Tax rate must be between 0 and 100%');
      }
      
      if (data.taxInfo.amount < 0) {
        errors.push('Tax amount cannot be negative');
      }
    }

    return errors;
  }, []);

  // Generate QR code data
  const generateQRData = useCallback((data: ReceiptData): string => {
    return JSON.stringify({
      id: data.id,
      number: data.number,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      type: data.type,
      hash: btoa(`${data.id}-${data.number}-${data.amount}`).slice(0, 8)
    });
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency: string): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }, []);

  // Generate receipt HTML
  const generateReceiptHTML = useCallback((
    data: ReceiptData,
    template: ReceiptTemplate = defaultTemplate,
    options: GenerateReceiptOptions = {}
  ): string => {
    const { includeQR = false, watermark } = options;
    const styles = template.styles;

    // Calculate tax details
    const subtotal = data.taxInfo ? data.amount - data.taxInfo.amount : data.amount;
    const taxAmount = data.taxInfo?.amount || 0;
    const taxRate = data.taxInfo?.rate || 0;

    const qrData = includeQR ? generateQRData(data) : null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt ${data.number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: ${styles.fontFamily};
            font-size: ${styles.fontSize}px;
            line-height: 1.4;
            color: ${styles.primaryColor};
            background: white;
            padding: 20px;
        }
        
        .receipt {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            ${watermark ? `background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="rgba(0,0,0,0.1)" font-size="14" transform="rotate(-45 100 25)">${encodeURIComponent(watermark)}</text></svg>');` : ''}
        }
        
        .header {
            background: linear-gradient(135deg, ${styles.primaryColor}, ${styles.secondaryColor});
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .company-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .company-details h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-details p {
            margin: 2px 0;
            font-size: 13px;
            opacity: 0.9;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        
        .receipt-info {
            text-align: center;
            padding: 15px 0;
        }
        
        .receipt-number {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .receipt-type {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            display: inline-block;
        }
        
        .content {
            padding: 25px;
        }
        
        .transaction-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        
        .party {
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 6px;
            background: #f9f9f9;
        }
        
        .party h3 {
            color: ${styles.secondaryColor};
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .party p {
            margin: 3px 0;
            font-size: 13px;
        }
        
        .amount-section {
            text-align: center;
            margin: 25px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed ${styles.primaryColor};
        }
        
        .main-amount {
            font-size: 32px;
            font-weight: bold;
            color: ${styles.primaryColor};
            margin-bottom: 5px;
        }
        
        .amount-details {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 14px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .detail-label {
            font-weight: 500;
            color: ${styles.secondaryColor};
        }
        
        .description {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid ${styles.primaryColor};
        }
        
        .description h4 {
            color: ${styles.secondaryColor};
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0 20px;
        }
        
        .signature {
            text-align: center;
            min-width: 200px;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 5px;
            font-size: 12px;
        }
        
        .qr-section {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .qr-code {
            width: 80px;
            height: 80px;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            text-align: center;
            border: 1px solid #ddd;
        }
        
        @media print {
            body { padding: 0; }
            .receipt { border: none; box-shadow: none; }
            .qr-section { position: fixed; }
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48px;
            color: rgba(0,0,0,0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="receipt">
        ${watermark ? `<div class="watermark">${watermark}</div>` : ''}
        
        <div class="header">
            <div class="company-info">
                <div class="company-details">
                    <h1>${data.companyInfo.name}</h1>
                    <p>${data.companyInfo.address}</p>
                    ${data.companyInfo.phone ? `<p>📞 ${data.companyInfo.phone}</p>` : ''}
                    ${data.companyInfo.email ? `<p>✉️ ${data.companyInfo.email}</p>` : ''}
                    ${data.companyInfo.taxId ? `<p>Tax ID: ${data.companyInfo.taxId}</p>` : ''}
                </div>
                ${styles.showLogo ? `
                <div class="logo">
                    ${data.companyInfo.logo ? `<img src="${data.companyInfo.logo}" alt="Logo" style="max-width: 100%; max-height: 100%;">` : 'LOGO'}
                </div>
                ` : ''}
            </div>
            
            <div class="receipt-info">
                <div class="receipt-number">Receipt #${data.number}</div>
                <div class="receipt-type">${data.type.replace('_', ' ')}</div>
            </div>
        </div>
        
        ${includeQR && qrData ? `
        <div class="qr-section">
            <div class="qr-code" title="${qrData}">
                QR Code<br>
                <small>Verification</small>
            </div>
        </div>
        ` : ''}
        
        <div class="content">
            <div class="transaction-details">
                <div class="party">
                    <h3>From (Payer)</h3>
                    <p><strong>${data.payer.name}</strong></p>
                    ${data.payer.id ? `<p>ID: ${data.payer.id}</p>` : ''}
                    ${data.payer.contact ? `<p>📞 ${data.payer.contact}</p>` : ''}
                    ${data.payer.address ? `<p>📍 ${data.payer.address}</p>` : ''}
                </div>
                
                <div class="party">
                    <h3>To (Payee)</h3>
                    <p><strong>${data.payee.name}</strong></p>
                    ${data.payee.id ? `<p>ID: ${data.payee.id}</p>` : ''}
                    ${data.payee.contact ? `<p>📞 ${data.payee.contact}</p>` : ''}
                    ${data.payee.address ? `<p>📍 ${data.payee.address}</p>` : ''}
                </div>
            </div>
            
            <div class="amount-section">
                <div class="main-amount">${formatCurrency(data.amount, data.currency)}</div>
                ${data.taxInfo ? `
                <div class="amount-details">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(subtotal, data.currency)}</span>
                </div>
                <div class="amount-details">
                    <span>Tax (${taxRate}%):</span>
                    <span>${formatCurrency(taxAmount, data.currency)}</span>
                </div>
                <div class="amount-details" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px;">
                    <span>Total:</span>
                    <span>${formatCurrency(data.amount, data.currency)}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Date:</span>
                    <span>${new Date(data.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Payment Method:</span>
                    <span>${data.paymentMethod.replace('_', ' ')}</span>
                </div>
                
                ${data.reference ? `
                <div class="detail-item">
                    <span class="detail-label">Reference:</span>
                    <span>${data.reference}</span>
                </div>
                ` : ''}
                
                ${data.category ? `
                <div class="detail-item">
                    <span class="detail-label">Category:</span>
                    <span>${data.category}</span>
                </div>
                ` : ''}
                
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span>${data.status}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Receipt ID:</span>
                    <span>${data.id}</span>
                </div>
            </div>
            
            <div class="description">
                <h4>Description</h4>
                <p>${data.description}</p>
                ${data.notes ? `<p style="margin-top: 8px; font-style: italic;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            ${styles.showSignature ? `
            <div class="signature-section">
                <div class="signature">
                    <div class="signature-line">Authorized Signature</div>
                </div>
                <div class="signature">
                    <div class="signature-line">Date: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This receipt was generated electronically on ${new Date().toLocaleString()}</p>
            ${data.generatedBy ? `<p>Generated by: ${data.generatedBy}</p>` : ''}
            <p style="margin-top: 8px; font-size: 11px;">
                Please keep this receipt for your records. For any questions, contact us at ${data.companyInfo.email || data.companyInfo.phone || 'our office'}.
            </p>
        </div>
    </div>
    
    <script>
        // Auto-print functionality
        if (window.location.search.includes('print=true')) {
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            };
        }
    </script>
</body>
</html>`;
  }, [defaultTemplate, generateQRData, formatCurrency]);

  // Generate receipt
  const generateReceipt = useCallback(async (
    data: ReceiptData,
    options: GenerateReceiptOptions = {}
  ): Promise<{ success: boolean; content?: string; errors?: string[] }> => {
    return await protectedSubmit(async () => {
      setIsGenerating(true);
      setErrors([]);

      try {
        // Validate data if enabled
        if (validateData) {
          const validationErrors = validateReceiptData(data);
          if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return { success: false, errors: validationErrors };
          }
        }

        // Use provided template or default
        const template = options.template || defaultTemplate;
        
        // Generate HTML content
        const htmlContent = generateReceiptHTML(data, template, options);
        
        // Check size limits
        const contentSize = new Blob([htmlContent]).size;
        if (contentSize > maxReceiptSize) {
          throw new Error(`Receipt size (${(contentSize / 1024).toFixed(1)}KB) exceeds limit (${(maxReceiptSize / 1024).toFixed(1)}KB)`);
        }

        // Update receipt data with generation info
        const updatedData = {
          ...data,
          generatedAt: new Date().toISOString(),
          generatedBy: 'System', // In real app, use current user
          status: 'GENERATED' as const
        };

        // Auto-save if enabled
        if (autoSave) {
          try {
            const receipts = JSON.parse(localStorage.getItem('generated_receipts') || '[]');
            receipts.push({
              id: data.id,
              data: updatedData,
              html: htmlContent,
              generatedAt: new Date().toISOString()
            });
            localStorage.setItem('generated_receipts', JSON.stringify(receipts.slice(-100))); // Keep last 100
          } catch (error) {
            console.warn('Failed to auto-save receipt:', error);
          }
        }

        // Update state
        setGeneratedReceipts(prev => [data.id, ...prev].slice(0, 50));

        // Log the generation
        auditLogger.logAction('CREATE', 'DOCUMENT', data.id, {
          description: `Receipt generated: ${data.number} (${data.type})`,
          amount: data.amount,
          currency: data.currency
        });

        return { success: true, content: htmlContent };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate receipt';
        setErrors([errorMessage]);
        
        auditLogger.logAction('CREATE', 'DOCUMENT', data.id, {
          description: `Receipt generation failed: ${data.number}`
        }, {}, false, errorMessage);
        
        return { success: false, errors: [errorMessage] };
      } finally {
        setIsGenerating(false);
      }
    });
  }, [validateData, validateReceiptData, generateReceiptHTML, defaultTemplate, maxReceiptSize, autoSave, auditLogger, protectedSubmit]);

  // Preview receipt
  const previewReceipt = useCallback(async (
    data: ReceiptData,
    template?: ReceiptTemplate
  ): Promise<void> => {
    if (!enablePrintPreview) return;

    try {
      const htmlContent = generateReceiptHTML(data, template || defaultTemplate, {
        watermark: 'PREVIEW'
      });
      setPreviewData(htmlContent);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setErrors(['Failed to generate preview']);
    }
  }, [enablePrintPreview, generateReceiptHTML, defaultTemplate]);

  // Print receipt
  const printReceipt = useCallback((htmlContent: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Close any existing print window
        if (printWindowRef.current && !printWindowRef.current.closed) {
          printWindowRef.current.close();
        }

        // Create new print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
          throw new Error('Failed to open print window. Please check popup blocker settings.');
        }

        printWindowRef.current = printWindow;

        // Write content with print parameter
        const printContent = htmlContent.replace('<body>', '<body>').replace('</body>', '</body>');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
              printWindow.close();
              resolve();
            };
            
            // Fallback: close after 5 seconds if onafterprint doesn't fire
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
                resolve();
              }
            }, 5000);
          }, 500);
        };

        // Handle errors
        printWindow.onerror = (error) => {
          printWindow.close();
          reject(new Error('Print failed: ' + error));
        };

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Download receipt as file
  const downloadReceipt = useCallback(async (
    htmlContent: string,
    filename: string,
    format: 'HTML' | 'PDF' = 'HTML'
  ): Promise<void> => {
    try {
      let blob: Blob;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'PDF':
          // In a real implementation, convert HTML to PDF here
          // For demo, we'll download as HTML with PDF extension
          blob = new Blob([htmlContent], { type: 'text/html' });
          mimeType = 'application/pdf';
          extension = '.pdf';
          break;
        case 'HTML':
        default:
          blob = new Blob([htmlContent], { type: 'text/html' });
          mimeType = 'text/html';
          extension = '.html';
          break;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith(extension) ? filename : filename + extension;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Clear preview
  const clearPreview = useCallback(() => {
    setPreviewData(null);
  }, []);

  // Get saved receipts
  const getSavedReceipts = useCallback(() => {
    try {
      const saved = localStorage.getItem('generated_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  return {
    // State
    isGenerating,
    generatedReceipts,
    templates,
    errors,
    previewData,

    // Methods
    generateReceipt,
    previewReceipt,
    printReceipt,
    downloadReceipt,

    // Template management
    loadTemplates,
    saveTemplates,

    // Utilities
    validateReceiptData,
    formatCurrency,
    clearPreview,
    getSavedReceipts,

    // Configuration
    defaultTemplate,
    maxReceiptSize
  };
}
