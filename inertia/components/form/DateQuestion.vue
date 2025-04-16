<script lang="ts" setup>
defineProps<{
  question: SurveyQuestion
}>()

const model = defineModel<string | undefined>()
</script>

<template>
  <DsfrInputGroup
    v-model="model"
    type="date"
    :name="question.id"
    :label="question.title"
    :label-visible="false"
    :hint="question.description"
  />
</template>
