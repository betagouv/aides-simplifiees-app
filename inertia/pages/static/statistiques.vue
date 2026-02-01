<script lang="ts" setup>
import { DsfrAccordion } from '@gouvminint/vue-dsfr'
import { Head } from '@inertiajs/vue3'
import { useMediaQuery, useUrlSearchParams } from '@vueuse/core'
import * as d3 from 'd3'
import { DateTime } from 'luxon'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import StatsSidebarContent from '~/components/stats/StatsSidebarContent.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { frLocale } from '~/utils/date_time'

// Mobile detection for accordion
const isMobile = useMediaQuery('(max-width: 767px)')
const sidebarExpanded = ref(false)

onMounted(async () => {
  // Import DSFR Chart components
  await Promise.all([
    import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.js'),
    import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.css'),
  ])
  // Initial fetch
  fetchStatistics()
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Statistiques', to: '/statistiques' },
])

type Granularity = 'day' | 'week' | 'month' | 'year'
type StatisticsSource = 'form_submissions' | 'matomo'

interface StatisticsDataEntry {
  simulateurSlug: string
  periodKey: string
  source: StatisticsSource
  metrics: {
    submit: number
    eligibility: number
    start: number | null
  }
}

interface StatisticsMeta {
  source: 'snapshots' | 'form_submissions'
  sources: StatisticsSource[]
  availableSources: StatisticsSource[]
  metricsBySource: Record<StatisticsSource, string[]>
  granularity: Granularity
  startDate: string
  endDate: string
  snapshotSummary: {
    totalSnapshots: number
    dateRange: { earliest: string, latest: string }
  } | null
}

interface StatisticsResponse {
  data: StatisticsDataEntry[]
  simulatorTitles: Record<string, string>
  meta: StatisticsMeta
}

/**
 * Matomo data validity periods
 *
 * Matomo tracking was reliable BEFORE December 18, 2025.
 * Between Dec 18, 2025 and Jan 15, 2026, tracking was misconfigured.
 * After January 15, 2026, tracking was fixed and is reliable again.
 */
const MATOMO_INVALID_START = '2025-12-18'
const MATOMO_VALID_AGAIN_FROM = '2026-01-15'

// State
const statistics = ref<StatisticsResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Granularity selection - persisted in URL params
const urlParams = useUrlSearchParams('history')
const granularity = computed<Granularity>({
  get: () => {
    const param = urlParams.granularity as string
    if (param && ['day', 'week', 'month', 'year'].includes(param)) {
      return param as Granularity
    }
    return 'week'
  },
  set: (value: Granularity) => {
    urlParams.granularity = value
  },
})
const granularityOptions = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
]

// Date navigation - null means use API defaults
const customStartDate = ref<string | null>(null)
const customEndDate = ref<string | null>(null)

// Compute display date range
const displayDateRange = computed(() => {
  if (statistics.value?.meta) {
    const { startDate, endDate } = statistics.value.meta
    const start = d3.timeParse('%Y-%m-%d')(startDate)
    const end = d3.timeParse('%Y-%m-%d')(endDate)
    if (start && end) {
      const format = frLocale.format('%d %B %Y')
      return `${format(start)} - ${format(end)}`
    }
  }
  return null
})

// Minimum loading time for skeleton display (prevents flash)
const MIN_LOADING_TIME_MS = 300

// Fetch statistics from API
async function fetchStatistics() {
  isLoading.value = true
  error.value = null
  const startTime = Date.now()

  try {
    const params = new URLSearchParams()
    params.set('granularity', granularity.value)
    if (customStartDate.value) {
      params.set('startDate', customStartDate.value)
    }
    if (customEndDate.value) {
      params.set('endDate', customEndDate.value)
    }

    const response = await fetch(`/api/statistics?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`)
    }
    statistics.value = await response.json()
  }
  catch (err: any) {
    error.value = err.message
    console.error('Error fetching statistics:', err)
  }
  finally {
    // Ensure minimum loading time for smooth skeleton display
    const elapsed = Date.now() - startTime
    if (elapsed < MIN_LOADING_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME_MS - elapsed))
    }
    isLoading.value = false
  }
}

