/**
 * Builder for creating survey pages with a fluent API
 */

import type { SurveyQuestionsPageData } from '../types/schema.js'
import type { SurveyQuestionData } from '../types/question.js'

/**
 * Builder for creating survey pages
 *
 * @example
 * ```typescript
 * const page = new PageBuilder('page1')
 *   .addQuestion(question1)
 *   .addQuestion(question2)
 *   .build()
 * ```
 */
export class PageBuilder {
  private page: Partial<SurveyQuestionsPageData> = {
    questions: [],
  }

  constructor(id: string) {
    this.page.id = id
  }

  /**
   * Add a question to this page
   */
  addQuestion(question: SurveyQuestionData): this {
    if (!this.page.questions) {
      this.page.questions = []
    }
    this.page.questions.push(question)
    return this
  }

  /**
   * Set all questions for this page
   */
  questions(questions: SurveyQuestionData[]): this {
    this.page.questions = questions
    return this
  }

  /**
   * Set page title
   */
  title(title: string): this {
    this.page.title = title
    return this
  }

  /**
   * Build the page
   * @throws Error if required fields are missing
   */
  build(): SurveyQuestionsPageData {
    if (!this.page.id) {
      throw new Error('Page must have an id')
    }

    if (!this.page.questions || this.page.questions.length === 0) {
      throw new Error('Page must have at least one question')
    }

    return this.page as SurveyQuestionsPageData
  }
}
