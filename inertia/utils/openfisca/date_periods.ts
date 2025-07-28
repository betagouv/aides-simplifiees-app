/**
 * Date utilities for OpenFisca calculations
 */

import { ETERNITY_PERIOD, UNDEFINED_PERIOD_TYPE } from '~/utils/openfisca/constants'

/**
 * Initialize date periods based on current date
 */
export function initializeDatePeriods(): DatePeriods {
  const today = new Date()
  const todayAsString = today.toISOString()
  const monthDate = todayAsString.slice(0, 7)
  const month = todayAsString.slice(5, 7)

  const monthPlusOne = new Date(today)
  monthPlusOne.setMonth(today.getMonth() + 1)
  const nextMonth = monthPlusOne.toISOString().slice(0, 7)

  const year = todayAsString.slice(0, 4)
  const previousYear = String(Number.parseInt(year) - 1)

  /**
   * Rolling year format according to OpenFisca documentation
   * @see https://openfisca.org/doc/coding-the-legislation/35_periods.html#periods
   */
  const rollingYear = `month:${previousYear}-${month}:12`

  return {
    MONTH: monthDate,
    MONTH_NEXT: nextMonth,
    YEAR: year,
    YEAR_ROLLING: rollingYear,
  }
}

/**
 * Initialize date periods once according to today's date
 */
export const datePeriods: DatePeriods = initializeDatePeriods()

/**
 * Get the period string for a given period type
 */
export function resolvePeriodString(periodType: PeriodType, periods: DatePeriods): string {
  switch (periodType) {
    case 'MONTH':
      return periods.MONTH
    case 'YEAR':
      return periods.YEAR
    case 'YEAR_ROLLING':
      return periods.YEAR_ROLLING
    case 'ETERNITY':
      return ETERNITY_PERIOD
    default:
      console.error(`Période inconnue : ${periodType}`)
      return UNDEFINED_PERIOD_TYPE
  }
}

/**
 * Get the period string for a given period type
 */
export function getCurrentPeriod(periodType: PeriodType): string {
  const period = resolvePeriodString(periodType, datePeriods)
  return period
}