// Navigate time periods
function navigateTime(direction: 'prev' | 'next') {
  if (!statistics.value?.meta)
    return

  const { startDate, endDate, granularity: gran } = statistics.value.meta
  const start = new Date(startDate)
  const end = new Date(endDate)

  const ranges: Record<Granularity, { days: number }> = {
    day: { days: 30 },
    week: { days: 8 * 7 }, // 8 weeks
    month: { days: 365 }, // ~12 months
    year: { days: 3 * 365 }, // 3 years
  }

  const shift = ranges[gran].days
  const multiplier = direction === 'prev' ? -1 : 1

  start.setDate(start.getDate() + (shift * multiplier))
  end.setDate(end.getDate() + (shift * multiplier))

  // Don't go into the future
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (end > yesterday) {
    customStartDate.value = null
    customEndDate.value = null
  }
  else {
    customStartDate.value = start.toISOString().split('T')[0]
    customEndDate.value = end.toISOString().split('T')[0]
  }

  fetchStatistics()
}

// Reset to default date range
function resetDateRange() {
  customStartDate.value = null
  customEndDate.value = null
  fetchStatistics()
}

// Watch granularity changes to refetch
watch(granularity, () => {
  // Reset date range when changing granularity
  customStartDate.value = null
  customEndDate.value = null
  fetchStatistics()
})

// Helper function to get simulator title
function getSimulatorTitle(simulateurSlug: string): string {
  if (simulateurSlug === 'total') {
    return 'Tous les simulateurs'
  }
  return statistics.value?.simulatorTitles?.[simulateurSlug] || simulateurSlug
}

/**
 * Check if Matomo data is valid for the current date range.
 * Valid if:
 * - Period ends BEFORE the invalid period started (Dec 18, 2025)
 * - OR period starts AFTER the fix was applied (Jan 15, 2026)
 */
function isMatomoDataValidForPeriod(): boolean {
  if (!statistics.value?.meta?.startDate || !statistics.value?.meta?.endDate)
    return false

  const { startDate, endDate } = statistics.value.meta

  // Valid if entirely before the invalid period
  if (endDate < MATOMO_INVALID_START) {
    return true
  }

  // Valid if entirely after the fix
  if (startDate >= MATOMO_VALID_AGAIN_FROM) {
    return true
  }

  // Otherwise, period overlaps with invalid range
  return false
}

/**
 * Update the text content of options in the select element
 * with the titles of the simulators after statistics are loaded.
 */
watch(statistics, (newStatistics) => {
  nextTick(() => {
    if (newStatistics?.data) {
      document.querySelectorAll<HTMLOptionElement>('select#select-statistiques option')
        ?.forEach((option) => {
          const simulateurSlug = option.value
          const title = getSimulatorTitle(simulateurSlug)
          option.textContent = title
        })
    }
  })
}, { immediate: false })

/**
 * Visible series - BDD submit/eligibility always, Matomo start when valid
 */
const visibleSeriesIds = computed(() => {
  const ids = new Set<string>([
    'form_submissions:submit',
    'form_submissions:eligibility',
  ])

  // Add Matomo 'start' if period is valid
  if (isMatomoDataValidForPeriod()) {
    ids.add('matomo:start')
  }

  return ids
})

/**
 * Check if a series is visible
 */
function isSeriesVisible(source: StatisticsSource, metric: string): boolean {
  return visibleSeriesIds.value.has(`${source}:${metric}`)
}

/**
 * Computed key for chart components to force re-render when visibility changes
 * DSFR chart web components don't handle reactive updates well, so we need to
 * completely re-render them when the visible series change
 */
/**
 * Computed key for chart components to force re-render when data changes
 * DSFR chart web components don't handle reactive updates well, so we need to
 * completely re-render them when the data or visible series change
 */
const chartKey = computed(() => {
  const seriesKey = Array.from(visibleSeriesIds.value).sort().join(',')
  const dateKey = `${statistics.value?.meta?.startDate}-${statistics.value?.meta?.endDate}`
  const granKey = statistics.value?.meta?.granularity || ''
  return `${seriesKey}|${dateKey}|${granKey}`
})

interface ChartData { z: string, source: StatisticsSource, points: { x: string, y: number }[] }

/**
 * Generate display key for a chart series (source:metric)
 * This is used to create unique labels for the chart legend
 */
