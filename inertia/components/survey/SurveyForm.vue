<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import type { DsfrButtonProps } from '@gouvminint/vue-dsfr'
import { DsfrStepper } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { onKeyDown } from '@vueuse/core'
import { computed, nextTick, onMounted, ref } from 'vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyQuestion from '~/components/survey/SurveyQuestion.vue'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showSimulateur'>>()

const surveysStore = useSurveysStore()

// Get simulateur-specific state
const currentPage = computed(() => surveysStore.getCurrentPage(simulateur.slug))
const surveySchema = computed(() => surveysStore.getSchema(simulateur.slug))
const isLastPage = computed(() => surveysStore.isLastPage(simulateur.slug))
const areAllRequiredQuestionsAnswered = computed(() => surveysStore.areAllRequiredQuestionsAnswered(simulateur.slug))
const currentStepIndex = computed(() => surveysStore.getCurrentStepIndex(simulateur.slug))
const visibleQuestionsInCurrentPage = computed(() => surveysStore.getVisibleQuestionsInCurrentPage(simulateur.slug))
const areAllQuestionsInPageValid = computed(() => surveysStore.areAllQuestionsInPageValid(simulateur.slug))

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

/**
 * When the user presses Enter on a question, we want to navigate to the next page
 * or finish the survey if we are on the last page.
 */
onKeyDown('Enter', (event: KeyboardEvent) => {
  if (!areAllQuestionsInPageValid.value) {
    return
  }

  /**
   * Only trigger if the source is not a button, a textarea, an input[type="search"] or a select.
   */
  const isDesiredTarget = !(event.target instanceof HTMLButtonElement)
    && !(event.target instanceof HTMLTextAreaElement)
    && !(event.target instanceof HTMLInputElement && event.target.type === 'search')
    && !(event.target instanceof HTMLSelectElement)

  if (!isDesiredTarget) {
    return
  }

  event.preventDefault()

  if (!isLastPage.value) {
    handleNext()
  }
  else {
    handleComplete()
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

  // Go to the next page
  const wentToNextPage = surveysStore.goToNextPage(simulateur.slug)
  if (wentToNextPage) {
    focusRenderedQuestion()
  }
}

// Navigate to previous page
function handlePrevious() {
  // Go to the previous page
  const wentToPrevPage = surveysStore.goToPreviousPage(simulateur.slug)
  if (wentToPrevPage) {
    focusRenderedQuestion()
  }
  else {
    surveysStore.setShowWelcomeScreen(simulateur.slug, true)
  }
}

function handleComplete() {
  surveysStore.tryComplete(simulateur.slug)
}

const showNextBtn = computed(() => !isLastPage.value)
const showFinishBtn = computed(() => isLastPage.value && areAllRequiredQuestionsAnswered.value)
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
      v-if="surveySchema && currentPage"
      ref="questionContainer"
      data-testid="question-container"
      tabindex="-1"
      class="fr-card fr-p-4w fr-mb-3w"
    >
      <!-- Page title -->
      <h4
        v-if="currentPage"
        class="fr-text--lg fr-mb-2w"
      >
        {{ currentPage.title }}
      </h4>

      <!-- Display all visible questions in the page -->
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
    </div>

    <!-- Navigation buttons -->
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
          disabled: !areAllQuestionsInPageValid,
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
