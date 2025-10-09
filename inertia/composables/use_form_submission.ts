import axios from 'axios'
import { ref } from 'vue'
import { useMatomoTracking } from '~/composables/use_matomo_tracking'
import { useSurveyDebugStore } from '~/stores/survey_debug'

export function useFormSubmission() {
  const { debug } = useSurveyDebugStore()

  const status = ref<'idle' | 'pending' | 'success' | 'error'>()

  const submit = async (simulateurSlug: string, answers: SurveyAnswers, results: SimulationResultsAides): Promise<{
    success: boolean
    hash?: string
  }> => {
    debug.log('[useSubmission] submitForm', simulateurSlug, answers)

    try {
      status.value = 'pending'

      // Track form submission in Matomo
      const matomo = useMatomoTracking()
      matomo.trackSurveySubmit(simulateurSlug)

      // Store form data and results
      try {
        const response = await axios.post(
          '/api/form-submissions',
          {
            simulateurSlug,
            answers,
            results,
          },
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          },
        )

        if (response.data.success) {
          debug.log('[useSubmission] Form data stored successfully:', response.data)
          status.value = 'success'
          return { success: true, hash: response.data.secureHash }
        }
        else {
          status.value = 'error'
          console.error('[useSubmission] Failed to store form data:', response.data)
        }
      }
      catch (storageError) {
        status.value = 'error'
        console.error('[useSubmission] Error storing form data:', storageError)
      }
    }
    catch (error) {
      status.value = 'error'
      console.error('[useSubmission] Error during form submission:', error)
    }
    return { success: false }
  }

  return {
    status,
    submit,
  }
}
