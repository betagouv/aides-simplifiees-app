<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import type { DsfrButtonProps } from '@gouvminint/vue-dsfr'
import { DsfrButton, DsfrStepper } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { onKeyDown } from '@vueuse/core'
import { computed, customRef, nextTick, onMounted, ref } from 'vue'
import BooleanQuestion from '~/components/survey/BooleanQuestion.vue'
import ComboboxQuestion from '~/components/survey/ComboboxQuestion.vue'
import DateQuestion from '~/components/survey/DateQuestion.vue'
import MultiSelectQuestion from '~/components/survey/MultiSelectQuestion.vue'
import NumberQuestion from '~/components/survey/NumberQuestion.vue'
import RadioButtonQuestion from '~/components/survey/RadioButtonQuestion.vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useSurveysStore } from '~/stores/surveys'
import { autocompleteConfigs, autocompleteFunctions } from '~/utils/autocomplete_functions'
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
const _isLastQuestion = computed(() => surveysStore.isLastQuestion(simulateur.slug))
const _isLastPage = computed(() => surveysStore.isLastPage(simulateur.slug))
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

// Check if all questions in the current page are answered
const _areAllQuestionsInPageAnswered = computed(() => {
  if (!currentPage.value) {
    return false
  }
  return visibleQuestionsInCurrentPage.value.every(question =>
    surveysStore.hasAnswer(simulateur.slug, question.id),
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
const _hasValidAnswer = computed(() => {
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

// Get the question component type based on question type
function getQuestionComponent(type: string) {
  return {
    radio: RadioButtonQuestion,
    boolean: BooleanQuestion,
    checkbox: MultiSelectQuestion,
    number: NumberQuestion,
    date: DateQuestion,
    combobox: ComboboxQuestion,
    text: ComboboxQuestion,
  }[type] || ComboboxQuestion
}

// Get autocomplete function for a question
function getAutocompleteFn(question: SurveyQuestion) {
  if (question?.autocompleteFunction) {
    return autocompleteFunctions[question.autocompleteFunction]
  }
  return undefined
}

// Get autocomplete configuration for a question
function getAutocompleteConfig(question: SurveyQuestion) {
  if (question?.autocompleteFunction) {
    // Merge default config with any custom config from question
    return {
      ...autocompleteConfigs[question.autocompleteFunction],
      ...question.autocompleteConfig || {},
    }
  }
  return undefined
}

// Heading levels based on iframe context
const { isIframe } = useIframeDisplay()
const surveyH2 = computed(() => isIframe.value ? 'h2' : 'h3')

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
  if (areAllQuestionsInPageValid.value && !_isLastPage.value) {
    // Only trigger if the source is not a button or textarea or [type="search"] input or select
    if (
      !(event.target instanceof HTMLButtonElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement && event.target.type === 'search') && !(event.target instanceof HTMLSelectElement)
    ) {
      event.preventDefault()
      handleNext()
    }
  }
  else if (_isLastPage.value && areAllRequiredQuestionsAnswered.value) {
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

// Add page indicator if using page navigation
const pageIndicator = computed(() => {
  if (hasPages.value && currentPage.value) {
    const currentPageIndex = surveySchema.value?.steps.flatMap(step => step.pages || []).findIndex(page => page.id === currentPage.value?.id) || 0
    const totalPages = surveySchema.value?.steps.flatMap(step => step.pages || []).length || 0
    return `Page ${currentPageIndex + 1}/${totalPages}`
  }
  return null
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
      <!-- Page indicator if using page-based navigation -->
      <div
        v-if="pageIndicator"
        class="fr-badge fr-badge--sm fr-badge--info fr-mb-3w"
      >
        {{ pageIndicator }}
      </div>

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
          <hgroup
            :id="`question-${question.id}`"
            class="fr-mb-3w"
          >
            <component
              :is="surveyH2"
              class="fr-h5 fr-mb-1w"
              :aria-describedby="question?.description ? `question-description-${question.id}` : undefined"
            >
              {{ question.title }}
            </component>
            <p
              v-if="question?.description"
              :id="`question-description-${question.id}`"
              class="fr-hint-text fr-text--sm fr-mb-0"
            >
              {{ question.description }}
            </p>
          </hgroup>
          <DsfrButton
            v-if="question?.notion"
            :label="question.notion.buttonLabel"
            icon="ri:information-line"
            secondary
            icon-right
            class="fr-mb-2w"
            @click="() => {
              router.visit(`/simulateurs/${simulateur.slug}/notions/${question.notion.id}`, { preserveState: true, preserveScroll: true })
            }"
          />
          <component
            :is="getQuestionComponent(question.type)"
            :key="question.id"
            :model-value="surveysStore.getAnswer(simulateur.slug, question.id)"
            @update:model-value="(val: any) => surveysStore.setAnswer(simulateur.slug, question.id, val)"
            :question="question"
            :autocomplete-config="getAutocompleteConfig(question)"
            :autocomplete-fn="getAutocompleteFn(question)"
          />
        </div>
      </template>

      <!-- For legacy question-by-question navigation -->
      <template v-else-if="currentQuestion">
        <hgroup
          :id="`question-${currentQuestion.id}`"
          class="fr-mb-3w"
        >
          <component
            :is="surveyH2"
            class="fr-h5 fr-mb-1w"
            :aria-describedby="currentQuestion?.description ? `question-description-${currentQuestion.id}` : undefined"
          >
            {{ currentQuestion?.title || '' }}
          </component>
          <p
            v-if="currentQuestion?.description"
            :id="`question-description-${currentQuestion.id}`"
            class="fr-hint-text fr-text--sm fr-mb-0"
          >
            {{ currentQuestion?.description }}
          </p>
        </hgroup>
        <DsfrButton
          v-if="currentQuestion?.notion"
          :label="currentQuestion.notion?.buttonLabel"
          icon="ri:information-line"
          secondary
          icon-right
          class="fr-mb-2w"
          @click="() => {
            if (currentQuestion?.notion) {
              router.visit(`/simulateurs/${simulateur.slug}/notions/${currentQuestion.notion.id}`, { preserveState: true, preserveScroll: true })
            }
          }"
        />
        <component
          v-if="currentQuestion"
          :is="getQuestionComponent(currentQuestion.type)"
          :key="currentQuestion.id"
          :model-value="surveysStore.getAnswer(simulateur.slug, currentQuestion.id)"
          @update:model-value="(val: any) => surveysStore.setAnswer(simulateur.slug, currentQuestion.id, val)"
          :question="currentQuestion"
          :autocomplete-config="getAutocompleteConfig(currentQuestion)"
          :autocomplete-fn="getAutocompleteFn(currentQuestion)"
        />
      </template>
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
        (_isLastPage && false) ? null : {
          label: 'Suivant',
          iconRight: true,
          icon: { name: 'ri:arrow-right-line', ssr: true },
          disabled: !areAllQuestionsInPageValid,
          onClick: handleNext,
        },
        areAllRequiredQuestionsAnswered && (_isLastPage ? {
          label: 'Terminer',
          iconRight: true,
          icon: { name: 'ri:arrow-right-line', ssr: true },
          onClick: handleComplete,
        } : null),
      ].filter(Boolean) as DsfrButtonProps[])"
    />
  </div>
</template>

<style scoped lang="scss">
:deep(.fr-fieldset) {
  margin-bottom: 0;

  .fr-fieldset__element:last-child {
    margin-bottom: 0;
  }
}
</style>
