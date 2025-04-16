<script lang="ts" setup>
import { ref, computed, toRef, nextTick, customRef, onMounted } from 'vue'
import { useSurveysStore } from '~/stores/survey'
import { useIframeDisplay } from '~/composables/useIframeDisplay'
import { onKeyDown } from '@vueuse/core'
import type { DsfrButtonProps } from '@gouvminint/vue-dsfr'

// Importation des composants de question
import BooleanQuestion from '~/components/form/BooleanQuestion.vue'
import ComboboxQuestion from '~/components/form/ComboboxQuestion.vue'
import DateQuestion from '~/components/form/DateQuestion.vue'
import MultiSelectQuestion from '~/components/form/MultiSelectQuestion.vue'
import NumberQuestion from '~/components/form/NumberQuestion.vue'
import RadioButtonQuestion from '~/components/form/RadioButtonQuestion.vue'

// Fonctions d'autocompletion (à importer ou définir selon votre projet)
const autocompleteFunctions: Record<string, Function> = {
  getInseeNumber: async (query: string) => {
    // Implémentation à adapter selon votre API
    if (!query || query.length < 2) return []

    try {
      const response = await fetch(`/api/autocomplete/communes?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Erreur lors de la recherche')

      const data = await response.json()
      return data.map((item: any) => ({
        value: item.code,
        label: `${item.nom} (${item.code})`,
      }))
    } catch (error) {
      console.error('Erreur d\'autocomplétion:', error)
      return []
    }
  }
}

// Configurations d'autocomplétion
const autocompleteConfigs: Record<string, any> = {
  getInseeNumber: {
    placeholder: 'Ex: Paris ou 75001',
    noResultsText: 'Aucune commune trouvée',
    loadingText: 'Recherche en cours...',
    minChars: 2,
  }
}

const props = defineProps<{
  simulateurId: string
}>()

const simulateurId = toRef(() => props.simulateurId)

const surveysStore = useSurveysStore()

// Get simulateur-specific state
const currentQuestion = computed(() => surveysStore.getCurrentQuestion(simulateurId.value))
const surveySchema = computed(() => surveysStore.getSchema(simulateurId.value))
const isLastQuestion = computed(() => surveysStore.isLastQuestion(simulateurId.value))
const areAllRequiredQuestionsAnswered = computed(() => surveysStore.areAllRequiredQuestionsAnswered(simulateurId.value))
const currentStepIndex = computed(() => surveysStore.getCurrentStepIndex(simulateurId.value))

// Fonction pour vérifier si une réponse est valide
function isAnswerValid(question: any, answer: any): boolean {
  if (answer === undefined || answer === null) return false

  switch (question.type) {
    case 'radio':
    case 'boolean':
      return answer !== undefined && answer !== null
    case 'checkbox':
      return Array.isArray(answer) && answer.length > 0
    case 'number':
      return !isNaN(Number(answer))
    case 'date':
      return Boolean(answer)
    case 'combobox':
      return Boolean(answer)
    default:
      return Boolean(answer)
  }
}

// Check if the current question has been answered
const hasValidAnswer = computed(() => {
  if (!currentQuestion.value) {
    return false
  }
  return isAnswerValid(currentQuestion.value, surveysStore.getAnswer(simulateurId.value, currentQuestion.value.id))
})

const stepTitles = computed(() => {
  return surveySchema.value?.steps
    .map((step) => {
      return step.title
    })
    .filter(Boolean) || []
})

// Get autocomplete function for current question
const autocompleteFn = computed(() => {
  if (currentQuestion.value?.autocompleteFunction) {
    return autocompleteFunctions[currentQuestion.value.autocompleteFunction]
  }
  return undefined
})

// Get autocomplete configuration for current question
const autocompleteConfig = computed(() => {
  if (currentQuestion.value?.autocompleteFunction) {
    // Merge default config with any custom config from question
    return {
      ...autocompleteConfigs[currentQuestion.value.autocompleteFunction],
      ...currentQuestion.value.autocompleteConfig || {},
    }
  }
  return undefined
})

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

    // Announce to screen readers that a new question is displayed
    if (questionChangeAnnouncer.value && currentQuestion.value) {
      questionChangeAnnouncer.value.textContent = `Question : ${currentQuestion.value.title}`
    }
  })
}
onMounted(() => {
  focusRenderedQuestion()
})

onKeyDown('Enter', (event: KeyboardEvent) => {
  if (hasValidAnswer.value && !isLastQuestion.value) {
    // Only trigger if the source is not a button or textarea or [type="search"] input or select
    if (
      !(event.target instanceof HTMLButtonElement)
      && !(event.target instanceof HTMLTextAreaElement)
      && !(event.target instanceof HTMLInputElement && event.target.type === 'search')
      && !(event.target instanceof HTMLSelectElement)
    ) {
      event.preventDefault()
      handleNext()
    }
  }
}, { target: questionContainer })

// Navigate to next question or submit form
function handleNext() {
  const wentToNext = surveysStore.goToNextQuestion(simulateurId.value)
  if (wentToNext) {
    focusRenderedQuestion()
  }
}

// Navigate to previous question
function handlePrevious() {
  const wentToPrev = surveysStore.goToPreviousQuestion(simulateurId.value)
  if (wentToPrev) {
    focusRenderedQuestion()
  }
  else {
    surveysStore.setShowWelcomeScreen(simulateurId.value, true)
  }
}

const questionModel = customRef((track, trigger) => {
  return {
    get() {
      track()
      if (!currentQuestion.value) {
        return undefined
      }
      return surveysStore.getAnswer(simulateurId.value, currentQuestion.value?.id)
    },
    set(value) {
      if (!currentQuestion.value) {
        return
      }
      surveysStore.setAnswer(simulateurId.value, currentQuestion.value?.id, value)
      trigger()
    }
  }
})

const questionComponent = computed(() => {
  if (!currentQuestion.value) {
    return undefined
  }
  return {
    radio: RadioButtonQuestion,
    boolean: BooleanQuestion,
    checkbox: MultiSelectQuestion,
    number: NumberQuestion,
    date: DateQuestion,
    combobox: ComboboxQuestion,
  }[currentQuestion.value.type] || ComboboxQuestion
})

function handleComplete() {
  surveysStore.tryComplete(simulateurId.value)
}

// Navigation adaptée pour Inertia
function navigateToPage(path: string) {
  window.location.href = path
}
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
      v-if="surveySchema && currentQuestion"
      ref="questionContainer"
      data-testid="question-container"
      tabindex="-1"
      class="fr-card fr-p-4w fr-mb-3w"
    >
      <hgroup
        :id="`question-${currentQuestion.id}`"
        class="fr-mb-3w"
      >
        <component
          :is="surveyH2"
          class="fr-h5 fr-mb-1w"
          :aria-describedby="currentQuestion?.description ? `question-description-${currentQuestion.id}` : undefined"
        >
          {{ currentQuestion?.title }}
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
        :label="currentQuestion?.notion.buttonLabel"
        icon="ri:information-line"
        secondary
        icon-right
        class="fr-mb-2w"
        @click="() => {
          navigateToPage(`/simulateurs/${simulateurId}/${currentQuestion?.notion.id}#simulateur-title`)
        }"
      />
      <component
        :is="questionComponent"
        :key="currentQuestion.id"
        v-model="questionModel"
        :question="currentQuestion"
        :autocomplete-config="autocompleteConfig"
        :autocomplete-fn="autocompleteFn"
      />
    </div>
    <DsfrButtonGroup
      size="lg"
      inline-layout-when="md"
      align="right"
      :buttons="([
        {
          label: 'Récapitulatif',
          secondary: true,
          icon: { name: 'ri:menu-line', ssr: true },
          onClick: () => navigateToPage(`/simulateurs/${simulateurId}/recapitulatif#simulateur-title`),
        },
        {
          label: 'Précédent',
          secondary: true,
          icon: { name: 'ri:arrow-left-line', ssr: true },
          onClick: handlePrevious,
        },
        !isLastQuestion && {
          label: 'Suivant',
          iconRight: true,
          icon: { name: 'ri:arrow-right-line', ssr: true },
          disabled: !hasValidAnswer,
          onClick: handleNext,
        },
        areAllRequiredQuestionsAnswered && {
          label: 'Terminer',
          iconRight: true,
          icon: { name: 'ri:arrow-right-line', ssr: true },
          onClick: handleComplete,
        },
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

:deep(.fr-btns-group li) {
  flex: 1;
  .fr-btn {
    width: 100%;
  }
}
</style>