function getSeriesDisplayName(metric: string, _source: StatisticsSource): string {
  return {
    Submit: 'Terminées',
    Eligibility: 'Éligibles',
    Start: 'Commencées',
  }[metric] || metric
}

/**
 * Generate all expected period keys for the current date range and granularity.
 * This is used to fill missing data with zeros.
 */
function generateAllPeriodKeys(): string[] {
  if (!statistics.value?.meta)
    return []

  const { startDate, endDate, granularity: gran } = statistics.value.meta
  const start = DateTime.fromISO(startDate, { zone: 'utc' })
  const end = DateTime.fromISO(endDate, { zone: 'utc' })
  const periods: string[] = []

  let current = start

  switch (gran) {
    case 'day':
      while (current.toMillis() <= end.toMillis()) {
        const dateStr = current.toISODate()!
        periods.push(`${dateStr},${dateStr}`)
        current = current.plus({ days: 1 })
      }
      break
    case 'week':
      // Align to Monday
      current = current.startOf('week')
      while (current.toMillis() <= end.toMillis()) {
        const weekStart = current.toISODate()!
        const weekEnd = current.plus({ days: 6 }).toISODate()!
        periods.push(`${weekStart},${weekEnd}`)
        current = current.plus({ weeks: 1 })
      }
      break
    case 'month':
      // Align to start of month
      current = current.startOf('month')
      while (current.toMillis() <= end.toMillis()) {
        const monthStart = current.toISODate()!
        const monthEnd = current.endOf('month').toISODate()!
        periods.push(`${monthStart},${monthEnd}`)
        current = current.plus({ months: 1 })
      }
      break
    case 'year':
      // Align to start of year
      current = current.startOf('year')
      while (current.toMillis() <= end.toMillis()) {
        const yearStart = current.toISODate()!
        const yearEnd = current.endOf('year').toISODate()!
        periods.push(`${yearStart},${yearEnd}`)
        current = current.plus({ years: 1 })
      }
      break
  }

  return periods
}

/**
 * Fill missing periods with zeros for a given set of points.
 * Ensures continuous data for chart display.
 */
function fillMissingPeriods(
  points: { x: string, y: number }[],
  allPeriods: string[],
): { x: string, y: number }[] {
  const pointMap = new Map(points.map(p => [p.x, p.y]))
  return allPeriods.map(period => ({
    x: period,
    y: pointMap.get(period) ?? 0,
  }))
}

