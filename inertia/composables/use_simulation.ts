import { ref } from 'vue'
import { useEligibilityService } from '~/composables/use_eligibility_service'
import { extractAidesResults } from '~/utils/beautify_results'
import { buildRequest, fetchOpenFiscaFranceCalculation } from '~/utils/calculate_aides'

/**
 * Composable for handling simulation logic with OpenFisca or Publicodes
 */
export function useSimulation() {
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const results = ref<SimulationResultsAides | null>(null)
  const error = ref<string | null>(null)

  /**
   * Run a simulation with the provided answers
   */
  async function runSimulation(
    answers: Record<string, any>,
    schema: SurveyNormalizedSchema,
  ): Promise<SimulationResultsAides | null> {
    try {
      status.value = 'pending'
      error.value = null
      if (schema.engine === 'publicodes') {
        const aidesToEvaluate = schema.dispositifs ?? []
        const { calculateEligibility } = useEligibilityService()
        const { aidesResults } = await calculateEligibility(schema.id, answers, aidesToEvaluate)
        results.value = aidesResults
        status.value = 'success'
      }
      else {
        const request: OpenFiscaCalculationRequest = buildRequest(answers, schema.questionsToApi ?? [])
        const openfiscaResponse: OpenFiscaCalculationResponse = await fetchOpenFiscaFranceCalculation(request)
        const aidesResults: SimulationResultsAides = extractAidesResults(openfiscaResponse, schema.questionsToApi ?? [])
        results.value = aidesResults
        status.value = 'success'
      }
      return results.value
    }
    catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la simulation'
      error.value = errorMessage
      status.value = 'error'
      console.error('[Simulation] Error:', err)
      return null
    }
  }

  /**
   * Reset the simulation state
   */
  function resetSimulation() {
    status.value = 'idle'
    results.value = null
    error.value = null
  }

  return {
    status,
    error,
    results,
    runSimulation,
    resetSimulation,
  }
}
