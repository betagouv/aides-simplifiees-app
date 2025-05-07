<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import type { DsfrButtonProps } from '@gouvminint/vue-dsfr'
import { DsfrStepper } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { onKeyDown } from '@vueuse/core'
import { computed, customRef, nextTick, onMounted, ref } from 'vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyQuestion from '~/components/survey/SurveyQuestion.vue'
import { useSurveysStore } from '~/stores/surveys'
import { isAnswerValid } from '~/utils/form_validation'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showSimulateur'>>()

const surveysStore = useSurveysStore()

// Get simulateur-specific state
const currentQuestion = computed(() => surveysStore.getCurrentQuestion(simulateur.slug))
const currentPage = computed(() => surveysStore.getCurrentPage(simulateur.slug))
const surveySchema = computed(() => surveysStore.getSchema(simulateur.slug))
const isLastQuestion = computed(() => surveysStore.isLastQuestion(simulateur.slug))
const isLastPage = computed(() => surveysStore.isLastPage(simulateur.slug))
const areAllRequiredQuestionsAnswered = computed(() => surveysStore.areAllRequiredQuestionsAnswered(simulateur.slug))
const currentStepIndex = computed(() => surveysStore.getCurrentStepIndex(simulateur.slug))

// Determine if we're using the page-based navigation
const hasPages = computed(() => {
  return surveySchema.value?.steps.some(step => step.pages && step.pages.length > 0) || false
})

// Get all visible questions in the current page
const visibleQuestionsInCurrentPage = computed(() => {
  if (!currentPage.value) {
    return []
  }
  return currentPage.value.questions.filter(question =>
    surveysStore.isQuestionVisible(simulateur.slug, question.id),
  )
})

// Check if all visible questions in the current page have valid answers
const areAllQuestionsInPageValid = computed(() => {
  if (!currentPage.value) {
    return false
  }
  return visibleQuestionsInCurrentPage.value.every(question =>
    isAnswerValid(question, surveysStore.getAnswer(simulateur.slug, question.id)),
  )
})

// Check if the current question has been answered
const hasValidAnswer = computed(() => {
  if (!currentQuestion.value) {
    return false
  }
  return isAnswerValid(currentQuestion.value, surveysStore.getAnswer(simulateur.slug, currentQuestion.value.id))
})

const stepTitles = computed(() => {
  return surveySchema.value?.steps
    .map((step) => {
      return step.title
    })
    .filter(Boolean) || []
})

// Focus on the question container after navigation
const questionContainer = ref<HTMLElement | null>(null)
const questionChangeAnnouncer = ref<HTMLElement | null>(null)

function focusRenderedQuestion() {
  nextTick(() => {
    if (questionContainer.value) {
      questionContainer.value.focus()
    }

    // Announce to screen readers that a new page is displayed
    if (questionChangeAnnouncer.value && currentPage.value) {
      questionChangeAnnouncer.value.textContent = `Page : ${currentPage.value.title}`
    }
  })
}
onMounted(() => {
  focusRenderedQuestion()
})

onKeyDown('Enter', (event: KeyboardEvent) => {
  const validAnswer = hasPages.value ? areAllQuestionsInPageValid : hasValidAnswer
  const isLast = hasPages.value ? isLastPage : isLastQuestion

  if (validAnswer.value && !isLast.value) {
    // Only trigger if the source is not a button or textarea or [type="search"] input or select
    if (
      !(event.target instanceof HTMLButtonElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement && event.target.type === 'search') && !(event.target instanceof HTMLSelectElement)
    ) {
      event.preventDefault()
      handleNext()
    }
  }
  else if (validAnswer.value && isLast.value) {
    // Only trigger if the source is not a button or textarea or [type="search"] input or select
    if (
      !(event.target instanceof HTMLButtonElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement && event.target.type === 'search') && !(event.target instanceof HTMLSelectElement)
    ) {
      event.preventDefault()
      handleComplete()
    }
  }
}, { target: questionContainer })

