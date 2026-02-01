/**
 * Statistics Provider Types
 *
 * This module defines the interfaces and types for the statistics provider system.
 * It implements the Strategy Pattern to allow multiple data sources to be used
 * interchangeably for generating statistics snapshots.
 */

/**
 * Supported data sources for statistics
 */
export type StatisticsSource = 'form_submissions' | 'matomo'

/**
 * Supported metrics that can be tracked
 */
export type StatisticsMetric = 'submit' | 'eligibility' | 'start'

/**
 * Metric configuration with metadata for display
 */
export interface MetricConfig {
  key: StatisticsMetric
  label: string
  description: string
}

/**
 * Raw snapshot data for a single day from a provider
 */
export interface DailySnapshot {
  date: string // YYYY-MM-DD
  simulateurSlug: string
  source: StatisticsSource
  submitCount: number
  eligibilityCount: number
  startCount: number
}

/**
 * Result of a batch snapshot generation
 */
export interface SnapshotGenerationResult {
  source: StatisticsSource
  date: string
  simulateurSlug: string
  success: boolean
  error?: string
}

/**
 * Strategy interface for statistics data providers
 *
 * Implements Strategy Pattern for extensible data sources.
 * Each provider encapsulates the logic for fetching statistics
 * from a specific data source (database, external API, etc.)
 *
 * @example
 * ```typescript
 * class MyNewProvider implements StatisticsProvider {
 *   readonly source = 'my_source' as StatisticsSource
 *   readonly displayName = 'My Source'
 *   readonly availableMetrics = ['submit', 'eligibility']
 *
 *   isAvailable() { return true }
 *   async generateSnapshot(date, slug) { ... }
 * }
 * ```
 */
export interface StatisticsProvider {
  /**
   * Unique identifier for this data source.
   * Used as the `source` field in statistics_snapshots table.
   */
  readonly source: StatisticsSource

  /**
   * Human-readable name for display in UI
   */
  readonly displayName: string

  /**
   * Metrics available from this provider.
   * Used to indicate which metrics can be fetched.
   */
  readonly availableMetrics: StatisticsMetric[]

  /**
   * Check if this provider is currently available/configured.
   * A provider might be unavailable if:
   * - Required environment variables are missing
   * - External service is not configured
   * - Feature flag is disabled
   */
  isAvailable: () => boolean

  /**
   * Generate snapshot for a specific date and simulator.
   *
   * @param date - Date in YYYY-MM-DD format (UTC)
   * @param simulateurSlug - Simulator identifier
   * @returns Daily snapshot data with counts for each metric
   */
  generateSnapshot: (date: string, simulateurSlug: string) => Promise<DailySnapshot>
}

/**
 * Provider metadata for API responses
 */
export interface ProviderInfo {
  source: StatisticsSource
  displayName: string
  availableMetrics: StatisticsMetric[]
  isAvailable: boolean
}

/**
 * Map of metrics available from each source
 */
export type MetricsBySource = Record<StatisticsSource, StatisticsMetric[]>
