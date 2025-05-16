<script lang="ts" setup>
import { customRef } from 'vue'
import RadioButtonQuestion from '~/components/survey/RadioButtonQuestion.vue'

const props = defineProps<{
  question: SurveyQuestion
}>()

const question = {
  ...props.question,
  choices: [
    { title: 'Oui', id: 'true#' + props.question?.id },
    { title: 'Non', id: 'false#' + props.question?.id },
  ],
}

/**
 * We expose a boolean model up to the parent component
 */
const booleanModel = defineModel<boolean | undefined>()

/**
 * We pass a string model down to the DSFR input component
 */
const stringModel = customRef((track, trigger) => {
  return {
    get() {
      return booleanModel.value === true ? 'true#' + props.question?.id : booleanModel.value === false ? 'false#' + props.question?.id : undefined
    },
    set(value: string | undefined) {
      track()
      if (value === 'true#' + props.question?.id) {
        booleanModel.value = true
      }
      else if (value === 'false#' + props.question?.id) {
        booleanModel.value = false
      }
      else {
        booleanModel.value = undefined
      }
      trigger()
    },
  }
})
</script>

<template>
  <RadioButtonQuestion
    v-model="stringModel"
    :question="question"
  />
</template>
