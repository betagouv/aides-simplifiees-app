/**
 * Form Submission Statistics Provider
 *
 * This provider generates statistics from the form_submissions table.
 * It serves as the primary data source since it has direct database access
 * and doesn't depend on external services.
 *
 * Available metrics:
 * - submit: Count of form submissions (each row = 1 submit)
 * - eligibility: Count of submissions with at least one eligible aide
 *
 * Note: 'start' metric is NOT available from form_submissions
 * since start events are only tracked client-side via Matomo.
 */

import type { DailySnapshot, StatisticsMetric, StatisticsProvider } from './types.js'
import db from '@adonisjs/lucid/services/db'

export class FormSubmissionProvider implements StatisticsProvider {
  readonly source = 'form_submissions' as const
  readonly displayName = 'Base de données'
  readonly availableMetrics: StatisticsMetric[] = ['submit', 'eligibility']

  /**
   * Always available - direct database access
   */
  isAvailable = (): boolean => {
    return true
  }

  /**
   * Generate snapshot from form_submissions table for a specific date
   *
   * Uses PostgreSQL queries to count:
   * - submit_count: Total rows for the date/simulator
   * - eligibility_count: Rows where results JSON contains at least one
   *   key ending with '-eligibilite' set to 'true'
   *
   * @param date - Date in YYYY-MM-DD format (UTC)
   * @param simulateurSlug - Simulator identifier
   */
  generateSnapshot = async (date: string, simulateurSlug: string): Promise<DailySnapshot> => {
    const stats = await db
      .from('form_submissions')
      .where('simulateur_slug', simulateurSlug)
      .whereRaw('DATE(created_at AT TIME ZONE \'UTC\') = ?', [date])
      .select(
        db.raw('COUNT(*) as submit_count'),
        db.raw(`
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM jsonb_each_text(results::jsonb) AS kv
              WHERE kv.key LIKE '%-eligibilite'
              AND kv.value = 'true'
            )
          ) as eligibility_count
        `),
      )
      .first()

    return {
      date,
      simulateurSlug,
      source: this.source,
      submitCount: Number(stats?.submit_count || 0),
      eligibilityCount: Number(stats?.eligibility_count || 0),
      startCount: 0, // Not available from form_submissions
    }
  }
}
