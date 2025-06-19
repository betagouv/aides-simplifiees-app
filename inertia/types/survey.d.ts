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

  type SurveyQuestion = {
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

  interface SurveyQuestionsPage {
    id: string
    title?: string
    questions: SurveyQuestion[]
  }

  interface SurveyResultsPage {
    id: string
    title?: string
    type: 'intermediary-results'
    description: string
    dispositifs: string[]
  }

  type SurveyPage = SurveyQuestionsPage | SurveyResultsPage

  interface SurveyStep {
    id: string
    title: string
  }

  interface SurveyFlatStep extends SurveyStep {
    questions: SurveyQuestion[]
  }

  interface SurveyDeepStep extends SurveyStep {
    pages: SurveyPage[]
  }

  interface SurveyTest {
    id: string
    description: string
    questionsToApi: string[]
    answers: Record<string, any>
    results: Record<string, any>
  }

  interface SurveySchema {
    version: string
    forceRefresh: boolean
    id: string
    title: string
    description: string
    intermediaryResults?: {
      dispositifs: { id: string, title: string, description: string }[]
    }
    steps: SurveyStepFlatStep[] | SurveyDeepStep[]
    tests?: SurveyTest[]
  }

  interface SurveyNormalizedSchema extends SurveySchema {
    steps: SurveyDeepStep[]
  }

  interface SurveyAnswers {
    [key: string]: string | string[] | number | boolean | undefined
  }

  interface SurveyResults {
    data: SimulationResultsAides
    meta: {
      createdAt: Date
    }
  }
}

export {}
