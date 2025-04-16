import { defineStore } from 'pinia'
import { onMounted, reactive, ref, watchEffect } from 'vue'

export const useSubmissionStore = defineStore('submissions', () => {
  const results = ref<{ [id: string]: SurveyResults }>({})
  const submissionStatus = ref<{ [id: string]: 'idle' | 'pending' | 'success' | 'error' }>({})

  const { debug } = useSurveyDebugStore()

  const setResults = (simulateurId: string, data: SimulationResultsAides) => {
    results.value[simulateurId] = {
      data,
      meta: {
        createdAt: new Date()
      }
    }
  }

  const getResults = (simulateurId: string) => {
    return results.value[simulateurId]
  }

  const getSubmissionStatus = (simulateurId: string) => {
    return submissionStatus.value[simulateurId] || 'idle'
  }

  const setSubmissionStatus = (simulateurId: string, status: 'idle' | 'pending' | 'success' | 'error') => {
    submissionStatus.value[simulateurId] = status
  }

  const submitForm = async (simulateurId: string, answers: any) => {
    debug.log('[Submission Store] submitForm', simulateurId, answers)

    const questionsToApi: string[] = [
      'locapass-eligibilite',
      'mobilite-master-1',
      'mobilite-parcoursup',
      'aide-personnalisee-logement',
      'garantie-visale-eligibilite',
      'garantie-visale'
    ]

    // Sending the data to a web API to calculate a set of 'aides'
    try {
      setSubmissionStatus(simulateurId, 'pending')
      const request: OpenFiscaCalculationRequest = buildRequest(answers, questionsToApi)
      const openfiscaResponse: OpenFiscaCalculationResponse = await fetchOpenFiscaFranceCalculation(request)

      debug.log('[Submission Store] openfiscaResponse', openfiscaResponse)

      const results: SimulationResultsAides = extractAidesResults(openfiscaResponse, questionsToApi)

      debug.log('Results from OpenFisca:', results)

      if (results) {
        setResults(simulateurId, results)
        setSubmissionStatus(simulateurId, 'success')

        // Track form submission in Matomo
        const matomo = useMatomo()
        matomo.trackSurveySubmit(simulateurId)

        // Store form data and results
        try {
          const storeResponse = await $fetch('/api/store-form-data', {
            method: 'POST',
            body: {
              simulateurId,
              answers,
              results,
            },
          })

          if (storeResponse.success) {
            debug.log('[Submission Store] Form data stored successfully:', storeResponse)
          }
          else {
            console.error('[Submission Store] Failed to store form data:', storeResponse)
          }
        }
        catch (storageError) {
          console.error('[Submission Store] Error storing form data:', storageError)
        }

        return true
      }

      setSubmissionStatus(simulateurId, 'error')
      console.error('[Submission Store] No results found in OpenFisca response')
      return false
    }
    catch (error) {
      setSubmissionStatus(simulateurId, 'error')
      console.error('[Submission Store] Error during form submission:', error)
      return false
    }
  }

  return {
    results,
    submissionStatus,
    setResults,
    getResults,
    getSubmissionStatus,
    setSubmissionStatus,
    submitForm
  }
}, {
  persist: {
    pick: [
      'results'
    ],
  }
})
