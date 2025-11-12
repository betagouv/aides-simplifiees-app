import { evaluateCondition } from '~/services/condition_service'

export interface UseSurveyVisibilityOptions {
  getAnswers: (simulateurSlug: string) => SurveyAnswers
  findQuestionById: (simulateurSlug: string, questionId: string) => SurveyQuestionData | null
  getQuestions: (simulateurSlug: string) => SurveyQuestionData[]
}

export function useSurveyVisibility(options: UseSurveyVisibilityOptions) {
  const { getAnswers, findQuestionById, getQuestions } = options

  function isQuestionVisible(simulateurSlug: string, questionId: string): boolean {
    const question = findQuestionById(simulateurSlug, questionId)
    const currentAnswers = getAnswers(simulateurSlug)

    if (!question) {
      return false
    }

    // If the question has a visibility condition, evaluate it
    if (question.visibleWhen) {
      // Handle both string and array formats for visibleWhen
      if (Array.isArray(question.visibleWhen)) {
        // If it's an array, evaluate all conditions with AND logic
        const isVisible = question.visibleWhen.every(condition =>
          evaluateCondition(condition, currentAnswers),
        )
        return isVisible
      }
      else {
        // Single condition as a string (existing behavior)
        const isVisible = evaluateCondition(question.visibleWhen, currentAnswers)
        return isVisible
      }
    }

    // By default, a question is visible
    return true
  }

  function getVisibleQuestions(simulateurSlug: string): SurveyQuestionData[] {
    const questions = getQuestions(simulateurSlug)
    const visibleQuestions = questions
      .filter((question) => {
        return isQuestionVisible(simulateurSlug, question.id)
      })
    return visibleQuestions
  }

  return {
    isQuestionVisible,
    getVisibleQuestions,
  }
}
