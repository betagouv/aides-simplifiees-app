import { describe, expect, it } from 'vitest'
import { formatDateTime } from './date-time'

describe('formatDateTime', () => {
  it('should correctly format a valid date', () => {
    // Creating a specific date for consistent testing
    const testDate = new Date('2023-05-15T14:30:00')

    const result = formatDateTime(testDate)

    // Note: The exact output will depend on the locale settings when the test runs
    // This test assumes fr-FR locale as specified in the function
    expect(result).toEqual({
      date: expect.stringContaining('2023'),
      time: expect.stringContaining('14:30'),
    })
  })

  it('should return null when given null', () => {
    // @ts-ignore - Testing null input even though type signature expects Date
    const result = formatDateTime(null)
    expect(result).toBeNull()
  })

  it('should return null when given undefined', () => {
    // @ts-ignore - Testing undefined input even though type signature expects Date
    const result = formatDateTime(undefined)
    expect(result).toBeNull()
  })

  it('should format the date in French locale', () => {
    const testDate = new Date('2023-05-15T14:30:00')
    const result = formatDateTime(testDate)

    // Check for French month format - "mai" for May
    expect(result?.date).toMatch(/mai/)
    // Check for French weekday - "lundi" for Monday
    expect(result?.date).toMatch(/lundi/)
  })
})
