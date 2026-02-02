/* eslint-disable perfectionist/sort-imports */
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import type { TimePeriod } from '#services/matomo_reporting_service'
import MatomoReportingService from '#services/matomo_reporting_service'
import FormSubmissionStatisticsService from '#services/form_submission_statistics_service'
import StatisticsSnapshotService from '#services/statistics_snapshot_service'
import type { Granularity } from '#services/statistics_snapshot_service'
import LoggingService from '#services/logging_service'
import Simulateur from '#models/simulateur'
import env from '#start/env'
import { DateTime } from 'luxon'

/**
 * Get the specified number of past weeks (Monday to Sunday) which are already over
 */
function getPastWeekPeriods(numberOfWeeks = 4): TimePeriod[] {
  const periods = []
  const lastSunday = new Date()
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay()) // Set to last Sunday
  lastSunday.setHours(0, 0, 0, 0) // Normalize to start of day
  for (let i = 1; i <= numberOfWeeks; i++) {
    const weekEnd = new Date(lastSunday)
    weekEnd.setDate(lastSunday.getDate() - ((i - 1) * 7))
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6) // Start on the previous Monday

    periods.push({
      start: weekStart.toISOString().split('T')[0], // Format as YYYY-MM-DD
      end: weekEnd.toISOString().split('T')[0],
    })
  }
  return periods
}

/**
 * Calculate default date range based on granularity
 */
function getDefaultDateRange(granularity: Granularity): { startDate: string, endDate: string } {
  const now = DateTime.now().setZone('utc')
  const yesterday = now.minus({ days: 1 })

  switch (granularity) {
    case 'day':
      // Last 30 days
      return {
        startDate: yesterday.minus({ days: 29 }).toISODate()!,
        endDate: yesterday.toISODate()!,
      }
    case 'week':
      // Last 8 weeks
      return {
        startDate: yesterday.minus({ weeks: 8 }).startOf('week').toISODate()!,
        endDate: yesterday.toISODate()!,
      }
    case 'month':
      // Last 12 months
      return {
        startDate: yesterday.minus({ months: 12 }).startOf('month').toISODate()!,
        endDate: yesterday.toISODate()!,
      }
    case 'year':
      // Last 3 years
      return {
        startDate: yesterday.minus({ years: 3 }).startOf('year').toISODate()!,
        endDate: yesterday.toISODate()!,
      }
  }
}

export default class StatisticsController {
  private loggingService: LoggingService
  private formSubmissionService: FormSubmissionStatisticsService
  private snapshotService: StatisticsSnapshotService
  private matomoService: MatomoReportingService | null = null

  private url = env.get('MATOMO_URL')
  private token = env.get('MATOMO_TOKEN')
  private siteId = env.get('MATOMO_SITE_ID')

  constructor() {
    this.loggingService = new LoggingService(logger)
    this.formSubmissionService = new FormSubmissionStatisticsService()
    this.snapshotService = new StatisticsSnapshotService()

    // Matomo service is optional - only initialize if configured
    if (this?.url && this?.token && this?.siteId) {
      this.matomoService = new MatomoReportingService({
        url: this.url,
        token: this.token,
        siteId: this.siteId,
      })
    }
    else {
      this.loggingService.logWarning('Matomo not configured, using form_submissions only', undefined, {
        context: 'statistics_controller_init',
        url: !!this.url,
        token: !!this.token,
        siteId: !!this.siteId,
      })
    }
  }