// Transform new API format to chart-compatible format
// Now respects series visibility and handles multi-source data
const groupedData = computed<null | Array<{ simulateurSlug: string, data: ChartData[] }>>(() => {
  if (!statistics.value?.data || statistics.value.data.length === 0) {
    return null
  }

  // Generate all expected periods for the date range
  const allPeriods = generateAllPeriodKeys()

  const sortPoints = (points: { x: string, y: number }[]) => {
    return points.sort((a, b) => d3.ascending(a.x, b.x))
  }

  // Group data by simulator and source
  const bySimulator = d3.group(statistics.value.data, d => d.simulateurSlug)
  const result: Array<{ simulateurSlug: string, data: ChartData[] }> = []

  // Helper to build chart lines for a set of entries
  const buildChartData = (entries: StatisticsDataEntry[]): ChartData[] => {
    const chartData: ChartData[] = []

    // Group by source first, then by period
    const bySource = d3.group(entries, d => d.source)

    for (const [source, sourceEntries] of bySource) {
      const isMatomo = source === 'matomo'

      const byPeriod = d3.rollup(
        sourceEntries,
        es => ({
          submit: d3.sum(es, e => e.metrics.submit),
          eligibility: d3.sum(es, e => e.metrics.eligibility),
          start: d3.sum(es, e => e.metrics.start || 0),
        }),
        d => d.periodKey,
      )

      // Build Submit line if visible
      if (isSeriesVisible(source, 'submit')) {
        let submitPoints = Array.from(byPeriod, ([periodKey, metrics]) => ({
          x: periodKey,
          y: metrics.submit,
        }))

        // Always fill with allPeriods, but use null for Matomo gaps instead of 0
        const filled = fillMissingPeriods(submitPoints, allPeriods)
        if (isMatomo) {
          // Replace zeros with null for Matomo to create gaps in the chart
          submitPoints = filled.map(p => p.y === 0 ? { x: p.x, y: null as any } : p)
        }
        else {
          submitPoints = filled
        }

        chartData.push({
          z: getSeriesDisplayName('Submit', source),
          source,
          points: sortPoints(submitPoints),
        })
      }

      // Build Eligibility line if visible
      if (isSeriesVisible(source, 'eligibility')) {
        let eligibilityPoints = Array.from(byPeriod, ([periodKey, metrics]) => ({
          x: periodKey,
          y: metrics.eligibility,
        }))

        // Always fill with allPeriods, but use null for Matomo gaps instead of 0
        const filled = fillMissingPeriods(eligibilityPoints, allPeriods)
        if (isMatomo) {
          eligibilityPoints = filled.map(p => p.y === 0 ? { x: p.x, y: null as any } : p)
        }
        else {
          eligibilityPoints = filled
        }

        chartData.push({
          z: getSeriesDisplayName('Eligibility', source),
          source,
          points: sortPoints(eligibilityPoints),
        })
      }

      // Build Start line if visible (only matomo has start)
      if (isSeriesVisible(source, 'start')) {
        let startPoints = Array.from(byPeriod, ([periodKey, metrics]) => ({
          x: periodKey,
          y: metrics.start,
        }))

        // Always fill with allPeriods, but use null for Matomo gaps instead of 0
        const filled = fillMissingPeriods(startPoints, allPeriods)
        if (isMatomo) {
          startPoints = filled.map(p => p.y === 0 ? { x: p.x, y: null as any } : p)
        }
        else {
          startPoints = filled
        }

        chartData.push({
          z: getSeriesDisplayName('Start', source),
          source,
          points: sortPoints(startPoints),
        })
      }
    }

    return chartData
  }

  // Add totals first (aggregate all simulators)
  const allEntries = statistics.value.data
  const totalData = buildChartData(allEntries)
  if (totalData.length > 0) {
    result.push({ simulateurSlug: 'total', data: totalData })
  }

  // Add individual simulators
  for (const [simulateurSlug, entries] of bySimulator) {
    const chartData = buildChartData(entries)
    if (chartData.length > 0) {
      result.push({ simulateurSlug, data: chartData })
    }
  }

  return result
})

/**
 * Format an array of period keys for chart tick labels based on granularity.
 * Shows full context (month/year) on first tick and when month/year changes.
 */
function formatPeriodsForTicks(periodKeys: string[]): string[] {
  if (periodKeys.length === 0)
    return []

  const currentGranularity = granularity.value
  const results: string[] = []

  let prevMonth: number | null = null
  let prevYear: number | null = null

  for (let i = 0; i < periodKeys.length; i++) {
    const periodKey = periodKeys[i]
    const [start, end] = periodKey.split(',')
    const startDate = d3.timeParse('%Y-%m-%d')(start)
    const endDate = d3.timeParse('%Y-%m-%d')(end)

    if (!startDate || !endDate) {
      results.push(periodKey)
      continue
    }

    const currentMonth = startDate.getMonth()
    const currentYear = startDate.getFullYear()
    const isFirst = i === 0
    const monthChanged = prevMonth !== null && currentMonth !== prevMonth
    const yearChanged = prevYear !== null && currentYear !== prevYear

    let label: string

    switch (currentGranularity) {
      case 'day': {
        // First tick or year changed: "lun 13 jan 25"
        // Month changed: "lun 13 jan"
        // Otherwise: "lun 13"
        if (isFirst || yearChanged) {
          label = frLocale.format('%a %d %b %y')(startDate)
        }
        else if (monthChanged) {
          label = frLocale.format('%a %d %b')(startDate)
        }
        else {
          label = frLocale.format('%a %d')(startDate)
        }
        break
      }
      case 'week': {
        const startDay = startDate.getDate()
        const endDay = endDate.getDate()
        const month = frLocale.format('%b')(startDate)
        const year = frLocale.format('%y')(startDate)

        // Handle week spanning two months
        const spansTwoMonths = startDate.getMonth() !== endDate.getMonth()

        if (isFirst || yearChanged) {
          // First or year changed: show full info with year
          if (spansTwoMonths) {
            const endMonth = frLocale.format('%b')(endDate)
            label = `${startDay} ${month}-${endDay} ${endMonth} ${year}`
          }
          else {
            label = `${startDay}-${endDay} ${month} ${year}`
          }
        }
        else if (monthChanged) {
          // Month changed: show month
          if (spansTwoMonths) {
            const endMonth = frLocale.format('%b')(endDate)
            label = `${startDay} ${month}-${endDay} ${endMonth}`
          }
          else {
            label = `${startDay}-${endDay} ${month}`
          }
        }
        else {
          // Same month: just dates
          if (spansTwoMonths) {
            const endMonth = frLocale.format('%b')(endDate)
            label = `${startDay}-${endDay} ${endMonth}`
          }
          else {
            label = `${startDay}-${endDay}`
          }
        }
        break
      }
      case 'month': {
        // First or year changed: "jan 25"
        // Otherwise: "jan"
        if (isFirst || yearChanged) {
          label = frLocale.format('%b %y')(startDate)
        }
        else {
          label = frLocale.format('%b')(startDate)
        }
        break
      }
      case 'year': {
        // Always show full year
        label = frLocale.format('%Y')(startDate)
        break
      }
      default:
        label = frLocale.format('%d %b')(startDate)
    }

    results.push(label)
    prevMonth = currentMonth
    prevYear = currentYear
  }

  return results
}

