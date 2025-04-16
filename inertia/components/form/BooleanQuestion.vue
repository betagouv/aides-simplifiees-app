<script lang="ts" setup>
const props = defineProps<{
  question: SurveyQuestion
}>()

const question = {
  ...props.question,
  choices: [
    { title: 'Oui', id: 'true' },
    { title: 'Non', id: 'false' },
  ]
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
    get () {
      return booleanModel.value === true ? 'true' : booleanModel.value === false ? 'false' : undefined
    },
    set (value: string | undefined) {
      track()
      if (value === 'true') {
        booleanModel.value = true
      }
      else if (value === 'false') {
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
