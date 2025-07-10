import { ref } from 'vue'
import { useMatomoTracking } from '~/composables/use_matomo_tracking'
import { useSurveySchemaManager } from '~/composables/use_survey_schema_manager'
import { useSurveyDebugStore } from '~/stores/survey_debug'
import { evaluateCondition } from '~/utils/evaluate_conditions'
import { isAnswerValid } from '~/utils/form_validation'

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

    /**
     * Answers related methods
     */
    const getAnswers = (simulateurSlug: string): SurveyAnswers => {
      const currentAnswers = answers.value[simulateurSlug]
      return currentAnswers ?? {}
    }

    const getAnswersForCalculation = (simulateurSlug: string): SurveyAnswers => {
      const currentAnswers = getAnswers(simulateurSlug)
      return Object.entries(currentAnswers)
        .filter(([questionId, answer]) => {
          const question = findQuestionById(simulateurSlug, questionId)
          if (!question) {
            return false
          }
          // Check if the question is visible
          const isVisible = isQuestionVisible(simulateurSlug, questionId)
          return isVisible && answer !== undefined
        })
        .reduce((acc, [questionId, answer]) => {
          const question = findQuestionById(simulateurSlug, questionId)
          if (question?.type === 'combobox') {
            // If the question is a combobox, parse the answer
            try {
              const parsedAnswer = JSON.parse(answer as string)
              acc[questionId] = parsedAnswer.value
            }
            catch (error) {
              debug.warn(
                `[Surveys store][${simulateurSlug}] Error parsing combobox answer for ${questionId}:`,
                error,
              )
            }
          }
          else {
            acc[questionId] = answer
          }
          return acc
        }, {} as SurveyAnswers)
    }

    const hasAnswers = (simulateurSlug: string): boolean => {
      const currentAnswers = getAnswers(simulateurSlug)
      return Object.keys(currentAnswers).length > 0
    }

    const getAnswer = (simulateurSlug: string, questionId: string): any => {
      const currentAnswers = getAnswers(simulateurSlug)
      const answer = currentAnswers[questionId]
      if (answer === undefined) {
        // debug.warn(`[Surveys store][${simulateurSlug}] Answer not found for ${questionId}`)
        return null
      }
      // debug.log(`[Surveys store][${simulateurSlug}] Answer for ${questionId}:`, answer)
      return answer
    }

    const hasAnswer = (simulateurSlug: string, questionId: string): boolean => {
      const currentAnswers = getAnswers(simulateurSlug)
      const answer = currentAnswers[questionId]
      if (answer === undefined) {
        // debug.warn(`[Surveys store][${simulateurSlug}] Answer not found for ${questionId}`)
        return false
      }
      // debug.log(`[Surveys store][${simulateurSlug}] Answer for ${questionId}:`, answer)
      return true
    }

    function setAnswer(simulateurSlug: string, questionId: string, value: any) {
      // Initialize answers object for this simulateur if it doesn't exist
      if (!answers.value[simulateurSlug]) {
        answers.value[simulateurSlug] = {}
      }

      answers.value[simulateurSlug][questionId] = value

      debug.log(`[Surveys store][${simulateurSlug}] Answer set for ${questionId}:`, value)

      // Track the answer in analytics
      const question = findQuestionById(simulateurSlug, questionId)
      if (question && enableMatomo) {
        matomo?.trackSurveyAnswer(simulateurSlug, questionId, question.title)
      }
    }

    const formatAnswer = (simulateurSlug: string, questionId: string, value: any): string => {
      // get choice title
      const question = findQuestionById(simulateurSlug, questionId)
      if (question) {
        switch (question.type) {
          case 'boolean': {
            return value ? 'Oui' : 'Non'
          }
          case 'number': {
            return value?.toString() ?? ''
          }
          case 'checkbox': {
            const choices = question.choices
              ?.filter((choice) => {
                return value.includes(choice.id)
              })
              .map((choice) => {
                return choice.title
              })
            return choices?.join(', ') ?? ''
          }
          case 'combobox': {
            return JSON.parse(value)?.text
          }
        }
        const choice = question.choices?.find((c) => {
          return c.id === value
        })
        if (choice?.title) {
          return choice.title
        }
      }
      return getAnswer(simulateurSlug, questionId)
    }

    /**
     * Page related methods
     */

    function getCurrentPageId(simulateurSlug: string): string | null {
      const id = currentPageIds.value[simulateurSlug] || null
      if (id === null) {
        debug.warn(`[Surveys store][${simulateurSlug}] No current page ID found, setting to first page`)
        setFirstPage(simulateurSlug)
      }
      return currentPageIds.value[simulateurSlug] || null
    }

    function setCurrentPageId(simulateurSlug: string, pageId: string) {
      currentPageIds.value[simulateurSlug] = pageId
      debug.log(`[Surveys store][${simulateurSlug}] Current question ID set to:`, pageId)
    }

    const getCurrentPage = (simulateurSlug: string): SurveyPageData | null => {
      const currentSchema = getSchema(simulateurSlug)
      const currentPageId = getCurrentPageId(simulateurSlug)

      if (!currentSchema || !currentPageId) {
        return null
      }

      const allPages = getAllPages(simulateurSlug)
      const currentPage = allPages
        ?.find(page => page.id === currentPageId)
      return currentPage ?? null
    }

    function getAllPages(simulateurSlug: string): SurveyPageData[] {
      const currentSchema = getSchema(simulateurSlug)
      if (!currentSchema) {
        return []
      }

      return currentSchema.steps.flatMap(step => step.pages || [])
    }

    function getAllQuestionsPages(simulateurSlug: string): SurveyQuestionsPageData[] {
      const allPages = getAllPages(simulateurSlug)
      const questionsPages = allPages
        .filter((page) => {
          return (page as SurveyQuestionsPageData).questions !== undefined
        })
      return questionsPages as SurveyQuestionsPageData[]
    }

    function setFirstPage(simulateurSlug: string) {
      const allPages = getAllQuestionsPages(simulateurSlug)
      const firstPage = allPages
        .find((page) => {
          return page.questions
            ?.some((question) => {
              return isQuestionVisible(simulateurSlug, question.id)
            })
        })

      if (firstPage) {
        setCurrentPageId(simulateurSlug, firstPage.id)
      }
    }

    const getNextVisiblePage = (simulateurSlug: string): SurveyPageData | null => {
      const currentPage = getCurrentPage(simulateurSlug)
      if (!currentPage) {
        return null
      }

      const allPages = getAllPages(simulateurSlug)
      const currentIndex = allPages.findIndex(page => page.id === currentPage.id)

      if (currentIndex === -1) {
        return null
      }

      // Look for the next visible page
      for (let i = currentIndex + 1; i < allPages.length; i++) {
        const nextPage = allPages[i]
        // A page is visible if any of its questions are visible OR if it is an intermediary results page
        if ((nextPage as SurveyResultsPageData).type === 'intermediary-results') {
          debug.log(`[Surveys store][${simulateurSlug}] Next visible page: ${nextPage.id}`)
          return nextPage
        }
        const hasVisibleQuestion = (nextPage as SurveyQuestionsPageData)
          ?.questions
          .some((q) => {
            return isQuestionVisible(simulateurSlug, q.id)
          }) ?? false

        if (hasVisibleQuestion) {
          debug.log(`[Surveys store][${simulateurSlug}] Next visible page: ${nextPage.id}`)
          return nextPage
        }
      }

      return null
    }

    const getPreviousVisiblePage = (simulateurSlug: string): SurveyPageData | null => {
      const currentPage = getCurrentPage(simulateurSlug)
      if (!currentPage) {
        return null
      }

      const allPages = getAllPages(simulateurSlug)
      const currentIndex = allPages.findIndex(page => page.id === currentPage.id)

      if (currentIndex === -1) {
        return null
      }

      // Look for the previous visible page
      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevPage = allPages[i]
        // A page is visible if any of its questions are visible OR if it is an intermediary results page
        if ((prevPage as SurveyResultsPageData).type === 'intermediary-results') {
          debug.log(`[Surveys store][${simulateurSlug}] Previous visible page: ${prevPage.id}`)
          return prevPage
        }
        const hasVisibleQuestion = (prevPage as SurveyQuestionsPageData)
          ?.questions
          .some((q) => {
            return isQuestionVisible(simulateurSlug, q.id)
          }) ?? false
        if (hasVisibleQuestion) {
          debug.log(`[Surveys store][${simulateurSlug}] Previous visible page: ${prevPage.id}`)
          return prevPage
        }
      }

      return null
    }

    const isFirstPage = (simulateurSlug: string): boolean => {
      return getPreviousVisiblePage(simulateurSlug) === null
    }

    const isLastPage = (simulateurSlug: string): boolean => {
      return getNextVisiblePage(simulateurSlug) === null
    }

    function goToNextPage(simulateurSlug: string) {
      const nextPage = getNextVisiblePage(simulateurSlug)
      if (nextPage) {
        setCurrentPageId(simulateurSlug, nextPage.id)
        return true
      }
      return false
    }

    function goToPreviousPage(simulateurSlug: string) {
      const prevPage = getPreviousVisiblePage(simulateurSlug)
      if (prevPage) {
        setCurrentPageId(simulateurSlug, prevPage.id)
        return true
      }
      return false
    }

    function setCurrentPageFromQuestionId(simulateurSlug: string, questionId: string) {
      const question = findQuestionById(simulateurSlug, questionId)
      if (question) {
        const page = getAllQuestionsPages(simulateurSlug)
          .find((p) => {
            return p.questions
              ?.some((q) => {
                return q.id === questionId
              })
          })
        if (page) {
          setCurrentPageId(simulateurSlug, page.id)
        }
      }
    }

    /**
     * Question related methods
     */

    function getQuestions(simulateurSlug: string): SurveyQuestionData[] {
      const currentSchema = getSchema(simulateurSlug)
      const questions = currentSchema
        ?.steps
        .flatMap((step) => {
          return step.pages.flatMap(page => ((page as SurveyQuestionsPageData).questions ?? []))
        })
      return questions ?? []
    }

    function findQuestionById(simulateurSlug: string, questionId: string): SurveyQuestionData | null {
      const questions = getQuestions(simulateurSlug)
      const question = questions
        .find((q) => {
          return q.id === questionId
        })
      return question ?? null
    }

    function isQuestionVisible(simulateurSlug: string, questionId: string): boolean {
      const question = findQuestionById(simulateurSlug, questionId)
      const currentAnswers = getAnswers(simulateurSlug)

      if (!question) {
        return false
      }

      // If the question has a visibility condition, evaluate it
      if (question.visibleWhen) {
        // Handle both string and array formats for visibleWhen
        if (Array.isArray(question.visibleWhen)) {
          // If it's an array, evaluate all conditions with AND logic
          const isVisible = question.visibleWhen.every(condition =>
            evaluateCondition(condition, currentAnswers),
          )
          return isVisible
        }
        else {
          // Single condition as a string (existing behavior)
          const isVisible = evaluateCondition(question.visibleWhen, currentAnswers)
          return isVisible
        }
      }

      // By default, a question is visible
      return true
    }

    function getGroupedQuestions(simulateurSlug: string): QuestionGroup[] {
      const steps = getAllSteps(simulateurSlug)
      const groupedQuestions = steps
        .map((step) => {
          const questions = step.pages
            .flatMap((page) => {
              return (page as SurveyQuestionsPageData)
                .questions
                ?.map((question) => {
                  return {
                    id: question.id,
                    title: question.title,
                    answer: getAnswer(simulateurSlug, question.id),
                    visible: isQuestionVisible(simulateurSlug, question.id),
                  }
                }) ?? []
            })
          return {
            title: step.title,
            questions,
          }
        })
      return groupedQuestions
    }

    function getGroupedVisibleQuestions(simulateurSlug: string): QuestionGroup[] {
      const steps = getAllSteps(simulateurSlug)
      const groupedQuestions = steps
        .map((step) => {
          const questions = step.pages
            .flatMap((page) => {
              return (page as SurveyQuestionsPageData)
                .questions
                ?.map((question) => {
                  return {
                    id: question.id,
                    title: question.title,
                    answer: getAnswer(simulateurSlug, question.id),
                    visible: isQuestionVisible(simulateurSlug, question.id),
                  }
                })
                ?.filter((question) => {
                  return question.visible
                }) ?? []
            })
          return {
            title: step.title,
            questions,
          }
        })
      return groupedQuestions
    }

    function getVisibleQuestions(simulateurSlug: string): SurveyQuestionData[] {
      const questions = getQuestions(simulateurSlug)
      const visibleQuestions = questions
        .filter((question) => {
          return isQuestionVisible(simulateurSlug, question.id)
        })
      return visibleQuestions
    }

    function isQuestionInCurrentPage(simulateurSlug: string, questionId: string): boolean {
      const currentPage = getCurrentPage(simulateurSlug)
      if (!currentPage) {
        return false
      }
      const isInCurrentPage = (currentPage as SurveyQuestionsPageData)
        .questions
        ?.some((q) => {
          return q.id === questionId
        })
      return isInCurrentPage ?? false
    }

    function areAllRequiredQuestionsAnswered(simulateurSlug: string): boolean {
      const visibleQuestions = getVisibleQuestions(simulateurSlug)
      const areAllAnswered = visibleQuestions
        .filter((question) => {
          // Only consider questions that are explicitly required (default to true if not specified)
          return question.required !== false
        })
        .every((question) => {
          return hasAnswer(simulateurSlug, question.id)
        })
      return areAllAnswered
    }

    function getVisibleQuestionsInCurrentPage(simulateurSlug: string): SurveyQuestionData[] {
      const currentPage = getCurrentPage(simulateurSlug)
      if (!currentPage) {
        return []
      }
      const questions = (currentPage as SurveyQuestionsPageData)
        ?.questions
        ?.filter((question) => {
          return isQuestionVisible(simulateurSlug, question.id)
        })
      return questions ?? []
    }

    function areAllQuestionsInPageValid(simulateurSlug: string): boolean {
      const visibleQuestions = getVisibleQuestionsInCurrentPage(simulateurSlug)
      const areAllValid = visibleQuestions
        .every((question) => {
          return isAnswerValid(question, getAnswer(simulateurSlug, question.id))
        })
      return areAllValid
    }

    /**
     * Step related methods
     */

    function getAllSteps(simulateurSlug: string): SurveyDeepStep[] {
      const currentSchema = getSchema(simulateurSlug)
      return currentSchema?.steps ?? []
    }

    function getCurrentStep(simulateurSlug: string): SurveyDeepStep | null {
      const steps = getAllSteps(simulateurSlug)
      const currentPageId = getCurrentPageId(simulateurSlug)
      const currentStep = steps
        .find((step) => {
          return step.pages
            ?.some((p) => {
              return p.id === currentPageId
            })
        })
      return currentStep ?? null
    }

    const getCurrentStepId = (simulateurSlug: string): string | null => {
      const step = getCurrentStep(simulateurSlug)
      return step?.id ?? null
    }

    const getCurrentStepIndex = (simulateurSlug: string): number | null => {
      const step = getCurrentStep(simulateurSlug)
      const steps = getAllSteps(simulateurSlug)
      const stepIndex = steps
        .findIndex((s) => {
          return s.id === step?.id
        })

      if (stepIndex === -1) {
        return null
      }

      return stepIndex
    }

    /**
     * Progress related methods
     */

    const getProgress = (simulateurSlug: string): number => {
      const currentSchema = getSchema(simulateurSlug)
      const currentAnswers = getAnswers(simulateurSlug)

      if (!currentSchema) {
        return 0
      }

      const questions = getQuestions(simulateurSlug)

      // Count all visible questions
      let visibleQuestionsCount
        = questions.filter((question) => {
          return isQuestionVisible(simulateurSlug, question.id)
        }).length ?? 0

      // If there are no visible questions (unlikely but possible), use total questions count
      if (visibleQuestionsCount === 0) {
        visibleQuestionsCount = questions.length
      }

      // Count answered questions - but only count those that are visible
      const answeredVisibleQuestionsCount = Object.keys(currentAnswers).filter((questionId) => {
        return isQuestionVisible(simulateurSlug, questionId)
      }).length

      return Math.min(
        Math.round((answeredVisibleQuestionsCount / visibleQuestionsCount) * 100),
        100,
      )
    }

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

    /**
     * Right now cannot be used because simulateurSlug is unkown on unmount
     */
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
      answers,
      schemaStatus,
      currentPageIds,
      versions,
      getVisibleQuestionsInCurrentPage,
      areAllQuestionsInPageValid,
      deleteCompleteListeners,
      areAllRequiredQuestionsAnswered,
      getSchema,
      getSchemaStatus,
      loadSchema,
      getQuestions,
      hasAnswers,
      getAnswers,
      getAnswersForCalculation,
      getAnswer,
      hasAnswer,
      setAnswer,
      formatAnswer,
      getCurrentStep,
      getCurrentStepId,
      getCurrentStepIndex,
      getCurrentPage,
      getCurrentPageId,
      getNextVisiblePage,
      getPreviousVisiblePage,
      isFirstPage,
      isLastPage,
      getGroupedQuestions,
      getGroupedVisibleQuestions,
      isQuestionInCurrentPage,
      resetSurvey,
      setFirstPage,
      goToNextPage,
      goToPreviousPage,
      getProgress,
      setShowChoiceScreen,
      getShowChoiceScreen,
      getShowWelcomeScreen,
      setShowWelcomeScreen,
      setCurrentPageId,
      setCurrentPageFromQuestionId,
      onComplete,
      offComplete,
      tryComplete,
      isQuestionVisible,
      findQuestionById,
    }
  }
}
