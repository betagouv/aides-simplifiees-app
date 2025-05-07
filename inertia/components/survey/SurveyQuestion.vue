<script lang="ts" setup>
import { DsfrButton } from '@gouvminint/vue-dsfr'
import { router } from '@inertiajs/vue3'
import { computed } from 'vue'
import BooleanQuestion from '~/components/survey/BooleanQuestion.vue'
import ComboboxQuestion from '~/components/survey/ComboboxQuestion.vue'
import DateQuestion from '~/components/survey/DateQuestion.vue'
import MultiSelectQuestion from '~/components/survey/MultiSelectQuestion.vue'
import NumberQuestion from '~/components/survey/NumberQuestion.vue'
import RadioButtonQuestion from '~/components/survey/RadioButtonQuestion.vue'
import UnkownQuestionType from '~/components/survey/UnkownQuestionType.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useSurveysStore } from '~/stores/surveys'
import { autocompleteConfigs, autocompleteFunctions } from '~/utils/autocomplete_functions'

defineProps<{
  question: SurveyQuestion
  simulateurSlug: string
}>()

const surveysStore = useSurveysStore()

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
  }[type] || UnkownQuestionType
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
</script>

<template>
  <div>
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
        router.visit(`/simulateurs/${simulateurSlug}/notions/${question.notion.id}`, { preserveState: true, preserveScroll: true })
      }"
    />
    <component
      :is="getQuestionComponent(question.type)"
      :key="question.id"
      :model-value="surveysStore.getAnswer(simulateurSlug, question.id)"
      :question="question"
      :autocomplete-config="getAutocompleteConfig(question)"
      :autocomplete-fn="getAutocompleteFn(question)"
      @update:model-value="(val: any) => surveysStore.setAnswer(simulateurSlug, question.id, val)"
    />
  </div>
</template>
