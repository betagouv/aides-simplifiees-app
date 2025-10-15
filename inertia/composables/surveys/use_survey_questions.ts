export interface UseSurveyQuestionsOptions {
  getSchema: (simulateurSlug: string) => SurveyNormalizedSchema | null
}

export function useSurveyQuestions(options: UseSurveyQuestionsOptions) {
  const { getSchema } = options

  function getQuestions(simulateurSlug: string): SurveyQuestionData[] {
    const currentSchema = getSchema(simulateurSlug)
    const questions = currentSchema
      ?.steps
      .flatMap((step) => {
        return step.pages.flatMap(page => ((page as SurveyQuestionsPageData).questions ?? []))
      })
    return questions ?? []
  }

  function findQuestionById(simulateurSlug: string, questionId: string): SurveyQuestionData | null {
    const questions = getQuestions(simulateurSlug)
    const question = questions
      .find((q) => {
        return q.id === questionId
      })
    return question ?? null
  }

  return {
    getQuestions,
    findQuestionById,
  }
}
