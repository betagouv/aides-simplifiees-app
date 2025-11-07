/**
 * Format a survey answer to OpenFisca request structure
 */
export function formatSurveyAnswerToRequest(
  openfiscaVariableName: string,
  period: string,
  value: boolean | number | string, // VariableValueOnPeriod allowed types
): { [openfiscaKey: string]: VariableValueOnPeriod } {
  return {
    [openfiscaVariableName]: {
      [period]: value,
    },
  }
}

/**
 * Format a survey question to OpenFisca request structure
 */
export function formatSurveyQuestionToRequest(
  openfiscaVariableName: string,
  period: string,
): { [openfiscaKey: string]: VariableToCalculateOnPeriod } {
  return {
    [openfiscaVariableName]: {
      [period]: null,
    },
  }
}
