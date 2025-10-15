import { isAnswerValid } from '~/utils/form_validation'

export interface UseSurveyValidationOptions {
  getAnswer: (simulateurSlug: string, questionId: string) => any
  hasAnswer: (simulateurSlug: string, questionId: string) => boolean
  getCurrentPage: (simulateurSlug: string) => SurveyPageData | null
  getVisibleQuestions: (simulateurSlug: string) => SurveyQuestionData[]
  isQuestionVisible: (simulateurSlug: string, questionId: string) => boolean
}

export function useSurveyValidation(options: UseSurveyValidationOptions) {
  const {
    getAnswer,
    hasAnswer,
    getCurrentPage,
    getVisibleQuestions,
    isQuestionVisible,
  } = options

  function getVisibleQuestionsInCurrentPage(simulateurSlug: string): SurveyQuestionData[] {
    const currentPage = getCurrentPage(simulateurSlug)
    if (!currentPage) {
      return []
    }
    const questions = (currentPage as SurveyQuestionsPageData)
      ?.questions
      ?.filter((question) => {
        return isQuestionVisible(simulateurSlug, question.id)
      })
    return questions ?? []
  }

  function areAllQuestionsInPageValid(simulateurSlug: string): boolean {
    const visibleQuestions = getVisibleQuestionsInCurrentPage(simulateurSlug)
    const areAllValid = visibleQuestions
      .every((question) => {
        return isAnswerValid(question, getAnswer(simulateurSlug, question.id))
      })
    return areAllValid
  }

  function areAllRequiredQuestionsAnswered(simulateurSlug: string): boolean {
    const visibleQuestions = getVisibleQuestions(simulateurSlug)
    const areAllAnswered = visibleQuestions
      .filter((question) => {
        // Only consider questions that are explicitly required (default to true if not specified)
        return question.required !== false
      })
      .every((question) => {
        return hasAnswer(simulateurSlug, question.id)
      })
    return areAllAnswered
  }

  return {
    getVisibleQuestionsInCurrentPage,
    areAllQuestionsInPageValid,
    areAllRequiredQuestionsAnswered,
  }
}
