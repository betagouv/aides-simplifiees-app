import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMatomoTracking } from '~/composables/use_matomo_tracking'
import { useSurveyDebugStore } from '~/stores/survey_debug'
import { extractAidesResults } from '~/utils/beautify_results'
import { buildRequest, fetchOpenFiscaFranceCalculation } from '~/utils/calculate_aides'

export const useSubmissionStore = defineStore(
  'submissions',
  () => {
    const results = ref<{ [id: string]: SurveyResults }>({})
    const submissionStatus = ref<{ [id: string]: 'idle' | 'pending' | 'success' | 'error' }>({})
    const secureHashes = ref<{ [id: string]: string }>({})

    const { debug } = useSurveyDebugStore()

    const setResults = (simulateurId: string, data: SimulationResultsAides) => {
      results.value[simulateurId] = {
        data,
        meta: {
          createdAt: new Date(),
        },
      }
    }

    const getResults = (simulateurId: string) => {
      return results.value[simulateurId]
    }

    const getSubmissionStatus = (simulateurId: string) => {
      return submissionStatus.value[simulateurId] || 'idle'
    }

    const setSubmissionStatus = (
      simulateurId: string,
      status: 'idle' | 'pending' | 'success' | 'error',
    ) => {
      submissionStatus.value[simulateurId] = status
    }

    const getSecureHash = (simulateurId: string) => {
      return secureHashes.value[simulateurId]
    }

    const setSecureHash = (simulateurId: string, hash: string) => {
      secureHashes.value[simulateurId] = hash
    }

    const submitFormPublicodes = async (simulateurId: string, answers: any, aidesResults: SimulationResultsAides): Promise<boolean> => {
      debug.log('[Submission Store] submitForm', simulateurId, answers)

      // Sending the data to a web API to calculate a set of 'aides'

      try {
        setSubmissionStatus(simulateurId, 'pending')

        // Track form submission in Matomo
        const matomo = useMatomoTracking()
        matomo.trackSurveySubmit(simulateurId)

        // Store form data and results
        try {
          const storeResponse = await axios.post(
            '/api/form-submissions',
            {
              simulateurId,
              answers,
              results: aidesResults,
            },
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
          )

          if (storeResponse.data.success) {
            debug.log('[Submission Store] Form data stored successfully:', storeResponse.data)

            // Store the secure hash for potential future use
            if (storeResponse.data.secureHash) {
              setSecureHash(simulateurId, storeResponse.data.secureHash)
            }

            setResults(simulateurId, aidesResults)
            setSubmissionStatus(simulateurId, 'success')
            return true
          }
          else {
            setSubmissionStatus(simulateurId, 'error')
            console.error('[Submission Store] Failed to store form data:', storeResponse.data)
          }
        }
        catch (storageError) {
          setSubmissionStatus(simulateurId, 'error')
          console.error('[Submission Store] Error storing form data:', storageError)
        }
      }
      catch (error) {
        setSubmissionStatus(simulateurId, 'error')
        console.error('[Submission Store] Error during form submission:', error)
      }
      return false
    }

    const submitForm = async (simulateurId: string, answers: any) => {
      debug.log('[Submission Store] submitForm', simulateurId, answers)

      const questionsToApi: string[] = [
        'locapass-eligibilite',
        'mobilite-master-1',
        'mobilite-parcoursup',
        'aide-personnalisee-logement',
        'garantie-visale-eligibilite',
        'garantie-visale',
      ]

      // Sending the data to a web API to calculate a set of 'aides'
      try {
        setSubmissionStatus(simulateurId, 'pending')
        const request: OpenFiscaCalculationRequest = buildRequest(answers, questionsToApi)
        const openfiscaResponse: OpenFiscaCalculationResponse = await fetchOpenFiscaFranceCalculation(request)

        debug.log('[Submission Store] openfiscaResponse', openfiscaResponse)

        const aidesResults: SimulationResultsAides = extractAidesResults(
          openfiscaResponse,
          questionsToApi,
        )

        if (aidesResults) {
          // Track form submission in Matomo
          const matomo = useMatomoTracking()
          matomo.trackSurveySubmit(simulateurId)

          // Store form data and results
          try {
            const storeResponse = await axios.post(
              '/api/form-submissions',
              {
                simulateurId,
                answers,
                results: aidesResults,
              },
              {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest',
                },
              },
            )

            if (storeResponse.data.success) {
              debug.log('[Submission Store] Form data stored successfully:', storeResponse.data)

              // Store the secure hash for potential future use
              if (storeResponse.data.secureHash) {
                setSecureHash(simulateurId, storeResponse.data.secureHash)
              }

              setResults(simulateurId, aidesResults)
              setSubmissionStatus(simulateurId, 'success')
              return true
            }
            else {
              setSubmissionStatus(simulateurId, 'error')
              console.error('[Submission Store] Failed to store form data:', storeResponse.data)
            }
          }
          catch (storageError) {
            setSubmissionStatus(simulateurId, 'error')
            console.error('[Submission Store] Error storing form data:', storageError)
          }
        }
        setSubmissionStatus(simulateurId, 'error')
        console.error('[Submission Store] No results found in OpenFisca response')
      }
      catch (error) {
        setSubmissionStatus(simulateurId, 'error')
        console.error('[Submission Store] Error during form submission:', error)
      }
      return false
    }

    return {
      results,
      submissionStatus,
      secureHashes,
      setResults,
      getResults,
      getSubmissionStatus,
      setSubmissionStatus,
      getSecureHash,
      setSecureHash,
      submitForm,
      submitFormPublicodes,
    }
  },
  {
    persist: {
      pick: ['results', 'secureHashes'],
    },
  },
)
