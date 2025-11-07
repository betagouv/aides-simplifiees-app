/**
 * Type definitions for survey schemas
 * Defines the structure of a complete survey including steps, pages, and questions
 */

import type { SurveyAnswers } from './answer.js'
import type { SurveyQuestionData } from './question.js'

/**
 * Represents a grouped collection of questions for display purposes
 */
export interface QuestionGroup {
  /** Title of the question group */
  title: string
  /** Questions in this group with their visibility status */
  questions: {
    id: string
    title: string
    answer?: unknown
    visible: boolean
  }[]
}

/**
 * Page containing a set of questions
 */
export interface SurveyQuestionsPageData {
  /** Unique identifier for this page */
  id: string
  /** Optional title for this page */
  title?: string
  /** Questions displayed on this page */
  questions: SurveyQuestionData[]
}

/**
 * Page showing intermediate results during the survey
 */
export interface SurveyResultsPageData {
  /** Unique identifier for this page */
  id: string
  /** Optional title for this page */
  title?: string
  /** Indicates this is a results page */
  type: 'intermediary-results'
  /** Description of the results */
  description: string
  /** IDs of dispositifs (aids/schemes) to display */
  dispositifs: string[]
}

/**
 * Union type for all page types
 */
export type SurveyPageData = SurveyQuestionsPageData | SurveyResultsPageData

/**
 * Base step interface
 */
export interface SurveyStep {
  /** Unique identifier for this step */
  id: string
  /** Step title shown in navigation */
  title: string
}

/**
 * Step with direct questions (legacy format)
 */
export interface SurveyFlatStep extends SurveyStep {
  /** Questions directly in the step */
  questions: SurveyQuestionData[]
}

/**
 * Step with pages (normalized format)
 */
export interface SurveyDeepStep extends SurveyStep {
  /** Pages within this step */
  pages: SurveyPageData[]
}

/**
 * Test case definition for a survey
 */
export interface SurveyTest {
  /** Unique identifier for this test */
  id: string
  /** Description of what this test verifies */
  description: string
  /** Question IDs that should be sent to the API */
  questionsToApi: string[]
  /** Input answers for this test */
  answers: SurveyAnswers
  /** Expected results from the calculation */
  results: Record<string, any>
}

/**
 * Base schema properties shared by all engines
 */
export interface SurveySchemaBase {
  /** Unique identifier for this survey */
  id: string
  /** Survey title */
  title: string
  /** Schema instance version (e.g., "1.0.0") */
  version: string
  /** Schema format version (e.g., "2.0.0") */
  schemaVersion?: string
  /** Force refresh of survey data when schema loads */
  forceRefresh: boolean
  /** Survey description */
  description: string
  /** Steps in the survey (can be flat or deep) */
  steps: SurveyFlatStep[] | SurveyDeepStep[]
}

/**
 * Schema for OpenFisca-based surveys
 */
export interface OpenFiscaSurveySchema extends SurveySchemaBase {
  /** Calculation engine type */
  engine: 'openfisca'
  /** Question IDs whose values should be sent to the OpenFisca API */
  questionsToApi: string[]
}

/**
 * Dispositif (aid/scheme) definition for Publicodes surveys
 */
export interface PublicodesDispositif {
  /** Unique identifier */
  id: string
  /** Dispositif title */
  title: string
  /** Dispositif description */
  description: string
}

/**
 * Schema for Publicodes-based surveys
 */
export interface PublicodesSurveySchema extends SurveySchemaBase {
  /** Calculation engine type */
  engine: 'publicodes'
  /** Available dispositifs that can be calculated */
  dispositifs: PublicodesDispositif[]
}

/**
 * Union type for all schema types
 */
export type SurveySchema = OpenFiscaSurveySchema | PublicodesSurveySchema

/**
 * Normalized OpenFisca schema (always uses deep steps with pages)
 */
export interface OpenFiscaNormalizedSchema extends Omit<OpenFiscaSurveySchema, 'steps'> {
  /** Steps in normalized format */
  steps: SurveyDeepStep[]
}

/**
 * Normalized Publicodes schema (always uses deep steps with pages)
 */
export interface PublicodesNormalizedSchema extends Omit<PublicodesSurveySchema, 'steps'> {
  /** Steps in normalized format */
  steps: SurveyDeepStep[]
}

/**
 * Union type for normalized schemas
 */
export type SurveyNormalizedSchema = OpenFiscaNormalizedSchema | PublicodesNormalizedSchema

/**
 * Type guard to check if a schema is OpenFisca-based
 */
export function isOpenFiscaSchema(schema: SurveySchema): schema is OpenFiscaSurveySchema {
  return schema.engine === 'openfisca'
}

/**
 * Type guard to check if a schema is Publicodes-based
 */
export function isPublicodesSchema(schema: SurveySchema): schema is PublicodesSurveySchema {
  return schema.engine === 'publicodes'
}

/**
 * Type guard to check if a normalized schema is OpenFisca-based
 */
export function isOpenFiscaNormalizedSchema(
  schema: SurveyNormalizedSchema,
): schema is OpenFiscaNormalizedSchema {
  return schema.engine === 'openfisca'
}

/**
 * Type guard to check if a normalized schema is Publicodes-based
 */
export function isPublicodesNormalizedSchema(
  schema: SurveyNormalizedSchema,
): schema is PublicodesNormalizedSchema {
  return schema.engine === 'publicodes'
}

/**
 * Type guard to check if a step is a flat step
 */
export function isFlatStep(step: SurveyFlatStep | SurveyDeepStep): step is SurveyFlatStep {
  return 'questions' in step && step.questions !== undefined
}

/**
 * Type guard to check if a step is a deep step
 */
export function isDeepStep(step: SurveyFlatStep | SurveyDeepStep): step is SurveyDeepStep {
  return 'pages' in step && step.pages !== undefined
}

/**
 * Type guard to check if a page is a questions page
 */
export function isQuestionsPageData(page: SurveyPageData): page is SurveyQuestionsPageData {
  return 'questions' in page && page.questions !== undefined
}

/**
 * Type guard to check if a page is a results page
 */
export function isResultsPageData(page: SurveyPageData): page is SurveyResultsPageData {
  return 'type' in page && page.type === 'intermediary-results'
}

/**
 * Utility types for better developer experience
 */
export type SurveyEngine = SurveySchema['engine']
export type SurveyStepUnion = SurveyFlatStep | SurveyDeepStep
export type SurveyQuestionType = SurveyQuestionData['type']

/**
 * Helper type to extract question IDs from a schema
 */
export type ExtractQuestionIds<T extends SurveyNormalizedSchema> = T extends any
  ? T['steps'][number]['pages'][number] extends SurveyQuestionsPageData
    ? T['steps'][number]['pages'][number]['questions'][number]['id']
    : never
  : never
