<script lang="ts" setup>
import { DsfrButton, DsfrTooltip } from '@gouvminint/vue-dsfr'
import { router } from '@inertiajs/vue3'
import { computed, customRef, onMounted } from 'vue'
import BooleanQuestion from '~/components/survey/BooleanQuestion.vue'
import ComboboxQuestion from '~/components/survey/ComboboxQuestion.vue'
import DateQuestion from '~/components/survey/DateQuestion.vue'
import MultiSelectQuestion from '~/components/survey/MultiSelectQuestion.vue'
import NumberQuestion from '~/components/survey/NumberQuestion.vue'
import RadioButtonQuestion from '~/components/survey/RadioButtonQuestion.vue'
import UnkownQuestionType from '~/components/survey/UnkownQuestionType.vue'
import {
  autocompleteConfigs,
  autocompleteFunctions,
} from '~/utils/autocomplete_functions'

const props = withDefaults(
  defineProps<{
    store?: {
      getAnswer: (simulateurSlug: string, questionId: string) => any
      setAnswer: (simulateurSlug: string, questionId: string, value: any) => void
    }
    question: SurveyQuestionData
    simulateurSlug: string
    defaultValue?: any
    size?: 'sm' | 'md'
    required?: boolean
  }>(),
  {
    size: 'md',
    required: false,
  },
)

const emit = defineEmits<{
  (e: 'update:model-value', value: any): void
}>()

/**
 * Create a reactive model for each question
 */
const model = customRef((track, trigger) => {
  return {
    get() {
      track()
      const storeAnswer = props.store?.getAnswer(
        props.simulateurSlug,
        props.question.id,
      )
      if (storeAnswer !== undefined) {
        return storeAnswer
      }
      if (props.defaultValue !== undefined) {
        return props.defaultValue
      }
      return undefined
    },
    set(value) {
      props.store?.setAnswer(
        props.simulateurSlug,
        props.question.id,
        value,
      )
      emit('update:model-value', value)
      trigger()
    },
  }
})

// Get the question component based on question type
const questionComponent = computed(() => {
  const type = props.question.type
  return (
    {
      radio: RadioButtonQuestion,
      boolean: BooleanQuestion,
      checkbox: MultiSelectQuestion,
      number: NumberQuestion,
      date: DateQuestion,
      combobox: ComboboxQuestion,
      text: ComboboxQuestion,
    }[type] || UnkownQuestionType
  )
})

// Get eventual autocomplete function for a text question
const autocompleteFn = computed(() => {
  if (props.question?.autocompleteFunction) {
    return autocompleteFunctions[props.question.autocompleteFunction]
  }
  return undefined
})

// Get eventual autocomplete configuration for text question
const autocompleteConfig = computed(() => {
  if (props.question?.autocompleteFunction) {
    // Merge default config with any custom config from question
    return {
      ...autocompleteConfigs[props.question.autocompleteFunction],
      ...(props.question.autocompleteConfig || {}),
    }
  }
  return undefined
})
onMounted(() => {
  document.querySelectorAll('.brand-survey-question-tooltip').forEach((el) => {
    // Ensure the tooltip is initialized with the correct content
    const tooltip = el as HTMLElement
    if (tooltip.hasAttribute('label')) {
      tooltip.textContent = tooltip.getAttribute('label') || ''
    }
  })
})
</script>

<template>
  <div
    class="brand-survey-question"
    data-testid="survey-question"
    :data-question-id="question.id"
  >
    <hgroup
      :id="`question-${question.id}`"
      :class="[
        {
          'fr-mb-3w': size === 'md',
          'fr-mb-1w': size === 'sm',
        },
      ]"
    >
      <h3
        :class="[
          {
            'fr-h5 fr-mb-1w': size === 'md',
            'fr-text--md fr-mb-1v': size === 'sm',
          },
        ]"
        :aria-describedby="question?.description
          ? `question-description-${question.id}`
          : undefined
        "
      >
        {{ question.title }} <span
          v-if="question.required !== false || required"
          class="brand-required-question-marker"
        >*</span>
      </h3>
      <p
        v-if="question?.description"
        :id="`question-description-${question.id}`"
        class="fr-hint-text fr-mb-0"
        :class="[
          {
            'fr-text--sm': size === 'md',
            'fr-text--xs': size === 'sm',
          },
        ]"
      >
        {{ question.description }}
      </p>
    </hgroup>
    <DsfrButton
      v-if="question?.notion"
      :label="question.notion.buttonLabel ?? 'En savoir plus'"
      data-testid="survey-question-notion-button"
      icon="ri:information-line"
      secondary
      icon-right
      class="fr-mb-2w"
      @click="
        () => {
          router.visit(
            `/simulateurs/${simulateurSlug}/notions/${question.notion!.id}`,
            { preserveState: true, preserveScroll: true },
          );
        }
      "
    />

    <div
      v-else-if="question?.tooltip"
      class="brand-survey-question-tooltip-container"
    >
      <DsfrTooltip
        class="brand-survey-question-tooltip fr-btn--secondary"
        data-testid="survey-question-tooltip"
        :content="typeof question.tooltip === 'string' ? question.tooltip : question.tooltip.content"
        :label="(question.tooltip as any)?.buttonLabel ?? 'En savoir plus'"
        :secondary="true"
      />
    </div>
    <component
      :is="questionComponent"
      :key="question.id"
      v-model="model"
      :question="question"
      :autocomplete-config="autocompleteConfig"
      :autocomplete-fn="autocompleteFn"
    />
  </div>
</template>

<style scoped lang="scss">
.brand-survey-question-header:deep(.fr-hint-text) {
  /* Ensure the hint text wraps properly and takes \n (new lines) into account */
  white-space: pre-wrap;
}

.brand-survey-question-tooltip-container:deep(.fr-btn--tooltip) {
  margin-bottom: 1rem;
  max-width: none !important;
  max-height: none !important;
}

.brand-required-question-marker {
  color: var(--artwork-minor-red-marianne);
  font-weight: bold;
  margin-left: 0.25rem;
}
</style>
