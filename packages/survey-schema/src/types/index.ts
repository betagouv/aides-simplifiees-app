/**
 * Main types export file
 * Re-exports all type definitions for easy consumption
 */

// Answer types
export type {
  ComboboxAnswer,
  SurveyAnswers,
  SurveyAnswerValue,
} from './answer.js'

export {
  isAnswerDefined,
  isBooleanAnswer,
  isCheckboxAnswer,
  isComboboxAnswer,
  isNumberAnswer,
  isStringAnswer,
} from './answer.js'

// Question types
export type {
  SurveyChoice,
  SurveyQuestionAutocompleteConfig,
  SurveyQuestionBase,
  SurveyQuestionBoolean,
  SurveyQuestionCheckbox,
  SurveyQuestionCombobox,
  SurveyQuestionData,
  SurveyQuestionDate,
  SurveyQuestionNotion,
  SurveyQuestionNumber,
  SurveyQuestionRadio,
  SurveyQuestionTooltip,
  SurveyQuestionType,
} from './question.js'

export {
  isBooleanQuestion,
  isCheckboxQuestion,
  isComboboxQuestion,
  isDateQuestion,
  isNumberQuestion,
  isRadioQuestion,
} from './question.js'

// Schema types
export type {
  ExtractQuestionIds,
  OpenFiscaNormalizedSchema,
  OpenFiscaSurveySchema,
  PublicodesDispositif,
  PublicodesNormalizedSchema,
  PublicodesSurveySchema,
  QuestionGroup,
  SurveyDeepStep,
  SurveyEngine,
  SurveyFlatStep,
  SurveyNormalizedSchema,
  SurveyPageData,
  SurveyQuestionsPageData,
  SurveyResultsPageData,
  SurveySchema,
  SurveySchemaBase,
  SurveyStep,
  SurveyStepUnion,
  SurveyTest,
} from './schema.js'

export {
  isDeepStep,
  isFlatStep,
  isOpenFiscaNormalizedSchema,
  isOpenFiscaSchema,
  isPublicodesNormalizedSchema,
  isPublicodesSchema,
  isQuestionsPageData,
  isResultsPageData,
} from './schema.js'
