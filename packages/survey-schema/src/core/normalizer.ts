/**
 * Schema normalizer for converting between different schema formats
 * Converts legacy flat format to normalized deep format with pages
 */

import type {
  SurveyDeepStep,
  SurveyFlatStep,
  SurveyNormalizedSchema,
  SurveyQuestionsPageData,
  SurveySchema,
} from '../types/schema.js'
import { isDeepStep, isFlatStep } from '../types/schema.js'

/**
 * Options for schema normalization
 */
export interface SchemaNormalizerOptions {
  /**
   * Prefix to use for auto-generated page IDs
   * Default: 'page'
   */
  pageIdPrefix?: string
  /**
   * If true, validates the schema structure during normalization
   * Default: true
   */
  validate?: boolean
}

/**
 * Normalizes survey schemas to ensure consistent structure
 *
 * Converts legacy format (steps with direct questions) to the new format
 * (steps with pages containing questions). This ensures all schemas have
 * a consistent structure for processing.
 *
 * @example
 * ```typescript
 * const normalizer = new SchemaNormalizer()
 * const normalized = normalizer.normalize(legacySchema)
 * // All steps now have pages
 * ```
 */
export class SchemaNormalizer {
  private readonly options: Required<SchemaNormalizerOptions>

  constructor(options: SchemaNormalizerOptions = {}) {
    this.options = {
      pageIdPrefix: 'page',
      validate: true,
      ...options,
    }
  }

  /**
   * Normalize a schema to use the page-based format
   *
   * @param schema - The schema to normalize
   * @returns Normalized schema with deep steps
   */
  normalize(schema: SurveySchema): SurveyNormalizedSchema {
    // Convert each step to use the page-based format if needed
    const normalizedSteps: SurveyDeepStep[] = schema.steps.map((step) =>
      this.normalizeStep(step),
    )

    // Create normalized schema with proper typing
    const normalizedSchema: SurveyNormalizedSchema = {
      ...schema,
      steps: normalizedSteps,
      schemaVersion: schema.schemaVersion || '2.0.0',
    }

    if (this.options.validate) {
      this.validateNormalizedSchema(normalizedSchema)
    }

    return normalizedSchema
  }

  /**
   * Normalize a single step
   */
  private normalizeStep(step: SurveyFlatStep | SurveyDeepStep): SurveyDeepStep {
    // If the step already uses pages, return as is
    if (isDeepStep(step)) {
      return step
    }

    // Convert legacy format (direct questions) to page-based format
    if (isFlatStep(step)) {
      return this.convertFlatStepToDeepStep(step)
    }

    // If step has neither pages nor questions, create empty step
    return {
      id: step.id,
      title: step.title,
      pages: [],
    }
  }

  /**
   * Convert a flat step to a deep step
   */
  private convertFlatStepToDeepStep(flatStep: SurveyFlatStep): SurveyDeepStep {
    // Create one page per question for maximum flexibility
    const pages: SurveyQuestionsPageData[] = flatStep.questions.map((question, index) => ({
      id: `${flatStep.id}_${this.options.pageIdPrefix}_${index + 1}`,
      questions: [question],
    }))

    return {
      id: flatStep.id,
      title: flatStep.title,
      pages,
    }
  }

  /**
   * Validate the normalized schema structure
   */
  private validateNormalizedSchema(schema: SurveyNormalizedSchema): void {
    if (!schema.id) {
      throw new Error('Schema must have an id')
    }
    if (!schema.version) {
      throw new Error('Schema must have a version')
    }
    if (!schema.title) {
      throw new Error('Schema must have a title')
    }

    // Validate each step
    schema.steps.forEach((step, stepIndex) => {
      if (!step.id) {
        throw new Error(`Step at index ${stepIndex} must have an id`)
      }
      if (!step.title) {
        throw new Error(`Step '${step.id}' must have a title`)
      }
      if (!isDeepStep(step)) {
        throw new Error(`Step '${step.id}' is not in normalized format`)
      }

      // Validate pages
      step.pages.forEach((page, pageIndex) => {
        if (!page.id) {
          throw new Error(
            `Page at index ${pageIndex} in step '${step.id}' must have an id`,
          )
        }
      })
    })
  }

  /**
   * Check if a schema is already normalized
   */
  isNormalized(schema: SurveySchema): boolean {
    return schema.steps.every((step) => isDeepStep(step))
  }

  /**
   * Denormalize a schema (convert deep steps back to flat if they contain single-question pages)
   * This is useful for backwards compatibility or simplified storage
   */
  denormalize(schema: SurveyNormalizedSchema): SurveySchema {
    const denormalizedSteps = schema.steps.map((step): SurveyFlatStep | SurveyDeepStep => {
      // Check if all pages contain exactly one question
      const canBeFlatStep = step.pages.every(
        (page) => 'questions' in page && page.questions?.length === 1,
      )

      if (canBeFlatStep) {
        // Convert to flat step
        const questions = step.pages.flatMap((page) =>
          'questions' in page ? page.questions : [],
        )
        return {
          id: step.id,
          title: step.title,
          questions,
        }
      }

      // Keep as deep step
      return step
    })

    return {
      ...schema,
      steps: denormalizedSteps,
    }
  }
}