/**
 * Format period for table display (long format)
 */
function formatPeriod(
  periodKey: string,
  longFormat: boolean = false,
): string {
  const [start, end] = periodKey.split(',')
  const startDate = d3.timeParse('%Y-%m-%d')(start)
  const endDate = d3.timeParse('%Y-%m-%d')(end)

  if (!startDate || !endDate) {
    return periodKey
  }

  const formatStr = longFormat ? '%A %d %B %Y' : '%a %d %b %Y'
  const format = frLocale.format(formatStr)
  return longFormat
    ? `du ${format(startDate)} au ${format(endDate)}`
    : `${format(startDate)} - ${format(endDate)}`
}

function getChartData(data: ChartData[]): { x: string, y: string, name: string } {
  try {
    // Check if data is valid
    if (!data || data.length === 0) {
      console.warn('No data available for chart')
      return { x: '[[]]', y: '[[]]', name: '[""]' }
    }

    // Validate each data point has points array
    const validData = data.filter(d => d && d.points && Array.isArray(d.points))
    if (validData.length === 0) {
      console.warn('No valid data points found')
      return { x: '[[]]', y: '[[]]', name: '[""]' }
    }

    // Format x-axis labels with context-aware formatting (month/year shown when needed)
    const formattedX = validData.map((d) => {
      const periodKeys = d.points.map(point => point.x)
      return formatPeriodsForTicks(periodKeys)
    })

    return {
      x: JSON.stringify(formattedX),
      y: JSON.stringify(validData.map(d => d.points.map(point => point.y))),
      name: JSON.stringify(validData.map(d => d.z)), // z is already formatted with getSeriesDisplayName
    }
  }
  catch (error) {
    console.error('Error processing chart data:', error)
    return { x: '[[]]', y: '[[]]', name: '[""]' } // Return empty data in case of error
  }
}

function getTableData(data: ChartData[]): { x: string, y: string, name: string } {
  try {
    // Check if data is empty or if first item doesn't have points
    if (!data || data.length === 0 || !data[0] || !data[0].points || data[0].points.length === 0) {
      console.warn('No data available for table')
      return { x: '[[]]', y: '[[]]', name: '[""]' }
    }

    // Additional validation for all data items
    const validData = data.filter(d => d && d.points && Array.isArray(d.points) && d.points.length > 0)
    if (validData.length === 0) {
      console.warn('No valid data points found for table')
      return { x: '[[]]', y: '[[]]', name: '[""]' }
    }

    return {
      x: JSON.stringify(validData[0].points.map(point => formatPeriod(point.x, true))),
      y: JSON.stringify(validData.map(d => d.points.map(point => point.y))),
      name: JSON.stringify(validData.map(d => d.z)), // z is already formatted with getSeriesDisplayName
    }
  }
  catch (error) {
    console.error('Error processing table data:', error)
    return { x: '[[]]', y: '[[]]', name: '[""]' } // Return empty data in case of error
  }
}
</script>

