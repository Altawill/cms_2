// Arabic-Indic numerals mapping
const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Convert Western numerals to Arabic-Indic numerals
 */
export function toArabicNumerals(text: string): string {
  let result = text
  for (let i = 0; i < westernNumerals.length; i++) {
    result = result.replace(new RegExp(westernNumerals[i], 'g'), arabicNumerals[i])
  }
  return result
}

/**
 * Convert Arabic-Indic numerals to Western numerals
 */
export function toWesternNumerals(text: string): string {
  let result = text
  for (let i = 0; i < arabicNumerals.length; i++) {
    result = result.replace(new RegExp(arabicNumerals[i], 'g'), westernNumerals[i])
  }
  return result
}

/**
 * Format currency amount with proper localization
 */
export function formatCurrency(
  amount: number,
  currency: string = 'LYD',
  language: string = 'en',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  const formatOptions = { ...defaultOptions, ...options }

  try {
    let formatted: string

    if (language === 'ar') {
      // For Arabic, format in English first then convert numerals
      formatted = new Intl.NumberFormat('en-US', formatOptions).format(amount)
      
      // Replace currency symbol for LYD
      if (currency === 'LYD') {
        formatted = formatted.replace('LYD', 'د.ل').replace('$', 'د.ل')
      }
      
      // Convert to Arabic numerals
      formatted = toArabicNumerals(formatted)
    } else {
      // English formatting
      formatted = new Intl.NumberFormat('en-US', formatOptions).format(amount)
      
      // Replace currency symbol for LYD
      if (currency === 'LYD') {
        formatted = formatted.replace('LYD', 'LYD').replace('$', 'LYD')
      }
    }

    return formatted
  } catch (error) {
    console.error('Currency formatting error:', error)
    // Fallback formatting
    const fallback = `${amount.toFixed(2)} ${currency}`
    return language === 'ar' ? toArabicNumerals(fallback) : fallback
  }
}

/**
 * Format number with thousands separators
 */
export function formatNumber(
  number: number,
  language: string = 'en',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }

  const formatOptions = { ...defaultOptions, ...options }

  try {
    const formatted = new Intl.NumberFormat('en-US', formatOptions).format(number)
    return language === 'ar' ? toArabicNumerals(formatted) : formatted
  } catch (error) {
    console.error('Number formatting error:', error)
    const fallback = number.toString()
    return language === 'ar' ? toArabicNumerals(fallback) : fallback
  }
}

/**
 * Parse formatted currency string back to number
 */
export function parseCurrency(formattedAmount: string, currency: string = 'LYD'): number {
  // Convert Arabic numerals to Western first
  const westernized = toWesternNumerals(formattedAmount)
  
  // Remove currency symbols and non-numeric characters except decimal point and minus
  const cleaned = westernized
    .replace(new RegExp(currency, 'g'), '')
    .replace(/[^\d\.\-]/g, '')
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  language: string = 'en',
  showSign: boolean = false
): string {
  const sign = showSign && value > 0 ? '+' : ''
  const formatted = `${sign}${value.toFixed(1)}%`
  return language === 'ar' ? toArabicNumerals(formatted) : formatted
}

/**
 * Round to nearest currency unit
 */
export function roundCurrency(amount: number, precision: number = 2): number {
  const factor = Math.pow(10, precision)
  return Math.round(amount * factor) / factor
}

/**
 * Check if amount is valid currency value
 */
export function isValidCurrency(amount: any): boolean {
  const num = typeof amount === 'string' ? parseCurrency(amount) : amount
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= 0
}

/**
 * Format currency for display in tables/lists (shorter format)
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = 'LYD',
  language: string = 'en'
): string {
  if (Math.abs(amount) >= 1000000) {
    return formatCurrency(amount / 1000000, currency, language, { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1 
    }) + (language === 'ar' ? 'م' : 'M')
  }
  
  if (Math.abs(amount) >= 1000) {
    return formatCurrency(amount / 1000, currency, language, { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1 
    }) + (language === 'ar' ? 'ك' : 'K')
  }
  
  return formatCurrency(amount, currency, language)
}

/**
 * Currency constants
 */
export const CURRENCIES = {
  LYD: {
    code: 'LYD',
    symbol: 'د.ل',
    name: {
      en: 'Libyan Dinar',
      ar: 'دينار ليبي'
    },
    decimals: 3 // Libyan Dinar has 1000 dirhams
  }
} as const

export type SupportedCurrency = keyof typeof CURRENCIES
