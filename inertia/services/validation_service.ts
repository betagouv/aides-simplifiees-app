export function isAnswerValid(question: SurveyQuestionData, answer: SurveyAnswerValue): boolean {
  if (!question) {
    return false
  }

  // Check if the question is required (default to true if not specified)
  const isRequired = question.required !== false

  // If question is not required and has no answer, it's valid
  if (!isRequired && (answer === undefined || answer === null || answer === '')) {
    return true
  }

  // Different validation based on question type
  switch (question.type) {
    case 'radio':
    case 'date':
      // For radio and date, any non-empty value is valid
      return !!answer
    case 'boolean':
      // For boolean, both true and false are valid answers
      return answer === true || answer === false
    case 'checkbox':
      // For checkbox, the answer should be an array with at least one item
      return Array.isArray(answer) && answer.length > 0
    case 'number':
      // For number, we need to check if it's a number including 0
      return answer === 0 || !!answer
    case 'combobox':
      // For text, the value should not be empty
      return answer !== undefined && answer !== null && answer !== ''
    default:
      return false
  }
}
