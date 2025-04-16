<script lang="ts" setup>
import type { DsfrCheckboxSetProps } from '@gouvminint/vue-dsfr'

const props = defineProps<{
  question: SurveyQuestion
}>()
const model = defineModel<string[]>()
const _model = ref<string[]>(model.value && model.value.length > 0 ? model.value : [])
watch(_model, (newValue) => {
  if (newValue.length === 0) {
    model.value = undefined
  }
  else {
    model.value = newValue
  }
})

// Convert question choices to DsfrCheckboxSet options format
const options: DsfrCheckboxSetProps['options'] = props.question.choices
  ?.map(choice => ({
    name: `${props.question.id}-${choice.id}`,
    value: choice.id,
    label: choice.title,
  }))
  ?? []
</script>

<template>
  <DsfrCheckboxSet
    v-model="_model"
    :title-id="`question-${question.id}`"
    class="custom-rich-checkbox"
    :name="question.id"
    :options="options"
  />
</template>

<style scoped lang="scss">
// Custom styling for DsfrCheckboxSet, based on dsfr rich radio button
.custom-rich-checkbox:deep(.fr-checkbox-group) {
  label {
    --idle: transparent;
    --hover: var(--background-default-grey-hover);
    --active: var(--background-default-grey-active);

    margin-left: 0;
    padding: .75rem 1rem .75rem 2.75rem;
    background-color: var(--background-default-grey);
    background-image: linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey)), linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey)), linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey)), linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey));
    background-position: 0 0, 100% 0, 0 100%, 0 0, 1rem 50%, 1rem 50%;
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat;
    background-size: 100% 1px, 1px 100%, 100% 1px, 1px 100%, 1rem 1rem, 1rem 1rem;

    &:hover {
      background-color: var(--hover);
    }

    &:active {
      background-color: var(--active);
    }

    &::before {
      top: 50%;
      transform: translate(2.75rem, -50%);
    }
  }

  & input:checked+label {
    background-image: linear-gradient(0deg, var(--border-active-blue-france), var(--border-active-blue-france)), linear-gradient(0deg, var(--border-active-blue-france), var(--border-active-blue-france)), linear-gradient(0deg, var(--border-active-blue-france), var(--border-active-blue-france)), linear-gradient(0deg, var(--border-active-blue-france), var(--border-active-blue-france));
  }
}
</style>
