<script lang="ts" setup>
import { DsfrAccordion, DsfrAccordionsGroup, DsfrCard } from '@gouvminint/vue-dsfr'
import { Head } from '@inertiajs/vue3'
import { onMounted, ref } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
// State for statistics
const statistics = ref<{
  statistics: Record<
    string,
    {
      title: string
      starts: number
      completions: number
      eligibilities: number
      weeklyStats: Array<{
        week: string
        completions: number
        eligibilities: number
      }>
      integrators: string[]
    }
  >
  satisfaction: {
    yes: number
    partial: number
    no: number
  }
}>()

// Hardcoded integrators with their logos
const integrators: Record<string, Array<{ name: string, url?: string, logo: string, description: string }>> = {
  'demenagement-logement': [
    {
      name: 'Mon Logement Etudiant',
      url: 'https://monlogementetudiant.beta.gouv.fr/',
      logo: '/logos/logo-mon-logement-etudiant.png',
      description: 'Site d\'information sur les aides au logement pour les étudiants boursiers',
    },
    {
      name: 'service-public.fr',
      url: 'https://www.service-public.fr/',
      logo: '/logos/logo-service-public.png',
      description: 'Portail officiel des démarches et services de l\'Administration française',
    },
  ],
  'entreprise-innovation': [
    {
      name: 'entreprendre.service-public.fr',
      url: 'https://entreprendre.service-public.fr/',
      logo: '/logos/logo-service-public.png',
      description: 'Portail officiel des démarches et services de l\'Administration française',
    },
  ],
}

// Loading state
const isLoading = ref(true)

// Fetch statistics from the API
async function fetchStatistics() {
  try {
    const response = await fetch('/api/statistics')
    statistics.value = await response.json()
  }
  catch (error) {
    console.error('Error fetching statistics:', error)
  }
  finally {
    isLoading.value = false
  }
}

const activeAccordion = ref<number>()

// Add computed property for chart data
function getChartData(stats: any) {
  if (!stats?.weeklyStats) {
    return { x: '[[]]', y: '[[]]', name: '[""]' }
  }

  const weeks = stats.weeklyStats.map((stat: { week: string }) => stat.week)
  const completions = stats.weeklyStats.map((stat: { completions: number }) => stat.completions)
  const eligibilities = stats.weeklyStats.map(
    (stat: { eligibilities: number }) => stat.eligibilities,
  )
  const names = ['Simulations terminées', 'Avec éligibilité']

  // Format as array literals in strings
  return {
    x: `[["${weeks.join('","')}"]]`,
    y: `[[${completions.join(',')}],[${eligibilities.join(',')}]]`,
    name: `["${names.join('","')}"]`,
  }
}

// Add function to get chart attributes for a specific simulator
function getChartAttributesForSimulator(simulatorId: string) {
  if (!statistics.value?.statistics?.[simulatorId]) {
    return {}
  }

  const stats = statistics.value.statistics[simulatorId]
  const data = getChartData(stats)

  return {
    'x': data.x,
    'y': data.y,
    'name': data.name,
    'databox-source': 'statistiques',
    'selected-palette': 'categorical',
    'unit-tooltip': 'simulations',
    'aspect-ratio': '2',
  }
}

const isClient = ref(false)
onMounted(async () => {
  isClient.value = true
  import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.js') as any
  import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.css')
  fetchStatistics()
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Statistiques', to: '/statistiques' },
])
</script>

<template>
  <Head
    title="Statistiques des simulateurs"
    description="Consultez les statistiques d'utilisation des simulateurs d'aides"
  />
  <BrandBackgroundContainer
    textured
    contrast
  >
    <BreadcrumbSectionContainer contrast />
    <SectionContainer type="page-header">
      <h1 class="brand-contrast-text">
        Statistiques des simulateurs
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <div v-if="isLoading">
        <LoadingSpinner />
      </div>
      <div v-else>
        <p class="fr-text--lg fr-mb-3w">
          Veuillez cliquer ci-dessous pour choisir votre simulateur et consulter ses statistiques
          d'utilisation.
        </p>
        <DsfrAccordionsGroup v-model="activeAccordion">
          <DsfrAccordion
            v-for="(stats, simulatorId) in statistics?.statistics"
            :key="simulatorId"
            :title="stats.title"
          >
            <div class="fr-grid-row fr-grid-row--gutters">
              <!-- Statistiques sur 30 jours -->
              <div class="fr-col-12">
                <h3>Sur les 4 dernières semaines</h3>
                <div class="fr-grid-row fr-grid-row--gutters">
                  <div class="fr-col-4">
                    <DsfrCard
                      :title-link-attrs="{}"
                      horizontal
                      title="Simulations commencées"
                      :description="String(stats.starts)"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
                      :title-link-attrs="{}"
                      horizontal
                      title="Simulations terminées"
                      :description="String(stats.completions)"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
                      :title-link-attrs="{}"
                      horizontal
                      title="Avec éligibilité"
                      :description="String(stats.eligibilities)"
                      title-tag="h4"
                    />
                  </div>
                </div>
              </div>

              <!-- Graphique sur 6 semaines -->
              <div class="fr-col-12">
                <h3>Évolution hebdomadaire</h3>
                <p class="fr-text--sm fr-mb-2w">
                  <i>Note: Les données sont agrégées par semaine calendaire complète (du lundi au
                    dimanche). Les dates indiquées correspondent au dernier jour de chaque semaine
                    (dimanche). La semaine en cours n'est pas comptabilisée.</i>
                </p>
                <line-chart
                  v-if="isClient"
                  v-bind="getChartAttributesForSimulator(simulatorId)"
                />
              </div>

              <!-- Intégrateurs -->
              <div class="fr-col-12">
                <h3>Intégrateurs</h3>
                <div class="fr-grid-row fr-grid-row--gutters">
                  <div
                    v-for="integrator in integrators[simulatorId]"
                    :key="integrator.name"
                    class="fr-col-12 fr-col-md-4"
                  >
                    <DsfrCard
                      :title-link-attrs="{ target: '_blank', rel: 'noopener noreferrer' }"
                      :title="integrator.name"
                      :description="integrator.description"
                      :img-src="integrator.logo"
                      :link="integrator.url"
                      :img-alt="`Logo de ${integrator.name}`"
                      title-tag="h4"
                    />
                  </div>
                </div>
              </div>

              <!-- Satisfaction -->
              <div
                v-if="false"
                class="fr-col-12"
              >
                <h3>Satisfaction des utilisateurs</h3>
                <div class="fr-grid-row fr-grid-row--gutters">
                  <div class="fr-col-4">
                    <DsfrCard
                      :title-link-attrs="{}"
                      horizontal
                      title="Oui"
                      :description="`${statistics?.satisfaction.yes}%`"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
                      :title-link-attrs="{}"
                      horizontal
                      title="En partie"
                      :description="`${statistics?.satisfaction.partial}%`"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
                      :title-link-attrs="{}"
                      horizontal
                      title="Non"
                      :description="`${statistics?.satisfaction.no}%`"
                      title-tag="h4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DsfrAccordion>
        </DsfrAccordionsGroup>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
:deep(.fr-responsive-img) {
  object-fit: contain;
}
</style>
