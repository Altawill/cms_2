import { useState, useCallback, useRef, useEffect } from 'react';
import { useFormSubmission } from './useFormSubmission';
import { useAuditLogger } from './useAuditLogger';

export interface UndoableAction {
  id: string;
  timestamp: string;
  type: 'MARK_PAID' | 'APPROVE_EXPENSE' | 'TRANSFER_MONEY' | 'DELETE_RECORD';
  description: string;
  data: any;
  reverseData: any;
  userId: string;
  canUndo: boolean;
  undoDeadline?: string;
  metadata?: {
    amount?: number;
    currency?: string;
    resourceId?: string;
    resourceType?: string;
    confirmationRequired?: boolean;
    reason?: string;
  };
}

interface UseUndoSystemOptions {
  maxUndoHistory?: number;
  defaultUndoTimeLimit?: number; // minutes
  enableAutoCleanup?: boolean;
  requireConfirmation?: boolean;
}

export function useUndoSystem(options: UseUndoSystemOptions = {}) {
  const {
    maxUndoHistory = 50,
    defaultUndoTimeLimit = 30, // 30 minutes
    enableAutoCleanup = true,
    requireConfirmation = true
  } = options;

  const [undoHistory, setUndoHistory] = useState<UndoableAction[]>([]);
  const [pendingUndo, setPendingUndo] = useState<UndoableAction | null>(null);
  const [showUndoConfirmation, setShowUndoConfirmation] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  
  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 500
  });
  
  const auditLogger = useAuditLogger();
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load undo history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('undo_history');
      if (savedHistory) {
        const history: UndoableAction[] = JSON.parse(savedHistory);
        // Filter out expired actions
        const now = new Date();
        const validHistory = history.filter(action => {
          if (!action.undoDeadline) return true;
          return new Date(action.undoDeadline) > now;
        });
        setUndoHistory(validHistory);
        
        // Save cleaned history back
        if (validHistory.length !== history.length) {
          localStorage.setItem('undo_history', JSON.stringify(validHistory));
        }
      }
    } catch (error) {
      console.error('Failed to load undo history:', error);
    }
  }, []);

  // Save undo history to localStorage
  const saveUndoHistory = useCallback((history: UndoableAction[]) => {
    try {
      localStorage.setItem('undo_history', JSON.stringify(history));
      setUndoHistory(history);
    } catch (error) {
      console.error('Failed to save undo history:', error);
    }
  }, []);

  // Add action to undo history
  const addUndoableAction = useCallback((
    type: UndoableAction['type'],
    description: string,
    data: any,
    reverseData: any,
    metadata?: UndoableAction['metadata'],
    customUndoTimeLimit?: number
  ) => {
    const now = new Date();
    const undoTimeLimit = customUndoTimeLimit || defaultUndoTimeLimit;
    const deadline = new Date(now.getTime() + undoTimeLimit * 60 * 1000);

    const action: UndoableAction = {
      id: `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      type,
      description,
      data,
      reverseData,
      userId: 'current-user', // In real app, get from auth context
      canUndo: true,
      undoDeadline: deadline.toISOString(),
      metadata
    };

    const newHistory = [action, ...undoHistory].slice(0, maxUndoHistory);
    saveUndoHistory(newHistory);

    // Log the action
    auditLogger.logAction('CREATE', 'EXPENSE', metadata?.resourceId || 'unknown', {
      description: `Undoable action added: ${description}`
    });

    return action.id;
  }, [undoHistory, maxUndoHistory, defaultUndoTimeLimit, saveUndoHistory, auditLogger]);

  // Check if action can be undone
  const canUndoAction = useCallback((actionId: string): boolean => {
    const action = undoHistory.find(a => a.id === actionId);
    if (!action) return false;

    if (!action.canUndo) return false;

    if (action.undoDeadline && new Date(action.undoDeadline) < new Date()) {
      return false;
    }

    return true;
  }, [undoHistory]);

  // Get time remaining for undo
  const getUndoTimeRemaining = useCallback((actionId: string): number => {
    const action = undoHistory.find(a => a.id === actionId);
    if (!action || !action.undoDeadline) return 0;

    const deadline = new Date(action.undoDeadline);
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();

    return Math.max(0, Math.floor(remaining / 1000)); // seconds
  }, [undoHistory]);

  // Perform undo operation
  const performUndo = useCallback(async (
    actionId: string,
    reason?: string
  ): Promise<boolean> => {
    return await protectedSubmit(async () => {
      const action = undoHistory.find(a => a.id === actionId);
      if (!action) {
        throw new Error('Undo action not found');
      }

      if (!canUndoAction(actionId)) {
        throw new Error('This action can no longer be undone');
      }

      try {
        // Generate correlation ID for the undo operation
        const correlationId = auditLogger.generateCorrelationId();

        // Perform the actual undo operation based on type
        switch (action.type) {
          case 'MARK_PAID':
            await undoMarkPaid(action, reason);
            break;
          case 'APPROVE_EXPENSE':
            await undoApproveExpense(action, reason);
            break;
          case 'TRANSFER_MONEY':
            await undoTransfer(action, reason);
            break;
          case 'DELETE_RECORD':
            await undoDelete(action, reason);
            break;
          default:
            throw new Error(`Unsupported undo type: ${action.type}`);
        }

        // Mark action as undone
        const updatedHistory = undoHistory.map(a => 
          a.id === actionId 
            ? { ...a, canUndo: false, undoDeadline: undefined }
            : a
        );
        saveUndoHistory(updatedHistory);

        // Log the undo operation
        auditLogger.logAction('UPDATE', 'EXPENSE', action.metadata?.resourceId || 'unknown', {
          description: `Undo performed: ${action.description}`,
          reason: reason || 'No reason provided'
        }, {
          correlationId,
          severity: 'HIGH',
          category: 'FINANCIAL',
          tags: ['undo_operation', action.type.toLowerCase()]
        });

        auditLogger.clearCorrelationId();
        return true;

      } catch (error) {
        auditLogger.logAction('UPDATE', 'EXPENSE', action.metadata?.resourceId || 'unknown', {
          description: `Undo failed: ${action.description}`,
          reason: error instanceof Error ? error.message : 'Unknown error'
        }, {
          severity: 'HIGH',
          category: 'FINANCIAL',
          tags: ['undo_failed', action.type.toLowerCase()]
        }, false, error instanceof Error ? error.message : 'Unknown error');

        throw error;
      }
    });
  }, [undoHistory, canUndoAction, protectedSubmit, saveUndoHistory, auditLogger]);

  // Undo mark paid operation
  const undoMarkPaid = useCallback(async (action: UndoableAction, reason?: string) => {
    // In a real application, this would call the API to reverse the payment
    const expenseData = action.reverseData;
    
    // Simulate API call to update expense status back to 'approved'
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update localStorage (in real app, this would be API call)
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const updatedExpenses = expenses.map((expense: any) => 
      expense.id === action.metadata?.resourceId 
        ? { ...expense, status: 'approved', paidDate: null, paidBy: null }
        : expense
    );
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

    console.log(`Undid mark paid for expense ${action.metadata?.resourceId}`, { reason });
  }, []);

  // Undo approve expense operation
  const undoApproveExpense = useCallback(async (action: UndoableAction, reason?: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const updatedExpenses = expenses.map((expense: any) => 
      expense.id === action.metadata?.resourceId 
        ? { ...expense, status: 'pending', approvedDate: null, approvedBy: null }
        : expense
    );
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

    console.log(`Undid approve expense for ${action.metadata?.resourceId}`, { reason });
  }, []);

  // Undo transfer operation
  const undoTransfer = useCallback(async (action: UndoableAction, reason?: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate reversing the transfer
    console.log(`Undid transfer ${action.metadata?.resourceId}`, { 
      amount: action.metadata?.amount,
      currency: action.metadata?.currency,
      reason 
    });
  }, []);

  // Undo delete operation
  const undoDelete = useCallback(async (action: UndoableAction, reason?: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate restoring the deleted record
    const resourceType = action.metadata?.resourceType || 'records';
    const existingData = JSON.parse(localStorage.getItem(resourceType) || '[]');
    const restoredData = [...existingData, action.reverseData];
    localStorage.setItem(resourceType, JSON.stringify(restoredData));

    console.log(`Undid delete for ${action.metadata?.resourceType} ${action.metadata?.resourceId}`, { reason });
  }, []);

  // Show undo confirmation dialog
  const requestUndo = useCallback((actionId: string) => {
    const action = undoHistory.find(a => a.id === actionId);
    if (!action) {
      setUndoError('Undo action not found');
      return;
    }

    if (!canUndoAction(actionId)) {
      setUndoError('This action can no longer be undone');
      return;
    }

    setPendingUndo(action);
    setShowUndoConfirmation(true);
    setUndoError(null);
  }, [undoHistory, canUndoAction]);

  // Confirm and execute undo
  const confirmUndo = useCallback(async (reason?: string) => {
    if (!pendingUndo) return;

    try {
      await performUndo(pendingUndo.id, reason);
      setShowUndoConfirmation(false);
      setPendingUndo(null);
      setUndoError(null);
    } catch (error) {
      setUndoError(error instanceof Error ? error.message : 'Failed to undo action');
    }
  }, [pendingUndo, performUndo]);

  // Cancel undo
  const cancelUndo = useCallback(() => {
    setShowUndoConfirmation(false);
    setPendingUndo(null);
    setUndoError(null);
  }, []);

  // Clean up expired undo actions
  const cleanupExpiredActions = useCallback(() => {
    const now = new Date();
    const validActions = undoHistory.filter(action => {
      if (!action.undoDeadline) return true;
      return new Date(action.undoDeadline) > now;
    });

    if (validActions.length !== undoHistory.length) {
      saveUndoHistory(validActions);
    }
  }, [undoHistory, saveUndoHistory]);

  // Get recent undoable actions for display
  const getRecentUndoableActions = useCallback((limit = 10) => {
    return undoHistory
      .filter(action => action.canUndo && canUndoAction(action.id))
      .slice(0, limit);
  }, [undoHistory, canUndoAction]);

  // Convenience methods for common operations
  const addMarkPaidUndo = useCallback((
    expenseId: string,
    amount: number,
    currency: string,
    expenseData: any
  ) => {
    return addUndoableAction(
      'MARK_PAID',
      `Marked expense as paid (${amount} ${currency})`,
      { expenseId, status: 'paid', paidDate: new Date().toISOString() },
      expenseData,
      {
        amount,
        currency,
        resourceId: expenseId,
        resourceType: 'expense',
        confirmationRequired: true
      }
    );
  }, [addUndoableAction]);

  const addApprovalUndo = useCallback((
    expenseId: string,
    amount: number,
    currency: string,
    expenseData: any
  ) => {
    return addUndoableAction(
      'APPROVE_EXPENSE',
      `Approved expense (${amount} ${currency})`,
      { expenseId, status: 'approved', approvedDate: new Date().toISOString() },
      expenseData,
      {
        amount,
        currency,
        resourceId: expenseId,
        resourceType: 'expense',
        confirmationRequired: true
      }
    );
  }, [addUndoableAction]);

  const addTransferUndo = useCallback((
    transferId: string,
    amount: number,
    currency: string,
    fromAccount: string,
    toAccount: string,
    transferData: any
  ) => {
    return addUndoableAction(
      'TRANSFER_MONEY',
      `Money transfer (${amount} ${currency}) from ${fromAccount} to ${toAccount}`,
      { transferId, status: 'completed' },
      transferData,
      {
        amount,
        currency,
        resourceId: transferId,
        resourceType: 'transfer',
        confirmationRequired: true
      }
    );
  }, [addUndoableAction]);

  // Setup cleanup timer
  useEffect(() => {
    if (enableAutoCleanup) {
      cleanupTimerRef.current = setInterval(cleanupExpiredActions, 60000); // Every minute
    }

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [enableAutoCleanup, cleanupExpiredActions]);

  return {
    // State
    undoHistory,
    pendingUndo,
    showUndoConfirmation,
    undoError,
    isSubmitting,

    // Actions
    requestUndo,
    confirmUndo,
    cancelUndo,
    performUndo,

    // Utilities
    canUndoAction,
    getUndoTimeRemaining,
    getRecentUndoableActions,
    cleanupExpiredActions,

    // Convenience methods
    addMarkPaidUndo,
    addApprovalUndo,
    addTransferUndo,
    addUndoableAction,

    // Error handling
    setUndoError,
    clearError: () => setUndoError(null)
  };
}
