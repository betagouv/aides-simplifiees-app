import { ref } from 'vue'
import { useSurveyAnswers } from '~/composables/surveys/use_survey_answers'
import { useSurveyFormatting } from '~/composables/surveys/use_survey_formatting'
import { useSurveyNavigation } from '~/composables/surveys/use_survey_navigation'
import { useSurveyQuestions } from '~/composables/surveys/use_survey_questions'
import { useSurveyValidation } from '~/composables/surveys/use_survey_validation'
import { useSurveyVisibility } from '~/composables/surveys/use_survey_visibility'
import { useMatomoTracking } from '~/composables/use_matomo_tracking'
import { useSurveySchemaManager } from '~/composables/use_survey_schema_manager'
import { useSurveyDebugStore } from '~/stores/survey_debug'

export function useSurveysStoreDefiner({ enableMatomo = false } = {}) {
  return () => {
    /**
     * State
     */
    const answers = ref<{ [simulateurSlug: string]: SurveyAnswers }>({})
    const currentPageIds = ref<{ [simulateurSlug: string]: string | null }>({})

    /**
     * Composables
     */
    const matomo = enableMatomo ? useMatomoTracking() : null
    const { debug } = useSurveyDebugStore()

    const {
      versions,
      schemaStatus,
      loadSchema,
      getSchema,
      getSchemaStatus,
    } = useSurveySchemaManager({
      onNewSchema: (simulateurSlug) => {
        if (simulateurSlug) {
          resetSurvey(simulateurSlug)
        }
      },
    })

    // Extract question utilities first (no dependencies)
    const questionsComposable = useSurveyQuestions({ getSchema })
    const { getQuestions, findQuestionById } = questionsComposable

    // Extract visibility (depends on findQuestionById, getQuestions)
    // We need to initialize this before answers because answers needs isQuestionVisible
    const visibilityComposable = useSurveyVisibility({
      getAnswers: slug => answers.value[slug] ?? {},
      findQuestionById,
      getQuestions,
    })
    const { isQuestionVisible, getVisibleQuestions } = visibilityComposable

    // Extract answer management (depends on findQuestionById, isQuestionVisible)
    const answersComposable = useSurveyAnswers({
      answers,
      findQuestionById,
      isQuestionVisible,
      matomo,
    })
    const {
      getAnswers,
      getAnswersForCalculation,
      hasAnswers,
      getAnswer,
      hasAnswer,
      setAnswer,
    } = answersComposable

    // Extract formatting (depends on getAnswer, findQuestionById)
    const formattingComposable = useSurveyFormatting({
      getAnswer,
      findQuestionById,
    })
    const { formatAnswer } = formattingComposable

    // Extract navigation (depends on multiple composables)
    const navigationComposable = useSurveyNavigation({
      currentPageIds,
      getSchema,
      isQuestionVisible,
      findQuestionById,
      getAnswers,
      getAnswer,
    })
    const {
      getCurrentPageId,
      setCurrentPageId,
      getCurrentPage,
      setFirstPage,
      getNextVisiblePage,
      getPreviousVisiblePage,
      isFirstPage,
      isLastPage,
      goToNextPage,
      goToPreviousPage,
      setCurrentPageFromQuestionId,
      isQuestionInCurrentPage,
      getAllSteps,
      getCurrentStep,
      getCurrentStepId,
      getCurrentStepIndex,
      getGroupedQuestions,
      getGroupedVisibleQuestions,
      getProgress,
    } = navigationComposable

    // Extract validation (depends on multiple composables)
    const validationComposable = useSurveyValidation({
      getAnswer,
      hasAnswer,
      getCurrentPage,
      getVisibleQuestions,
      isQuestionVisible,
    })
    const {
      getVisibleQuestionsInCurrentPage,
      areAllQuestionsInPageValid,
      areAllRequiredQuestionsAnswered,
    } = validationComposable

    /**
     * Global survey related methods
     */

    function resetSurvey(simulateurSlug: string) {
      debug.log(`[Surveys store][${simulateurSlug}] Resetting survey...`)
      answers.value[simulateurSlug] = {}

      // Reset to first category/question
      setFirstPage(simulateurSlug)
    }

    // Welcome screen
    const showWelcomeScreen = ref<{ [simulateurSlug: string]: boolean }>({})
    function getShowWelcomeScreen(simulateurSlug: string): boolean {
      return showWelcomeScreen.value[simulateurSlug] ?? true
    }
    function setShowWelcomeScreen(simulateurSlug: string, value: boolean) {
      showWelcomeScreen.value[simulateurSlug] = value
    }

    // Choice screen
    const showChoiceScreen = ref<{ [simulateurSlug: string]: boolean }>({})
    function getShowChoiceScreen(simulateurSlug: string): boolean {
      return showChoiceScreen.value[simulateurSlug] ?? true
    }
    function setShowChoiceScreen(simulateurSlug: string, value: boolean) {
      showChoiceScreen.value[simulateurSlug] = value
    }

    /**
     * Event listeners / emitters
     */
    const completeListeners = ref<{ [simulateurSlug: string]: Set<(simulateurSlug: string) => void> }>(
      {},
    )

    function onComplete(simulateurSlug: string, listener: () => void) {
      if (!completeListeners.value[simulateurSlug]) {
        completeListeners.value[simulateurSlug] = new Set()
      }
      completeListeners.value[simulateurSlug].add(listener)
    }

    function offComplete(simulateurSlug: string, listener: () => void) {
      if (completeListeners.value[simulateurSlug]) {
        completeListeners.value[simulateurSlug].delete(listener)
      }
    }

    function deleteCompleteListeners() {
      Object.keys(completeListeners.value).forEach((id) => {
        completeListeners.value[id].clear()
      })
    }

    function tryComplete(simulateurSlug: string) {
      // Check if all questions are answered
      // We might need better form validation later
      const allAnswered = areAllRequiredQuestionsAnswered(simulateurSlug)

      if (allAnswered) {
        // Trigger completion event
        completeListeners.value[simulateurSlug]?.forEach((listener) => {
          listener(simulateurSlug)
        })

        debug.log(`[Surveys store][${simulateurSlug}] Survey completed!`)
      }
    }

    return {
      // State
      answers,
      schemaStatus,
      currentPageIds,
      versions,
      // Schema
      getSchema,
      getSchemaStatus,
      loadSchema,
      // Questions
      getQuestions,
      findQuestionById,
      isQuestionVisible,
      getVisibleQuestions,
      // Answers
      hasAnswers,
      getAnswers,
      getAnswersForCalculation,
      getAnswer,
      hasAnswer,
      setAnswer,
      formatAnswer,
      // Steps
      getAllSteps,
      getCurrentStep,
      getCurrentStepId,
      getCurrentStepIndex,
      // Pages
      getCurrentPage,
      getCurrentPageId,
      getNextVisiblePage,
      getPreviousVisiblePage,
      isFirstPage,
      isLastPage,
      setFirstPage,
      setCurrentPageId,
      setCurrentPageFromQuestionId,
      goToNextPage,
      goToPreviousPage,
      isQuestionInCurrentPage,
      // Grouped questions
      getGroupedQuestions,
      getGroupedVisibleQuestions,
      // Validation
      getVisibleQuestionsInCurrentPage,
      areAllQuestionsInPageValid,
      areAllRequiredQuestionsAnswered,
      // Progress
      getProgress,
      // Survey management
      resetSurvey,
      setShowChoiceScreen,
      getShowChoiceScreen,
      getShowWelcomeScreen,
      setShowWelcomeScreen,
      // Completion
      onComplete,
      offComplete,
      deleteCompleteListeners,
      tryComplete,
    }
  }
}
