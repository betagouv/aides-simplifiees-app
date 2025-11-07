/**
 * Builder for creating survey steps with a fluent API
 */

import type {
  SurveyDeepStep,
  SurveyFlatStep,
  SurveyQuestionsPageData,
  SurveyResultsPageData,
  SurveyStepUnion,
} from '../types/schema.js'
import type { SurveyQuestionData } from '../types/question.js'

/**
 * Builder for creating survey steps
 *
 * @example
 * ```typescript
 * // Step with pages
 * const step = new StepBuilder('step1')
 *   .title('Personal Information')
 *   .addPage(page1)
 *   .addPage(page2)
 *   .build()
 *
 * // Flat step with questions directly
 * const flatStep = new StepBuilder('step2')
 *   .title('Quick Questions')
 *   .addQuestion(question1)
 *   .addQuestion(question2)
 *   .build()
 * ```
 */
export class StepBuilder {
  private step: Partial<SurveyStepUnion> = {}

  constructor(id: string) {
    this.step.id = id
  }

  /**
   * Set the step title
   */
  title(title: string): this {
    this.step.title = title
    return this
  }

  /**
   * Add a page to this step (deep format - multi-page mode)
   */
  addPage(page: SurveyQuestionsPageData | SurveyResultsPageData): this {
    const deepStep = this.step as Partial<SurveyDeepStep>
    if (!deepStep.pages) {
      deepStep.pages = []
    }
    deepStep.pages.push(page)
    return this
  }

  /**
   * Set all pages for this step
   */
  pages(pages: Array<SurveyQuestionsPageData | SurveyResultsPageData>): this {
    (this.step as Partial<SurveyDeepStep>).pages = pages
    return this
  }

  /**
   * Add a question directly to this step (flat format)
   */
  addQuestion(question: SurveyQuestionData): this {
    const flatStep = this.step as Partial<SurveyFlatStep>
    if (!flatStep.questions) {
      flatStep.questions = []
    }
    flatStep.questions.push(question)
    return this
  }

  /**
   * Set all questions for this step (flat format)
   */
  questions(questions: SurveyQuestionData[]): this {
    (this.step as Partial<SurveyFlatStep>).questions = questions
    return this
  }

  /**
   * Build the step
   * @throws Error if required fields are missing or invalid
   */
  build(): SurveyStepUnion {
    if (!this.step.id) {
      throw new Error('Step must have an id')
    }

    if (!this.step.title) {
      throw new Error('Step must have a title')
    }

    // A step must have either pages or questions (not both, not neither)
    const hasPages = 'pages' in this.step && this.step.pages && this.step.pages.length > 0
    const hasQuestions = 'questions' in this.step && this.step.questions && this.step.questions.length > 0

    if (!hasPages && !hasQuestions) {
      throw new Error('Step must have either pages or questions')
    }

    if (hasPages && hasQuestions) {
      throw new Error('Step cannot have both pages and questions')
    }

    return this.step as SurveyStepUnion
  }
}
