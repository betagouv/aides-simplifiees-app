<script lang="ts" setup>
import type StatisticsController from '#controllers/api/statistics_controller'
import { Head } from '@inertiajs/vue3'
import { useAsyncState } from '@vueuse/core'
import * as d3 from 'd3'
import { computed, nextTick, onMounted, watch } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { frLocale } from '~/utils/date_time'

onMounted(async () => {
  // Import DSFR Chart components
  await Promise.all([
    import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.js'),
    import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.css'),
  ])
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Statistiques', to: '/statistiques' },
])

type StatisticsData = Awaited<ReturnType<StatisticsController['getStatistics']>>
type TidyDataEntry = Exclude<StatisticsData, void>['data'][number]

const { state: statistics, isLoading } = useAsyncState<StatisticsData>(
  async () => {
    const response = await fetch('/api/statistics')
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`)
    }
    return response.json()
  },
  {} as StatisticsData,
  {
    resetOnExecute: false,
  },
)

// Helper function to get simulator title
function getSimulatorTitle(simulateurSlug: string): string {
  if (simulateurSlug === 'total') {
    return 'Tous les simulateurs'
  }
  return statistics.value?.simulatorTitles?.[simulateurSlug] || simulateurSlug
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

function formatAction(action: string): string {
  return {
    Start: 'Simulation commencée',
    Submit: 'Simulation terminée',
    Eligibility: 'Avec éligibilité',
    IntermediaryResults: 'Éligibilité intermédiaires',
  }[action] || action
}

interface ChartData { z: string, points: { x: string, y: number }[] }

const groupedData = computed<null | Array<{ simulateurSlug: string, data: ChartData[] }>>(() => {
  if (!statistics.value?.data) {
    return null
  }
  const getSimulateur = (d: TidyDataEntry) => d.simulateurSlug
  const getAction = (d: TidyDataEntry) => d.action
  const sortPoints = (points: { x: string, y: number }[]) => {
    return points.sort((a, b) => d3.ascending(a.x, b.x))
  }
  const getLineObject = ([z, points]: [string, { x: string, y: number }[]]) => ({ z, points: sortPoints(points) })
  const getPointObject = (d: TidyDataEntry) => ({ x: d.periodKey, y: d.count })
  const getPointObjectReducer = (values: TidyDataEntry[]) => values.map(getPointObject)
  const getDataReducer = (values: TidyDataEntry[]) => {
    return d3
      .flatRollup(values, getPointObjectReducer, getAction)
      .map(getLineObject)
  }

  const getSimulateurStatsObject = ([simulateurSlug, data]: [string, ChartData[]]) => ({ simulateurSlug, data })

  const data = d3
    .flatRollup(statistics.value.data, getDataReducer, getSimulateur)
    .map(getSimulateurStatsObject)

  const sumPoints = (points: { x: string, y: number }[]) => {
    return d3
      .flatRollup(points, values => d3.sum(values, d => d.y), d => d.x)
      .map(([x, y]) => ({ x, y }))
  }

  const totalData: {
    simulateurSlug: string
    data: ChartData[]
  } = {
    simulateurSlug: 'total',
    data: d3
      .flatRollup(statistics.value.data, getPointObjectReducer, getAction)
      .map(([z, points]) => ({ z, points: sortPoints(sumPoints(points)) })),
  }
  data.unshift(totalData)
  return data
})

function formatPeriod(
  periodKey: string, // YYYY-MM-DD,YYYY-MM-DD format
  longFormat: boolean = false,
): string {
  const [start, end] = periodKey.split(',')
  const startDate = d3.timeParse('%Y-%m-%d')(start)
  const endDate = d3.timeParse('%Y-%m-%d')(end)

  if (!startDate || !endDate) {
    return periodKey // Return original if parsing fails
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

    return {
      x: JSON.stringify(validData.map(d => d.points.map(point => formatPeriod(point.x)))),
      y: JSON.stringify(validData.map(d => d.points.map(point => point.y))),
      name: JSON.stringify(validData.map(d => formatAction(d.z))),
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
      name: JSON.stringify(validData.map(d => formatAction(d.z))),
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
    <SectionContainer type="page-header">
      <h1>
        Statistiques des simulateurs
      </h1>
    </SectionContainer>
    <SectionContainer type="page-footer">
      <div v-if="isLoading">
        <LoadingSpinner />
      </div>
      <div v-else-if="!groupedData || groupedData.length === 0">
        <div class="fr-alert fr-alert--info">
          <p>Aucune donnée statistique n'est disponible pour le moment.</p>
        </div>
      </div>
      <div v-else>
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12 fr-col-md-8 fr-col-offset-md-2 brand-table-chart">
            <data-box
              id="statistiques"
              title="Simulations commencées, terminées et avec éligibilité"
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
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
.brand-table-chart {

  &:deep(.databox__footer p) {
    visibility: hidden; // Hide the footer text
  }

  &:deep(.fr-btn--tooltip) {
    display: none; // Hide the tooltip button
  }
}
</style>
