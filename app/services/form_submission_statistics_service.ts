import type { TidyDataEntry, TimePeriod } from '#services/matomo_reporting_service'
import LoggingService from '#services/logging_service'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

/**
 * Service for generating statistics from form_submissions table.
 * This is used as a fallback/alternative to Matomo analytics,
 * especially useful for recovering lost analytics data.
 *
 * Key differences from Matomo:
 * - 'Start' events cannot be recovered (frontend-only tracking)
 * - 'Submit' = count of form_submissions rows
 * - 'Eligibility' = count of submissions with at least one eligible aide
 */
export default class FormSubmissionStatisticsService {
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)
  }

  /**
   * Generate statistics from form_submissions matching Matomo TidyDataEntry format
   */
  async fetchEventsCount(
    simulateurSlugs: string[],
    getPeriods: () => TimePeriod[],
  ): Promise<TidyDataEntry[]> {
    const timer = this.loggingService.startTimer('form_submission_stats_fetch', {
      simulateurSlugs,
    })

    try {
      const periods = getPeriods()
      // Note: 'Start' events cannot be recovered from form_submissions
      // Only 'Submit' and 'Eligibility' are available

      const results: TidyDataEntry[] = []

      for (const simulateurSlug of simulateurSlugs) {
        for (const period of periods) {
          const periodKey = `${period.start},${period.end}`

          // Get Submit count (each row = 1 submit)
          const submitCount = await this.getSubmitCount(simulateurSlug, period)
          results.push({
            simulateurSlug,
            periodKey,
            action: 'Submit',
            count: submitCount,
          })

          // Get Eligibility count (submissions with at least one eligible aide)
          const eligibilityCount = await this.getEligibilityCount(simulateurSlug, period)
          results.push({
            simulateurSlug,
            periodKey,
            action: 'Eligibility',
            count: eligibilityCount,
          })
        }
      }

      timer.stopWithMessage('Form submission statistics fetched successfully', {
        resultsCount: results.length,
        periodsCount: periods.length,
        simulateursCount: simulateurSlugs.length,
      })

      return results
    }
    catch (error) {
      timer.stopWithMessage('Failed to fetch form submission statistics', {
        error: error instanceof Error ? error.message : String(error),
      })

      this.loggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        {
          simulateurSlugs,
          operation: 'fetchEventsCount',
        },
      )

      return []
    }
  }

  /**
   * Count form submissions (equivalent to Submit events in Matomo)
   */
  private async getSubmitCount(simulateurSlug: string, period: TimePeriod): Promise<number> {
    const result = await db
      .from('form_submissions')
      .where('simulateur_slug', simulateurSlug)
      .whereRaw('created_at >= ?::date', [period.start])
      .whereRaw('created_at < (?::date + interval \'1 day\')', [period.end])
      .count('* as count')
      .first()

    return Number(result?.count || 0)
  }

  /**
   * Count submissions with at least one eligible aide
   * (equivalent to Eligibility visits in Matomo)
   *
   * Uses dynamic detection of eligibility fields in the results JSON
   */
  private async getEligibilityCount(simulateurSlug: string, period: TimePeriod): Promise<number> {
    // Count submissions where at least one key ending with '-eligibilite' is true
    const result = await db
      .from('form_submissions')
      .where('simulateur_slug', simulateurSlug)
      .whereRaw('created_at >= ?::date', [period.start])
      .whereRaw('created_at < (?::date + interval \'1 day\')', [period.end])
      .whereRaw(`results::text != '{}'`)
      .whereRaw(`
        EXISTS (
          SELECT 1 FROM jsonb_each_text(results::jsonb) AS kv
          WHERE kv.key LIKE '%-eligibilite'
          AND kv.value = 'true'
        )
      `)
      .count('* as count')
      .first()

    return Number(result?.count || 0)
  }

  /**
   * Get detailed eligibility breakdown per aide for a period
   * Useful for debugging and comparison with Matomo data
   */
  async getDetailedEligibilityStats(
    simulateurSlug: string,
    period: TimePeriod,
  ): Promise<Record<string, number>> {
    const timer = this.loggingService.startTimer('detailed_eligibility_stats', {
      simulateurSlug,
      period,
    })

    try {
      // Get all eligibility keys for this simulator
      const keysResult = await db
        .from('form_submissions')
        .where('simulateur_slug', simulateurSlug)
        .whereRaw(`results::text != '{}'`)
        .select(db.raw(`
          DISTINCT jsonb_object_keys(results::jsonb) as key
        `))

      const eligibilityKeys = keysResult
        .map((r: { key: string }) => r.key)
        .filter((key: string) => key.endsWith('-eligibilite'))

      // Count true values for each eligibility key
      const stats: Record<string, number> = {}

      for (const key of eligibilityKeys) {
        const countResult = await db
          .from('form_submissions')
          .where('simulateur_slug', simulateurSlug)
          .whereRaw('created_at >= ?::date', [period.start])
          .whereRaw('created_at < (?::date + interval \'1 day\')', [period.end])
          .whereRaw(`(results::jsonb)->>? = 'true'`, [key])
          .count('* as count')
          .first()

        stats[key] = Number(countResult?.count || 0)
      }

      timer.stopWithMessage('Detailed eligibility stats fetched', {
        keysCount: eligibilityKeys.length,
      })

      return stats
    }
    catch (error) {
      timer.stopWithMessage('Failed to fetch detailed eligibility stats', {
        error: error instanceof Error ? error.message : String(error),
      })
      return {}
    }
  }

  /**
   * Get summary statistics for all simulators
   */
  async getSummaryStats(): Promise<{
    totalSubmissions: number
    bySimulateur: Record<string, { total: number, withEligibility: number }>
    dateRange: { oldest: string | null, newest: string | null }
  }> {
    const timer = this.loggingService.startTimer('summary_stats')

    try {
      // Total count
      const totalResult = await db
        .from('form_submissions')
        .count('* as count')
        .first()

      // By simulateur
      const bySimResult = await db
        .from('form_submissions')
        .select('simulateur_slug')
        .count('* as total')
        .select(
          db.raw(`
            COUNT(*) FILTER (
              WHERE EXISTS (
                SELECT 1 FROM jsonb_each_text(results::jsonb) AS kv
                WHERE kv.key LIKE '%-eligibilite'
                AND kv.value = 'true'
              )
            ) as with_eligibility
          `),
        )
        .groupBy('simulateur_slug')

      // Date range
      const dateRangeResult = await db
        .from('form_submissions')
        .select(db.raw('MIN(created_at) as oldest, MAX(created_at) as newest'))
        .first()

      const bySimulateur: Record<string, { total: number, withEligibility: number }> = {}
      for (const row of bySimResult as any[]) {
        bySimulateur[row.simulateur_slug] = {
          total: Number(row.total),
          withEligibility: Number(row.with_eligibility),
        }
      }

      timer.stopWithMessage('Summary stats fetched')

      return {
        totalSubmissions: Number(totalResult?.count || 0),
        bySimulateur,
        dateRange: {
          oldest: dateRangeResult?.oldest?.toISOString?.() || null,
          newest: dateRangeResult?.newest?.toISOString?.() || null,
        },
      }
    }
    catch (error) {
      timer.stopWithMessage('Failed to fetch summary stats', {
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        totalSubmissions: 0,
        bySimulateur: {},
        dateRange: { oldest: null, newest: null },
      }
    }
  }
}
