import type { EligibilityResults } from '~/services/eligibility_service'
import { computed, ref, watch } from 'vue'
import * as EligibilityService from '~/services/eligibility_service'
import { useSurveysStore } from '~/stores/surveys'

export function useDynamicEligibility(simulateurSlug: string) {
  // Access the survey store
  const surveysStore = useSurveysStore()

  // Get answers from the survey
  const surveyAnswers = computed(() => surveysStore.getAnswersForCalculation(simulateurSlug))
  const schema = computed(() => surveysStore.getSchema(simulateurSlug))

  // Get aides from the page configuration (only for Publicodes schemas)
  const aidesToEvaluate = computed(() => {
    const currentSchema = schema.value
    if (currentSchema && currentSchema.engine === 'publicodes') {
      return currentSchema.dispositifs || []
    }
    return []
  })

  // Use reactive ref for async computed results
  const calculatedResults = ref<EligibilityResults>({
    eligibleDispositifs: [],
    potentialDispositifs: [],
    ineligibleDispositifs: [],
    aidesResults: {},
  })

  // Watch for changes and recalculate
  watch([surveyAnswers, schema], async () => {
    if (!simulateurSlug || !aidesToEvaluate.value.length) {
      calculatedResults.value = {
        eligibleDispositifs: [],
        potentialDispositifs: [],
        ineligibleDispositifs: [],
        aidesResults: {},
      }
      return
    }

    try {
      calculatedResults.value = await EligibilityService.calculateEligibility(
        simulateurSlug,
        surveyAnswers.value,
        aidesToEvaluate.value,
      )
    }
    catch (error) {
      console.error('Error calculating eligibility:', error)
      calculatedResults.value = {
        eligibleDispositifs: [],
        potentialDispositifs: [],
        ineligibleDispositifs: [],
        aidesResults: {},
      }
    }
  }, { immediate: true })

  const hasEligibleAides = computed(() => calculatedResults.value.eligibleDispositifs.length > 0)
  const hasPotentialAides = computed(() => calculatedResults.value.potentialDispositifs.length > 0)
  const hasIneligibleAides = computed(() => calculatedResults.value.ineligibleDispositifs.length > 0)

  return {
    aidesToEvaluate,
    calculatedResults,
    hasEligibleAides,
    hasPotentialAides,
    hasIneligibleAides,
  }
}
