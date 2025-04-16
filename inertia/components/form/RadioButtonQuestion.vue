<script lang="ts" setup>
const props = defineProps<{
  question: SurveyQuestion
}>()

const model = defineModel<string | undefined>()

const options = props.question.choices
  ?.map(choice => ({
    label: choice.title,
    value: choice.id,
    svgPath: true as unknown as string, // Trick to render a rich radio button
  })) || []
</script>

<template>
  <DsfrRadioButtonSet
    v-model="model"
    :title-id="`question-${question.id}`"
    class="custom-rich-radio-button"
    :options="options"
    :name="question.id"
  />
</template>

<style scoped lang="scss">
.custom-rich-radio-button:deep(.fr-radio-rich__pictogram) {
  display: none;
}
</style>
