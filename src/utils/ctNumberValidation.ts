// CT Number validation utilities

export interface CTValidationResult {
  isValid: boolean
  formatted: string
  errors: string[]
}

export interface CTDuplicateCheck {
  isDuplicate: boolean
  existingOrderUid?: string
  lastUsedDate?: string
  canOverride: boolean
  warningMessage?: string
}

/**
 * Validates and formats a CT number according to business rules:
 * - Exactly 14 alphanumeric characters
 * - All uppercase
 * - No spaces or special characters
 */
export function validateCTNumber(input: string): CTValidationResult {
  const errors: string[] = []
  let formatted = input.trim().toUpperCase()

  // Remove any non-alphanumeric characters
  formatted = formatted.replace(/[^A-Z0-9]/g, '')

  // Check length
  if (formatted.length === 0) {
    errors.push('CT number cannot be empty')
  } else if (formatted.length < 14) {
    errors.push(`CT number must be exactly 14 characters (currently ${formatted.length})`)
  } else if (formatted.length > 14) {
    errors.push(`CT number must be exactly 14 characters (currently ${formatted.length})`)
    // Truncate if too long
    formatted = formatted.substring(0, 14)
  }

  // Check for invalid characters (already filtered out, but double-check)
  const validPattern = /^[A-Z0-9]{14}$/
  if (formatted.length === 14 && !validPattern.test(formatted)) {
    errors.push('CT number must contain only letters and numbers')
  }

  return {
    isValid: errors.length === 0 && formatted.length === 14,
    formatted,
    errors
  }
}

/**
 * Validates multiple CT numbers at once
 */
export function validateCTNumbers(inputs: string[]): CTValidationResult[] {
  return inputs.map(input => validateCTNumber(input))
}

/**
 * Formats CT number with visual separators for display (not for storage)
 */
export function formatCTForDisplay(ctNumber: string): string {
  if (ctNumber.length !== 14) return ctNumber
  
  // Format as: XXXX-XXXX-XXXX-XX for better readability
  return `${ctNumber.slice(0, 4)}-${ctNumber.slice(4, 8)}-${ctNumber.slice(8, 12)}-${ctNumber.slice(12, 14)}`
}

/**
 * Removes formatting from display format back to storage format
 */
export function unformatCTNumber(formatted: string): string {
  return formatted.replace(/[^A-Z0-9]/g, '').toUpperCase()
}

/**
 * Generates a CT number based on different strategies
 */
export interface CTGenerationOptions {
  strategy: 'fai_master' | 'last_used' | 'random_suffix'
  baseString?: string
  randomLength?: number
  customerPartNumber?: string
}

export function generateCTNumber(options: CTGenerationOptions): string {
  const { strategy, baseString = '', randomLength = 4 } = options

  switch (strategy) {
    case 'fai_master':
      // Use FAI master CT string as base
      if (baseString && baseString.length === 14) {
        return baseString.toUpperCase()
      }
      // Fallback to random if no valid base
      return generateRandomCT()

    case 'last_used':
      // Use last used CT for same part as base
      if (baseString && baseString.length === 14) {
        // Increment the last few characters if possible
        return incrementCTNumber(baseString)
      }
      return generateRandomCT()

    case 'random_suffix':
      // Global prefix + random suffix
      const prefix = 'HP' // Default prefix, could be configurable
      const maxPrefixLength = 14 - randomLength
      const actualPrefix = prefix.substring(0, maxPrefixLength)
      const suffix = generateRandomString(14 - actualPrefix.length)
      return (actualPrefix + suffix).toUpperCase()

    default:
      return generateRandomCT()
  }
}

/**
 * Generates a completely random 14-character CT number
 */
function generateRandomCT(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates random string of specified length
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Attempts to increment a CT number (for last_used strategy)
 */
function incrementCTNumber(ctNumber: string): string {
  // Try to increment the last few characters
  const base = ctNumber.substring(0, 10)
  const suffix = ctNumber.substring(10)
  
  // Try to increment as number first (if it's all numeric)
  if (/^\d+$/.test(suffix)) {
    const numericSuffix = parseInt(suffix, 10)
    const incremented = (numericSuffix + 1).toString().padStart(4, '0')
    if (incremented.length <= 4) {
      return base + incremented
    }
  }
  
  // Try to increment as base36 alphanumeric
  const numericSuffix = parseInt(suffix, 36)
  if (!isNaN(numericSuffix)) {
    const incremented = (numericSuffix + 1).toString(36).toUpperCase()
    if (incremented.length <= 4) {
      return base + incremented.padStart(4, '0')
    }
  }
  
  // Fallback to random if increment fails
  return generateRandomCT()
}

/**
 * Extracts CT numbers from multi-line input text
 */
export function extractCTNumbers(input: string): string[] {
  // Split by newlines, commas, spaces, or tabs
  const potential = input
    .split(/[\n,\s\t]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return potential
}

/**
 * Validates a batch of CT numbers and returns summary
 */
export interface CTBatchValidation {
  total: number
  valid: number
  invalid: number
  duplicatesInBatch: string[]
  validCTs: string[]
  invalidCTs: { ct: string, errors: string[] }[]
}

export function validateCTBatch(inputs: string[]): CTBatchValidation {
  const validCTs: string[] = []
  const invalidCTs: { ct: string, errors: string[] }[] = []
  const seen = new Set<string>()
  const duplicatesInBatch: string[] = []

  inputs.forEach(input => {
    const validation = validateCTNumber(input)
    
    if (validation.isValid) {
      if (seen.has(validation.formatted)) {
        duplicatesInBatch.push(validation.formatted)
      } else {
        seen.add(validation.formatted)
        validCTs.push(validation.formatted)
      }
    } else {
      invalidCTs.push({
        ct: input,
        errors: validation.errors
      })
    }
  })

  return {
    total: inputs.length,
    valid: validCTs.length,
    invalid: invalidCTs.length,
    duplicatesInBatch,
    validCTs,
    invalidCTs
  }
}