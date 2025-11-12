/**
 * Service for formatting survey answers for display
 */

/**
 * Format an answer based on its question type
 */
export function formatAnswer(
  simulateurSlug: string,
  questionId: string,
  value: SurveyAnswerValue,
  getAnswer: (simulateurSlug: string, questionId: string) => SurveyAnswerValue,
  findQuestionById: (simulateurSlug: string, questionId: string) => SurveyQuestionData | null,
): string {
  // get choice title
  const question = findQuestionById(simulateurSlug, questionId)
  if (question) {
    switch (question.type) {
      case 'boolean': {
        return value ? 'Oui' : 'Non'
      }
      case 'number': {
        return value?.toString() ?? ''
      }
      case 'checkbox': {
        if (Array.isArray(value)) {
          const choices = question.choices
            ?.filter((choice) => {
              return value.includes(choice.id)
            })
            .map((choice) => {
              return choice.title
            })
          return choices?.join(', ') ?? ''
        }
        return ''
      }
      case 'combobox': {
        if (typeof value === 'string') {
          return JSON.parse(value)?.text ?? value
        }
        if (value && typeof value === 'object' && 'text' in value) {
          return value.text
        }
        return ''
      }
    }
    const choice = question.choices?.find((c) => {
      return c.id === value
    })
    if (choice?.title) {
      return choice.title
    }
  }
  // Fallback: convert to string or return empty
  const answer = getAnswer(simulateurSlug, questionId)
  if (answer === null || answer === undefined)
    return ''
  if (typeof answer === 'string')
    return answer
  if (typeof answer === 'number' || typeof answer === 'boolean')
    return answer.toString()
  if (Array.isArray(answer))
    return answer.join(', ')
  if (typeof answer === 'object' && 'text' in answer)
    return answer.text
  return ''
}
