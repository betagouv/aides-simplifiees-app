import type { EligibilityResults } from '~/composables/use_eligibility_service'
import { computed } from 'vue'
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

  const calculatedResults = computed<EligibilityResults>(() => {
    if (!simulateurSlug || !aidesToEvaluate.length) {
      return {
        eligibleDispositifs: [],
        potentialDispositifs: [],
        ineligibleDispositifs: [],
      }
    }
    return calculateEligibility(
      simulateurSlug,
      surveyAnswers.value,
      aidesToEvaluate,
    )
  })
  // calculatedResults.value.eligibleDispositifs = calculatedResults.value.ineligibleDispositifs
  // calculatedResults.value.potentialDispositifs = calculatedResults.value.eligibleDispositifs

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
