import { useState, useCallback, useRef, useEffect } from 'react';
import { useRBAC } from '../contexts/RBACContext';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  details: AuditDetails;
  metadata: AuditMetadata;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  error?: string;
}

export type AuditAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT'
  | 'TRANSFER' | 'APPROVE' | 'REJECT' | 'MARK_PAID' | 'CANCEL'
  | 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED';

export type AuditResource = 
  | 'USER' | 'ROLE' | 'DEPARTMENT' | 'POSITION' | 'SITE' | 'EMPLOYEE'
  | 'EXPENSE' | 'REVENUE' | 'TRANSFER' | 'SAFE' | 'REPORT' | 'DOCUMENT'
  | 'AUTHENTICATION' | 'PERMISSION';

export interface AuditDetails {
  description: string;
  oldValue?: any;
  newValue?: any;
  amount?: number;
  currency?: string;
  fromAccount?: string;
  toAccount?: string;
  approvedBy?: string;
  reason?: string;
  attachments?: string[];
}

export interface AuditMetadata {
  correlationId?: string;
  batchId?: string;
  parentLogId?: string;
  tags?: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SECURITY' | 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE';
  isRetention?: boolean;
  retentionPeriod?: number; // days
}

interface UseAuditLoggerOptions {
  enableAutoFlush?: boolean;
  flushInterval?: number; // milliseconds
  maxBatchSize?: number;
  enableEncryption?: boolean;
  retentionPolicy?: {
    enabled: boolean;
    defaultPeriod: number; // days
    criticalPeriod: number; // days
  };
}

