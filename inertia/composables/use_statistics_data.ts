/**
 * useStatisticsData Composable
 *
 * Manages statistics data transformation using D3.js for efficient
 * data grouping, aggregation, and chart preparation.
 *
 * Features:
 * - Multi-source data support (form_submissions, matomo)
 * - Series visibility toggling
 * - D3-based data transformations
 * - Computed chart-ready data
 */

import type { ComputedRef, Ref } from 'vue'
import * as d3 from 'd3'
import { computed, ref, watch } from 'vue'

/**
 * Available data sources
 */
export type StatisticsSource = 'form_submissions' | 'matomo'

/**
 * Available metrics
 */
export type StatisticsMetric = 'submit' | 'eligibility' | 'start'

/**
 * Series configuration for chart display
 */
export interface SeriesConfig {
  /** Unique identifier: 'form_submissions:submit' */
  id: string
  /** Data source */
  source: StatisticsSource
  /** Metric type */
  metric: StatisticsMetric
  /** Display label */
  label: string
  /** Source display name */
  sourceLabel: string
}

/**
 * Chart-ready data point
 */
export interface ChartPoint {
  /** Period key (date range) */
  x: string
  /** Metric value */
  y: number
}

/**
 * Chart series with points
 */
export interface ChartSeries {
  id: string
  name: string
  points: ChartPoint[]
}

/**
 * Raw data entry from API
 */
export interface StatisticsDataEntry {
  simulateurSlug: string
  periodKey: string
  source: StatisticsSource
  metrics: {
    submit: number
    eligibility: number
    start: number | null
  }
}

/**
 * Provider info from API
 */
export interface ProviderInfo {
  source: StatisticsSource
  displayName: string
  isAvailable: boolean
}

/**
 * Metrics by source mapping
 */
export type MetricsBySource = Record<StatisticsSource, StatisticsMetric[]>

/**
 * Labels for metrics
 */
const METRIC_LABELS: Record<StatisticsMetric, string> = {
  submit: 'Terminées',
  eligibility: 'Éligibles',
  start: 'Commencées',
}

/**
 * Labels for sources
 */
const SOURCE_LABELS: Record<StatisticsSource, string> = {
  form_submissions: 'BDD',
  matomo: 'Matomo',
}

/**
 * Composable for managing statistics data with D3 transformations
 */
export function useStatisticsData(
  rawData: Ref<StatisticsDataEntry[]>,
  metricsBySource: Ref<MetricsBySource>,
  providers: Ref<ProviderInfo[]>,
) {
  // Series visibility state - tracks which series are visible by ID
  const visibleSeries = ref<Set<string>>(new Set())

  /**
   * Available series configurations derived from metricsBySource
   */
  const availableSeries: ComputedRef<SeriesConfig[]> = computed(() => {
    const series: SeriesConfig[] = []

    for (const provider of providers.value) {
      if (!provider.isAvailable)
        continue

      const metrics = metricsBySource.value[provider.source] || []
      for (const metric of metrics) {
        series.push({
          id: `${provider.source}:${metric}`,
          source: provider.source,
          metric,
          label: METRIC_LABELS[metric],
          sourceLabel: SOURCE_LABELS[provider.source],
        })
      }
    }

    return series
  })

  /**
   * Initialize visibility for all available series
   */
  function initializeVisibility() {
    const newSet = new Set<string>()
    for (const series of availableSeries.value) {
      newSet.add(series.id)
    }
    visibleSeries.value = newSet
  }

  /**
   * Toggle series visibility
   */
  function toggleSeries(seriesId: string) {
    const newSet = new Set(visibleSeries.value)
    if (newSet.has(seriesId)) {
      newSet.delete(seriesId)
    }
    else {
      newSet.add(seriesId)
    }
    visibleSeries.value = newSet
  }

  /**
   * Set visibility for a specific series
   */
  function setSeriesVisibility(seriesId: string, visible: boolean) {
    const newSet = new Set(visibleSeries.value)
    if (visible) {
      newSet.add(seriesId)
    }
    else {
      newSet.delete(seriesId)
    }
    visibleSeries.value = newSet
  }

  /**
   * Show all series
   */
  function showAllSeries() {
    initializeVisibility()
  }

  /**
   * Hide all series
   */
  function hideAllSeries() {
    visibleSeries.value = new Set()
  }

  /**
   * Build chart series for a specific simulator using D3
   */
  function buildSeriesForSimulator(simulatorSlug: string | null): ChartSeries[] {
    if (!rawData.value?.length)
      return []

    // Filter by simulator if specified
    const filtered = simulatorSlug
      ? rawData.value.filter(d => d.simulateurSlug === simulatorSlug)
      : rawData.value

    // Group by period and source using D3
    const byPeriodSource = d3.rollup(
      filtered,
      (entries) => {
        // Aggregate metrics for this period/source combination
        return {
          submit: d3.sum(entries, e => e.metrics.submit),
          eligibility: d3.sum(entries, e => e.metrics.eligibility),
          start: d3.sum(entries, e => e.metrics.start || 0),
        }
      },
      d => d.periodKey,
      d => d.source,
    )

    // Build series for each visible configuration
    return availableSeries.value
      .filter(config => visibleSeries.value.has(config.id))
      .map((config) => {
        const points: ChartPoint[] = []

        for (const [periodKey, sourceMap] of byPeriodSource) {
          const metrics = sourceMap.get(config.source)
          if (metrics) {
            const value = config.metric === 'submit'
              ? metrics.submit
              : config.metric === 'eligibility'
                ? metrics.eligibility
                : metrics.start

            points.push({ x: periodKey, y: value })
          }
        }

        // Sort by date using D3
        points.sort((a, b) => d3.ascending(a.x, b.x))

        // Build series name with source suffix if multiple sources
        const hasMultipleSources = providers.value.filter(p => p.isAvailable).length > 1
        const name = hasMultipleSources
          ? `${config.label} (${config.sourceLabel})`
          : config.label

        return {
          id: config.id,
          name,
          points,
        }
      })
      .filter(series => series.points.some(p => p.y > 0))
  }

  /**
   * Total statistics aggregated across all simulators
   */
  const totalSeries: ComputedRef<ChartSeries[]> = computed(() => {
    return buildSeriesForSimulator(null)
  })

  /**
   * Get unique simulator slugs from data
   */
  const simulatorSlugs: ComputedRef<string[]> = computed(() => {
    if (!rawData.value?.length)
      return []
    return [...new Set(rawData.value.map(d => d.simulateurSlug))].sort()
  })

  /**
   * Get chart series grouped by simulator
   */
  const seriesBySimulator: ComputedRef<Map<string, ChartSeries[]>> = computed(() => {
    const result = new Map<string, ChartSeries[]>()

    for (const slug of simulatorSlugs.value) {
      const series = buildSeriesForSimulator(slug)
      if (series.length > 0) {
        result.set(slug, series)
      }
    }

    return result
  })

  /**
   * Get series for a specific simulator
   */
  function getSeriesForSimulator(slug: string): ChartSeries[] {
    return seriesBySimulator.value.get(slug) || []
  }

  // Auto-initialize visibility when available series change
  watch(availableSeries, () => {
    if (visibleSeries.value.size === 0 && availableSeries.value.length > 0) {
      initializeVisibility()
    }
  }, { immediate: true })

  return {
    // State
    visibleSeries,
    availableSeries,

    // Computed
    totalSeries,
    simulatorSlugs,
    seriesBySimulator,

    // Methods
    toggleSeries,
    setSeriesVisibility,
    showAllSeries,
    hideAllSeries,
    initializeVisibility,
    getSeriesForSimulator,
  }
}
