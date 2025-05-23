import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMatomo } from '~/composables/use_matomo'
import { useSurveySchemaManager } from '~/composables/use_survey_schema_manager'
import { useSurveyDebugStore } from '~/stores/survey_debug'
import { evaluateCondition } from '~/utils/evaluate_conditions'
import { isAnswerValid } from '~/utils/form_validation'

export const useSurveysStore = defineStore(
  'surveys',
  () => {
    /**
     * State
     */
    const answers = ref<{ [simulateurId: string]: SurveyAnswers }>({})
    const currentPageIds = ref<{ [simulateurId: string]: string | null }>({})

    /**
     * Composables
     */
    const matomo = useMatomo()
    const { debug } = useSurveyDebugStore()

    const {
      versions,
      loadSchema,
      getSchema,
      getSchemaStatus,
    } = useSurveySchemaManager({
      onNewSchema: (simulateurId) => {
        if (simulateurId) {
          resetSurvey(simulateurId)
        }
      },
    })

    /**
     * Answers related methods
     */
    const getAnswers = (simulateurId: string): SurveyAnswers => {
      const currentAnswers = answers.value[simulateurId]
      return currentAnswers ?? {}
    }

    const getAnswersForCalculation = (simulateurId: string): SurveyAnswers => {
      const currentAnswers = getAnswers(simulateurId)
      return Object.entries(currentAnswers)
        .filter(([questionId, answer]) => {
          const question = findQuestionById(simulateurId, questionId)
          if (!question) {
            return false
          }
          // Check if the question is visible
          const isVisible = isQuestionVisible(simulateurId, questionId)
          return isVisible && answer !== undefined
        })
        .reduce((acc, [questionId, answer]) => {
          const question = findQuestionById(simulateurId, questionId)
          if (question?.type === 'combobox') {
            // If the question is a combobox, parse the answer
            try {
              const parsedAnswer = JSON.parse(answer as string)
              acc[questionId] = parsedAnswer.value
            }
            catch (error) {
              debug.warn(
                `[Surveys store][${simulateurId}] Error parsing combobox answer for ${questionId}:`,
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

    const hasAnswers = (simulateurId: string): boolean => {
      const currentAnswers = getAnswers(simulateurId)
      return Object.keys(currentAnswers).length > 0
    }

    const getAnswer = (simulateurId: string, questionId: string): any => {
      const currentAnswers = getAnswers(simulateurId)
      const answer = currentAnswers[questionId]
      if (answer === undefined) {
        // debug.warn(`[Surveys store][${simulateurId}] Answer not found for ${questionId}`)
        return null
      }
      // debug.log(`[Surveys store][${simulateurId}] Answer for ${questionId}:`, answer)
      return answer
    }

    const hasAnswer = (simulateurId: string, questionId: string): boolean => {
      const currentAnswers = getAnswers(simulateurId)
      const answer = currentAnswers[questionId]
      if (answer === undefined) {
        // debug.warn(`[Surveys store][${simulateurId}] Answer not found for ${questionId}`)
        return false
      }
      // debug.log(`[Surveys store][${simulateurId}] Answer for ${questionId}:`, answer)
      return true
    }

    function setAnswer(simulateurId: string, questionId: string, value: any) {
      // Initialize answers object for this simulateur if it doesn't exist
      if (!answers.value[simulateurId]) {
        answers.value[simulateurId] = {}
      }

      answers.value[simulateurId][questionId] = value

      debug.log(`[Surveys store][${simulateurId}] Answer set for ${questionId}:`, value)

      // Track the answer in analytics
      const question = findQuestionById(simulateurId, questionId)
      if (question) {
        matomo.trackSurveyAnswer(simulateurId, questionId, question.title)
      }
    }

    const formatAnswer = (simulateurId: string, questionId: string, value: any): string => {
      // get choice title
      const question = findQuestionById(simulateurId, questionId)
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
      return getAnswer(simulateurId, questionId)
    }

    /**
     * Page related methods
     */

    function getCurrentPageId(simulateurId: string): string | null {
      const id = currentPageIds.value[simulateurId] || null
      if (id === null) {
        debug.warn(`[Surveys store][${simulateurId}] No current page ID found, setting to first page`)
        setFirstPage(simulateurId)
      }
      return currentPageIds.value[simulateurId] || null
    }

    function setCurrentPageId(simulateurId: string, pageId: string) {
      currentPageIds.value[simulateurId] = pageId
      debug.log(`[Surveys store][${simulateurId}] Current question ID set to:`, pageId)
    }

    const getCurrentPage = (simulateurId: string): SurveyPage | null => {
      const currentSchema = getSchema(simulateurId)
      const currentPageId = getCurrentPageId(simulateurId)

      if (!currentSchema || !currentPageId) {
        return null
      }

      const allPages = getAllPages(simulateurId)
      const currentPage = allPages
        ?.find(page => page.id === currentPageId)
      return currentPage ?? null
    }

    function getAllPages(simulateurId: string): SurveyPage[] {
      const currentSchema = getSchema(simulateurId)
      if (!currentSchema) {
        return []
      }

      return currentSchema.steps.flatMap(step => step.pages || [])
    }

    function getAllQuestionsPages(simulateurId: string): SurveyQuestionsPage[] {
      const allPages = getAllPages(simulateurId)
      const questionsPages = allPages
        .filter((page) => {
          return (page as SurveyQuestionsPage).questions !== undefined
        })
      return questionsPages as SurveyQuestionsPage[]
    }

    function setFirstPage(simulateurId: string) {
      const allPages = getAllQuestionsPages(simulateurId)
      const firstPage = allPages
        .find((page) => {
          return page.questions
            ?.some((question) => {
              return isQuestionVisible(simulateurId, question.id)
            })
        })

      if (firstPage) {
        setCurrentPageId(simulateurId, firstPage.id)
      }
    }

    const getNextVisiblePage = (simulateurId: string): SurveyPage | null => {
      const currentPage = getCurrentPage(simulateurId)
      if (!currentPage) {
        return null
      }

      const allPages = getAllPages(simulateurId)
      const currentIndex = allPages.findIndex(page => page.id === currentPage.id)

      if (currentIndex === -1) {
        return null
      }

      // Look for the next visible page
      for (let i = currentIndex + 1; i < allPages.length; i++) {
        const nextPage = allPages[i]
        // A page is visible if any of its questions are visible OR if it is an intermediary results page
        if ((nextPage as SurveyResultsPage).type === 'intermediary-results') {
          debug.log(`[Surveys store][${simulateurId}] Next visible page: ${nextPage.id}`)
          return nextPage
        }
        const hasVisibleQuestion = (nextPage as SurveyQuestionsPage)
          ?.questions
          .some((q) => {
            return isQuestionVisible(simulateurId, q.id)
          }) ?? false

        if (hasVisibleQuestion) {
          debug.log(`[Surveys store][${simulateurId}] Next visible page: ${nextPage.id}`)
          return nextPage
        }
      }

      return null
    }

    const getPreviousVisiblePage = (simulateurId: string): SurveyPage | null => {
      const currentPage = getCurrentPage(simulateurId)
      if (!currentPage) {
        return null
      }

      const allPages = getAllPages(simulateurId)
      const currentIndex = allPages.findIndex(page => page.id === currentPage.id)

      if (currentIndex === -1) {
        return null
      }

      // Look for the previous visible page
      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevPage = allPages[i]
        // A page is visible if any of its questions are visible OR if it is an intermediary results page
        if ((prevPage as SurveyResultsPage).type === 'intermediary-results') {
          debug.log(`[Surveys store][${simulateurId}] Previous visible page: ${prevPage.id}`)
          return prevPage
        }
        const hasVisibleQuestion = (prevPage as SurveyQuestionsPage)
          ?.questions
          .some((q) => {
            return isQuestionVisible(simulateurId, q.id)
          }) ?? false
        if (hasVisibleQuestion) {
          debug.log(`[Surveys store][${simulateurId}] Previous visible page: ${prevPage.id}`)
          return prevPage
        }
      }

      return null
    }

    const isFirstPage = (simulateurId: string): boolean => {
      return getPreviousVisiblePage(simulateurId) === null
    }

    const isLastPage = (simulateurId: string): boolean => {
      return getNextVisiblePage(simulateurId) === null
    }

    function goToNextPage(simulateurId: string) {
      const nextPage = getNextVisiblePage(simulateurId)
      if (nextPage) {
        setCurrentPageId(simulateurId, nextPage.id)
        return true
      }
      return false
    }

    function goToPreviousPage(simulateurId: string) {
      const prevPage = getPreviousVisiblePage(simulateurId)
      if (prevPage) {
        setCurrentPageId(simulateurId, prevPage.id)
        return true
      }
      return false
    }

    function setCurrentPageFromQuestionId(simulateurId: string, questionId: string) {
      const question = findQuestionById(simulateurId, questionId)
      if (question) {
        const page = getAllQuestionsPages(simulateurId)
          .find((p) => {
            return p.questions
              ?.some((q) => {
                return q.id === questionId
              })
          })
        if (page) {
          setCurrentPageId(simulateurId, page.id)
        }
      }
    }

    /**
     * Question related methods
     */

    function getQuestions(simulateurId: string): SurveyQuestion[] {
      const currentSchema = getSchema(simulateurId)
      const questions = currentSchema
        ?.steps
        .flatMap((step) => {
          return step.pages.flatMap(page => ((page as SurveyQuestionsPage).questions ?? []))
        })
      return questions ?? []
    }

    function findQuestionById(simulateurId: string, questionId: string): SurveyQuestion | null {
      const questions = getQuestions(simulateurId)
      const question = questions
        .find((q) => {
          return q.id === questionId
        })
      return question ?? null
    }

    function isQuestionVisible(simulateurId: string, questionId: string): boolean {
      const question = findQuestionById(simulateurId, questionId)
      const currentAnswers = getAnswers(simulateurId)

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

    function getGroupedQuestions(simulateurId: string): QuestionGroup[] {
      const steps = getAllSteps(simulateurId)
      const groupedQuestions = steps
        .map((step) => {
          const questions = step.pages
            .flatMap((page) => {
              return (page as SurveyQuestionsPage)
                .questions
                ?.map((question) => {
                  return {
                    id: question.id,
                    title: question.title,
                    answer: getAnswer(simulateurId, question.id),
                    visible: isQuestionVisible(simulateurId, question.id),
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

    function getGroupedVisibleQuestions(simulateurId: string): QuestionGroup[] {
      const steps = getAllSteps(simulateurId)
      const groupedQuestions = steps
        .map((step) => {
          const questions = step.pages
            .flatMap((page) => {
              return (page as SurveyQuestionsPage)
                .questions
                ?.map((question) => {
                  return {
                    id: question.id,
                    title: question.title,
                    answer: getAnswer(simulateurId, question.id),
                    visible: isQuestionVisible(simulateurId, question.id),
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

    function getVisibleQuestions(simulateurId: string): SurveyQuestion[] {
      const questions = getQuestions(simulateurId)
      const visibleQuestions = questions
        .filter((question) => {
          return isQuestionVisible(simulateurId, question.id)
        })
      return visibleQuestions
    }

    function isQuestionInCurrentPage(simulateurId: string, questionId: string): boolean {
      const currentPage = getCurrentPage(simulateurId)
      if (!currentPage) {
        return false
      }
      const isInCurrentPage = (currentPage as SurveyQuestionsPage)
        .questions
        ?.some((q) => {
          return q.id === questionId
        })
      return isInCurrentPage ?? false
    }

    function areAllRequiredQuestionsAnswered(simulateurId: string): boolean {
      const visibleQuestions = getVisibleQuestions(simulateurId)
      const areAllAnswered = visibleQuestions
        .every((question) => {
          return hasAnswer(simulateurId, question.id)
        })
      return areAllAnswered
    }

    function getVisibleQuestionsInCurrentPage(simulateurId: string): SurveyQuestion[] {
      const currentPage = getCurrentPage(simulateurId)
      if (!currentPage) {
        return []
      }
      const questions = (currentPage as SurveyQuestionsPage)
        ?.questions
        ?.filter((question) => {
          return isQuestionVisible(simulateurId, question.id)
        })
      return questions ?? []
    }

    function areAllQuestionsInPageValid(simulateurId: string): boolean {
      const visibleQuestions = getVisibleQuestionsInCurrentPage(simulateurId)
      const areAllValid = visibleQuestions
        .every((question) => {
          return isAnswerValid(question, getAnswer(simulateurId, question.id))
        })
      return areAllValid
    }

    /**
     * Step related methods
     */

    function getAllSteps(simulateurId: string): SurveyDeepStep[] {
      const currentSchema = getSchema(simulateurId)
      return currentSchema?.steps ?? []
    }

    const getStepFromPageId = (simulateurId: string, pageId: string): SurveyDeepStep | null => {
      const steps = getAllSteps(simulateurId)
      const step = steps
        .find((s) => {
          return s.pages
            ?.some((p) => {
              return p.id === pageId
            })
        })
      return step ?? null
    }

    function getCurrentStep(simulateurId: string): SurveyDeepStep | null {
      const steps = getAllSteps(simulateurId)
      const currentPageId = getCurrentPageId(simulateurId)
      const currentStep = steps
        .find((step) => {
          return step.pages
            ?.some((p) => {
              return p.id === currentPageId
            })
        })
      return currentStep ?? null
    }

    const getCurrentStepId = (simulateurId: string): string | null => {
      const step = getCurrentStep(simulateurId)
      return step?.id ?? null
    }

    const getCurrentStepIndex = (simulateurId: string): number | null => {
      const step = getCurrentStep(simulateurId)
      const steps = getAllSteps(simulateurId)
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

    const getProgress = (simulateurId: string): number => {
      const currentSchema = getSchema(simulateurId)
      const currentAnswers = getAnswers(simulateurId)

      if (!currentSchema) {
        return 0
      }

      const questions = getQuestions(simulateurId)

      // Count all visible questions
      let visibleQuestionsCount
        = questions.filter((question) => {
          return isQuestionVisible(simulateurId, question.id)
        }).length ?? 0

      // If there are no visible questions (unlikely but possible), use total questions count
      if (visibleQuestionsCount === 0) {
        visibleQuestionsCount = questions.length
      }

      // Count answered questions - but only count those that are visible
      const answeredVisibleQuestionsCount = Object.keys(currentAnswers).filter((questionId) => {
        return isQuestionVisible(simulateurId, questionId)
      }).length

      return Math.min(
        Math.round((answeredVisibleQuestionsCount / visibleQuestionsCount) * 100),
        100,
      )
    }

    /**
     * Global survey related methods
     */

    function resetSurvey(simulateurId: string) {
      debug.log(`[Surveys store][${simulateurId}] Resetting survey...`)
      answers.value[simulateurId] = {}

      // Reset to first category/question
      setFirstPage(simulateurId)
    }

    // Welcome screen
    const showWelcomeScreen = ref<{ [simulateurId: string]: boolean }>({})
    function getShowWelcomeScreen(simulateurId: string): boolean {
      return showWelcomeScreen.value[simulateurId] ?? true
    }
    function setShowWelcomeScreen(simulateurId: string, value: boolean) {
      showWelcomeScreen.value[simulateurId] = value
    }

    // Choice screen
    const showChoiceScreen = ref<{ [simulateurId: string]: boolean }>({})
    function getShowChoiceScreen(simulateurId: string): boolean {
      return showChoiceScreen.value[simulateurId] ?? true
    }
    function setShowChoiceScreen(simulateurId: string, value: boolean) {
      showChoiceScreen.value[simulateurId] = value
    }

    /**
     * Event listeners / emitters
     */
    const completeListeners = ref<{ [simulateurId: string]: Set<(simulateurId: string) => void> }>(
      {},
    )

    function onComplete(simulateurId: string, listener: () => void) {
      if (!completeListeners.value[simulateurId]) {
        completeListeners.value[simulateurId] = new Set()
      }
      completeListeners.value[simulateurId].add(listener)
    }

    /**
     * Right now cannot be used because simulateurId is unkown on unmount
     */
    function offComplete(simulateurId: string, listener: () => void) {
      if (completeListeners.value[simulateurId]) {
        completeListeners.value[simulateurId].delete(listener)
      }
    }

    function deleteCompleteListeners() {
      Object.keys(completeListeners.value).forEach((id) => {
        completeListeners.value[id].clear()
      })
    }

    function tryComplete(simulateurId: string) {
      // Check if all questions are answered
      // We might need better form validation later
      const allAnswered = areAllRequiredQuestionsAnswered(simulateurId)

      if (allAnswered) {
        // Trigger completion event
        completeListeners.value[simulateurId]?.forEach((listener) => {
          listener(simulateurId)
        })

        debug.log(`[Surveys store][${simulateurId}] Survey completed!`)
      }
    }

    return {
      answers,
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
      getStepFromPageId,
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
  },
  {
    persist: {
      pick: [
        'answers',
        'versions',
        'currentPageIds',
      ],
    },
  },
)
