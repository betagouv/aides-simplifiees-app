import type { StatisticsSource } from '#models/statistics_snapshot'
import type { MetricsBySource, ProviderInfo, StatisticsProvider } from '#services/statistics/types'
import StatisticsSnapshot from '#models/statistics_snapshot'
import LoggingService from '#services/logging_service'
import { FormSubmissionProvider, MatomoProvider } from '#services/statistics/index'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export type Granularity = 'day' | 'week' | 'month' | 'year'

export interface AggregationParams {
  granularity: Granularity
  startDate: string // YYYY-MM-DD (UTC)
  endDate: string // YYYY-MM-DD (UTC)
  simulateurSlug?: string
  source?: StatisticsSource
  sources?: StatisticsSource[] // Support multiple sources
}

export interface AggregatedStatEntry {
  periodStart: string // YYYY-MM-DD
  periodEnd: string // YYYY-MM-DD
  simulateurSlug: string
  source: StatisticsSource
  submitCount: number
  eligibilityCount: number
  startCount: number
}

export interface SnapshotSummary {
  totalSnapshots: number
  dateRange: { oldest: string | null, newest: string | null }
  bySimulateur: Record<string, number>
  bySource: Record<string, number>
}

/**
 * Service for managing statistics snapshots.
 *
 * Uses the Strategy Pattern to support multiple data providers (form_submissions, Matomo, etc.)
 *
 * Handles:
 * - Generating daily snapshots from multiple providers
 * - Aggregating snapshots by different granularities
 * - Backfilling historical data
 */
export default class StatisticsSnapshotService {
  private loggingService: LoggingService
  private providers: StatisticsProvider[]

  constructor() {
    this.loggingService = new LoggingService(logger)

    // Register all providers - they self-determine availability
    this.providers = [
      new FormSubmissionProvider(),
      new MatomoProvider(),
    ]
  }

  /**
   * Get all registered providers (including unavailable ones)
   */
  getAllProviders(): ProviderInfo[] {
    return this.providers.map(p => ({
      source: p.source,
      displayName: p.displayName,
      availableMetrics: p.availableMetrics,
      isAvailable: p.isAvailable(),
    }))
  }

  /**
   * Get all available (configured) providers
   */
  getAvailableProviders(): StatisticsProvider[] {
    return this.providers.filter(p => p.isAvailable())
  }

  /**
   * Get available data sources
   */
  getAvailableSources(): StatisticsSource[] {
    return this.getAvailableProviders().map(p => p.source)
  }

  /**
   * Get metrics available from each AVAILABLE source only
   */
  getMetricsBySource(): MetricsBySource {
    const result: Partial<MetricsBySource> = {}
    for (const provider of this.getAvailableProviders()) {
      result[provider.source] = provider.availableMetrics
    }
    return result as MetricsBySource
  }

  /**
   * Get a specific provider by source
   */
  getProvider(source: StatisticsSource): StatisticsProvider | undefined {
    return this.providers.find(p => p.source === source && p.isAvailable())
  }

