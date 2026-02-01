/**
 * Matomo Analytics Statistics Provider
 *
 * This provider generates statistics from the Matomo Analytics API.
 * It requires proper configuration via environment variables:
 * - MATOMO_URL: Base URL of the Matomo instance
 * - MATOMO_TOKEN: API authentication token
 * - MATOMO_SITE_ID: Site ID in Matomo
 *
 * Available metrics:
 * - submit: Submit events tracked in Matomo
 * - eligibility: Eligibility events tracked in Matomo
 * - start: Start events (only available from Matomo, not from form_submissions)
 */

import type { DailySnapshot, StatisticsMetric, StatisticsProvider } from './types.js'
import LoggingService from '#services/logging_service'
import MatomoReportingService from '#services/matomo_reporting_service'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export class MatomoProvider implements StatisticsProvider {
  readonly source = 'matomo' as const
  readonly displayName = 'Matomo Analytics'
  readonly availableMetrics: StatisticsMetric[] = ['submit', 'eligibility', 'start']

  private matomoService: MatomoReportingService | null = null
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)

    const url = env.get('MATOMO_URL')
    const token = env.get('MATOMO_TOKEN')
    const siteId = env.get('MATOMO_SITE_ID')

    if (url && token && siteId) {
      this.matomoService = new MatomoReportingService({ url, token, siteId })
    }
    else {
      this.loggingService.logWarning('Matomo provider not available - missing configuration', undefined, {
        hasUrl: !!url,
        hasToken: !!token,
        hasSiteId: !!siteId,
      })
    }
  }

  /**
   * Available only if Matomo is properly configured
   */
  isAvailable = (): boolean => {
    return this.matomoService !== null
  }

  /**
   * Generate snapshot from Matomo API for a specific date
   *
   * Fetches event counts for Submit, Eligibility, and Start actions
   * using the MatomoReportingService.
   *
   * @param date - Date in YYYY-MM-DD format (UTC)
   * @param simulateurSlug - Simulator identifier
   */
  generateSnapshot = async (date: string, simulateurSlug: string): Promise<DailySnapshot> => {
    // Return empty snapshot if Matomo is not configured
    if (!this.matomoService) {
      return this.createEmptySnapshot(date, simulateurSlug)
    }

    const timer = this.loggingService.startTimer('matomo_provider_snapshot', {
      date,
      simulateurSlug,
    })

    try {
      // Fetch from Matomo API for a single day
      const data = await this.matomoService.fetchEventsCount(
        [simulateurSlug],
        () => [{ start: date, end: date }],
      )

      // Extract counts for each action type
      const submitEntry = data.find(d => d.action === 'Submit')
      const eligibilityEntry = data.find(d => d.action === 'Eligibility')
      const startEntry = data.find(d => d.action === 'Start')

      const snapshot: DailySnapshot = {
        date,
        simulateurSlug,
        source: this.source,
        submitCount: submitEntry?.count || 0,
        eligibilityCount: eligibilityEntry?.count || 0,
        startCount: startEntry?.count || 0,
      }

      timer.stopWithMessage('Matomo snapshot generated', {
        submitCount: snapshot.submitCount,
        eligibilityCount: snapshot.eligibilityCount,
        startCount: snapshot.startCount,
      })

      return snapshot
    }
    catch (error) {
      timer.stopWithMessage('Failed to generate Matomo snapshot', {
        error: error instanceof Error ? error.message : String(error),
      })

      // Return empty snapshot on error (graceful degradation)
      return this.createEmptySnapshot(date, simulateurSlug)
    }
  }

  /**
   * Create an empty snapshot with zero counts
   */
  private createEmptySnapshot(date: string, simulateurSlug: string): DailySnapshot {
    return {
      date,
      simulateurSlug,
      source: this.source,
      submitCount: 0,
      eligibilityCount: 0,
      startCount: 0,
    }
  }
}
