/**
 * Utilities for handling site codes with case-insensitive operations
 * and proper normalization
 */

export interface SiteCodeValidationResult {
  isValid: boolean;
  normalizedCode: string;
  errors: string[];
  warnings: string[];
}

export interface SiteCodeConflictResult {
  hasConflict: boolean;
  conflictingSites: Array<{
    id: string;
    name: string;
    code: string;
    originalCode: string;
  }>;
  suggestions: string[];
}

// Site code formatting and validation patterns
const SITE_CODE_PATTERNS = {
  // Standard format: 3-4 letters + dash + 4 digits + optional dash + 3 letters
  STANDARD: /^[A-Z]{3,4}-\d{4}(-[A-Z]{3})?$/,
  // Project format: Project code + dash + year + dash + sequence
  PROJECT: /^[A-Z]{2,5}-\d{4}-\d{3,4}$/,
  // Legacy format: Mix of letters and numbers
  LEGACY: /^[A-Z0-9]{6,12}$/,
  // Custom format: Flexible pattern
  CUSTOM: /^[A-Z0-9-]{4,20}$/
};

// Reserved site code prefixes (system use only)
const RESERVED_PREFIXES = [
  'SYS', 'ADMIN', 'TEST', 'TEMP', 'DEMO', 'NULL', 'VOID',
  'ARCH', 'BACKUP', 'LOG', 'AUDIT', 'REPORT'
];

// Common site code suffixes by project type
const COMMON_SUFFIXES = {
  residential: ['RES', 'HSG', 'VIL', 'APT'],
  commercial: ['COM', 'OFF', 'RTL', 'WHS'],
  infrastructure: ['INF', 'RD', 'BR', 'TUN'],
  industrial: ['IND', 'FAC', 'PLT', 'WRK'],
  mixed: ['MIX', 'DEV', 'CMP', 'CTR']
};

/**
 * Normalizes a site code to uppercase and removes extra spaces/characters
 */
export function normalizeSiteCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return '';
  }

  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^A-Z0-9-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Validates a site code against various patterns and rules
 */
