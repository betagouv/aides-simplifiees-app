<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import type { DsfrButtonProps } from '@gouvminint/vue-dsfr'
import { DsfrStepper } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { onKeyDown } from '@vueuse/core'
import { computed, nextTick, onMounted, ref } from 'vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyPage from '~/components/survey/SurveyPage.vue'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'show'>>()

const surveysStore = useSurveysStore()

// Get simulateur-specific state
const currentPage = computed(() => surveysStore.getCurrentPage(simulateur.slug))
const surveySchema = computed(() => surveysStore.getSchema(simulateur.slug))
const isLastPage = computed(() => surveysStore.isLastPage(simulateur.slug))
const areAllRequiredQuestionsAnswered = computed(() => surveysStore.areAllRequiredQuestionsAnswered(simulateur.slug))
const currentStepIndex = computed(() => surveysStore.getCurrentStepIndex(simulateur.slug))
const areAllQuestionsInPageValid = computed(() => surveysStore.areAllQuestionsInPageValid(simulateur.slug))

const stepTitles = computed(() => {
  return surveySchema.value?.steps
    .map((step) => {
      return step.title
    })
    .filter(Boolean) || []
})

const pageContainer = ref<HTMLElement | null>(null)
const formContainer = ref<HTMLElement | null>(null)
const surveyPageChangeAnnouncer = ref<HTMLElement | null>(null)

/**
 * When the user navigates to a new page, we want to focus on the page container
 * for tab navigation and announce the new page to screen readers.
 */
function focusRenderedSurveyPage() {
  nextTick(() => {
    formContainer.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    if (pageContainer.value) {
      // Scroll to the top of the survey page
      // Focus on the page container for tab navigation
      pageContainer.value.focus()
    }

    if (surveyPageChangeAnnouncer.value && currentPage.value) {
      // Announce to screen readers that a new page is displayed
      surveyPageChangeAnnouncer.value.textContent = `Page : ${currentPage.value.title}`
    }
  })
}
onMounted(() => {
  focusRenderedSurveyPage()
})

// Navigate to next page
function handleNext() {
  const wentToNextPage = surveysStore.goToNextPage(simulateur.slug)
  if (wentToNextPage) {
    focusRenderedSurveyPage()
  }
}

// Navigate to previous page
function handlePrevious() {
  // Go to the previous page
  const wentToPrevPage = surveysStore.goToPreviousPage(simulateur.slug)
  if (wentToPrevPage) {
    focusRenderedSurveyPage()
  }
  else {
    surveysStore.setShowWelcomeScreen(simulateur.slug, true)
  }
}

function handleComplete() {
  surveysStore.tryComplete(simulateur.slug)
}

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
}, { target: pageContainer })

const showNextBtn = computed(() => !isLastPage.value)
const showFinishBtn = computed(() => isLastPage.value && areAllRequiredQuestionsAnswered.value)
</script>

<template>
  <div
    ref="formContainer"
  >
    <!-- Live region for announcing survey page changes to screen readers -->
    <div
      ref="surveyPageChangeAnnouncer"
      class="fr-sr-only"
      aria-live="polite"
      aria-atomic="true"
    />

    <DsfrStepper
      v-if="Number.isInteger(currentStepIndex)"
      :steps="stepTitles"
      :current-step="(currentStepIndex as number) + 1"
    />
    <div
      ref="pageContainer"
      tabindex="-1"
      data-testid="survey-page-container"
    >
      <SurveyPage />
    </div>
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
