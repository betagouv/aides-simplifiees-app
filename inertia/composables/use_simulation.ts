import axios from 'axios'
import { ref } from 'vue'
import { useEligibilityService } from '~/composables/use_eligibility_service'
import { extractAidesResults } from '~/utils/openfisca/beautify_results'
import { buildCalculationRequest } from '~/utils/openfisca/build_calculation_request'
import { standardizeBirthDate } from '~/utils/openfisca/standardize_birth_date'

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
        const request = buildCalculationRequest(answers, schema.questionsToApi ?? [])
        standardizeBirthDate(request) // Standardise birth dates for caching
        const response = await axios.post<OpenFiscaCalculationResponse>('/api/calculate', request, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          withCredentials: false,
        })
        const aidesResults = extractAidesResults(response.data, schema.questionsToApi ?? [])
        results.value = aidesResults
        status.value = 'success'
      }
      return results.value
    }
    catch (simulationError) {
      console.error('[Simulation] Error:', simulationError)
      status.value = 'error'
      const errorMessage = simulationError.message || 'Erreur lors de la simulation'
      error.value = errorMessage
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
