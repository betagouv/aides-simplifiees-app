<script setup lang="ts">
import type { RawPublicodes } from 'publicodes'
import { DsfrStepper } from '@gouvminint/vue-dsfr'
import { computed, onMounted } from 'vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyQuestion from '~/components/survey/SurveyQuestion.vue'
import { usePublicodesForm } from '~/composables/use_publicodes_form'
import { useSurveysStore } from '~/stores/surveys'

const props = defineProps<{
  simulateurSlug: string
  rules: RawPublicodes<string>
  title?: string
}>()

// Form state
const {
  currentPage,
  pagination,
  handleInputChange,
  goToNextPage,
  goToPreviousPage,
  result,
} = usePublicodesForm({
  rules: props.rules,
})
// onMounted, set field values if store has any
const surveysStore = useSurveysStore()
onMounted(() => {
  if (surveysStore.hasAnswers(props.simulateurSlug)) {
    const answers = surveysStore.getAnswers(props.simulateurSlug)
    currentPage.value.forEach((field) => {
      if (answers[field.id] !== undefined) {
        handleInputChange(field.id, answers[field.id])
      }
    })
  }
})

const page = computed(() =>
  currentPage.value.map((field) => {
    return [field, mapToSurveyQuestion(field)] as const
  }),
)

// Map publicodes field to survey question
function mapToSurveyQuestion(field: any): SurveyQuestionData {
  let choices: SurveyChoice[] | undefined
  let type
  if (field.element === 'checkbox') {
    type = 'checkbox'
  }
  else if (field.element === 'input' && field.type === 'number') {
    type = 'number'
  }
  else if (field.element === 'input' && field.type === 'date') {
    type = 'date'
  }
  else if (
    field.element === 'RadioGroup'
    && field.options.every(({ label }) => label === 'Oui' || label === 'Non')
  ) {
    type = 'boolean'
  }
  else if (field.element === 'RadioGroup') {
    type = 'radio'
    choices = field.options.map(({ label, value, description }) => ({
      id: value,
      title: label,
      tooltip: description,
    }))
  }
  else {
    console.log('Unknown field type:', field)
    type = 'combobox'
  }

  return {
    id: field.id,
    title: field.label,
    description: field.description,
    type,
    choices,
    placeholder: field.placeholder,
    min: field.min,
    max: field.max,
    step: field.step,
  }
}

// Step titles
const stepTitles = computed(() => {
  if (!pagination.value)
    return []
  return Array.from(
    { length: pagination.value.pageCount },
    (_, i) => `Étape ${i + 1}`,
  )
})

// Navigation buttons
const navButtons = computed(() => {
  const buttons = []

  if (pagination.value?.hasPreviousPage) {
    buttons.push({
      label: 'Précédent',
      secondary: true,
      icon: 'ri:arrow-left-line',
      onClick: goToPreviousPage,
    })
  }

  if (pagination.value?.hasNextPage) {
    buttons.push({
      label: 'Suivant',
      icon: 'ri:arrow-right-line',
      iconRight: true,
      onClick: goToNextPage,
    })
  }

  return buttons
})
</script>

<template>
  <DsfrStepper
    v-if="pagination"
    :steps="stepTitles"
    :current-step="pagination.current"
    class="fr-mb-4w"
  />

  <!-- Questions -->
  <div
    data-testid="survey-page"
    class="fr-card fr-p-4w"
  >
    <div
      v-for="[field, question] in page"
      :key="field.id"
    >
      <div v-if="!field.hidden">
        <SurveyQuestion
          :store="surveysStore"
          :question="question"
          :simulateur-slug="props.simulateurSlug"
          :default-value="field.value ?? field.checked ?? field.defaultValue ?? field.defaultChecked"
          :required="field.required"
          @update:model-value="handleInputChange(field.id, $event)"
        />
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <SurveyNavigation
    :buttons="navButtons"
    class="fr-mt-4w"
  />

  <div
    v-if="result"
    class="fr-card fr-p-4w"
  >
    <h3 class="fr-h5">
      Résultat
    </h3>
    <div v-html="result" />
  </div>
</template>

<style scoped>
.text-center {
  text-align: center;
}
</style>