  /**
   * Get statistics from snapshots with flexible granularity and date range
   *
   * Query params:
   * - granularity: 'day' | 'week' | 'month' | 'year' (default: 'week')
   * - startDate: YYYY-MM-DD (optional, defaults based on granularity)
   * - endDate: YYYY-MM-DD (optional, defaults to yesterday)
   * - simulateur: simulator slug filter (optional)
   * - sources: comma-separated list of sources (form_submissions,matomo). Defaults to all available.
   */
  public async getStatistics({ request, response }: HttpContext) {
    const timer = this.loggingService.startTimer('statistics_fetch')

    try {
      // Parse query parameters
      const granularity = request.input('granularity', 'week') as Granularity
      const validGranularities: Granularity[] = ['day', 'week', 'month', 'year']
      if (!validGranularities.includes(granularity)) {
        return response.status(400).json({
          error: 'Invalid granularity',
          validValues: validGranularities,
        })
      }

      const defaultRange = getDefaultDateRange(granularity)
      const startDate = request.input('startDate', defaultRange.startDate)
      const endDate = request.input('endDate', defaultRange.endDate)
      const simulateurSlug = request.input('simulateur')

      // Parse sources parameter
      const sourcesParam = request.input('sources')
      const availableSources = this.snapshotService.getAvailableSources()
      let requestedSources: typeof availableSources | undefined

      if (sourcesParam) {
        const parsedSources = sourcesParam.split(',').map((s: string) => s.trim())
        const invalidSources = parsedSources.filter((s: string) => !['form_submissions', 'matomo'].includes(s))
        if (invalidSources.length > 0) {
          return response.status(400).json({
            error: 'Invalid sources',
            invalidSources,
            validValues: ['form_submissions', 'matomo'],
          })
        }
        requestedSources = parsedSources
      }

      // Get published simulators and their titles
      const publishedSimulators = await Simulateur.query()
        .where('status', 'published')
        .select('slug', 'title')

      const simulatorTitles = publishedSimulators.reduce((acc, simulator) => {
        acc[simulator.slug] = simulator.title
        return acc
      }, {} as Record<string, string>)

      // Check if we have snapshots
      const summary = await this.snapshotService.getSummary()
      const hasSnapshots = summary.totalSnapshots > 0

      let data
      let sources: string[]

      if (hasSnapshots) {
        // Use pre-aggregated snapshots with multi-source support
        // Filter to only published simulators unless a specific one is requested
        const publishedSlugs = publishedSimulators.map(s => s.slug)
        const aggregated = await this.snapshotService.getAggregatedStats({
          granularity,
          startDate,
          endDate,
          simulateurSlug,
          simulateurSlugs: simulateurSlug ? undefined : publishedSlugs,
          sources: requestedSources,
        })

        // Transform to match expected format, now including source in each entry
        data = aggregated.map(entry => ({
          simulateurSlug: entry.simulateurSlug,
          periodKey: `${entry.periodStart},${entry.periodEnd}`,
          source: entry.source,
          metrics: {
            submit: entry.submitCount,
            eligibility: entry.eligibilityCount,
            start: entry.startCount || null,
          },
        }))

        // Get unique sources in the data
        sources = [...new Set(aggregated.map(e => e.source))]
      }
      else {
        // Fallback to real-time form_submissions query
        const allowedSimulatorIds = simulateurSlug
          ? [simulateurSlug]
          : publishedSimulators.map(s => s.slug)

        const rawData = await this.formSubmissionService.fetchEventsCount(
          allowedSimulatorIds,
          () => getPastWeekPeriods(8),
        )

        // Transform to new format
        const groupedData: Record<string, { submit: number, eligibility: number }> = {}
        for (const entry of rawData) {
          const key = `${entry.simulateurSlug}|${entry.periodKey}`
          if (!groupedData[key]) {
            groupedData[key] = { submit: 0, eligibility: 0 }
          }
          if (entry.action === 'Submit') {
            groupedData[key].submit = entry.count
          }
          else if (entry.action === 'Eligibility') {
            groupedData[key].eligibility = entry.count
          }
        }

        data = Object.entries(groupedData).map(([key, metrics]) => {
          const [slug, periodKey] = key.split('|')
          return {
            simulateurSlug: slug,
            periodKey,
            source: 'form_submissions',
            metrics: {
              submit: metrics.submit,
              eligibility: metrics.eligibility,
              start: null,
            },
          }
        })
        sources = ['form_submissions']
      }

      // Get available metrics by source
      const metricsBySource = this.snapshotService.getMetricsBySource()
      const providers = this.snapshotService.getAllProviders()

      this.loggingService.logBusinessEvent('statistics_fetched', {
        simulatorCount: publishedSimulators.length,
        sources,
        granularity,
        startDate,
        endDate,
        duration: timer.stop(),
      })

      response.header('Content-Type', 'application/json')
      return {
        data,
        simulatorTitles,
        meta: {
          sources,
          availableSources,
          granularity,
          startDate,
          endDate,
          metricsBySource,
          providers: providers.map(p => ({
            source: p.source,
            displayName: p.displayName,
            isAvailable: p.isAvailable,
          })),
          snapshotSummary: hasSnapshots ? summary : null,
        },
      }
    }
    catch (error: any) {
      this.loggingService.logError(error, undefined, {
        context: 'statistics_fetch',
        duration: timer.stop(),
      })

      return response.status(500).json({
        error: 'Failed to fetch statistics',
        details: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get legacy format statistics (for backward compatibility)
   * Uses the old TidyDataEntry format
   */
  public async getStatisticsLegacy({ response }: HttpContext) {
    const timer = this.loggingService.startTimer('statistics_fetch_legacy')

    try {
      const publishedSimulators = await Simulateur.query()
        .where('status', 'published')
        .select('slug', 'title')

      const simulatorTitles = publishedSimulators.reduce((acc, simulator) => {
        acc[simulator.slug] = simulator.title
        return acc
      }, {} as Record<string, string>)

      const allowedSimulatorIds = publishedSimulators.map(s => s.slug)
      const data = await this.formSubmissionService.fetchEventsCount(
        allowedSimulatorIds,
        () => getPastWeekPeriods(8),
      )

      this.loggingService.logBusinessEvent('statistics_fetched_legacy', {
        simulatorCount: publishedSimulators.length,
        duration: timer.stop(),
      })

      response.header('Content-Type', 'application/json')
      return {
        data,
        simulatorTitles,
        source: 'form_submissions',
      }
    }
    catch (error: any) {
      this.loggingService.logError(error, undefined, {
        context: 'statistics_fetch_legacy',
        duration: timer.stop(),
      })

      return response.status(500).json({
        error: 'Failed to fetch statistics',
        details: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Compare statistics from Matomo vs form_submissions
   * Useful for validating data consistency and identifying gaps
   */
  public async compareStatistics({ response }: HttpContext) {
    const timer = this.loggingService.startTimer('statistics_comparison')

    try {
      const publishedSimulators = await Simulateur.query()
        .where('status', 'published')
        .select('slug', 'title')

      const simulatorTitles = publishedSimulators.reduce((acc, simulator) => {
        acc[simulator.slug] = simulator.title
        return acc
      }, {} as Record<string, string>)

      const allowedSimulatorIds = publishedSimulators.map(s => s.slug)
      const periods = getPastWeekPeriods(8)

      // Fetch from form_submissions
      const formSubmissionData = await this.formSubmissionService.fetchEventsCount(
        allowedSimulatorIds,
        () => periods,
      )

      // Fetch from Matomo if available
      let matomoData = null
      if (this.matomoService) {
        try {
          matomoData = await this.matomoService.fetchEventsCount(
            allowedSimulatorIds,
            () => periods,
          )
        }
        catch (matomoError: any) {
          this.loggingService.logWarning('Matomo fetch failed during comparison', undefined, {
            error: matomoError.message,
          })
        }
      }

      // Get summary stats from form_submissions
      const summaryStats = await this.formSubmissionService.getSummaryStats()

      this.loggingService.logBusinessEvent('statistics_comparison_completed', {
        simulatorCount: publishedSimulators.length,
        formSubmissionRecords: formSubmissionData.length,
        matomoRecords: matomoData?.length || 0,
        duration: timer.stop(),
      })

      response.header('Content-Type', 'application/json')
      return {
        formSubmissions: {
          data: formSubmissionData,
          summary: summaryStats,
        },
        matomo: matomoData
          ? { data: matomoData, available: true }
          : { data: null, available: false },
        simulatorTitles,
        periods,
        comparison: matomoData
          ? this.buildComparisonTable(formSubmissionData, matomoData, periods, allowedSimulatorIds)
          : null,
      }
    }
    catch (error: any) {
      this.loggingService.logError(error, undefined, {
        context: 'statistics_comparison',
        duration: timer.stop(),
      })

      return response.status(500).json({
        error: 'Failed to compare statistics',
        details: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Build a comparison table between form_submissions and Matomo data
   */
  private buildComparisonTable(
    formData: Array<{ simulateurSlug: string, periodKey: string, action: string, count: number }>,
    matomoData: Array<{ simulateurSlug: string, periodKey: string, action: string, count: number }>,
    periods: TimePeriod[],
    simulateurSlugs: string[],
  ) {
    const comparison: Array<{
      simulateurSlug: string
      periodKey: string
      action: string
      formSubmissions: number
      matomo: number
      difference: number
      percentageDiff: string
    }> = []

    for (const slug of simulateurSlugs) {
      for (const period of periods) {
        const periodKey = `${period.start},${period.end}`

        for (const action of ['Submit', 'Eligibility']) {
          const formEntry = formData.find(
            d => d.simulateurSlug === slug && d.periodKey === periodKey && d.action === action,
          )
          const matomoEntry = matomoData.find(
            d => d.simulateurSlug === slug && d.periodKey === periodKey && d.action === action,
          )

          const formCount = formEntry?.count || 0
          const matomoCount = matomoEntry?.count || 0
          const diff = formCount - matomoCount
          const percentDiff = matomoCount > 0
            ? `${((diff / matomoCount) * 100).toFixed(1)}%`
            : formCount > 0
              ? '+∞'
              : '0%'

          comparison.push({
            simulateurSlug: slug,
            periodKey,
            action,
            formSubmissions: formCount,
            matomo: matomoCount,
            difference: diff,
            percentageDiff: percentDiff,
          })
        }
      }
    }

    return comparison
  }
}
