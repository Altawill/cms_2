import { useState, useCallback, useRef } from 'react';
import { useFormSubmission } from './useFormSubmission';

export interface ShareableReport {
  id: string;
  title: string;
  type: 'FINANCIAL' | 'OPERATIONAL' | 'ANALYTICS' | 'COMPLIANCE';
  data: any;
  metadata: {
    generatedBy: string;
    generatedAt: string;
    version: string;
    format: 'JSON' | 'CSV' | 'PDF' | 'XLSX';
    size: number;
    hash?: string;
    permissions?: string[];
  };
  shareOptions: {
    allowCopy: boolean;
    allowDownload: boolean;
    allowEmail: boolean;
    expiresAt?: string;
    requireAuth?: boolean;
  };
}

interface ShareResult {
  success: boolean;
  method: 'clipboard' | 'download' | 'email' | 'link';
  message: string;
  shareId?: string;
  expiresAt?: string;
}

interface UseReportSharingOptions {
  enableClipboard?: boolean;
  enableWindowsVSupport?: boolean;
  defaultFormat?: 'JSON' | 'CSV' | 'PDF' | 'XLSX';
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  maxShareSize?: number; // bytes
}

export function useReportSharing(options: UseReportSharingOptions = {}) {
  const {
    enableClipboard = true,
    enableWindowsVSupport = true,
    defaultFormat = 'JSON',
    compressionEnabled = true,
    encryptionEnabled = false,
    maxShareSize = 10 * 1024 * 1024 // 10MB
  } = options;

  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [shareHistory, setShareHistory] = useState<ShareResult[]>([]);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  const { handleSubmit: protectedSubmit } = useFormSubmission({
    debounceMs: 500
  });

  const shareUrlCache = useRef(new Map<string, string>());

  // Check clipboard API support
  const checkClipboardSupport = useCallback(async () => {
    try {
      // Check if clipboard API is available
      const hasClipboard = 'clipboard' in navigator;
      const hasWriteText = hasClipboard && 'writeText' in navigator.clipboard;
      const hasWrite = hasClipboard && 'write' in navigator.clipboard;
      const hasReadText = hasClipboard && 'readText' in navigator.clipboard;

      // Check permissions
      let hasPermission = false;
      if (hasClipboard) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' as any });
          hasPermission = permissionStatus.state === 'granted' || permissionStatus.state === 'prompt';
        } catch {
          // Permissions API might not be available, but clipboard might still work
          hasPermission = true;
        }
      }

      const supported = hasClipboard && (hasWriteText || hasWrite) && hasPermission;
      setClipboardSupported(supported);
      return supported;
    } catch (error) {
      console.error('Error checking clipboard support:', error);
      setClipboardSupported(false);
      return false;
    }
  }, []);

  // Generate shareable data with compression and encryption
  const generateShareableData = useCallback(async (
    report: ShareableReport,
    format: ShareableReport['metadata']['format'] = defaultFormat
  ): Promise<{ data: string; metadata: any }> => {
    let processedData: string;
    let metadata = { ...report.metadata, format, processedAt: new Date().toISOString() };

    // Convert data based on format
    switch (format) {
      case 'JSON':
        processedData = JSON.stringify(report.data, null, 2);
        break;
      case 'CSV':
        processedData = await convertToCSV(report.data);
        break;
      case 'PDF':
        processedData = await generatePDFData(report);
        break;
      case 'XLSX':
        processedData = await generateExcelData(report.data);
        break;
      default:
        processedData = JSON.stringify(report.data);
    }

    // Add metadata header
    const headerData = {
      title: report.title,
      type: report.type,
      ...metadata,
      size: new Blob([processedData]).size,
      generated: new Date().toISOString()
    };

    // Compress if enabled and data is large
    if (compressionEnabled && processedData.length > 1024) {
      try {
        const compressed = await compressData(processedData);
        if (compressed.length < processedData.length * 0.8) { // Only use if 20%+ reduction
          processedData = compressed;
          metadata.compressed = true;
        }
      } catch (error) {
        console.warn('Compression failed, using uncompressed data:', error);
      }
    }

    // Encrypt if enabled
    if (encryptionEnabled) {
      try {
        processedData = await encryptData(processedData);
        metadata.encrypted = true;
      } catch (error) {
        console.warn('Encryption failed, using unencrypted data:', error);
      }
    }

    // Check size limits
    const finalSize = new Blob([processedData]).size;
    if (finalSize > maxShareSize) {
      throw new Error(`Report size (${(finalSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxShareSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    return {
      data: processedData,
      metadata: { ...metadata, finalSize }
    };
  }, [defaultFormat, compressionEnabled, encryptionEnabled, maxShareSize]);

  // Copy to clipboard with rich content support
  const copyToClipboard = useCallback(async (
    report: ShareableReport,
    format: ShareableReport['metadata']['format'] = 'JSON'
  ): Promise<ShareResult> => {
    return await protectedSubmit(async () => {
      if (!enableClipboard) {
        throw new Error('Clipboard sharing is disabled');
      }

      const supported = await checkClipboardSupport();
      if (!supported) {
        throw new Error('Clipboard API is not supported in this browser');
      }

      try {
        const { data, metadata } = await generateShareableData(report, format);
        
        // Create rich clipboard data for Windows+V support
        if (enableWindowsVSupport && 'write' in navigator.clipboard) {
          const clipboardItems: ClipboardItem[] = [];

          // Add plain text version
          const textBlob = new Blob([data], { type: 'text/plain' });
          
          // Add HTML version with metadata
          const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
              <h3 style="margin: 0 0 12px 0; color: #333;">${report.title}</h3>
              <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
                <strong>Type:</strong> ${report.type} | 
                <strong>Generated:</strong> ${new Date(metadata.generatedAt).toLocaleString()} |
                <strong>Format:</strong> ${format} |
                <strong>Size:</strong> ${(metadata.finalSize / 1024).toFixed(2)} KB
              </div>
              <pre style="background: white; padding: 12px; border-radius: 4px; overflow: auto; font-size: 11px; border: 1px solid #eee;">${data.length > 1000 ? data.substring(0, 1000) + '...\n\n[Truncated - Full data copied to clipboard]' : data}</pre>
            </div>
          `;
          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });

          // Add JSON metadata for programmatic access
          const metadataJson = JSON.stringify({
            type: 'management-system-report',
            report: {
              id: report.id,
              title: report.title,
              type: report.type,
              metadata: metadata
            },
            copiedAt: new Date().toISOString(),
            format: format
          });
          const metadataBlob = new Blob([metadataJson], { type: 'application/json' });

          // Create clipboard item with multiple formats
          clipboardItems.push(new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
            'application/json': metadataBlob
          }));

          await navigator.clipboard.write(clipboardItems);
        } else {
          // Fallback to simple text copying
          await navigator.clipboard.writeText(data);
        }

        const result: ShareResult = {
          success: true,
          method: 'clipboard',
          message: `Report "${report.title}" copied to clipboard (${format} format, ${(metadata.finalSize / 1024).toFixed(2)} KB)`,
          shareId: `clip_${Date.now()}`,
          expiresAt: undefined // Clipboard doesn't expire
        };

        setShareResult(result);
        setShareHistory(prev => [result, ...prev].slice(0, 20)); // Keep last 20

        return result;

      } catch (error) {
        const result: ShareResult = {
          success: false,
          method: 'clipboard',
          message: error instanceof Error ? error.message : 'Failed to copy to clipboard'
        };
        setShareResult(result);
        return result;
      }
    });
  }, [enableClipboard, enableWindowsVSupport, checkClipboardSupport, generateShareableData, protectedSubmit]);

  // Download report as file
  const downloadReport = useCallback(async (
    report: ShareableReport,
    format: ShareableReport['metadata']['format'] = 'JSON',
    filename?: string
  ): Promise<ShareResult> => {
    return await protectedSubmit(async () => {
      try {
        const { data, metadata } = await generateShareableData(report, format);
        
        const extension = format.toLowerCase();
        const defaultFilename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.${extension}`;
        const finalFilename = filename || defaultFilename;

        // Determine MIME type
        const mimeTypes = {
          'JSON': 'application/json',
          'CSV': 'text/csv',
          'PDF': 'application/pdf',
          'XLSX': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

        const blob = new Blob([data], { type: mimeTypes[format] || 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        const result: ShareResult = {
          success: true,
          method: 'download',
          message: `Report downloaded as "${finalFilename}" (${(metadata.finalSize / 1024).toFixed(2)} KB)`,
          shareId: `download_${Date.now()}`
        };

        setShareResult(result);
        setShareHistory(prev => [result, ...prev].slice(0, 20));

        return result;

      } catch (error) {
        const result: ShareResult = {
          success: false,
          method: 'download',
          message: error instanceof Error ? error.message : 'Failed to download report'
        };
        setShareResult(result);
        return result;
      }
    });
  }, [generateShareableData, protectedSubmit]);

  // Generate shareable link
  const generateShareLink = useCallback(async (
    report: ShareableReport,
    options: {
      expiresIn?: number; // hours
      requireAuth?: boolean;
      allowedUsers?: string[];
    } = {}
  ): Promise<ShareResult> => {
    return await protectedSubmit(async () => {
      try {
        const { expiresIn = 24, requireAuth = false, allowedUsers = [] } = options;
        
        const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString();
        
        // In a real application, this would create a secure share endpoint
        const shareData = {
          id: shareId,
          reportId: report.id,
          title: report.title,
          type: report.type,
          data: report.data,
          metadata: report.metadata,
          shareOptions: {
            ...report.shareOptions,
            requireAuth,
            allowedUsers,
            expiresAt
          },
          createdAt: new Date().toISOString(),
          accessCount: 0,
          maxAccess: requireAuth ? 10 : 1
        };

        // Store in localStorage (in real app, this would go to secure backend)
        const shares = JSON.parse(localStorage.getItem('shared_reports') || '{}');
        shares[shareId] = shareData;
        localStorage.setItem('shared_reports', JSON.stringify(shares));

        // Generate URL (in real app, this would be your domain)
        const shareUrl = `${window.location.origin}/shared-report/${shareId}`;
        shareUrlCache.current.set(shareId, shareUrl);

        const result: ShareResult = {
          success: true,
          method: 'link',
          message: `Shareable link generated. Link expires ${new Date(expiresAt).toLocaleString()}`,
          shareId: shareUrl,
          expiresAt
        };

        setShareResult(result);
        setShareHistory(prev => [result, ...prev].slice(0, 20));

        return result;

      } catch (error) {
        const result: ShareResult = {
          success: false,
          method: 'link',
          message: error instanceof Error ? error.message : 'Failed to generate share link'
        };
        setShareResult(result);
        return result;
      }
    });
  }, [protectedSubmit]);

  // Email report (simplified implementation)
  const emailReport = useCallback(async (
    report: ShareableReport,
    recipients: string[],
    subject?: string,
    format: ShareableReport['metadata']['format'] = 'PDF'
  ): Promise<ShareResult> => {
    return await protectedSubmit(async () => {
      try {
        if (recipients.length === 0) {
          throw new Error('At least one recipient is required');
        }

        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = recipients.filter(email => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
          throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
        }

        const { data, metadata } = await generateShareableData(report, format);
        const defaultSubject = `Report: ${report.title} (${format})`;
        
        // Create mailto link (in real app, this would use email service)
        const mailtoBody = encodeURIComponent(`
Please find the attached report: ${report.title}

Report Details:
- Type: ${report.type}
- Generated: ${new Date(metadata.generatedAt).toLocaleString()}
- Format: ${format}
- Size: ${(metadata.finalSize / 1024).toFixed(2)} KB

Note: Report data is included in this email. Please handle according to your organization's data security policies.

---
${format === 'JSON' ? JSON.stringify(JSON.parse(data), null, 2) : data}
        `);

        const mailtoLink = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(subject || defaultSubject)}&body=${mailtoBody}`;
        
        // Open email client
        window.location.href = mailtoLink;

        const result: ShareResult = {
          success: true,
          method: 'email',
          message: `Email prepared for ${recipients.length} recipient(s). Please send from your email client.`,
          shareId: `email_${Date.now()}`
        };

        setShareResult(result);
        setShareHistory(prev => [result, ...prev].slice(0, 20));

        return result;

      } catch (error) {
        const result: ShareResult = {
          success: false,
          method: 'email',
          message: error instanceof Error ? error.message : 'Failed to prepare email'
        };
        setShareResult(result);
        return result;
      }
    });
  }, [generateShareableData, protectedSubmit]);

  // Multi-format sharing
  const shareReport = useCallback(async (
    report: ShareableReport,
    methods: ('clipboard' | 'download' | 'link' | 'email')[],
    options: any = {}
  ): Promise<ShareResult[]> => {
    setIsSharing(true);
    const results: ShareResult[] = [];

    try {
      for (const method of methods) {
        let result: ShareResult;
        
        switch (method) {
          case 'clipboard':
            result = await copyToClipboard(report, options.format);
            break;
          case 'download':
            result = await downloadReport(report, options.format, options.filename);
            break;
          case 'link':
            result = await generateShareLink(report, options.linkOptions);
            break;
          case 'email':
            result = await emailReport(report, options.recipients, options.subject, options.format);
            break;
          default:
            result = {
              success: false,
              method: method,
              message: `Unsupported sharing method: ${method}`
            };
        }
        
        results.push(result);
      }

      return results;

    } finally {
      setIsSharing(false);
    }
  }, [copyToClipboard, downloadReport, generateShareLink, emailReport]);

  // Utility functions for data conversion
  const convertToCSV = useCallback(async (data: any): Promise<string> => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      return csvContent;
    } else {
      // Convert object to key-value CSV
      const entries = Object.entries(data);
      return entries.map(([key, value]) => `${key},${value}`).join('\n');
    }
  }, []);

  const generatePDFData = useCallback(async (report: ShareableReport): Promise<string> => {
    // In a real implementation, this would generate actual PDF
    // For demo, return formatted text that represents PDF content
    return `PDF Report: ${report.title}\nGenerated: ${new Date().toLocaleString()}\n\n${JSON.stringify(report.data, null, 2)}`;
  }, []);

  const generateExcelData = useCallback(async (data: any): Promise<string> => {
    // In a real implementation, this would generate Excel file
    // For demo, return CSV-like format
    return await convertToCSV(data);
  }, [convertToCSV]);

  const compressData = useCallback(async (data: string): Promise<string> => {
    // Simple compression simulation (in real app, use actual compression)
    return btoa(data);
  }, []);

  const encryptData = useCallback(async (data: string): Promise<string> => {
    // Simple encryption simulation (in real app, use proper encryption)
    return btoa(encodeURIComponent(data));
  }, []);

  // Get share history
  const getShareHistory = useCallback(() => shareHistory, [shareHistory]);

  // Clear share result
  const clearShareResult = useCallback(() => setShareResult(null), []);

  return {
    // State
    isSharing,
    shareResult,
    shareHistory: getShareHistory(),
    clipboardSupported,

    // Methods
    copyToClipboard,
    downloadReport,
    generateShareLink,
    emailReport,
    shareReport,

    // Utilities
    checkClipboardSupport,
    clearShareResult,

    // Capabilities
    canCopyToClipboard: enableClipboard && clipboardSupported,
    supportsWindowsV: enableWindowsVSupport && clipboardSupported,
    supportedFormats: ['JSON', 'CSV', 'PDF', 'XLSX'] as const
  };
}