// Navigate to next page
function handleNext() {
  // Check if we should show intermediary results
  const intermediaryResultsAfterStep = surveySchema.value?.['intermediary-results-after-step']
  const currentStep = surveysStore.getCurrentStep(simulateur.slug)
  const nextPage = surveysStore.getNextVisiblePage(simulateur.slug)
  const stepOfNextPage = surveysStore.getStepFromPageId(simulateur.slug, nextPage?.id)

  // intermediaryResultsAfterStep is set in the survey schema
  // I am in the step of intermediaryResultsAfterStep
  // The next page is in a different step
  if (intermediaryResultsAfterStep && currentStep?.id === intermediaryResultsAfterStep && stepOfNextPage?.id !== currentStep?.id) {
    console.log('[SurveyForm] Redirecting to intermediary results page')

    // Navigate to intermediary results page

    surveysStore.goToNextPage(simulateur.slug)

    router.visit(`/simulateurs/${simulateur.slug}/resultats-intermediaire#simulateur-title`, {
      preserveState: true,
      preserveScroll: true,
    })

    return
  }

  if (hasPages.value) {
    // Go to the next page
    const wentToNextPage = surveysStore.goToNextPage(simulateur.slug)
    if (wentToNextPage) {
      focusRenderedQuestion()
    }
  }
  else {
    // Original question-by-question navigation
    const wentToNext = surveysStore.goToNextQuestion(simulateur.slug)
    if (wentToNext) {
      focusRenderedQuestion()
    }
  }
}

// Navigate to previous page
function handlePrevious() {
  if (hasPages.value) {
    // Go to the previous page
    const wentToPrevPage = surveysStore.goToPreviousPage(simulateur.slug)
    if (wentToPrevPage) {
      focusRenderedQuestion()
    }
    else {
      surveysStore.setShowWelcomeScreen(simulateur.slug, true)
    }
  }
  else {
    // Original question-by-question navigation
    const wentToPrev = surveysStore.goToPreviousQuestion(simulateur.slug)
    if (wentToPrev) {
      focusRenderedQuestion()
    }
    else {
      surveysStore.setShowWelcomeScreen(simulateur.slug, true)
    }
  }
}

// Create a reactive model for each question
function _getQuestionModel(questionId: string) {
  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return surveysStore.getAnswer(simulateur.slug, questionId)
      },
      set(value) {
        surveysStore.setAnswer(simulateur.slug, questionId, value)
        trigger()
      },
    }
  })
}

function handleComplete() {
  surveysStore.tryComplete(simulateur.slug)
}

const showNextBtn = computed(() => {
  return hasPages.value
    ? !isLastPage.value
    : !isLastQuestion.value
})
const showFinishBtn = computed(() => {
  return hasPages.value
    ? isLastPage.value && areAllRequiredQuestionsAnswered.value
    : isLastQuestion.value && areAllRequiredQuestionsAnswered.value
})
</script>

<template>
  <div>
    <!-- Live region for announcing question changes to screen readers -->
    <div
      id="question-change-announcer"
      ref="questionChangeAnnouncer"
      class="fr-sr-only"
      aria-live="polite"
      aria-atomic="true"
    />

    <DsfrStepper
      v-if="currentStepIndex"
      :steps="stepTitles"
      :current-step="currentStepIndex"
    />
    <div
      v-if="surveySchema && (currentQuestion || currentPage)"
      ref="questionContainer"
      data-testid="question-container"
      tabindex="-1"
      class="fr-card fr-p-4w fr-mb-3w"
    >
      <!-- Page title if using page-based navigation -->
      <h4
        v-if="hasPages && currentPage"
        class="fr-text--lg fr-mb-2w"
      >
        {{ currentPage.title }}
      </h4>

      <!-- For page-based navigation, display all visible questions in the page -->
      <template v-if="hasPages && currentPage">
        <div
          v-for="question in visibleQuestionsInCurrentPage"
          :key="question.id"
          class="fr-mb-4w"
        >
          <SurveyQuestion
            :question="question"
            :simulateur-slug="simulateur.slug"
          />
        </div>
      </template>

      <!-- For legacy question-by-question navigation -->
      <template v-else-if="currentQuestion">
        <SurveyQuestion
          :question="currentQuestion"
          :simulateur-slug="simulateur.slug"
        />
      </template>
    </div>

    <!-- Navigation buttons remain unchanged -->
    <SurveyNavigation
      :buttons="([
        {
          label: 'Récapitulatif',
          secondary: true,
          icon: { name: 'ri:menu-line', ssr: true },
          onClick: () => {
            router.visit(`/simulateurs/${simulateur.slug}/recapitulatif#simulateur-title`, { preserveState: true, preserveScroll: true })
          },
        },
        {
          label: 'Précédent',
          secondary: true,
          icon: { name: 'ri:arrow-left-line', ssr: true },
          onClick: handlePrevious,
        },
        showNextBtn ? {
          label: 'Suivant',
          iconRight: true,
          icon: { name: 'ri:arrow-right-line', ssr: true },
          disabled: hasPages ? !areAllQuestionsInPageValid : !hasValidAnswer,
          onClick: handleNext,
        } : null,
        showFinishBtn ? {
          label: 'Terminer',
          iconRight: true,
          icon: { name: 'ri:arrow-right-line', ssr: true },
          onClick: handleComplete,
        } : null,
      ].filter(Boolean) as DsfrButtonProps[])"
    />
  </div>
</template>
