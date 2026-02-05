// Shared validation utilities for experience endpoints

// UUID v4 format validation
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Date format validation (YYYY-MM or YYYY-MM-DD)
export const DATE_REGEX = /^\d{4}-\d{2}(-\d{2})?$/

/**
 * Validates date string and returns parsed Date object or null if invalid.
 * Accepts YYYY-MM or YYYY-MM-DD format.
 * Validates that the date actually exists (e.g., 2026-02-30 is invalid).
 */
export function parseAndValidateDate(dateStr: string): Date | null {
  if (!DATE_REGEX.test(dateStr)) {
    return null
  }

  // For YYYY-MM format, append -01 to make a valid date
  const fullDateStr = dateStr.length === 7 ? `${dateStr}-01` : dateStr
  const date = new Date(fullDateStr)

  // Check if date is valid (NaN check) and matches original input
  if (isNaN(date.getTime())) {
    return null
  }

  // Verify the parsed date matches the input (catches invalid dates like 2026-02-30)
  const parts = fullDateStr.split('-')
  const year = parseInt(parts[0] ?? '0', 10)
  const month = parseInt(parts[1] ?? '0', 10)
  const day = parseInt(parts[2] ?? '0', 10)

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== month
    || date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

/**
 * Checks if date is in the future compared to current date.
 * Uses UTC comparison to avoid timezone issues.
 */
export function isFutureDate(date: Date): boolean {
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return date > todayUTC
}

// Max length validation constants
export const MAX_TITLE = 100
export const MAX_COMPANY = 100
export const MAX_LOCATION = 100
export const MAX_DESCRIPTION = 1000

/**
 * Converts YYYY-MM format to YYYY-MM-01 for PostgreSQL DATE type.
 * Returns the date as-is if already in YYYY-MM-DD format.
 */
export function toDbDate(dateStr: string): string {
  return dateStr.length === 7 ? `${dateStr}-01` : dateStr
}
