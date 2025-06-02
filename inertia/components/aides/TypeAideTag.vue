<script lang="ts" setup>
import { DsfrTag } from '@gouvminint/vue-dsfr'

defineProps<{
  label: string
  iconName: string
}>()
</script>

<template>
  <DsfrTag
    class="brand-type-aide-tag"
    :icon="{ name: iconName, ssr: true }"
    :label="label"
  />
</template>

<style scoped lang="scss">
.brand-type-aide-tag {
  background-color: var(--background-contrast-info);
  color: var(--text-default-info);
}
</style>
