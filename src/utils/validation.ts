/**
 * Comprehensive validation utilities for perfect form validation
 * Includes sanitization, validation rules, and error handling
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedValue: any
}

export class PerfectValidator {
  
  // Email validation with comprehensive checks
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase()
    
    // Basic presence check
    if (!sanitizedEmail) {
      return {
        isValid: false,
        errors: ['Email is required • البريد الإلكتروني مطلوب'],
        warnings: [],
        sanitizedValue: ''
      }
    }
    
    // Comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(sanitizedEmail)) {
      errors.push('Please enter a valid email address • يرجى إدخال عنوان بريد إلكتروني صحيح')
    }
    
    // Length validation
    if (sanitizedEmail.length > 254) {
      errors.push('Email address is too long • عنوان البريد الإلكتروني طويل جداً')
    }
    
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const domain = sanitizedEmail.split('@')[1]
    if (domain && !commonDomains.includes(domain)) {
      const similar = this.findSimilarDomain(domain, commonDomains)
      if (similar) {
        warnings.push(`Did you mean ${similar}? • هل تقصد ${similar}؟`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitizedEmail
    }
  }
  
  // Name validation with international character support
  static validateName(name: string, fieldName = 'Name'): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Sanitize input - remove extra spaces, trim
    const sanitizedName = name.replace(/\s+/g, ' ').trim()
    
    if (!sanitizedName) {
      return {
        isValid: false,
        errors: [`${fieldName} is required • ${this.getArabicFieldName(fieldName)} مطلوب`],
        warnings: [],
        sanitizedValue: ''
      }
    }
    
    // Length validation
    if (sanitizedName.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters • ${this.getArabicFieldName(fieldName)} يجب أن يكون على الأقل حرفين`)
    }
    
    if (sanitizedName.length > 100) {
      errors.push(`${fieldName} is too long • ${this.getArabicFieldName(fieldName)} طويل جداً`)
    }
    
    // Character validation - allow letters, spaces, hyphens, apostrophes, Arabic characters
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s'-]+$/
    if (!nameRegex.test(sanitizedName)) {
      errors.push(`${fieldName} contains invalid characters • ${this.getArabicFieldName(fieldName)} يحتوي على أحرف غير صحيحة`)
    }
    
    // Warning for all caps
    if (sanitizedName === sanitizedName.toUpperCase() && sanitizedName.length > 3) {
      warnings.push('Consider using proper capitalization • فكر في استخدام الأحرف الكبيرة والصغيرة بشكل صحيح')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: this.capitalizeWords(sanitizedName)
    }
  }
  
  // Amount/Currency validation
  static validateAmount(amount: string | number, currency = 'SAR', min = 0.01, max = 1000000): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Convert to string for processing
    const amountStr = typeof amount === 'number' ? amount.toString() : amount.trim()
    
    if (!amountStr) {
      return {
        isValid: false,
        errors: ['Amount is required • المبلغ مطلوب'],
        warnings: [],
        sanitizedValue: 0
      }
    }
    
    // Remove currency symbols and extra spaces
    const sanitizedAmount = amountStr.replace(/[^\d.-]/g, '')
    const numericAmount = parseFloat(sanitizedAmount)
    
    // Check if it's a valid number
    if (isNaN(numericAmount)) {
      return {
        isValid: false,
        errors: ['Please enter a valid amount • يرجى إدخال مبلغ صحيح'],
        warnings: [],
        sanitizedValue: 0
      }
    }
    
    // Range validation
    if (numericAmount < min) {
      errors.push(`Amount must be at least ${min} ${currency} • المبلغ يجب أن يكون على الأقل ${min} ${currency}`)
    }
    
    if (numericAmount > max) {
      errors.push(`Amount cannot exceed ${max.toLocaleString()} ${currency} • المبلغ لا يمكن أن يتجاوز ${max.toLocaleString()} ${currency}`)
    }
    
    // Decimal places validation
    const decimalPlaces = (sanitizedAmount.split('.')[1] || '').length
    if (decimalPlaces > 2) {
      warnings.push('Amount will be rounded to 2 decimal places • سيتم تقريب المبلغ إلى منزلتين عشريتين')
    }
    
    // Warning for large amounts
    if (numericAmount > 50000) {
      warnings.push('Large amount detected - please verify • تم اكتشاف مبلغ كبير - يرجى التحقق')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: Math.round(numericAmount * 100) / 100 // Round to 2 decimal places
    }
  }
  
  // Description/Text validation
  static validateDescription(text: string, minLength = 5, maxLength = 1000): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Sanitize input - remove excessive whitespace
    const sanitizedText = text.replace(/\s+/g, ' ').trim()
    
    if (!sanitizedText) {
      return {
        isValid: false,
        errors: ['Description is required • الوصف مطلوب'],
        warnings: [],
        sanitizedValue: ''
      }
    }
    
    // Length validation
    if (sanitizedText.length < minLength) {
      errors.push(`Description must be at least ${minLength} characters • الوصف يجب أن يكون على الأقل ${minLength} أحرف`)
    }
    
    if (sanitizedText.length > maxLength) {
      errors.push(`Description is too long (max ${maxLength} characters) • الوصف طويل جداً (الحد الأقصى ${maxLength} حرف)`)
    }
    
    // Check for suspicious content
    const suspiciousPatterns = [
      /(.){10,}/, // Repeated characters
      /[<>{}\[\]]/,  // HTML/Script tags
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitizedText)) {
        errors.push('Description contains invalid content • الوصف يحتوي على محتوى غير صحيح')
        break
      }
    }
    
    // Warning for very short descriptions
    if (sanitizedText.length < 20) {
      warnings.push('Consider adding more details • فكر في إضافة المزيد من التفاصيل')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitizedText
    }
  }
  
  // Comprehensive form validation
  static validateReceiptForm(formData: any): { isValid: boolean, errors: Record<string, string[]>, warnings: Record<string, string[]> } {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}
    
    // Validate client name
    const nameResult = this.validateName(formData.clientName || '', 'Client Name')
    if (!nameResult.isValid) errors.clientName = nameResult.errors
    if (nameResult.warnings.length > 0) warnings.clientName = nameResult.warnings
    
    // Validate email (optional)
    if (formData.clientEmail) {
      const emailResult = this.validateEmail(formData.clientEmail)
      if (!emailResult.isValid) errors.clientEmail = emailResult.errors
      if (emailResult.warnings.length > 0) warnings.clientEmail = emailResult.warnings
    }
    
    // Validate amount
    const amountResult = this.validateAmount(formData.amount || '', formData.currency)
    if (!amountResult.isValid) errors.amount = amountResult.errors
    if (amountResult.warnings.length > 0) warnings.amount = amountResult.warnings
    
    // Validate description
    const descResult = this.validateDescription(formData.description || '')
    if (!descResult.isValid) errors.description = descResult.errors
    if (descResult.warnings.length > 0) warnings.description = descResult.warnings
    
    // Tax rate validation
    const taxRate = parseFloat(formData.taxRate || '0')
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 50) {
      errors.taxRate = ['Tax rate must be between 0% and 50% • معدل الضريبة يجب أن يكون بين 0% و 50%']
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }
  
  // Utility methods
  private static getArabicFieldName(fieldName: string): string {
    const translations: Record<string, string> = {
      'Name': 'الاسم',
      'Client Name': 'اسم العميل',
      'Email': 'البريد الإلكتروني',
      'Description': 'الوصف',
      'Amount': 'المبلغ'
    }
    return translations[fieldName] || fieldName
  }
  
  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase())
  }
  
  private static findSimilarDomain(domain: string, commonDomains: string[]): string | null {
    // Simple similarity check
    for (const commonDomain of commonDomains) {
      if (this.calculateSimilarity(domain, commonDomain) > 0.7) {
        return commonDomain
      }
    }
    return null
  }
  
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }
  
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}

import { useState } from 'react'

// Validation utilities for forms
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: any) => string | null
}

export type ValidationRules = Record<string, ValidationRule>

// Main validation function
export function validateForm(data: Record<string, any>, rules: ValidationRules): ValidationResult {
  const errors: Record<string, string> = {}

  Object.keys(rules).forEach(field => {
    const value = data[field]
    const rule = rules[field]
    const error = validateField(value, rule, field)
    
    if (error) {
      errors[field] = error
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate individual field
export function validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
  // Required validation
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName} must be at least ${rule.minLength} characters`
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName} must be less than ${rule.maxLength} characters`
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName} format is invalid`
    }

    if (rule.email && !isValidEmail(value)) {
      return `${fieldName} must be a valid email address`
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${fieldName} must be at least ${rule.min}`
    }

    if (rule.max !== undefined && value > rule.max) {
      return `${fieldName} must be less than ${rule.max}`
    }
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value)
    if (customError) {
      return customError
    }
  }

  return null
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Common validation rules
export const commonRules = {
  siteName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  siteCode: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Za-z0-9-]+$/
  },
  location: {
    required: true,
    maxLength: 200
  },
  budget: {
    required: true,
    min: 0,
    max: 1000000000
  },
  employeeName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\u0600-\u06FF\s]+$/
  },
  employeeId: {
    required: true,
    minLength: 3,
    maxLength: 15,
    pattern: /^[A-Z0-9]+$/
  },
  hourlyRate: {
    required: true,
    min: 0,
    max: 1000
  },
  equipmentName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  serialNumber: {
    required: true,
    minLength: 3,
    maxLength: 50
  },
  dailyRate: {
    required: true,
    min: 0,
    max: 50000
  },
  expenseAmount: {
    required: true,
    min: 0,
    max: 10000000
  },
  expenseDescription: {
    required: true,
    minLength: 5,
    maxLength: 500
  },
  milestoneTitle: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  milestoneDescription: {
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  documentName: {
    required: true,
    minLength: 3,
    maxLength: 255
  },
  tags: {
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\u0600-\u06FF\s,.-]+$/
  }
}

// Validation error messages for different languages
export const validationMessages = {
  en: {
    required: (field: string) => `${field} is required`,
    minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
    maxLength: (field: string, max: number) => `${field} must be less than ${max} characters`,
    min: (field: string, min: number) => `${field} must be at least ${min}`,
    max: (field: string, max: number) => `${field} must be less than ${max}`,
    pattern: (field: string) => `${field} format is invalid`,
    email: (field: string) => `${field} must be a valid email address`,
    custom: (message: string) => message
  },
  ar: {
    required: (field: string) => `${field} مطلوب`,
    minLength: (field: string, min: number) => `${field} يجب أن يكون على الأقل ${min} أحرف`,
    maxLength: (field: string, max: number) => `${field} يجب أن يكون أقل من ${max} أحرف`,
    min: (field: string, min: number) => `${field} يجب أن يكون على الأقل ${min}`,
    max: (field: string, max: number) => `${field} يجب أن يكون أقل من ${max}`,
    pattern: (field: string) => `تنسيق ${field} غير صحيح`,
    email: (field: string) => `${field} يجب أن يكون عنوان بريد إلكتروني صحيح`,
    custom: (message: string) => message
  }
}

// Field name translations
export const fieldNames = {
  en: {
    siteName: 'Site Name',
    siteCode: 'Site Code',
    location: 'Location',
    description: 'Description',
    budget: 'Budget',
    manager: 'Manager',
    startDate: 'Start Date',
    endDate: 'End Date',
    employeeName: 'Employee Name',
    employeeId: 'Employee ID',
    role: 'Role',
    department: 'Department',
    hourlyRate: 'Hourly Rate',
    equipmentName: 'Equipment Name',
    type: 'Type',
    serialNumber: 'Serial Number',
    dailyRate: 'Daily Rate',
    condition: 'Condition',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    milestoneTitle: 'Milestone Title',
    targetDate: 'Target Date',
    documentName: 'Document Name',
    tags: 'Tags'
  },
  ar: {
    siteName: 'اسم الموقع',
    siteCode: 'رمز الموقع',
    location: 'الموقع',
    description: 'الوصف',
    budget: 'الميزانية',
    manager: 'المدير',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ الانتهاء',
    employeeName: 'اسم الموظف',
    employeeId: 'رقم الموظف',
    role: 'الدور',
    department: 'القسم',
    hourlyRate: 'الأجر بالساعة',
    equipmentName: 'اسم المعدة',
    type: 'النوع',
    serialNumber: 'الرقم التسلسلي',
    dailyRate: 'السعر اليومي',
    condition: 'الحالة',
    amount: 'المبلغ',
    category: 'الفئة',
    date: 'التاريخ',
    milestoneTitle: 'عنوان المعلم',
    targetDate: 'التاريخ المستهدف',
    documentName: 'اسم الوثيقة',
    tags: 'العلامات'
  }
}

// Get localized validation message
export function getValidationMessage(
  type: keyof typeof validationMessages.en,
  field: string,
  language: 'en' | 'ar',
  additionalParam?: number
): string {
  const fieldName = fieldNames[language][field as keyof typeof fieldNames.en] || field
  const messageFunc = validationMessages[language][type]
  
  if (typeof messageFunc === 'function') {
    // Handle functions that require additional parameters
    if (type === 'minLength' || type === 'maxLength' || type === 'min' || type === 'max') {
      return (messageFunc as (field: string, param: number) => string)(fieldName, additionalParam || 0)
    }
    return (messageFunc as (field: string) => string)(fieldName)
  }
  
  return `Validation error for ${fieldName}`
}

// Date validation helpers
export function isValidDate(date: string): boolean {
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime()) && date.length === 10 // YYYY-MM-DD format
}

export function isDateInRange(date: string, minDate?: string, maxDate?: string): boolean {
  const dateObj = new Date(date)
  
  if (minDate && dateObj < new Date(minDate)) {
    return false
  }
  
  if (maxDate && dateObj > new Date(maxDate)) {
    return false
  }
  
  return true
}

// File validation helpers
export function validateFileSize(file: File, maxSizeInMB: number = 50): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  return fileExtension ? allowedTypes.includes(fileExtension) : false
}

// Export validation hook for React components
export function useValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)

  const validate = (data: Record<string, any>, rules: ValidationRules): boolean => {
    setIsValidating(true)
    const result = validateForm(data, rules)
    setErrors(result.errors)
    setIsValidating(false)
    return result.isValid
  }

  const clearErrors = () => {
    setErrors({})
  }

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  return {
    errors,
    isValidating,
    validate,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0
  }
}

export default validateForm