export function useAuditLogger(options: UseAuditLoggerOptions = {}) {
  const {
    enableAutoFlush = true,
    flushInterval = 5000, // 5 seconds
    maxBatchSize = 50,
    enableEncryption = true,
    retentionPolicy = {
      enabled: true,
      defaultPeriod: 2555, // 7 years
      criticalPeriod: 3650 // 10 years
    }
  } = options;

  const { currentUser } = useRBAC();
  const [pendingLogs, setPendingLogs] = useState<AuditLogEntry[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const correlationIdRef = useRef<string | null>(null);

  // Generate correlation ID for related operations
  const generateCorrelationId = useCallback(() => {
    const id = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    correlationIdRef.current = id;
    return id;
  }, []);

  // Clear correlation ID
  const clearCorrelationId = useCallback(() => {
    correlationIdRef.current = null;
  }, []);

  // Encrypt sensitive data if enabled
  const encryptSensitiveData = useCallback((data: any) => {
    if (!enableEncryption) return data;
    
    // In a real implementation, this would use proper encryption
    // For demo purposes, we'll just obfuscate
    if (typeof data === 'string' && data.length > 0) {
      return '***' + data.slice(-4);
    }
    if (typeof data === 'number') {
      return '***' + data.toString().slice(-2);
    }
    return data;
  }, [enableEncryption]);

  // Create audit log entry
  const createLogEntry = useCallback((
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    details: Partial<AuditDetails> = {},
    metadata: Partial<AuditMetadata> = {},
    success: boolean = true,
    error?: string
  ): AuditLogEntry => {
    const now = new Date().toISOString();
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine severity based on action and resource
    let severity: AuditMetadata['severity'] = 'LOW';
    let category: AuditMetadata['category'] = 'OPERATIONAL';

    if (action === 'TRANSFER' || action === 'MARK_PAID') {
      severity = 'HIGH';
      category = 'FINANCIAL';
    } else if (action === 'LOGIN' || action === 'ACCESS_DENIED') {
      severity = action === 'ACCESS_DENIED' ? 'MEDIUM' : 'LOW';
      category = 'SECURITY';
    } else if (action === 'DELETE' || action === 'APPROVE') {
      severity = 'MEDIUM';
    }

    if (!success || error) {
      severity = severity === 'LOW' ? 'MEDIUM' : 'HIGH';
    }

    // Encrypt sensitive fields
    const sanitizedDetails = {
      ...details,
      fromAccount: details.fromAccount ? encryptSensitiveData(details.fromAccount) : undefined,
      toAccount: details.toAccount ? encryptSensitiveData(details.toAccount) : undefined
    };

    return {
      id: logId,
      timestamp: now,
      userId: currentUser?.id || 'SYSTEM',
      userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'SYSTEM',
      userRole: currentUser?.roles?.[0] || 'UNKNOWN',
      action,
      resource,
      resourceId,
      details: sanitizedDetails,
      metadata: {
        severity,
        category,
        correlationId: correlationIdRef.current || undefined,
        retentionPeriod: metadata.severity === 'CRITICAL' ? 
          retentionPolicy.criticalPeriod : 
          retentionPolicy.defaultPeriod,
        ...metadata
      },
      ipAddress: '127.0.0.1', // In real app, get from request
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('sessionId') || undefined,
      success,
      error
    };
  }, [currentUser, encryptSensitiveData, retentionPolicy]);

  // Add log entry to pending queue
  const logAction = useCallback((
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    details: Partial<AuditDetails> = {},
    metadata: Partial<AuditMetadata> = {},
    success: boolean = true,
    error?: string
  ) => {
    const entry = createLogEntry(action, resource, resourceId, details, metadata, success, error);
    setPendingLogs(prev => [...prev, entry]);

    // Auto-flush if batch size reached
    if (pendingLogs.length >= maxBatchSize) {
      flushLogs();
    }
  }, [createLogEntry, pendingLogs.length, maxBatchSize]);

  // Specialized logging methods for money transfers
  const logTransfer = useCallback((
    transferId: string,
    fromAccount: string,
    toAccount: string,
    amount: number,
    currency: string = 'LYD',
    reason?: string,
    success: boolean = true,
    error?: string
  ) => {
    logAction('TRANSFER', 'TRANSFER', transferId, {
      description: `Money transfer from ${fromAccount} to ${toAccount}`,
      amount,
      currency,
      fromAccount,
      toAccount,
      reason
    }, {
      severity: 'HIGH',
      category: 'FINANCIAL',
      tags: ['money_transfer', 'financial_transaction']
    }, success, error);
  }, [logAction]);

  const logPaymentApproval = useCallback((
    paymentId: string,
    amount: number,
    approvedBy: string,
    currency: string = 'LYD',
    success: boolean = true
  ) => {
    logAction('APPROVE', 'EXPENSE', paymentId, {
      description: `Payment approval for amount ${amount} ${currency}`,
      amount,
      currency,
      approvedBy
    }, {
      severity: 'HIGH',
      category: 'FINANCIAL',
      tags: ['payment_approval', 'financial_approval']
    }, success);
  }, [logAction]);

  const logMarkPaid = useCallback((
    expenseId: string,
    amount: number,
    currency: string = 'LYD',
    success: boolean = true,
    error?: string
  ) => {
    logAction('MARK_PAID', 'EXPENSE', expenseId, {
      description: `Marked expense as paid: ${amount} ${currency}`,
      amount,
      currency
    }, {
      severity: 'HIGH',
      category: 'FINANCIAL',
      tags: ['mark_paid', 'payment_completion']
    }, success, error);
  }, [logAction]);

  const logAccessAttempt = useCallback((
    resource: AuditResource,
    resourceId: string,
    granted: boolean,
    reason?: string
  ) => {
    logAction(granted ? 'VIEW' : 'ACCESS_DENIED', resource, resourceId, {
      description: granted ? 
        `Access granted to ${resource}` : 
        `Access denied to ${resource}${reason ? `: ${reason}` : ''}`,
      reason
    }, {
      severity: granted ? 'LOW' : 'MEDIUM',
      category: 'SECURITY',
      tags: ['access_control', granted ? 'access_granted' : 'access_denied']
    }, granted, granted ? undefined : 'Access denied');
  }, [logAction]);

  // Flush pending logs to storage
  const flushLogs = useCallback(async () => {
    if (pendingLogs.length === 0 || isLogging) return;

    setIsLogging(true);
    try {
      // In a real implementation, this would send to a secure audit service
      const existingLogs = localStorage.getItem('audit_logs');
      const currentLogs = existingLogs ? JSON.parse(existingLogs) : [];
      const allLogs = [...currentLogs, ...pendingLogs];
      
      // Apply retention policy
      if (retentionPolicy.enabled) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionPolicy.defaultPeriod);
        
        const filteredLogs = allLogs.filter((log: AuditLogEntry) => {
          const logDate = new Date(log.timestamp);
          const retentionPeriod = log.metadata.retentionPeriod || retentionPolicy.defaultPeriod;
          const logCutoff = new Date();
          logCutoff.setDate(logCutoff.getDate() - retentionPeriod);
          
          return logDate > logCutoff;
        });
        
        localStorage.setItem('audit_logs', JSON.stringify(filteredLogs));
      } else {
        localStorage.setItem('audit_logs', JSON.stringify(allLogs));
      }
      
      setPendingLogs([]);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
    } finally {
      setIsLogging(false);
    }
  }, [pendingLogs, isLogging, retentionPolicy]);

  // Get audit logs with filtering
  const getAuditLogs = useCallback((filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    severity?: AuditMetadata['severity'];
    category?: AuditMetadata['category'];
    correlationId?: string;
    limit?: number;
  } = {}) => {
    try {
      const logsData = localStorage.getItem('audit_logs');
      if (!logsData) return [];

      let logs: AuditLogEntry[] = JSON.parse(logsData);

      // Apply filters
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.severity) {
        logs = logs.filter(log => log.metadata.severity === filters.severity);
      }
      if (filters.category) {
        logs = logs.filter(log => log.metadata.category === filters.category);
      }
      if (filters.correlationId) {
        logs = logs.filter(log => log.metadata.correlationId === filters.correlationId);
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply limit
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }

      return logs;
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }, []);

  // Export audit logs
  const exportAuditLogs = useCallback((filters = {}) => {
    const logs = getAuditLogs(filters);
    const csvContent = [
      // CSV header
      'ID,Timestamp,User,Action,Resource,Resource ID,Description,Success,Error',
      // CSV rows
      ...logs.map(log => [
        log.id,
        log.timestamp,
        `"${log.userName}"`,
        log.action,
        log.resource,
        log.resourceId,
        `"${log.details.description.replace(/"/g, '""')}"`,
        log.success,
        log.error || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [getAuditLogs]);

  // Setup auto-flush timer
  useEffect(() => {
    if (enableAutoFlush) {
      flushTimerRef.current = setInterval(flushLogs, flushInterval);
    }

    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
    };
  }, [enableAutoFlush, flushInterval, flushLogs]);

  // Flush logs on unmount
  useEffect(() => {
    return () => {
      if (pendingLogs.length > 0) {
        flushLogs();
      }
    };
  }, [pendingLogs.length, flushLogs]);

  return {
    // General logging
    logAction,
    
    // Specialized logging methods
    logTransfer,
    logPaymentApproval,
    logMarkPaid,
    logAccessAttempt,
    
    // Correlation tracking
    generateCorrelationId,
    clearCorrelationId,
    currentCorrelationId: correlationIdRef.current,
    
    // Log management
    flushLogs,
    getAuditLogs,
    exportAuditLogs,
    
    // State
    pendingLogsCount: pendingLogs.length,
    isLogging
  };
}
