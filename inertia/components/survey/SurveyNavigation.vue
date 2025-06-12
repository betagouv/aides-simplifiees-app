<script lang="ts" setup>
import type { DsfrButtonProps } from '@gouvminint/vue-dsfr'
import { DsfrButton } from '@gouvminint/vue-dsfr'

defineProps<{
  buttons: Array<DsfrButtonProps & { 'data-testid'?: string }> // Allow data-testid for testing purposes
}>()
</script>

<template>
  <ul
    class="survey-btns fr-btns-group fr-btns-group--lg fr-mt-4w"
    :class="{
      [`survey-btns--length-${buttons.length}`]: true,
    }"
  >
    <li
      v-for="(button, index) in buttons"
      :key="index"
      class="survey-btn"
    >
      <DsfrButton
        v-bind="button"
        size="lg"
      />
    </li>
  </ul>
</template>

<style scoped lang="scss">
.survey-btns {
  justify-content: flex-end;
  .survey-btn {
    flex: 1;
  }

  &--length-1 {
    .survey-btn {
      @include dsfr.md {
        max-width: 50%;
      }
    }
  }
}
</style>
