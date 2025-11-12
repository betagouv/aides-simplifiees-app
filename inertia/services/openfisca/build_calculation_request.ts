import { OpenFiscaRequestBuilder } from '~/services/openfisca/request-builder'
import { famillesVariables } from '~/services/openfisca/variables'

/**
 * OpenFisca request builder and business logic
 *
 * This module provides the main entry point for building OpenFisca calculation
 * requests from survey answers using the builder pattern.
 */

/**
 * Apply special business logic for scholarship (Parcoursup mobility)
 *
 * Special case: If student has scholarship and is moving for Parcoursup,
 * add high school scholarship amount to the request.
 *
 * @param builder - OpenFiscaRequestBuilder instance
 * @param answers - Survey answers
 */
function applyScholarshipBusinessLogic(
  builder: OpenFiscaRequestBuilder,
  answers: SurveyAnswers,
): void {
  // Check if "bourse_lycee" exists directly in famillesVariables
  const bourseLyceesInFamilies = Object.keys(famillesVariables).includes('bourse_lycee')

  // Special case for Parcoursup mobility with scholarship
  if (
    answers.boursier === true
    && answers['etudiant-mobilite'] === 'parcoursup-nouvelle-region'
    && !bourseLyceesInFamilies
  ) {
    try {
      // Add scholarship using builder
      builder.addAnswer('montant-bourse-lycee', 1)
    }
    catch (error) {
      console.warn(`Could not add scholarship business logic: ${error}`)
    }
  }
}

/**
 * Build an OpenFisca calculation request from survey answers and questions
 *
 * This function uses the OpenFiscaRequestBuilder to construct requests
 * with proper error handling and testability.
 *
 * @param answers - Survey answers to process
 * @param questions - Questions to add to the request (for calculation)
 * @returns OpenFisca calculation request
 */
export function buildCalculationRequest(
  answers: SurveyAnswers,
  questions: string[],
): OpenFiscaCalculationRequest {
  // Use the builder for all request construction
  const builder = new OpenFiscaRequestBuilder({ allowUndefinedValues: true })

  // Add answers and questions
  builder.addAnswers(answers)
  builder.addQuestions(questions)

  // Apply special business logic
  applyScholarshipBusinessLogic(builder, answers)

  // Apply default values and business rules
  builder.applyDefaultValues()

  // Build the request
  const result = builder.build()

  if (!result.success) {
    console.error('OpenFiscaRequestBuilder failed with errors:', result.errors)
    throw new Error('Failed to build OpenFisca calculation request')
  }

  return result.request
}
