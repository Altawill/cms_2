import React, { useState, useCallback, useRef } from 'react'

interface UseFormSubmissionOptions {
  /** Minimum time between submissions in milliseconds */
  debounceMs?: number
  /** Show loading state during submission */
  showLoading?: boolean
}

interface UseFormSubmissionReturn {
  /** Whether the form is currently being submitted */
  isSubmitting: boolean
  /** Whether the form is on cooldown (debouncing) */
  isOnCooldown: boolean
  /** Wrapped submit handler that prevents double submission */
  handleSubmit: (submitFn: () => Promise<void> | void) => Promise<void>
  /** Manually reset the submission state */
  reset: () => void
}

/**
 * Custom hook to prevent double form submission with debouncing
 * 
 * Features:
 * - Prevents multiple submissions while one is in progress
 * - Debounces rapid successive submissions
 * - Provides loading states for UI feedback
 * - Handles both sync and async submit functions
 * 
 * @param options Configuration options
 * @returns Form submission utilities
 */
export function useFormSubmission(
  options: UseFormSubmissionOptions = {}
): UseFormSubmissionReturn {
  const {
    debounceMs = 1000,
    showLoading = true
  } = options

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const lastSubmissionRef = useRef<number>(0)
  const cooldownTimeoutRef = useRef<NodeJS.Timeout>()

  const reset = useCallback(() => {
    setIsSubmitting(false)
    setIsOnCooldown(false)
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = undefined
    }
  }, [])

  const handleSubmit = useCallback(async (submitFn: () => Promise<void> | void) => {
    const now = Date.now()
    
    // Prevent submission if already submitting
    if (isSubmitting) {
      console.warn('Form submission prevented: already submitting')
      return
    }
    
    // Prevent rapid successive submissions (debouncing)
    if (isOnCooldown || (now - lastSubmissionRef.current < debounceMs)) {
      console.warn('Form submission prevented: too soon after last submission')
      return
    }

    try {
      // Set loading state
      if (showLoading) {
        setIsSubmitting(true)
      }

      // Update last submission time
      lastSubmissionRef.current = now

      // Execute the submit function
      await submitFn()

      // Set cooldown period to prevent rapid successive submissions
      setIsOnCooldown(true)
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsOnCooldown(false)
      }, debounceMs)

    } catch (error) {
      console.error('Form submission error:', error)
      // Re-throw the error so the caller can handle it
      throw error
    } finally {
      // Always clear loading state
      if (showLoading) {
        setIsSubmitting(false)
      }
    }
  }, [isSubmitting, isOnCooldown, debounceMs, showLoading])

  return {
    isSubmitting,
    isOnCooldown,
    handleSubmit,
    reset
  }
}

/**
 * Higher-order component wrapper for form elements to prevent double submission
 * 
 * @param WrappedComponent The form component to wrap
 * @param options Form submission options
 * @returns Enhanced component with double-submission protection
 */
export function withFormSubmissionProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UseFormSubmissionOptions = {}
) {
  return function FormSubmissionProtectedComponent(props: P) {
    const submissionUtils = useFormSubmission(options)
    
    return (
      <WrappedComponent 
        {...props} 
        submissionUtils={submissionUtils}
      />
    )
  }
}

/**
 * Utility function to create a debounced click handler
 * 
 * @param handler The original click handler
 * @param delay Debounce delay in milliseconds
 * @returns Debounced click handler
 */
export function createDebouncedClickHandler(
  handler: (event: React.MouseEvent) => void | Promise<void>,
  delay: number = 500
) {
  let lastClickTime = 0
  
  return async (event: React.MouseEvent) => {
    const now = Date.now()
    
    if (now - lastClickTime < delay) {
      event.preventDefault()
      return
    }
    
    lastClickTime = now
    await handler(event)
  }
}

/**
 * Custom hook for button click protection (useful for action buttons)
 * 
 * @param options Configuration options
 * @returns Button click utilities
 */
export function useButtonSubmission(options: UseFormSubmissionOptions = {}) {
  const { debounceMs = 500 } = options
  const [isClicking, setIsClicking] = useState(false)
  const lastClickRef = useRef<number>(0)

  const handleClick = useCallback(async (clickFn: () => Promise<void> | void) => {
    const now = Date.now()
    
    // Prevent rapid clicks
    if (isClicking || (now - lastClickRef.current < debounceMs)) {
      return
    }

    try {
      setIsClicking(true)
      lastClickRef.current = now
      await clickFn()
    } catch (error) {
      console.error('Button click error:', error)
      throw error
    } finally {
      setIsClicking(false)
    }
  }, [isClicking, debounceMs])

  return {
    isClicking,
    handleClick
  }
}