  /**
   * Generate daily snapshot using a specific provider
   */
  async generateSnapshotFromProvider(
    provider: StatisticsProvider,
    date: string,
    simulateurSlug: string,
  ): Promise<StatisticsSnapshot> {
    const timer = this.loggingService.startTimer('generate_snapshot_from_provider', {
      source: provider.source,
      date,
      simulateurSlug,
    })

    try {
      const snapshot = await provider.generateSnapshot(date, simulateurSlug)

      // Upsert to database
      const dbSnapshot = await StatisticsSnapshot.updateOrCreate(
        {
          date: new Date(date),
          simulateurSlug,
          source: provider.source as StatisticsSource,
        },
        {
          submitCount: snapshot.submitCount,
          eligibilityCount: snapshot.eligibilityCount,
          startCount: snapshot.startCount,
        },
      )

      timer.stopWithMessage('Snapshot generated from provider', {
        source: provider.source,
        submitCount: snapshot.submitCount,
        eligibilityCount: snapshot.eligibilityCount,
        startCount: snapshot.startCount,
      })

      return dbSnapshot
    }
    catch (error) {
      timer.stopWithMessage('Failed to generate snapshot from provider', {
        source: provider.source,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Generate snapshots from all available providers for a date and simulator
   */
  async generateAllSnapshots(
    date: string,
    simulateurSlug: string,
  ): Promise<StatisticsSnapshot[]> {
    const availableProviders = this.getAvailableProviders()
    const results: StatisticsSnapshot[] = []

    for (const provider of availableProviders) {
      try {
        const snapshot = await this.generateSnapshotFromProvider(provider, date, simulateurSlug)
        results.push(snapshot)
      }
      catch (error) {
        this.loggingService.logError(error instanceof Error ? error : new Error(String(error)), undefined, {
          context: 'generate_all_snapshots',
          source: provider.source,
          date,
          simulateurSlug,
        })
        // Continue with other providers
      }
    }

    return results
  }

  /**
   * Generate a daily snapshot from form_submissions for a specific date and simulator.
   * Uses UPSERT to update existing snapshots.
   *
   * @deprecated Use generateSnapshotFromProvider with FormSubmissionProvider instead
   * @param date - The date to generate snapshot for (YYYY-MM-DD in UTC)
   * @param simulateurSlug - The simulator slug
   */
  async generateDailySnapshot(date: string, simulateurSlug: string): Promise<StatisticsSnapshot> {
    const provider = this.getProvider('form_submissions')
    if (!provider) {
      throw new Error('FormSubmissionProvider not available')
    }
    return this.generateSnapshotFromProvider(provider, date, simulateurSlug)
  }

  /**
   * Backfill snapshots for a date range and all simulators.
   * Now supports multiple sources via the provider pattern.
   *
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param simulateurSlugs - Optional list of simulators (defaults to all with data)
   * @param sources - Optional list of sources to sync (defaults to all available)
   */
  async backfillSnapshots(
    startDate: string,
    endDate: string,
    simulateurSlugs?: string[],
    sources?: StatisticsSource[],
  ): Promise<{ created: number, updated: number, bySource: Record<string, { created: number, updated: number }> }> {
    const timer = this.loggingService.startTimer('backfill_snapshots', {
      startDate,
      endDate,
      sources,
    })

    try {
      // Get all simulateur slugs if not provided
      if (!simulateurSlugs || simulateurSlugs.length === 0) {
        const slugsResult = await db
          .from('form_submissions')
          .distinct('simulateur_slug')
          .whereRaw('simulateur_slug IS NOT NULL')

        simulateurSlugs = slugsResult.map((r: { simulateur_slug: string }) => r.simulateur_slug)
      }

      // Determine which providers to use
      const availableProviders = this.getAvailableProviders()
      const providersToUse = sources
        ? availableProviders.filter(p => sources.includes(p.source))
        : availableProviders

      let created = 0
      let updated = 0
      const bySource: Record<string, { created: number, updated: number }> = {}

      // Initialize bySource counters
      for (const provider of providersToUse) {
        bySource[provider.source] = { created: 0, updated: 0 }
      }

      // Generate dates between start and end
      const start = DateTime.fromISO(startDate, { zone: 'utc' })
      const end = DateTime.fromISO(endDate, { zone: 'utc' })

      for (let current = start; current <= end; current = current.plus({ days: 1 })) {
        const dateStr = current.toISODate()!

        for (const slug of simulateurSlugs) {
          for (const provider of providersToUse) {
            // Check if snapshot exists
            const existing = await StatisticsSnapshot.query()
              .where('date', dateStr)
              .where('simulateurSlug', slug)
              .where('source', provider.source)
              .first()

            try {
              await this.generateSnapshotFromProvider(provider, dateStr, slug)

              if (existing) {
                updated++
                bySource[provider.source].updated++
              }
              else {
                created++
                bySource[provider.source].created++
              }
            }
            catch (error) {
              this.loggingService.logWarning('Failed to generate snapshot during backfill', undefined, {
                source: provider.source,
                date: dateStr,
                simulateurSlug: slug,
                error: error instanceof Error ? error.message : String(error),
              })
              // Continue with next
            }
          }
        }
      }

      timer.stopWithMessage('Backfill completed', {
        created,
        updated,
        days: end.diff(start, 'days').days + 1,
        simulateurs: simulateurSlugs.length,
        sources: providersToUse.map(p => p.source),
        bySource,
      })

      return { created, updated, bySource }
    }
    catch (error) {
      timer.stopWithMessage('Backfill failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Get aggregated statistics by granularity.
   * Supports filtering by single source or multiple sources.
   *
   * @param params - Aggregation parameters
   */
  async getAggregatedStats(params: AggregationParams): Promise<AggregatedStatEntry[]> {
    const timer = this.loggingService.startTimer('get_aggregated_stats', params)

    try {
      const { granularity, startDate, endDate, simulateurSlug, source, sources } = params

      // Build the date truncation based on granularity
      const truncFn = this.getDateTruncFunction(granularity)
      const periodEndFn = this.getPeriodEndFunction(granularity)

      let query = db
        .from('statistics_snapshots')
        .select(
          db.raw(`${truncFn} as period_start`),
          db.raw(`${periodEndFn} as period_end`),
          'simulateur_slug',
          'source',
          db.raw('SUM(submit_count)::integer as submit_count'),
          db.raw('SUM(eligibility_count)::integer as eligibility_count'),
          db.raw('SUM(start_count)::integer as start_count'),
        )
        .whereBetween('date', [startDate, endDate])
        .groupByRaw(`${truncFn}, ${periodEndFn}, simulateur_slug, source`)
        .orderByRaw(`${truncFn} DESC`)

      if (simulateurSlug) {
        query = query.where('simulateur_slug', simulateurSlug)
      }

      // Support both single source and multiple sources
      if (sources && sources.length > 0) {
        query = query.whereIn('source', sources)
      }
      else if (source) {
        query = query.where('source', source)
      }

      const results = await query

      const aggregated: AggregatedStatEntry[] = results.map((row: any) => ({
        periodStart: this.formatDate(row.period_start),
        periodEnd: this.formatDate(row.period_end),
        simulateurSlug: row.simulateur_slug,
        source: row.source as StatisticsSource,
        submitCount: row.submit_count,
        eligibilityCount: row.eligibility_count,
        startCount: row.start_count,
      }))

      timer.stopWithMessage('Aggregation completed', {
        resultsCount: aggregated.length,
      })

      return aggregated
    }
    catch (error) {
      timer.stopWithMessage('Aggregation failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Get summary of available snapshots
   */
  async getSummary(): Promise<SnapshotSummary> {
    const timer = this.loggingService.startTimer('get_snapshot_summary')

    try {
      const totalResult = await db
        .from('statistics_snapshots')
        .count('* as count')
        .first()

      const dateRangeResult = await db
        .from('statistics_snapshots')
        .select(db.raw('MIN(date) as oldest, MAX(date) as newest'))
        .first()

      const bySimResult = await db
        .from('statistics_snapshots')
        .select('simulateur_slug')
        .count('* as count')
        .groupBy('simulateur_slug')

      const bySimulateur: Record<string, number> = {}
      for (const row of bySimResult as any[]) {
        bySimulateur[row.simulateur_slug] = Number(row.count)
      }

      const bySourceResult = await db
        .from('statistics_snapshots')
        .select('source')
        .count('* as count')
        .groupBy('source')

      const bySource: Record<string, number> = {}
      for (const row of bySourceResult as any[]) {
        bySource[row.source] = Number(row.count)
      }

      timer.stopWithMessage('Summary fetched')

      return {
        totalSnapshots: Number(totalResult?.count || 0),
        dateRange: {
          oldest: dateRangeResult?.oldest ? this.formatDate(dateRangeResult.oldest) : null,
          newest: dateRangeResult?.newest ? this.formatDate(dateRangeResult.newest) : null,
        },
        bySimulateur,
        bySource,
      }
    }
    catch (error) {
      timer.stopWithMessage('Summary failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Get SQL DATE_TRUNC function based on granularity
   */
  private getDateTruncFunction(granularity: Granularity): string {
    switch (granularity) {
      case 'day':
        return 'date'
      case 'week':
        return 'DATE_TRUNC(\'week\', date)::date'
      case 'month':
        return 'DATE_TRUNC(\'month\', date)::date'
      case 'year':
        return 'DATE_TRUNC(\'year\', date)::date'
    }
  }

  /**
   * Get SQL expression for period end date based on granularity
   */
  private getPeriodEndFunction(granularity: Granularity): string {
    switch (granularity) {
      case 'day':
        return 'date'
      case 'week':
        return '(DATE_TRUNC(\'week\', date) + INTERVAL \'6 days\')::date'
      case 'month':
        return '(DATE_TRUNC(\'month\', date) + INTERVAL \'1 month - 1 day\')::date'
      case 'year':
        return '(DATE_TRUNC(\'year\', date) + INTERVAL \'1 year - 1 day\')::date'
    }
  }

  /**
   * Format a date value to YYYY-MM-DD string
   */
  private formatDate(dateValue: Date | string): string {
    if (typeof dateValue === 'string') {
      // Handle ISO string or date string
      return dateValue.split('T')[0]
    }
    return DateTime.fromJSDate(dateValue).toISODate()!
  }
}
