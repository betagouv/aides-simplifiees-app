<script lang="ts" setup>
import { DsfrInputGroup } from '@gouvminint/vue-dsfr'
import { customRef } from 'vue'

const props = defineProps<{
  question: SurveyQuestion
}>()

/**
 * We expose a number model up to the parent component
 */
const numberModel = defineModel<number | undefined | null>()

/**
 * If the question has a default value and the model is undefined,
 * we set the model to the default value
 */
if (
  props.question.default !== undefined
  && (
    numberModel.value === undefined
    || numberModel.value === null
  )
) {
  numberModel.value = Number(props.question.default)
}

/**
 * Prevent non-numeric characters from being entered
 */
function onKeypress(e: KeyboardEvent) {
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  if (!chars.includes(e.key)) {
    e.preventDefault()
  }
}

/**
 * We pass a string model down to the DSFR input component
 */
const stringModel = customRef((track, trigger) => {
  return {
    get() {
      return numberModel.value === undefined ? undefined : String(numberModel.value)
    },
    set(value: string | undefined) {
      track()
      if (value === undefined || value === '') {
        numberModel.value = undefined
      }
      else {
        // Ensure the value is a valid number
        const num = Number(value)
        if (!Number.isNaN(num)) {
          numberModel.value = num
        }
      }
      trigger()
    },
  }
})
</script>

<template>
  <DsfrInputGroup
    v-model="stringModel"
    class="fr-mb-4w"
    type="number"
    :min="question.min"
    :max="question.max"
    :step="question.step"
    :name="question.id"
    :placeholder="question.placeholder"
    :label="question.title"
    :label-visible="false"
    @keypress="onKeypress"
  />
</template>
