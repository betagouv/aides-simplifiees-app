declare global {

  interface SurveyChoice {
    id: string
    title: string
    tooltip?: string
    exclusive?: boolean
  }

  interface SurveyQuestionAutocompleteConfig {
    placeholder?: string
    loadingText?: string
    noResultsText?: string
    errorTitle?: string
    errorDescription?: string
    minSearchLength?: number
  }

  type SurveyQuestionData = {
    id: string
    title: string
    description?: string
    placeholder?: string
    type: 'radio' | 'checkbox' | 'number' | 'date' | 'combobox' | 'boolean'
    visibleWhen?: string
    autocompleteFunction?: string
    autocompleteConfig?: SurveyQuestionAutocompleteConfig
    choices?: SurveyChoice[]
    min?: number
    max?: number
    step?: number
    default?: string | number | boolean
    required?: boolean
  } & (
    | {
      notion?: {
        id: string
        buttonLabel: string
      }
      tooltip: never
    }
    | {
      notion: never
      tooltip?: string | {
        buttonLabel?: string
        content: string
      }
    }
  )

  interface QuestionGroup {
    title: string
    questions: {
      id: string
      title: string
      answer?: unknown
      visible: boolean
    }[]
  }

  interface SurveyQuestionsPageData {
    id: string
    title?: string
    questions: SurveyQuestionData[]
  }

  interface SurveyResultsPageData {
    id: string
    title?: string
    type: 'intermediary-results'
    description: string
    dispositifs: string[]
  }

  type SurveyPageData = SurveyQuestionsPageData | SurveyResultsPageData

  interface SurveyStep {
    id: string
    title: string
  }

  interface SurveyFlatStep extends SurveyStep {
    questions: SurveyQuestionData[]
  }

  interface SurveyDeepStep extends SurveyStep {
    pages: SurveyPageData[]
  }

  interface SurveyTest {
    id: string
    description: string
    questionsToApi: string[]
    answers: SurveyAnswers
    results: SimulationResultsAides
  }

  interface SurveySchemaBase {
    id: string
    title: string
    version: string
    forceRefresh: boolean
    description: string
    steps: SurveyFlatStep[] | SurveyDeepStep[]
  }

  interface OpenFiscaSurveySchema extends SurveySchemaBase {
    engine: 'openfisca'
    questionsToApi: string[]
  }

  interface PublicodesSurveySchema extends SurveySchemaBase {
    engine: 'publicodes'
    dispositifs: { id: string, title: string, description: string }[]
  }

  type SurveySchema = OpenFiscaSurveySchema | PublicodesSurveySchema

  interface OpenFiscaNormalizedSchema extends Omit<OpenFiscaSurveySchema, 'steps'> {
    steps: SurveyDeepStep[]
  }

  interface PublicodesNormalizedSchema extends Omit<PublicodesSurveySchema, 'steps'> {
    steps: SurveyDeepStep[]
  }

  type SurveyNormalizedSchema = OpenFiscaNormalizedSchema | PublicodesNormalizedSchema

  // SurveyAnswers type is defined in answer.d.ts

  // Type guards for discriminating union types
  function isOpenFiscaSchema(schema: SurveySchema): schema is OpenFiscaSurveySchema {
    return schema.engine === 'openfisca'
  }

  function isPublicodesSchema(schema: SurveySchema): schema is PublicodesSurveySchema {
    return schema.engine === 'publicodes'
  }

  function isOpenFiscaNormalizedSchema(schema: SurveyNormalizedSchema): schema is OpenFiscaNormalizedSchema {
    return schema.engine === 'openfisca'
  }

  function isPublicodesNormalizedSchema(schema: SurveyNormalizedSchema): schema is PublicodesNormalizedSchema {
    return schema.engine === 'publicodes'
  }

  function isFlatStep(step: SurveyFlatStep | SurveyDeepStep): step is SurveyFlatStep {
    return 'questions' in step && step.questions !== undefined
  }

  function isDeepStep(step: SurveyFlatStep | SurveyDeepStep): step is SurveyDeepStep {
    return 'pages' in step && step.pages !== undefined
  }

  function isQuestionsPageData(page: SurveyPageData): page is SurveyQuestionsPageData {
    return 'questions' in page && page.questions !== undefined
  }

  function isResultsPageData(page: SurveyPageData): page is SurveyResultsPageData {
    return page.type === 'intermediary-results'
  }

  // Utility types for better developer experience
  type SurveyEngine = SurveySchema['engine']
  type SurveyStepUnion = SurveyFlatStep | SurveyDeepStep
  type SurveyQuestionType = SurveyQuestionData['type']

  // Helper type to extract question IDs from a schema
  type ExtractQuestionIds<T extends SurveyNormalizedSchema> = T extends any
    ? T['steps'][number]['pages'][number] extends SurveyQuestionsPageData
      ? T['steps'][number]['pages'][number]['questions'][number]['id']
      : never
    : never
}

export {}
