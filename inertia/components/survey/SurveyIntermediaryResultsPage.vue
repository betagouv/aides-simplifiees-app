<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAlert } from '@gouvminint/vue-dsfr'
import { usePage } from '@inertiajs/vue3'
import { computed, onMounted, ref, watch } from 'vue'
import { useMatomo } from '~/composables/use_matomo'
import { useSurveysStore } from '~/stores/surveys'
import { useEligibilityService, type DispositifDetail as AideDetail, type EligibilityResults } from '~/composables/use_eligibility_service'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showSimulateur'>>()

// Track view in Matomo
useMatomo().trackEvent('Simulateur', 'IntermediaryResults', simulateur.slug)

// Access the survey store
const surveysStore = useSurveysStore()
const { calculateEligibility } = useEligibilityService()

// Get answers from the survey
const surveyAnswers = computed(() => surveysStore.getAnswersForCalculation(simulateur.slug))
const currentPage = computed(() => surveysStore.getCurrentPage(simulateur.slug) as SurveyResultsPage)
const schema = computed(() => surveysStore.getSchema(simulateur.slug))

// Get aides from the page configuration
const aidesToEvaluate = computed((): AideDetail[] => {
  if (currentPage.value?.type === 'intermediary-results' && currentPage.value?.dispositifs) {
    const aideDetailsList = schema.value?.intermediaryResults?.dispositifs || []
    return currentPage.value.dispositifs.map(aideId => {
      const aideDetail = aideDetailsList.find(d => d.id === aideId)
      return {
        id: aideId,
        title: aideDetail?.title || aideId,
        description: aideDetail?.description || `Aide ${aideId}`
      }
    })
  }
  return []
})

// State for calculated results
const calculatedResults = ref<EligibilityResults>({
  eligibleDispositifs: [],
  potentialDispositifs: [],
  ineligibleDispositifs: [],
})

const hasEligibleAides = computed(() => calculatedResults.value.eligibleDispositifs.length > 0)
const hasPotentialAides = computed(() => calculatedResults.value.potentialDispositifs.length > 0)
const hasIneligibleAides = computed(() => calculatedResults.value.ineligibleDispositifs.length > 0)

function performEligibilityCalculation() {
  if (!simulateur.slug || !aidesToEvaluate.value.length) {
    calculatedResults.value = {
      eligibleDispositifs: [],
      potentialDispositifs: [],
      ineligibleDispositifs: [],
    }
    return
  }
  calculatedResults.value = calculateEligibility(
    simulateur.slug,
    surveyAnswers.value,
    aidesToEvaluate.value
  )
}

watch([surveyAnswers, aidesToEvaluate], () => {
  performEligibilityCalculation()
}, { deep: true })

onMounted(() => {
  performEligibilityCalculation()
})
</script>

<template>
  <div>
    <div
      v-if="hasEligibleAides"
      class="fr-mb-3w"
    >
      <h3 class="fr-h6">Aides pour lesquelles vous semblez éligible</h3>
      <p>
        En fonction des informations que vous avez déjà fournies, vous semblez éligible
        aux aides suivantes :
      </p>
      <ul>
        <li
          v-for="aide in calculatedResults.eligibleDispositifs"
          :key="aide.id"
        >
          <strong>{{ aide.title }}</strong>
          <p>
            {{ aide.description }}
          </p>
          <p v-if="aide.reason">
            <small>Note : {{ aide.reason }}</small>
          </p>
        </li>
      </ul>
    </div>

    <!-- Potential aides -->
    <div
      v-if="hasPotentialAides"
      class="fr-mb-3w"
    >
      <h3 class="fr-h6">
        Aides pour lesquelles vous pourriez être éligible
      </h3>
      <p>
        Ces aides nécessitent plus d'informations pour déterminer votre éligibilité :
      </p>
      <ul>
        <li
          v-for="aide in calculatedResults.potentialDispositifs"
          :key="aide.id"
        >
          <strong>{{ aide.title }}</strong>
          <p>
            {{ aide.description }}
          </p>
          <p v-if="aide.reason">
            <small>Note : {{ aide.reason }}</small>
          </p>
        </li>
      </ul>
    </div>

    <!-- Ineligible aides -->
    <div
      v-if="hasIneligibleAides"
      class="fr-mb-3w"
    >
      <h3>Aides pour lesquelles vous n'êtes pas éligible</h3>
      <p>
        Selon les informations fournies, vous ne remplissez pas les critères d'éligibilité pour :
      </p>
      <ul>
        <li
          v-for="aide in calculatedResults.ineligibleDispositifs"
          :key="aide.id"
        >
          <strong>{{ aide.title }}</strong>
          <p>
            {{ aide.description }}
          </p>
          <p
            v-if="aide.reason"
          >
            <small>Raison : {{ aide.reason }}</small>
          </p>
        </li>
      </ul>
    </div>

    <!-- No aides message -->
    <DsfrAlert
      v-if="!hasEligibleAides && !hasPotentialAides && !hasIneligibleAides && aidesToEvaluate.length > 0"
      title="Calculs en cours ou informations insuffisantes"
      type="info"
      description="Nous analysons votre situation. Continuez la simulation pour affiner les résultats ou vérifiez les informations fournies."
    />
     <DsfrAlert
      v-if="aidesToEvaluate.length === 0"
      title="Aucune aide à évaluer"
      type="info"
      description="Ce questionnaire n'a pas d'aides configurées pour une évaluation intermédiaire à cette étape."
    />
  </div>
</template>
