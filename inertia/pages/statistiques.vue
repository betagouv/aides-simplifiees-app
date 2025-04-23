<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
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
const integrators = [
  {
    name: 'Mon Logement Etudiant',
    logo: '/integrators/mon-logement-etudiant.png',
    description: 'Site d\'information sur les aides au logement pour les étudiants boursiers',
  },
  {
    name: 'service-public.fr',
    logo: '/integrators/service-public.png',
    description: 'Portail officiel des démarches et services de l\'Administration française',
  },
]

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

// Add computed property for chart attributes
const getChartAttributes = computed(() => {
  if (!statistics.value?.statistics) {
    return {}
  }

  const stats = Object.values(statistics.value.statistics)[0]
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
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Statistiques', to: '/statistiques' },
])

onMounted(() => {
  // In a browser environment, dynamically import the chart library
  if (typeof window !== 'undefined') {
    // Using dynamic import with type any to avoid TypeScript errors
    import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.js') as any
    import('@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.css')
  }

  fetchStatistics()
})
</script>

<template>
  <Head
    title="Statistiques des simulateurs | Aides simplifiées"
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
        <DsfrAccordionGroup :expanded-id="activeAccordion">
          <DsfrAccordion
            v-for="(stats, simulatorId) in statistics?.statistics"
            :id="`accordion-${simulatorId}`"
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
                      horizontal
                      title="Simulations commencées"
                      :description="String(stats.starts)"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
                      horizontal
                      title="Simulations terminées"
                      :description="String(stats.completions)"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
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
                <ClientOnly>
                  <line-chart v-bind="getChartAttributes" />
                </ClientOnly>
              </div>

              <!-- Intégrateurs -->
              <div class="fr-col-12">
                <h3>Intégrateurs</h3>
                <div class="fr-grid-row fr-grid-row--gutters">
                  <div
                    v-for="integrator in integrators"
                    :key="integrator.name"
                    class="fr-col-12 fr-col-md-4"
                  >
                    <div class="fr-card fr-card--sm">
                      <div class="fr-card__body">
                        <div class="fr-card__content">
                          <h4 class="fr-card__title">
                            {{ integrator.name }}
                          </h4>
                          <p class="fr-card__desc">
                            {{ integrator.description }}
                          </p>
                        </div>
                      </div>
                      <div class="fr-card__header">
                        <div class="fr-card__img">
                          <img
                            class="fr-responsive-img fr-responsive-img--contain"
                            :src="integrator.logo"
                            :alt="`Logo ${integrator.name}`"
                          >
                        </div>
                      </div>
                    </div>
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
                      horizontal
                      title="Oui"
                      :description="`${statistics?.satisfaction.yes}%`"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
                      horizontal
                      title="En partie"
                      :description="`${statistics?.satisfaction.partial}%`"
                      title-tag="h4"
                    />
                  </div>
                  <div class="fr-col-4">
                    <DsfrCard
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
        </DsfrAccordionGroup>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
.state-panel {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 10em;
}

.loading-indicator {
  color: var(--text-mention-grey);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-indicator .fr-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.fr-card__img img {
  max-width: 70% !important;
  object-fit: contain !important;
  display: block !important;
  margin: 0 auto !important;
}
</style>
