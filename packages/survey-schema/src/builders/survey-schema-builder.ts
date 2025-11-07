/**
 * Builder for creating complete survey schemas with a fluent API
 */

import type {
  OpenFiscaSurveySchema,
  PublicodesSurveySchema,
  SurveySchema,
  SurveyStepUnion,
  SurveyTest,
} from '../types/schema.js'

/**
 * Builder for creating survey schemas
 *
 * @example
 * ```typescript
 * const schema = new SurveySchemaBuilder('my-survey', 'publicodes')
 *   .version('1.0.0')
 *   .title('My Survey')
 *   .description('A survey about...')
 *   .dispositifs(['aide-1', 'aide-2'])
 *   .addStep(step1)
 *   .addStep(step2)
 *   .build()
 * ```
 */
export class SurveySchemaBuilder {
  private schema: Partial<SurveySchema> = {}
  private readonly engine: 'openfisca' | 'publicodes'

  constructor(id: string, engine: 'openfisca' | 'publicodes' = 'publicodes') {
    this.schema.id = id
    this.schema.engine = engine
    this.engine = engine
    this.schema.steps = []
  }

  /**
   * Set the schema version
   */
  version(version: string): this {
    this.schema.version = version
    return this
  }

  /**
   * Set the schema title
   */
  title(title: string): this {
    this.schema.title = title
    return this
  }

  /**
   * Set the schema description
   */
  description(description: string): this {
    this.schema.description = description
    return this
  }

  /**
   * Add a step to the schema
   */
  addStep(step: SurveyStepUnion): this {
    if (!this.schema.steps) {
      this.schema.steps = []
    }
    // Use any to bypass union type issues
    ;(this.schema.steps as any[]).push(step)
    return this
  }

  /**
   * Set all steps for the schema
   */
  steps(steps: SurveyStepUnion[]): this {
    this.schema.steps = steps as any
    return this
  }

  /**
   * Set forceRefresh flag
   */
  forceRefresh(value: boolean): this {
    this.schema.forceRefresh = value
    return this
  }

  /**
   * Set dispositifs (for publicodes engine)
   */
  dispositifs(dispositifs: string[]): this {
    if (this.engine === 'publicodes') {
      (this.schema as any).dispositifs = dispositifs
    }
    return this
  }

  /**
   * Set questionsToApi (for openfisca engine)
   */
  questionsToApi(questions: string[]): this {
    if (this.engine === 'openfisca') {
      (this.schema as any).questionsToApi = questions
    }
    return this
  }

  /**
   * Add a test case
   */
  addTest(test: SurveyTest): this {
    const schemaWithTests = this.schema as any
    if (!schemaWithTests.tests) {
      schemaWithTests.tests = []
    }
    schemaWithTests.tests.push(test)
    return this
  }

  /**
   * Set all test cases
   */
  tests(tests: SurveyTest[]): this {
    (this.schema as any).tests = tests
    return this
  }

  /**
   * Build the survey schema
   * @throws Error if required fields are missing
   */
  build(): SurveySchema {
    if (!this.schema.id) {
      throw new Error('Schema must have an id')
    }

    if (!this.schema.version) {
      throw new Error('Schema must have a version')
    }

    if (!this.schema.title) {
      throw new Error('Schema must have a title')
    }

    if (!this.schema.engine) {
      throw new Error('Schema must have an engine')
    }

    if (!this.schema.steps || this.schema.steps.length === 0) {
      throw new Error('Schema must have at least one step')
    }

    // Validate engine-specific requirements
    if (this.engine === 'publicodes') {
      const publicodesSchema = this.schema as Partial<PublicodesSurveySchema>
      if (!publicodesSchema.dispositifs) {
        throw new Error('Publicodes schema must have dispositifs array')
      }
    }

    if (this.engine === 'openfisca') {
      const openfiscaSchema = this.schema as Partial<OpenFiscaSurveySchema>
      if (!openfiscaSchema.questionsToApi) {
        throw new Error('OpenFisca schema must have questionsToApi array')
      }
    }

    return this.schema as SurveySchema
  }
}
