import type { Ref } from 'vue'
import { useSurveyDebugStore } from '~/stores/survey_debug'

export interface UseSurveyNavigationOptions {
  currentPageIds: Ref<{ [simulateurSlug: string]: string | null }>
  getSchema: (simulateurSlug: string) => SurveyNormalizedSchema | null
  isQuestionVisible: (simulateurSlug: string, questionId: string) => boolean
  findQuestionById: (simulateurSlug: string, questionId: string) => SurveyQuestionData | null
  getAnswers: (simulateurSlug: string) => SurveyAnswers
  getAnswer: (simulateurSlug: string, questionId: string) => any
}

export function useSurveyNavigation(options: UseSurveyNavigationOptions) {
  const {
    currentPageIds,
    getSchema,
    isQuestionVisible,
    findQuestionById,
    getAnswers,
    getAnswer,
  } = options
  const { debug } = useSurveyDebugStore()

  /**
   * Page utilities
   */

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

  /**
   * Current page management
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

  /**
   * Navigation methods
   */

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

  /**
   * Step methods
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
   * Grouped questions methods
   */

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

  /**
   * Progress calculation
   */

  const getProgress = (simulateurSlug: string): number => {
    const currentSchema = getSchema(simulateurSlug)
    const currentAnswers = getAnswers(simulateurSlug)

    if (!currentSchema) {
      return 0
    }

    const questions = currentSchema
      .steps
      .flatMap((step) => {
        return step.pages.flatMap(page => ((page as SurveyQuestionsPageData).questions ?? []))
      })

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

  return {
    getAllPages,
    getAllQuestionsPages,
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
  }
}
