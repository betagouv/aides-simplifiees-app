import type { EligibilityResults } from '~/composables/use_eligibility_service'
import { computed, ref, watch } from 'vue'
import { useEligibilityService } from '~/composables/use_eligibility_service'
import { useSurveysStore } from '~/stores/surveys'

export function useDynamicEligibility(simulateurSlug: string) {
  // Access the survey store
  const surveysStore = useSurveysStore()
  const { calculateEligibility } = useEligibilityService()

  // Get answers from the survey
  const surveyAnswers = computed(() => surveysStore.getAnswersForCalculation(simulateurSlug))
  const schema = computed(() => surveysStore.getSchema(simulateurSlug))

  // Get aides from the page configuration
  const aidesToEvaluate = schema.value?.dispositifs || []

  // Use reactive ref for async computed results
  const calculatedResults = ref<EligibilityResults>({
    eligibleDispositifs: [],
    potentialDispositifs: [],
    ineligibleDispositifs: [],
    aidesResults: {},
  })

  // Watch for changes and recalculate
  watch([surveyAnswers, schema], async () => {
    if (!simulateurSlug || !aidesToEvaluate.length) {
      calculatedResults.value = {
        eligibleDispositifs: [],
        potentialDispositifs: [],
        ineligibleDispositifs: [],
        aidesResults: {},
      }
      return
    }

    try {
      calculatedResults.value = await calculateEligibility(
        simulateurSlug,
        surveyAnswers.value,
        aidesToEvaluate,
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
