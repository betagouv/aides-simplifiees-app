<script lang="ts" setup>
import { DsfrButton, DsfrTooltip } from '@gouvminint/vue-dsfr'
import { router } from '@inertiajs/vue3'
import { computed, customRef } from 'vue'
import BooleanQuestion from '~/components/survey/BooleanQuestion.vue'
import ComboboxQuestion from '~/components/survey/ComboboxQuestion.vue'
import DateQuestion from '~/components/survey/DateQuestion.vue'
import MultiSelectQuestion from '~/components/survey/MultiSelectQuestion.vue'
import NumberQuestion from '~/components/survey/NumberQuestion.vue'
import RadioButtonQuestion from '~/components/survey/RadioButtonQuestion.vue'
import UnkownQuestionType from '~/components/survey/UnkownQuestionType.vue'
import { useSurveysStore } from '~/stores/surveys'
import { autocompleteConfigs, autocompleteFunctions } from '~/utils/autocomplete_functions'

const props = withDefaults(defineProps<{
  question: SurveyQuestion
  simulateurSlug: string
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const surveysStore = useSurveysStore()

/**
 * Create a reactive model for each question
 */
const questionModel = customRef((track, trigger) => {
  return {
    get() {
      track()
      return surveysStore.getAnswer(props.simulateurSlug, props.question.id)
    },
    set(value) {
      surveysStore.setAnswer(props.simulateurSlug, props.question.id, value)
      trigger()
    },
  }
})

// Get the question component based on question type
const questionComponent = computed(() => {
  const type = props.question.type
  return {
    radio: RadioButtonQuestion,
    boolean: BooleanQuestion,
    checkbox: MultiSelectQuestion,
    number: NumberQuestion,
    date: DateQuestion,
    combobox: ComboboxQuestion,
    text: ComboboxQuestion,
  }[type] || UnkownQuestionType
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
      ...props.question.autocompleteConfig || {},
    }
  }
  return undefined
})
</script>

<template>
  <div
    class="brand-survey-question"
  >
    <hgroup
      :id="`question-${question.id}`"
      class="brand-survey-question-header"
      :class="[{
        'fr-mb-3w': size === 'md',
        'fr-mb-1w': size === 'sm',
      }]"
    >
      <h3
        :class="[{
          'fr-h5 fr-mb-1w': size === 'md',
          'fr-text--md fr-mb-1v': size === 'sm',
        }]"
        :aria-describedby="question?.description ? `question-description-${question.id}` : undefined"
      >
        {{ question.title }}
      </h3>
      <p
        v-if="question?.description"
        :id="`question-description-${question.id}`"
        class="fr-hint-text fr-mb-0"
        :class="[{
          'fr-text--sm': size === 'md',
          'fr-text--xs': size === 'sm',
        }]"
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
        router.visit(`/simulateurs/${simulateurSlug}/notions/${question.notion?.id}`, { preserveState: true, preserveScroll: true })
      }"
    />
    <DsfrTooltip
      v-else-if="question?.tooltip"
      class="brand-survey-question-tooltip"
      :content="(question.tooltip.content as string)"
      :label="question.tooltip.buttonLabel"
      :secondary="true"
    >
      <DsfrButton
        type="button"
        :label="question.tooltip.buttonLabel"
        :icon="{ name: 'ri:information-line', ssr: true }"
        secondary
        icon-right
      />
    </DsfrTooltip>
    <component
      :is="questionComponent"
      :key="question.id"
      v-model="questionModel"
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

.brand-survey-question:deep(.fr-btn--tooltip) {
  padding: 0 !important;
  margin-bottom: 1rem;
  &:before {
    display: none !important;
  }
  /* Ensure the tooltip text wraps properly and takes \n (new lines) into account */
  max-width: none !important;
  max-height: none !important;
}
</style>
