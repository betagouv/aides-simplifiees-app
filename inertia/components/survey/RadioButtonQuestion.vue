<script lang="ts" setup>
import { DsfrRadioButtonSet } from '@gouvminint/vue-dsfr'
import { onMounted, useTemplateRef } from 'vue'

const props = defineProps<{
  question: SurveyQuestion
}>()

const model = defineModel<string | undefined>()

const options = props.question.choices
  ?.map(choice => ({
    id: `${props.question.id}-${choice.id}`,
    label: choice.title,
    value: choice.id,
    svgPath: true as unknown as string, // Trick to render a rich radio button
  })) || []

const radioButtonSet = useTemplateRef('radioButtonSet')
const tooltips = useTemplateRef('tooltips')
onMounted(() => {
  moveTooltips()
})
function moveTooltips() {
  tooltips.value
    ?.forEach((tooltipContainer) => {
      if (!tooltipContainer) {
        return
      }
      const id = tooltipContainer.id.replace('tooltip-', '')
      const checkboxLabel = radioButtonSet.value?.$el.querySelector(`label[for="${id}"]`)
      // move the tooltip after the checkbox label
      if (checkboxLabel) {
        checkboxLabel.parentNode?.parentNode?.appendChild(tooltipContainer)
      }
    })
}
</script>

<template>
  <DsfrRadioButtonSet
    ref="radioButtonSet"
    v-model="model"
    :title-id="`question-${question.id}`"
    class="custom-rich-radio-button"
    :options="options"
    :name="question.id"
  />
  <div
    v-for="choice in (question.choices?.filter(choice => Boolean(choice.tooltip)) as (SurveyChoice)[])"
    :id="`tooltip-${question.id}-${choice.id}`"
    :key="`tooltip-${question.id}-${choice.id}`"
    ref="tooltips"
  >
    <DsfrTooltip
      :content="(choice.tooltip as string)"
    />
  </div>
</template>

<style scoped lang="scss">
.custom-rich-radio-button:deep(.fr-fieldset__element) {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.custom-rich-radio-button:deep(.fr-radio-group) {
  flex: 1;
}

.custom-rich-radio-button:deep(.fr-radio-rich__pictogram) {
  display: none;
}
</style>
