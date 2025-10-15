import type { Ref } from 'vue'
import type { useMatomoTracking } from '~/composables/use_matomo_tracking'
import { useSurveyDebugStore } from '~/stores/survey_debug'

export interface UseSurveyAnswersOptions {
  answers: Ref<{ [simulateurSlug: string]: SurveyAnswers }>
  findQuestionById: (simulateurSlug: string, questionId: string) => SurveyQuestionData | null
  isQuestionVisible: (simulateurSlug: string, questionId: string) => boolean
  matomo?: ReturnType<typeof useMatomoTracking> | null
}

export function useSurveyAnswers(options: UseSurveyAnswersOptions) {
  const { answers, findQuestionById, isQuestionVisible, matomo } = options
  const { debug } = useSurveyDebugStore()

  const getAnswers = (simulateurSlug: string): SurveyAnswers => {
    const currentAnswers = answers.value[simulateurSlug]
    return currentAnswers ?? {}
  }

  const getAnswersForCalculation = (simulateurSlug: string): SurveyAnswers => {
    const currentAnswers = getAnswers(simulateurSlug)
    return Object.entries(currentAnswers)
      .filter(([questionId, answer]) => {
        const question = findQuestionById(simulateurSlug, questionId)
        if (!question) {
          return false
        }
        // Check if the question is visible
        const isVisible = isQuestionVisible(simulateurSlug, questionId)
        return isVisible && answer !== undefined
      })
      .reduce((acc, [questionId, answer]) => {
        const question = findQuestionById(simulateurSlug, questionId)
        if (question?.type === 'combobox') {
          // If the question is a combobox, parse the answer
          try {
            const parsedAnswer = JSON.parse(answer as string)
            acc[questionId] = parsedAnswer.value
          }
          catch (error) {
            debug.warn(
              `[Surveys store][${simulateurSlug}] Error parsing combobox answer for ${questionId}:`,
              error,
            )
          }
        }
        else {
          acc[questionId] = answer
        }
        return acc
      }, {} as SurveyAnswers)
  }

  const hasAnswers = (simulateurSlug: string): boolean => {
    const currentAnswers = getAnswers(simulateurSlug)
    return Object.keys(currentAnswers).length > 0
  }

  const getAnswer = (simulateurSlug: string, questionId: string): SurveyAnswerValue => {
    const currentAnswers = getAnswers(simulateurSlug)
    const answer = currentAnswers[questionId]
    if (answer === undefined) {
      // debug.warn(`[Surveys store][${simulateurSlug}] Answer not found for ${questionId}`)
      return null
    }
    // debug.log(`[Surveys store][${simulateurSlug}] Answer for ${questionId}:`, answer)
    return answer
  }

  const hasAnswer = (simulateurSlug: string, questionId: string): boolean => {
    const currentAnswers = getAnswers(simulateurSlug)
    const answer = currentAnswers[questionId]
    if (answer === undefined) {
      return false
    }
    return true
  }

  function setAnswer(simulateurSlug: string, questionId: string, value: SurveyAnswerValue) {
    // Initialize answers object for this simulateur if it doesn't exist
    if (!answers.value[simulateurSlug]) {
      answers.value[simulateurSlug] = {}
    }

    answers.value[simulateurSlug][questionId] = value

    debug.log(`[Surveys store][${simulateurSlug}] Answer set for ${questionId}:`, value)

    // Track the answer in analytics
    const question = findQuestionById(simulateurSlug, questionId)
    if (question && matomo) {
      matomo.trackSurveyAnswer(simulateurSlug, questionId, question.title)
    }
  }

  return {
    getAnswers,
    getAnswersForCalculation,
    hasAnswers,
    getAnswer,
    hasAnswer,
    setAnswer,
  }
}