export function validateSiteCode(
  code: string,
  options: {
    allowLegacy?: boolean;
    strictFormat?: boolean;
    customPattern?: RegExp;
    existingCodes?: string[];
  } = {}
): SiteCodeValidationResult {
  const {
    allowLegacy = true,
    strictFormat = false,
    customPattern,
    existingCodes = []
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedCode = normalizeSiteCode(code);

  // Basic validation
  if (!normalizedCode) {
    errors.push('Site code is required');
    return { isValid: false, normalizedCode: '', errors, warnings };
  }

  if (normalizedCode.length < 3) {
    errors.push('Site code must be at least 3 characters long');
  }

  if (normalizedCode.length > 20) {
    errors.push('Site code cannot exceed 20 characters');
  }

  // Check for reserved prefixes
  const prefix = normalizedCode.split('-')[0];
  if (RESERVED_PREFIXES.includes(prefix)) {
    errors.push(`Site code cannot use reserved prefix: ${prefix}`);
  }

  // Pattern validation
  let patternValid = false;
  
  if (customPattern) {
    patternValid = customPattern.test(normalizedCode);
    if (!patternValid) {
      errors.push('Site code does not match the required custom format');
    }
  } else if (strictFormat) {
    patternValid = SITE_CODE_PATTERNS.STANDARD.test(normalizedCode);
    if (!patternValid) {
      errors.push('Site code must follow standard format (e.g., ABC-1234 or ABC-1234-XYZ)');
    }
  } else {
    // Check against all patterns
    patternValid = Object.values(SITE_CODE_PATTERNS).some(pattern => 
      pattern.test(normalizedCode)
    );
    
    if (!patternValid) {
      if (allowLegacy) {
        warnings.push('Site code format is non-standard. Consider using a standard format.');
        patternValid = true; // Allow it with warning
      } else {
        errors.push('Site code format is invalid. Use formats like ABC-1234, PRJ-2024-001, or ABCD1234');
      }
    }
  }

  // Check for duplicates (case-insensitive)
  const normalizedExisting = existingCodes.map(c => normalizeSiteCode(c));
  if (normalizedExisting.includes(normalizedCode)) {
    errors.push('Site code already exists (codes are case-insensitive)');
  }

  // Additional warnings
  if (normalizedCode.includes('--')) {
    warnings.push('Site code contains consecutive dashes');
  }

  if (normalizedCode.length > 15) {
    warnings.push('Site code is quite long. Consider using a shorter code for better usability.');
  }

  // Check for potentially confusing characters
  const confusingChars = ['0O', 'IL1'];
  confusingChars.forEach(chars => {
    const charArray = chars.split('');
    if (charArray.some(char => normalizedCode.includes(char))) {
      warnings.push(`Site code contains potentially confusing characters (${chars.split('').join(', ')})`);
    }
  });

  return {
    isValid: errors.length === 0,
    normalizedCode,
    errors,
    warnings
  };
}

/**
 * Checks for conflicts with existing site codes
 */
export function checkSiteCodeConflicts(
  newCode: string,
  existingSites: Array<{ id: string; name: string; code: string }>,
  options: {
    suggestAlternatives?: boolean;
    maxSuggestions?: number;
  } = {}
): SiteCodeConflictResult {
  const { suggestAlternatives = true, maxSuggestions = 5 } = options;
  const normalizedNewCode = normalizeSiteCode(newCode);
  
  const conflictingSites = existingSites.filter(site => 
    normalizeSiteCode(site.code) === normalizedNewCode
  ).map(site => ({
    ...site,
    originalCode: site.code,
    code: normalizeSiteCode(site.code)
  }));

  const hasConflict = conflictingSites.length > 0;
  let suggestions: string[] = [];

  if (hasConflict && suggestAlternatives) {
    suggestions = generateAlternativeCodes(normalizedNewCode, existingSites, maxSuggestions);
  }

  return {
    hasConflict,
    conflictingSites,
    suggestions
  };
}

/**
 * Generates alternative site codes when there's a conflict
 */
export function generateAlternativeCodes(
  originalCode: string,
  existingSites: Array<{ code: string }>,
  maxSuggestions: number = 5
): string[] {
  const normalizedCode = normalizeSiteCode(originalCode);
  const existingNormalized = existingSites.map(site => normalizeSiteCode(site.code));
  const suggestions: string[] = [];

  // Strategy 1: Add numeric suffix
  for (let i = 1; i <= 99 && suggestions.length < maxSuggestions; i++) {
    const candidate = `${normalizedCode}-${i.toString().padStart(2, '0')}`;
    if (!existingNormalized.includes(candidate)) {
      suggestions.push(candidate);
    }
  }

  // Strategy 2: Add alphabetic suffix
  if (suggestions.length < maxSuggestions) {
    const suffixes = ['A', 'B', 'C', 'D', 'E', 'X', 'Y', 'Z'];
    for (const suffix of suffixes) {
      if (suggestions.length >= maxSuggestions) break;
      const candidate = `${normalizedCode}-${suffix}`;
      if (!existingNormalized.includes(candidate)) {
        suggestions.push(candidate);
      }
    }
  }

  // Strategy 3: Modify the original code slightly
  if (suggestions.length < maxSuggestions) {
    const parts = normalizedCode.split('-');
    if (parts.length >= 2) {
      // Try incrementing the numeric part
      const numericPart = parts[parts.length - 1];
      if (/^\d+$/.test(numericPart)) {
        const num = parseInt(numericPart, 10);
        for (let i = 1; i <= 10 && suggestions.length < maxSuggestions; i++) {
          const newParts = [...parts];
          newParts[newParts.length - 1] = (num + i).toString().padStart(numericPart.length, '0');
          const candidate = newParts.join('-');
          if (!existingNormalized.includes(candidate)) {
            suggestions.push(candidate);
          }
        }
      }
    }
  }

  // Strategy 4: Add project type suffix
  if (suggestions.length < maxSuggestions) {
    const allSuffixes = Object.values(COMMON_SUFFIXES).flat();
    for (const suffix of allSuffixes) {
      if (suggestions.length >= maxSuggestions) break;
      const candidate = `${normalizedCode}-${suffix}`;
      if (!existingNormalized.includes(candidate)) {
        suggestions.push(candidate);
      }
    }
  }

  return suggestions.slice(0, maxSuggestions);
}

/**
 * Suggests site codes based on site information
 */
export function suggestSiteCode(siteInfo: {
  name: string;
  location?: string;
  type?: keyof typeof COMMON_SUFFIXES;
  startDate?: string;
}): string[] {
  const suggestions: string[] = [];
  const { name, location, type, startDate } = siteInfo;

  // Extract meaningful parts from name
  const nameWords = name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);

  // Get year from start date
  const year = startDate ? new Date(startDate).getFullYear().toString() : new Date().getFullYear().toString();

  // Strategy 1: First letters of main words + year
  if (nameWords.length >= 2) {
    const acronym = nameWords.slice(0, 3).map(word => word[0]).join('');
    suggestions.push(`${acronym}-${year.slice(-2)}01`);
    suggestions.push(`${acronym}-${year}-001`);
  }

  // Strategy 2: Location-based codes
  if (location) {
    const locationWords = location
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (locationWords.length > 0) {
      const locAcronym = locationWords.slice(0, 2).map(word => word.slice(0, 2)).join('');
      suggestions.push(`${locAcronym}-${year.slice(-2)}01`);
    }
  }

  // Strategy 3: Type-based suffixes
  if (type && COMMON_SUFFIXES[type]) {
    const typeSuffixes = COMMON_SUFFIXES[type];
    const baseCode = nameWords.length > 0 ? nameWords[0].slice(0, 3) : 'PRJ';
    typeSuffixes.forEach(suffix => {
      suggestions.push(`${baseCode}-${year.slice(-2)}-${suffix}`);
    });
  }

  // Strategy 4: Sequential numbering
  const baseAcronym = nameWords.length > 0 
    ? nameWords.slice(0, 2).map(word => word[0]).join('') 
    : 'ST';
  
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${baseAcronym}${year.slice(-2)}-${i.toString().padStart(3, '0')}`);
  }

  // Remove duplicates and normalize
  const uniqueSuggestions = [...new Set(suggestions.map(code => normalizeSiteCode(code)))]
    .filter(code => code.length >= 3 && code.length <= 20);

  return uniqueSuggestions.slice(0, 10);
}

/**
 * Formats site code for display with consistent casing
 */
export function formatSiteCodeForDisplay(code: string, style: 'upper' | 'lower' | 'title' = 'upper'): string {
  const normalized = normalizeSiteCode(code);
  
  switch (style) {
    case 'lower':
      return normalized.toLowerCase();
    case 'title':
      return normalized
        .split('-')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join('-');
    case 'upper':
    default:
      return normalized;
  }
}

/**
 * Search for sites by code with case-insensitive matching
 */
export function searchSitesByCode(
  searchTerm: string,
  sites: Array<{ id: string; code: string; name: string }>,
  options: {
    exactMatch?: boolean;
    includePartialMatches?: boolean;
    maxResults?: number;
  } = {}
): Array<{ id: string; code: string; name: string; matchType: 'exact' | 'starts_with' | 'contains' }> {
  const { exactMatch = false, includePartialMatches = true, maxResults = 50 } = options;
  const normalizedSearch = normalizeSiteCode(searchTerm);
  
  if (!normalizedSearch) {
    return [];
  }

  const results: Array<{ id: string; code: string; name: string; matchType: 'exact' | 'starts_with' | 'contains' }> = [];

  for (const site of sites) {
    const normalizedSiteCode = normalizeSiteCode(site.code);
    
    // Exact match
    if (normalizedSiteCode === normalizedSearch) {
      results.push({ ...site, matchType: 'exact' });
      if (exactMatch) break;
      continue;
    }

    // Partial matches
    if (includePartialMatches && !exactMatch) {
      if (normalizedSiteCode.startsWith(normalizedSearch)) {
        results.push({ ...site, matchType: 'starts_with' });
      } else if (normalizedSiteCode.includes(normalizedSearch)) {
        results.push({ ...site, matchType: 'contains' });
      }
    }
  }

  // Sort by match type priority: exact > starts_with > contains
  const priorityOrder = { exact: 0, starts_with: 1, contains: 2 };
  results.sort((a, b) => priorityOrder[a.matchType] - priorityOrder[b.matchType]);

  return results.slice(0, maxResults);
}

/**
 * Bulk normalize site codes in an array
 */
export function bulkNormalizeSiteCodes<T extends { code: string }>(
  items: T[]
): T[] {
  return items.map(item => ({
    ...item,
    code: normalizeSiteCode(item.code)
  }));
}

/**
 * Get site code statistics
 */
export function getSiteCodeStatistics(sites: Array<{ code: string }>): {
  total: number;
  byPattern: Record<string, number>;
  averageLength: number;
  duplicates: Array<{ code: string; count: number }>;
  invalid: Array<{ code: string; errors: string[] }>;
} {
  const stats = {
    total: sites.length,
    byPattern: {} as Record<string, number>,
    averageLength: 0,
    duplicates: [] as Array<{ code: string; count: number }>,
    invalid: [] as Array<{ code: string; errors: string[] }>
  };

  const codeFrequency = new Map<string, number>();
  let totalLength = 0;

  for (const site of sites) {
    const normalized = normalizeSiteCode(site.code);
    totalLength += normalized.length;

    // Count frequency for duplicates
    codeFrequency.set(normalized, (codeFrequency.get(normalized) || 0) + 1);

    // Validate and categorize
    const validation = validateSiteCode(site.code);
    if (!validation.isValid) {
      stats.invalid.push({ code: site.code, errors: validation.errors });
    }

    // Pattern detection
    let patternFound = false;
    for (const [patternName, pattern] of Object.entries(SITE_CODE_PATTERNS)) {
      if (pattern.test(normalized)) {
        stats.byPattern[patternName] = (stats.byPattern[patternName] || 0) + 1;
        patternFound = true;
        break;
      }
    }
    
    if (!patternFound) {
      stats.byPattern['CUSTOM'] = (stats.byPattern['CUSTOM'] || 0) + 1;
    }
  }

  // Calculate average length
  stats.averageLength = sites.length > 0 ? totalLength / sites.length : 0;

  // Find duplicates
  for (const [code, count] of codeFrequency.entries()) {
    if (count > 1) {
      stats.duplicates.push({ code, count });
    }
  }

  return stats;
}
