/**
 * Builder for creating survey questions with a fluent API
 */

import type {
  SurveyChoice,
  SurveyQuestionBoolean,
  SurveyQuestionCheckbox,
  SurveyQuestionCombobox,
  SurveyQuestionData,
  SurveyQuestionDate,
  SurveyQuestionNotion,
  SurveyQuestionNumber,
  SurveyQuestionRadio,
  SurveyQuestionTooltip,
} from '../types/question.js'

/**
 * Builder for creating survey questions
 *
 * @example
 * ```typescript
 * const question = new QuestionBuilder('age', 'number')
 *   .title('What is your age?')
 *   .description('Enter your age in years')
 *   .min(0)
 *   .max(120)
 *   .build()
 * ```
 */
export class QuestionBuilder {
  private question: Partial<SurveyQuestionData> = {}

  constructor(id: string, type: SurveyQuestionData['type']) {
    this.question = { id, type }
  }

  /**
   * Set the question title
   */
  title(title: string): this {
    this.question.title = title
    return this
  }

  /**
   * Set the question description
   */
  description(description: string): this {
    this.question.description = description
    return this
  }

  /**
   * Set visibility condition
   */
  visibleWhen(condition: string | string[]): this {
    this.question.visibleWhen = condition
    return this
  }

  /**
   * Set notion information
   */
  notion(notion: SurveyQuestionNotion): this {
    this.question.notion = notion
    return this
  }

  /**
   * Set tooltip
   */
  tooltip(tooltip: string | SurveyQuestionTooltip): this {
    this.question.tooltip = tooltip
    return this
  }

  /**
   * Build the question
   * @throws Error if required fields are missing
   */
  build(): SurveyQuestionData {
    if (!this.question.id || !this.question.type) {
      throw new Error('Question must have id and type')
    }

    if (!this.question.title) {
      throw new Error('Question must have a title')
    }

    return this.question as SurveyQuestionData
  }
}

/**
 * Builder for radio questions
 */
export class RadioQuestionBuilder extends QuestionBuilder {
  private radioData: Partial<SurveyQuestionRadio> = { type: 'radio' }

  constructor(id: string) {
    super(id, 'radio')
  }

  /**
   * Set choices for the radio question
   */
  choices(choices: SurveyChoice[]): this {
    this.radioData.choices = choices
    return this
  }

  /**
   * Add a single choice
   */
  addChoice(id: string, title: string): this {
    if (!this.radioData.choices) {
      this.radioData.choices = []
    }
    this.radioData.choices.push({ id, title })
    return this
  }

  override build(): SurveyQuestionRadio {
    if (!this.radioData.choices || this.radioData.choices.length === 0) {
      throw new Error('Radio question must have at least one choice')
    }

    return {
      ...super.build(),
      ...this.radioData,
    } as SurveyQuestionRadio
  }
}

/**
 * Builder for checkbox questions
 */
export class CheckboxQuestionBuilder extends QuestionBuilder {
  private checkboxData: Partial<SurveyQuestionCheckbox> = { type: 'checkbox' }

  constructor(id: string) {
    super(id, 'checkbox')
  }

  /**
   * Set choices for the checkbox question
   */
  choices(choices: SurveyChoice[]): this {
    this.checkboxData.choices = choices
    return this
  }

  /**
   * Add a single choice
   */
  addChoice(id: string, title: string): this {
    if (!this.checkboxData.choices) {
      this.checkboxData.choices = []
    }
    this.checkboxData.choices.push({ id, title })
    return this
  }

  override build(): SurveyQuestionCheckbox {
    if (!this.checkboxData.choices || this.checkboxData.choices.length === 0) {
      throw new Error('Checkbox question must have at least one choice')
    }

    return {
      ...super.build(),
      ...this.checkboxData,
    } as SurveyQuestionCheckbox
  }
}

/**
 * Builder for number questions
 */
export class NumberQuestionBuilder extends QuestionBuilder {
  private numberData: Partial<SurveyQuestionNumber> = { type: 'number' }

  constructor(id: string) {
    super(id, 'number')
  }

  /**
   * Set minimum value
   */
  min(min: number): this {
    this.numberData.min = min
    return this
  }

  /**
   * Set maximum value
   */
  max(max: number): this {
    this.numberData.max = max
    return this
  }

  override build(): SurveyQuestionNumber {
    return {
      ...super.build(),
      ...this.numberData,
    } as SurveyQuestionNumber
  }
}

/**
 * Builder for date questions
 */
export class DateQuestionBuilder extends QuestionBuilder {
  constructor(id: string) {
    super(id, 'date')
  }

  override build(): SurveyQuestionDate {
    return super.build() as SurveyQuestionDate
  }
}

/**
 * Builder for combobox questions
 */
export class ComboboxQuestionBuilder extends QuestionBuilder {
  constructor(id: string) {
    super(id, 'combobox')
  }

  override build(): SurveyQuestionCombobox {
    return super.build() as SurveyQuestionCombobox
  }
}

/**
 * Builder for boolean questions
 */
export class BooleanQuestionBuilder extends QuestionBuilder {
  constructor(id: string) {
    super(id, 'boolean')
  }

  override build(): SurveyQuestionBoolean {
    return super.build() as SurveyQuestionBoolean
  }
}
