/**
 * Evaluates a condition string against a set of answers
 */
export function evaluateCondition(conditionStr: string, answers: Record<string, any>): boolean {
  if (!conditionStr) {
    return true
  }

  // Create a function to get answer values
  const getAnswerValue = (questionId: string): any => answers[questionId]

  try {
    // Handle logical OR conditions by splitting and evaluating each part
    if (conditionStr.includes('||')) {
      const orConditions = conditionStr.split('||').map(c => c.trim())
      return orConditions.some(condition => evaluateCondition(condition, answers))
    }

    // Handle logical AND conditions
    if (conditionStr.includes('&&')) {
      const andConditions = conditionStr.split('&&').map(c => c.trim())
      return andConditions.every(condition => evaluateCondition(condition, answers))
    }

    // Handle includes syntax for checkboxes
    // Example: "services-interets.includes("aide-demenagement", "aide-caution")"
    if (conditionStr.includes('.includes(')) {
      const matches = conditionStr.match(/^(.+)\.includes\((.+)\)$/)
      if (matches && matches.length === 3) {
        const questionId = matches[1].trim()
        // Parse the comma-separated values inside the parentheses
        const valuesToCheck = matches[2]
          .split(',')
          .map(v => v.trim().replace(/^["'](.+)["']$/, '$1')) // Remove quotes

        const selectedValues = getAnswerValue(questionId)

        // If no selection made yet, return false
        if (!selectedValues) {
          return false
        }

        // For a single value (radio buttons), check if it's in the values to check
        if (typeof selectedValues === 'string') {
          return valuesToCheck.includes(selectedValues)
        }

        // For multiple values (checkboxes), check if at least one value is in the selected values
        if (Array.isArray(selectedValues)) {
          return valuesToCheck.some(v => selectedValues.includes(v))
        }

        return false
      }
    }

    // Handle comparison operations
    const comparisonOperators = ['>=', '<=', '>', '<', '=', '!=']
    for (const operator of comparisonOperators) {
      if (conditionStr.includes(operator)) {
        const [leftSide, rightSide] = conditionStr.split(operator).map(s => s.trim())
        const leftValue = getAnswerValue(leftSide)

        // If the question hasn't been answered yet, return false
        if (leftValue === undefined) {
          return false
        }

        // Parse right side value
        let rightValue: any = rightSide

        // Convert string 'true'/'false' to boolean if comparing with a boolean value
        if (typeof leftValue === 'boolean' && (rightValue === 'true' || rightValue === 'false')) {
          rightValue = rightValue === 'true'
        }

        // Try to convert to number if applicable
        else if (!Number.isNaN(Number(rightValue))) {
          rightValue = Number(rightValue)
        }

        // Handle date comparison
        const isLeftDate = typeof leftValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(leftValue)
        const isRightDate = typeof rightValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rightValue)

        if (isLeftDate && isRightDate) {
          const leftDate = new Date(leftValue)
          const rightDate = new Date(rightValue)

          switch (operator) {
            case '>':
              return leftDate > rightDate
            case '>=':
              return leftDate >= rightDate
            case '<':
              return leftDate < rightDate
            case '<=':
              return leftDate <= rightDate
            case '=':
              return leftDate.getTime() === rightDate.getTime()
            case '!=':
              return leftDate.getTime() !== rightDate.getTime()
          }
        }

        // Compare numbers or strings
        switch (operator) {
          case '>':
            return leftValue > rightValue
          case '>=':
            return leftValue >= rightValue
          case '<':
            return leftValue < rightValue
          case '<=':
            return leftValue <= rightValue
          case '=':
            return leftValue === rightValue
          case '!=':
            return leftValue !== rightValue
        }
      }
    }

    // If no operators matched, check if the condition is a single value
    // This handles cases like checking if a checkbox is checked
    return !!getAnswerValue(conditionStr)
  }
  catch (error) {
    console.error('Error evaluating condition:', conditionStr, error)
    return false
  }
}