<template>
  <Head
    title="Statistiques des simulateurs"
    description="Consultez les statistiques d'utilisation des simulateurs d'aides"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-full">
      <h1>
        Statistiques des simulateurs
      </h1>
      <div class="fr-grid-row fr-grid-row--gutters">
        <!-- Sidebar: Controls (1/3 on desktop, accordion on mobile) -->
        <div class="fr-col-12 fr-col-md-4">
          <!-- Mobile: Accordion wrapper -->
          <DsfrAccordion
            v-if="isMobile"
            title="Filtres et options"
            :expanded="sidebarExpanded"
            class="stats-sidebar-accordion"
            @expand="sidebarExpanded = $event"
          >
            <div class="stats-sidebar__content">
              <StatsSidebarContent
                :granularity="granularity"
                :granularity-options="granularityOptions"
                :display-date-range="displayDateRange"
                :is-loading="isLoading"
                :custom-start-date="customStartDate"
                :custom-end-date="customEndDate"
                @update-granularity="granularity = $event"
                @navigate-time="navigateTime"
                @reset-date-range="resetDateRange"
              />
            </div>
          </DsfrAccordion>

          <!-- Desktop: Direct display -->
          <div
            v-else
            class="stats-sidebar"
          >
            <StatsSidebarContent
              :granularity="granularity"
              :granularity-options="granularityOptions"
              :display-date-range="displayDateRange"
              :is-loading="isLoading"
              :custom-start-date="customStartDate"
              :custom-end-date="customEndDate"
              @update-granularity="granularity = $event"
              @navigate-time="navigateTime"
              @reset-date-range="resetDateRange"
            />
          </div>
        </div>
        <!-- Main: Chart area (2/3 on desktop) -->
        <div class="fr-col-12 fr-col-md-8">
          <!-- Chart container with loading overlay -->
          <div class="stats-chart-container">
            <!-- Loading overlay -->
            <div
              v-if="isLoading"
              class="stats-chart-loading-overlay"
            >
              <LoadingSpinner />
            </div>

            <!-- Error state -->
            <template v-if="error">
              <div class="fr-alert fr-alert--error">
                <p>Erreur lors du chargement des statistiques : {{ error }}</p>
              </div>
            </template>

            <!-- Empty state -->
            <template v-else-if="!groupedData || groupedData.length === 0">
              <div class="fr-alert fr-alert--info">
                <p>Aucune donnee statistique n'est disponible pour le moment.</p>
              </div>
            </template>

            <!-- Chart display -->
            <template v-else>
              <!-- key forces full re-render when visible series change (DSFR charts don't handle reactive updates) -->
              <div
                :key="chartKey"
                class="brand-table-chart"
              >
                <data-box
                  id="statistiques"
                  title="Simulations commencees, terminees et avec eligibilite"
                  :source="groupedData?.map(d => d.simulateurSlug).join(', ')"
                  :default-source="groupedData?.map(d => d.simulateurSlug)[0]"
                />
                <template
                  v-for="({ simulateurSlug, data }) in groupedData"
                  :key="simulateurSlug"
                >
                  <scatter-chart
                    :databox-source="simulateurSlug"
                    databox-id="statistiques"
                    databox-type="chart"
                    show-line="true"
                    selected-palette="categorical"
                    unit-tooltip="simulations"
                    v-bind="getChartData(data)"
                  />
                  <table-chart
                    databox-id="statistiques"
                    :databox-source="simulateurSlug"
                    databox-type="table"
                    v-bind="getTableData(data)"
                  />
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
.brand-table-chart {
  &:deep(.databox__footer p) {
    visibility: hidden;
  }

  &:deep(.fr-btn--tooltip) {
    display: none;
  }

  &:deep(#container-statistiques) {
    filter: none !important;
    border: solid 1px var(--border-default-grey);
  }
}

.stats-sidebar {
  position: sticky;
  top: 1rem;
  background-color: var(--background-default-grey);
  border: solid 1px var(--border-default-grey);
  padding: 1rem;
}

.stats-sidebar__content {
  padding: 0.5rem 0;
}

.stats-sidebar-accordion {
  margin-bottom: 1rem;
}

.stats-chart-container {
  position: relative;
  min-height: 600px;
}

.stats-chart-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1;
}
</style>
