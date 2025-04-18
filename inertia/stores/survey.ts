import { defineStore } from 'pinia'
import { useMatomo } from '~/composables/useMatomo'
import { useSurveyDebugStore } from '~/stores/survey-debug'
import { ref, watch } from 'vue'
import { useAutoCompleteHistoryStore } from '~/stores/autocomplete-history'
import { useFetch } from '@vueuse/core'
import { compareVersions } from '~/utils/compare-versions'
import { evaluateCondition } from '~/utils/evaluate-conditions'

export const useSurveysStore = defineStore(
  'surveys',
  () => {
    /**
     * State
     */
    const answers = ref<{ [simulateurId: string]: SurveyAnswers }>({})
    const currentQuestionId = ref<{ [simulateurId: string]: string | null }>({})
    const surveySchemas = ref<{ [simulateurId: string]: SurveySchema | null }>({})
    const schemaStatus = ref<{ [simulateurId: string]: 'idle' | 'pending' | 'error' | 'success' }>(
      {}
    )
    const versions = ref<{ [simulateurId: string]: string }>({})

    /**
     * Composables
     */
    const matomo = useMatomo()
    const { debug } = useSurveyDebugStore()

    /**
     * Schema related methods
     */
    const getSchema = (simulateurId: string): SurveySchema | null => {
      return surveySchemas.value[simulateurId] || null
    }

    const setSchema = (simulateurId: string, schema: SurveySchema) => {
      surveySchemas.value[simulateurId] = schema
      debug.log(`[Surveys store][${simulateurId}] Schema set:`, schema)
    }

    const getSchemaStatus = (simulateurId: string): 'idle' | 'pending' | 'error' | 'success' => {
      return schemaStatus.value[simulateurId] || 'idle'
    }

    function updateSchemaStatus(
      simulateurId: string,
      status: 'idle' | 'pending' | 'error' | 'success'
    ) {
      if (status === 'error') {
        console.error(`[Surveys store][${simulateurId}] Error loading survey schema`)
      } else {
        debug.log(`[Surveys store][${simulateurId}] Schema status:`, status)
      }
      schemaStatus.value[simulateurId] = status
    }

    const getVersion = (simulateurId: string): string => {
      const version = versions.value[simulateurId]
      debug.log(`[Surveys store][${simulateurId}] Version:`, version)
      return version
    }

    const setVersion = (simulateurId: string, version: string) => {
      versions.value[simulateurId] = version
      debug.log(`[Surveys store][${simulateurId}] Version set to:`, version)
    }

    function updateSchema(simulateurId: string, schema: SurveySchema) {
      try {
        if (schema.forceRefresh) {
          debug.warn(
            `[Surveys store][${simulateurId}] Schema forceRefresh is true, resetting survey...`
          )
          setVersion(simulateurId, schema.version)
          setSchema(simulateurId, schema)
          resetSurvey(simulateurId)
        } else {
          const storedVersion = getVersion(simulateurId)
          if (!storedVersion) {
            debug.log(
              `[Surveys store][${simulateurId}] No stored version found, assuming first load`
            )
            setVersion(simulateurId, schema.version)
            setSchema(simulateurId, schema)
            resetSurvey(simulateurId)
          } else if (compareVersions(schema.version, storedVersion) > 0) {
            debug.warn(`[Surveys store][${simulateurId}] Schema version changed !`)
            setVersion(simulateurId, schema.version)
            setSchema(simulateurId, schema)
            resetSurvey(simulateurId)
          } else {
            debug.log(
              `[Surveys store][${simulateurId}] Schema version unchanged, no need to reset survey`
            )
            setSchema(simulateurId, schema)
          }
        }

        // Initialize if this is first load
        if (!getCurrentQuestionId(simulateurId)) {
          setFirstQuestion(simulateurId)
        }
      } catch (error) {
        console.error(`[Surveys store][${simulateurId}] Error updating schema:`, error)
      }
    }

    async function loadSurveySchema(simulateurId: string) {
      debug.log(`[Surveys store][${simulateurId}] Loading survey schema...`)

      updateSchemaStatus(simulateurId, 'pending')

      try {
        const { data: schemaData } = useFetch<string>(`/forms/${simulateurId}.json`)

        watch(
          schemaData,
          (data) => {
            if (data) {
              try {
                // Parse the JSON string to get the schema object
                const parsedSchema = JSON.parse(data) as SurveySchema
                setSchema(simulateurId, parsedSchema)
                updateSchemaStatus(simulateurId, 'success')
              } catch (parseError) {
                console.error(
                  `[Surveys store][${simulateurId}] Error parsing schema JSON:`,
                  parseError
                )
                updateSchemaStatus(simulateurId, 'error')
              }
            }
          },
          { immediate: true }
        )
      } catch (fetchError) {
        console.error(`[Surveys store][${simulateurId}] Error fetching schema:`, fetchError)
        updateSchemaStatus(simulateurId, 'error')
      }
    }

    /**
     * Answers related methods
     */
    const getAnswers = (simulateurId: string): SurveyAnswers => {
      return answers.value[simulateurId] || {}
    }

    const hasAnswers = (simulateurId: string): boolean => {
      return Object.keys(getAnswers(simulateurId)).length > 0
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

    const { getHistory } = useAutoCompleteHistoryStore()
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
            const history = getHistory(questionId, value)
            if (history) {
              return history as string
            }
            break
          }
        }
        const choice = question.choices?.find((choice) => {
          return choice.id === value
        })
        if (choice?.title) {
          return choice.title
        }
      }
      return getAnswer(simulateurId, questionId)
    }

    /**
     * Question related methods
     */
    function getCurrentQuestionId(simulateurId: string): string | null {
      return currentQuestionId.value[simulateurId] || null
    }

    const setCurrentQuestionId = (simulateurId: string, questionId: string) => {
      currentQuestionId.value[simulateurId] = questionId
      debug.log(`[Surveys store][${simulateurId}] Current question ID set to:`, questionId)
    }

    const getQuestions = (simulateurId: string): SurveyQuestion[] => {
      const currentSchema = getSchema(simulateurId)
      return (
        currentSchema?.steps.flatMap((step) => {
          return step.questions
        }) ?? []
      )
    }

    const getGroupedQuestions = (simulateurId: string): QuestionGroup[] => {
      const currentSchema = getSchema(simulateurId)

      return (
        currentSchema?.steps.map((step) => {
          const questions = step.questions.map((question) => {
            return {
              id: question.id,
              title: question.title,
              answer: getAnswer(simulateurId, question.id),
              visible: isQuestionVisible(simulateurId, question.id),
            }
          })
          return {
            title: step.title,
            questions,
          }
        }) ?? []
      )
    }

    const getAnsweredQuestions = (simulateurId: string): SurveyQuestion[] => {
      const currentSchema = getSchema(simulateurId)

      return (
        currentSchema?.steps.flatMap((step) => {
          return step.questions.filter((question) => {
            return hasAnswer(simulateurId, question.id)
          })
        }) ?? []
      )
    }

    const getGroupedAnsweredQuestions = (simulateurId: string): QuestionGroup[] => {
      const currentSchema = getSchema(simulateurId)
      const currentAnswers = getAnswers(simulateurId)
      return (
        currentSchema?.steps.map((step) => {
          const questions = step.questions
            .filter((question) => {
              // Check if the question is answered or is the current question
              return (
                hasAnswer(simulateurId, question.id) ||
                currentQuestionId.value[simulateurId] === question.id
              )
            })
            .map((question) => {
              const answer = currentAnswers[question.id]
              return {
                id: question.id,
                title: question.title,
                answer,
                visible: isQuestionVisible(simulateurId, question.id),
              }
            })
          return {
            title: step.title,
            questions,
          }
        }) ?? []
      )
    }

    const getVisibleQuestions = (simulateurId: string): SurveyQuestion[] => {
      const currentSchema = getSchema(simulateurId)
      if (!currentSchema) {
        return []
      }
      // Get all required questions
      const requiredQuestions = currentSchema.steps.flatMap((step) => {
        return step.questions.filter((question) => {
          return isQuestionVisible(simulateurId, question.id)
        })
      })

      return requiredQuestions
    }

    function areAllRequiredQuestionsAnswered(simulateurId: string): boolean {
      const currentSchema = getSchema(simulateurId)
      if (!currentSchema) {
        return false
      }
      // Check if all required questions are answered
      const allAnswered = getVisibleQuestions(simulateurId).every((question) => {
        return hasAnswer(simulateurId, question.id)
      })
      return allAnswered
    }

    function isSomeRequiredQuestionsAnswered(simulateurId: string): boolean {
      const currentSchema = getSchema(simulateurId)
      if (!currentSchema) {
        return false
      }
      // Check if some required questions are answered
      const someAnswered = getVisibleQuestions(simulateurId).some((question) => {
        return hasAnswer(simulateurId, question.id)
      })
      return someAnswered
    }

    const getCurrentQuestion = (simulateurId: string): SurveyQuestion | null => {
      const currentQuestionId = getCurrentQuestionId(simulateurId)
      if (!currentQuestionId) {
        debug.log(`[Surveys Store][${simulateurId}] No current question ID found`)
        return null
      }

      // Find the current question in the ordered list
      const questions = getQuestions(simulateurId)
      const currentQuestion = questions.find((question) => {
        return question.id === currentQuestionId
      })

      if (!currentQuestion) {
        debug.warn(
          `[Surveys Store][${simulateurId}] Current question ${currentQuestionId} not found in ordered list`
        )
        return null
      }

      debug.log(`[Surveys store][${simulateurId}] Current question: ${currentQuestion.id}`)

      return currentQuestion
    }

    const getNextVisibleQuestion = (simulateurId: string): SurveyQuestion | null => {
      const currentQuestionId = getCurrentQuestionId(simulateurId)
      if (!currentQuestionId) {
        return null
      }

      const questions = getQuestions(simulateurId)
      // Find the current question's index in the ordered list
      const currentIndex = questions.findIndex((question) => {
        return question.id === currentQuestionId
      })

      if (currentIndex === -1) {
        debug.warn(
          `[Surveys Store][${simulateurId}] Current question ${currentQuestionId} not found in ordered list`
        )
        return null
      }

      // Look for the next visible question in the ordered list
      for (let i = currentIndex + 1; i < questions.length; i++) {
        const nextQuestion = questions[i]
        if (isQuestionVisible(simulateurId, nextQuestion.id)) {
          debug.log(
            `[Surveys store][${simulateurId}] Next visible question in schema order: ${nextQuestion.id}`
          )

          return nextQuestion
        }
      }

      return null
    }

    const getPreviousVisibleQuestion = (simulateurId: string): SurveyQuestion | null => {
      const currentQuestionId = getCurrentQuestionId(simulateurId)
      if (!currentQuestionId) {
        return null
      }

      const questions = getQuestions(simulateurId)
      // Find the current question's index in the ordered list
      const currentIndex = questions.findIndex((question) => {
        return question.id === currentQuestionId
      })

      if (currentIndex === -1) {
        debug.warn(
          `[surveysStore][${simulateurId}] Current question ${currentQuestionId} not found in ordered list`
        )
        return null
      }

      // Look for the previous visible question in the ordered list
      for (let i = currentIndex - 1; i >= 0; i--) {
        const previousQuestion = questions[i]
        if (isQuestionVisible(simulateurId, previousQuestion.id)) {
          debug.log(
            `[surveysStore][${simulateurId}] Previous visible question in schema order: ${previousQuestion.id}`
          )

          return previousQuestion
        }
      }

      return null
    }

    const isFirstQuestion = (simulateurId: string): boolean => {
      return getPreviousVisibleQuestion(simulateurId) === null
    }

    const isLastQuestion = (simulateurId: string): boolean => {
      return getNextVisibleQuestion(simulateurId) === null
    }

    function setFirstQuestion(simulateurId: string) {
      const questions = getQuestions(simulateurId)
      setCurrentQuestionId(simulateurId, questions[0]?.id ?? null)
    }

    function findQuestionById(simulateurId: string, questionId: string): SurveyQuestion | null {
      const questions = getQuestions(simulateurId)

      // Find the question in the ordered list
      const question = questions.find((question) => {
        return question.id === questionId
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
        const isVisible = evaluateCondition(question.visibleWhen, currentAnswers)

        // debug.log(`[surveysStore][${simulateurId}] Visibility check for ${questionId}: ${isVisible} (condition: ${question.visibleWhen})`)

        return isVisible
      }

      // By default, a question is visible
      return true
    }

    function goToNextQuestion(simulateurId: string) {
      const nextQuestion = getNextVisibleQuestion(simulateurId)
      if (nextQuestion) {
        // Update the current question
        setCurrentQuestionId(simulateurId, nextQuestion.id)
        return true
      }
      return false
    }

    function goToPreviousQuestion(simulateurId: string) {
      const prevQuestion = getPreviousVisibleQuestion(simulateurId)
      if (prevQuestion) {
        // Update the current question
        setCurrentQuestionId(simulateurId, prevQuestion.id)
        return true
      }
      return false
    }

    /**
     * Step related methods
     */

    const getCurrentStep = (simulateurId: string): SurveyStep | null => {
      const currentSchema = getSchema(simulateurId)
      const currentQuestionId = getCurrentQuestionId(simulateurId)

      const step = currentSchema?.steps.find((step) => {
        return step.questions.some((question) => {
          return question.id === currentQuestionId
        })
      })
      return step ?? null
    }

    const getCurrentStepId = (simulateurId: string): string | null => {
      return getCurrentStep(simulateurId)?.id ?? null
    }

    const getCurrentStepIndex = (simulateurId: string): number | null => {
      const currentSchema = getSchema(simulateurId)
      if (!currentSchema) {
        return null
      }

      const stepIndex = currentSchema.steps.findIndex((step) => {
        return step.id === getCurrentStepId(simulateurId)
      })

      if (stepIndex === -1) {
        return null
      }

      return stepIndex + 1 // +1 to match the number of steps
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
      let visibleQuestionsCount =
        questions.filter((question) => {
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
        100
      )
    }

    /**
     * Global survey related methods
     */

    function resetSurvey(simulateurId: string) {
      debug.log(`[Surveys store][${simulateurId}] Resetting survey...`)
      answers.value[simulateurId] = {}
      // Reset to first category/question
      setFirstQuestion(simulateurId)
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
      {}
    )

    function onComplete(simulateurId: string, listener: () => void) {
      if (!completeListeners.value[simulateurId]) {
        completeListeners.value[simulateurId] = new Set()
      }
      completeListeners.value[simulateurId].add(listener)
    }

    function offComplete(simulateurId: string, listener: () => void) {
      if (completeListeners.value[simulateurId]) {
        completeListeners.value[simulateurId].delete(listener)
      }
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
      currentQuestionId,
      versions,
      areAllRequiredQuestionsAnswered,
      isSomeRequiredQuestionsAnswered,
      getSchema,
      getSchemaStatus,
      loadSurveySchema,
      hasAnswers,
      getAnswers,
      getAnswer,
      hasAnswer,
      setAnswer,
      formatAnswer,
      getCurrentQuestionId,
      setCurrentQuestionId,
      getCurrentStep,
      getCurrentStepId,
      getCurrentStepIndex,
      getCurrentQuestion,
      getNextVisibleQuestion,
      getPreviousVisibleQuestion,
      getGroupedQuestions,
      getAnsweredQuestions,
      getGroupedAnsweredQuestions,
      isFirstQuestion,
      isLastQuestion,
      resetSurvey,
      goToNextQuestion,
      goToPreviousQuestion,
      getProgress,
      setShowChoiceScreen,
      getShowChoiceScreen,
      getShowWelcomeScreen,
      setShowWelcomeScreen,
      onComplete,
      offComplete,
      tryComplete,
    }
  },
  {
    persist: {
      pick: ['answers', 'versions', 'currentQuestionId'],
    },
  }
)
